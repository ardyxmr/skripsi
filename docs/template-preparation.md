# Golden Template Preparation (Proxmox)

How to build VM templates that clone cleanly through the self-service portal. Every item
here was learned the hard way during Stage 6 provisioning — follow it and clones boot,
get an IP, and show up Active in inventory on the first try.

> **Audience:** the Proxmox admin preparing templates. Commands run on the **Proxmox node
> shell** (`root@pve`) unless noted as "inside the VM".

---

## 1. What the portal expects from a template

The provisioning pipeline renders a Terraform `proxmox_vm_qemu` resource (Telmate/proxmox
3.x) that **clones** your template and customises it via cloud-init. A template MUST be
compatible with all of this or provisioning fails:

| Portal/stub assumption | What the template needs |
|---|---|
| `clone = <template name>`, `full_clone = true` | be a real **template** (`qm template`) |
| `agent = 1` (Terraform **waits for the agent to report an IP**) | **qemu-guest-agent installed + enabled** |
| cloud-init drive on **`ide2`**, `ciuser`/`cipassword`/`ipconfig0=ip=dhcp` | **cloud-init installed**, datasource reads the Proxmox drive |
| disk on **`scsi0`**, `scsihw = virtio-scsi-single` | boot disk attached as `scsi0` (virtio-scsi) |
| boot disk **resized** to the tier size (e.g. 40G) | a filesystem/layout that **grows on boot** (cloud images do; LVM needs help — §5) |
| networking via DHCP | the guest actually brings up **DHCP** (cloud-init *or* a static netplan — §4.2) |
| `ciuser`/`cipassword` → users log in **by password** | **SSH password auth enabled** — cloud images ship `PasswordAuthentication no`, so set `ssh_pwauth: true` (§3) or SSH is refused even with the right password |

**The single most common failure:** no guest agent → `agent=1` makes Terraform hang waiting
for an IP that never comes. Install `qemu-guest-agent` in every template.

> **Windows templates** follow a different path — there is no official Windows cloud image, so you
> **build one from an ISO** and use **cloudbase-init** (the Windows port of cloud-init) instead of
> cloud-init. The portal pipeline above is otherwise unchanged. See **§10 (Recipe C)** and the
> tier/environment notes in **§11**.

---

## 2. The non-negotiable checklist (both template types)

- [ ] **CPU type** set to `host` (or `x86-64-v2-AES`). Proxmox defaults to `kvm64` (x86-64-**v1**); **EL9 — Rocky/RHEL/Alma 9 — requires x86-64-v2** and will hang in early boot on the default. Harmless for Ubuntu, so use it for both.
- [ ] **qemu-guest-agent** installed **and** enabled (`systemctl enable --now qemu-guest-agent`), and VM config has `--agent enabled=1`.
- [ ] **cloud-init** installed and able to read the Proxmox `ide2` drive.
- [ ] **Disk on `scsi0`**, controller `virtio-scsi-single`.
- [ ] **Networking comes up via DHCP** on clone (verified — §6).
- [ ] **SSH password auth enabled** (`ssh_pwauth: true` in cloud-init). Cloud images disable it by default (`PasswordAuthentication no`), but the portal logs users in with the injected `ciuser`/`cipassword`, so SSH must accept passwords or PuTTY fails with *"No supported authentication methods (server sent: publickey,gssapi-*)"*.
- [ ] **Force a password change on first login** (`chpasswd: { expire: true }` in cloud-init). Makes the portal's auto-generated password a **one-time** credential: the owner reveals it once (self-service, audited), logs in, and is forced to set their own — after which **neither the admin nor the system knows the real password**. Details + the deterministic `chage` fallback in §3.
- [ ] **Identity reset** before sealing: blank `/etc/machine-id`, remove SSH host keys, `cloud-init clean` (so each clone is unique).
- [ ] **Storage** that supports VM images and has capacity — see §5.
- [ ] Use template **VMIDs ≥ 9000** so they never collide with portal-provisioned VMs (which start at 100).

---

## 3. Recipe A — EL9 cloud image (Rocky/AlmaLinux 9) — easiest, recommended

Cloud images are built to clone + cloud-init-grow cleanly. Customise the image **offline**
with `virt-customize` (no login needed — cloud images are passwordless by design).

```bash
apt-get install -y libguestfs-tools          # one-time, on the Proxmox node

cd /var/lib/vz/template
wget https://dl.rockylinux.org/pub/rocky/9/images/x86_64/Rocky-9-GenericCloud-Base.latest.x86_64.qcow2

# bake in the agent, console, SSH password auth, and reset identity — no boot/login required
virt-customize -a Rocky-9-GenericCloud-Base.latest.x86_64.qcow2 \
  --install qemu-guest-agent \
  --run-command 'systemctl enable qemu-guest-agent' \
  --run-command 'grubby --update-kernel=ALL --args="console=ttyS0,115200 console=tty0"' \
  --run-command 'printf "ssh_pwauth: true\nchpasswd: { expire: true }\n" > /etc/cloud/cloud.cfg.d/99-pwauth.cfg' \
  --run-command 'truncate -s 0 /etc/machine-id' \
  --run-command 'rm -f /etc/ssh/ssh_host_*'

VMID=9000
qm create $VMID --name rocky9-cloud --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-single \
  --ostype l26 --agent enabled=1 --cpu host --vga serial0      # serial console for cloud images
qm importdisk $VMID Rocky-9-GenericCloud-Base.latest.x86_64.qcow2 vmdata
qm set $VMID --scsi0 vmdata:vm-$VMID-disk-0
qm set $VMID --ide2 vmdata:cloudinit --boot order=scsi0
qm template $VMID
```

Notes:
- **Console:** cloud images log to **serial** (`ttyS0`), so `--vga serial0` shows boot output + a login. The `grubby` line also enables `tty0` so the graphical noVNC console works too.
- **SSH password login:** `ssh_pwauth: true` makes cloud-init flip `PasswordAuthentication yes` on each clone's first boot — without it, SSH only offers `publickey` and password login (which is all the portal hands out) is refused.
- **First-login password reset (one-time credential) — use `runcmd: chage -d 0`, NOT `chpasswd`.** Goal: force the user to set their own password on first login, so the portal-generated password (revealed self-service in Inventory) is a *temporary* credential only — after the change, neither the admin nor the system knows the real one (a privacy/STRIDE win). **`chpasswd: { expire: true }` does NOT achieve this on Proxmox** (live-tested 2026-06-27, Rocky 9): Proxmox's own cloud-init sets the injected `cipassword` *without* expiry and overrides the template's `chpasswd` directive, so the clone logs straight in. The method that **does** work is a post-boot `chage -d 0` on the injected user — it sets the shadow last-change date to 0, after which PAM forces a change at next login, independent of the `chpasswd` module:
  ```bash
  # add as its own 99-pwexpire.cfg in the offline virt-customize run (+ --selinux-relabel on EL).
  # Use runcmd (final stage, runs once per instance AFTER the password is set) — NOT bootcmd,
  # which runs too early AND re-fires on every reboot.
  --run-command 'printf "#cloud-config\nruncmd:\n  - chage -d 0 sysuser\n" > /etc/cloud/cloud.cfg.d/99-pwexpire.cfg'
  ```
  (`sysuser` = the portal's `ci_user`; change it if you re-point `PROVISION_CI_USER`. Generic form for any injected human user: `runcmd: - bash -c "for u in $(awk -F: '$3>=1000 && $3<65534 {print $1}' /etc/passwd); do chage -d 0 \"$u\"; done"`.) **Verified end-to-end (Rocky 9, vmid 9000, 2026-06-27):** a fresh clone forces the change on first SSH login with no manual step, and the OS `pwquality` policy independently rejects weak choices (e.g. `P@ssw0rd` → *"based on a dictionary word"*; `d3Hgtwhr!` accepted). **Most robust variant if `runcmd` ever fails to fire** (cloud-init list-merge or stable-instance-id quirks): drop an executable in `/var/lib/cloud/scripts/per-instance/` that runs `chage -d 0 sysuser` — same once-per-instance timing, no YAML-merge dependency. **Caveat:** OpenSSH CLI and the Proxmox console handle the "expired → set new" prompt cleanly; some old GUI clients (legacy PuTTY) are clunky — the console is the fallback. Recovery if a user forgets their new password = admin resets via the Proxmox console.
- **Disk grow:** cloud images include `cloud-init` + `growpart`, so the boot disk auto-grows to whatever size the portal requests. Nothing extra needed.
- **Do NOT** bake a `ciuser`/`cipassword` into the template — the portal injects those per clone.

> **Already built a template without this?** Fix it in place, offline — no re-clone, no re-publish (the catalog still points at the same vmid). Find the disk with `qm config <vmid> | grep scsi0` (e.g. `vmdata:base-9000-disk-0` → `/dev/zvol/vmdata/base-9000-disk-0`):
> ```bash
> virt-customize -a /dev/zvol/vmdata/base-9000-disk-0 \
>   --run-command 'printf "ssh_pwauth: true\n" > /etc/cloud/cloud.cfg.d/99-pwauth.cfg' \
>   --run-command 'printf "#cloud-config\nruncmd:\n  - chage -d 0 sysuser\n" > /etc/cloud/cloud.cfg.d/99-pwexpire.cfg' \
>   --selinux-relabel
> ```
> Only **new** clones pick it up; VMs already provisioned stay key-only until reprovisioned (or enable it in-guest — §8).

---

## 4. Recipe B — Custom partition layout (manual Ubuntu install, e.g. LVM)

You install by hand, so **you** must add the agent / cloud-init / initramfs bits — that's the
step a hand-built template usually skips.

### 4.1 Install
```bash
VMID=9001
qm create $VMID --name ubuntu24-lvm --memory 2048 --cores 2 \
  --net0 virtio,bridge=vmbr0 --scsihw virtio-scsi-single --ostype l26 \
  --agent enabled=1 --cpu host --vga std \
  --scsi0 vmdata:32 \
  --ide2 local:iso/ubuntu-24.04.x-live-server-amd64.iso,media=cdrom \
  --boot order='scsi0;ide2'
qm start $VMID
# → open the noVNC Console, run the installer, choose "Custom storage layout" → build your LVM.
```
- **Use `--vga std`** for a manual install — the Subiquity installer (TUI) renders on the VGA console, **not** serial. (`--vga serial0` shows only `starting serial terminal…` and looks stuck.)
- `pvesm list local --content iso` prints the exact ISO volume id if you're unsure of the filename.

### 4.2 Prep inside the VM (after install, log in)
```bash
sudo apt-get update
sudo apt-get install -y qemu-guest-agent cloud-init lvm2 cloud-guest-utils
sudo systemctl enable qemu-guest-agent

# >>> the fix for the init-bottom hang: lvm2 + virtio into the initramfs
sudo update-initramfs -u -k all
```

**Networking — important:** a Subiquity-installed Ubuntu **disables cloud-init networking**
(it drops a `*installer*` / `subiquity-disable-cloudinit-networking.cfg` in
`/etc/cloud/cloud.cfg.d/` and writes a static `/etc/netplan/00-installer-config.yaml`). Since
the portal always uses **DHCP**, the most robust fix is a permanent DHCP netplan decoupled
from cloud-init (cloud-init still sets hostname/user/password):
```bash
sudo rm -f /etc/netplan/00-installer-config.yaml
sudo tee /etc/netplan/01-dhcp.yaml >/dev/null <<'EOF'
network:
  version: 2
  ethernets:
    anyeth:
      match:
        name: "e*"          # matches eth0, ens18, enp0s18…
      dhcp4: true
      dhcp-identifier: mac   # each clone leases by its own MAC
EOF
sudo chmod 600 /etc/netplan/01-dhcp.yaml
sudo netplan apply          # should pull a DHCP IP immediately
```

**SSH password login** — let cloud-init enable it per clone (the portal logs in with the injected `ciuser`/`cipassword`):
```bash
echo 'ssh_pwauth: true' | sudo tee /etc/cloud/cloud.cfg.d/99-pwauth.cfg
```

### 4.3 Reset identity + seal
```bash
sudo cloud-init clean --logs
sudo truncate -s 0 /etc/machine-id
sudo rm -f /var/lib/dbus/machine-id && sudo ln -s /etc/machine-id /var/lib/dbus/machine-id
sudo rm -f /etc/ssh/ssh_host_*
sudo apt-get clean
sudo shutdown -h now
```
Then on the node:
```bash
qm set 9001 --ide2 vmdata:cloudinit --boot order=scsi0 --vga std
qm template 9001
```

**LVM disk-grow note:** with a custom LVM layout, `growpart` grows the *partition* on resize,
but the **LV + filesystem won't auto-grow** unless you script it (a boot-time
`growpart /dev/sda N ; pvresize … ; lvextend -r -l +100%FREE /dev/vg0/lv-root`). For the VM to
*boot* reliably (the common problem), §4.2's initramfs + networking steps are what matter.

---

## 5. Storage

- Import disks to a store that **supports VM images** and has **capacity**.
  - `local` (dir) → **rejects VM images** → `400 Parameter verification failed`. Don't use for disks.
  - `local-lvm` (lvm-thin), `vmdata` (zfspool) → good.
- **Thin-provision the pool.** A zfspool/lvm-thin with thin **off** *reserves* the full disk size, so an `N × 40G` batch over-commits a small pool → ZFS/LVM hits **ENOSPC mid-write → guest filesystem corruption** (root fsck failures, "invalid ELF header"). Enable **Datacenter → Storage → \<pool\> → Thin provision**.
- Right-size the tier disk to your lab (40G × a batch adds up fast on small pools).

---

## 6. Verify a template BEFORE publishing it

Always smoke-test a clone the way the portal will use it:
```bash
qm clone 9000 990 --name verify --full
qm set 990 --ciuser cloud --cipassword 'Verify123!' --ipconfig0 ip=dhcp --cpu host
qm resize 990 scsi0 40G          # confirms resize + growpart, like the portal does
qm start 990
sleep 60
qm agent 990 network-get-interfaces    # returns a real IP  → template is GOOD
# clean up: qm stop 990 ; qm destroy 990 --purge
```
If `network-get-interfaces` returns an IP (not just `lo`), the agent is running, networking
works, and it boots clean — it will work end-to-end in the portal.

---

## 7. Wiring a verified template into the portal

1. The portal's discovery picks up any `qm template` as a discovered template on the provider.
2. An admin **publishes a Catalog** mapping to it (Settings → Catalog), choosing the published
   **Node**; the catalog's health then follows that node.
3. Users select the catalog in the provision wizard; the pipeline clones it per the table in §1.

---

## 8. Troubleshooting (symptom → cause → fix)

| Symptom | Cause | Fix |
|---|---|---|
| Console shows `starting serial terminal on interface serial0`, blank | `--vga serial0` but the guest (or ISO installer) renders on VGA | `qm set <id> --vga std` for manual installs; press **Enter** on serial for cloud images |
| Boots to GRUB then dead on **both** consoles (e.g. stuck after "Probing EDD … ok") | **EL9 on `kvm64`** (x86-64-v1) — kernel needs v2 | `qm set <id> --cpu host` (or `x86-64-v2-AES`); set it on the **template** |
| Stuck at `Begin: Running /scripts/init-bottom … done` | initramfs can't activate the **LVM** root | install `lvm2`, `update-initramfs -u -k all`, reseal |
| Provisioning **hangs** at apply / VM Active but **no IP** | **qemu-guest-agent** not installed (Terraform `agent=1` waits) | install + enable the agent in the template; reseal |
| Clone has **empty `/etc/netplan/`**, no IP, long `systemd-networkd-wait-online` | Subiquity **disabled cloud-init networking** | add the permanent DHCP netplan (§4.2); reseal |
| Apply error `zfs error: … size is greater than available space` | pool **over-committed** (thick) / too small | enable **thin**, use a bigger pool, or smaller disk |
| Guests **corrupt** (root fsck fail / invalid ELF header) after a parallel batch | thick **ENOSPC mid-write** during cloud-init grow | enable **thin** provisioning on the pool |
| Apply error `400 Parameter verification failed` on the disk | disk targeted at `local` (dir, no images) | use an images-capable store (`local-lvm`/`vmdata`) |
| Can't log into a cloud image to prep it | cloud images are **passwordless** by design | don't log in — customise offline with `virt-customize`; creds are injected per clone |
| SSH refused — *"No supported authentication methods (server sent: publickey,gssapi-*)"* | cloud image has **`PasswordAuthentication no`**; portal uses password login | bake **`ssh_pwauth: true`** into the template (§3); already-running VMs: console in, `echo 'PasswordAuthentication yes' \| sudo tee /etc/ssh/sshd_config.d/50-pwauth.conf && sudo systemctl restart sshd` |
| `qm terminal` blank / "stuck", or noVNC serial console won't attach | a serial port is **single-client** — the web console and `qm terminal` both use `serial0` | use one at a time (close the other); press **Enter** to wake the login prompt; for concurrent shells use SSH |
| `MaxAttemptsExceededException` on parallel jobs (portal side) | queue `retry_after` < job runtime | already fixed in `config/queue.php` (`retry_after = 1800`) |

---

## 9. Quick reference — verified golden templates in this environment

- **`rocky9-cloud` (vmid 9000)** — EL9 cloud image, `--cpu host`, agent, serial+VGA console. Published as the **Rocky Linux 9** catalog. Provisions single + parallel batches cleanly on thin `vmdata`. **Forced first-login password reset live-verified 2026-06-27**: carries `99-pwauth.cfg` (`ssh_pwauth: true`) + `99-pwexpire.cfg` (`runcmd: chage -d 0 sysuser`); a fresh clone forces the password change on first SSH login, and `pwquality` rejects weak passwords (`P@ssw0rd` refused, `d3Hgtwhr!` accepted). Default login user is now `sysuser` (portal `PROVISION_CI_USER`).
- **`ubuntu24-lvm` (vmid 9001)** — manual Ubuntu 24.04, custom LVM, `--cpu host`, agent, lvm2-in-initramfs, DHCP netplan. (Finish per §4.2 networking before publishing.)

---

## 10. Recipe C — Windows templates (Server 2022/2025 & Windows 11) via cloudbase-init

Windows has **no official cloud image** like Fedora/Ubuntu. You build the template from an ISO, and
the cloud-init equivalent is **cloudbase-init** (by Cloudbase Solutions). It reads the **same Proxmox
cloud-init drive** the Linux path uses, so once installed correctly a Windows template clones through
the portal's existing Telmate pipeline (hostname / user / password / IP all injected). `sshkeys` is
ignored — Windows logs in by password over RDP/WinRM.

### 10.1 ISOs / drivers you need on the node
- Windows ISO — for a lab use the **evaluation** editions (Server eval = 180 days; Win 11 Enterprise eval) so activation isn't a blocker. Note this as a thesis limitation.
- **virtio-win** ISO (Fedora's signed driver ISO) — Windows can't see a VirtIO SCSI disk without it.
- **cloudbase-init** MSI (`cloudbase.it`) — installed inside the guest.

### 10.2 Proxmox VM settings
| Setting | Value | Why |
|---|---|---|
| Machine | **q35** | modern chipset (required for Win 11; fine for Server) |
| BIOS | **OVMF (UEFI)** + add an **EFI disk** | required for Win 11 Secure Boot; recommended for Server |
| SCSI controller | **virtio-scsi-single** | matches the stub (`scsihw`) |
| Boot disk | **scsi0**, **VirtIO SCSI** | matches the stub (`scsi0`) |
| Network | **VirtIO (model=virtio)** | matches the stub |
| CPU | **host** | performance + feature parity |
| Cloud-init drive | **Add → CloudInit Drive on `ide2`** | cloudbase-init reads it |
| CD 1 / CD 2 | **Windows ISO** + **virtio-win ISO** | install + driver load |
| RAM / Disk | **Server:** ≥4 GB / ≥60 GB · **Win 11:** ≥4 GB (8 rec.) / ≥64 GB | Windows won't fit the current 40 GB tiers — see §11 |

**Windows 11 only — extra hardware gates:**
- [ ] **TPM 2.0** → add a **TPM State** device (`tpmstate0`, version 2.0).
- [ ] **Secure Boot** → OVMF EFI disk with pre-enrolled MS keys (Proxmox "EFI disk" defaults enroll them).

### 10.3 Install + drivers
1. Boot the Windows ISO. At "Where do you want to install Windows?" the disk is missing → **Load driver** → browse the virtio-win CD → `vioscsi\<ver>\<arch>` → the disk appears.
2. Finish the install, boot to desktop.
3. From the virtio-win CD run **`virtio-win-guest-tools.exe`** — installs ALL VirtIO drivers (net/balloon/serial) **and** the **qemu-guest-agent** service. Confirm the *QEMU Guest Agent* service is **Running** (this is what reports the IP back to the portal).

### 10.4 cloudbase-init
Install the cloudbase-init MSI. Then edit
`C:\Program Files\Cloudbase Solutions\Cloudbase-Init\conf\cloudbase-init.conf` **and**
`cloudbase-init-unattend.conf` (the sysprep/specialize pass):
- **Datasource** must read the Proxmox drive — include the NoCloud/ConfigDrive service, e.g.
  `metadata_services=cloudbaseinit.metadata.services.nocloudservice.NoCloudConfigDriveService`.
- **Plugins** (`plugins=`): `SetHostNamePlugin`, `CreateUserPlugin` + `SetUserPasswordPlugin`,
  `NoCloudNetworkConfigPlugin` (network), and **`ExtendVolumesPlugin`** so `C:` grows to the cloned
  disk size (Windows' equivalent of Linux growpart — the Linux `growpart`/`resizefs` trick does NOT apply).
- `username=Admin` (the local account the portal's `cipassword` is set on); `first_logon_behaviour=no`
  so the injected password isn't force-changed at first logon.
- **Password complexity:** Windows enforces its own policy, so the portal's `cipassword` MUST be
  complex (upper + number + symbol) or `SetUserPassword` fails. The Create-User password policy already
  shipped matches this shape; ensure any seeded/default VM password is complex too.

### 10.5 Sysprep + seal
```
C:\Windows\System32\Sysprep\sysprep.exe /generalize /oobe /shutdown ^
  /unattend:"C:\Program Files\Cloudbase Solutions\Cloudbase-Init\conf\Unattend.xml"
```
(cloudbase-init ships that `Unattend.xml`; it hooks cloudbase-init into the specialize pass.) When the
VM **shuts down**, convert it: `qm template <vmid>` (use a VMID ≥ 9000).

### 10.6 Verify before publishing (mirrors §6)
Clone it, then:
```
qm clone <tpl> 990 --name win-verify
qm set 990 --ciuser Admin --cipassword 'Str0ng#Pass!' --ipconfig0 ip=dhcp --agent enabled=1
qm start 990
qm agent 990 network-get-interfaces      # must return an IPv4 → guest agent + cloudbase-init worked
# RDP to that IP as Admin / the cipassword. Then: qm stop 990 ; qm destroy 990 --purge
```

### 10.7 Faster path (optional)
For a reproducible, thesis-defensible build, there are **Packer + Proxmox** templates on GitHub that
automate "ISO → drivers → cloudbase-init → sysprep → template" end-to-end. Worth it if you'll rebuild;
the manual recipe above is fine for two templates.

---

## 11. All templates available across all tiers and environments (wiring)

**Catalogs are NOT tier-bound.** There is no per-catalog tier rule in the schema (the policy is a 5-way
allow-list: provider / node / tier / network / datastore — catalogs are admitted by **node residency**).
So a published catalog is automatically selectable with **every tier an environment allows** — you never
wire "catalog × tier" pairs. To make **every template usable in every environment at every tier**, each
environment's allow-list must include:
1. the **provider** + the **node(s)** the templates live on (a catalog only shows where its node is allowed), and
2. **all tiers**.

Then every catalog × every allowed tier works automatically. Build each OS template (Fedora / Ubuntu /
Windows) on the node(s) you want it available on, publish it as a catalog, and allow that node + the tiers
in each environment.

> **Windows vs the current tiers — a real constraint to resolve.** All current tiers are **40 GB disk**
> (Bronze 2c/2 GB, Silver 3c/4 GB, Gold 4c/5 GB). Windows Server/11 will **not** fit 40 GB and want
> ≥4 GB RAM. "Windows on all tiers" is allowed by the *policy* but will fail in *practice* on Bronze/40 GB.
> Either raise the Windows-eligible tiers' `disk_gb` (≥60 GB Server / ≥64 GB Win 11) and RAM, or accept
> that Windows is realistically a Silver/Gold offering. Linux templates are unaffected.
