# Golden Image — Windows Server 2025 (ISO build, cloudbase-init)

Windows has **no official cloud image** like the Linux distros, so you build the template **from an
ISO** and use **cloudbase-init** (the Windows port of cloud-init) instead of cloud-init. cloudbase-init
reads the **same Proxmox cloud-init drive** the Linux templates use, so once it is installed correctly
the template clones through the portal's existing Telmate pipeline (hostname / user / password / IP all
injected). All commands run **on the Proxmox host** unless marked *inside the VM*.

The template carries the same **portal contract** as the Linux images (login user from the portal's
`ciuser` = `sysuser`, one-time password + forced first-login reset, guest agent for the IP), but the
mechanisms differ: cloudbase-init instead of cloud-init, ExtendVolumes instead of growpart, RDP instead
of SSH, and a few real constraints in **§6 you must decide before publishing**. Shared concepts live in
`template-preparation.md` §10 (Recipe C) + §11.

> **`sshkeys` is ignored on Windows.** Windows logs in by **password over RDP**, so the bastion
> key-based `sysadmin` model (`bastion-sysadmin-access.md`) does **not** apply here. See §6.

## 0. Prerequisites

- On the node, in an ISO-capable store (e.g. `local`, content **iso**):
  - **Windows Server ISO** — use the **evaluation** edition (Server eval = 180 days) so activation is not a blocker. Note it as a thesis limitation. (Win 11 Enterprise eval for the desktop build — see the Win 11 deltas below.)
    > **Prefer Server 2022 eval over Server 2025 eval.** The **Server 2025** evaluation media has a setup bug that fails with *"Setup has failed to validate the product key"* even after clicking "I don't have a product key" and selecting the eval edition (confirmed 2026-07-05; the `ei.cfg` remaster workaround also did not clear it). **Server 2022 eval installs cleanly** via "I don't have a product key" → *Standard Evaluation (Desktop Experience)*. `--ostype win11` and every later step (virtio, cloudbase-init, sysprep) are identical for 2022.
  - **virtio-win ISO** (Fedora's signed VirtIO driver ISO) — Windows cannot see a VirtIO SCSI disk without it.
  - **cloudbase-init MSI** (`cloudbase.it`) — download it inside the guest, or slipstream it.
  - `pvesm list local --content iso` prints the exact ISO volume ids if you are unsure of the filenames.
- A free **VMID ≥ 9000**. Jakarta sequence: Rocky 9000 / Ubuntu 9001 / Fedora 9002 / RHEL 9003 → this doc uses **9004** for Windows Server (use **9005** if you also build Windows 11).
- Target node = **Jakarta** (has `vmbr0` + `vmdata`).
- **Decide the tier/disk story first (§6).** Windows will **not** fit the current 40 GB tiers.

## 1. Create the VM (q35 + UEFI + VirtIO)

Windows needs a modern chipset and UEFI. Same live-resize topology as the Linux templates (16-core
built / 1 online vCPU / NUMA + hotplug) so the portal's Edit Resources works on clones.

```bash
VMID=9004
qm create $VMID --name winserver2025 \
  --machine q35 --bios ovmf \
  --efidisk0 vmdata:0,efitype=4m,pre-enrolled-keys=1 \
  --memory 4096 --sockets 1 --cores 16 --vcpus 1 --cpu host --numa 1 \
  --scsihw virtio-scsi-single --scsi0 vmdata:60 \
  --net0 virtio,bridge=vmbr0 \
  --ostype win11 --agent enabled=1 \
  --vga std \
  --hotplug disk,network,usb,cpu,memory \
  --ide0 local:iso/Windows-Server-2025-eval.iso,media=cdrom \
  --ide1 local:iso/virtio-win.iso,media=cdrom \
  --boot order='ide0;scsi0'
qm start $VMID          # open the noVNC Console and run the installer
```

Why each setting:
- **`--machine q35 --bios ovmf` + `--efidisk0 …,pre-enrolled-keys=1`** — modern chipset + UEFI with the MS Secure Boot keys pre-enrolled (required for Win 11, recommended for Server; the signed virtio drivers boot fine under Secure Boot). On zfspool/lvm-thin, `vmdata:0` lets Proxmox size the EFI disk.
- **`--scsihw virtio-scsi-single --scsi0 vmdata:60`** — matches the portal stub (`scsi0`, virtio-scsi). **60 GB minimum** for Server (64 GB for Win 11) — 40 GB will not install (see §6).
- **`--net0 virtio`** — matches the stub; the driver comes from virtio-win.
- **`--ostype win11`** — the Proxmox ostype for Server 2025 / Win 11 (tunes the timers/features).
- **`--vga std`** — the Windows installer renders on **VGA**, not serial (unlike the Linux cloud images, which use `serial0`).
- **`--sockets 1 --cores 16 --vcpus 1 --numa 1` + `--hotplug …,cpu,memory`** — built with 16 cores but 1 online vCPU; NUMA + hotplug let the portal raise vCPUs/RAM live. **Windows caveat:** Windows supports **hot-ADD** of vCPU and (ballooned) RAM but **not hot-remove** — shrinking a clone needs a reboot.
- **Two CD drives** — `ide0` Windows ISO (boot), `ide1` virtio-win (driver load during install).

**Windows 11 only — add the extra hardware gates** before `qm start`:
```bash
qm set $VMID --tpmstate0 vmdata:0,version=v2.0     # TPM 2.0 (required for Win 11)
# Secure Boot is already covered by the OVMF pre-enrolled keys above.
```

## 2. Install Windows + load the VirtIO driver

*Inside the VM (noVNC Console):*
1. Boot the Windows ISO. At **"Where do you want to install Windows?"** the disk is missing (no VirtIO driver yet) → **Load driver** → browse the virtio-win CD → `vioscsi\<win-ver>\amd64` → the SCSI disk appears.
2. Finish the install and boot to the desktop.
3. From the **virtio-win** CD run **`virtio-win-guest-tools.exe`** — installs **all** VirtIO drivers (net / balloon / serial) **and** the **qemu-guest-agent** service. Confirm the **QEMU Guest Agent** service is **Running** (`services.msc`) — this is what reports the clone's IP back to the portal; without it, provisioning hangs at apply with the VM Active but no IP.

## 3. Install + configure cloudbase-init

*Inside the VM:* install the cloudbase-init MSI, then edit **both**
`C:\Program Files\Cloudbase Solutions\Cloudbase-Init\conf\cloudbase-init.conf` **and**
`cloudbase-init-unattend.conf` (the sysprep/specialize pass) so they read the Proxmox drive and honour
the portal contract. Representative `[DEFAULT]` block (confirm the exact plugin module paths against
your cloudbase-init version's sample conf):

```ini
[DEFAULT]
username=sysuser
groups=Administrators
inject_user_password=true
first_logon_behaviour=clear_text_injected_only
metadata_services=cloudbaseinit.metadata.services.nocloudservice.NoCloudConfigDriveService
plugins=cloudbaseinit.plugins.common.sethostname.SetHostNamePlugin,
        cloudbaseinit.plugins.windows.createuser.CreateUserPlugin,
        cloudbaseinit.plugins.common.setuserpassword.SetUserPasswordPlugin,
        cloudbaseinit.plugins.common.networkconfig.NetworkConfigPlugin,
        cloudbaseinit.plugins.windows.extendvolumes.ExtendVolumesPlugin,
        cloudbaseinit.plugins.common.userdata.UserDataPlugin
allow_reboot=false
```

What matters:
- **`username=sysuser`** — pin it to the portal's `ciuser` (`PROVISION_CI_USER=sysuser`) so the created login account matches what Inventory shows. `groups=Administrators` makes it a local admin. `SetUserPasswordPlugin` sets the injected `cipassword` on that account.
- **`metadata_services=…NoCloudConfigDriveService`** — reads the Proxmox cloud-init drive on `ide2`.
- **`ExtendVolumesPlugin`** — grows `C:` to the cloned disk size. **This is the Windows equivalent of Linux growpart** — the `growpart`/`resizefs` trick does not apply.
- **`first_logon_behaviour=clear_text_injected_only`** — **forces the one-time password change on first logon**, the same one-time-credential contract as the Linux templates (the portal-issued password is temporary; the user sets their own and the portal never learns it). **RDP + NLA caveat — read §6** before committing to this; if the RDP change-at-logon flow is too clunky in your lab, fall back to `first_logon_behaviour=no`.
- **Network** is DHCP by default (the portal always uses DHCP), so `NetworkConfigPlugin` is only exercised for static IPs; leaving it in is harmless.
- **Password complexity:** Windows enforces its own policy, so the portal's `cipassword` **must** be complex (upper + lower + number + symbol) or `SetUserPassword` fails. The Create-User password policy already ships this shape; make sure any seeded/default VM password is complex too.

## 4. Sysprep + seal

*Inside the VM* — generalize with cloudbase-init hooked into the specialize pass (it ships the
`Unattend.xml`):

```
C:\Windows\System32\Sysprep\sysprep.exe /generalize /oobe /shutdown ^
  /unattend:"C:\Program Files\Cloudbase Solutions\Cloudbase-Init\conf\Unattend.xml"
```

When the VM **shuts down**, on the node: drop the install media, add the cloud-init drive, and convert
to a template.

```bash
qm set $VMID --ide0 none --ide1 none          # remove the Windows + virtio-win CDs
qm set $VMID --ide2 vmdata:cloudinit --boot order=scsi0
qm template $VMID
```

## 5. Verify BEFORE publishing

Smoke-test a clone the way the portal will use it (the portal injects `ciuser=sysuser`). Windows boots
slower than the Linux images and runs a sysprep specialize pass, so give it longer.

```bash
qm clone $VMID 990 --name win-verify --full
qm set 990 --ciuser sysuser --cipassword 'Str0ng#Pass1!' --ipconfig0 ip=dhcp --agent enabled=1
qm resize 990 scsi0 64G          # confirms ExtendVolumes grows C: on first boot
qm start 990
sleep 120
qm agent 990 network-get-interfaces      # returns a real IPv4 → guest agent + cloudbase-init worked
```

Then RDP to that IP as **`sysuser`** / the `cipassword`:
- **Forced first-login reset:** with `first_logon_behaviour=clear_text_injected_only`, RDP prompts to change the password at logon (see the §6 NLA caveat if it does not).
- Confirm `C:` grew to 64 GB (This PC → the system drive), proving ExtendVolumes ran.

Clean up: `qm stop 990 ; qm destroy 990 --purge`.

## 6. Windows-specific notes (the real decisions)

- **Tier / disk — decide first.** All current tiers are **40 GB** (Bronze 2c/2 GB, Silver 3c/4 GB, Gold 4c/5 GB). Windows Server/11 will **not** fit 40 GB and wants **≥4 GB RAM**. "Windows on all tiers" is allowed by the *policy* (catalogs are node-bound, not tier-bound) but fails in *practice* on Bronze/40 GB. **Recommendation:** raise the Windows-eligible tiers' `disk_gb` (≥60 GB Server / ≥64 GB Win 11) and RAM, or accept that **Windows is realistically a Silver/Gold offering**. Linux templates are unaffected.
- **Forced reset + RDP/NLA caveat.** `clear_text_injected_only` sets *"user must change password at next logon"*, but with **Network Level Authentication** on, the built-in `mstsc` client can refuse the expired-password change (it wants valid creds before it will open the session). If you hit that: use an RDP path that supports change-at-logon (RD Web / a client with NLA off), or temporarily disable NLA on the template, or fall back to **`first_logon_behaviour=no`** and document Windows as a known exception to the one-time-credential contract (the user changes the password manually after logging in). The Linux forced-reset contract is unaffected.
- **No key-based `sysadmin`.** `sshkeys` is ignored; Windows admin access is by password over RDP. For OS troubleshooting, use the local admin account. A WinRM- or OpenSSH-for-Windows key-based path is **Future Work**, parallel to the Linux bastion model.

## 6b. Verified real-world build (Windows Server 2022, 2026-07-06)

The theory above works, but the actual build surfaced several things worth pinning down. This is the
**verified, shipped configuration** for the `winserver2022-base` template (VMID 9004).

**Use Server 2022 eval, not 2025.** Server 2025 evaluation media fails setup with *"Setup has failed to
validate the product key"* even after clicking "I don't have a product key" and picking the eval edition —
and the `ei.cfg` remaster workaround does not clear it. Server 2022 eval installs cleanly: *"I don't have a
product key"* → **Standard Evaluation (Desktop Experience)**.

**cloudbase-init config that actually works on Proxmox** (put the same `[DEFAULT]` in BOTH
`cloudbase-init.conf` and `cloudbase-init-unattend.conf`):
- `username=sysuser`, `groups=Administrators`, `inject_user_password=true`
- **`first_logon_behaviour=no`** — NOT `clear_text_injected_only`. Windows RDP + NLA cannot do a forced
  password change at first logon cleanly (the client refuses with *"You must change your password before
  logging on"* and offers no change dialog), which would force the user to the Proxmox console and break
  self-service. So the base does **no** forced reset; the security property comes from the portal's audited
  one-time password reveal. (An optional 3-day expiry policy is a separate add-on — below.)
- `metadata_services=cloudbaseinit.metadata.services.configdrive.ConfigDriveService,cloudbaseinit.metadata.services.nocloudservice.NoCloudConfigDriveService`
  — Proxmox defaults a **Windows** VM's cloud-init drive to `citype=configdrive2`, so **`ConfigDriveService`**
  is the one that matches (log: `Config Drive found on E:\ ... Metadata service loaded: 'ConfigDriveService'`).
- plugins include `...extendvolumes.ExtendVolumesPlugin` (grows `C:`).
- use **`log-dir` / `log-file`** (the old `logdir`/`logfile` still work but warn "deprecated").

**Unattend.xml — make the built-in Administrator painless.** `sysprep /generalize /oobe` otherwise prompts
to set the Administrator password on every clone. Add an `oobeSystem` pass with
`<UserAccounts><AdministratorPassword>` (a baked password) + `<OOBE><SkipMachineOOBE/><SkipUserOOBE/>`, plus a
`generalize` pass `Microsoft-Windows-Security-SPP` `<SkipRearm>1</SkipRearm>` so repeated generalize does not
hit the rearm limit. Keep the `specialize` `RunSynchronous` that launches cloudbase-init. Administrator stays
enabled with a known password for OS troubleshooting (only `sysuser` carries the per-VM security model).
**Do NOT set a `legalnotice*` login banner** — it shows for *every* user (including Administrator) at every
logon and never clears; the built-in per-account expiry popup is the right nudge instead. Keep **NLA on**
(`UserAuthentication=1`) since we are not forcing a reset.

**Build via strip-and-reseal; keep a clean base.** Rather than reinstalling, the clean base was made by
stripping an existing working VM (delete experiment scripts/tasks/registry markers, `net accounts
/maxpwage:unlimited`, delete the test `sysuser`) then sysprep. **Keep the clean base untouched and clone
from it** to experiment.

### Optional: 3-day password-expiry policy (developed on a clone, NOT baked into the base)

Goal: force the user to change the temporary password within 3 days, then stop nagging. Two hard lessons:
- **cloudbase-init's boot-time context is flaky for `Set-LocalUser` and `schtasks /create`** — succeeds on
  some clones, fails silently on others. So the policy must **not** run from a cloudbase-init LocalScript.
  Instead **bake a scheduled task** (created interactively = reliable, survives sysprep) that runs a
  self-initialising script every 2 minutes.
- **`Set-LocalUser -PasswordNeverExpires $true` fails silently here** (while `$false` works). Use **ADSI**:
  ```powershell
  $a = [ADSI]"WinNT://./sysuser,user"
  $a.UserFlags = $a.UserFlags.Value -bor 0x10000    # set DONT_EXPIRE_PASSWD (never expire)
  # -band (-bnot 0x10000) to clear it (allow expiry)
  $a.SetInfo()
  ```
The baked task walks a small state machine in `HKLM\SOFTWARE\PortalPwPolicy`: wait for `sysuser` → record its
initial `PasswordLastSet` (Ticks) and set `net accounts /maxpwage:3` + `sysuser` expiring + `Administrator`
never-expiring → when `sysuser`'s `PasswordLastSet` moves past the recorded value (user changed it) → set
`sysuser` never-expiring. Result: "expires in 3 days, then free once changed", with the change done over RDP
during the grace window (no console needed). The task auto-fires reliably; the flaky part was only the
cloudbase-init route, which this avoids.
- **ExtendVolumes, not growpart** — the boot-disk grow is done by cloudbase-init's `ExtendVolumesPlugin` (§3), not the Linux cloud-init growpart.
- **Live resize.** The 16-core/1-vCPU/NUMA/hotplug topology gives the portal's Edit Resources; Windows hot-**adds** vCPU and balloons RAM but does **not** hot-remove — shrinking needs a reboot.
- **Activation.** Evaluation editions (Server 180-day / Win 11 Enterprise eval) — note this as a thesis limitation.
- **Windows 11 extra gates.** TPM 2.0 (`--tpmstate0 vmdata:0,version=v2.0`) + Secure Boot (OVMF pre-enrolled keys) — both set in §1.

## 7. What this template carries (the portal contract)

- [ ] **`sysuser`** local-admin login created per clone from the portal's `ciuser` (cloudbase-init `username=sysuser`)
- [ ] **`cipassword`** injected onto `sysuser`; **forced first-login change** via `first_logon_behaviour=clear_text_injected_only` (see the §6 RDP/NLA caveat)
- [ ] **qemu-guest-agent** installed + running (from virtio-win-guest-tools) so the portal gets the IP
- [ ] **VirtIO drivers** (scsi/net/balloon) so the clone sees its disk + NIC
- [ ] **ExtendVolumes** grows `C:` to the requested tier size on first boot
- [ ] **NoCloud/ConfigDrive** datasource reading the Proxmox `ide2` cloud-init drive
- [ ] **Unique identity** per clone (sysprep `/generalize`)

## 8. Faster path (optional)

For a reproducible, thesis-defensible build there are **Packer + Proxmox** templates on GitHub that
automate "ISO → drivers → cloudbase-init → sysprep → template" end-to-end. Worth it if you will rebuild;
the manual recipe above is fine for one or two templates.

See also: `template-preparation.md` (§10 Recipe C source + §11 all-templates-all-tiers wiring),
`golden-image-ubuntu.md` (Linux master runbook + delta table), `golden-image-fedora.md`,
`golden-image-rhel.md`, `golden-image-rocky.md`, `bastion-sysadmin-access.md`.
