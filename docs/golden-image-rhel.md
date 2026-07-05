# Golden Image — RHEL 10 (cloud image)

Build a golden template from the downloaded RHEL cloud `qcow2`, carrying the same portal contract the
Rocky and Ubuntu templates carry (login user `sysuser`, SSH password auth, forced first-login reset,
key-based `sysadmin` admin account). All commands run **on the Proxmox host**. The flow is the same as
`golden-image-ubuntu.md`; the RHEL deltas are SELinux relabel, the serial-console kernel line, and
**skipping the `qemu-guest-agent` install** (RHEL repos need an active subscription). Shared concepts
live in `template-preparation.md`.

> **If you generate this qcow2 with the Red Hat image builder (console.redhat.com), pick "Package mode",
> NOT "Image mode".** Image mode produces a **bootc** image (ostree/composefs, immutable `/etc`, built
> from an `image-builder-bootc-foundry/...` ref) that `virt-customize` cannot customise and that
> cloud-init's user-inject + forced-reset flow does not work with. A bootc qcow2 makes `virt-customize`
> fail with *"no operating systems were found in the guest image"* (its root is not inspectable as a
> normal OS). The traditional package-mode **"Virtualization — Guest image (.qcow2)"** is the one this
> runbook expects. Leave Users/Groups empty and set no hostname (the portal injects those per clone);
> `qemu-guest-agent` + `cloud-init` are already in the qcow2 target (add `qemu-guest-agent` explicitly in
> the Packages step if you want zero doubt). Verified end-to-end on a Package-mode RHEL 10 build 2026-07-05.

## 0. Prerequisites

- `libguestfs-tools` on the Proxmox node
- The downloaded image on the node, e.g. `/var/lib/vz/template/rhel-10-x86_64-YYYYMMDD.qcow2` (the exact name carries the build date; it must be the **Package-mode** "Guest image (.qcow2)" — see the note above)
- A free VMID. This doc uses **9003** (Jakarta sequence: Rocky 9000 / Ubuntu 9001 / Fedora 9002 / RHEL 9003)
- Target node = **Jakarta** (has `vmbr0` + `vmdata`)
- The bastion `sysadmin` public key: `ssh-ed25519 AAAAC3NzaC1lZDI1NTE5AAAAIDMFSYaSQgzzeXrSVoSyydpx0MaZQKiMTubSsHDMsbKP sysadmin-bastion`
- **No subscription is needed for this build.** The RHEL GenericCloud image already ships `qemu-guest-agent` and `cloud-init`, so the offline pass installs no packages and the node needs no internet for `dnf`.

## 1. Customise the image offline (`virt-customize`)

The only structural difference from Fedora is that this pass **does not `--install` anything** — it
only enables the agent that the image already ships. Everything else (password auth, forced reset,
`sysadmin`, identity reset, SELinux relabel) is identical.

```bash
VMID=9003
IMG=/var/lib/vz/template/rhel-10-x86_64-20260626.qcow2

virt-customize -a "$IMG" \
  --run-command 'systemctl enable qemu-guest-agent 2>/dev/null || true' \
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

What changes vs Fedora:
- **No `--install qemu-guest-agent`** *(RHEL delta)* — the RHEL repos need an active subscription, so `dnf install` inside `virt-customize` would fail. The GenericCloud image already includes the agent; the `systemctl enable … || true` line only makes sure it starts. If a future image lacks the agent, register the VM with `subscription-manager` first, then `dnf install qemu-guest-agent`, and re-seal.
- **`--selinux-relabel`** *(EL delta)* — required, same as Fedora/Rocky.
- **`grubby … console=ttyS0`** *(EL delta)* — wires the serial console.

The `ssh_pwauth`, forced-reset, `sysadmin`, and identity-reset lines are identical to the other distros.

> **Proxmox: `virt-customize` fails with "no operating systems were found"?** On a valid image this is
> usually the node's default libguestfs backend (libvirt) misbehaving, not the image. Run
> `export LIBGUESTFS_BACKEND=direct` in the same shell, then re-run the command (it drives QEMU
> directly). Sanity-check what the appliance sees with `virt-filesystems -a "$IMG" --long -h --all` — a
> normal RHEL layout shows an EFI (vfat) + xfs `boot` + xfs `root`. If instead you see ostree/composefs
> or no mountable root, you built a **bootc / Image-mode** qcow2 (see §0), not a package-mode one.
> Verified fix on this node 2026-07-05.

## 2. Create the VM, import the disk, seal as a template

```bash
qm create $VMID --name rhel10-cloud --memory 2048 \
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

Same hardware contract as the other templates (16-core topology, 1 online vCPU, NUMA + CPU/Memory
hotplug for live Edit Resources, `--cpu host`, serial console, guest agent enabled).

## 3. Verify BEFORE publishing

```bash
qm clone $VMID 990 --name verify-rhel --full
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

If `network-get-interfaces` returns only `lo`, the agent is not running — confirm the image actually
ships `qemu-guest-agent` (it should) before assuming the template is broken.

Clean up: `qm stop 990 ; qm destroy 990 --purge`.

## 4. Publish into the portal

1. Discovery picks up the new `qm template`.
2. Publish a **Catalog** named e.g. **"RHEL 10"** on the **Jakarta** node.
3. Confirm the Jakarta node is in each environment's allow-list.

## 5. What this template carries (the portal contract)

- [ ] **`sysuser`** login created per clone from the portal's `ciuser`
- [ ] **`ssh_pwauth: true`** so password login is accepted
- [ ] **Forced first-login reset** via `runcmd: chage -d 0 sysuser`
- [ ] **`sysadmin`** key-only admin account (bastion key, passwordless sudo, locked password)
- [ ] **`qemu-guest-agent`** enabled (shipped by the image — not installed)
- [ ] **SELinux relabel** applied
- [ ] **growpart** grows the boot disk on first boot
- [ ] **Unique identity** per clone (machine-id + SSH host keys reset)

## 6. RHEL-specific notes

- **Subscription**: this offline build installs nothing, so it works on an unregistered image. Any
  later in-guest `dnf install` on a clone requires a valid `subscription-manager` registration.
- **EL family**: admin group `wheel`, SELinux enforcing (`--selinux-relabel` required), `dnf` as
  package manager. Same as Fedora and Rocky.
- The agent and cloud-init are preinstalled, so the offline pass is the lightest of the four images.

See also: `golden-image-ubuntu.md` (master runbook + delta table), `golden-image-fedora.md`, `golden-image-rocky.md`, `bastion-sysadmin-access.md`, `template-preparation.md`.
