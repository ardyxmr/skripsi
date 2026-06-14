# Proxmox Self-Service VM Provisioning Portal — Design Package

This package contains eight specification documents for an implementation agent to execute. They describe the **backend to be built against the existing React frontend**, following the architecture-v2 specs. No implementation code is produced here — these are planning/spec deliverables.

## Reading order

1. **01-PRD.md** — what the product is, personas, functional requirements per module, the Inventory "Edit Resources" feature, success metrics.
2. **02-implementation-plan.md** — phased build (IAM → Discovery → Published → Policy → Request/Approval → Provisioning/Terraform → Inventory/Lifecycle → Audit/hardening) with dependencies and exit criteria.
3. **03-architectural-decisions.md** — 21 binding ADRs (layering, provider=cluster, dual credentials, published abstractions, IDs-only resolution, approval≠execution, isolated workspaces, generated provider.tf, provider-sourced runtime facts via discovery, Edit Resources split, immutable audit, provider-agnostic driver, Ansible hardening after apply, cloud-init identity/disk bootstrap, gated data-disk flow, published nodes, pinned-provider gated upgrades, scheduled per-provider auto-discovery + 24h prune, bundled Edit Resources, lifetime capped to env window).
4. **04-backend-services.md** — service decomposition by layer, the Provider Driver, the resolution service, `ProvisionVmJob`, and key collaborations.
5. **Frontend-new-Design.md** — the React app structure (stack, layout, pages, settings module pattern, design system) and the backend-integration checklist. *(This replaces the earlier `05-frontend-structure.md`; same purpose.)*
6. **06-database-schema.md** — full relational schema by layer, with rules and an ER overview.
7. **07-api-contract.md** — REST endpoints, request/response shapes, RBAC gates, and contract-level security invariants.
8. **08-deployment-workflow.md** — application deployment, the per-request provisioning workflow, release/rollback, and a go-live checklist.

**Companion (operational, not one of the eight specs):** **frontend-existing-design.md** — a patch list that maps these specs onto the *current* React repo (field-name cleanup, modal fixes, new fields). Where it disagrees with `Frontend-new-Design.md` or the architecture-v2 specs, those win.

## Authoritative reconciliations baked into these docs

- **Dual-token provider auth (v1):** separate read-only **discovery** credential and **provisioning** credential per provider, both encrypted, never returned to the frontend. No cluster auto-discovery of credentials in v1.
- **Tier values:** architecture-v2 spec is authoritative — Bronze 2/4/40, Silver 4/8/80, Gold 8/16/160, Platinum 16/32/320 (GB/GB-RAM/GB-disk; RAM stored in MB). Frontend mock to be updated to match.
- **Edit Resources:** a single popup with two approval-gated routes. **CPU/RAM resize** (`RESIZE`) is **auto-applied** by Terraform on approval (no admin step). **Add Data Disk** (`ADD_DISK`), shown only when the environment's `allow_data_disk` is on, attaches a raw disk via Terraform on approval, then an **admin** formats/mounts it in-guest (Pending Disk Setup → Ready); existing disks are never shrunk; VM-name confirmation required.
- **Requests store IDs only**; the backend resolves to real provider values immediately before Terraform.
- **Published node (ADR-17):** node is the fourth published abstraction (alongside catalog/network/datastore); requests and inventory store the published `node_id`, and raw node names are admin-only (discovery/explorer + the Node Preview panel). Resolution `node_id → provider_node_id → target_node` happens just before Terraform.
- **Per-request isolated Terraform workspace**; state on disk, never in the database; workspaces never auto-deleted.
- **Runtime facts via the discovery layer:** all provider GETs (resources *and* VM runtime) go through the driver, using one cheap `/cluster/resources` call (status + utilization snapshot, frequent) plus lazy `/config` parsing (allocation). Discovery populates `provider_vms`; `VmFactSyncService` maps facts into `inventory` by `external_vmid`. The UI reads inventory only; `provider_vms` also enables drift detection. Inventory stays the governance source of truth.
- **Dual status & monitoring boundary:** inventory carries a portal **lifecycle status** (Provisioning/Active/Failed/Expired/Deleted) and a provider-synced **observed power state** (running/stopped/paused/unknown; `unknown` + `last_sync_at` when the provider is down). User inventory shows allocation (vCPU as sockets×cores, RAM, per-disk sizes) in the row's expandable detail; live utilization (CPU%/RAM, node/datastore capacity) is Admin-only. Utilization is a point-in-time snapshot, not time-series.
- **Post-provision hardening (Ansible):** when a request's `security_hardening` flag is on, Ansible runs the standard hardening playbook **after** a successful `terraform apply` and IP discovery, inside the same per-request workspace. Outcome is tracked in `inventory.hardening_status` and audited (`HARDEN_VM`); a hardening failure never destroys the VM.
- **Identity & disk bootstrap (cloud-init / cloudbase-init):** the guest hostname (= VM name) and boot-disk growth happen on first boot via cloud-init/cloudbase-init — **not** Ansible. Duty split: Terraform builds, cloud-init bootstraps identity/disk, Ansible hardens.
- **Customizable boot disk:** boot/root(C:) size is set at provisioning (≥ template size); modeled as a disk list (boot = index 0) so data disks are additive. A creation-time data-disk field is a documented future feature behind `allow_data_disk`.
- **Template prerequisites:** cloud-init/cloudbase-init installed; virtio-scsi + disk hotplug enabled; virtio drivers on Windows.
- **VM naming:** the entered VM name is both the provider VM name and the guest OS hostname, with a two-digit sequence suffix starting at `01`.
- **Database:** PostgreSQL (per the original project spec).

## Source inputs

- Existing React frontend (in project; mirrored on the user's GitHub repo).
- architecture-v2 module specs: provider-discovery, catalog, network, datastore, tier, environment, provision-request, approval, provisioning, inventory, user, audit.
- `api-get-proxmox.txt` — real Proxmox VE discovery endpoint samples used in the API/driver design.
