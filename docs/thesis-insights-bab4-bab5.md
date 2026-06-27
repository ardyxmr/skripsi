# Thesis Insights — Bab IV & Bab V Alignment

Working evidence log from the 2026-06-27 implementation session, mapped to the **correct chapter**
per the university standard:

- **Bab IV — Implementasi dan Pengujian** (Implementation & Testing): what was built and the test
  results that show it works.
- **Bab V — Kesimpulan dan Saran** (Conclusion & Suggestions / Future Work): limitations observed
  during development and the recommendations they justify.

These are source notes for the eventual chapter prose (Task B, on standby), not the final text.
Cross-references: `docs/template-preparation.md` §3/§9, `docs/bastion-sysadmin-access.md`.

---

## Bab IV — Implementasi dan Pengujian

### IV.A — Forced first-login password reset (validated)

**Implementation.** Each Linux golden template carries two cloud-init drop-ins: `99-pwauth.cfg`
(`ssh_pwauth: true`, so the portal's password login is accepted) and `99-pwexpire.cfg`
(`runcmd: chage -d 0 sysuser`). The portal generates a unique per-VM password, stores it encrypted,
and reveals it self-service through an audited endpoint. The `chage -d 0` sets the account's shadow
last-change date to 0, after which PAM forces a password change at the next login.

**Why `runcmd: chage -d 0`, not `chpasswd: { expire: true }`.** The first attempt used cloud-init's
`chpasswd: { expire: true }`. A fresh clone logged straight in without any prompt: Proxmox's own
cloud-init sets the injected `cipassword` without expiry and overrides the template's `chpasswd`
directive. The `chage -d 0` approach sidesteps the `chpasswd` module entirely and runs once per
instance in cloud-init's final stage, after the password is set.

**Test result (PASS).** On a fresh clone provisioned through the portal (Rocky Linux 9, vmid 85,
IP 192.168.200.216), the first SSH login as `sysuser` produced *"You are required to change your
password immediately (administrator enforced) … your password has expired. You must change your
password now and login again."* with no manual step. After the user set a new password, the
re-login succeeded. The mechanism makes the portal-issued password a genuine one-time credential:
after the first login, neither the administrator nor the system knows the user's password.

### IV.B — OS-level password-strength enforcement (validated)

**Empirical result.** During the same forced-reset test, the Rocky 9 `pwquality` module **rejected
the literal `P@ssw0rd`** with *"BAD PASSWORD: the password fails the dictionary check — it is based
on a dictionary word."* The same prompt accepted a stronger value (`d3Hgtwhr!`). This is an
independent, operating-system-level control, separate from the application layer.

**Significance for the architecture.** This result is direct evidence for the decision to give the
administrative `sysadmin` account **key-based access with no password** rather than a shared static
password. The very literal that a shared-password design would have baked into every VM is rejected
by the guest OS as too weak to even set. Key-based access removes the shared-secret class of risk
entirely: the public key is distributed to the fleet, the private key stays on one bastion, and the
account's password is locked. The empirical `pwquality` rejection turns that architectural choice
from a preference into a validated requirement.

---

## Bab V — Kesimpulan dan Saran (Saran / Pekerjaan di Masa Depan)

### V.A — Suggestion: a process supervisor for the queue workers

**Observed incident.** While deleting the two test VMs, both `DestroyVmJob` requests were accepted
by the application (status moved to *Deleting*) but sat unprocessed in the Redis queue. The cause:
every queue worker had exited. The workers run as hand-rolled `php artisan queue:work --max-time=3600`
daemons with no supervisor, so once they reached their max lifetime and exited, nothing restarted
them, and jobs submitted afterward queued with no consumer. A manual `backend.sh start` brought the
workers back and the destroy jobs drained within seconds.

**Why this belongs in Future Work.** The current worker model has no auto-recovery. A worker that
exits on `--max-time`, crashes, or is killed leaves the queue silently stalled until an operator
notices and restarts it by hand. For a self-service platform this is a reliability gap: a user's
request can appear accepted yet never execute.

**Recommendation.** Adopt a process supervisor in the next development cycle:

- **Laravel Horizon** as the worker supervisor — per-queue process pools, automatic restart of
  failed/exited workers, a metrics dashboard, and graceful redeploys. This also pairs with the
  per-queue split and fair-queuing direction already noted for the backend.
- **Or, as a lighter alternative**, run each worker as a **systemd** unit with `Restart=always`
  (and `RestartSec`), so the OS restarts any worker that exits for any reason.

Either option closes the gap the incident exposed: a worker exit auto-recovers, and queued jobs
never wait on a manual restart. The incident is a concrete, observed justification for the
recommendation, not a hypothetical concern.

### V.B — Suggestion: harden the administrative access path (bastion + SSH)

**What was delivered (state plainly in Bab IV; summarized here for the roadmap).** Administrative
OS access uses key-based authentication through a dedicated `sysadmin` account: no shared password,
the account password is locked, access is mediated by a bastion (jump host), and the per-VM login
credential is revealed self-service and recorded in the audit log. This removes the shared-static-
password risk and routes admin access through a single host. Validated 2026-06-27: key login plus
passwordless sudo confirmed on a fresh clone.

**Current limitations (the basis for the suggestion).** Three properties of the present
implementation leave room to harden:

- The administrator still obtains an interactive shell on the bastion (a nested `ssh ... "ssh ..."`),
  so the jump host accumulates session state and operator files.
- The `sysadmin` private key resides on the bastion.
- A single shared `sysadmin` key is used, so a login cannot be attributed to one administrator.

**Suggestions (Future Work).**

- **Transparent jump with ProxyJump (`ssh -J`).** Use the bastion as a pure network relay instead of
  a login host. The administrator connects end-to-end from the laptop to the target VM, and the
  bastion forwards the connection without granting a shell. This removes the "operator leaves files
  on the jump host" problem by construction.
- **Enforce no-shell on the bastion.** Constrain the jump account's key with the OpenSSH
  `restrict,port-forwarding` options so the bastion permits only connection forwarding, not
  interactive sessions or file transfer. This turns a no-operate policy into a technical control.
- **Per-administrator keypairs.** Replace the single shared key with one keypair per administrator and
  install each public key in the template's `authorized_keys`. This gives per-person accountability
  and individual revocation.
- **SSH certificate authority at scale.** Introduce an SSH CA that issues short-lived certificates;
  the VMs trust the CA. This removes per-VM `authorized_keys` maintenance and centralizes issuance,
  expiry, and revocation.

These items harden the access path without changing the delivered model: they make the bastion
stateless, attribute access to individuals, and bound credential lifetime.
