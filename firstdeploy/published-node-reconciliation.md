# Published Node — Cross-Document Reconciliation
## Proxmox Self-Service VM Provisioning Portal

**Purpose.** Introduce **Node** as the fourth published abstraction (alongside Catalog, Network, Datastore) so node selection stops leaking raw `provider_nodes` identifiers to users, and the architecture becomes internally consistent. This document is the change set: it lists the exact edit each existing spec needs. Where this file and an existing spec disagree after these edits are applied, treat the *edited* spec as authoritative.

**The gap being closed.** Today users pick a raw node (`pve01`) at provision Step 1; everything else (template/network/datastore) is published behind a friendly name. ADR-04 forbids exposing raw identifiers, yet node is the exception. Separately, `02-implementation-plan.md` Phase 3 §5 already promises a `node_id → node name` resolution helper "used later by provisioning," but no `nodes` table exists and `provision_requests.provider_node_id` is the raw FK. This change reconciles both.

---

## 0. The decision in one paragraph

A **published node** is an admin-curated, friendly-named pointer to exactly one discovered `provider_nodes` row — identical in shape and lifecycle to a published network or datastore. Users select a published node by name (e.g. "Jakarta Zone A"); the backend resolves `node_id → provider_node_id → provider_nodes.node_name` at provisioning time. Raw node names appear only in admin discovery/explorer and the new admin Node Overview table, never in the provision wizard, approvals, or inventory shown to users. Catalogs/networks/datastores keep their own discovered `provider_node_id` (the node their resource physically lives on); selecting a published node simply *filters* those to the matching `provider_node_id`.

---

## 1. New ADR (add to `03-architectural-decisions.md`)

### ADR-17 — Node is a published abstraction, like Catalog/Network/Datastore

**Context.** ADR-04 hides raw provider identifiers, but the provision wizard exposed `provider_nodes.node_name` directly, and requests stored the raw `provider_node_id`. This is the one place the published-layer contract was broken.

**Decision.** Add a published `nodes` table mirroring published `networks`/`datastores`. Users select a published node by friendly name; `provision_requests` and `inventory` store the published `node_id`; `ResourceResolutionService` resolves `node_id → provider_node_id → target_node` immediately before Terraform. Raw node names are admin-only (discovery/explorer + Node Overview).

**Consequences.** Node now obeys ADR-04 (no raw identifiers to users) and ADR-05 (IDs only, late resolution). Renaming a published node never touches the provider. Adding a provider type is still one `discoverNodes()` — unchanged. The published-layer count goes from three to four; no new engine or workflow concepts are introduced.

**Also amend:**
- **ADR-04** — add node to the examples: "Users only ever see published names ("Ubuntu 22.04 LTS", "Development Network", "Standard Storage", **"Jakarta Zone A"**)."
- **ADR-05** — the IDs list becomes `environment_id, provider_id, node_id (published), catalog_id, tier_id, network_id, datastore_id` (replace `provider_node_id`). Resolution adds `target_node ← node_id → provider_node_id → provider_nodes.node_name`.
- **Decision summary table** — add row `17 | Node is a published abstraction | Users never see raw node names`.

---

## 2. Schema changes (`06-database-schema.md`)

### 2.1 New published table (§3 Published / Service Layer)
```sql
nodes (                               -- PUBLISHED nodes
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
**Rule (extend the existing §3 rule):** user-facing reads use `catalogs`, `networks`, `datastores`, **and `nodes`** only — never `provider_*`. Status mirrors networks/datastores: `Active` = published & provider connected & discovered_status Active; `Inactive` = admin-disabled; `Provider Offline` = provider disconnected; `Missing` = discovered node went `Missing`.

### 2.2 Node-level utilization snapshot (§2 Discovery Layer — real gap)
`provider_nodes` has `cpu_count`/`total_memory` (the denominators) but no usage snapshot, so the Node Overview CPU%/RAM% columns have nothing to read. Add:
```sql
-- add to provider_nodes:
  cpu_utilization  DECIMAL NULL,   -- point-in-time % (from /cluster/resources?type=node `cpu`)
  ram_usage_mb     BIGINT  NULL,   -- point-in-time used MB (from `mem`)
```
These are a snapshot, not time-series — same contract as `provider_vms.cpu_utilization`/`ram_usage_mb`. RAM% = `ram_usage_mb / (total_memory/1024/1024)`.

### 2.3 Request & inventory FK swap (§5, §6)
- `provision_requests`: **replace** `provider_node_id BIGINT FK -> provider_nodes.id` **with** `node_id BIGINT FK -> nodes.id` (published).
- `inventory`: **replace** `provider_node_id BIGINT FK -> provider_nodes.id` **with** `node_id BIGINT FK -> nodes.id` (published).

(Parallel to how these tables already store published `network_id`/`datastore_id`, not `provider_network_id`/`provider_datastore_id`.)

### 2.4 Optional environment gating (§4 Policy Layer)
For full parity with network/datastore gating, add:
```sql
environment_node_rules ( id PK, environment_id FK, node_id FK );   -- references published nodes.id
```
**Recommended but optional.** Provider is already gated; a node belongs to one provider. Add this only if you want per-environment node allow-lists (e.g. "Production may only deploy to Zone A/B"). If you skip it, node selection is constrained solely by the chosen provider.

### 2.5 ER overview (§8) — add
```
provider_nodes ─1:1─ nodes (published)
environments ──< environment_node_rules >── nodes        # only if 2.4 adopted
users ──< provision_requests >── (environment, provider, node[published], catalog, tier, network, datastore)
```

### 2.6 Reconciliation notes (§9) — add bullet
- **Published node:** `provision_requests.node_id`/`inventory.node_id` reference the **published** `nodes` table; resolution to `provider_nodes.node_name` happens only at provisioning time via the discovered FK on the published row. Selecting a node filters catalogs/networks/datastores to the matching `provider_node_id`.

---

## 3. API contract changes (`07-api-contract.md`)

### 3.1 New endpoints (extend §4, "Published networks & datastores")
```
GET    /api/nodes                    -> [ node ]            // published; user reads see friendly fields only
POST   /api/nodes                    -> 201 { node_name, description, provider_id,
                                              provider_node_id, status }
PUT    /api/nodes/{id}               -> node
DELETE /api/nodes/{id}               -> 204 | 409 (in use by request/inventory/env rule → unpublish instead)
POST   /api/nodes/{id}/sync          -> node                // scoped node discovery: refresh status + util snapshot ("Sync now" action)
GET    /api/nodes/{id}/explorer      -> { node, templates[], networks[], datastores[], vms[] }  // Node Explorer drawer (read-only; node-scoped)
```
The `/explorer` read is the node-scoped twin of `/api/providers/{id}/explorer` — it returns only the discovered `provider_*` rows whose `provider_node_id` matches this published node's. Admin-only; inspection, no publish/provision.
Rename the section header to **"Published nodes, networks & datastores."**

### 3.2 Provision request body (§7) — swap field
```diff
- vm_name, environment_id, provider_id, provider_node_id,
+ vm_name, environment_id, provider_id, node_id,            // node_id is the PUBLISHED node
  catalog_id, tier_id, network_id, datastore_id,
```

### 3.3 Environment allowed-resources (§6) — add nodes (only if 2.4 adopted)
```diff
  POST /api/environments  body: { ..., allowed_provider_ids[], allowed_tier_ids[],
-                                  allowed_network_ids[], allowed_datastore_ids[] }
+                                  allowed_network_ids[], allowed_datastore_ids[], allowed_node_ids[] }

  GET /api/environments/{id}/allowed-resources
-     -> { providers[], tiers[], networks[], datastores[] }
+     -> { providers[], nodes[], tiers[], networks[], datastores[] }
```

### 3.4 Provider stats (§2) — add published-node count
```diff
- GET /api/providers/stats -> { providers, connected, discovery_success, templates, networks, datastores, vms }
+ GET /api/providers/stats -> { providers, connected, discovery_success, nodes, templates, networks, datastores, vms }
```
(`nodes` = count of published nodes. The existing `/capacity` endpoint already returns per-node usage; the Node Preview panel reads `nodes` joined to `provider_nodes` for the util snapshot.)

### 3.5 Security invariants (§13) — extend #2
> Catalog/network/datastore **/node** user reads expose only published fields — never raw `provider_*` names — except inside admin discovery/explorer endpoints **and the admin Node Preview panel**.

---

## 4. Backend services changes (`04-backend-services.md`)

### 4.1 Service map (§1) — add
```
Published / Service Layer
  NodePublishService          // NEW — CRUD for published nodes
```

### 4.2 New service (§3, next to NetworkPublishService/DatastorePublishService)
**`NodePublishService`** — CRUD for `nodes`, each referencing one discovered `provider_nodes` row and exposing a friendly name. Derives `status` from the linked discovered node (`provider_nodes.status`/`discovered_status`) + provider connection. Delete is blocked (409) if the published node is referenced by any provision request, inventory row, or `environment_node_rules` entry — admin **unpublishes** (status Inactive) instead. Exposes a scoped re-sync that refreshes the node's status + utilization snapshot.

### 4.3 `ResourceResolutionService` (§3.3) — change the node line
```diff
- target_node  ← provider_nodes.node_name        (from provider_node_id)
+ target_node  ← provider_nodes.node_name        (via node_id → nodes.provider_node_id)
```
Everything else in the resolver is unchanged; Terraform still receives `target_node`, never an `*_id`.

### 4.4 `EnvironmentPolicyService` (§4.2) — add nodes to the filter (only if 2.4 adopted)
`allowedResources(environment_id)` returns `nodes[]` alongside providers/tiers/networks/datastores, intersected with `Active` status.

### 4.5 `DiscoveryService` / `ProxmoxProvider` (§2.2–§2.3) — capture node util
`discoverNodes()` already reads `GET /cluster/resources?type=node`. Persist the per-node `cpu` (→ `cpu_utilization`) and `mem` (→ `ram_usage_mb`) snapshot into the new `provider_nodes` columns during the status-tier sync, and stamp `last_sync_at`. `getNodeHealth(node)` returns the same snapshot for the per-row "Sync now" action.

---

## 5. Implementation plan changes (`02-implementation-plan.md`)

- **Phase 2 §7/§8:** when persisting `provider_nodes`, also store the `cpu_utilization`/`ram_usage_mb` snapshot from the status-tier `/cluster/resources?type=node` read.
- **Phase 3 §1:** migrations add **`nodes`** (published) alongside `catalogs`/`networks`/`datastores`.
- **Phase 3 §3:** add "Node publish CRUD" beside Network/Datastore publish CRUD.
- **Phase 3 §5:** this is the helper the plan already names — implement `node_id → node name` against the new `nodes` table (no longer a dangling reference).
- **Phase 4 §1:** add `environment_node_rules` migration (only if 2.4 adopted).
- **Phase 4 §5:** resource-filtering service also returns allowed nodes (only if 2.4 adopted).
- **Phase 5 §1:** `provision_requests` migration uses `node_id` (published), not `provider_node_id`.

**Exit-criteria additions:** Phase 3 — "admin can publish a node; the wizard's node list reads from `nodes`, never `provider_nodes`."

---

## 6. Deployment workflow changes (`08-deployment-workflow.md`)

- **B.2 step 2 (resolution):**
```diff
- provider_node_id → target_node
+ node_id (published) → provider_node_id → target_node
```
- **A.4 step 7:** "Admin publishes **nodes**, catalog, networks, datastores, defines tiers/environments."
- **Part D checklist:** add "Published nodes created; wizard node list shows friendly names only."

---

## 7. PRD changes (`01-PRD.md`)

- **New §3.x — Node Management (Published Nodes):** mirror §3.3/§3.4. "Publish a **node** that abstracts a discovered provider node (e.g. "Jakarta Zone A" → `pve01`). Backend resolves `node_id → provider_node_id → node name` at provisioning time. The wizard's node selector reads only `nodes`; raw node names never reach the user. The **Node Preview panel** (at the bottom of Provider Management) lists published nodes with their synced CPU%/RAM% and operational status, a `+ Add Node` action, and per-row Edit / Sync now / Node Explorer / Delete — Admin-only, from the DB snapshot. **Node Explorer** is a read-only, node-scoped Discovery Explorer drawer."
- **Provision wizard (Step 1) description:** the user selects Environment → Provider → **published Node (friendly name)**, not a raw hypervisor node.
- **Admin utilization dashboard bullet:** already covers node capacity; note the Node Preview panel surfaces the per-node snapshot for capacity-at-a-glance.

---

## 8. README changes (`00-README.md`)

- ADR count **16 → 17**; add ADR-17 to the §3 summary line ("…cloud-init identity/disk bootstrap, gated data-disk flow, **published nodes**").
- "Authoritative reconciliations" — add: **Published node** — node is the fourth published abstraction; requests/inventory store `node_id` (published); raw node names are admin-only.

---

## 9. Frontend alignment (mockup → repo)

**Layout (matches the existing repo).** Node management is **not** a new page and **not** a tab. It follows the **`UserManagement.jsx` page pattern**: a horizontal statistics card on top, then **stacked table panels in one scroll container**. Concretely, on the existing **`ProviderManagement.jsx` page**, a new **Node Preview panel is rendered directly below the Providers panel** (bottom of the provider preview). Each panel is a card with its own header (title + count badge on the left, search + primary button on the right) and a table that **reuses the Provider Management table style** (`ResizableTh` headers, `table-row-optimized` rows, the same status-pill and kebab-dropdown components, dark-mode `dark:border-theme` tokens).

- The Node Preview panel header carries a **`+ Add Node`** primary button on the **top right** (same placement/treatment as Provider's add button).
- The table's **Action column is a kebab (3-dot) dropdown** — identical to Provider Management — with four items in order: **Edit node · Sync now · Node Explorer · Delete node** (Delete is the danger item below a divider).

**Column → source mapping** (the seven columns, exactly as specified):

| Column | Source | Notes |
|---|---|---|
| Node Name | `nodes.node_name` (friendly) + `provider_nodes.node_name` shown small beneath | an **Inactive** inline tag appears next to the name when `nodes.status != Active` — governance state is shown inline, not as its own column |
| Provider | `providers.provider_name` via `nodes.provider_id` | |
| CPU Utilization | `provider_nodes.cpu_utilization` (snapshot) | bar + %; `— offline` when the node is offline |
| RAM Utilization | `provider_nodes.ram_usage_mb / total_memory` | bar + % |
| Status | `provider_nodes.status` → **Online / Offline / Maintenance** (operational) | pill, same style as Provider connection pill |
| Sync | `provider_nodes.last_sync_at` (freshness, e.g. "synced 2m ago") | **read-only display**; the manual trigger is the **"Sync now"** kebab action → `POST /api/nodes/{id}/sync` |
| Action | kebab → Edit / Sync now / Node Explorer / Delete | Delete 409 → "Unpublish instead" |

**Action details:**
- **Edit node** → opens `NodeForm` modal (published name, description, Active toggle; shows the `pveNN → friendly` mapping read-only).
- **Sync now** → `POST /api/nodes/{id}/sync`; spins the Sync cell, then updates the freshness label. (This is the manual counterpart to auto-discovery.)
- **Node Explorer** → opens a right-side **drawer modeled on `ProviderDiscovery.jsx`**, scoped to this node: read-only tabs (Templates / Networks / Datastores / VMs) reading `GET /api/nodes/{id}/explorer`. No publish/provision actions inside.
- **Delete node** → typed/confirm modal; if referenced, returns 409 and offers **Unpublish** (set `status = Inactive`).

**New frontend files (mirror the existing settings-module composition):**
- `src/modules/settings/provider/NodePreview.jsx` — the panel + table, rendered at the bottom of `ProviderManagement.jsx`.
- `src/modules/settings/provider/NodeForm.jsx` — Add/Edit modal (parallel to `ProviderForm.jsx` / `DatastoreForm.jsx`).
- `src/modules/settings/provider/NodeExplorer.jsx` — the node-scoped Discovery Explorer drawer (parallel to `ProviderDiscovery.jsx`).

**Vocabulary lock:** governance state uses the canonical published-layer enum **Active / Inactive / Provider Offline / Missing** — the same words catalogs/networks/datastores render — surfaced as the inline **Inactive** tag (and the `NodeForm` "Active" toggle), *not* a "Published/Unpublished" column. "Add Node" / "Publish node" is the action verb; publishing makes the row `Active`, exactly like Catalog. The operational **Status** column (Online/Offline/Maintenance) is a separate concern from this governance state.

---

## 10. Migration / rollout order (forward-only, paired down-migrations per Part C)

1. `ALTER provider_nodes ADD cpu_utilization, ram_usage_mb` (nullable; backfilled on next discovery).
2. `CREATE TABLE nodes` (+ unique index).
3. (optional) `CREATE TABLE environment_node_rules`.
4. Backfill: for each distinct `provider_nodes` row currently referenced by a request/inventory, create a published `nodes` row (default `node_name = provider_nodes.node_name`, status Active) so existing data can be re-pointed.
5. `provision_requests` / `inventory`: add `node_id`, backfill from the map in step 4, then drop `provider_node_id`.
6. Ship `NodePublishService` + `/api/nodes/*`; point the wizard + Node Overview at it.
7. Admin renames backfilled nodes to friendly labels at leisure (renames never touch the provider).

**Note:** step 4's default friendly name equals the raw name, so nothing breaks before an admin curates; the abstraction is in place from migration time, the polish is incremental.
