# Golden Image — Windows Server 2022 (ISO build, cloudbase-init)

Windows has **no official cloud image** like the Linux distros, so you build the template **from an
ISO** and use **cloudbase-init** (the Windows port of cloud-init). cloudbase-init reads the **same
Proxmox cloud-init drive** the Linux templates use, so once it is installed the template clones through
the portal's existing Telmate pipeline (hostname / user / password / IP all injected). All commands run
**on the Proxmox host** unless marked *inside the VM*.

This doc is the **verified, shipped runbook** for `winserver2022` (VMID 9004), built 2026-07-06. Shared
concepts live in `template-preparation.md` §10 (Recipe C) + §11.

## Account model (how Windows maps to the Linux contract)

| Linux | Windows | Role |
|-------|---------|------|
| `sysuser` | `sysuser` | the login/owner user — portal injects it as `ciuser`, reveals its password in Inventory, users RDP with it |
| `root` (locked) | `Administrator` | built-in superuser — **kept enabled** with a baked password for OS troubleshooting, not for normal login |
| `sysadmin` (SSH key via bastion) | — | **not applicable**: `sshkeys` is ignored on Windows, admin access is password-over-RDP |

Two deliberate differences from the Linux contract, both documented here:
- **No forced first-login reset.** Windows RDP + NLA cannot do a clean forced password change at first
  logon (see §3). The security property comes from the portal's audited one-time password reveal, plus an
  optional **90-day rotation** policy (§5). Forcing a change at first login is **future work** (needs AD).
- **Administrator is enabled** with a known baked password (`P@ssw0rd` by default — memorable, changeable
  any time, admin/troubleshoot only). Only `sysuser` carries the per-VM security model.

## 0. Prerequisites

- On the node, in an ISO store (e.g. `local`, content **iso**):
  - **Windows Server 2022 evaluation ISO** (Server eval = 180 days, no activation blocker).
    > **Use Server 2022, not 2025.** The **Server 2025** eval media fails setup with *"Setup has failed to
    > validate the product key"* even after *"I don't have a product key"* + picking the eval edition, and the
    > `ei.cfg` remaster (xorriso) does not clear it (confirmed 2026-07-05). **Server 2022 eval installs cleanly**
    > via *"I don't have a product key"* → **Standard Evaluation (Desktop Experience)**. Every later step is identical.
  - **virtio-win ISO** (Fedora's signed VirtIO drivers) — Windows cannot see the VirtIO SCSI disk without it.
    Download: `https://fedorapeople.org/groups/virt/virtio-win/direct-downloads/stable-virtio/virtio-win.iso`
  - **cloudbase-init MSI** (`cloudbase.it`) — download inside the guest.
  - `pvesm list local --content iso` prints the exact ISO volume ids.
  - **ISOs go in `/var/lib/vz/template/iso/`** (the `local` store's iso content dir), not the qcow2 dir.
- A free **VMID ≥ 9000**. Jakarta sequence: Rocky 9000 / Ubuntu 9001 / Fedora 9002 / RHEL 9003 → **Windows Server 2022 = 9004** (use **9005** if you also build Windows 11).
- Target node = **Jakarta** (has `vmbr0` + `vmdata`).
- **Disk/tier**: the tiers are standardised to **≥60 GB** (Linux + Windows), so Windows fits every tier. `scsi0` is built at 60 GB; ExtendVolumes grows `C:` to the clone's tier size. Windows wants **≥4 GB RAM**.

## 1. Create the VM (q35 + UEFI + VirtIO)

Windows needs a modern chipset and UEFI. Same live-resize topology as the Linux templates (16 cores
built / 1 online vCPU / NUMA + hotplug) so the portal's Edit Resources works on clones.

```bash
VMID=9004
qm create $VMID --name winserver2022 \
  --machine q35 --bios ovmf \
  --efidisk0 vmdata:0,efitype=4m,pre-enrolled-keys=1 \
  --memory 4096 --sockets 1 --cores 16 --vcpus 1 --cpu host --numa 1 \
  --scsihw virtio-scsi-single --scsi0 vmdata:60 \
  --net0 virtio,bridge=vmbr0 \
  --ostype win11 --agent enabled=1 \
  --vga std \
  --hotplug disk,network,usb,cpu,memory \
  --ide0 local:iso/Windows_server_2022_EVAL_x64FRE_en-us.iso,media=cdrom \
  --ide1 local:iso/virtio-win.iso,media=cdrom \
  --boot order='ide0;scsi0'
qm start $VMID          # open the noVNC Console and run the installer
```

Why each setting:
- **`--machine q35 --bios ovmf` + `--efidisk0 …,pre-enrolled-keys=1`** — modern chipset + UEFI with the MS Secure Boot keys pre-enrolled (the signed virtio drivers boot fine under Secure Boot). On zfspool/lvm-thin, `vmdata:0` lets Proxmox size the EFI disk.
- **`--scsihw virtio-scsi-single --scsi0 vmdata:60`** — matches the portal stub (`scsi0`, virtio-scsi); 60 GB minimum.
- **`--ostype win11`** — the Proxmox ostype for Server 2022 / Win 11 (tunes timers/features).
- **`--vga std`** — the Windows installer renders on **VGA**, not serial.
- **`--sockets 1 --cores 16 --vcpus 1 --numa 1` + `--hotplug …,cpu,memory`** — built with 16 cores but 1 online vCPU; NUMA + hotplug let the portal raise vCPUs/RAM live. **Windows hot-ADDs vCPU + balloons RAM but does not hot-remove** — shrinking a clone needs a reboot.
- **Two CD drives** — `ide0` Windows ISO (boot), `ide1` virtio-win (driver load during install).

**Windows 11 only — add the extra gates** before `qm start`: `qm set $VMID --tpmstate0 vmdata:0,version=v2.0` (TPM 2.0; Secure Boot is already covered by the OVMF pre-enrolled keys).

## 2. Install Windows + drivers + RDP

*Inside the VM (noVNC Console):*
1. Boot the Windows ISO. At **"Where do you want to install Windows?"** the disk is missing → **Load driver** → browse the virtio-win CD → `vioscsi\2k22\amd64` → the SCSI disk appears. (If it stays hidden, untick *"Hide drivers that aren't compatible"*.)
2. At the product-key screen click **"I don't have a product key"** (do not leave it blank and press Next) → **Windows Server 2022 Standard Evaluation (Desktop Experience)** → Custom install → the disk → finish. First boot asks for the **Administrator** password (set `P@ssw0rd`; it is re-baked by the Unattend later anyway).
3. From the **virtio-win** CD run **`virtio-win-guest-tools.exe`** — installs all VirtIO drivers (net/balloon/serial) **and** the **QEMU Guest Agent** service. Confirm `services.msc` → **QEMU Guest Agent = Running** (this reports the clone's IP to the portal; without it, provisioning hangs at apply with no IP). Network comes up once the net driver is installed.
4. Enable Remote Desktop (baked so every clone is reachable):
   ```powershell
   Set-ItemProperty -Path 'HKLM:\System\CurrentControlSet\Control\Terminal Server' -Name fDenyTSConnections -Value 0
   Enable-NetFirewallRule -DisplayGroup "Remote Desktop"
   ```

## 3. Install + configure cloudbase-init

Install the cloudbase-init MSI. On its config page set **Username = `sysuser`**, Group = `Administrators`,
Run as LocalSystem. **⚠️ On the final page UNCHECK "Run Sysprep" and "Shutdown when Sysprep terminates"** —
you must edit the config first (leaving it checked syspreps with the default config).

Then put the **same `[DEFAULT]`** in BOTH `cloudbase-init.conf` and `cloudbase-init-unattend.conf` under
`C:\Program Files\Cloudbase Solutions\Cloudbase-Init\conf\`:

```ini
[DEFAULT]
username=sysuser
groups=Administrators
inject_user_password=true
first_logon_behaviour=no
metadata_services=cloudbaseinit.metadata.services.configdrive.ConfigDriveService,cloudbaseinit.metadata.services.nocloudservice.NoCloudConfigDriveService
plugins=cloudbaseinit.plugins.common.mtu.MTUPlugin,cloudbaseinit.plugins.common.sethostname.SetHostNamePlugin,cloudbaseinit.plugins.windows.createuser.CreateUserPlugin,cloudbaseinit.plugins.common.setuserpassword.SetUserPasswordPlugin,cloudbaseinit.plugins.common.networkconfig.NetworkConfigPlugin,cloudbaseinit.plugins.windows.extendvolumes.ExtendVolumesPlugin,cloudbaseinit.plugins.common.userdata.UserDataPlugin
allow_reboot=false
log-dir=C:\Program Files\Cloudbase Solutions\Cloudbase-Init\log\
log-file=cloudbase-init.log
```

What matters:
- **`username=sysuser`** pins the created login account to the portal's `ciuser` (`PROVISION_CI_USER=sysuser`). `SetUserPasswordPlugin` sets the injected `cipassword` on it.
- **`first_logon_behaviour=no`** — no forced reset. `clear_text_injected_only` *would* set "must change at next logon", but with **NLA on** the RDP client refuses the change (*"You must change your password before logging on"*, no change dialog) and pushes the user to the Proxmox console, breaking self-service. So the base does no forced reset; see §5 for the optional rotation policy. Keep **NLA on** (`UserAuthentication=1`).
- **`metadata_services` starts with `ConfigDriveService`** — Proxmox defaults a **Windows** VM's cloud-init drive to `citype=configdrive2`, so `ConfigDriveService` is the one that matches (log: `Config Drive found on E:\ ... Metadata service loaded: 'ConfigDriveService'`). Keep `NoCloudConfigDriveService` too as a fallback.
- **`ExtendVolumesPlugin`** grows `C:` to the cloned disk size (the Windows equivalent of Linux growpart).
- **`log-dir`/`log-file`** — the old `logdir`/`logfile` keys still work but log a "deprecated" warning.
- **Password complexity:** the portal's `cipassword` must be complex (upper/lower/number/symbol) or `SetUserPassword` fails. `Str0ng#Pass1!` is a good verify value.
- Two **benign** log lines on clones: `CreateUserPlugin ... Cannot create a user logon session ... password is incorrect` (SetUserPassword fixes it right after — RDP still works) and `Skipping password reset ... LocalSystem` (that is the service account, not `sysuser`).

## 4. Unattend.xml — keep the built-in Administrator painless

`sysprep /generalize /oobe` otherwise prompts to set the Administrator password on every clone. Give
cloudbase-init's `Unattend.xml` an `oobeSystem` pass that bakes the Administrator password and skips OOBE,
a `generalize` pass with `SkipRearm=1` (so repeated generalize does not hit the rearm limit), and keep the
`specialize` `RunSynchronous` that launches cloudbase-init. Representative shape:

```xml
<unattend xmlns="urn:schemas-microsoft-com:unattend">
  <settings pass="generalize">
    <component name="Microsoft-Windows-PnpSysprep" ...><PersistAllDeviceInstalls>true</PersistAllDeviceInstalls></component>
    <component name="Microsoft-Windows-Security-SPP" ...><SkipRearm>1</SkipRearm></component>
  </settings>
  <settings pass="specialize">
    <component name="Microsoft-Windows-Deployment" ...>
      <RunSynchronous><RunSynchronousCommand><Order>1</Order>
        <Path>cmd.exe /c ""C:\Program Files\Cloudbase Solutions\Cloudbase-Init\Python\Scripts\cloudbase-init.exe" --config-file "...\cloudbase-init-unattend.conf""</Path>
      </RunSynchronousCommand></RunSynchronous>
    </component>
  </settings>
  <settings pass="oobeSystem">
    <component name="Microsoft-Windows-Shell-Setup" ...>
      <UserAccounts><AdministratorPassword><Value>P@ssw0rd</Value><PlainText>true</PlainText></AdministratorPassword></UserAccounts>
      <OOBE><HideEULAPage>true</HideEULAPage><SkipMachineOOBE>true</SkipMachineOOBE><SkipUserOOBE>true</SkipUserOOBE></OOBE>
    </component>
  </settings>
</unattend>
```

- **Do NOT set a `legalnotice*` login banner.** It shows for *every* user (including Administrator) at every logon and never clears. The built-in per-account expiry popup (§5) is the right nudge instead.
- Administrator stays enabled with the baked `P@ssw0rd` — admin/troubleshoot only, changeable any time.

## 5. Optional: 90-day password rotation (baked scheduled task)

Rotate `sysuser`'s password every 90 days, exempt `Administrator`. **Do not run this from a cloudbase-init
LocalScript** — cloudbase-init's boot-time context is flaky for `Set-LocalUser`/`schtasks` (succeeds on some
clones, fails silently on others). Instead **bake a scheduled task** (created interactively = reliable,
survives sysprep) that runs a small idempotent script every 2 minutes.

*Inside the VM:*
```powershell
New-Item -ItemType Directory -Path 'C:\CloudInit' -Force | Out-Null
$pw = @'
$ErrorActionPreference = 'SilentlyContinue'
$u = Get-LocalUser -Name 'sysuser'
if (-not $u) { return }
net accounts /maxpwage:90 | Out-Null
Set-LocalUser -Name 'sysuser' -PasswordNeverExpires $false
$a = [ADSI]"WinNT://./Administrator,user"
$a.UserFlags = $a.UserFlags.Value -bor 0x10000
$a.SetInfo()
'@
Set-Content 'C:\CloudInit\pwpolicy.ps1' -Value $pw -Encoding ASCII

schtasks /create /tn PortalPwPolicy /tr "powershell -NonInteractive -NoProfile -ExecutionPolicy Bypass -File C:\CloudInit\pwpolicy.ps1" /sc minute /mo 2 /ru SYSTEM /rl HIGHEST /f
```

Two hard-won gotchas baked into that script:
- **`Set-LocalUser -PasswordNeverExpires $true` fails silently here** (while `$false` works). Set "never
  expire" via **ADSI** instead: `$a.UserFlags -bor 0x10000` (DONT_EXPIRE_PASSWD); use `-band (-bnot 0x10000)` to clear it.
- Keep the script **idempotent with no state machine.** An earlier "force-once-then-never-expire" design used
  a `pending→armed→done` state machine that compared `PasswordLastSet.Ticks`; the tick read varied slightly
  between runs so it stuck in `pending` forever and never ran `net accounts`. The idempotent version cannot get
  stuck. "Force change once, then stop nagging" for a **local** account is **future work** (clean detection of a
  password change needs AD/domain).

## 6. Sysprep + seal

The clean base was built by **strip-and-reseal**: take a working VM, delete experiment scripts/tasks/registry
markers, delete the test `sysuser`, then sysprep. Verify it is clean before sealing (no leftover tasks,
`C:\CloudInit` only holds `pwpolicy.ps1`, `first_logon_behaviour=no`, Administrator password baked, NLA=1).

```powershell
& "C:\Windows\System32\Sysprep\sysprep.exe" /generalize /oobe /shutdown /unattend:"C:\Program Files\Cloudbase Solutions\Cloudbase-Init\conf\Unattend.xml"
```

When the VM shuts down, on the node add the cloud-init drive and convert to a template:
```bash
qm set 9004 --ide0 none --ide1 none          # remove install media (if still attached)
qm set 9004 --ide2 vmdata:cloudinit --boot order=scsi0
qm template 9004
```

## 7. Verify BEFORE publishing

```bash
qm clone 9004 990 --name win-verify --full
qm set 990 --ciuser sysuser --cipassword 'Str0ng#Pass1!' --ipconfig0 ip=dhcp --agent enabled=1
qm resize 990 scsi0 64G
qm start 990 ; sleep 180        # Windows boots slower + runs a specialize pass
qm agent 990 network-get-interfaces      # returns a real IPv4 → guest agent + cloudbase-init worked
```

RDP to that IP:
- **`sysuser`** / `Str0ng#Pass1!` logs in (no forced reset). `C:` grew to 64 GB (ExtendVolumes).
- **`Administrator`** / `P@ssw0rd` logs in, no OOBE prompt.
- If the 90-day policy is baked, wait ~3 min (the task fires every 2 min) then `net user sysuser` shows expiry ~90 days out and `net user Administrator` shows **Never**.

Clean up: `qm stop 990 ; qm destroy 990 --purge`.

## 8. What this template carries (the portal contract)

- [ ] **`sysuser`** local-admin login created per clone from the portal's `ciuser`
- [ ] **`cipassword`** injected onto `sysuser`; **no forced reset** (documented Windows exception; portal one-time reveal is the security property)
- [ ] **`Administrator`** enabled with a baked password (troubleshoot account), OOBE skipped
- [ ] **QEMU Guest Agent** running (from virtio-win-guest-tools) so the portal gets the IP
- [ ] **VirtIO drivers** (scsi/net/balloon) so the clone sees its disk + NIC
- [ ] **ExtendVolumes** grows `C:` to the requested tier size on first boot
- [ ] **ConfigDrive** datasource reading the Proxmox `ide2` cloud-init drive (`citype=configdrive2`)
- [ ] **RDP enabled**, NLA on
- [ ] Optional: **90-day rotation** via the baked `PortalPwPolicy` task
- [ ] **Unique identity** per clone (sysprep `/generalize`)

## 9. Windows-specific notes + gotchas

- **Server 2025 eval product-key bug** → build on **Server 2022 eval** (§0).
- **cloudbase-init MSI**: uncheck "Run Sysprep" on the final page (§3).
- **Password policy via a baked scheduled task**, never a cloudbase-init LocalScript (flaky boot context) (§5).
- **`Set-LocalUser -PasswordNeverExpires $true` fails** → ADSI `UserFlags -bor 0x10000` (§5).
- **Forced first-login reset = future work** (needs AD; local-account change-detection is too fragile).
- **No key-based `sysadmin`** — `sshkeys` ignored; admin is password-over-RDP via `Administrator`.
- **Activation**: evaluation editions (Server 180-day) — note as a thesis limitation.
- **Live resize**: Windows hot-ADDs vCPU + balloons RAM, no hot-remove (reboot to shrink).
- **Windows 11 extras**: TPM 2.0 + Secure Boot (§1); build as VMID 9005.

## 10. Faster path (optional)

For a reproducible build there are **Packer + Proxmox** templates that automate "ISO → drivers →
cloudbase-init → sysprep → template". Worth it for rebuilds; the manual recipe above is fine for one or two.

See also: `template-preparation.md` (§10 Recipe C + §11 all-templates-all-tiers wiring),
`golden-image-ubuntu.md` (Linux master runbook + delta table), `golden-image-fedora.md`,
`golden-image-rhel.md`, `golden-image-rocky.md`, `bastion-sysadmin-access.md`.
