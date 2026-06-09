# Architectural Decisions
## Proxmox Self-Service VM Provisioning Portal

This document records the binding architectural decisions. The implementation agent must not violate these; they are the contract that keeps the system provider-agnostic, governable, and auditable.

Each decision is written in lightweight ADR form: **Context → Decision → Consequences**.

---

## ADR-01 — Layered architecture with strict boundaries

**Context.** Mixing provider API calls into business logic produces a system that cannot add providers or be reasoned about.

**Decision.** Enforce these layers, top to bottom:

1. **Discovery Layer** — reads from the provider into `provider_*` tables.
2. **Published / Service Layer** — admin-curated `catalogs`, published `networks`, published `datastores` abstracting discovered resources.
3. **Business / Policy Layer** — `environments`, `tiers`, `approval_requests`.
4. **Orchestration Layer** — provision requests, resource resolution, workspace management (`ProvisionVmJob`).
5. **Terraform Layer** — renderer, execution, state.
6. **Infrastructure Layer** — Proxmox/OpenStack/etc.

**Consequences.** Catalog/Network/Datastore/Provisioning/Inventory/Approval **never** call a provider API directly — they read the database. A change in the Infrastructure Layer never forces a change in the Business Layer, and vice versa.

---

## ADR-02 — Provider is a cluster/endpoint, not a node

**Context.** A Proxmox cluster has many nodes; resources (templates, networks, datastores) live on specific nodes.

**Decision.** A `provider` represents an infrastructure endpoint/cluster. Nodes are discovered children (`provider_nodes`). Every discovered template/network/datastore is bound to the node it was found on, so two `vmbr0`s on different nodes are distinct resources.

**Consequences.** Resolution always traverses provider → node → resource. Provider is the single source of truth for all discovered resources.

---

## ADR-03 — Dual-credential provider authentication (v1)

**Context.** v1 does not use cluster auto-discovery of credentials. Discovery and provisioning have very different privilege needs.

**Decision.** Each provider stores **two** credential pairs:

- **Discovery credential** — `discovery_username`, `discovery_token_id`, `discovery_token_secret` — recommended read-only (e.g. PVEAuditor). Used by the discovery service only.
- **Provisioning credential** — `provision_username`, `provision_token_id`, `provision_token_secret` — sufficient privileges for VM lifecycle. Used by Terraform only.

Both secrets are stored **encrypted**. Proxmox auth header form: `Authorization: PVEAPIToken={user}@{realm}!{tokenid}={secret}`.

**Consequences.** Compromise of the read-only discovery path cannot provision/destroy VMs. Credentials are never returned to the frontend, shown in any table, or written to audit logs (audit records only Provider Created/Updated/Deleted).

---

## ADR-04 — Published abstractions hide raw provider identifiers

**Context.** Users must not see `ubuntu2204-template`, `vmbr0`, or `local-lvm`.

**Decision.** Users only ever see published names ("Ubuntu 22.04 LTS", "Development Network", "Standard Storage"). The user-facing Catalog page reads only from `catalogs`, never from `provider_templates`. One catalog item maps to exactly one template.

**Consequences.** Raw identifiers are resolved only inside the backend at provisioning time. Renaming a published resource never affects the underlying provider.

---

## ADR-05 — Requests store IDs only; backend resolves before Terraform

**Context.** Terraform needs concrete provider values; persisting them on the request would freeze stale data and leak provider details.

**Decision.** `provision_requests` and `inventory` store only published/business IDs (`environment_id`, `provider_id`, `provider_node_id`, `catalog_id`, `tier_id`, `network_id`, `datastore_id`). Immediately before `terraform init`, the backend resolves these to `target_node`, `template`, `network`, `storage`, `cpu`, `memory`, `disk_size`. Terraform **never** receives an `*_id`.

**Consequences.** A single resolution service is the only place IDs become provider values. Tier is resolved to CPU/RAM/disk here, so editing a tier never changes already-provisioned VMs.

---

## ADR-06 — Approval engine decoupled from execution engine

**Context.** Approval must govern many action types (provision, renewal, permanent, future resize/snapshot/destroy) without growing a special case per type.

**Decision.** The Workflow/Approval Engine knows only `request_type`, `status`, and `action_type`. Execution logic per type lives in a separate Execution Engine. Adding a new request type requires only a new type + execution logic — no change to the approval queue, actions, history, or engine.

**Consequences.** `approval_requests.reference_id` is a polymorphic pointer to the underlying request. Approval status is stored only in `approval_requests` and never on inventory (see ADR-07). Approver is auto-assigned via group manager; users never choose.

---

## ADR-07 — Approval state and infrastructure state are separate

**Context.** Conflating "is this approved?" with "is this VM running?" creates ambiguous state.

**Decision.** `inventory` is the source of truth for **governance/lifecycle** state — the portal lifecycle `status` (Provisioning/Active/Failed/Expired/Deleted), ownership, expiry, resource assignment, workspace refs. It additionally carries a provider-synced **`observed_power_state`** (running/stopped/paused/unknown) that mirrors the hypervisor but never overrides lifecycle. `approval_requests` is the source of truth for workflow state (Pending/Approved/Rejected/Reverted). On conflict, inventory wins for VM condition, approval wins for workflow history.

**Consequences.** A VM's lifecycle stays Active while a renewal/permanent/resize request is Pending, regardless of observed power. If the provider is unreachable, `observed_power_state` becomes `unknown` (with `last_sync_at`) while lifecycle and expiry keep working. Inventory has no approval columns.

---

## ADR-08 — Per-request isolated Terraform workspace; state on disk

**Context.** Shared state risks cross-deployment corruption and makes destroy/retry/audit hard.

**Decision.** Each provision request owns a workspace `storage/app/provisioning/{username}/date_pr{DDMMYYYY_His}/` containing `provider.tf`, `main.tf`, `variables.tf`, `terraform.tfvars`, `terraform.tfstate(.backup)`, `deployment.json`, and logs. **State is never stored in the database.** Workspaces are never auto-deleted, including on failure or destroy.

**Consequences.** Inventory stores `workspace_path` + `terraform_state_path` so the lifecycle engine can retry/destroy without searching. `deployment.json` is local metadata only — the database remains source of truth.

---

## ADR-09 — `provider.tf` is generated per workspace

**Context.** Different providers/versions of the Terraform provider must coexist without code edits.

**Decision.** Render `provider.tf` at deploy time from the provider's `terraform_provider_source` (e.g. `Telmate/proxmox`) and `terraform_provider_version` (e.g. `3.0.2-rc04`). `main.tf`/`variables.tf` are stable templates copied per workspace.

**Consequences.** Upgrading the Terraform provider is a configuration change, not a code change.

---

## ADR-10 — Runtime facts come from the provider, collected via the discovery layer

**Context.** IP/host/power status are assigned by the hypervisor after boot. They must be read from the provider — but reads must not bypass the discovery layer (ADR-01), or each lifecycle service would grow its own provider client.

**Decision.** **All** provider GET traffic — discovered resources *and* VM runtime facts — flows through the `ProviderDriver`/discovery layer. The driver exposes `discoverVms()`; discovery upserts a `provider_vms` table (the provider's ground truth: `external_vmid`, name, power state, IP). A `VmFactSyncService` then maps those facts into `inventory` by `external_vmid`. After apply and on "Provider Sync", a **scoped** VM discovery runs (with retry until the guest-agent IP is available). IP is never hardcoded, manually entered, or placed in Terraform config. The provider is source of truth for runtime facts; inventory mirrors them; **the UI reads inventory only**, never the provider live.

**Consequences.** Inventory shows actual IPs with fast, provider-independent reads; no service outside discovery talks to the provider. Discovery reads `/cluster/resources` (cheap, frequent — power + utilization snapshot) and `/config` (lazy — allocation), and writes a portal-owned lifecycle status plus a provider-synced `observed_power_state`. User inventory shows allocation + dual status; live utilization (CPU%/RAM, node/datastore capacity) is Admin-only. Because `provider_vms` is the provider's truth, the system can detect **drift** (inventory rows whose `provider_vms` entry is `Missing`, or provider VMs with no inventory row). Adding a provider later means implementing one `discoverVms()` — the sync and inventory stay unchanged.

---

## ADR-11 — Edit Resources: CPU/RAM auto-applied, data disks added via a separate gated flow

**Context.** Resource changes need governance; disk shrink is unsafe; and growing/attaching disks on a running VM needs in-guest work that differs by OS, while CPU/RAM changes do not.

**Decision.** Inventory "Edit Resources" is a single popup with two routes, both approval-gated (auto-assigned to the group manager, VM-name confirmation required), differing only in fulfilment:
- **CPU/RAM** → `RESIZE` request → on approval, Terraform reconfigures the existing workspace/state **automatically**, no human step.
- **Add data disk** → `ADD_DISK` request, shown only when `environments.allow_data_disk` is on → on approval, Terraform attaches a **raw** disk, then an admin formats/mounts it in-guest (status Pending Disk Setup → Ready). Existing disks are never shrunk or modified.

**Consequences.** Both reuse the generic approval engine (ADR-06) and existing workspace (ADR-08); no destructive disk operations are possible from the portal. The manual disk step is a deliberate scope choice — automating it (guest-agent exec / Ansible) is future work, and a creation-time data-disk field is a future extension behind the same flag (the disk model is a list, so enabling it needs no migration).

---

## ADR-12 — Immutable, business-level audit trail

**Context.** Governance requires a tamper-evident record of human/business actions.

**Decision.** `audit_logs` is append-only and records WHO (with a name snapshot), WHAT (`action_type` + human-readable description), WHEN, and source IP. It records business actions only — not Terraform output or system logs. Visibility is RBAC-scoped; CSV export respects active filters and visibility.

**Consequences.** Every state-changing endpoint writes one audit row. Credentials and secrets are never written to audit.

---

## ADR-13 — Provider-agnostic from day one

**Context.** Proxmox today; OpenStack/OLVM/VMware/Nutanix later.

**Decision.** All provider specifics live behind the Provider Driver interface (`testConnection`, `discoverNodes`, `discoverTemplates`, `discoverNetworks`, `discoverDatastores`, `syncResources`, `getNodeHealth`). Business logic calls these methods and never branches on provider type. Endpoint maps live in `config/provider_endpoints.php`.

**Consequences.** Adding a provider = new driver + endpoint config + (optionally) a Terraform provider source/version. No changes to catalog, network, datastore, environment, tier, approval, provisioning flow, or inventory.

---

## ADR-14 — Post-provision configuration via Ansible, decoupled from Terraform

**Context.** The original design splits responsibilities: Terraform builds the VM (infrastructure), Ansible configures and hardens it (configuration management). Hardening is an optional, per-request step and must not be entangled with the Terraform create/destroy lifecycle.

**Decision.** Treat hardening as a distinct stage that runs **only after a successful `terraform apply` and IP discovery**, gated by the request's `security_hardening` flag. Ansible connects to the VM at its **discovered IP** (never a hardcoded address), using connection settings sourced from configuration — never user input, never returned to the frontend. The hardening playbook, generated inventory, and run log live in the **same per-request workspace** as the Terraform artifacts (one combined state/configuration directory per request). Outcome is tracked in `inventory.hardening_status` and audited as `HARDEN_VM`.

**Consequences.** A hardening failure never destroys the VM — the VM lifecycle remains Active and the failure is surfaced for retry/inspection. Terraform remains the only path that creates or destroys infrastructure; Ansible only configures what already exists. Skipping hardening (flag off) leaves the VM in its template default state. Providers added later are unaffected: the hardening stage operates on a discovered IP, independent of provider type.

---

## ADR-15 — Identity and disk bootstrap via cloud-init / cloudbase-init

**Context.** The guest hostname must equal the VM name, and a custom boot-disk size must be reflected inside the guest. Doing this with Ansible would require SSH/WinRM orchestration for something the guest's own init system does natively on first boot.

**Decision.** Use **cloud-init (Linux) / cloudbase-init (Windows)** for first-boot bootstrap: the **hostname** is set from the VM name, and the **boot-disk filesystem is grown** to the requested size (`growpart`/resize on Linux, volume-extend on Windows). These run on first boot from parameters Terraform renders into `terraform.tfvars`. The duty split is: **Terraform builds the VM, cloud-init bootstraps identity/disk, Ansible hardens.** Ansible never sets the hostname or touches disks. Templates must ship with cloud-init/cloudbase-init and a virtio-scsi controller with disk hotplug enabled (and virtio drivers on Windows) — these are documented prerequisites.

**Consequences.** Hostname and boot-disk sizing need no SSH/WinRM and no Ansible. The disk is modeled as a list (boot disk = index 0), so a future creation-time data-disk field (gated by `environments.allow_data_disk`) is purely additive. Adding a data disk to a *running* VM is a separate concern handled by ADR-11.

---

## ADR-16 — Data disks: boot disk at creation, data disks via a gated lifecycle flow

**Context.** Growing the boot disk is trivial at creation (cloud-init), but attaching/formatting a disk on a running VM needs in-guest, OS-specific work. The common need ("a bigger disk") and the rarer need ("a separate data disk later") have different costs.

**Decision.** Provisioning customizes only the **boot disk size** (auto-grown by cloud-init). Adding a **data disk** is a lifecycle action, available only when `environments.allow_data_disk` is on: an `ADD_DISK` approval → Terraform attaches a **raw** disk → an admin formats/mounts it in-guest (status Pending Disk Setup → Ready), with a reboot used only as a hotplug fallback. The requester's free-text setup intent (mount path, filesystem, partition/format) guides the admin.

**Consequences.** No fragile cross-OS auto-format logic in v1; the infrastructure half (attach) is automated, the in-guest half is a deliberate manual step, and everything stays inside the approval/audit trail. Full automation (guest-agent exec / Ansible) is documented future work. A single environment flag governs the whole data-disk capability (lifecycle now, creation-time field later).

---

## Decision summary table

| ID | Decision | Primary invariant it protects |
|----|----------|-------------------------------|
| 01 | Strict layering | No direct provider calls from business layer |
| 02 | Provider = cluster | Node-scoped resource resolution |
| 03 | Dual credentials | Least privilege + credential secrecy |
| 04 | Published abstractions | Users never see raw identifiers |
| 05 | IDs only + late resolution | No stale/leaked provider values in requests |
| 06 | Approval ≠ execution | Extensible workflow without engine changes |
| 07 | Approval vs infra state | Unambiguous source of truth |
| 08 | Isolated workspace, disk state | Safe destroy/retry/audit |
| 09 | Generated provider.tf | Provider version is config |
| 10 | Runtime facts via discovery layer | Accurate IP/status; all provider reads centralized |
| 11 | Edit Resources: CPU/RAM auto, disk gated | No unsafe disk ops; clear fulfilment split |
| 12 | Immutable audit | Governance & traceability |
| 13 | Provider-agnostic driver | Future multi-provider |
| 14 | Ansible hardening after apply | Config decoupled from infra lifecycle |
| 15 | cloud-init identity/disk bootstrap | Hostname/disk without SSH or Ansible |
| 16 | Data disks: boot at create, data gated | Common case easy; rare case auditable |
