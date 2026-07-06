# Implementation Plan
## Proxmox Self-Service VM Provisioning Portal

**Audience:** the implementation agent building the backend against the existing React frontend.
**Principle:** build bottom-up by layer (Discovery → Published → Policy → Orchestration → Lifecycle), so each phase has working dependencies before the next begins.

---

## 0. Conventions for the executing agent

- Build the **backend** (Laravel assumed) to satisfy the existing frontend contracts; do not re-architect the frontend.
- Honor the layer boundaries from the architectural-decisions doc at every step.
- Every state-changing endpoint writes an `audit_logs` row.
- Provider credentials: encrypt on write, never select into any response DTO.
- Do **not** implement the actual VM provisioning during the build of a phase's scaffolding — wire it only in Phase 6 where Terraform execution belongs. (Scaffolding and contracts first; execution last.)

---

## Phase 1 — Foundation & IAM (Module 10)

**Goal:** auth, RBAC, and the entity graph everything else hangs off.

1. Migrations: `roles`, `groups`, `users` (with `role_id`, `group_id`, nullable `groups.manager_user_id`, `auth_provider` default `local`).
2. Bootstrap seeder: create "System Administrators" group (manager null), the three roles, and an initial admin user; then backfill the group manager. This avoids the circular dependency.
3. Auth (login/logout/session or token), password hashing, `LOGIN` audit event.
4. RBAC middleware/policies for the three roles.
5. Delete protections: block deleting a user who manages a group; block deleting a role/group with assigned users.
6. CRUD for users/roles/groups (admin only).

**Exit criteria:** admin can log in, create groups with managers, and assign users; RBAC enforced; delete guards proven.

---

## Phase 2 — Provider Discovery (Module 01)

**Goal:** read infrastructure from Proxmox into the database.

1. Migrations: `providers` (dual-credential fields encrypted + terraform provider source/version + discovery monitoring fields), `provider_nodes`, `provider_templates`, `provider_networks`, `provider_datastores`, `provider_vms`.
2. **Provider Driver** abstraction with `ProviderFactory`; implement `ProxmoxProvider` with: `testConnection()`, `discoverNodes()`, `discoverTemplates()`, `discoverNetworks()`, `discoverDatastores()`, `discoverVms()`, `syncResources()`, `getNodeHealth()`. Endpoints from `config/provider_endpoints.php`. All provider GETs (resources + VM runtime facts) live here. When persisting `provider_nodes`, also store the `cpu_utilization`/`ram_usage_mb` snapshot from the status-tier `/cluster/resources?type=node` read (ADR-17).
3. Encrypted credential storage; ensure no credential field is ever serialized to a response.
4. Provider CRUD + **Test Connection** + **Run Discovery Now**.
5. Discovery scheduler honoring `auto_discovery_enabled` + `discovery_interval`.
6. Discovery status/connection status handling; missing resources flagged `Missing`, never deleted.
7. Discovery Explorer read endpoints (incl. discovered VMs) + provider statistics widgets (from DB); `VmFactSyncService` maps `provider_vms` → inventory by `external_vmid` (observed power + allocation + utilization snapshot); optional drift report; Admin utilization/capacity view from `/cluster/resources` (node + storage + per-VM usage).
8. Discovery reads: cheap `/cluster/resources` (status tier, frequent) classifies VMs vs templates and captures power + utilization snapshot; `/config` (allocation tier, lazy) parsed per the backend rules (vCPU = sockets × cores; scan scsi/virtio/sata/ide; include only `size=` and exclude `media=cdrom`/`efidisk0`/`tpmstate0`/`unusedX`; normalize units to GB).

**Exit criteria:** registering a Proxmox provider, testing connection, and running discovery populates all `provider_*` tables (incl. `provider_vms` with allocation/utilization snapshots); credentials never leave the backend.

---

## Phase 3 — Published / Service Layer

**Goal:** admin-curated abstractions over discovered resources.

1. Migrations: `catalogs`, published `nodes` (ADR-17), published `networks`, published `datastores` (each referencing the discovered provider resource ids).
2. Catalog CRUD with image upload (validation: type, 512×512, ≤2 MB; stored under `storage/app/catalog-images/`).
3. Node, Network and Datastore publish CRUD.
4. Status derivation: Active / Inactive / Provider Offline / Template Missing based on the linked discovered resource's state.
5. Resolution helpers: `catalog_id`→template, `network_id`→bridge, `datastore_id`→storage, `node_id` (published)→`provider_node_id`→node name (used later by provisioning) — implemented against the new `nodes` table.

**Exit criteria:** admin can publish a catalog item/node/network/datastore; user-facing reads come only from published tables; the wizard's node list reads from `nodes`, never `provider_nodes`.

---

## Phase 4 — Policy Layer (Tiers + Environments)

**Goal:** governance rules that constrain provisioning.

1. Migrations: `tiers`, `environments`, `environment_provider_rules`, `environment_tier_rules`, `environment_node_rules` (ADR-17), `environment_network_rules`, `environment_datastore_rules`.
2. Seed default tiers (Bronze/Silver/Gold) with authoritative spec values; allow admin to create Platinum.
3. Tier CRUD + status + delete validation (blocked if used by environment/inventory/request).
4. Environment CRUD with expiry policy, `approval_required`, and the five allow-lists (providers/tiers/nodes/networks/datastores).
5. Resource-filtering service: given an environment, return allowed providers/tiers/nodes/networks/datastores for the wizard.

**Exit criteria:** selecting an environment filters the wizard to only its allowed resources; tier resolution returns correct CPU/RAM/disk.

---

## Phase 5 — Provision Request + Approval Engine (Modules 12 & 09)

**Goal:** capture requests and govern them — still no Terraform execution.

1. Migration: `provision_requests` (IDs only + vm_name + requested expiry) and `approval_requests`. The node FK is the **published** `node_id` (FK→`nodes`), not raw `provider_node_id` (ADR-17).
2. Provision request creation: validate against environment policy; if `approval_required=false`, enqueue straight to the Terraform queue (Phase 6); else create a `PROVISION` `approval_requests` row (Pending) with approver resolved via group manager.
3. Approval engine independent of request type: Approve / Reject / Revert with mandatory `action_reason`.
4. Revert → user edits reverted request → resubmit → Pending.
5. Approval page reads, widgets (Total/Pending/Approved/Rejected/Reverted), expand-row details.
6. Wire `RENEWAL` and `PERMANENT` request types (Approve/Reject only).

**Exit criteria:** a request with approval required sits in the queue, can be approved/rejected/reverted with reasons, and a reverted request can be edited and resubmitted.

---

## Phase 6 — Provisioning & Terraform (Module 07)

**Goal:** turn an approved request into a running VM. **This is where execution is implemented.**

1. Terraform templates in `storage/app/master-provisioning/terraform/`: `main.tf.stub`, `variables.tf.stub`.
2. `ProvisionVmJob` (queued): create workspace → resolve all IDs to provider values → load provider config → render `provider.tf` (from provider source/version) → render `terraform.tfvars` (incl. cloud-init params `hostname`=VM name and the boot-disk size) → copy `main.tf`/`variables.tf` → `init` → `validate` → `plan` → `apply`. Templates must ship cloud-init/cloudbase-init so the hostname is set and the boot-disk filesystem grows on first boot (not via Ansible).
3. Write `deployment.json` metadata into the workspace.
4. On success: create inventory record (lifecycle status Active), persist `workspace_path` + `terraform_state_path`, capture `external_vmid`.
5. Capture `external_vmid` from Terraform output; trigger a scoped VM discovery (`provider_vms`) then sync IP/status into inventory by `external_vmid`, retrying until the guest-agent IP is available. No direct provider call outside the discovery layer.
6. **Post-provision hardening (Ansible):** if the request's `security_hardening` flag is set, once the IP is known, render the hardening playbook + inventory into the same workspace and run Ansible against the VM; record `hardening_status` (Success/Failed) and write a `HARDEN_VM` audit row. A hardening failure leaves the VM lifecycle Active (flagged), not destroyed. If the flag is off, skip this step.
7. On failure (terraform): status Failed, capture error message, retain workspace; expose Retry (reuse same workspace/state).

**Exit criteria:** an approved request produces a running VM with a discovered IP and a retained, auditable workspace; when hardening is requested, the Ansible playbook runs after apply and its outcome is recorded; failures are retryable.

---

## Phase 7 — Inventory & Lifecycle

**Goal:** VM management and lifecycle.

1. Migration: `inventory` (resource IDs, workspace/state paths, expiry, grace period, is_permanent, status).
2. Inventory list/detail scoped by RBAC.
3. Lifecycle actions: Renew & Make Permanent (→ approval); **Edit Resources** — a single popup with (a) **CPU/RAM resize** (VM-name-typed confirmation → `RESIZE` approval → Terraform reconfigure applied **automatically** on approval) and (b) **Add Data Disk**, shown only when `environment.allow_data_disk` (→ `ADD_DISK` approval → Terraform attaches a raw disk → status Pending Disk Setup → **admin** formats/mounts in-guest → mark Ready); Delete (→ `terraform destroy`, keep workspace, status Deleted); Provider Sync (scoped VM discovery → sync IP/status into inventory by `external_vmid`).
4. Lifecycle/expiry engine: expiry warnings → Expired → grace period → auto destroy.
5. Template prerequisites for lifecycle: virtio-scsi controller + disk hotplug enabled (data disks attach without reboot; reboot only as a fallback), virtio drivers on Windows. Automating the in-guest disk setup (guest-agent exec / Ansible) is future work.

**Exit criteria:** all lifecycle actions work end-to-end; CPU/RAM resize is auto-applied on approval; add-disk is environment-gated, attaches via Terraform, and is completed by an admin; existing disks are never shrunk; inventory shows the portal lifecycle status alongside the provider-synced observed power state (with `unknown` + `last_sync_at` when the provider is unreachable).

---

## Phase 8 — Audit, hardening, reconciliation

1. `audit_logs` writes verified across every state-changing action; RBAC-scoped audit views + CSV export.
2. Reconcile frontend mock tier values with seeded authoritative values; remove the Vite `apiSimulationPlugin` mock path in favor of the real API base URL.
3. Security pass: confirm no credential ever appears in any response, table, or audit entry.
4. End-to-end smoke test of the full flow (Phase 9 of the deployment doc).

---

## Dependency graph (summary)

```
Phase 1 (IAM)
   └─> Phase 2 (Discovery)
          └─> Phase 3 (Published)
                 └─> Phase 4 (Policy)
                        └─> Phase 5 (Request + Approval)
                               └─> Phase 6 (Provisioning/Terraform)
                                      └─> Phase 7 (Inventory/Lifecycle)
                                             └─> Phase 8 (Audit/hardening)
```

Audit logging (Phase 8 verification) is actually wired incrementally from Phase 1 onward; it is only *audited as complete* at the end.

## Status (current)

- **Phases 0–7: DONE**, all live-verified against real Proxmox. **Phase 8 (Ansible hardening): not started** (the main remaining stage).
- **Post-Phase-7 refinements delivered** (see `09-backend-build-stages.md` → "Post-Stage-7 refinements", ADRs 19–21): scheduled per-provider auto-discovery + 24h stale-prune (default on); unified bundled "Edit Resources" (one approval, one apply); lifetime capped to the environment window; live CPU/RAM hotplug; single API collection point (Inventory reads DB); discovery accuracy fixes (online vCPU, IP-only-while-running, consolidated VM status, resolved Node column); realtime/instant-open Inventory & Approvals UI.
