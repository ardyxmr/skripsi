# API Contract
## Proxmox Self-Service VM Provisioning Portal

REST/JSON over HTTPS. Base path `/api`. Auth via session or bearer token (set during login). All responses are JSON. **Provider credential fields are write-only** — never present in any response body. Every state-changing call records an `audit_logs` entry server-side.

Conventions:
- `200` OK, `201` Created, `204` No Content, `400` validation, `401` unauthenticated, `403` forbidden (RBAC), `404` not found, `409` conflict (e.g. delete-protected), `422` business-rule violation.
- List endpoints support `?search=`, `?status=`, `?page=`, `?per_page=` (default 25), and sorting `?sort=field&dir=asc|desc`.
- Role gate noted per group: **U**=User, **M**=Manager, **A**=Administrator.

---

## 1. Auth & session (U)

```
POST /api/auth/login        { email, password } -> { user, token }
POST /api/auth/logout       -> 204
GET  /api/auth/me           -> { id, name, email, role, group }
```
`user.role` drives frontend menu visibility. Login writes a `LOGIN` audit row.

---

## 2. Providers & discovery (A)

```
GET    /api/providers                      -> [ provider (NO secrets) ]
POST   /api/providers                      -> 201 provider
   body: {
     provider_name, provider_type, endpoint,
     discovery_username, discovery_token_id, discovery_token_secret,   // write-only
     provision_username, provision_token_id, provision_token_secret,   // write-only
     terraform_provider_source, terraform_provider_version,
     auto_discovery_enabled, discovery_interval
   }
GET    /api/providers/{id}                 -> provider (NO secrets)
PUT    /api/providers/{id}                 -> provider   (secrets optional; only updated if present)
DELETE /api/providers/{id}                 -> 204

POST   /api/providers/{id}/test-connection -> { status: "Connected"|"Disconnected", version? }
POST   /api/providers/{id}/discover        -> { discovery_status, counts: {nodes,templates,networks,datastores,vms} }  // Run Discovery Now (full)

GET    /api/providers/{id}/explorer        -> { connection_status, discovery_status, last_discovery_at,
                                                next_discovery_at, nodes[], templates[], networks[], datastores[], vms[] }
GET    /api/providers/{id}/drift           -> { unmanaged_vms[], missing_vms[] }   // provider_vms vs inventory by external_vmid
GET    /api/providers/{id}/capacity        -> { nodes[{cpu_used,mem_used,storage_used,capacity}], datastores[{used,total}], vms[{external_vmid,cpu_utilization,ram_usage_mb}] }  // Admin utilization dashboard (from /cluster/resources snapshot)
GET    /api/providers/stats                -> { providers, connected, discovery_success, nodes, templates, networks, datastores, vms }   // nodes = published node count (ADR-17)
```
Returned provider objects expose monitoring fields (status, discovery_status, last_*_at, auto_discovery_enabled, discovery_interval) but **never** the four secret fields. Discovered resources carry `discovered_status` (Active|Missing).

---

## 3. Catalog (read: U / write: A)

```
GET    /api/catalogs                 -> [ catalog ]          // user-facing list (published only)
GET    /api/catalogs/{id}            -> catalog
POST   /api/catalogs                 -> 201   { catalog_name, catalog_description, provider_id,
                                                provider_node_id, provider_template_id, status }
PUT    /api/catalogs/{id}            -> catalog
DELETE /api/catalogs/{id}            -> 204
POST   /api/catalogs/{id}/image      -> { catalog_image }     // multipart; png/jpg/jpeg/webp, 512x512, <=2MB
```

---

## 4. Published nodes, networks & datastores (read: U / write: A)

```
GET    /api/nodes                    -> [ node ]            // published; user reads see friendly fields only
POST   /api/nodes                    -> 201 { node_name, description, provider_id,
                                              provider_node_id, status }
PUT    /api/nodes/{id}               -> node
DELETE /api/nodes/{id}               -> 204 | 409 (in use by request/inventory/env rule -> unpublish instead)
POST   /api/nodes/{id}/sync          -> node                // scoped node discovery: refresh status + util snapshot ("Sync now")
GET    /api/nodes/{id}/explorer      -> { node, templates[], networks[], datastores[], vms[] }  // node-scoped, read-only, admin-only

GET    /api/networks                 -> [ network ]
POST   /api/networks                 -> 201 { network_name, description, provider_id,
                                              provider_node_id, provider_network_id, status }
PUT    /api/networks/{id}            -> network
DELETE /api/networks/{id}            -> 204

GET    /api/datastores               -> [ datastore ]
POST   /api/datastores               -> 201 { datastore_name, description, provider_id,
                                              provider_node_id, provider_datastore_id, status }
PUT    /api/datastores/{id}          -> datastore
DELETE /api/datastores/{id}          -> 204
```

---

## 5. Tiers (read: U / write: A)

```
GET    /api/tiers                    -> [ tier ]
POST   /api/tiers                    -> 201 { tier_name, description, cpu, ram_mb, disk_gb, status }
PUT    /api/tiers/{id}               -> tier
DELETE /api/tiers/{id}               -> 204 | 409 (in use by environment/inventory/request)
GET    /api/tiers/stats              -> { total, active, inactive, most_used_tier }
```

---

## 6. Environments (read: U / write: A)

```
GET    /api/environments             -> [ environment ]
POST   /api/environments             -> 201 {
          environment_name, description, expiry_type, expiry_value, approval_required, allow_data_disk, max_data_disks, status, display_order,
          allowed_provider_ids[], allowed_tier_ids[], allowed_node_ids[], allowed_network_ids[], allowed_datastore_ids[]
       }
PUT    /api/environments/{id}        -> environment
DELETE /api/environments/{id}        -> 204

// Drives wizard Step 1 -> Step 2 filtering:
GET    /api/environments/{id}/allowed-resources
       -> { providers[], nodes[], tiers[], networks[], datastores[] }   // intersected with Active status (nodes per ADR-17)
```

---

## 7. Provision requests (U)

```
POST   /api/provision-requests       -> 201 {
          vm_name, environment_id, provider_id, node_id,   // node_id is the PUBLISHED node (ADR-17)
          catalog_id, tier_id, network_id, datastore_id,   // network/datastore are node-bound (on node_id), not from allowed-resources
          instance_count,                // batch size (default 1)
          security_hardening,            // bool; drives the post-apply Ansible step
          boot_disk_gb,                  // optional; boot/root(C:) size ≥ template size; null = template default
          requested_expiry, description
       }
   // Server validates against environment policy: provider/node/tier ∈ env allow-lists (Active/Connected);
   //   catalog/network/datastore Active AND on the chosen node (provider_node_id match).
   // If environment.approval_required == false -> enqueues ProvisionVmJob, returns { request, queued: true }
   // else -> creates approval_requests(PROVISION, Pending), returns { request, approval_id }

GET    /api/provision-requests       -> [ request ]   // U: own; M: group; A: all
GET    /api/provision-requests/{id}  -> request
PUT    /api/provision-requests/{id}  -> request        // only allowed when linked approval is Reverted (edit + resubmit)
POST   /api/provision-requests/{id}/resubmit -> { approval_id, status: "Pending" }
```
Requests store IDs only. `422` if a chosen resource is not allowed by the environment or not Active.

---

## 8. Approvals (M/A)

```
GET    /api/approvals                -> [ approval_request ]   // M: group; A: all
   // supports ?status=Pending|Approved|Rejected|Reverted and widget filters
GET    /api/approvals/stats          -> { total, pending, approved, rejected, reverted }
GET    /api/approvals/{id}           -> approval_request (with expand: description, catalog, network,
                                         datastore, requested_by, group, environment, requested_expiry, action_reason)

POST   /api/approvals/{id}/approve   -> { status: "Approved" }   body: { action_reason }   // REQUIRED
POST   /api/approvals/{id}/reject    -> { status: "Rejected" }   body: { action_reason }   // REQUIRED
POST   /api/approvals/{id}/revert    -> { status: "Reverted" }   body: { action_reason }   // REQUIRED; PROVISION/RESIZE only
```
`action_reason` missing → `400`. Approving a PROVISION enqueues `ProvisionVmJob`; RENEWAL extends expiry; PERMANENT clears expiry; RESIZE triggers an automatic CPU/RAM reconfigure; ADD_DISK attaches a raw disk then awaits admin setup. RENEWAL/PERMANENT do not expose `revert`.

---

## 9. Inventory & lifecycle (U own / M group / A all)

> **Approval model (Stage 7):** the mutating actions below (`renew`/`permanent`/`resize`/`delete`, and later `add-disk`) **respect the VM environment's `approval_required`** flag — when set (default), they create a Pending `approval_requests` row carrying the requested change in its `payload` JSON; when an admin disables approval for that environment, they apply immediately. `sync`/`retry` are always immediate. Approving a lifecycle request applies it (RENEWAL→extend expiry, PERMANENT→clear expiry, RESIZE→Terraform reconfigure, DESTROY→`terraform destroy`).

```
GET    /api/inventory                -> [ vm ]   // scoped by role; each vm carries status (lifecycle) + observed_power_state
GET    /api/inventory/{id}           -> vm (incl. ip_address, status (lifecycle: Provisioning|Active|Failed|Expired|Deleted),
                                            observed_power_state (running|stopped|paused|unknown), last_sync_at,
                                            vcpu, ram_mb, disk_allocated_gb, disks[], cpu_utilization, ram_usage_mb,
                                            expiry, is_permanent, security_hardening, hardening_status)
                                       // cpu_utilization/ram_usage_mb are a snapshot; surfaced in Admin views, not user-prominent
POST   /api/inventory/{id}/sync      -> vm        // scoped VM discovery (provider_vms) → maps power/IP/alloc/util into inventory
POST   /api/inventory/{id}/retry     -> { queued: true }   // only when status == Failed; reuses workspace
POST   /api/inventory/{id}/harden    -> { queued: true }   // re-run Ansible hardening; only when security_hardening and hardening_status == Failed

POST   /api/inventory/{id}/renew     -> { approval_id }   body: { description, extension_period }
POST   /api/inventory/{id}/permanent -> { approval_id }   body: { description }   // extension_period forced N/A

POST   /api/inventory/{id}/resize    -> { approval_id }   // CPU/RAM only — auto-applied on approval
   body: {
     cpu?, ram_mb?,                 // at least one required
     vm_name_confirmation           // MUST equal the VM name, else 422
   }
   // Creates RESIZE approval request. On approval: Terraform reconfigure runs automatically (no admin step).

POST   /api/inventory/{id}/add-disk  -> { approval_id | queued }   // 403 unless environment.allow_data_disk; 422 if at the env cap
   body: {
     size_gb,                       // new data disk size
     setup_description,             // free text: mount path, fs, partition/format intent (for the admin)
     vm_name_confirmation           // MUST equal the VM name, else 422
   }
   // Rejects any shrink/modify of an existing disk. Creates ADD_DISK approval request.
   // On approval: Terraform attaches a raw disk, then status -> Pending Disk Setup (admin formats/mounts).
   // Two-tier cap (ADR-18): at most environment.max_data_disks data disks/VM, itself bounded by the stub's
   // physical slot ceiling config(provisioning.max_data_disk_slots). The cap is also re-checked in AddDiskJob
   // (serialized on the queue), so the admin-bypass path can't race past the limit.

POST   /api/inventory/{id}/disks/{diskId}/complete -> { disk }   // A only; marks data disk Ready after in-guest setup

POST   /api/inventory/{id}/delete    -> { approval_id | queued }   // -> terraform destroy on approval; row retained, status Deleted
```
Resize validation: at least one of `cpu`/`ram_mb` present; `vm_name_confirmation` must match. Add-disk validation: `size_gb` present, environment must permit data disks (`allow_data_disk`), `vm_name_confirmation` must match. The VM lifecycle status stays Active while any renewal/permanent/resize/add-disk approval is Pending.

---

## 10. Users, roles, groups (A)

```
GET/POST/PUT/DELETE /api/users        // DELETE 409 if user manages a group
GET/POST/PUT/DELETE /api/roles        // DELETE 409 if assigned to users
GET/POST/PUT/DELETE /api/groups       // DELETE 409 if has assigned users; manager_user_id optional
```

---

## 11. Audit (M/A)

```
GET    /api/audit-logs               -> [ log ]   // RBAC-scoped; filters: action_type, user, date range, search
GET    /api/audit-logs/export        -> CSV       // respects active filters + visibility
```
Logs are read-only; no create/update/delete endpoints.

---

## 12. Standard error shape

```json
{
  "error": {
    "code": "TIER_IN_USE",
    "message": "Tier is still used by an active VM or environment policy.",
    "details": { "field": "tier_id" }
  }
}
```

---

## 13. Security invariants (contract-level)

1. No endpoint ever returns `discovery_token_secret` or `provision_token_secret` (or any credential).
2. Catalog/network/datastore/**node** user reads expose only published fields — never raw `provider_*` names — except inside admin discovery/explorer endpoints **and the admin Node Preview panel** (which surfaces the raw `pveNN` and utilization snapshot to admins only).
3. Provision requests and inventory accept/return business IDs only; provider-real values are produced server-side at provisioning time and are not part of the request/response contract.
4. Approver is assigned server-side via group manager; the API does not accept a client-chosen approver.
5. Every mutating endpoint writes one audit row with a user-name snapshot and source IP.
6. Live Proxmox reads occur only in the discovery layer (Provider Management + the scheduled engine, ADR-19). Inventory and all other reads come from the DB — `POST /inventory/sync-all` is a DB mirror, not a provider call.

---

## 14. Post-Stage-7 contract changes (live)

**Provider / discovery (ADR-19)**
- `providers` carry `auto_discovery_enabled` (bool, default **true**) and `discovery_interval` ∈ `30s` | `1m` | `2m` (default `2m`); new providers default to auto-on @ `2m`.
- `GET /providers/{id}/explorer` returns `auto_discovery_enabled`, `discovery_interval`, `last_discovery_at`, and computed **`next_discovery_at`** (= last + interval, `null` if auto off). Provider rows also expose `next_discovery_at`.
- Discovery VMs resolve **`node_name`** (via `provider_nodes`); a stopped VM's `ip_address` is `null` (IP only while running); `vcpu` reflects the **online** count, not the hotplug topology ceiling.
- Scheduled background commands: `discovery:refresh` (per-provider, 30s tick, self-throttled to each provider's interval) and `discovery:prune` (deletes resources Missing > 24h; keeps published-referenced ones).

**Inventory & lifecycle**
- **`POST /inventory/sync-all`** — global DB mirror of every VM the caller may see (RBAC-scoped); returns the refreshed list. **Removed:** per-VM `POST /inventory/{id}/sync`.
- **`POST /inventory/{id}/edit-resources`** — unified bundle (ADR-20): body `{ cpu?, ram_mb?, disks: [{ size_gb, setup_description }], vm_name_confirmation }` → one `EDIT_RESOURCES` approval/apply. (Supersedes the modal's old split `resize` + `add-disk` calls; those endpoints remain for back-compat.)
- New request/lifecycle type **`EDIT_RESOURCES`** joins `RESIZE/ADD_DISK/RENEWAL/PERMANENT/DESTROY`. **Revert** applies to `PROVISION` only.
- `GET /inventory` rows add `pending_actions[]`, `expiry_type`/`expiry_value` (env policy for the renew cap), `allow_data_disk`, `max_data_disks`.
- Renewal is **capped to the env window** (ADR-21): a renew with no headroom returns `422` ("request Permanent instead").
- `GET /approvals` transform adds `payload` (bundle/change detail), `expiry_type/value`, `current_expiry`, `boot_disk_gb` so the table renders the Type scope (`Edit Resources [Extend CPU/RAM, Add Disk]`) + color-coded Resources from the payload.
