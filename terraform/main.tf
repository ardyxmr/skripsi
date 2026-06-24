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
