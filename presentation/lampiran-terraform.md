# Lampiran — Kode Sumber Terraform

Setiap permintaan mesin virtual menempati satu *workspace* Terraform tersendiri. Ke dalam *workspace* itu sistem menyalin dua berkas tetap dari master, yaitu `main.tf` dan `variables.tf` (varian *structured*, yang dipakai portal secara *default*), lalu menuliskan dua berkas yang berbeda tiap permintaan, yaitu `provider.tf` dan `terraform.tfvars`. Template tetap sama antar permintaan, dan yang berubah hanya nilai pada `terraform.tfvars`.

Kredensial Proxmox tidak pernah ditulis ke disk. `TerraformRunner` menyerahkannya ke Terraform sebagai variabel lingkungan (`PM_API_URL`, `PM_API_TOKEN_ID`, `PM_API_TOKEN_SECRET`). Karena itu `terraform.tfvars` tidak disertakan di sini, sebab isinya nilai per permintaan tanpa rahasia. Tempel tiap blok dengan Courier New 10, spasi 1.

---

## L.1 `provider.tf` (dibangkitkan per *workspace* dari data provider)

```hcl
terraform {
  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "3.0.2-rc04"
    }
  }
}

# Endpoint dan token berasal dari variabel lingkungan
# (PM_API_URL / PM_API_TOKEN_ID / PM_API_TOKEN_SECRET).
provider "proxmox" {
  pm_tls_insecure = true
}
```

---

## L.2 `variables.tf`

```hcl
variable "vm_name" { type = string }
variable "target_node" { type = string }
variable "template" { type = string }
variable "network" { type = string }
variable "storage" { type = string }
variable "cores" { type = number }
variable "memory" { type = number }        # MB
variable "disk_size_gb" { type = number }

variable "bios" {
  type    = string
  default = "seabios"
}

# Disk data RAW tambahan yang dipasang lewat alur ADD_DISK; kosong saat provisioning pertama.
variable "data_disks" {
  type = list(object({
    slot    = string
    size    = number
    storage = string
  }))
  default = []
}

variable "sockets" {
  type    = number
  default = 1
}

variable "vcpus" {
  type    = number
  default = 1
}

variable "ci_user" {
  type    = string
  default = "sysuser"
}

variable "ci_password" {
  type      = string
  default   = "ChangeMe123!"   # nilai sebenarnya di-generate acak per VM lewat terraform.tfvars
  sensitive = true
}

variable "ssh_public_keys" {
  type    = string
  default = ""
}
```

---

## L.3 `main.tf` (varian *structured*, dipersingkat pada slot disk berulang)

```hcl
resource "proxmox_vm_qemu" "vm" {
  name        = var.vm_name
  target_node = var.target_node
  clone       = var.template
  full_clone  = true
  agent       = 1
  os_type     = "cloud-init"
  cores       = var.cores    # topologi core maksimum (tetap); vcpus = jumlah yang aktif
  sockets     = var.sockets
  vcpus       = var.vcpus    # resize CPU hot-plug dalam [1, sockets*cores], tanpa reboot
  memory      = var.memory
  scsihw      = "virtio-scsi-single"
  bios        = var.bios

  # Jangan pernah reboot VM hidup demi menerapkan perubahan. Dengan hotplug CPU, disk,
  # dan memori, resize dan tambah-disk berlaku LANGSUNG tanpa reboot.
  automatic_reboot = false
  hotplug          = "network,disk,cpu,memory,usb"
  numa             = true
  balloon          = 0

  disks {
    scsi {
      scsi0 {                       # disk boot; cloud-init menumbuhkannya ke var.disk_size_gb
        disk {
          size    = "${var.disk_size_gb}G"
          storage = var.storage
        }
      }
      # scsi1 sampai scsi6: disk data RAW opsional dari var.data_disks (plafon 6 slot),
      # dipasang lewat alur ADD_DISK. Terraform hanya memasang, format dan mount manual.
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
      # scsi2 sampai scsi6 mengikuti pola scsi1 dengan indeks data_disks[1] sampai [5].
    }

    ide {
      ide2 {
        cloudinit {
          storage = var.storage
        }
      }
    }
  }

  serial {                          # cloud-image butuh serial0 agar konsol tidak rusak saat clone
    id   = 0
    type = "socket"
  }

  network {
    id     = 0
    model  = "virtio"
    bridge = var.network
  }

  # Identitas cloud-init: hostname = nama VM, DHCP, dan kunci SSH otomasi Ansible.
  ciuser     = var.ci_user
  cipassword = var.ci_password
  sshkeys    = var.ssh_public_keys
  ipconfig0  = "ip=dhcp"

  lifecycle {
    ignore_changes = [network, sshkeys]
  }
}

output "vmid" {
  value = proxmox_vm_qemu.vm.vmid
}

output "default_ipv4" {
  value = proxmox_vm_qemu.vm.default_ipv4_address
}
```

---

## Catatan
- Sumber: `backend/storage/app/master-provisioning/terraform-structured/`, varian yang dipakai portal secara *default* (`config('provisioning.stub_variant')`)
- `main.tf` dan `variables.tf` disalin tetap; `provider.tf` dan `terraform.tfvars` dibangkitkan per *workspace*
- Slot disk `scsi2` sampai `scsi6` dihilangkan dari cetakan karena mengulang pola `scsi1`
- `pm_tls_insecure = true` dipakai karena Proxmox VE pada lingkungan pengujian memakai sertifikat *self-signed*
- Nilai `ci_password` di `variables.tf` hanya *default*; kata sandi sebenarnya di-generate acak 20 karakter per mesin virtual dan masuk lewat `terraform.tfvars`
