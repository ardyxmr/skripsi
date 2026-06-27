# Bastion-Based Admin Access (`sysadmin`) for Provisioned VMs

How an administrator reaches every provisioned VM for OS-level troubleshooting **without a
shared password**: a dedicated `sysadmin` account on each VM that trusts one SSH **public** key,
whose **private** half lives only on the bastion (this app/worker VM).

This is the key-based alternative to baking a static password (e.g. `sysadmin/P@ssw0rd`) into the
templates. See the rationale in §1.

---

## 1. Why key-based via a bastion, not a shared password

A static, shared admin password baked into the golden templates ships the **same** credential on
**every** VM. One leak compromises the whole fleet, the value is brute-forceable over SSH (the
templates enable `ssh_pwauth: true` for the per-VM login user), and it contradicts the portal's
own design goal that, after the forced first-login reset, neither the admin nor the system knows a
VM's real password (see `template-preparation.md` §3 and the STRIDE model in
`12-security-threat-model.md`).

Key-based access fixes each of those:

| Property | Shared password | Bastion SSH key |
|----------|-----------------|-----------------|
| Secret distributed to every VM | the password itself | only the **public** key (not a secret) |
| Brute-forceable over SSH | yes | no (password login disabled for the account) |
| Revoke one admin | rotate on every VM | swap one public key, re-bake templates |
| Where the secret lives | every VM + every admin | one private key on the bastion |
| Auditable single entry point | no | yes (all hops transit the bastion) |

This mirrors a pattern the system already runs: the Stage 8 Ansible automation key is injected
into every VM via cloud-init, and its **private** half "stays on the worker, never copied into a
workspace" (`config/provisioning.php`, `ansible_*_key_path`). The `sysadmin` key uses the same
trust model for a human operator instead of the automation pipeline.

---

## 2. Architecture

```
 admin laptop ──ssh──▶ bastion (this app/worker VM) ──ssh -J──▶ sysadmin@<any provisioned VM>
                       holds sysadmin PRIVATE key            VM trusts sysadmin PUBLIC key
```

- **Bastion** = this app/worker VM. It already reaches the Proxmox API and the VM bridge network,
  so it is the natural single hop to every provisioned VM. The `sysadmin` private key lives here
  and nowhere else.
- **Every VM** carries a `sysadmin` account, created in the golden template, that trusts the
  bastion's public key and has passwordless `sudo`. Its password is locked, so the account cannot
  be password-brute-forced even though SSH password auth is on for the per-VM login user.
- **Per-VM login user** (`sysuser`, the cloud-init `ci_user`) is unchanged: temporary password,
  forced reset on first login. `sysadmin` is the separate, key-only operator account.

Why bake it into the template rather than inject at clone time: Proxmox cloud-init (via the
Terraform provider) exposes only `ciuser` / `cipassword` / `sshkeys`, and `sshkeys` targets the
**default** user (`sysuser`). A **separate** `sysadmin` account with its own `authorized_keys`
therefore has to exist in the image. Baking it once per golden template puts it on every clone.
A zero-rebake dynamic alternative is in the appendix (§7) as future work.

---

## 3. One-time bastion setup (on this app/worker VM)

Generate a dedicated admin keypair. Do **not** reuse the Ansible automation key — keep human
operator access and pipeline automation on separate, independently revocable keys.

```bash
# On the bastion (this VM), as the admin's own user:
ssh-keygen -t ed25519 -C "sysadmin-bastion" -f ~/.ssh/sysadmin_bastion
#   -> set a passphrase when prompted (recommended), or -N "" for none if scripted
chmod 600 ~/.ssh/sysadmin_bastion
chmod 644 ~/.ssh/sysadmin_bastion.pub
```

Add a convenience entry so one command hops through the bastion to any VM (run this on the
**admin's laptop**, not the bastion — replace the host/IP placeholders):

```sshconfig
# ~/.ssh/config on the admin laptop
Host bastion
    HostName <bastion-public-ip-or-name>
    User <your-bastion-login>

Host vm-*
    User sysadmin
    ProxyJump bastion
    IdentityFile ~/.ssh/sysadmin_bastion   # if the private key is on the laptop instead of the bastion
```

If the private key stays on the bastion (the stricter model), you SSH to the bastion first and run
`ssh sysadmin@<vm-ip>` from there. If you prefer one-hop from the laptop with the key never landing
on the VM, use `ProxyJump` with the private key on the laptop. Pick one and keep the private key in
exactly one place.

---

## 4. Bake `sysadmin` into a golden template

`virt-customize` runs on the **Proxmox host** (where the template disk lives), so the bastion's
public key must be copied there first.

```bash
# 1. Copy the bastion PUBLIC key to the Proxmox host:
scp ~/.ssh/sysadmin_bastion.pub root@<proxmox-host>:/tmp/sysadmin_bastion.pub
```

```bash
# 2. On the Proxmox host: confirm the template disk path (example uses Rocky template vmid 9000):
qm config 9000 | grep -E 'scsi0|virtio0'
#   -> e.g. scsi0: vmdata:base-9000-disk-0  =>  /dev/zvol/vmdata/base-9000-disk-0
```

```bash
# 3. On the Proxmox host: bake the account (template must be powered off).
DISK=/dev/zvol/vmdata/base-9000-disk-0        # adjust from step 2
virt-customize -a "$DISK" \
  --run-command 'id sysadmin >/dev/null 2>&1 || useradd -m -s /bin/bash sysadmin' \
  --run-command 'usermod -aG wheel sysadmin 2>/dev/null || usermod -aG sudo sysadmin 2>/dev/null || true' \
  --run-command 'install -d -m 700 /home/sysadmin/.ssh' \
  --upload /tmp/sysadmin_bastion.pub:/home/sysadmin/.ssh/authorized_keys \
  --run-command 'chmod 700 /home/sysadmin/.ssh && chmod 600 /home/sysadmin/.ssh/authorized_keys && chown -R sysadmin:sysadmin /home/sysadmin/.ssh' \
  --run-command 'printf "sysadmin ALL=(ALL) NOPASSWD:ALL\n" > /etc/sudoers.d/90-sysadmin && chmod 440 /etc/sudoers.d/90-sysadmin && visudo -cf /etc/sudoers.d/90-sysadmin' \
  --run-command 'passwd -l sysadmin' \
  --selinux-relabel
```

Notes:
- **`--selinux-relabel`** matters on Rocky / AlmaLinux / Fedora. Without a correct SELinux context
  on `/home/sysadmin/.ssh`, `sshd` refuses the key with `Permission denied (publickey)` and an
  `AVC` entry in `/var/log/audit/audit.log`. The flag relabels the filesystem so the new files get
  the right context. On Debian/Ubuntu (no SELinux) it is a harmless no-op.
- **Admin group** differs by distro: `wheel` on EL/Rocky/Fedora, `sudo` on Debian/Ubuntu. The line
  above tries `wheel` first, falls back to `sudo`, and ends in `|| true` so it always exits 0.
  **Do not** end the line on a bare `getent group sudo` (or any command that can fail): a non-zero
  exit on the *last* command of a `--run-command` makes `virt-customize` abort the whole run, so the
  later steps (authorized_keys, sudoers, password lock) never execute.
- **`passwd -l sysadmin`** locks the password → the account is key-only. SSH password auth stays on
  for `sysuser` (the portal login), but a locked password rejects every password attempt, so
  `sysadmin` cannot be brute-forced.
- **`visudo -cf`** validates the sudoers drop-in before the image is sealed; a malformed sudoers
  file can lock out `sudo` entirely.

---

## 5. Verify on a fresh clone

Provision one VM from the template through the portal, then:

```bash
# from the bastion (private key here):
ssh -o IdentitiesOnly=yes -i ~/.ssh/sysadmin_bastion sysadmin@<new-vm-ip> 'id && sudo -n id'
# expect: uid=1000(sysadmin) ... groups=...(wheel|sudo) ; then uid=0(root) from `sudo -n id`
```

Pass criteria: key login succeeds with **no password prompt**, and `sudo -n id` returns root
without a password. If it asks for a password or returns `Permission denied (publickey)`, see §6.

---

## 6. Operations

**Rotate the admin key** (periodic, or when a laptop is lost): generate a new keypair on the
bastion, re-run §4 on each golden template with the new `.pub`, then re-provision or push the new
`authorized_keys` to running VMs (e.g. via the existing Ansible path). Remove the old public key.

**Revoke one admin:** if each admin has their own key, drop that admin's public key line from the
template's `authorized_keys` and re-bake. With a single shared bastion key, rotate the key.

**Recovery if SSH is down** (network broken, sshd misconfigured): use the Proxmox **console**
(noVNC) and the per-VM `sysuser` credential, or reset from the host. The `sysadmin` key path does
not remove the existing console break-glass.

**Audit:** all operator access transits the bastion, so the bastion's `auth.log` /
`/var/log/secure` is the single chokepoint to monitor. This complements the portal's in-app audit
trail (which covers provisioning actions, not in-guest SSH).

### Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Permission denied (publickey)` on Rocky/EL | SELinux context wrong on `~/.ssh` | re-run §4 with `--selinux-relabel`, or on the VM: `restorecon -R -v /home/sysadmin/.ssh` |
| `Permission denied (publickey)` on any distro | wrong key, or perms not `700/600`, or owner not `sysadmin` | re-check §4 perms/owner; confirm `~/.ssh/sysadmin_bastion` matches the baked `.pub` |
| `sudo` prompts for a password | sudoers drop-in missing/invalid | confirm `/etc/sudoers.d/90-sysadmin` exists, `chmod 440`, passes `visudo -cf` |
| Login asks for a password instead of using the key | account password not locked, or `authorized_keys` absent | `passwd -l sysadmin`; verify the upload landed |

---

## 7. Apply to all templates

Repeat §4 for every golden template as it is built (Rocky 9 first; Fedora and Ubuntu when
imported). The command is distro-aware (the `getent` group guards), so it is the same for each.
Record completion next to each template in `template-preparation.md` §9.

---

## 8. Appendix — dynamic injection without re-baking (future work)

To rotate the admin key **without** re-baking every template, supply a full cloud-init user-data
snippet at clone time instead of baking the account. Proxmox supports
`--cicustom "user=<snippet-storage>:snippets/sysadmin.yml"`; the Terraform provider can set
`cicustom` per VM. A minimal snippet:

```yaml
#cloud-config
users:
  - default                       # keep the portal's ci_user (sysuser)
  - name: sysadmin
    groups: [wheel, sudo]
    sudo: "ALL=(ALL) NOPASSWD:ALL"
    lock_passwd: true
    ssh_authorized_keys:
      - ssh-ed25519 AAAA... sysadmin-bastion
```

Trade-off: rotating the key edits one snippet (no re-bake), but it requires a snippets-enabled
storage, a portal/Terraform change to set `cicustom`, and care that the snippet keeps `- default`
so the per-VM `sysuser` login still works. Validate against the running Proxmox + provider version
before adopting. Treated as future work; the baked approach in §4 is the path in use now.
