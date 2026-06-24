# Evaluation

This chapter evaluates the delivered system — a self-service virtual-machine provisioning
portal backed by Proxmox, Terraform, and Ansible — against the objectives set out in the
PRD (`01-PRD.md`) and the staged plan (`09-backend-build-stages.md`). The evaluation is in
four parts: (1) **functional** coverage of the requirements; (2) **verification** through an
automated test suite and live runs against real infrastructure; (3) **non-functional**
qualities (real-time freshness, security posture, maintainability); and (4) a frank account
of **limitations and deferred work**.

> Figures in this chapter are drawn from the codebase as built. Headline counts: **68
> automated tests / 259 assertions**, **34 migrations**, **15 API controllers**, **21 Eloquent
> models**, **19 service classes**, **7 queued jobs**, and **68 HTTP routes** across roughly
> **5,850 lines** of backend application code and **1,350 lines** of test code.

---

## 1. Functional evaluation

The system was built in resumable stages, each unlocking a slice of user-facing
functionality. Every core stage (0–8) was completed and **live-verified against a real
Proxmox cluster**, not merely against mocks. The table maps each stage to its requirement and
to the evidence of completion.

| Stage | Capability (requirement) | Status | Evidence |
|------:|--------------------------|--------|----------|
| 0 | Environment & scaffold | ✅ | App boots; CI/test DB provisioned (`infraprov_test`) |
| 1 | Foundation & IAM — login, User/Role/Group | ✅ | Cookie-based Sanctum SPA auth; RBAC middleware; `AuthTest`, `RbacTest` |
| 2 | Provider discovery (Proxmox) | ✅ | Discovery layer mirrors nodes/templates/networks/datastores/VMs |
| 3 | Published abstraction layer (catalog/network/datastore/node) | ✅ | Node-centric publishing (ADR-17); duplicate-protection unique indexes |
| 4 | Policy layer (tiers + environments) | ✅ | Allow-list rule tables; per-env expiry/grace/disk policy |
| 5 | Provision request + approval engine | ✅ | `ProvisionRequestTest`, `ApprovalWorkflowTest` (26 tests) |
| 6 | Provisioning & Terraform execution | ✅ | Per-VM workspace/state (ADR-08); live VMs created on Proxmox |
| 7 | Inventory & day-2 lifecycle | ✅ | `LifecycleTest` (15 tests); renew/permanent/resize/add-disk/delete/retry |
| 8 | Ansible hardening (catalog-bound, on-demand) | ✅ | ADR-14; key-based, approval-gated, live-verified |

Beyond the core stages, several refinements were delivered and verified: a per-environment
**expiry engine** with grace periods and real-time countdown; **revert→edit→resubmit-in-place**
for rejected requests; **admin/manager approval bypass**; gated **RAW data-disk** attachment
with two-tier capacity caps (ADR-18); a **provider-upgrade safety gate**; and an end-to-end
**real-time synchronisation** path (see §3.1).

**Assessment.** The functional objectives of the PRD are met in full for the in-scope stages.
The node-centric policy model (ADR-17) is the central design choice that holds the system
together: a request is valid only when its provider, node, and tier are allow-listed in the
target environment *and* its catalog/network/datastore are Active and physically resident on
the selected node. This invariant is enforced in one place (`ProvisionRequestService::
validatePolicy`) and is exercised directly by the test suite (§2.2).

---

## 2. Verification through automated testing

### 2.1 Test strategy

Tests are **feature/integration tests** that exercise the real HTTP stack — routing,
middleware, RBAC, validation, the custom error envelope, services, and the database — against
a dedicated PostgreSQL instance (the application relies on Postgres-specific features: `jsonb`
+ GIN indexes, `LOWER()` functional unique indexes, and `ilike`, so SQLite substitution would
not be faithful). Side-effecting work is isolated: **`Bus::fake()`** intercepts every queued
job so that no test ever invokes Terraform or Ansible, while still allowing assertions that the
correct job was dispatched with the correct arguments. Broadcasting is set to the `null` driver
and the queue to `sync`, so no Redis/Reverb dependency is required to run the suite.

A reusable data-builder trait (`Tests\Concerns\BuildsInfra`) constructs a complete,
policy-valid scenario — provider → discovered node → published node/catalog/network/datastore
→ tier → environment, fully allow-listed — from which a single field can be mutated to drive
each failure path. This keeps the tests legible and the negative cases honest.

### 2.2 Coverage by area

| Suite | Tests | What it proves |
|-------|------:|----------------|
| `Auth` (`AuthTest`, `RbacTest`) | 11 | Login success/failure, failed-login audit, brute-force throttle, role-gated endpoints (401/403/200) |
| `Provision` (`ProvisionRequestTest`, `ApprovalWorkflowTest`) | 26 | Approval routing vs immediate dispatch vs privileged bypass; batch fan-out; node-centric policy (provider/node/tier/catalog validation); approve/reject/revert with mandatory reason; revert→resubmit-in-place; index role-scoping |
| `Lifecycle` (`LifecycleTest`) | 15 | renew/permanent/resize/add-disk/delete/retry; approval vs immediate; **6 regression guards** (see below); RBAC scoping (owner/manager-group/outsider) |
| `Audit` (`AuditTrailTest`) | 12 | login/logout/inactive/password-change entries; credential reveal **without leaking the secret**; provision/approval/lifecycle entries with structured `metadata`; Administrator-only audit API + `jsonb` metadata filter |
| Smoke / scaffold | 4 | Health probe and framework sanity |
| **Total** | **68** | 259 assertions; full suite green |

### 2.3 Regression guards

A distinguishing feature of the lifecycle suite is a set of **regression guards** that pin
invariants which had previously broken and been fixed. Each guard encodes a specific past
defect so it cannot silently regress:

1. Renewing an expired VM **clears the stale grace window** and reactivates it (prevents a
   phantom grace countdown in the UI).
2. A renewal can **never push expiry past the environment window**; at the cap it is rejected
   and the user is steered to "Permanent".
3. The data-disk cap **counts in-flight pending approvals**, so two concurrent requests cannot
   both slip under the limit.
4. Add-disk is **refused when the environment forbids data disks** (403).
5. Destructive actions (resize/delete/add-disk) **require an exact VM-name confirmation**.
6. Deleted VMs **respect the retention window** in the listing — visible briefly, then dropped.

### 2.4 Live verification

Automated tests establish correctness of the application logic; they were complemented by
**manual live verification against a real Proxmox cluster** throughout the build. Provisioning,
resize, add-disk, hardening, deletion, and the real-time sync path were each confirmed
end-to-end on real VMs (recorded in `09-backend-build-stages.md` and the per-stage notes). This
two-tier approach — fast, deterministic integration tests for logic plus live runs for the
infrastructure boundary — gives confidence in both halves of a system whose value lies
precisely at that boundary.

---

## 3. Non-functional evaluation

### 3.1 Real-time freshness

The portal pushes state changes to the browser rather than relying on polling alone. The
design (ADR-22/23) combines event-driven freshness with a two-tier sync and a Laravel Reverb
WebSocket push over a two-instance Redis topology (an LRU cache instance and a separate
no-eviction queue/pub-sub instance with AOF). Out-of-band changes (e.g. a VM powered off
directly on the hypervisor) are detected on the order of ~20 seconds, and power-state flips
broadcast on detection. A `ProviderSyncGuard` circuit-breaker throttles sync to protect the
provider API. This was live-verified; the WebSocket path degrades gracefully to the adaptive
poller when the socket is unavailable.

### 3.2 Security posture

Security was treated as a first-class concern (the full threat model is the subject of
`12-security-threat-model.md`). Notable controls, several of them test-backed:

- **Cookie-based Sanctum SPA auth** (HttpOnly; no bearer token in client storage), Redis
  sessions, CSRF protection, and 60-minute idle auto-logout.
- **Brute-force throttling** (5 failures → lockout) with failed-login auditing — verified by
  `AuthTest`.
- **Input hardening**: VM names are constrained to a DNS-label charset, blocking path traversal
  and Terraform `${}` interpolation in workspace paths and tfvars — verified by
  `ProvisionRequestTest`.
- **Per-VM encrypted credentials**, revealed only through an **audited** endpoint; the audit
  trail records the reveal but never the secret — verified by `AuditTrailTest`.
- **Append-only audit trail** with structured `jsonb` metadata keyed on the never-reused
  `inventory_id` (Proxmox recycles VM IDs), enabling exact per-instance history.
- **RBAC** enforced at the route layer and re-checked in controllers for record-level scoping.

### 3.3 Maintainability

The codebase favours single sources of truth: one approval-routing predicate
(`requiresApproval`) is shared by the create path, the resubmit path, and the API response so
they cannot drift; one policy validator; one audit service. The error envelope is normalised in
one place. The 11 architectural decisions referenced in code (ADR-01, 06, 08–12, 14, 16–18) are
documented in `03-architectural-decisions.md`, giving a traceable rationale for the
non-obvious choices (per-VM Terraform workspaces, node-centric publishing, structured-disk
stubs, provider-upgrade pinning). The test suite runs in roughly three seconds, which keeps it
usable as a pre-commit gate.

---

## 4. Limitations and deferred work

The evaluation would be incomplete without stating what was *not* done and why.

- **Test scope is integration-level, not exhaustive unit coverage.** The suite targets the
  high-value behavioural seams (policy, approval, lifecycle, audit, RBAC). Pure-unit coverage of
  helpers such as the expiry-cap arithmetic is implicit through the lifecycle tests rather than
  isolated; a future pass could add focused unit tests there.
- **The infrastructure boundary is verified manually, not in CI.** Terraform/Ansible execution
  is `Bus::fake()`d in the test suite by design (it is slow, stateful, and requires a live
  hypervisor). Live verification was performed by hand. A staging cluster with a nightly
  end-to-end job would close this gap.
- **Deferred production hardening** (tracked in `08-deployment-workflow.md`, Part D):
  `APP_DEBUG=false`, locking Reverb broadcast origins, Proxmox CA pinning, a Redis password,
  rotation of seeded development credentials, and nginx security headers. These are
  configuration/deployment items, not missing features.
- **Optional roadmap items** not in the core scope: a containerised (Docker/Podman)
  provisioning path, VM power control (start/stop) gated by environment policy, and an
  Ubuntu 24 LVM template.

---

## 5. Summary

The system meets its functional objectives across all in-scope stages, each completed and
live-verified against real infrastructure. Correctness of the application logic is now locked
down by a green suite of **68 automated tests** covering authentication and RBAC, the
node-centric provisioning policy, the approval workflow, the full day-2 lifecycle with six
explicit regression guards, and the audit trail — all without touching real Terraform thanks to
job-bus faking. Non-functional qualities (real-time freshness, a layered security posture, and
a maintainable single-source-of-truth design) were addressed deliberately and, where they are
logic-bound, are themselves test-backed. The remaining work is well-understood and consists of
deployment hardening and optional roadmap features rather than gaps in the delivered
capability.
