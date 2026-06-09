# Backend Services
## Proxmox Self-Service VM Provisioning Portal

Assumed stack: **Laravel** (HTTP controllers, service classes, queued Jobs, scheduler) + **Terraform** CLI (provisioning) + **Ansible** (post-provision hardening) + **Proxmox VE** API (token auth). Persistence in **PostgreSQL**. This document specifies the service decomposition, responsibilities, and key collaborations. It is a design spec, not implementation code.

---

## 1. Service map (by layer)

```
Discovery Layer
  ProviderDriver (interface)  ──ProviderFactory──> ProxmoxProvider
  DiscoveryService            (resources + VMs)
  VmFactSyncService           (provider_vms → inventory by external_vmid)
  DiscoverySchedulerService

Published / Service Layer
  CatalogService
  NetworkPublishService
  DatastorePublishService
  ResourceResolutionService   (also used by Orchestration)

Business / Policy Layer
  TierService
  EnvironmentService
  EnvironmentPolicyService     (resource filtering)
  ApprovalWorkflowService      (engine)
  ApproverResolutionService

Orchestration Layer
  ProvisionRequestService
  ProvisionVmJob (queued)
  WorkspaceService
  TerraformRenderer
  TerraformRunner
  AnsibleHardeningService
  AnsibleRunner

Lifecycle Layer
  InventoryService
  LifecycleEngineService (expiry/grace/auto-destroy, scheduled)
  ResizeService
  AddDiskService

Cross-cutting
  AuditService
  CredentialCipher (encrypt/decrypt)
  IAM: AuthService, UserService, RoleService, GroupService
```

---

## 2. Provider Driver (Discovery Layer)

### 2.1 `ProviderDriver` interface
All drivers implement:
- `testConnection(): ConnectionResult`
- `discoverNodes(): NodeDTO[]`
- `discoverTemplates(node): TemplateDTO[]`
- `discoverNetworks(node): NetworkDTO[]`
- `discoverDatastores(node): DatastoreDTO[]`
- `discoverVms(node): VmDTO[]`  — running/stopped VMs (not templates) with `external_vmid`, name, node, power state, IP(s)
- `syncResources(): SyncResult`
- `getNodeHealth(node): HealthDTO`

`ProviderFactory::make(provider)` returns the right driver based on `provider.provider_type` (`proxmox` | `openstack` | `olvm`).

### 2.2 `ProxmoxProvider`
Uses the **discovery credential** for all of the above. Endpoints (from `config/provider_endpoints.php`):

| Operation | Method + path | Notes |
|---|---|---|
| testConnection | `GET /api2/json/version` | Connected/Disconnected |
| discoverNodes | `GET /api2/json/cluster/resources?type=node` | node capacity (cpu/mem/storage) → `provider_nodes` + Admin capacity view |
| discoverVms + classify | `GET /api2/json/cluster/resources?type=vm` | one cluster call: `template==1` → `provider_templates`, else → `provider_vms`. Yields `vmid, node, name, status (power), maxcpu, maxmem, cpu (util), mem (used)` |
| VM/template allocation | `GET /api2/json/nodes/{node}/qemu/{vmid}/config` | structural allocation: `sockets`,`cores`,`memory`, disk strings (parsed per §2.2a) |
| discoverNetworks | `GET /api2/json/nodes/{node}/network` | bridges → `provider_networks` (cidr, gateway) |
| discoverDatastores | `GET /api2/json/cluster/resources?type=storage` | storage capacity → `provider_datastores` + Admin capacity view |
| VM IP (per VM) | `GET /api2/json/nodes/{node}/qemu/{vmid}/agent/network-get-interfaces` | enriches the `provider_vms` row with IP(s) |

Auth header: `Authorization: PVEAPIToken={discovery_username}!{discovery_token_id}={secret}` (token needs cluster-level audit, e.g. PVEAuditor on `/`).

The driver never persists; it returns DTOs. It must not be called by any non-discovery service. **All** provider GET traffic — resources *and* VM runtime facts — flows through this driver; no other layer calls the provider.

### 2.2a Config parsing rules (apply to VMs *and* templates)
When parsing `/config`:
- **vCPU = `sockets` × `cores`** (default `sockets=1`); don't read `cores` alone.
- **Scan all disk buses:** `scsiX`, `virtioX`, `sataX`, `ideX` — the boot/data disks may sit on any of them.
- **Include rule:** keep a line only if it contains `size=` **and** is **not** `media=cdrom`, **and** the key is **not** `efidisk0`, `tpmstate0`, or `unusedX` (cloud-init/ISO/EFI/TPM/detached are excluded).
- **Normalize units:** parse `size=NN[K/M/G/T]` and convert to **GB** (integer) consistently.
- Template `/config` is parsed the same way; its boot-disk size is the **floor** for the customizable boot disk at provisioning.

### 2.3 `DiscoveryService`
Orchestrates sync for a provider. **Status tier (cheap, frequent):** one `GET /cluster/resources` call returns nodes, storage, and all VMs/templates; classify `type=vm` rows by `template` flag (`1`→`provider_templates`, else→`provider_vms`), capturing power state + utilization snapshot (`cpu`, `mem`). **Allocation tier (heavier, lazy):** call `/config` per VM/template only when the vmid is newly discovered or its allocation changed (the portal knows this, since it owns resizes) or on demand — parse per §2.2a into `vcpu`, `ram_mb`, `disk_allocated_gb`, `disks_json`. Then discover networks (per node). Upsert into `provider_*` tables; mark absent rows `discovered_status = Missing` (never delete); update `discovery_status`, `last_discovery_at`, `last_sync_at`; write a `SYNC_PROVIDER` audit row. Exposes "Run Discovery Now" (full) and a **scoped VM discovery** (single node/`external_vmid`) used right after provisioning and by Provider Sync. After upserting `provider_vms`, invokes `VmFactSyncService`.

### 2.3a `VmFactSyncService`
Maps discovered facts from `provider_vms` into `inventory` by `external_vmid`: copies `ip_address`, the **observed power state** (→ `inventory.observed_power_state`), the allocation (`vcpu`, `ram_mb`, `disk_allocated_gb` + reconciles `inventory_disks` sizes from `disks_json`), and the **utilization snapshot** (`cpu_utilization`, `ram_usage_mb`), then stamps `last_sync_at`. It **never** touches portal-owned columns — the **lifecycle `status`** (Provisioning/Active/Failed/Expired/Deleted), owner, tier, expiry, workspace are untouched. If the provider is unreachable, it sets `observed_power_state = unknown` and leaves the last snapshot in place (UI shows staleness via `last_sync_at`). Also flags **drift**: inventory rows whose `provider_vms` entry is `Missing`, and `provider_vms` rows with no inventory match.

### 2.4 `DiscoverySchedulerService`
Scheduled task; for each provider with `auto_discovery_enabled = true`, runs the **status tier** (`/cluster/resources`) on the configured `discovery_interval` (e.g. 5–10 min for fresh power/status). The **allocation tier** (`/config`) runs lazily — on newly discovered vmids, on portal-initiated resizes, or on demand — rather than every cycle, to keep provider load low.

---

## 3. Published / Service Layer

### 3.1 `CatalogService`
CRUD for `catalogs`. Validates the linked `provider_template_id` exists and is Active; derives status (Active / Inactive / Provider Offline / Template Missing). Handles image upload (type ∈ {png,jpg,jpeg,webp}, 512×512, ≤2 MB → `storage/app/catalog-images/`). Exposes a user-facing read that reads only `catalogs`.

### 3.2 `NetworkPublishService` / `DatastorePublishService`
CRUD for published networks/datastores, each referencing a discovered provider resource and exposing a friendly name. Derive status from the linked discovered resource.

### 3.3 `ResourceResolutionService` (critical, shared)
Single place that converts business IDs → provider values. Inputs: a provision request (or resize payload). Outputs:
```
target_node  ← provider_nodes.node_name        (from provider_node_id)
template     ← provider_templates.template_name (via catalog_id → provider_template_id)
network      ← provider_networks.network_name   (via network_id → provider_network_id)
storage      ← provider_datastores.datastore_name (via datastore_id → provider_datastore_id)
cpu          ← tiers.cpu
memory       ← tiers.ram_mb
disk_size    ← tiers.disk_gb
```
Guarantees: Terraform never receives any `*_id`. Used by `ProvisionVmJob` and `ResizeService`.

---

## 4. Business / Policy Layer

### 4.1 `TierService`
CRUD for `tiers`; status toggle; delete validation (block if referenced by environment/inventory/provision request). Seeds Bronze/Silver/Gold on install (authoritative values); Platinum admin-creatable.

### 4.2 `EnvironmentService` + `EnvironmentPolicyService`
CRUD for `environments` and the four rule tables. `EnvironmentPolicyService.allowedResources(environment_id)` returns the filtered providers/tiers/networks/datastores for the wizard, intersected with each resource's Active status.

### 4.3 `ApprovalWorkflowService` (engine)
Type-agnostic. Operations: `submit(request_type, reference_id, requester)`, `approve(id, reason)`, `reject(id, reason)`, `revert(id, reason)`. Enforces:
- `action_reason` mandatory on every action.
- Approve → hand off to the Execution Engine for the request type (PROVISION→enqueue Terraform; RENEWAL→extend expiry; PERMANENT→clear expiry & set is_permanent; RESIZE→reconfigure CPU/RAM automatically; ADD_DISK→Terraform attaches raw disk, then admin completes setup; DESTROY→destroy).
- Reject → close, no execution.
- Revert → status Reverted (PROVISION/RESIZE only); user edits and resubmits → Pending.
- Writes audit rows (`APPROVE_VM`, `REJECT_VM`, `REVERT_VM`, …).

### 4.4 `ApproverResolutionService`
Resolves approver automatically: `user → group → group.manager_user_id`. No manual approver selection. Schema and engine must allow future multi-level (Manager→Director) without engine changes.

---

## 5. Orchestration Layer

### 5.1 `ProvisionRequestService`
Validates a new request against environment policy (provider/tier/network/datastore must be allowed and Active). Persists `provision_requests` (IDs only + vm_name + requested expiry). Then:
- If `environment.approval_required == false` → enqueue `ProvisionVmJob`.
- Else → `ApprovalWorkflowService.submit('PROVISION', request_id, user)`.
Writes a `CREATE_VM` (request created) audit row.

### 5.2 `WorkspaceService`
Creates and owns the per-request workspace `storage/app/provisioning/{username}/date_pr{DDMMYYYY_His}/`. Writes `deployment.json`. Never auto-deletes a workspace. Returns `workspace_path` and `terraform_state_path`.

### 5.3 `TerraformRenderer`
Renders `provider.tf` from the provider's `terraform_provider_source` + `terraform_provider_version` (using the **provisioning credential**). Renders `terraform.tfvars` from the resolved values, including the **cloud-init parameters** (`hostname` = VM name, user/SSH config) and the **disk list** (boot disk sized to the request; the renderer supports N disks, but v1 only ever renders the single boot disk). Copies `main.tf`/`variables.tf` from `storage/app/master-provisioning/terraform/` stubs. The guest hostname and boot-disk filesystem growth are applied by cloud-init/cloudbase-init on first boot — the renderer does not invoke Ansible for these.

### 5.4 `TerraformRunner`
Executes `init → validate → plan → apply` in the workspace, capturing logs. Returns success/failure + error message. On destroy/resize, runs the appropriate Terraform command against the existing state.

### 5.5 `ProvisionVmJob` (queued)
Sequence: create workspace → `ResourceResolutionService.resolve()` → load provider config → render provider.tf → render tfvars → copy templates → init → validate → plan → apply →
- **Success:** `InventoryService.create()` (lifecycle status **Active**, store workspace/state paths, capture `external_vmid` from Terraform output) → trigger scoped VM discovery (`DiscoveryService.discoverVms` for that node/vmid) → `VmFactSyncService` maps IP/observed power/allocation/utilization into inventory (retry until guest-agent IP available) → **if `security_hardening`: `AnsibleHardeningService.run()`** → audit `CREATE_VM` (provisioned).
- **Failure (terraform):** mark deployment Failed, persist error, retain workspace, expose Retry.

`vm_name` is rendered into `terraform.tfvars` as the provider VM name and as the cloud-init `hostname`; the guest hostname and boot-disk filesystem growth are applied by cloud-init/cloudbase-init on first boot (not by Ansible).

### 5.6 `AnsibleHardeningService` / `AnsibleRunner`
Runs the standard hardening playbook **after** a successful apply, only when the originating request has `security_hardening = true`. Steps: read the VM's discovered `ip_address` from inventory → render an Ansible inventory file + (copy) the hardening playbook from `storage/app/master-provisioning/ansible/` into the **same per-request workspace** → `AnsibleRunner` executes the playbook against the VM, capturing the run log into the workspace → set `inventory.hardening_status` (Running → Success/Failed) → write a `HARDEN_VM` audit row.
- Connection settings (user/key) come from configuration, are used only inside the runner, and are never returned to the frontend or written to audit.
- A hardening failure leaves the VM lifecycle **Active** (powered on) with `hardening_status = Failed` (not destroyed); hardening can be retried without re-running Terraform.
- If the flag is off, the service is skipped and `hardening_status = Not Requested`.

---

## 6. Lifecycle Layer

### 6.1 `InventoryService`
Creates/reads/updates inventory. Stores published resource IDs + workspace/state paths + expiry/grace/is_permanent, the portal **lifecycle `status`** (Provisioning/Active/Failed/Expired/Deleted), and **mirrors** provider-synced fields: `observed_power_state`, `ip_address`, `external_vmid`, allocation (`vcpu`/`ram_mb`/`disk_allocated_gb`), and the utilization snapshot. RBAC-scoped reads. Source of truth for VM **governance/condition**; the provider (via `provider_vms`) is source of truth for **runtime facts**. The UI reads inventory only — never the provider live. User-facing reads expose allocation + dual status; utilization snapshots are surfaced in Admin views (see §2.3 capacity).

### 6.2 Runtime-fact refresh (no direct provider calls here)
There is no separate provider client in this layer. After apply, and on "Provider Sync", the system triggers a **scoped VM discovery** (`DiscoveryService` → `discoverVms` for that node/`external_vmid`) which upserts `provider_vms`, then `VmFactSyncService` maps the IP/status into inventory by `external_vmid` (retrying until the guest-agent IP is available). All provider reads stay in the discovery layer (ADR-01/ADR-10).

### 6.3 `ResizeService` (CPU/RAM — auto-applied)
Handles the CPU/RAM part of Edit Resources. Accepts only CPU and RAM changes (no disk operations). Requires VM-name confirmation at the API boundary. Creates a `RESIZE` approval request. On approval, resolves new values and invokes `TerraformRunner` to reconfigure against the existing workspace/state, then updates inventory resource assignment — **fully automatic, no human step** (applied live where Proxmox CPU/RAM hotplug is enabled, otherwise on next reboot).

### 6.3a `AddDiskService` (add data disk — manual fulfilment)
Handles the Add Data Disk part of Edit Resources. Available only when the VM's `environment.allow_data_disk` is true. Accepts a new disk `size_gb` plus a free-text `setup_description` (mount path, filesystem, partition/format intent). Rejects any shrink/edit of existing disks. Requires VM-name confirmation. Creates an `ADD_DISK` approval request. On approval:
- `TerraformRunner` attaches a **raw** disk to the VM via the existing workspace/state (automated, non-destructive).
- The request moves to **Pending Disk Setup**; an admin formats/mounts the disk in-guest per the description (normally via a hotplug rescan — no reboot; reboot only as a fallback), then marks it Completed.
- On completion, an `inventory_disks` row is recorded and a `ADD_DISK` audit row written.
- Automating the in-guest step (Proxmox guest-agent exec or an Ansible play) is documented future work, not v1.

### 6.4 `LifecycleEngineService` (scheduled)
Drives expiry: warning → Expired → grace period (`grace_period_until`) → auto destroy (`terraform destroy`, keep workspace, status Deleted). Renewal extends `expiry_date`; Permanent sets `is_permanent=true`, `expiry_date=null`.

---

## 7. Cross-cutting services

### 7.1 `CredentialCipher`
Encrypts on write / decrypts on read for the four secret columns. Decrypted values are used only inside drivers/renderers and are never placed into a response DTO, table payload, or audit entry.

### 7.2 `AuditService`
`log(user, action_type, description, ip)` → append-only `audit_logs` with a `user_name` snapshot. Called by every state-changing service. RBAC-scoped reads + filtered CSV export.

### 7.3 IAM services
`AuthService` (login/logout, `LOGIN` audit), `UserService`/`RoleService`/`GroupService` (CRUD + delete protections: no deleting a group's manager, no deleting roles/groups with assigned users). Bootstrap seeder establishes admin + System Administrators group with deferred manager assignment.

---

## 8. Service interaction — happy-path provision

```
Controller → ProvisionRequestService.validate(env policy)
           → persist provision_requests (IDs only)
           → approval_required?
                yes → ApprovalWorkflowService.submit(PROVISION)
                        → ApproverResolutionService (group manager)
                        → [Manager] approve(reason)
                            → enqueue ProvisionVmJob
                no  → enqueue ProvisionVmJob
ProvisionVmJob → WorkspaceService.create
              → ResourceResolutionService.resolve (IDs → provider values)
              → TerraformRenderer (provider.tf + tfvars + copy stubs)
              → TerraformRunner (init/validate/plan/apply)
              → success: InventoryService.create(Active, external_vmid)
                       → DiscoveryService.discoverVms (scoped) → provider_vms
                       → VmFactSyncService (provider_vms → inventory: power/IP/alloc/util, retry)
                       → if security_hardening: AnsibleHardeningService.run
                            → AnsibleRunner (playbook in same workspace)
                            → set hardening_status, audit HARDEN_VM
              → AuditService.log(CREATE_VM)
```

---

## 9. Configuration files (backend)

- `config/provider_endpoints.php` — per-provider-type endpoint map (Proxmox paths above; placeholders for openstack/olvm).
- `storage/app/master-provisioning/terraform/main.tf.stub`, `variables.tf.stub` — Terraform templates (support a disk list; cloud-init params rendered into tfvars).
- `storage/app/master-provisioning/ansible/` — hardening playbook + role/templates (copied/rendered into each request workspace when `security_hardening` is on).
- `storage/app/catalog-images/` — catalog images.
- `storage/app/provisioning/{username}/date_pr{...}/` — per-request workspaces.
