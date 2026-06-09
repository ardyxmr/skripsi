# Product Requirements Document (PRD)
## Proxmox Self-Service VM Provisioning Portal

**Document version:** 1.0 (architecture-v2)
**Status:** Specification — to be executed by an implementation agent
**Backend baseline:** v1 (manual dual-token provider configuration; no cluster auto-discovery of credentials)

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
- **Run Discovery Now** (manual) and **auto-discovery** on a configurable interval (15m/30m/1h/6h/12h/24h).
- Discovery results persist in `provider_nodes`, `provider_templates`, `provider_networks`, `provider_datastores`, and `provider_vms`. Missing resources are flagged `Missing`, not deleted. Discovered VM runtime facts (observed power, IP, allocation, utilization snapshot) are synced into `inventory` by `external_vmid`, which also enables drift detection (provider VMs with no inventory row; inventory rows whose provider VM went `Missing`).
- **How discovery reads Proxmox:** one cheap `/cluster/resources` call returns nodes, storage, and all VMs/templates (classified by the `template` flag) with power state and a utilization snapshot; `/nodes/{node}/qemu/{vmid}/config` is parsed (lazily) for allocation — vCPU (sockets × cores), RAM, and per-disk sizes across all buses (cdrom/efi/tpm/unused excluded). See backend doc for the parsing rules and the 2-tier sync cadence.
- **Admin utilization dashboard:** live utilization (per-VM CPU %/RAM used, node capacity, datastore cluster capacity) is surfaced to Admins for capacity planning, sourced from the same `/cluster/resources` data — kept out of the user-facing inventory.
- **Discovery Explorer**: read-only inspection of discovered resources (incl. VMs) and discovery health. Cannot modify, publish, or provision.
- Statistics widgets: Providers, Connected, Discovery Success, Templates, Networks, Datastores, VMs (all from DB, never live API calls).

### 3.2 Catalog Management (Module 02) — Admin
- Publish a **catalog item** (e.g. "Ubuntu 22.04 LTS") that abstracts exactly one discovered provider template (e.g. `ubuntu2204-template`).
- Fields: name, description, provider, node, template, image, status.
- Catalog image upload: PNG/JPG/JPEG/WEBP, 512×512, max 2 MB, stored under `storage/app/catalog-images/`.
- Status: Active / Inactive / Provider Offline / Template Missing.
- The user-facing Catalog page reads only from `catalogs` — never from `provider_templates`.

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
- Environment is a **policy layer**, not just a label. Each environment defines: expiry policy, approval policy (`approval_required`), the data-disk policy (`allow_data_disk`), and allow-lists for providers, tiers, networks, datastores.
- Drives Step 1 of the provision wizard: only allowed resources are shown.
- **`allow_data_disk`** (checkbox in environment create/edit, default off): gates the whole additional-data-disk capability for VMs in this environment. When off, the "Add data disk" section in Edit Resources is hidden, and the future creation-time data-disk field (§4) does not appear. When on, the Add Data Disk action is available today; the creation-time field appears once that feature is built.

### 3.7 Provision Request Management (Module 12) — User
- Three-step wizard: **Environment → Configuration → Review**.
- Stores **IDs only**: `environment_id`, `provider_id`, `provider_node_id`, `catalog_id`, `tier_id`, `network_id`, `datastore_id`, plus VM name, instance count, `security_hardening` flag, boot-disk size, and requested expiry.
- **VM naming:** the VM name entered by the user becomes **both the provider VM name and the guest OS hostname**; the hostname is applied automatically by **cloud-init (Linux) / cloudbase-init (Windows)** on first boot (not by Ansible). The system appends a two-digit sequence starting at `01` (e.g. `WIN11PRD` → `WIN11PRD01`, `WIN11PRD02`, … for a multi-instance batch).
- **Customizable boot disk:** the user may set the boot/root (`/` on Linux, `C:` on Windows) disk size at provisioning, with a floor equal to the catalog template's size. cloud-init `growpart`/`cloudbase-init` grows the filesystem to fill the disk on first boot — no manual step. The disk is modeled as a **disk list** (the boot disk is entry 0) so additional disks can be added later without a schema change (see §4 and the data-disk feature flag in §3.6).
- **Security Hardening** is a checkbox on the configuration step; its value is persisted on the request and drives the Ansible step (§3.9a).
- Does **not** store approval decision, terraform state, or inventory lifecycle.

### 3.8 Approval & Workflow (Module 09) — Manager/Admin
- Central governance engine for `PROVISION`, `RENEWAL`, `PERMANENT` (and future `RESIZE`, `SNAPSHOT`, `DESTROY`).
- Actions: **Approve**, **Reject**, **Revert**. Revert → "Need Modification" → user edits the reverted request → resubmit → Pending.
- `action_reason` is **mandatory** on every action.
- Renewal and Permanent support only Approve/Reject (no Revert — nothing for the user to fix).
- Approval status is stored only in `approval_requests`, never on inventory.

### 3.9 Provisioning & Terraform (Module 07) — System
- Approved requests enter the Terraform queue; `ProvisionVmJob` executes per request.
- Each request gets an **isolated workspace**: `storage/app/provisioning/{username}/date_pr{DDMMYYYY_His}/`.
- Backend resolves all IDs to real provider values, generates `provider.tf` (from the provider's `terraform_provider_source`/`version`) and `terraform.tfvars`, copies `main.tf`/`variables.tf` templates, then runs init → validate → plan → apply.
- Terraform state lives in the workspace on disk, **never in the database**.
- On success: inventory record created (lifecycle status **Active**) with the captured `external_vmid`, then runtime facts (observed power, IP, allocation, utilization) synced from the provider via the discovery layer (`provider_vms` → inventory). On failure: status Failed, workspace retained for retry/debugging.
- **First-boot bootstrap (cloud-init / cloudbase-init):** identity and disk are handled by the guest's init system, not Ansible — the **hostname** is set from the VM name, and the **boot disk filesystem is grown** to fill the requested size (`growpart` on Linux, volume-extend on Windows). This requires the templates to ship with cloud-init/cloudbase-init (see §7 prerequisites). Split of duties: Terraform builds the VM, cloud-init bootstraps identity/disk, Ansible hardens (§3.9a).
- **Post-provision hardening (Ansible):** if the request's `security_hardening` flag is on, after a successful `terraform apply` and IP discovery the system runs a standard Ansible hardening playbook against the new VM (reached at its discovered IP). The playbook/inventory are rendered into the same per-request workspace and the hardening log is retained alongside the Terraform artifacts. The VM stays in inventory regardless; only `hardening_status` reflects the outcome (Success/Failed). If hardening is off, the VM is left in its template default state. See §3.9a.

### 3.9a Configuration management & hardening (Module 07 — Ansible) — System
- Ansible is the configuration-management tool that runs **after** Terraform has created the VM, mirroring the original IaC design (Terraform builds infrastructure; cloud-init bootstraps hostname/disk; Ansible configures/hardens). Ansible does **not** set the hostname or grow disks — those belong to cloud-init/cloudbase-init.
- Triggered only when `security_hardening = true` on the originating request; otherwise skipped.
- Runs against the VM's **discovered IP** (never a hardcoded address); connection settings come from configuration, never from user input, and are never returned to the frontend.
- Hardening artifacts (playbook, generated inventory, run log) live in the same isolated workspace as Terraform — one combined state/configuration directory per request, as in the original design.
- `hardening_status`: `Not Requested | Pending | Running | Success | Failed`. A hardening failure does **not** destroy the VM; it is surfaced for retry/inspection and written to the audit trail (`HARDEN_VM`).

### 3.10 Inventory & Lifecycle — User
- Inventory is the source of truth for VM ownership, lifecycle, expiry, resource assignment, and workspace references; it **mirrors** provider-synced runtime facts.
- **Dual status:** a **portal lifecycle status** (Provisioning / Active / Failed / Expired / Deleted), and a provider-synced **observed power state** (running / stopped / paused / unknown). When the provider is unreachable, observed power shows `unknown` with `last_sync_at`; lifecycle and expiry are unaffected. The main inventory table shows both side by side.
- **Resources are shown in the expandable row detail** (not a main-table column): vCPU as sockets × cores, RAM capacity, and a per-disk breakdown (multi-disk), alongside Node / Datastore / Network. These are **allocated sizes** (snapshot), not live utilization.
- **Monitoring boundary:** user inventory shows allocation + dual status only. **Live utilization** (CPU %, RAM used, node/datastore capacity) lives in the Admin dashboard for capacity planning — it is not shown per-VM to users. No time-series; utilization is a point-in-time snapshot cached in the DB.
- Lifecycle actions: Renew, Make Permanent, Edit Resources (CPU/RAM resize + optional Add Data Disk), Delete, Retry (failed), Provider Sync (scoped VM discovery → sync into inventory).
- **Edit Resources** (see §4) and **Delete** route through approval/terraform as appropriate.

### 3.11 User / Role / Group (Module 10) — Admin
- Entities: users, roles (Administrator/Manager/User), groups (with optional `manager_user_id`).
- Bootstrap seed: an admin user + "System Administrators" group, with nullable group manager to avoid circular dependency.
- Delete protections: cannot delete a user who manages a group; cannot delete a role/group still assigned to users.
- `auth_provider` field reserved for future SSO; v1 is local only.

### 3.12 Audit Trail (Module 11) — Admin/Manager
- Immutable log: who, what action, human-readable description, IP, timestamp, with a snapshot of the user name.
- Records business actions (CREATE_VM, APPROVE_VM, REVERT_VM, CREATE_PROVIDER, SYNC_PROVIDER, LOGIN, …); does **not** record terraform output or system logs.
- RBAC-scoped visibility; CSV export respects active filters and visibility; default page size 25.

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
