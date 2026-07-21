# Lampiran — Kode Sumber Terraform

Berkas Terraform yang dipakai portal untuk mengkloning mesin virtual pada Proxmox VE. Definisi utama tetap sama antar permintaan, dan yang berubah hanya berkas `terraform.tfvars` yang sistem tuliskan dari pilihan pengguna. Tempel tiap blok dengan style Courier New 10, spasi 1.

Berkas `terraform.tfvars` tidak dilampirkan karena berisi nilai kredensial, yaitu URL dan token API Proxmox, yang tidak layak dicetak.

---

## L.1 `provider.tf`

```hcl
terraform {
  required_providers {
    proxmox = {
      source  = "Telmate/proxmox"
      version = "3.0.2-rc04"
    }
  }
}

provider "proxmox" {
  pm_api_url          = var.proxmox_api_url
  pm_api_token_id     = var.proxmox_api_token_id
  pm_api_token_secret = var.proxmox_api_token_secret
  pm_tls_insecure     = true
}
```

---

## L.2 `variables.tf`

```hcl
variable "proxmox_api_url" { type = string }
variable "proxmox_api_token_id" { type = string }
variable "proxmox_api_token_secret" { type = string }
variable "proxmox_node" { type = string }
variable "vm_name" { type = string }
variable "vmid" { type = number }
variable "template_name" { type = string }
variable "cpu_cores" { type = number }
variable "ram_mb" { type = number }
variable "disk_size" { type = string }
variable "storage_id" { type = string }
variable "network_bridge" { type = string }
variable "ssh_public_key" { type = string }
```

---

## L.3 `main.tf`

```hcl
resource "proxmox_vm_qemu" "vm" {
  name        = var.vm_name
  target_node = var.proxmox_node
  vmid        = var.vmid

  clone = var.template_name

  cpu {
    cores   = var.cpu_cores
    sockets = 1
  }

  memory  = var.ram_mb

  os_type = "cloud-init"

  disk {
    slot    = "scsi0"
    size    = var.disk_size
    type    = "disk"
    storage = var.storage_id
  }

  network {
    id     = 0
    model  = "virtio"
    bridge = var.network_bridge
  }

  # Allow cloud-init to configure networking
  ipconfig0 = "ip=dhcp"

  # Inject the SSH key from our app server so Ansible can connect
  #sshkeys = <<EOF
  #${var.ssh_public_key}
  #EOF

  lifecycle {
    ignore_changes = [
      network,
    ]
  }
}

output "vm_ip" {
  value = proxmox_vm_qemu.vm.default_ipv4_address
}
```

---

## Catatan
- Ketiga berkas dicetak apa adanya dari repositori, tanpa nilai kredensial
- `pm_tls_insecure = true` dipakai karena Proxmox VE pada lingkungan pengujian memakai sertifikat *self-signed*
- Blok `sshkeys` pada `main.tf` sengaja dinonaktifkan karena kunci publik Ansible disuntikkan melalui cloud-init, bukan melalui atribut ini
