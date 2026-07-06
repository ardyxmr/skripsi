# Product Requirements Document (PRD)
## Proxmox Self-Service VM Provisioning Portal

**Document version:** 1.1 (architecture-v2, reconciled to the delivered build, 2026-06-20)
**Status:** Implemented — Stages 0–8 built and live-verified against real Proxmox VE 9.1; this PRD is kept aligned with the shipped system. Sections marked *(design-ready)* are supported by the schema/architecture but not yet live-verified.
**Backend baseline:** v1 (manual dual-token provider configuration; no cluster auto-discovery of credentials)
**Stack as built:** Laravel 13 + PostgreSQL 16, Sanctum cookie-based SPA auth, Redis (cache + queue/session/pub-sub), Laravel Reverb (WebSocket push), Terraform (Telmate/proxmox) + Ansible; React/Vite frontend. App timezone Asia/Jakarta (WIB).

---

## 1. Overview

The portal is a self-service infrastructure platform that lets end users request, run, and manage virtual machines on a virtualization backend (Proxmox VE today) without touching the hypervisor directly. Administrators publish a curated catalog of operating systems, networks, datastores, and resource tiers; users select from that catalog through a guided wizard; requests pass through a governance/approval workflow; and approved requests are provisioned through Terraform into isolated workspaces.

The product is built around a strict separation of concerns: a **Discovery Layer** that reads infrastructure from the provider, a **Published/Service Layer** that exposes admin-curated abstractions to users, a **Business/Policy Layer** (environments, tiers, approvals) that governs what can be requested, and an **Orchestration + Terraform Layer** that performs the actual provisioning.

### 1.1 Problem statement

Provisioning VMs manually on Proxmox requires hypervisor access, knowledge of node/storage/bridge naming, and no governance trail. There is no standardized resource sizing, no approval workflow, no expiry control, and no audit. This concentrates risk and operational load on a small infrastructure team.

### 1.2 Goals

- Give users a catalog-driven, self-service way to request VMs.
- Enforce governance: standardized tiers, environment policies, approval workflow, expiry, and full audit trail.
- Keep all provider credentials and raw infrastructure identifiers hidden from end users.
- Make the architecture provider-agnostic so OpenStack, OLVM, VMware, or Nutanix can be added later without changing the business or Terraform layers.

### 1.3 Non-goals (v1)

- Automatic cluster-wide credential discovery (v1 uses manual dual-token configuration per provider).
- Multi-level / sequential approval (single-level Manager approval only; schema must allow future expansion).
- Capacity quotas (`max_instances` per tier) — schema-ready but not implemented.
- Billing / cost metering.
- Live VM console access from the portal.

---

## 2. Personas & roles

| Role | Capabilities |
|---|---|
| **User** | Submit provision requests; edit own *reverted* requests and resubmit; request renewal/permanent; request CPU/RAM resize and (where the environment allows) add a data disk; view and manage own VMs in inventory; view own requests. |
| **Manager** | Everything a User can do, plus approve / reject / revert requests for the group they manage; view all requests in their group. |
| **Administrator** | Full system access: manage providers, catalog, networks, datastores, tiers, environments, users/roles/groups; approve/reject/revert any request; view all data and audit logs. |

Approver assignment is automatic via group ownership (User → Group → Group Manager). Users never pick an approver.

---

## 3. Functional requirements by module

### 3.1 Provider Discovery (Module 01) — Admin
- Register a provider representing an **infrastructure endpoint / cluster** (e.g. "Proxmox DC Jakarta"), not a single node.
- Configure **two credential pairs** per provider:
  - **Discovery credential** (read-only, e.g. PVEAuditor): used to discover nodes, templates, networks, datastores, and running VMs; run health/sync. **All** provider reads go through this layer — no other part of the system calls the provider.
  - **Provisioning credential**: used by Terraform for VM lifecycle.
- Both credentials stored encrypted and **never returned to the frontend** after save, never shown in tables or audit logs.
- **Test Connection** before save (Proxmox: `GET /api2/json/version`).
- **Run Discovery Now** (manual) and **auto-discovery ON by default** (ADR-19) on a configurable interval (**30s / 1m / 2m**, default 2m for new providers); the UI shows the next-discovery time. Resources flagged `Missing` for >24h are pruned (published-referenced ones kept).
- Discovery results persist in `provider_nodes`, `provider_templates`, `provider_networks`, `provider_datastores`, and `provider_vms`. Missing resources are flagged `Missing`, not deleted. Discovered VM runtime facts (observed power, IP, allocation, utilization snapshot) are synced into `inventory` by `external_vmid`, which also enables drift detection (provider VMs with no inventory row; inventory rows whose provider VM went `Missing`).
- **How discovery reads Proxmox:** one cheap `/cluster/resources` call returns nodes, storage, and all VMs/templates (classified by the `template` flag) with power state and a utilization snapshot; `/nodes/{node}/qemu/{vmid}/config` is parsed (lazily) for allocation — vCPU (sockets × cores), RAM, and per-disk sizes across all buses (cdrom/efi/tpm/unused excluded). See backend doc for the parsing rules and the 2-tier sync cadence.
- **Admin utilization dashboard:** live utilization (per-VM CPU %/RAM used, node capacity, datastore cluster capacity) is surfaced to Admins for capacity planning, sourced from the same `/cluster/resources` data — kept out of the user-facing inventory. The **Node Preview panel** (§3.2a) surfaces the per-node CPU%/RAM% snapshot for capacity-at-a-glance.
- **Discovery Explorer**: read-only inspection of discovered resources (incl. VMs) and discovery health. Cannot modify, publish, or provision.
- Statistics widgets: Providers, Connected, Discovery Success, Templates, Networks, Datastores, VMs (all from DB, never live API calls).

### 3.2 Catalog Management (Module 02) — Admin
- Publish a **catalog item** (e.g. "Ubuntu 22.04 LTS") that abstracts exactly one discovered provider template (e.g. `ubuntu2204-template`).
- Fields: name, description, provider, node, template, image, status.
- Catalog image upload: PNG/JPG/JPEG/WEBP, 512×512, max 2 MB, stored under `storage/app/catalog-images/`.
- Status: Active / Inactive / Provider Offline / Template Missing.
- The user-facing Catalog page reads only from `catalogs` — never from `provider_templates`.

### 3.2a Node Management (Published Nodes, ADR-17) — Admin
- Publish a **node** that abstracts a discovered provider node (e.g. "Jakarta Zone A" → `pve01`). Backend resolves `node_id` → `provider_node_id` → node name at provisioning time. The wizard's node selector reads only `nodes`; raw node names never reach the user.
- The **Node Preview panel** (at the bottom of Provider Management) lists published nodes with their synced CPU%/RAM% and operational status, a `+ Add Node` action, and per-row Edit / Sync now / Node Explorer / Delete — Admin-only, from the DB snapshot. **Node Explorer** is a read-only, node-scoped Discovery Explorer drawer.
- Governance state uses the canonical published-layer enum **Active / Inactive / Provider Offline / Missing** (surfaced as an inline *Inactive* tag), distinct from the operational **Online / Offline / Maintenance** status. Delete is blocked (409) when referenced → admin **unpublishes** instead.

### 3.3 Network Management — Admin
- Publish a **network** that abstracts a discovered provider network (e.g. "Development Network" → `vmbr0`).
- Backend resolves `network_id` → `provider_network_id` → provider bridge value at provisioning time.

### 3.4 Datastore Management — Admin
- Publish a **datastore** that abstracts a discovered provider datastore (e.g. "Standard Storage" → `local-lvm`).
- Backend resolves `datastore_id` → `provider_datastore_id` → provider storage value at provisioning time.

### 3.5 Tier Management (Module 06) — Admin
- Tiers are resource blueprints; users pick a tier, never raw CPU/RAM/disk.
- Default tiers seeded on install: **Bronze (2 vCPU / 4 GB / 40 GB)**, **Silver (4 / 8 / 80)**, **Gold (8 / 16 / 160)**. **Platinum (16 / 32 / 320)** is supported and admin-creatable.
- Status Active/Inactive. Inactive tiers disappear from provisioning and new environment assignments; existing VMs keep running.
- Delete blocked if used by any environment, inventory VM, or provision request.

### 3.6 Environment Management (Module 05) — Admin
- Environment is a **policy layer**, not just a label. Each environment defines: expiry policy (`expiry_type`/`expiry_value` — days/hours/minutes/lifetime), **per-environment grace period** (`grace_period_type`/`grace_period_value`, used by the expiry engine before auto-destroy, §3.10), approval policy (`approval_required`), the data-disk policy (`allow_data_disk` + a per-env `max_data_disks` cap), and allow-lists for providers, tiers, nodes (ADR-17). Networks/datastores are **node-bound** (selected from the published rows on the chosen node), not a separate env allow-list.
- Drives the provision wizard: only allowed resources are shown.
- **Two-tier data-disk cap (ADR-16/18):** a physical ceiling (the Terraform stub's bounded slot count, config `max_data_disk_slots`) hard-bounds the per-environment `max_data_disks`; the authoritative runtime guard runs serially in the add-disk job to prevent races past the cap.
- **`allow_data_disk`** (checkbox in environment create/edit, default off): gates the whole additional-data-disk capability for VMs in this environment. When off, the "Add data disk" section in Edit Resources is hidden, and the future creation-time data-disk field (§4) does not appear. When on, the Add Data Disk action is available today; the creation-time field appears once that feature is built.

### 3.7 Provision Request Management (Module 12) — User
- Three-step wizard: **Environment → Configuration → Review**.
- Step 1: the user selects Environment → Provider → **published Node (friendly name)**, not a raw hypervisor node (ADR-17); the chosen node filters catalogs/networks/datastores.
- Stores **IDs only**: `environment_id`, `provider_id`, `node_id` (published, ADR-17), `catalog_id`, `tier_id`, `network_id`, `datastore_id`, plus VM name, instance count, `security_hardening` flag, boot-disk size, and requested expiry.
- **VM naming:** the VM name entered by the user becomes **both the provider VM name and the guest OS hostname**; the hostname is applied automatically by **cloud-init (Linux) / cloudbase-init (Windows)** on first boot (not by Ansible). The system appends a two-digit sequence starting at `01` (e.g. `WIN11PRD` → `WIN11PRD01`, `WIN11PRD02`, … for a multi-instance batch).
- **Customizable boot disk:** the user may set the boot/root (`/` on Linux, `C:` on Windows) disk size at provisioning, with a floor equal to the catalog template's size. cloud-init `growpart`/`cloudbase-init` grows the filesystem to fill the disk on first boot — no manual step. The disk is modeled as a **disk list** (the boot disk is entry 0) so additional disks can be added later without a schema change (see §4 and the data-disk feature flag in §3.6).
- **Hardening is NOT a provision-time flag (ADR-14 amendment, Stage 8).** It became a **catalog-bound, on-demand, approval-gated Inventory lifecycle action** instead — a VM offers a *Harden* action only when its catalog has an admin-uploaded playbook (§3.9a, §3.10). The legacy `security_hardening` field may persist on the request for compatibility but no longer drives a provision-time Ansible step.
- Does **not** store approval decision, terraform state, or inventory lifecycle.

### 3.8 Approval & Workflow (Module 09) — Manager/Admin
- Central governance engine for `PROVISION`, `RENEWAL`, `PERMANENT`, `RESIZE`, `EDIT_RESOURCES` (the unified CPU/RAM + data-disk bundle, ADR-20), `ADD_DISK`, `DESTROY`, and `HARDEN`. (`SNAPSHOT` remains future.)
- Actions: **Approve**, **Reject**, **Revert**. Revert → "Need Modification" → user edits the reverted request → resubmit **in place** (same request, no duplicate) → Pending.
- **Admin/Manager bypass (`User::isPrivileged()`):** when the actor is an Administrator or Manager, the action applies **immediately** and never opens an approval row (still fully audited). Regular users in an `approval_required` environment go through approval.
- `action_reason` is **mandatory** on every Approve/Reject/Revert.
- **Revert is restricted to `PROVISION`** (a request not yet realized). Live-asset changes (renewal, resize, edit-resources, add-disk, destroy, harden) are Approve/Reject only — there is nothing for the user to "edit and resubmit."
- Approval status is stored only in `approval_requests` (with a `payload` JSON carrying the requested change), never on inventory.

### 3.9 Provisioning & Terraform (Module 07) — System
- Approved (or admin-bypassed) requests enter the Terraform queue. **One `ProvisionVmJob` per VM (ADR-08):** a request with `instance_count = N` fans out to N single-VM workspaces / N jobs running **in parallel** on the queue / N inventory rows — the request is the governance unit, the VM is the Terraform unit.
- Each VM gets an **isolated workspace**: `storage/app/provisioning/{username}/date_pr{DDMMYYYY_His}/{vm_name}/`.
- Backend resolves all IDs to real provider values, generates `provider.tf` (from the provider's `terraform_provider_source`/`version`) and `terraform.tfvars`, copies `main.tf`/`variables.tf` templates, then runs init → validate → plan → apply.
- Terraform state lives in the workspace on disk, **never in the database**.
- On success: inventory record created (lifecycle status **Active**) with the captured `external_vmid`, then runtime facts (observed power, IP, allocation, utilization) synced from the provider via the discovery layer (`provider_vms` → inventory). On failure: status Failed, workspace retained for retry/debugging.
- **First-boot bootstrap (cloud-init / cloudbase-init):** identity and disk are handled by the guest's init system, not Ansible — the **hostname** is set from the VM name, and the **boot disk filesystem is grown** to fill the requested size (`growpart` on Linux, volume-extend on Windows). This requires the templates to ship with cloud-init/cloudbase-init (see §7 prerequisites). Split of duties: Terraform builds the VM, cloud-init bootstraps identity/disk, Ansible hardens (§3.9a).
- **Hardening (Ansible) is on-demand, not part of provisioning (ADR-14 amendment).** A freshly provisioned VM is left in its template default state; hardening is run later as an explicit, catalog-bound Inventory lifecycle action (§3.9a, §3.10) — keeping the provision path focused on Terraform + cloud-init.

### 3.9a Configuration management & hardening (Module 07 — Ansible) — System
- Ansible is the configuration-management tool that runs **after** Terraform has created the VM, mirroring the original IaC design (Terraform builds infrastructure; cloud-init bootstraps hostname/disk; Ansible configures/hardens). Ansible does **not** set the hostname or grow disks — those belong to cloud-init/cloudbase-init.
- **Catalog-bound & on-demand (ADR-14 amendment):** an Admin uploads (and versions) an OS hardening playbook against a **catalog**; a VM exposes a *Harden* action **only when its catalog has a playbook**. Triggered explicitly from Inventory (not by a provision flag): a regular user's request is approval-gated, a Manager/Admin runs it immediately (reuses the lifecycle/approval engine, §3.8).
- Runs against the VM's **discovered IP** (never a hardcoded address) and connects **key-based** via a cloud-init-injected automation key; connection settings come from configuration, never from user input, and are never returned to the frontend.
- Hardening artifacts (the selected playbook, generated inventory, run log) live in an **isolated retained per-run workspace** (`storage/app/ansible-workspaces/{inventory_id}/{timestamp}/`). The applied playbook **checksum** and `last_hardened_at` are recorded on the VM.
- `hardening_status`: `Not Requested | Pending | Running | Success | Failed`. A hardening failure does **not** destroy the VM; it is surfaced for retry/inspection and written to the audit trail (`HARDEN_VM`).

### 3.10 Inventory & Lifecycle — User
- Inventory is the source of truth for VM ownership, lifecycle, expiry, resource assignment, and workspace references; it **mirrors** provider-synced runtime facts.
- **Dual status:** a **portal lifecycle status** (Provisioning / Active / **Updating** [in-flight resize/edit] / **Deleting** / Failed / Expired / Deleted), and a provider-synced **observed power state** (running / stopped / paused / unknown). When the provider is unreachable, observed power shows `unknown` with `last_sync_at`; lifecycle and expiry are unaffected. The main inventory table shows both side by side.
- **Resources are shown in the expandable row detail** (not a main-table column): vCPU as sockets × cores, RAM capacity, and a per-disk breakdown (multi-disk), alongside Node / Datastore / Network. These are **allocated sizes** (snapshot), not live utilization.
- **Monitoring boundary:** user inventory shows allocation + dual status only. **Live utilization** (CPU %, RAM used, node/datastore capacity) lives in the Admin dashboard for capacity planning — it is not shown per-VM to users. No time-series; utilization is a point-in-time snapshot cached in the DB.
- Lifecycle actions: Renew, Make Permanent, Edit Resources (CPU/RAM resize + optional Add Data Disk), Harden (when the VM's catalog has an uploaded playbook, §3.9a), Delete, Retry (failed), Provider Sync (scoped VM discovery → sync into inventory).
- **Edit Resources** (see §4), **Harden**, and **Delete** route through approval/terraform as appropriate (or apply immediately for privileged actors, §3.8).
- **Automatic expiry engine** (scheduled `vms:lifecycle`, every minute): a non-permanent VM **Active past its `expiry_date` → Expired** and opens a grace window (`now + env grace period`, §3.6); an **Expired VM past its `grace_period_until` → auto-destroyed** (`DestroyVmJob`) → Deleted. Provisioning stamps `expiry_date` from the env policy. **Renewal tops expiry back up toward `now + env window` but never beyond it (ADR-21);** at the cap only "Make Permanent" is offered. The UI shows a live per-second expiry/grace countdown. *(Requires the scheduler + a queue worker running — see deployment.)*

### 3.11 User / Role / Group (Module 10) — Admin
- Entities: users, roles (Administrator/Manager/User), groups (with optional `manager_user_id`).
- Bootstrap seed: an admin user + "System Administrators" group, with nullable group manager to avoid circular dependency.
- Delete protections: cannot delete a user who manages a group; cannot delete a role/group still assigned to users.
- `auth_provider` field reserved for future SSO; v1 is local only.
- **Authentication (ADR-24):** Sanctum **cookie-based SPA auth** — an HttpOnly session cookie (no token in client JS), CSRF via `/sanctum/csrf-cookie` + `X-XSRF-TOKEN`, sessions in Redis (dedicated DB). **Idle auto-logout** (warn at 55 min, out at 60 min, cross-tab) with a `SESSION_LIFETIME` backstop. **Login brute-force throttle** (email+IP, 5 failures → 429 lockout) with `LOGIN_FAILED` / `LOGIN_THROTTLED` audit rows (§3.12, §5).

### 3.12 Audit Trail (Module 11) — Admin/Manager
- Immutable, append-only log: who (snapshot of user name; `system` for engine-driven events), action type, human-readable description, IP, timestamp (in app timezone, **WIB**), and a structured **`metadata` JSONB** payload. Does **not** record terraform output or system logs.
- **Structured metadata for exact filtering:** every resource action carries `{inventory_id, vmid, vm_name, environment_id, …}`. `inventory_id` is the authoritative, never-reused key (Proxmox **recycles** `vmid` after deletion); the audit UI filters by it (Inventory-ID / VM-ID scoped search) via a GIN-indexed `jsonb @>` query.
- **One entry per action.** A user action is recorded **once** — for async lifecycle ops, at completion with the real success/failure result (`RESIZE_VM`, `ADD_DISK`, `EDIT_RESOURCES`, `HARDEN_VM`, `DELETE_VM`); synchronous actions log themselves (`VM_RENEWED`, `MAKE_PERMANENT`). Actions are attributed to **who performed them**, never the resource owner.
- **Granular system events** from the expiry engine (actor `system`): `VM_EXPIRED`, `VM_GRACE_PERIOD`, `VM_AUTO_DESTROYED`. Auth/security events: `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `LOGIN_THROTTLED`, `VIEW_CREDENTIALS`. Settings CRUD: `CREATE_*` / `UPDATE_*` / `DELETE_*`.
- RBAC-scoped visibility; CSV export (incl. the metadata column) respects active filters and visibility.

---

## 4. Feature spotlight: Inventory "Edit Resources"

A **single popup form** opened from an inventory row — not a new menu or section. It holds CPU/RAM resize always, plus an optional Add Data Disk section. Both routes are approval-gated; what differs is what happens **after** approval.

### 4.1 CPU / RAM resize — auto-applied after approval
- **Editable:** CPU and RAM.
- **Approval required:** creates a `RESIZE` request through the same approval workflow (auto-assigned to the group manager). The VM keeps running and stays in inventory while Pending.
- **Auto-applied:** on approval, the backend performs a Terraform reconfiguration against the existing workspace/state and updates the inventory resource assignment — **no human step.** (Applied live where Proxmox CPU/RAM hotplug is enabled; otherwise on next reboot.)
- **Confirmation:** the user types the exact VM name to confirm.

### 4.2 Add Data Disk — approval, then manual admin setup
Shown in the same popup **only when the environment's `allow_data_disk` is on**; otherwise hidden.
- **Editable:** add a **new** data disk (size + setup intent). Existing disks are never shrunk or modified (Proxmox/Terraform cannot safely shrink; only addition/growth is allowed).
- **Setup-intent description box:** a free-text field with placeholder guidance so the admin knows how to prepare the disk, e.g. — *Linux: mount path (`/data`, `/media`), filesystem (`ext4`, `xfs`), optional LVM; Windows: drive letter (`D:`, `E:`), partition style (`GPT`/`MBR`), format (`NTFS`).*
- **Approval required:** creates an `ADD_DISK` request through the same workflow.
- **Then manual:** on approval, Terraform attaches a **raw** disk to the VM (automated, safe). The request then enters **Pending Disk Setup**; an admin formats/mounts the disk in-guest per the description, then marks it Completed. The result is recorded as an `inventory_disks` row.
- **Reboot is a fallback, not the norm:** with virtio-scsi + disk hotplug, the guest detects the new disk via a rescan (Linux `echo "- - -" > /sys/class/scsi_host/host*/scan`; Windows *Rescan Disks*) and no reboot is needed. A reboot is only used for the rare case where hotplug detection fails; if so, the owner is notified of the window beforehand.
- **Future work:** the in-guest format/mount can be automated later via the Proxmox guest-agent exec or an Ansible play — documented as an extension, not built in v1.

### 4.3 Future feature — data disk at creation (flag-gated)
An optional data-disk field on the provision wizard, gated by the same `environments.allow_data_disk`. Because it's the VM's first boot, cloud-init `disk_setup`/`fs_setup`/`mounts` (Linux) / cloudbase-init volume init (Windows) would format and mount it with no admin step. Not built in v1; the disk-list schema and the feature flag keep it purely additive when enabled.

---

## 5. Cross-cutting requirements

- **Credential secrecy:** provider credentials are never sent to the frontend, shown in tables, or written to audit logs.
- **Authentication & session security:** Sanctum HttpOnly cookie SPA auth (no client-side token), CSRF protection, Redis-backed sessions, idle auto-logout, and login brute-force throttling (§3.11).
- **Per-VM login credentials:** each VM gets a unique random alphanumeric cloud-init password at provision time (replaces any shared default), stored **encrypted** on `inventory.login_password`, surfaced only via an **audited** reveal endpoint (`VIEW_CREDENTIALS`); the password is never shown by default.
- **Input & path-traversal hardening:** `vm_name` is validated as a DNS label (letters/digits/internal hyphens, ≤60) at the API **and re-checked before the Terraform workspace path** — blocking `/`, `..`, and `${}` interpolation in both the path and tfvars.
- **Duplicate-data protection:** case-insensitive unique names across Settings modules (shared trait + `LOWER()` functional unique indexes), and a 1-discovered-artifact → 1-published-row binding for catalog/network/datastore/node, enforced at both validation and DB level.
- **No direct provider API access** from Catalog/Network/Datastore/Provisioning/Inventory/Approval — they read from the database populated by discovery.
- **Requests store IDs only**; the backend resolves to real provider values immediately before Terraform.
- **Provider-agnostic:** all provider specifics live behind a Provider Driver; adding a provider must not change business or Terraform-flow modules.
- **Workspace isolation:** one workspace and one terraform state per request; workspaces are never auto-deleted.

---

## 6. Success metrics

- A user can request and receive a running VM end-to-end without any hypervisor access.
- 100% of provisioning, approval, and lifecycle actions appear in the audit trail.
- Zero credential exposure to the frontend (verified by API contract review).
- Adding a second Proxmox provider requires only configuration, no code changes.
- A failed deployment leaves a retained, retryable workspace with a captured error message.

---

## 7. Assumptions & open items

- **Tier value reconciliation:** the frontend prototype seeded slightly different tier sizes; the **architecture-v2 tier spec values are authoritative** (Bronze 2/4/40, Silver 4/8/80, Gold 8/16/160, Platinum 16/32/320). The implementation agent must seed these and update the frontend mock to match.
- Backend stack: **Laravel** (queues + Jobs) + **Terraform** (provisioning) + **Ansible** (post-provision hardening) + **Proxmox VE** token auth, with **PostgreSQL** as the database — consistent with the original project spec, the architecture specs, and the frontend's `apiSimulationPlugin` mock.
- Runtime facts (IP/power/status) are read only by the discovery layer via the Proxmox guest agent, cached in `provider_vms`, and synced into `inventory` by `external_vmid`; if the agent is absent, IP remains pending and a retry discovery runs until available. No other layer calls the provider, and the UI reads inventory only.
- **Template prerequisites:** OS templates must ship with cloud-init (Linux) / cloudbase-init (Windows) for hostname + boot-disk growth; use a **virtio-scsi** controller with **disk hotplug enabled** so data disks can be added without a reboot; Windows templates must have the **virtio drivers** installed. These are one-time, per-template setup steps.

## 8. Post-Stage-7 product refinements (delivered, live-verified)

- **Auto-discovery on by default (ADR-19):** since Provider Management is the source of truth, each provider auto-refreshes on a configurable interval (30s / 1m / 2m, default 2m) and the UI shows the next-discovery time; stale resources self-clean after 24h. Operators no longer click "Discover" to keep downstream menus accurate.
- **Unified "Edit Resources" (ADR-20):** changing CPU/RAM and adding a data disk in the same edit is **one** approval and **one** zero-downtime apply (live hotplug), not two sequential requests. The approval table shows the bundle scope + a color-coded breakdown.
- **Lifetime capped to the environment window (ADR-21):** renewal tops a VM's expiry up toward the env maximum but never beyond it; exceeding it requires the explicit "Make Permanent" decision.
- **Provider-truth fidelity:** a stopped VM shows no IP; vCPU reflects the online count; one consolidated VM status (Running/Stopped/Missing) across all discovery views.
- **Realtime, event-driven UI (ADR-22/23):** **Laravel Reverb WebSocket push** over a two-instance Redis topology (LRU cache vs. noeviction queue/pub-sub) replaces polling — power-flip / state changes broadcast to the UI in ~20–25s; a `ProviderSyncGuard` circuit-breaker + throttle protects the provider. Inventory & Approvals open instantly from cache; Inventory is a pure DB reader (one global Sync mirrors the latest snapshot). NotificationCenter is wired to real role-aware events.
- **Provider-upgrade safety (ADR-18):** existing VMs are **frozen** — each workspace owns its `provider.tf` + downloaded plugin + lock file, and `init` is never run with `-upgrade`; a pre-upgrade compat gate (`check-provider-compat.sh`) validates a candidate version offline before any bump. Lifecycle ops skip `init` on an already-initialized workspace, so resize/add-disk/destroy depend only on Proxmox, not the Terraform registry. The default provision stub is the non-deprecated **structured `disks` block**.
- **Security hardening:** cookie SPA auth, login throttle + failed-login audit, `vm_name` path-traversal guard, and per-VM encrypted credentials with an audited reveal (see §5).

---

## 9. Implementation status, quality & known gaps

- **Build status:** Stages 0–8 (scaffold → IAM → discovery → published/node-centric layer → policy → provision + approval → provisioning + Terraform → inventory + lifecycle → Ansible hardening) are **complete and live-verified against real Proxmox VE 9.1**, including single-VM and parallel multi-VM batches.
- **Verification scope:** the end-to-end golden-template path is verified on **Linux** (Rocky 9, Ubuntu) — clone → cloud-init hostname/disk-growth → IP discovery → optional Ansible hardening → lifecycle. **Windows / cloudbase-init is *design-ready*** (schema, wizard, and flow support it) but **not live-verified in v1**.
- **Quality / testing:** an **automated feature-test suite** (PHPUnit against a dedicated Postgres test DB) covers authentication, brute-force throttling, and RBAC; policy-enforcement, lifecycle/regression, and audit coverage are in progress. Systematic validation during integration surfaced and fixed several latent defects (e.g. renewal expiry-cap crash, worker-stale-code job failures, lifecycle `terraform init` registry fragility, audit actor attribution, timezone). Backend application logs are date-stamped daily files (`storage/logs/laravel-YYYY-MM-DD.log`).
- **Known gaps / future work (deferred, not blocking the core build):** VM power control (start/stop); containerized provisioning (Docker/Podman) and externalized Terraform state/object storage; production deployment artifacts (systemd `Restart=always` for the queue/scheduler, nginx, TLS) and prod-hardening checklist (`APP_DEBUG=false`, Reverb origins lock, Proxmox CA pinning, Redis `requirepass`, rotate seeded dev creds); `SNAPSHOT` lifecycle action; SSO via `auth_provider`.
