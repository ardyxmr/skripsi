# Golden Image — Fedora Cloud Base 44 (cloud image)

Build a golden template from the downloaded Fedora cloud `qcow2`, carrying the same portal contract
the Rocky and Ubuntu templates carry (login user `sysuser`, SSH password auth, forced first-login
reset, key-based `sysadmin` admin account). All commands run **on the Proxmox host**. The flow is the
same as `golden-image-ubuntu.md`; the Fedora deltas are SELinux relabel, the `dnf`-based agent
install, and the serial-console kernel line. Shared concepts (storage, verify-before-publish,
troubleshooting) live in `template-preparation.md`.

## 0. Prerequisites

- `libguestfs-tools` on the Proxmox node: `dnf install -y libguestfs-tools` (or `apt-get install -y libguestfs-tools`)
- The downloaded image on the node: `/var/lib/vz/template/Fedora-Cloud-Base-Generic-44-1.7.x86_64.qcow2`
- Internet on the node (the `--install qemu-guest-agent` step pulls the package via `dnf`)
- A free VMID. This doc uses **9002** (Jakarta sequence: Rocky 9000 / Ubuntu 9001 / Fedora 9002 / RHEL 9003)
- Target node = **Jakarta** (has `vmbr0` + `vmdata`)
- The bastion `sysadmin` public key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMFSYaSQgzzeXrSVoSyydpx0MaZQKiMTubSsHDMsbKP sysadmin-bastion`

## 1. Customise the image offline (`virt-customize`)

One pass bakes the agent, SSH password auth, the forced first-login reset, the `sysadmin` account,
the serial console, and resets the cloned-machine identity. `--selinux-relabel` runs last so every
baked file gets the correct SELinux context on first boot.

```bash
VMID=9002
IMG=/var/lib/vz/template/Fedora-Cloud-Base-Generic-44-1.7.x86_64.qcow2

virt-customize -a "$IMG" \
  --install qemu-guest-agent \
  --run-command 'systemctl enable qemu-guest-agent' \
  --run-command 'grubby --update-kernel=ALL --args="console=ttyS0,115200 console=tty0"' \
  --run-command 'printf "ssh_pwauth: true\n" > /etc/cloud/cloud.cfg.d/99-pwauth.cfg' \
  --run-command 'printf "#cloud-config\nruncmd:\n  - chage -d 0 sysuser\n" > /etc/cloud/cloud.cfg.d/99-pwexpire.cfg' \
  --run-command 'id sysadmin >/dev/null 2>&1 || useradd -m -s /bin/bash sysadmin' \
  --run-command 'usermod -aG wheel sysadmin 2>/dev/null || usermod -aG sudo sysadmin 2>/dev/null || true' \
  --run-command 'install -d -m 700 /home/sysadmin/.ssh' \
  --write '/home/sysadmin/.ssh/authorized_keys:ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMFSYaSQgzzeXrSVoSyydpx0MaZQKiMTubSsHDMsbKP sysadmin-bastion' \
  --run-command 'chmod 700 /home/sysadmin/.ssh && chmod 600 /home/sysadmin/.ssh/authorized_keys && chown -R sysadmin:sysadmin /home/sysadmin/.ssh' \
  --run-command 'printf "sysadmin ALL=(ALL) NOPASSWD:ALL\n" > /etc/sudoers.d/90-sysadmin && chmod 440 /etc/sudoers.d/90-sysadmin && visudo -cf /etc/sudoers.d/90-sysadmin' \
  --run-command 'passwd -l sysadmin' \
  --run-command 'truncate -s 0 /etc/machine-id' \
  --run-command 'rm -f /etc/ssh/ssh_host_*' \
  --selinux-relabel
```

What each group does (same as Ubuntu, with the EL deltas marked):
- **`--install` + enable `qemu-guest-agent`** (via `dnf`) — the portal's Terraform waits on the agent for the IP. Without it, apply hangs with the VM Active but no IP.
- **`grubby … console=ttyS0`** *(EL delta)* — wires the serial console so `--serial0 socket --vga serial0` shows a login prompt. Harmless if the image already sets it.
- **`99-pwauth.cfg` (`ssh_pwauth: true`)** — accepts the portal's password login.
- **`99-pwexpire.cfg` (`runcmd: chage -d 0 sysuser`)** — forces a password change on first login, so the portal-issued password is one-time. **Use `runcmd: chage`, not `chpasswd: { expire: true }`** (Proxmox overrides `chpasswd`). See `template-preparation.md` §3.
- **`sysadmin` block** — key-only admin account in the `wheel` group, bastion public key, passwordless sudo, locked password. The `usermod` line tries `wheel` then `sudo`, so the one command works on every distro. See `bastion-sysadmin-access.md`. Omit this block if you do not want admin access baked in.
- **`truncate /etc/machine-id` + `rm ssh_host_*`** — unique identity per clone.
- **`--selinux-relabel`** *(EL delta)* — Fedora enforces SELinux, so the baked `authorized_keys` and `sudoers.d` files must be relabeled or key login is denied. **Required.** Keep it last.

## 2. Create the VM, import the disk, seal as a template

```bash
qm create $VMID --name fedora44-cloud --memory 2048 \
  --sockets 1 --cores 16 --vcpus 1 --cpu host --numa 1 \
  --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-single \
  --ostype l26 --agent enabled=1 \
  --serial0 socket --vga serial0 \
  --hotplug disk,network,usb,cpu,memory
qm importdisk $VMID "$IMG" vmdata
qm set $VMID --scsi0 vmdata:vm-$VMID-disk-0
qm set $VMID --ide2 vmdata:cloudinit --boot order=scsi0
qm template $VMID
```

Identical hardware to the Rocky and Ubuntu templates so every clone behaves the same:
- **`--sockets 1 --cores 16 --vcpus 1 --numa 1` + `--hotplug …,cpu,memory`** — built with 16 cores but boots with 1 online vCPU; NUMA + CPU/Memory hotplug let the portal raise/lower vCPUs and RAM live, no reboot. The portal re-sets cores/vCPUs/RAM per tier on each clone.
- **`--cpu host`** — the EL images need a v2 CPU; setting it on the template means every clone inherits it.
- **`--serial0 socket --vga serial0`** — serial console pair for cloud images.
- **`--agent enabled=1`** — the portal waits on the guest agent for the clone's IP.

## 3. Verify BEFORE publishing

```bash
qm clone $VMID 990 --name verify-fedora --full
qm set 990 --ciuser sysuser --cipassword 'Verify123!' --ipconfig0 ip=dhcp --cpu host
qm resize 990 scsi0 40G        # confirms resize + cloud-init growpart
qm start 990
sleep 60
qm agent 990 network-get-interfaces      # returns a real IP (not just lo) → template is GOOD
```

Confirm the two baked behaviors against the clone's IP:

```bash
# Forced first-login reset — VERIFY AS sysuser (password), NOT sysadmin:
ssh sysuser@<ip>        # password Verify123! → EXPECT "you are required to change your password immediately"
#   IMPORTANT: log in as sysuser with the PASSWORD. The key-based sysadmin login never
#   triggers the expiry prompt, so testing with sysadmin makes a working template look broken.
#   NOTE: on EL, pwquality rejects weak/dictionary passwords at the change prompt
#   (e.g. P@ssw0rd is refused). Use a strong one such as d3Hgtwhr!.
#   Live-verified on Fedora 44 (vmid 9002) 2026-07-05: runcmd fires, sysuser forced to reset.

# Key-based sysadmin (run from the BASTION/app-VM, which holds the private key):
ssh -i /home/appd/.ssh/sysadmin_bastion -o BatchMode=yes sysadmin@<ip> 'id; sudo -n id'
#   → groups include wheel ; then uid=0(root) from sudo -n id
```

Clean up: `qm stop 990 ; qm destroy 990 --purge`.

## 4. Publish into the portal

1. The portal's discovery picks up the new `qm template` on the provider.
2. An admin publishes a **Catalog** (Settings → Catalog) mapping to it, named e.g. **"Fedora 44"**, on the **Jakarta** node.
3. Make sure the Jakarta node is in each environment's allow-list (catalogs are admitted by node residency).

## 5. What this template carries (the portal contract)

- [ ] **`sysuser`** login created per clone from the portal's `ciuser`
- [ ] **`ssh_pwauth: true`** so password login is accepted
- [ ] **Forced first-login reset** via `runcmd: chage -d 0 sysuser` (portal password is one-time)
- [ ] **`sysadmin`** key-only admin account (bastion key, passwordless sudo, locked password)
- [ ] **`qemu-guest-agent`** installed + enabled
- [ ] **SELinux relabel** applied so key login and sudo work on first boot
- [ ] **growpart** grows the boot disk on first boot (cloud-init, built in)
- [ ] **Unique identity** per clone (machine-id + SSH host keys reset)

## 6. Fedora-specific notes

- **EL family**: admin group is `wheel` (the `usermod` line handles it), `dnf` is the package manager, and SELinux is enforcing, so `--selinux-relabel` is required.
- **`virt-customize` uses the image's `dnf`**, so the Proxmox node needs internet for the `--install` step.
- Fedora 44 ships a recent kernel and cloud-init; the `grubby` console line is a safety net, harmless if already present.

See also: `golden-image-ubuntu.md` (master runbook + delta table), `golden-image-rhel.md`, `golden-image-rocky.md`, `bastion-sysadmin-access.md`, `template-preparation.md`.
