# Backend Build — Staged Plan (incremental, resumable)

**Purpose:** build the Laravel backend in small, self-contained stages so progress survives token
limits. Each stage builds + migrates + is testable on its own, is committed before the next starts,
and unlocks a specific already-built frontend module (flip it from optimistic-local to real API).

**Stack:** Laravel 11 + Sanctum (bearer tokens) + queues/Jobs + Terraform CLI + Ansible + Proxmox API.
DB: see Stage 0 decision. Lives in `./backend/`. Frontend already calls `/api/*` (snake_case, camelized
client-side) — contract in `07-api-contract.md`, schema in `06-database-schema.md`, services in `04-backend-services.md`.

**Per-stage definition of done:** migrations run; endpoints return the shapes the frontend expects;
`audit_logs` row written on every state change; no credential ever in a response; committed on a branch.

---

## Stage 0 — Environment & scaffold (prereq)
- Decisions: **database** (SQLite dev vs PostgreSQL vs provided — see question), Proxmox reachability for Stage 2.
- `composer create-project laravel/laravel backend`; install Sanctum; configure `.env` (DB, `APP_KEY`, queue=database).
- CORS + Sanctum for the Vite origin; `/api` route group; standard error shape `{error:{code,message,details}}`.
- `AuditService` (`log(user, action_type, description, ip)`), `CredentialCipher` (encrypt/decrypt), base `Controller`/`FormRequest` conventions.
- **Exit:** `php artisan serve` responds; `GET /api/health` ok; frontend dev proxy reaches it.

## Stage 1 — Foundation & IAM (Module 10) → unlocks **login + User/Role/Group tabs**
- Migrations: `roles`, `groups`, `users` (nullable `groups.manager_user_id`, `auth_provider`).
- Bootstrap seeder: 3 roles, "System Administrators" group, admin user, then backfill manager.
- `POST /auth/login`, `POST /auth/logout`, `GET /auth/me`; RBAC middleware (User/Manager/Administrator).
- CRUD `/users`, `/roles`, `/groups` with delete-protections (409: user manages a group; role/group assigned).
- **Frontend flip:** set `VITE_AUTH_BYPASS=false`; real seeded admin login works.
- **Exit:** admin logs in; RBAC gates enforced; delete guards return 409.

## Stage 2 — Provider Discovery (Module 01) → unlocks **Provider mgmt + Discovery Explorer**
- Migrations: `providers` (dual creds encrypted + tf source/version + discovery fields), `provider_nodes/templates/networks/datastores/vms`.
- `ProviderDriver` interface + `ProviderFactory` + `ProxmoxProvider` (endpoints from `config/provider_endpoints.php`); `/config` parse rules (§2.2a).
- CRUD `/providers` (secrets write-only), `POST /{id}/test-connection`, `POST /{id}/discover`, `GET /{id}/explorer`, `GET /providers/stats`, `GET /{id}/drift|capacity`.
- `DiscoveryService` (2-tier sync) + `VmFactSyncService` + scheduler honoring `auto_discovery_enabled`/`discovery_interval`.
- **Exit:** register Proxmox → test → discover populates `provider_*`; secrets never returned.

## Stage 3 — Published layer → unlocks **Catalog / Network / Datastore mgmt + catalog image**
- Migrations: `catalogs`, `networks`, `datastores` (FKs to discovered resources); status derivation.
- CRUD for each; `POST /catalogs/{id}/image` (png/jpg/jpeg/webp, 512×512, ≤2MB → `storage/app/catalog-images/`).
- `ResourceResolutionService` (IDs → provider values) — shared by provisioning later.
- **Frontend flip:** catalog/network/datastore forms send IDs (provider_id/template_id/etc.); image upload hits the endpoint.
- **Exit:** publish items; user-facing reads come only from published tables.

## Stage 4 — Policy layer (Tiers + Environments) → unlocks **Tier/Environment mgmt + wizard Step 1**
- Migrations: `tiers`, `environments` + 4 `environment_*_rules` join tables.
- Seed Bronze/Silver/Gold (authoritative values); tier delete guard (409 if referenced).
- CRUD `/tiers` (+stats), `/environments`; `GET /environments/{id}/allowed-resources` (drives wizard).
- **Exit:** selecting an environment filters the wizard; tier resolution returns CPU/RAM/disk.

## Stage 5 — Provision Request + Approval engine (Modules 12 & 09) → unlocks **wizard submit + Approvals**
- Migrations: `provision_requests` (IDs only), `approval_requests` (polymorphic).
- `ProvisionRequestService` (validate vs policy; approval_required → approval row, else queue).
- `ApprovalWorkflowService` (approve/reject/revert, mandatory reason) + `ApproverResolutionService` (group manager).
- Endpoints: `POST /provision-requests`, list/get/put/resubmit; `/approvals` + stats + approve/reject/revert.
- **Exit:** request → pending approval → approve/reject/revert with reasons; reverted edit+resubmit.

## Stage 6 — Provisioning & Terraform (Module 07) → execution
- Migration: `inventory` (+`inventory_disks`) is created **here** (rows written on provision); lifecycle **actions** on those rows are Stage 7.
- `ProvisionVmJob` (queued, **one per VM** — ADR-08; `instance_count = N` fans out to N jobs running in **parallel** on the queue): per-VM workspace → resolve IDs → render `provider.tf`/`tfvars` → copy stubs (`storage/app/master-provisioning/terraform/`) → init/validate/plan/apply.
- On success: inventory row (Active) + capture `external_vmid` → scoped discovery (`DiscoveryService::syncVm`) → `VmFactSyncService` (IP/power). On fail: Failed + retained workspace (retry is a Stage-7 action).
- **Exit:** approved request → running VM with discovered IP; failures retryable.

## Stage 7 — Inventory & lifecycle → unlocks **Inventory actions**
- Migration: `inventory` (+`inventory_disks`); RBAC-scoped reads (dual status + allocation).
- Lifecycle: renew/permanent (approval), `RESIZE` (auto-applied tf reconfigure), `ADD_DISK` (raw attach → Pending Setup → admin complete), delete (destroy, keep workspace), retry, provider sync.
- `LifecycleEngineService` (expiry → grace → auto-destroy, scheduled).
- **Exit:** all inventory actions work end-to-end; dual status shown.

## Stage 8 — Audit, hardening, cutover → finishes the system
- `AnsibleHardeningService`/`AnsibleRunner` (post-apply when `security_hardening`); `hardening_status` + `HARDEN_VM` audit.
- `/audit-logs` + CSV export (RBAC-scoped); verify audit on every mutation; credential-leak security pass.
- Reconcile any remaining frontend gaps (provider/template/node by ID; remove leftover optimistic paths); full smoke test (`08-deployment-workflow.md`).
- **Exit:** end-to-end flow green; zero credential exposure; go-live checklist passed.

---

## Post-Stage-7 refinements (DONE — live-verified vs real Proxmox)
Stages 0–7 are complete. The following were added/changed after Stage 7 and are all live-verified. Stage 8
(Ansible hardening) remains the main not-started stage.

**Lifecycle & approvals**
- **Expiry engine** (`LifecycleEngineService` + scheduled `vms:lifecycle`): Active → Expired → grace → auto-destroy;
  provisioning stamps `expiry_date` from the env policy; per-environment grace (`grace_period_type/value`); live countdown in Inventory.
- **Expiry capped to the environment window (ADR-21):** renewal tops a VM's expiry back up toward `now + env window`,
  never stacks past it; at the cap only "Make Permanent" is offered.
- **Unified "Edit Resources" (ADR-20):** ONE approval + ONE Terraform apply bundles CPU/RAM resize **and** data-disk
  adds — new `EDIT_RESOURCES` type + `EditResourcesVmJob`; replaces the old split RESIZE + ADD_DISK two-request flow.
- **add-disk flow** (gated RAW data disks, admin completes) + two-tier data-disk caps (physical slot ceiling > env `max_data_disks`).
- **Admin/Manager bypass approval** (`User::isPrivileged()`); **Revert restricted to PROVISION** (live-asset changes are Approve/Reject only).
- **Approvals UI:** role-scoped (all roles see own; actions manager-only); Type column shows `Edit Resources [scope]`;
  Resources column color-codes net-new vs existing; instance-count badge; sortable dates.
- **Inventory UI:** "Waiting approval (…)" badge beside Active; live expiry/grace countdown; realtime auto-refresh + instant-open cache.

**Discovery & provider (source of truth)**
- **Auto-discovery scheduled per-provider, ON by default (ADR-19):** `discovery:refresh` (30s tick, self-throttled to each
  provider's `discovery_interval` ∈ 30s/1m/2m) re-discovers + mirrors facts into inventory; `discovery:prune` (hourly) deletes
  resources Missing > 24h (published-referenced ones kept). New providers default auto-on @ 2m.
- **Single API collection point:** only Provider Management + the discovery engine call Proxmox; Inventory & all other menus read
  the DB. Global Inventory sync = `POST /inventory/sync-all` (DB mirror); the per-VM "Provider Sync" was removed.
- **Discovery accuracy:** one consolidated VM status (Running/Stopped/Missing); `provider_vms` node resolved (Node column);
  vCPU reports the ONLINE `vcpus`, not the hotplug topology ceiling; a stopped VM flushes its IP.
- **Provisioning hardening:** live CPU+RAM hotplug (vcpus-max + numa + balloon=0); `automatic_reboot=false` (no reboot storm);
  serial-console fix; structured-disks stub is the default (ADR-18 §4); provider-upgrade compat gate.

---

## Dependency order
`0 → 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8` (each unlocks the next; audit logging wired from Stage 1 on).

## Frontend cutover checklist (per stage)
After each stage, flip the matching module off optimistic-local: confirm GET renders real rows,
create/edit/delete fire real `POST/PUT/DELETE` (DevTools), 409s show inline. Set `VITE_AUTH_BYPASS=false` after Stage 1.
