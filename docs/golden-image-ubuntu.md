# Golden Image — Ubuntu Server 26.04 LTS (cloud image)

Build a golden template from the downloaded Ubuntu cloud `qcow2`, carrying the same portal contract
the Rocky template carries (login user `sysuser`, SSH password auth, forced first-login reset,
key-based `sysadmin` admin account). All commands run **on the Proxmox host**. For the shared
concepts (storage, verify-before-publish, troubleshooting) see `template-preparation.md`; this doc
is the concrete Ubuntu runbook and ends with a delta table for the Fedora / RHEL / Rocky 10 images.

## 0. Prerequisites

- `libguestfs-tools` on the Proxmox node: `apt-get install -y libguestfs-tools`
- The downloaded image on the node, e.g. `/var/lib/vz/template/Ubuntu-server-26-lts.qcow2`
- Internet on the node (the `--install qemu-guest-agent` step pulls the package via `apt`)
- A free VMID. This doc uses **9001** — now free after the old `ubuntu24-lvm` was deleted (9000 = `rocky9-cloud` is still taken)
- Target node = **Jakarta** (has `vmbr0` + `vmdata`). The Rocky 10 image is for **Lampung** — see §7
- The bastion `sysadmin` public key (already generated): `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMFSYaSQgzzeXrSVoSyydpx0MaZQKiMTubSsHDMsbKP sysadmin-bastion`

## 1. Customise the image offline (`virt-customize`)

One pass bakes the agent, SSH password auth, the forced first-login reset, the `sysadmin` account,
and resets the cloned-machine identity. No boot or login needed (cloud images are passwordless).

```bash
VMID=9001
IMG=/var/lib/vz/template/Ubuntu-server-26-lts.qcow2

virt-customize -a "$IMG" \
  --install qemu-guest-agent \
  --run-command 'systemctl enable qemu-guest-agent' \
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
  --run-command 'rm -f /etc/ssh/ssh_host_*'
```

What each group does:
- **`--install` + enable `qemu-guest-agent`** — the portal's Terraform waits on the agent for the IP. Without it, provisioning hangs at apply with the VM Active but no IP.
- **`99-pwauth.cfg` (`ssh_pwauth: true`)** — Ubuntu cloud images ship `PasswordAuthentication no`; cloud-init flips it on each clone's first boot so the portal's password login works.
- **`99-pwexpire.cfg` (`runcmd: chage -d 0 sysuser`)** — forces the user to set their own password on first login, so the portal-issued password is one-time. **Use `runcmd: chage`, not `chpasswd: { expire: true }`** — Proxmox's own cloud-init overrides `chpasswd` (validated on Rocky 2026-06-27). Details in `template-preparation.md` §3.
- **`sysadmin` block** — creates the key-only admin account (in the `sudo` group on Ubuntu), installs the bastion public key, gives passwordless sudo, and **locks the password** so the account is key-only. The `usermod` line tries `wheel` then `sudo` so the one command works on every distro. See `bastion-sysadmin-access.md`. Omit this block if you do not want admin access baked into this image.
- **`truncate /etc/machine-id` + `rm ssh_host_*`** — reset identity so each clone gets a unique machine-id and unique SSH host keys.

No `--selinux-relabel` here: Ubuntu uses **AppArmor**, not SELinux, so the relabel is unnecessary (it is required on the EL images — see §7).

## 2. Create the VM, import the disk, seal as a template

```bash
qm create $VMID --name ubuntu26-cloud --memory 2048 \
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

This matches the existing Rocky template's hardware so every template behaves the same:
- **`--sockets 1 --cores 16 --vcpus 1 --numa 1` + `--hotplug …,cpu,memory`** — the VM is *built* with 16
  cores but boots with **1 online vCPU**; NUMA plus CPU/Memory hotplug let the portal raise/lower vCPUs
  and RAM **live, without a reboot** (NUMA is required for vCPU hotplug). This is what makes the portal's
  Edit Resources work on the clones. The portal re-sets cores/vCPUs/RAM per tier on each clone, so this
  is the baseline topology, not the final clone size.
- **`--cpu host`** — the EL images need a v2 CPU; setting it on the template means every clone inherits it.
- **`--serial0 socket --vga serial0`** — serial console for cloud images; the two pair together.
- **`--agent enabled=1`** — the portal waits on the guest agent for the clone's IP.

## 3. Verify BEFORE publishing

Smoke-test a clone the way the portal will use it (the portal injects `ciuser=sysuser`):

```bash
qm clone $VMID 990 --name verify-ubuntu --full
qm set 990 --ciuser sysuser --cipassword 'Verify123!' --ipconfig0 ip=dhcp --cpu host
qm resize 990 scsi0 40G        # confirms resize + cloud-init growpart, like the portal does
qm start 990
sleep 60
qm agent 990 network-get-interfaces      # returns a real IP (not just lo) → template is GOOD
```

Then confirm the two baked behaviors against the clone's IP:

```bash
# Forced first-login reset (run from anywhere that reaches the VM, e.g. the Proxmox host):
ssh sysuser@<ip>        # password Verify123! → EXPECT "you must change your password now"

# Key-based sysadmin (run from the BASTION/app-VM, which holds the private key):
ssh -i /home/appd/.ssh/sysadmin_bastion -o BatchMode=yes sysadmin@<ip> 'id; sudo -n id'
#   → uid=...(sysadmin) groups=...(sudo) ; then uid=0(root) from sudo -n id
```

Clean up: `qm stop 990 ; qm destroy 990 --purge`.

## 4. Publish into the portal

1. The portal's discovery picks up the new `qm template` on the provider.
2. An admin publishes a **Catalog** (Settings → Catalog) mapping to it, named e.g. **"Ubuntu Server 26.04 LTS"**, on the **Jakarta** node.
3. Add the catalog's node to each environment's allow-list if it is not already admitted (catalogs are admitted by node residency, so once the Jakarta node is allow-listed the catalog is selectable).

## 5. What this template carries (the portal contract)

- [ ] **`sysuser`** login created per clone from the portal's `ciuser` (the image's built-in `ubuntu` user is unused)
- [ ] **`ssh_pwauth: true`** so password login is accepted
- [ ] **Forced first-login reset** via `runcmd: chage -d 0 sysuser` (portal password is one-time)
- [ ] **`sysadmin`** key-only admin account (bastion key, passwordless sudo, locked password)
- [ ] **`qemu-guest-agent`** installed + enabled (the portal needs it for the IP)
- [ ] **growpart** grows the boot disk to the requested size on first boot (cloud-init, built in)
- [ ] **Unique identity** per clone (machine-id + SSH host keys reset)

## 6. Ubuntu-specific notes

- **Admin group is `sudo`, not `wheel`.** The `usermod` line above handles both, so no change is needed.
- **AppArmor, not SELinux** — skip `--selinux-relabel`; key login works without a relabel.
- **`virt-customize` uses the image's `apt`**, so the Proxmox node needs internet for the `--install` step.
- **Networking** comes from cloud-init (netplan) automatically; the manual-netplan fix in `template-preparation.md` §4.2 applies only to the manual-LVM build, not to this cloud image.
- **Serial console** is preconfigured in the Ubuntu cloud image; if a clone ever shows a blank serial console, press Enter to wake the login prompt.

## 7. Adapting this runbook to the other images

The flow is identical; only a few lines change per distro. The `sysadmin` `usermod` line already
covers `wheel` vs `sudo`, so the deltas are the package manager, the SELinux relabel, and the
console line.

**VMID map (Jakarta):** Rocky **9000** (the existing template, already a Rocky 10 guest — no rebuild)
/ Ubuntu **9001** / Fedora **9002** / RHEL **9003**. The downloaded `Rocky-10-GenericCloud` image is a
separate **Lampung** build with its own VMID on the Lampung node; it is not part of the Jakarta
9000–9003 sequence.

| Aspect | Ubuntu 26.04 (this doc) | Fedora 44 | RHEL 10 | Rocky 10 |
|--------|------------------------|-----------|---------|----------|
| Image file | `Ubuntu-server-26-lts.qcow2` | `Fedora-Cloud-Base-Generic-44-1.7.x86_64.qcow2` | `rhel-10-x86_64-20260626.qcow2` | `Rocky-10-GenericCloud-Base.latest.x86_64.qcow2` |
| Family | Debian | EL (Fedora) | EL | EL |
| `--selinux-relabel` | **no** (AppArmor) | **yes** | **yes** | **yes** |
| Console line | none (serial preset) | add `--run-command 'grubby --update-kernel=ALL --args="console=ttyS0,115200 console=tty0"'` | same `grubby` line | same `grubby` line |
| `--install qemu-guest-agent` | yes (apt) | yes (dnf) | **skip** — RHEL repos need a subscription; the RHEL cloud image already ships the agent + cloud-init. If it is missing, register first, then install | yes (dnf) |
| `ostype` | `l26` | `l26` | `l26` | `l26` |
| Target node | Jakarta | Jakarta | Jakarta | **Lampung** (provider 2) |
| Suggested VMID | 9001 | 9002 | 9003 | own VMID on Lampung |

**Rocky 10 / Lampung caveat.** The Lampung node's discovery is not yet working (its Proxmox token
is missing **`Datastore.Audit`** and the node has **no `vmbr0` bridge**). Fix those on Lampung first,
or the imported template will not be discoverable and the clone's `--net0 virtio,bridge=vmbr0` will
fail. Build the Jakarta images (Ubuntu, Fedora, RHEL) first; do Rocky 10 on Lampung after the
discovery fix.
