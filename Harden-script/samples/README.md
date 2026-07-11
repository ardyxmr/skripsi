# ExoVirt — Sample Hardening Scripts

Two versions per template: **v1 = simple baseline** (disable root login, lock root,
SSH limits, banner — config only), **v2 = baseline + patching** (v1 plus package
updates and automatic security updates). Each script is idempotent and safe:
it never disables `sysuser`/`sysadmin`, sudo, or key-based SSH.

## Which file for which template

| Template | v1 (baseline) | v2 (+ patching) | Runs where |
|----------|---------------|-----------------|------------|
| **Rocky Linux** | `rhelfamily_v1_baseline.yml` | `rhelfamily_v2_patch.yml` | Portal Hardening button |
| **RHEL** | `rhelfamily_v1_baseline.yml` | `rhelfamily_v2_patch.yml` | Portal Hardening button |
| **Fedora** | `rhelfamily_v1_baseline.yml` | `rhelfamily_v2_patch.yml` | Portal Hardening button |
| **Ubuntu** | `ubuntu_v1_baseline.yml` | `ubuntu_v2_patch.yml` | Portal Hardening button |
| **Windows Server 2022** | `windows2022_v1_baseline.ps1` | `windows2022_v2_patch.ps1` | **Manual (RDP)** — see below |

> Rocky, RHEL, and Fedora all use `dnf`, so they share **one** RHEL-family pair —
> upload the same file to each of those three catalogs.

## How to use (Linux — Rocky / RHEL / Fedora / Ubuntu)

The portal runs these as Ansible over SSH (as `sysuser`, with sudo). In the portal:

1. Open the catalog for the template → **Hardening Playbook** section.
2. Upload the matching `*_v1_baseline.yml` → this becomes **Version 1**.
3. Upload the matching `*_v2_patch.yml` → this becomes **Version 2**.
4. On a VM created from that catalog, click **Hardening** and pick the version.
   The applied version is recorded on the VM (Inventory shows the hardened version).

- **v1** needs no internet (config only).
- **v2** needs internet (it reaches the distro repos to update packages).

## How to use (Windows Server 2022)

⚠️ **The portal Hardening button cannot harden Windows.** It connects with an SSH
key as `sysuser`, but the ExoVirt Windows image ignores `sshkeys` — Windows access
is **password-over-RDP**. So these are **PowerShell scripts you run manually**:

1. RDP into the VM as `sysuser` (it is in Administrators).
2. Open **PowerShell as Administrator**.
3. Run the script:
   ```powershell
   Set-ExecutionPolicy -Scope Process Bypass -Force
   .\windows2022_v1_baseline.ps1     # or windows2022_v2_patch.ps1
   ```
   (v2 needs internet and may require a reboot to finish updates.)

Alternatively, bake the v1 baseline into the golden image so every clone ships hardened.

## Customising

These are starting points, not a full CIS benchmark. Adjust package lists,
sysctl values, and the password policy to your own standard. The `PasswordAuthentication no`
line in the SSH drop-in is commented out on purpose — enable it only if every user
logs in with an SSH key, or you may lock `sysuser` out.
