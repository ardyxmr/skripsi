# Golden Image — Rocky Linux 10 (cloud image, Lampung node)

Build a golden template from the downloaded `Rocky-10-GenericCloud-Base.latest.x86_64.qcow2`, carrying
the same portal contract the other templates carry (login user `sysuser`, SSH password auth, forced
first-login reset, key-based `sysadmin` admin account). All commands run **on the Proxmox host**.

> **Read this first — which Rocky template is which.**
> The **Jakarta** template `rocky9-cloud` (VMID **9000**) is **already a Rocky 10 guest** and is in
> production. **Do not rebuild it.** This doc is for the **second, separate** Rocky 10 image you
> downloaded, which targets the **Lampung** node (provider 2) and gets its **own VMID on Lampung**
> (not 9004, not part of the Jakarta 9000–9003 sequence).

The flow matches `golden-image-ubuntu.md`. Rocky is EL, so the deltas are the same as Fedora: SELinux
relabel, the `dnf`-based agent install, and the serial-console kernel line. Shared concepts live in
`template-preparation.md`.

## 0. Prerequisites — fix Lampung discovery FIRST

The Lampung node's discovery does not work yet. Until both are fixed, the imported template will not
be discoverable and a clone's network attach will fail:

1. **Proxmox API token** on Lampung is missing the **`Datastore.Audit`** privilege — add it, or
   discovery cannot read the datastores.
2. **No `vmbr0` bridge** exists on Lampung — create one (or decide the real bridge name and use it
   below), or the clone's `--net0 virtio,bridge=…` has nothing to attach to.

Then:

- `libguestfs-tools` on the Lampung Proxmox node
- The downloaded image on the node: `/var/lib/vz/template/Rocky-10-GenericCloud-Base.latest.x86_64.qcow2`
- Internet on the node (the `--install qemu-guest-agent` step uses `dnf`)
- A **free VMID on Lampung** (this doc uses `VMID` as a variable — pick any free id on that node)
- The Lampung **datastore name** and **bridge name** (set as variables below; they may differ from Jakarta's `vmdata`/`vmbr0`)
- The bastion `sysadmin` public key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMFSYaSQgzzeXrSVoSyydpx0MaZQKiMTubSsHDMsbKP sysadmin-bastion`

Do the three Jakarta images (Rocky 9000 exists, plus Ubuntu/Fedora/RHEL) before this one.

## 1. Customise the image offline (`virt-customize`)

Identical to the Fedora pass (Rocky is EL). `--selinux-relabel` runs last.

```bash
VMID=<free-vmid-on-lampung>
IMG=/var/lib/vz/template/Rocky-10-GenericCloud-Base.latest.x86_64.qcow2

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

Notes (same as Fedora):
- **`--install` + enable `qemu-guest-agent`** (via `dnf`) — needed for the portal to read the IP.
- **`grubby … console=ttyS0`** *(EL delta)* — serial console.
- **`99-pwauth.cfg` + `99-pwexpire.cfg`** — password login + forced first-login reset. **Use `runcmd: chage`, not `chpasswd: { expire: true }`** (validated on Rocky 2026-06-27; Proxmox overrides `chpasswd`). See `template-preparation.md` §3.
- **`sysadmin` block** — key-only admin in `wheel`, bastion key, passwordless sudo, locked password. See `bastion-sysadmin-access.md`.
- **`--selinux-relabel`** *(EL delta)* — **required** so the baked `authorized_keys` and `sudoers.d` files get correct contexts; without it key login is denied. Keep it last.

## 2. Create the VM, import the disk, seal as a template

Set the Lampung storage and bridge names first (they may differ from Jakarta):

```bash
STORAGE=vmdata-zfs0     # e.g. vmdata or local-lvm on Lampung
BRIDGE=vmbr0         # e.g. vmbr0 once created

qm create $VMID --name rocky10-cloud --memory 2048 \
  --sockets 1 --cores 8 --vcpus 1 --cpu host --numa 1 \
  --net0 virtio,bridge=$BRIDGE --scsihw virtio-scsi-single \
  --ostype l26 --agent enabled=1 \
  --serial0 socket --vga serial0 \
  --hotplug disk,network,usb,cpu,memory
qm importdisk $VMID "$IMG" $STORAGE
qm set $VMID --scsi0 $STORAGE:vm-$VMID-disk-0
qm set $VMID --ide2 $STORAGE:cloudinit --boot order=scsi0
qm template $VMID
```

Same hardware contract as the other templates (16-core topology, 1 online vCPU, NUMA + CPU/Memory
hotplug for live Edit Resources, `--cpu host`, serial console, guest agent enabled). Only the storage
and bridge names are parameterised because Lampung differs from Jakarta.

## 3. Verify BEFORE publishing

```bash
qm clone $VMID 990 --name verify-rocky --full
qm set 990 --ciuser sysuser --cipassword 'Verify123!' --ipconfig0 ip=dhcp --cpu host
qm resize 990 scsi0 40G
qm start 990
sleep 60
qm agent 990 network-get-interfaces      # returns a real IP → template is GOOD
```

```bash
# Forced first-login reset:
ssh sysuser@<ip>        # Verify123! → EXPECT "you must change your password now"
#   on EL, pwquality rejects weak/dictionary passwords at the change prompt; use e.g. d3Hgtwhr!

# Key-based sysadmin (from the BASTION/app-VM):
ssh -i /home/appd/.ssh/sysadmin_bastion -o BatchMode=yes sysadmin@<ip> 'id; sudo -n id'
#   → groups include wheel ; then uid=0(root)
```

If the clone gets no IP, re-check the Lampung bridge exists and the token has `Datastore.Audit`
(the two prerequisites in §0).

Clean up: `qm stop 990 ; qm destroy 990 --purge`.

## 4. Publish into the portal

1. Discovery on **provider 2 (Lampung)** picks up the new `qm template`.
2. Publish a **Catalog** named e.g. **"Rocky Linux 10"** on the **Lampung** node.
3. Add the **Lampung node (provider 2)** to each environment's allow-list — it is currently in no
   environment, so Lampung-hosted catalogs are unusable until it is admitted.

## 5. What this template carries (the portal contract)

- [ ] **`sysuser`** login created per clone from the portal's `ciuser`
- [ ] **`ssh_pwauth: true`** so password login is accepted
- [ ] **Forced first-login reset** via `runcmd: chage -d 0 sysuser`
- [ ] **`sysadmin`** key-only admin account (bastion key, passwordless sudo, locked password)
- [ ] **`qemu-guest-agent`** installed + enabled
- [ ] **SELinux relabel** applied
- [ ] **growpart** grows the boot disk on first boot
- [ ] **Unique identity** per clone (machine-id + SSH host keys reset)

## 6. Rocky / Lampung notes

- **This is the Lampung build.** The Jakarta `rocky9-cloud` (9000) is already Rocky 10 — leave it alone.
- **EL family**: admin group `wheel`, SELinux enforcing (`--selinux-relabel` required), `dnf` package manager. Same deltas as Fedora and RHEL.
- **Lampung must be reachable from the portal and added to environments**, otherwise the published catalog cannot be provisioned even though the template builds fine.
- Re-confirm `STORAGE` and `BRIDGE` against the actual Lampung node before running §2.

See also: `golden-image-ubuntu.md` (master runbook + delta table), `golden-image-fedora.md`, `golden-image-rhel.md`, `bastion-sysadmin-access.md`, `template-preparation.md`.
