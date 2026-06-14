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

**Decision.** Users only ever see published names ("Ubuntu 22.04 LTS", "Development Network", "Standard Storage", "Jakarta Zone A"). The user-facing Catalog page reads only from `catalogs`, never from `provider_templates`. One catalog item maps to exactly one template. (Node joined the published abstractions in ADR-17.)

**Consequences.** Raw identifiers are resolved only inside the backend at provisioning time. Renaming a published resource never affects the underlying provider.

---

## ADR-05 — Requests store IDs only; backend resolves before Terraform

**Context.** Terraform needs concrete provider values; persisting them on the request would freeze stale data and leak provider details.

**Decision.** `provision_requests` and `inventory` store only published/business IDs (`environment_id`, `provider_id`, `node_id` (published, per ADR-17), `catalog_id`, `tier_id`, `network_id`, `datastore_id`). Immediately before `terraform init`, the backend resolves these to `target_node` (via `node_id → provider_node_id → provider_nodes.node_name`), `template`, `network`, `storage`, `cpu`, `memory`, `disk_size`. Terraform **never** receives an `*_id`.

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

## ADR-08 — Per-VM isolated Terraform workspace; state on disk

**Context.** Shared state risks cross-deployment corruption and makes destroy/retry/audit hard. A batch request (`instance_count = N`) compounds this: a single `count=N`/`for_each` workspace shares one state across N VMs, so a per-VM resize re-plans all N, retry-one is messy, and `count` re-indexing can destroy the wrong sibling.

**Decision.** The **VM** is the Terraform unit (not the request): each VM owns a workspace `storage/app/provisioning/{username}/date_pr{DDMMYYYY_His}/{vm_name}/` containing `provider.tf`, `main.tf` (single VM, fully variable-driven), `variables.tf`, `terraform.tfvars`, `terraform.tfstate(.backup)`, `deployment.json`, and logs. A request with `instance_count = N` **fans out to N workspaces / N queued `ProvisionVmJob`s (parallel on the queue) / N inventory rows**; the **request** remains the single governance unit (one approval, one audit). **State is never stored in the database.** Workspaces are never auto-deleted, including on failure or destroy.

**Consequences.** Each inventory row stores its own `workspace_path` + `terraform_state_path`, so resize/add-disk/delete/retry operate on **that VM's** workspace — a resize re-renders only that VM's `terraform.tfvars` and applies in place, never touching siblings; `main.tf` never changes. `deployment.json` is local metadata only — the database remains source of truth. Tradeoff: N workspaces/applies per batch (vs one) — mitigated by running the per-VM jobs in parallel; the isolation is the standard pattern for VM self-service portals.

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

**Amendments (post-Stage-7, see ADR-19).** Two facts are runtime-scoped: (a) **vCPU** is parsed as the *online* count — Proxmox's `vcpus` field when set (the hotplug-headroom model builds a VM `cores=MAX, vcpus=tier.cpu`), falling back to `sockets × cores` only when uncapped — so inventory reflects the tier allocation, not the max topology; (b) **IP is flushed when the VM is not running** (`VmFactSyncService` clears it on stop; the last-known IP is kept only for a *running* VM with a momentary guest-agent miss). The "Provider Sync" path is no longer a per-VM live call from Inventory — Inventory mirrors `provider_vms` from the DB (global `POST /inventory/sync-all`), and live provider reads happen only in Provider Management + the scheduled discovery engine (ADR-19).

---

## ADR-11 — Edit Resources: CPU/RAM auto-applied, data disks added via a separate gated flow

**Context.** Resource changes need governance; disk shrink is unsafe; and growing/attaching disks on a running VM needs in-guest work that differs by OS, while CPU/RAM changes do not.

**Decision.** Inventory "Edit Resources" is a single popup with two routes, both approval-gated (auto-assigned to the group manager, VM-name confirmation required), differing only in fulfilment:
- **CPU/RAM** → `RESIZE` request → on approval, Terraform reconfigures the existing workspace/state **automatically**, no human step.
- **Add data disk** → `ADD_DISK` request, shown only when `environments.allow_data_disk` is on → on approval, Terraform attaches a **raw** disk, then an admin formats/mounts it in-guest (status Pending Disk Setup → Ready). Existing disks are never shrunk or modified.

**Consequences.** Both reuse the generic approval engine (ADR-06) and existing workspace (ADR-08); no destructive disk operations are possible from the portal. The manual disk step is a deliberate scope choice — automating it (guest-agent exec / Ansible) is future work, and a creation-time data-disk field is a future extension behind the same flag (the disk model is a list, so enabling it needs no migration).

**Superseded for bundling by ADR-20.** CPU/RAM and data-disk adds are still governed exactly as above, but the *modal now submits a single bundled request* (`EDIT_RESOURCES`) applied in one Terraform run, instead of separate `RESIZE` + `ADD_DISK` requests/jobs.

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

## ADR-17 — Node is a published abstraction, like Catalog/Network/Datastore

**Context.** ADR-04 hides raw provider identifiers, but the provision wizard exposed `provider_nodes.node_name` directly, and requests stored the raw `provider_node_id`. This is the one place the published-layer contract was broken.

**Decision.** Add a published `nodes` table mirroring published `networks`/`datastores`. Users select a published node by friendly name; `provision_requests` and `inventory` store the published `node_id`; `ResourceResolutionService` resolves `node_id → provider_node_id → target_node` immediately before Terraform. Raw node names are admin-only (discovery/explorer + Node Preview).

**Consequences.** Node now obeys ADR-04 (no raw identifiers to users) and ADR-05 (IDs only, late resolution). Renaming a published node never touches the provider. Adding a provider type is still one `discoverNodes()` — unchanged. The published-layer count goes from three to four; no new engine or workflow concepts are introduced.

---

## ADR-18 — Terraform provider version is pinned per workspace; upgrades are gated, never in-place

**Context.** The Terraform provider (currently `Telmate/proxmox @ 3.0.2-rc04`) and the Proxmox version it targets will both move over the life of the system. The provisioning stub also relies on Telmate's **legacy indexable `disk` list** block (chosen for the gated data-disk flow, ADR-16) — a block that is *deprecated* and could be removed in a future provider release. A naïve "bump the version everywhere" would risk breaking the schema under already-deployed VMs.

**Decision.** Provider upgrades are treated as a **gated, opt-in, forward-only configuration change** (building on ADR-08/09):

1. **Existing VMs are frozen.** Each workspace owns its `provider.tf` (exact version, no ranges) plus its downloaded provider binary and `.terraform.lock.hcl`. `TerraformRunner` runs plain `terraform init` — **never `init -upgrade`** — so a version change in the DB only affects *new* provisions. Day-2 ops on an old VM keep using that VM's pinned provider.
2. **Pin to exact versions; prefer stable over RC.** The rendered `version = "x.y.z"` is always exact. Move off the release candidate to a stable `3.0.x` when one is published.
3. **Gate every bump.** Before changing `providers.terraform_provider_version`, run `backend/scripts/check-provider-compat.sh <version>` — it validates the master stub against the candidate provider in a throwaway workspace (catches schema breaks such as the `disk` list being removed) — then smoke-test one real VM (provision + add-disk + resize + destroy) on a throwaway environment.
4. **Stub variants coexist.** Because provider coupling is contained to `main.tf`/`variables.tf` + the generated `provider.tf`, a stub needing a different schema gets a *new* variant selected by `config('provisioning.stub_variant')` in `WorkspaceService`; existing workspaces already copied their stub, so variants run side by side. **Realized:** a `structured` stub (non-deprecated Telmate `disks` block, order-stable, no indexed disk-ignore) and the original `legacy` stub (deprecated indexable `disk` list) now coexist, with `structured` the default for new provisions; `scripts/check-provider-compat.sh <ver> [source] [variant]` validates either. The structured stub also fixes the data-disk count at a **physical slot ceiling** (`config('provisioning.max_data_disk_slots')`), under which each environment sets a softer policy cap `max_data_disks` (two-tier capping, ADR-16); the cap is enforced at env-save, at the add-disk request, and re-checked serially in `AddDiskJob`.
5. **Forced migrations are per-VM.** If a Proxmox/API change ever forces existing VMs onto a new provider, migrate **one workspace at a time** (snapshot → `terraform plan`, never auto-apply → reconcile with `moved {}`/`state mv`/`import`). ADR-08 isolation means a bad migration risks a single VM, not the fleet.

**Consequences.** The blast radius of any provider change is small and localized: new provisions can be validated and rolled forward without disturbing running VMs, and the deprecated `disk` block is an accepted, controlled dependency rather than a latent fleet-wide hazard. The trade-off is that multiple provider versions may be live at once (different VMs on different providers) — acceptable, and exactly what the per-workspace design already supports. The structured `disks` stub is now the default (off the deprecated block); migrating *existing* legacy-stub VMs, or switching to the `bpg/proxmox` provider, remains documented future work, not a prerequisite.

---

## ADR-19 — Auto-discovery is scheduled per-provider, ON by default; stale resources pruned after a grace window

**Context.** Provider Management is the source of truth for the whole system — every other menu reads its DB snapshot (ADR-01/10). If a provider's snapshot is only refreshed on a manual "Discover" click, leaving it stale silently corrupts every downstream menu with drifted data. Separately, the "flag Missing, never delete" rule (discovery never deletes) means destroyed VMs/templates linger forever with stale facts.

**Decision.**
1. **Scheduled, per-provider, on by default.** A single `discovery:refresh` command is scheduled at the finest cadence (every 30s) and **self-throttles per provider**: it re-discovers a provider only when `now ≥ last_discovery_at + discovery_interval`, then mirrors that provider's facts into inventory (`VmFactSyncService::syncProvider`). `auto_discovery_enabled` defaults **true** and `discovery_interval ∈ {30s, 1m, 2m}` (default `2m`) — both for new providers and back-migrated for existing ones. Manual-only providers (`auto_discovery_enabled=false`) are skipped and refreshed on demand.
2. **Stale cleanup with a grace window.** A scheduled `discovery:prune` (hourly) deletes discovered rows that have been `Missing` longer than `provisioning.discovery_stale_hours` (default 24h). `provider_vms` are always safe to delete; `provider_templates/networks/datastores/nodes` still referenced by a **published** row are kept (deleting them would silently null the published binding — an admin unpublishes first).
3. **One collection point.** Live Proxmox reads happen only in the discovery layer, driven from **Provider Management** (test-connection / discover / node-sync) and the scheduled engine — plus `ProvisionVmJob` registering a just-created VM. Every other menu, Inventory included, reads `provider_*`/published tables from the DB.

**Consequences.** The source-of-truth snapshot stays fresh automatically without manual clicks, and dead resources self-clean within the grace window while published references stay intact. The UI surfaces the schedule (`next_discovery_at = last_discovery_at + interval`) instead of "Manual Only". Discovery cost scales with provider count × cadence, bounded by `withoutOverlapping`. This reinforces ADR-01/10 (no business-layer provider calls) and is the realization of the previously-deferred auto-discovery scheduler.

---

## ADR-20 — "Edit Resources" is one bundled request applied in a single Terraform run

**Context.** CPU/RAM resize and data-disk add are both hotplug, no-reboot operations on the same live VM, but were modeled as two separate requests (`RESIZE` + `ADD_DISK`) — two approvals for the manager, and the second only appeared after the first was approved. Worse, the two jobs each ran their own `terraform apply` in the same workspace, and `ResizeVmJob` never persisted cores/memory to `deployment.json`, so a following add-disk job could `readResolved` stale CPU/RAM and *revert* the resize.

**Decision.** Bundle them into one approval-gated request type **`EDIT_RESOURCES`** with a single flexible payload `{cpu?, ram_mb?, disks: [{size_gb, setup_description}]}` (no migration — `approval_requests.payload` is already JSON). One endpoint (`POST /inventory/{id}/edit-resources`) creates one approval; on apply, one **`EditResourcesVmJob`** reads the workspace once, applies CPU/RAM **and** appends data disks, persists **both** `tfvars` and `deployment.json`, and runs a **single** `terraform apply`. Data-disk caps (ADR-16) are still enforced (env-save, request pre-check, and the authoritative serialized job re-check). Legacy `RESIZE`/`ADD_DISK` handlers remain for in-flight/old rows.

**Consequences.** One manager approval and one hotplug apply for a combined edit; the resize/add-disk persistence race is eliminated (one read + one write + one apply). The payload encodes the scope, so the Approvals UI derives the Type sub-label (`[Extend CPU/RAM, Add Disk]`) and color-coded Resources breakdown directly from it. The manual data-disk setup step (ADR-11/16) is unchanged.

---

## ADR-21 — A VM's lifetime is capped to its environment's expiry window

**Context.** Renewal originally did `current_expiry + extension`, so a VM in a 30-day environment could be extended to 60+ days — drifting past the governance window the environment defines, and creating ambiguity about the real maximum lifetime.

**Decision.** Expiry is **capped at `now + env-policy-window`**. A renewal tops the VM's expiry back *up toward* that cap (`min(current + extension, now + window)`), recomputed from `now` each time so headroom naturally reopens as the clock ticks down. When a VM is already at the cap there is no headroom: the renew request is rejected (422, "request Permanent instead") and the UI offers only "Make Permanent". The cap is authoritative in `LifecycleService` (covers both the approval path and admin-immediate), with the renew modal mirroring it (shows window / remaining / extendable headroom, limits the extension dropdown).

**Consequences.** A VM can never silently outlive its environment's window; "more time than the policy allows" requires the explicit Permanent decision (its own approval). Headroom is dynamic (a VM at the cap becomes extendable again only after time passes).

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
| 17 | Node is a published abstraction | Users never see raw node names |
| 18 | Pinned provider, gated upgrades | Provider bumps never break running VMs |
| 19 | Scheduled per-provider auto-discovery + 24h prune | Source-of-truth snapshot never goes stale; one provider-read point |
| 20 | Bundled "Edit Resources" → one apply | One approval + one hotplug apply; no resize/disk race |
| 21 | Lifetime capped to env window | VM never outlives its environment's policy |
