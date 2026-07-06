# Security Threat Model

This document is the security companion to the evaluation (`10-evaluation.md`). It states
what the system protects, who it is protected against, the threats considered, the controls
in place (with code and test evidence), and the residual risks that remain as deferred
hardening. The analysis is organised with **STRIDE** (Spoofing, Tampering, Repudiation,
Information disclosure, Denial of service, Elevation of privilege) and mapped to the
architectural decisions in `03-architectural-decisions.md` (notably ADR-24, the cookie-based
SPA auth decision).

---

## 1. Scope and methodology

The system is an internal self-service portal that provisions and manages real virtual
machines on a Proxmox cluster via Terraform and Ansible. Because an authenticated user can
cause real infrastructure to be created, mutated, and destroyed, the security posture is
weighted toward **authorisation correctness, input integrity at the infrastructure boundary,
secret handling, and a trustworthy audit trail**.

Methodology: enumerate assets and trust boundaries (§2), apply STRIDE to each boundary (§3),
walk the highest-risk flows (§4), and record residual risk and deferred hardening (§5). Each
implemented control is tagged **[code]** (enforced in the codebase) and, where applicable,
**[test]** (locked by the automated suite described in `10-evaluation.md`).

## 2. Assets and trust boundaries

**Assets, by sensitivity:**

| Asset | Why it matters |
|-------|----------------|
| Provider (Proxmox) API credentials | Full control of the hypervisor; encrypted at rest |
| Per-VM login credentials | Access to provisioned guests; encrypted at rest, reveal-on-demand |
| User sessions / identity | Spoofing one grants that user's provisioning rights |
| The audit trail | Non-repudiation; must be append-only and leak-free |
| Terraform state & per-VM workspaces | Encodes real infrastructure; path integrity matters |
| Environment policy (allow-lists, caps) | The guardrail that bounds what any user may request |

**Trust boundaries:**

1. **Browser ↔ API** — untrusted client to trusted server. Crossed by every `/api/*` request;
   guarded by cookie session auth, CSRF, RBAC, and validation.
2. **API ↔ datastore (Postgres/Redis)** — trusted, but secrets are encrypted before they cross
   it so a database compromise does not directly yield plaintext credentials.
3. **API/worker ↔ Proxmox (Terraform/Ansible)** — the **critical boundary**: user-influenced
   data (VM names, sizes) is rendered into workspace paths and tfvars and then executed against
   real infrastructure. Input integrity here is paramount.
4. **Worker ↔ guest VM (Ansible/SSH)** — key-based automation; the private key never leaves the
   server, the public key is injected via cloud-init.

## 3. STRIDE analysis

### 3.1 Spoofing (identity)

| Threat | Control | Evidence |
|--------|---------|----------|
| Stolen/replayed bearer token | **No token in browser storage** — cookie-based Sanctum SPA auth with an HttpOnly session cookie (ADR-24); XSS cannot read it | [code] `AuthController::login` establishes a server session, issues no token |
| Session fixation | Session ID regenerated on login | [code] `$request->session()->regenerate()` |
| Credential guessing / brute force | Throttle by email+IP: 5 failures → `429` lockout (15-min decay); failures and lockouts audited | [code] `AuthController` `RateLimiter`; [test] `AuthTest::test_login_is_throttled_after_five_failures`, `…writes_a_login_failed_audit_row` |
| Login to a disabled account | Inactive accounts rejected (`403`) and audited even with correct password | [code] `AuthController` status check; [test] `AuditTrailTest::test_inactive_account_login_is_rejected_and_audited` |
| Idle session hijack on a shared machine | 60-minute idle auto-logout (55-min warning), `SESSION_EXPIRE_ON_CLOSE` | [code] frontend `IdleTimeout` + `SESSION_LIFETIME` |

### 3.2 Tampering (integrity)

| Threat | Control | Evidence |
|--------|---------|----------|
| **Path traversal / template injection via VM name** — `../`, `/`, or Terraform `${}` reaching the workspace path or tfvars | `vm_name` constrained to a DNS-label charset (`^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$`, ≤60 chars) at the API | [code] `ProvisionRequestController` store/update rules; [test] `ProvisionRequestTest::test_vm_name_rejects_path_traversal_and_interpolation` |
| Cross-site request forgery on state-changing calls | CSRF enforced on writes (cookie SPA flow); requests require the stateful origin | [code] Sanctum stateful middleware; [test] login tests use an explicit `Origin`/`Referer` |
| Requesting resources outside policy (e.g. a node from another provider, an off-node catalog) | Node-centric policy validated server-side in one place | [code] `ProvisionRequestService::validatePolicy`; [test] `ProvisionRequestTest` policy cases (provider/node/tier/catalog) |
| Bypassing capacity caps via concurrent requests | Data-disk cap counts in-flight **pending approvals**, not just materialised disks | [code] `InventoryController::addDisk`; [test] `LifecycleTest::test_regression_add_disk_cap_counts_in_flight_pending_approvals` |
| Accidental/forged destructive action | Resize/delete/add-disk require an exact `vm_name` confirmation | [code] `InventoryController::assertNameConfirmed`; [test] `LifecycleTest::test_regression_destructive_actions_require_name_confirmation` |

### 3.3 Repudiation

| Threat | Control | Evidence |
|--------|---------|----------|
| User denies performing a privileged action | **Append-only audit trail** (`AuditLog`, no `updated_at`); every state-changing action logs actor, action, description, IP, and structured metadata | [code] `AuditService`, `AuditLog` (`$timestamps = false`) |
| Ambiguous history after VM-ID reuse | Audit metadata keyed on the never-reused `inventory_id` (Proxmox recycles `vmid`), `jsonb` + GIN indexed for exact per-instance lookup | [code] `Inventory::auditMeta`; [test] `AuditTrailTest::test_renewal_writes_vm_renewed_with_inventory_metadata`, `…filters_by_inventory_id_metadata` |
| Approval decisions without justification | Approve/reject/revert require a mandatory reason, recorded in the audit description | [code] `ApprovalWorkflowService::act`; [test] `ApprovalWorkflowTest::test_reason_is_mandatory_for_every_action`, `AuditTrailTest::test_approval_actions_are_audited_with_their_reason` |

### 3.4 Information disclosure

| Threat | Control | Evidence |
|--------|---------|----------|
| Provider/VM secrets readable in the database | Provider token secrets and per-VM passwords use Laravel's `encrypted` cast (ciphertext at rest) | [code] `Provider` and `Inventory` `$casts` |
| Secrets serialised into API responses | Secret columns are `Hidden`; the per-VM password is never in the inventory listing | [code] `Provider` `#[Hidden]`; `InventoryController::transform` omits the password |
| Credential reveal leaking into logs | Reveal is a dedicated, **audited** endpoint; the audit description records the event but **not** the secret | [code] `InventoryController::credentials`; [test] `AuditTrailTest::test_credential_reveal_is_audited_without_leaking_the_password` |
| Seeing another user's VMs/credentials | Record-level RBAC scoping: User → own; Manager → managed-group members; Admin → all | [code] `InventoryController::visibleOwnerIds`/`authorizeView`; [test] `LifecycleTest::test_manager_sees_…`, `AuditTrailTest::test_credential_reveal_is_rbac_scoped` |
| Stack traces / secret leakage in errors | Errors normalised to `{error:{code,message,details}}`; raw messages only when `APP_DEBUG` | [code] `bootstrap/app.php` render hook (default branch gates on `config('app.debug')`) |

### 3.5 Denial of service

| Threat | Control | Evidence |
|--------|---------|----------|
| Credential-stuffing flooding login | Per-identity login throttle (§3.1) | [code]/[test] as above |
| Runaway provider sync hammering Proxmox | `ProviderSyncGuard` circuit-breaker + throttle on the sync path | [code] real-time sync layer (ADR-22) |
| Oversized batch requests | `instance_count` capped (1–20); per-environment data-disk caps | [code] `ProvisionRequestController`, environment policy |
| General API flooding | **Deferred**: a global nginx/API rate limit is on the hardening checklist (§5) | — |

### 3.6 Elevation of privilege

| Threat | Control | Evidence |
|--------|---------|----------|
| Regular user invoking admin/manager-only endpoints | Route-level RBAC middleware (`role:Administrator`, `role:Manager,Administrator`) | [code] `RoleMiddleware`, `routes/api.php`; [test] `RbacTest`, `ApprovalWorkflowTest::test_regular_user_cannot_approve` |
| User self-approving to skip the gate | Approval actions gated to Manager/Administrator; privileged **bypass** is explicit and audited, never silent | [code] `ApprovalController` route group, `requiresApproval`; [test] `ProvisionRequestTest::test_privileged_actor_bypasses_…` |
| Acting on another user's VM | `authorizeActionable`/`authorizeView` 404 on out-of-scope records | [code] `InventoryController`; [test] `LifecycleTest::test_a_user_cannot_act_on_another_users_vm` |
| Completing disk setup as non-admin | `completeDisk` restricted to Administrator | [code] `InventoryController::completeDisk` |

## 4. High-risk flow walkthroughs

**Provisioning (browser → API → Terraform).** A request crosses boundary 1 (authenticated,
CSRF-checked), is shape-validated (charset-restricted `vm_name`, bounded counts), then
policy-validated against the environment allow-lists. Only then is a per-VM workspace created
and Terraform run on boundary 3. The charset restriction is the key integrity control: it
prevents user input from escaping the intended workspace path or injecting interpolation into
tfvars. Approval routing ensures non-privileged requests in gated environments cannot reach
execution without a Manager/Admin decision.

**Credential reveal.** Per-VM passwords are encrypted at rest and excluded from list
responses. Disclosure happens only through a single endpoint that re-checks record-level RBAC
and writes an audit entry — and the audit entry deliberately omits the secret, so the trail
itself is not a disclosure vector.

**Real-time push.** Broadcast authorisation runs over the same cookie identity as the REST
API (`/api/broadcasting/auth`), so a client cannot subscribe to channels for VMs it could not
otherwise see.

## 5. Residual risk and deferred hardening

The application-layer controls above are implemented and, where logic-bound, test-backed. The
following **deployment/configuration** items remain (tracked in `08-deployment-workflow.md`,
Part D) and constitute the known residual risk until completed in the production environment:

- [ ] `APP_ENV=production`, **`APP_DEBUG=false`** — eliminate stack-trace/secret leakage.
- [ ] Reverb `allowed_origins` locked to the SPA origin (not `['*']`).
- [ ] Proxmox **TLS CA pinning/verification** in prod (avoid `pm_tls_insecure`); document the
      trust boundary if self-signed.
- [ ] Rotate all seeded development credentials — per-VM default (`ChangeMe123!`) and dev DB/sudo
      passwords — so no shared/default secret reaches production.
- [ ] Redis `requirepass` (defence-in-depth even when localhost-bound); `npm audit` +
      `composer audit` clean.
- [ ] nginx: HTTPS-only + HSTS + `X-Content-Type-Options` + a Content-Security-Policy; a general
      API rate limit (closes the §3.5 gap).
- [ ] Confirm `SESSION_SECURE_COOKIE=true`, exact-origin CORS with credentials, and
      `SANCTUM_STATEFUL_DOMAINS` set to the real SPA origin.

**Assessment.** The threats with the highest impact for this system — privilege escalation
across roles, tampering at the Terraform boundary, and disclosure of stored secrets — are
addressed in code and locked by tests. The residual risk is concentrated in deployment-time
configuration (TLS pinning, debug flag, secret rotation, transport headers, a global rate
limit) rather than in the application logic, and is enumerated as an actionable checklist
above.
