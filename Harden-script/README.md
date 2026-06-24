# Sample hardening playbook (`hardening.yml`)

A ready-to-upload Ansible playbook for the InfraProv **catalog hardening** feature.

## How to use
1. Settings → **Catalog** → edit a catalog (e.g. *Rocky Linux 9*) → **Hardening Versions** → enter a **Name** (e.g. "CIS Benchmark") + **Version** (e.g. "1.0") → **Choose file** `hardening.yml` → **Add Version**. (You can add multiple versions; retire old ones instead of deleting.)
2. Provision (or already have) a VM from that catalog. **It must be a VM created *after* the hardening feature shipped**, so it has the automation SSH key injected via cloud-init.
3. Inventory → the VM's **⋮** menu → **Run Hardening / Change version** → **pick a version** in the modal → submit. (Re-running the version already applied requires a "force re-harden" confirm. As a regular user it needs approval; managers/admins run immediately.)
4. Watch the drawer's **Security Hardening** status go Running → Success.

## What it does (10 idempotent, config-only points)
1. SSH: disable root login, key-only auth, sane auth/timeout limits
2. Lock the root account password
3. Login warning banner (+ wire into SSH)
4. Kernel/network `sysctl` hardening (rp_filter, syncookies, no redirects, ASLR…)
5. Password aging policy (`login.defs`)
6. Restrict `/etc/shadow` + `/etc/gshadow` permissions
7. Disable core dumps
8. Restrictive default `umask` (027)
9. Blacklist unused/risky kernel modules
10. Restrict `cron` to root

## Notes
- **Safe:** never disables the login user, sudo, or key-based SSH (so the portal can re-harden later).
- **No internet / no package installs** — pure config, runs on the Rocky 9 cloud image (and Debian/Ubuntu).
- It's a **starting sample** — adapt to your own baseline (e.g. CIS). Some settings (modprobe blacklist, password aging) fully apply after a reboot / on next password change.
- A single `.yml` is fine; you can also upload a `.tar.gz`/`.zip` bundle whose entrypoint is `site.yml`/`playbook.yml`/`main.yml`.
