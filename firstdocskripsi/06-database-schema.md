# Database Schema
## Proxmox Self-Service VM Provisioning Portal

Relational schema on **PostgreSQL** (per the project spec). Conventions: every table has `id BIGINT PK` and (unless noted) `created_at` / `updated_at` timestamps. Foreign keys are named `<entity>_id`. Encrypted columns hold ciphertext only and are never returned to the frontend. Tier resource values follow the **authoritative architecture-v2 spec** (Bronze 2/4/40, Silver 4/8/80, Gold 8/16/160, Platinum 16/32/320).

Schema is grouped by layer.

---

## 1. IAM (Module 10)

```sql
roles (
  id            BIGINT PK,
  role_name     VARCHAR,          -- Administrator | Manager | User
  description   TEXT NULL,
  created_at    TIMESTAMP
);

groups (
  id              BIGINT PK,
  group_name      VARCHAR,
  room_floor      VARCHAR NULL,
  description     TEXT NULL,
  manager_user_id BIGINT NULL FK -> users.id,   -- nullable to break bootstrap circular dependency
  created_at      TIMESTAMP
);

users (
  id            BIGINT PK,
  name          VARCHAR,
  email         VARCHAR UNIQUE,
  password      VARCHAR,          -- hashed
  role_id       BIGINT FK -> roles.id,
  group_id      BIGINT FK -> groups.id,
  auth_provider VARCHAR DEFAULT 'local',  -- local | ldap | ad | azure (future SSO)
  status        VARCHAR,          -- Active | Inactive
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
);
```
**Integrity rules:** cannot delete a user who is a group's `manager_user_id`; cannot delete a role or group still referenced by users. Bootstrap seeder creates System Administrators group (manager null), the three roles, an admin user, then sets the group manager.

---

## 2. Discovery Layer (Module 01)

```sql
providers (
  id                        BIGINT PK,
  provider_name             VARCHAR,        -- e.g. "Proxmox DC Jakarta"
  provider_type             VARCHAR,        -- proxmox | openstack | olvm
  endpoint                  VARCHAR,        -- base API URL

  -- Discovery credential (read-only, e.g. PVEAuditor)
  discovery_username        VARCHAR,
  discovery_token_id        VARCHAR,
  discovery_token_secret    TEXT,           -- ENCRYPTED

  -- Provisioning credential (Terraform lifecycle)
  provision_username        VARCHAR,
  provision_token_id        VARCHAR,
  provision_token_secret    TEXT,           -- ENCRYPTED
  terraform_provider_source VARCHAR,        -- e.g. Telmate/proxmox
  terraform_provider_version VARCHAR,       -- e.g. 3.0.2-rc04

  status                    VARCHAR,        -- Connected | Disconnected (connection status)
  discovery_status          VARCHAR,        -- success | running | failed | partial | never_run
  last_tested_at            DATETIME NULL,
  last_discovery_at         DATETIME NULL,
  last_sync_at              DATETIME NULL,
  auto_discovery_enabled    BOOLEAN DEFAULT false,
  discovery_interval        VARCHAR NULL,   -- 15m | 30m | 1h | 6h | 12h | 24h
  created_at                TIMESTAMP,
  updated_at                TIMESTAMP
);

provider_nodes (
  id               BIGINT PK,
  provider_id      BIGINT FK -> providers.id,
  external_node_id VARCHAR,
  node_name        VARCHAR,        -- e.g. pve01
  status           VARCHAR,        -- online | offline | maintenance
  cpu_count        INTEGER,
  total_memory     BIGINT,
  total_storage    BIGINT,
  cpu_utilization  DECIMAL NULL,   -- point-in-time % (from /cluster/resources?type=node `cpu`) — ADR-17
  ram_usage_mb     BIGINT  NULL,   -- point-in-time used MB (from `mem`); RAM% = ram_usage_mb / (total_memory/1024/1024)
  discovered_status VARCHAR,       -- Active | Missing
  last_sync_at     DATETIME
);

provider_templates (
  id                  BIGINT PK,
  provider_id         BIGINT FK -> providers.id,
  provider_node_id    BIGINT FK -> provider_nodes.id,
  external_template_id VARCHAR,
  template_name       VARCHAR,     -- e.g. ubuntu2204-template
  node_name           VARCHAR,
  template_type       VARCHAR,     -- VM Template | Cloud Image | Template
  discovered_status   VARCHAR,     -- Active | Missing
  last_sync_at        DATETIME
);

provider_networks (
  id               BIGINT PK,
  provider_id      BIGINT FK -> providers.id,
  provider_node_id BIGINT FK -> provider_nodes.id,
  network_name     VARCHAR,        -- provider bridge, e.g. vmbr0
  network_type     VARCHAR,
  cidr             VARCHAR NULL,
  gateway          VARCHAR NULL,
  discovered_status VARCHAR,       -- Active | Missing
  last_sync_at     DATETIME
);

provider_datastores (
  id               BIGINT PK,
  provider_id      BIGINT FK -> providers.id,
  provider_node_id BIGINT FK -> provider_nodes.id,
  datastore_name   VARCHAR,        -- provider storage id, e.g. local-lvm
  datastore_type   VARCHAR NULL,
  total_space      BIGINT NULL,
  available_space  BIGINT NULL,
  discovered_status VARCHAR,       -- Active | Missing
  last_sync_at     DATETIME
);

provider_vms (                     -- discovered RUNTIME facts (the provider's ground truth)
  id               BIGINT PK,
  provider_id      BIGINT FK -> providers.id,
  provider_node_id BIGINT FK -> provider_nodes.id,
  external_vmid    VARCHAR,        -- provider VM id (e.g. Proxmox vmid) — correlation key to inventory
  vm_name          VARCHAR,        -- name as seen on the provider
  power_state      VARCHAR,        -- running | stopped | paused  (from /cluster/resources status)
  ip_address       VARCHAR NULL,   -- from guest agent (network-get-interfaces)
  vcpu             INTEGER NULL,   -- allocated = sockets × cores (parsed from /config)
  ram_mb           INTEGER NULL,   -- allocated memory (from /config)
  disk_allocated_gb INTEGER NULL,  -- total of real data disks (sum of parsed, filtered disks)
  disks_json       JSON NULL,      -- per-disk: [{ bus:"scsi0", size_gb:32 }, ...] (cdrom/efi/tpm/unused excluded)
  cpu_utilization  DECIMAL NULL,   -- point-in-time % (from /cluster/resources cpu; running VMs only)
  ram_usage_mb     INTEGER NULL,   -- point-in-time used MB (from /cluster/resources mem)
  discovered_status VARCHAR,       -- Active | Missing  (Missing = deleted out-of-band)
  last_sync_at     DATETIME
);
```
**Rules:** discovery never deletes rows — absent resources are marked `Missing`. The same `network_name` on two nodes are distinct rows (node-scoped). `provider_vms` is a discovered cache only; its facts are synced into `inventory` by `external_vmid` (never the reverse). Secrets never selected into responses.

---

## 3. Published / Service Layer

```sql
catalogs (
  id                   BIGINT PK,
  catalog_name         VARCHAR,    -- e.g. "Ubuntu 22.04 LTS"
  catalog_description  TEXT NULL,
  provider_id          BIGINT FK -> providers.id,
  provider_node_id     BIGINT FK -> provider_nodes.id,
  provider_template_id BIGINT FK -> provider_templates.id,
  catalog_image        VARCHAR NULL,   -- path under storage/app/catalog-images/
  -- (hardening playbooks now live in catalog_hardening_versions — see below; the old single-playbook
  --  columns were dropped by the versioning migration.)
  status               VARCHAR,        -- Active | Inactive | Provider Offline | Template Missing
  created_by           BIGINT FK -> users.id,
  created_at           TIMESTAMP,
  updated_at           TIMESTAMP
);

catalog_hardening_versions (          -- many named/versioned Ansible hardening playbooks per catalog
  id                  BIGINT PK,
  catalog_id          BIGINT FK -> catalogs.id (cascade),
  name                VARCHAR,        -- "CIS Benchmark"
  version             VARCHAR,        -- "1.0"
  playbook_path       VARCHAR,        -- private disk: catalog-hardening/{catalog_id}/{id}/
  playbook_filename   VARCHAR,
  checksum            VARCHAR,        -- SHA-256
  is_active           BOOLEAN,        -- retired (false) instead of hard-deleted, so applied VMs' FK never dangles
  uploaded_by         BIGINT NULL FK -> users.id,
  created_at, updated_at TIMESTAMP
);

networks (                            -- PUBLISHED networks
  id                   BIGINT PK,
  network_name         VARCHAR,        -- friendly, e.g. "Development Network"
  description          TEXT NULL,
  provider_id          BIGINT FK -> providers.id,
  provider_node_id     BIGINT FK -> provider_nodes.id,
  provider_network_id  BIGINT FK -> provider_networks.id,
  status               VARCHAR,        -- Active | Inactive | Provider Offline | Missing
  created_by           BIGINT FK -> users.id,
  created_at           TIMESTAMP,
  updated_at           TIMESTAMP
);

datastores (                          -- PUBLISHED datastores
  id                    BIGINT PK,
  datastore_name        VARCHAR,       -- friendly, e.g. "Standard Storage"
  description           TEXT NULL,
  provider_id           BIGINT FK -> providers.id,
  provider_node_id      BIGINT FK -> provider_nodes.id,
  provider_datastore_id BIGINT FK -> provider_datastores.id,
  status                VARCHAR,       -- Active | Inactive | Provider Offline | Missing
  created_by            BIGINT FK -> users.id,
  created_at            TIMESTAMP,
  updated_at            TIMESTAMP
);

nodes (                               -- PUBLISHED nodes (ADR-17)
  id               BIGINT PK,
  node_name        VARCHAR,           -- friendly, e.g. "Jakarta Zone A"
  description      TEXT NULL,
  provider_id      BIGINT FK -> providers.id,
  provider_node_id BIGINT FK -> provider_nodes.id,   -- the discovered node it abstracts
  status           VARCHAR,           -- Active | Inactive | Provider Offline | Missing
  created_by       BIGINT FK -> users.id,
  created_at       TIMESTAMP,
  updated_at       TIMESTAMP,
  UNIQUE (provider_id, node_name)      -- friendly name unique within a provider
);
```
**Rule:** user-facing reads use these published tables (`catalogs`, `networks`, `datastores`, **and `nodes`**) only — never `provider_*`. A published node's `status` mirrors networks/datastores: `Active` = published & provider connected & discovered node Active; `Inactive` = admin-disabled; `Provider Offline` = provider disconnected; `Missing` = the discovered node went `Missing`. Selecting a published node simply *filters* catalogs/networks/datastores to the matching `provider_node_id`.

---

## 4. Policy Layer (Modules 05 & 06)

```sql
tiers (
  id          BIGINT PK,
  tier_name   VARCHAR,        -- Bronze | Silver | Gold | Platinum
  description TEXT NULL,
  cpu         INTEGER,        -- vCPU
  ram_mb      INTEGER,        -- memory in MB
  disk_gb     INTEGER,        -- disk in GB
  status      VARCHAR,        -- Active | Inactive
  created_by  BIGINT FK -> users.id,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
  -- future: max_instances INTEGER NULL  (capacity control, not v1)
);

environments (
  id                BIGINT PK,
  environment_name  VARCHAR,    -- Development | Staging | Production
  description       TEXT NULL,
  expiry_type       VARCHAR,    -- e.g. days | lifetime
  expiry_value      INTEGER NULL,  -- e.g. 30 (null/ignored for lifetime)
  approval_required BOOLEAN,
  allow_data_disk   BOOLEAN DEFAULT false,  -- gates the additional data-disk capability for VMs in this environment
  max_data_disks    INTEGER DEFAULT 6,      -- policy cap on data disks/VM (ADR-18); 0..config(provisioning.max_data_disk_slots)
  status            VARCHAR,    -- Active | Inactive
  display_order     INTEGER,
  created_by        BIGINT FK -> users.id,
  created_at        TIMESTAMP,
  updated_at        TIMESTAMP
);

-- Allow-list join tables (the environment policy)
environment_provider_rules  ( id PK, environment_id FK, provider_id FK );
environment_tier_rules      ( id PK, environment_id FK, tier_id FK );
environment_node_rules      ( id PK, environment_id FK, node_id FK );        -- references published nodes.id (ADR-17)
-- networks + datastores carry no rule table: they are admitted by node residency (follow the allow-listed node)
```
**Seed:** tiers Bronze (2/4096/40), Silver (4/8192/80), Gold (8/16384/160) on install; Platinum (16/32768/320) admin-creatable. **Tier delete blocked** if referenced by any environment rule, inventory row, or provision request.

---

## 5. Request & Workflow (Modules 12 & 09)

```sql
provision_requests (
  id               BIGINT PK,
  requester_id     BIGINT FK -> users.id,
  vm_name          VARCHAR,
  environment_id   BIGINT FK -> environments.id,
  provider_id      BIGINT FK -> providers.id,
  node_id          BIGINT FK -> nodes.id,            -- PUBLISHED node (ADR-17), not raw provider_node_id
  catalog_id       BIGINT FK -> catalogs.id,
  tier_id          BIGINT FK -> tiers.id,
  network_id       BIGINT FK -> networks.id,        -- published (must live on node_id's provider_node)
  datastore_id     BIGINT FK -> datastores.id,      -- published (must live on node_id's provider_node)
  instance_count   INTEGER DEFAULT 1,               -- batch size; Stage 6 creates N VMs (suffixed names)
  description      TEXT NULL,                        -- requester's purpose/justification
  security_hardening BOOLEAN DEFAULT false,         -- drives the post-apply Ansible step
  boot_disk_gb     INTEGER NULL,                    -- customizable boot/root(C:) disk size (≥ template size); null = template default
  requested_expiry DATETIME NULL,
  created_at       TIMESTAMP,
  updated_at       TIMESTAMP
);
-- Stores IDs only (+ the hardening flag). No approval decision, no terraform state, no lifecycle here.
-- vm_name is used as both the provider VM name and the guest OS hostname (with a two-digit sequence suffix).

approval_requests (
  id            BIGINT PK,
  request_type  VARCHAR,    -- PROVISION | RENEWAL | PERMANENT | RESIZE | ADD_DISK | (future SNAPSHOT | DESTROY)
  reference_id  BIGINT,     -- polymorphic -> provision_requests.id or inventory.id depending on type
  requester_id  BIGINT FK -> users.id,
  approver_id   BIGINT NULL FK -> users.id,   -- auto-resolved via group manager
  group_id      BIGINT FK -> groups.id,
  payload       JSON NULL,  -- Stage 7: the pending change for lifecycle approvals (RESIZE cpu/ram, RENEWAL extension_period, …)
  status        VARCHAR,    -- Pending | Approved | Rejected | Reverted
  action_type   VARCHAR NULL,  -- Approve | Reject | Revert
  action_reason TEXT NULL,     -- MANDATORY when an action is taken
  action_date   DATETIME NULL,
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
);
```
**Rules:** approver auto-assigned (user→group→manager); `action_reason` required on Approve/Reject/Revert; Revert applies to PROVISION/RESIZE only. Schema must permit future multi-level approval without engine changes (e.g. an `approval_levels`/`approval_steps` table can be added later keyed on `approval_requests.id`).

---

## 6. Inventory & Lifecycle

```sql
inventory (
  id                  BIGINT PK,
  provision_request_id BIGINT NULL FK -> provision_requests.id,  -- Stage 7: lineage; retry re-dispatches the originating request
  vm_name             VARCHAR,
  login_username      VARCHAR NULL,    -- cloud-init ci_user (default 'ubuntu')
  login_password      TEXT NULL,       -- per-VM password, ENCRYPTED at rest; revealed only via the audited credentials endpoint
  owner_user_id       BIGINT FK -> users.id,
  environment_id      BIGINT FK -> environments.id,
  provider_id         BIGINT FK -> providers.id,
  node_id             BIGINT FK -> nodes.id,            -- PUBLISHED node (ADR-17), not raw provider_node_id
  catalog_id          BIGINT FK -> catalogs.id,
  tier_id             BIGINT FK -> tiers.id,
  network_id          BIGINT FK -> networks.id,
  datastore_id        BIGINT FK -> datastores.id,
  ip_address          VARCHAR NULL,    -- synced from provider_vms, not input
  external_vmid       VARCHAR NULL,    -- provider VM id (e.g. Proxmox vmid) — correlation key
  status              VARCHAR,         -- PORTAL LIFECYCLE: Provisioning | Active | Failed | Expired | Deleted
  observed_power_state VARCHAR NULL,   -- PROVIDER-SYNCED: running | stopped | paused | unknown (unknown = provider unreachable)
  vcpu                INTEGER NULL,    -- allocated, synced from provider_vms (sockets × cores)
  ram_mb              INTEGER NULL,    -- allocated capacity, synced
  disk_allocated_gb   INTEGER NULL,    -- total allocated across data disks (snapshot; per-disk in inventory_disks)
  cpu_utilization     DECIMAL NULL,    -- point-in-time % (snapshot; NOT time-series). Cached for logic, surfaced in Admin views
  ram_usage_mb        INTEGER NULL,    -- point-in-time used MB (snapshot)
  security_hardening  BOOLEAN DEFAULT false,  -- copied from the originating request
  hardening_status    VARCHAR,         -- Stage 8: Not Hardened | Pending | Running | Success | Failed
  last_hardened_at    TIMESTAMP NULL,  -- when hardening last succeeded
  hardened_playbook_checksum VARCHAR NULL,  -- SHA of the applied playbook (integrity)
  hardened_version_id BIGINT NULL FK -> catalog_hardening_versions.id (nullOnDelete),  -- which version was applied
  expiry_date         DATETIME NULL,
  grace_period_until  DATETIME NULL,
  is_permanent        BOOLEAN DEFAULT false,
  workspace_path      VARCHAR,         -- storage/app/provisioning/{user}/date_pr.../
  terraform_state_path VARCHAR,
  last_sync_at        DATETIME NULL,
  created_at          TIMESTAMP,
  updated_at          TIMESTAMP
);
```
**Rules:** inventory is source of truth for VM **governance/condition**; it stores **published resource IDs** (not provider names) and **no approval columns**. Runtime facts (`ip_address`, `external_vmid`, power/status) are **mirrored from `provider_vms`** by `external_vmid` via the discovery sync — never read from the provider directly by this layer, and never read live by the UI. On delete, status becomes Deleted but the row and workspace are retained for audit.

Disk detail (boot disk = index 0; data disks added via the ADD_DISK flow):
```sql
inventory_disks (
  id            BIGINT PK,
  inventory_id  BIGINT FK -> inventory.id,
  disk_index    INTEGER,         -- 0 = boot disk
  size_gb       INTEGER,
  is_primary    BOOLEAN,
  mount_point   VARCHAR NULL,    -- e.g. /data (Linux) or D: (Windows); from the request's setup intent
  fs_type       VARCHAR NULL,    -- e.g. ext4 | xfs | ntfs (informational; admin sets up in-guest)
  setup_status  VARCHAR NULL,    -- Pending Setup | Ready  (data disks only; boot disk = Ready)
  created_at    TIMESTAMP
);
-- Existing disks are never shrunk/edited. Boot disk size is set at creation (grown by cloud-init).
-- Data disks are INSERTed via the ADD_DISK flow: Terraform attaches raw, admin formats/mounts, row marked Ready.
```

---

## 7. Audit (Module 11)

```sql
audit_logs (
  id          BIGINT PK,
  user_id     BIGINT NULL FK -> users.id,
  user_name   VARCHAR,        -- snapshot at time of action
  action_type VARCHAR,        -- CREATE_VM | APPROVE_VM | REJECT_VM | REVERT_VM
                              -- | CREATE_PROVIDER | UPDATE_PROVIDER | DELETE_PROVIDER
                              -- | SYNC_PROVIDER | RENEW_VM | PERMANENT_VM | RESIZE_VM
                              -- | HARDEN_VM | ADD_DISK | DELETE_VM
                              -- | LOGIN | LOGOUT | LOGIN_FAILED | LOGIN_THROTTLED | VIEW_CREDENTIALS
                              -- | UPLOAD_HARDENING | RETIRE_HARDENING | REQUEST_HARDEN | APPLY_HARDEN | HARDEN_VM | ...
                              -- (sessions live in Redis, not the DB — ADR-24; framework sessions table retained for rollback)
  description VARCHAR,        -- human-readable
  ip_address  VARCHAR NULL,
  created_at  TIMESTAMP       -- append-only; no updated_at
);
```
**Rules:** immutable/append-only; business actions only (no terraform output/system logs); never stores credentials; RBAC-scoped reads; CSV export respects filters + visibility; default page size 25.

---

## 8. Entity relationship overview

```
roles ──< users >── groups (manager_user_id ─> users)
providers ──< provider_nodes ──< provider_templates / provider_networks / provider_datastores / provider_vms
provider_templates  ─1:1─ catalogs
provider_networks   ─1:1─ networks (published)
provider_datastores ─1:1─ datastores (published)
provider_nodes      ─1:1─ nodes (published)
environments ──< environment_(provider|tier|node)_rules >── (providers|tiers|nodes)
users ──< provision_requests >── (environment, provider, node[published], catalog, tier, network, datastore)
provision_requests ─ref─ approval_requests (request_type=PROVISION)
inventory ─ref─ approval_requests (request_type ∈ RENEWAL|PERMANENT|RESIZE|ADD_DISK|DESTROY)
inventory ──< inventory_disks
provider_vms ─sync(external_vmid)─> inventory (runtime facts only; discovered → governance)
users ──< audit_logs
```

---

## 9. Reconciliation notes

- **Tier values:** seed authoritative spec values; update frontend mock to match.
- **Published vs discovered:** `provision_requests.network_id`/`datastore_id` reference **published** tables; resolution to provider values happens only at provisioning time via the discovered FKs on those published rows.
- **Published node (ADR-17):** `provision_requests.node_id`/`inventory.node_id` reference the **published** `nodes` table; resolution to `provider_nodes.node_name` (`target_node`) happens only at provisioning time via the discovered FK on the published row. Selecting a node filters catalogs/networks/datastores to the matching `provider_node_id`. The node utilization snapshot (`provider_nodes.cpu_utilization`/`ram_usage_mb`) follows the same snapshot-not-series contract as `provider_vms`.
- **No terraform state in DB:** state lives only in the workspace; the DB stores `workspace_path` + `terraform_state_path` references.
- **Runtime facts via discovery:** the discovery layer reads the provider (`/cluster/resources?type=vm` for ground truth + power/utilization, `/config` for allocation), writes `provider_vms`, and syncs into `inventory` by `external_vmid`. No service outside discovery calls the provider; the UI reads inventory only. `provider_vms` also enables drift detection (Missing entries / unmanaged VMs).
- **Dual status:** `inventory.status` is the **portal lifecycle** (Provisioning/Active/Failed/Expired/Deleted) and is portal-owned; `inventory.observed_power_state` is **provider-synced** (running/stopped/paused/unknown). When the provider is unreachable, `observed_power_state = unknown` with `last_sync_at` shown for honesty; the lifecycle status and expiry are unaffected.
- **Snapshot, not time-series:** utilization is a point-in-time snapshot (`cpu_utilization`, `ram_usage_mb`) cached for logic. **User inventory** shows allocation only (vCPU, RAM capacity, per-disk sizes); **live utilization** (CPU%/RAM used, plus node/datastore capacity) is surfaced in the Admin dashboard. No historical/time-series store.

### Post-Stage-7 schema notes (no new tables/columns required)
- **Auto-discovery (ADR-19):** `providers.auto_discovery_enabled` now defaults **true** and `providers.discovery_interval` holds `30s` | `1m` | `2m` (default `2m`); a data migration set existing providers to auto-on @ `2m`. `last_discovery_at` drives the computed `next_discovery_at`. Discovered rows are deleted once `discovered_status='Missing'` AND `last_sync_at` is older than `discovery_stale_hours` (24h) — `last_sync_at` doubles as "last seen present" (no `missing_since` column needed).
- **Bundled Edit Resources (ADR-20):** new `approval_requests.request_type` value `EDIT_RESOURCES`; its `payload` JSON carries `{cpu?, ram_mb?, disks:[{size_gb, setup_description}]}`. No column change — `payload` was already JSON.
- **`provider_vms`** still stores only `provider_node_id` (no `node_name`); the Node column is resolved at read time via the `providerNode` relation. `vcpu` holds the **online** count (Proxmox `vcpus`), and `ip_address` is nulled when the VM is not running.
- **Inventory reads** surface derived (not stored) `pending_actions` (open lifecycle approvals on the VM) and the env `expiry_type`/`expiry_value` for the renewal-cap UI.
