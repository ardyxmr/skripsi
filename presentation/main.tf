###############################################################################
# InfraProv - Example consolidated Terraform configuration (main.tf)
#
# The running portal splits this across provider.tf, variables.tf, main.tf and a
# per-VM terraform.tfvars, then renders one isolated workspace per VM. This file
# merges all of it so the whole provisioning contract reads on one slide.
#
# Target: Proxmox VE through the Telmate/proxmox provider (3.x).
# The platform runs on ONE resource type: proxmox_vm_qemu, a VM cloned from a
# golden cloud-init template. The engineering lives in HOW it is wired.
#
# Terraform challenges this file answers (each tagged inline below):
#   [1] Pinned release-candidate provider, frozen per workspace (upgrade safety).
#   [2] One VM per state file, so a failed clone never taints a whole batch.
#   [3] Variable-driven, so a resize re-renders tfvars only, never the code.
#   [4] Clone plus cloud-init identity, boot disk grown on first boot.
#   [5] Structured `disks` slots (order-stable) over the drift-prone disk list.
#   [6] Dynamic data-disk slots with a hard physical ceiling.
#   [7] Live hotplug of CPU, RAM and disk: resize with no reboot.
#   [8] lifecycle ignore_changes, so runtime drift never forces a re-plan.
#   [9] Serial console declared to survive the Telmate clone.
#  [10] Outputs that feed the portal inventory (vmid, IP).
###############################################################################


# === [1] Provider: pinned, release-candidate, frozen per workspace ===========
# The portal pins one provider version and copies the locked plugin into every
# VM workspace, so upgrading the provider never re-plans VMs built under the old
# one (ADR-18). 3.x is the first Telmate line with the structured `disks` block.
terraform {
  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "3.0.2-rc04"
    }
  }
}

# In production the endpoint and token arrive as environment variables
# (PM_API_URL, PM_API_TOKEN_ID, PM_API_TOKEN_SECRET). They appear as variables
# here so the file stands alone. Authentication uses a scoped API token, not a
# root password.
provider "proxmox" {
  pm_api_url          = var.proxmox_api_url
  pm_api_token_id     = var.proxmox_api_token_id
  pm_api_token_secret = var.proxmox_api_token_secret
  pm_tls_insecure     = true
}


# === [3] Variables: the only thing that differs per VM =======================
# main.tf and variables.tf stay byte-identical across every VM and every resize.
# The portal writes a fresh terraform.tfvars and re-applies. Each variable
# carries a sample default so this file plans on its own.

# --- Connection ---
variable "proxmox_api_url" {
  type    = string
  default = "https://192.168.100.10:8006/api2/json"
}
variable "proxmox_api_token_id" {
  type    = string
  default = "terraform@pve!infraprov"
}
variable "proxmox_api_token_secret" {
  type      = string
  default   = "00000000-0000-0000-0000-000000000000"
  sensitive = true
}

# --- Placement and identity ---
variable "vm_name" {
  type    = string
  default = "demo-vm-01" # provider VM name AND cloud-init hostname
}
variable "target_node" {
  type    = string
  default = "pve-jakarta"
}
variable "template" {
  type    = string
  default = "rocky10-cloud" # golden image cloned by the portal
}
variable "network" {
  type    = string
  default = "vmbr0"
}
variable "storage" {
  type    = string
  default = "vmdata"
}

# --- Sizing (tier driven) ---
variable "cores" {
  type    = number
  default = 16 # fixed MAX core topology; cannot change live
}
variable "sockets" {
  type    = number
  default = 1
}
variable "vcpus" {
  type    = number
  default = 2 # online vCPUs; a resize hotplugs within [1, sockets*cores]
}
variable "memory" {
  type    = number
  default = 2048 # MB
}
variable "disk_size_gb" {
  type    = number
  default = 40 # boot disk; cloud-init grows it on first boot
}

# --- Cloud-init credentials (per-VM, encrypted at rest in the portal) ---
variable "ci_user" {
  type    = string
  default = "sysuser"
}
variable "ci_password" {
  type      = string
  default   = "ChangeMe123!" # one-time; the template forces a reset on first login
  sensitive = true
}
# Newline-separated public keys injected by cloud-init (the Ansible automation key).
variable "ssh_public_keys" {
  type    = string
  default = ""
}

# --- [6] Gated data disks (empty on first provision) ---
# Added one at a time through the approval-gated ADD_DISK lifecycle action.
# Consumed positionally: data_disks[0] -> scsi1, [1] -> scsi2, and so on.
variable "data_disks" {
  type = list(object({
    slot    = string # scsi1, scsi2, ... (informational in this variant)
    size    = number # GB
    storage = string
  }))
  default = []
  # Example of a populated value the portal would render after two add-disk runs:
  # default = [
  #   { slot = "scsi1", size = 50,  storage = "vmdata" },
  #   { slot = "scsi2", size = 100, storage = "vmdata" },
  # ]
}


# === [4] The one resource: a VM cloned from a cloud-init template =============
resource "proxmox_vm_qemu" "vm" {
  name        = var.vm_name
  target_node = var.target_node
  clone       = var.template
  full_clone  = true
  agent       = 1
  os_type     = "cloud-init"
  scsihw      = "virtio-scsi-single"

  cores   = var.cores # max topology, set once
  sockets = var.sockets
  vcpus   = var.vcpus # online count; the resize lever
  memory  = var.memory

  # === [7] Live hotplug: resize CPU, RAM and disk without a reboot ===========
  # automatic_reboot=false keeps Terraform from rebooting a running VM to apply a
  # change. With hotplug on, numa required for memory hotplug, and ballooning off
  # (it conflicts with memory hotplug), an add-disk and a CPU/RAM increase apply
  # live. The guest onlines the new CPU/RAM; cloud images ship the udev rules.
  # Growing is live; shrinking RAM still needs a reboot.
  automatic_reboot = false
  hotplug          = "network,disk,cpu,memory,usb"
  numa             = true
  balloon          = 0

  # === [5] Structured disks: order-stable named slots ========================
  # The deprecated Telmate `disk` LIST is stored sorted by bus, so editing it
  # reorders entries and Terraform plans phantom disk changes. The structured
  # `disks` block addresses each slot by name (scsi0, scsi1, ...), so slots stay
  # put and no indexed ignore is needed.
  disks {
    scsi {
      # Boot disk. cloud-init grows it to var.disk_size_gb on first boot.
      scsi0 {
        disk {
          size    = "${var.disk_size_gb}G"
          storage = var.storage
        }
      }

      # === [6] Dynamic data-disk slots, hard physical ceiling ===============
      # Each slot appears only when the matching data_disks entry exists.
      # Terraform ATTACHES a raw block device; formatting and mounting stay a
      # manual admin step, so there are no provisioner blocks by design.
      dynamic "scsi1" {
        for_each = length(var.data_disks) >= 1 ? [var.data_disks[0]] : []
        content {
          disk {
            size    = "${scsi1.value.size}G"
            storage = scsi1.value.storage
            format  = "raw"
          }
        }
      }
      dynamic "scsi2" {
        for_each = length(var.data_disks) >= 2 ? [var.data_disks[1]] : []
        content {
          disk {
            size    = "${scsi2.value.size}G"
            storage = scsi2.value.storage
            format  = "raw"
          }
        }
      }
      # scsi3 ... scsi6 repeat the same pattern. The number of slots wired here
      # is the HARD ceiling and equals config('provisioning.max_data_disk_slots').
    }

    ide {
      ide2 {
        cloudinit {
          storage = var.storage
        }
      }
    }
  }

  # === [9] Serial console: survive the Telmate clone =========================
  # Cloud-image templates set vga=serial0. Telmate does not carry the template
  # serial device into the clone, so the clone points vga at a missing port and
  # both the noVNC console and `qm terminal` break. Declaring serial0 realigns
  # them.
  serial {
    id   = 0
    type = "socket"
  }

  network {
    id     = 0
    model  = "virtio"
    bridge = var.network
  }

  # --- [4] cloud-init identity and networking ---
  ciuser     = var.ci_user
  cipassword = var.ci_password
  sshkeys    = var.ssh_public_keys # automation key for key-based Ansible hardening
  ipconfig0  = "ip=dhcp"

  # === [8] Ignore runtime drift, never re-plan on it =========================
  # Discovery owns runtime state. The DHCP lease and any key rotation must not
  # trigger a re-plan, so Terraform ignores network and sshkeys after create.
  lifecycle {
    ignore_changes = [network, sshkeys]
  }
}


# === [10] Outputs: feed the portal inventory =================================
# The provisioning job reads these back to populate the Inventory row (VM id and
# the DHCP-assigned address).
output "vmid" {
  value = proxmox_vm_qemu.vm.vmid
}

output "default_ipv4" {
  value = proxmox_vm_qemu.vm.default_ipv4_address
}
