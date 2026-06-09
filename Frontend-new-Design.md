# Frontend — New Design (From-Scratch Blueprint)
## Proxmox Self-Service VM Provisioning Portal

This document is a **complete from-scratch specification** for the frontend. It is provided as an alternative to the existing GitHub frontend: if you decide to throw the existing UI away and rebuild, an implementation agent can execute this document end-to-end without referring back to the GitHub repo.

It is intentionally **opinionated and concrete** — every page, route, state slice, API call, and visual token is specified.

> **Authoritative inputs.** This design conforms to `01-PRD.md`, `03-architectural-decisions.md`, `06-database-schema.md`, `07-api-contract.md`, and all `architecture-v2-*.txt` module specs. If anything below contradicts those, those win.

---

## 1. Goals & non-goals

**Goals**
- Self-service VM provisioning UI that hides all provider internals (no `vmbr0`, `local-lvm`, `pveX` strings ever shown to the User).
- Strict RBAC enforced in the UI *and* on the API.
- Zero credentials ever displayed; every secret field write-only.
- Provider-agnostic: today Proxmox, tomorrow OpenStack / OLVM with no UI rewrite.
- Auditable: every state-changing action records `audit_logs` server-side; UI surfaces the audit page to Manager/Administrator.

**Non-goals (v1)**
- SSO/LDAP (schema-ready, UI shows `auth_provider: local` only).
- Live console / VNC into the VM.
- Cost / billing surfaces.
- Quota / `max_instances` UI (schema-ready but hidden).

---

## 2. Stack

| Concern | Choice | Rationale |
|---|---|---|
| Framework | **React 18** | Mature ecosystem, hooks, concurrent rendering. |
| Build tool | **Vite 5** | Fast dev server; production build is plain Rollup. |
| Routing | **react-router-dom 6** | File-anchored, nested routes, route loaders if needed. |
| State (domain) | **React Context per domain** | Matches the eight backend modules cleanly. |
| State (UI cross-cut) | **Zustand 4** | Lightweight, no Provider tree; for toast queue, dark-mode, sidebar collapse. |
| HTTP | **axios 1.x** | Interceptors for auth header, case conversion, error shape. |
| Case conversion | **humps** | `camelizeKeys` / `decamelizeKeys` at the axios layer. |
| Forms | **react-hook-form** + **zod** | Schema validation; mirrors backend validation rules. |
| Tables | Hand-rolled with `ResizableTh` + `lucide-react` icons. | No heavy grid lib needed. |
| Icons | **lucide-react** | Tree-shakeable. |
| Styling | **Tailwind CSS** (build dep, not CDN) + CSS variables | Tokens stay portable. |
| Testing | **vitest** + **@testing-library/react** + **msw** | Component, integration, and mocked-API tests. |
| Lint/format | **eslint** + **prettier** | Standard. |

**`package.json` runtime deps (target):**
```
react ^18.2, react-dom ^18.2, react-router-dom ^6.22,
axios ^1.6, zustand ^4.5, lucide-react ^0.368,
react-hook-form ^7.51, zod ^3.22, humps ^2.0
```

---

## 3. Directory layout

```
frontend/
├── .env.example                   # VITE_API_BASE_URL=http://localhost:8000/api
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js                 # NO apiSimulationPlugin; proxy /api → backend in dev only
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx                    # BrowserRouter + ProviderTree + AppLayout
│   ├── index.css                  # Tailwind directives + CSS tokens
│   ├── lib/
│   │   ├── api.js                 # axios instance + interceptors
│   │   ├── auth.js                # token storage + login/logout helpers
│   │   ├── rbac.js                # role constants + permission helpers
│   │   ├── format.js              # bytes, dates, mb-to-gb, vm-name validators
│   │   └── errors.js              # normalized error class
│   ├── stores/
│   │   ├── uiStore.js             # zustand: toast queue, dark mode, sidebar
│   │   └── notificationStore.js   # zustand: notification center entries
│   ├── contexts/
│   │   ├── UserContext.jsx
│   │   ├── ProviderContext.jsx
│   │   ├── CatalogContext.jsx
│   │   ├── NetworkContext.jsx
│   │   ├── DatastoreContext.jsx
│   │   ├── TierContext.jsx
│   │   ├── EnvironmentContext.jsx
│   │   └── (each exposes: items, loading, error, fetch, create, update, remove)
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppLayout.jsx
│   │   │   ├── Sidebar.jsx
│   │   │   └── Topbar.jsx
│   │   ├── common/
│   │   │   ├── Button.jsx
│   │   │   ├── Input.jsx
│   │   │   ├── Select.jsx
│   │   │   ├── Textarea.jsx
│   │   │   ├── Modal.jsx
│   │   │   ├── Drawer.jsx
│   │   │   ├── ConfirmModal.jsx
│   │   │   ├── UnsavedChangesGuard.jsx
│   │   │   ├── TableActionMenu.jsx
│   │   │   ├── ResizableTh.jsx
│   │   │   ├── Pagination.jsx
│   │   │   ├── StatusBadge.jsx
│   │   │   ├── StatWidget.jsx
│   │   │   ├── EmptyState.jsx
│   │   │   ├── Toast.jsx
│   │   │   ├── Spinner.jsx
│   │   │   └── ErrorBoundary.jsx
│   │   ├── RequireAuth.jsx
│   │   └── RequireRole.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── Catalog.jsx
│   │   ├── VmRequest.jsx          # 3-step wizard
│   │   ├── Inventory.jsx
│   │   ├── Approvals.jsx
│   │   ├── Settings.jsx           # tabbed host
│   │   └── NotFound.jsx
│   ├── modules/
│   │   └── settings/
│   │       ├── provider/
│   │       │   ├── ProviderManagement.jsx
│   │       │   ├── ProviderForm.jsx
│   │       │   └── ProviderDiscovery.jsx     # Discovery Explorer drawer
│   │       ├── catalog/
│   │       │   ├── CatalogManagement.jsx
│   │       │   └── CatalogForm.jsx
│   │       ├── network/
│   │       │   ├── NetworkManagement.jsx
│   │       │   └── NetworkForm.jsx
│   │       ├── datastore/
│   │       │   ├── DatastoreManagement.jsx
│   │       │   ├── DatastoreForm.jsx
│   │       │   └── DatastoreDiscovery.jsx
│   │       ├── tier/
│   │       │   ├── TierManagement.jsx
│   │       │   └── TierForm.jsx
│   │       ├── environment/
│   │       │   ├── EnvironmentManagement.jsx
│   │       │   └── EnvironmentForm.jsx
│   │       ├── user/
│   │       │   ├── UserManagement.jsx
│   │       │   ├── UserForm.jsx
│   │       │   ├── RoleManagement.jsx
│   │       │   ├── RoleForm.jsx
│   │       │   ├── GroupManagement.jsx
│   │       │   └── GroupForm.jsx
│   │       └── audit/
│   │           └── AuditManagement.jsx        # read-only, CSV export
│   └── styles/
│       └── design-system.md
└── tests/
    ├── setup.js
    └── ...
```

**Naming convention.** Every entity-specific component is **entity-prefixed** (`ProviderForm.jsx`, never `Form.jsx`). Every drawer for discovered resources is named **`<Entity>Discovery.jsx`** (not `Explorer.jsx`). Shared components live in `components/common/` and are entity-agnostic.

---

## 4. Design system

### 4.1 Tokens (CSS variables in `index.css`)

```css
:root {
  /* Light */
  --page: #F7F8FB;
  --card: #FFFFFF;
  --surface: #F1F4F9;
  --border: #E5E7EB;
  --text-primary: #0F172A;
  --text-muted: #64748B;
  --accent: #2563EB;
  --success: #10B981;
  --warning: #F59E0B;
  --danger:  #EF4444;
  --info:    #06B6D4;
  /* Radii */
  --r-card: 16px;
  --r-input: 12px;
  --r-modal: 20px;
}
.dark {
  --page: #08132B;
  --card: #17243E;
  --surface: #24324D;
  --border: #2A3650;
  --text-primary: #E2E8F0;
  --text-muted: #94A3B8;
  /* accent/status colors unchanged */
}
```

### 4.2 Typography
- Inter (system fallback). Sizes: `12 / 13 / 14 / 15 / 16 / 18 / 22 / 28 px`. Weights: 400 / 500 / 600 / 700.

### 4.3 Layout
- Page background uses `--page`. Major sections sit on `--card` with `--r-card` radius and `1px` border in `--border`. Form fields use `--surface` background, `--r-input` radius.
- Modals: `--r-modal`, `bg-card`, `border-border`, max width 640px (forms) / 480px (confirms) / 960px (wizards).
- Spacing scale: Tailwind defaults (0.25rem step).

### 4.4 Component standards
- **Buttons:** primary (solid `--accent`), secondary (outline), ghost, destructive. 36px height standard; 32px compact (tables).
- **Inputs:** 40px height, label above (12px / 500), helper text below (11px / muted).
- **Tables:** 40px row height; resizable columns via `ResizableTh`; sticky header; zebra optional in dark mode only.
- **Statistics widgets:** four-up grid on desktop, two-up on tablet, stacked on mobile. Each widget is a card with icon + value + label.
- **Empty states:** centered icon (32px), short message, optional action button.
- **Toasts:** top-center, auto-dismiss 3s, severity colors, queued (newest below).
- **Drawers:** right-side, 600px wide, full height, header with close button, scrollable body.

### 4.5 Accessibility
- All interactive elements keyboard-reachable, visible focus ring (`outline: 2px solid var(--accent)`).
- Form labels associated with inputs via `htmlFor`/`id`.
- Modals trap focus and restore on close. `Escape` closes the topmost modal.
- All icon-only buttons have `aria-label`.

---

## 5. Routing & RBAC

### 5.1 Routes

```
/login                 public          Login
/                      protected       redirect → /catalog
/catalog               User+           Catalog
/request-vm            User+           VmRequest (?catalog_id pre-fill)
/inventory             User+           Inventory
/approvals             Manager+        Approvals
/settings              Administrator   Settings (with ?tab= for module switch)
/*                     any             NotFound
```

### 5.2 Guards

- `<RequireAuth>` — redirects to `/login` if no token / `GET /auth/me` 401.
- `<RequireRole role={['Manager','Administrator']}>` — redirects to `/catalog` with a toast if the user's role is not in the allowed list.

### 5.3 Role constants (`lib/rbac.js`)

```js
export const ROLES = {
  ADMIN:   'Administrator',
  MANAGER: 'Manager',
  USER:    'User',
};
export const isAdmin   = (u) => u?.role === ROLES.ADMIN;
export const isManager = (u) => u?.role === ROLES.MANAGER || isAdmin(u);
export const canApprove = isManager;
export const canManageSettings = isAdmin;
```

**Never compare against `'Admin'` or any other shortened form.** The API returns the seeded role names verbatim.

---

## 6. State management

### 6.1 Per-domain Context

Each context exports `{ items, loading, error, fetch, create, update, remove }`. Example (`TierContext.jsx`):

```jsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);

useEffect(() => { fetch(); }, []);

async function fetch() {
  setLoading(true); setError(null);
  try { setItems(await api.get('/tiers')); }
  catch (e) { setError(e); }
  finally { setLoading(false); }
}
```

Mutations refetch the affected list (cheap; n < 1000). Optimistic updates only for the toast.

### 6.2 Provider nesting in `App.jsx`

```
BrowserRouter
└─ UserProvider
   └─ ProviderProvider
      └─ CatalogProvider
         └─ NetworkProvider
            └─ DatastoreProvider
               └─ TierProvider
                  └─ EnvironmentProvider
                     └─ AppLayout
```

This order matches the data-dependency graph (catalogs/networks/datastores depend on providers; environments depend on tiers/networks/datastores).

### 6.3 Cross-cutting Zustand stores

- `uiStore` — `darkMode`, `toggleDarkMode`, `sidebarCollapsed`, `toggleSidebar`, `toasts[]`, `pushToast`, `dismissToast`.
- `notificationStore` — `entries[]`, `markRead`, `clear`. Populated by polling `GET /api/notifications` (future) or in-app events.

---

## 7. API client (`lib/api.js`)

```js
import axios from 'axios';
import { camelizeKeys, decamelizeKeys } from 'humps';
import { getToken, clearToken } from './auth';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach auth
api.interceptors.request.use((cfg) => {
  const token = getToken();
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  if (cfg.data && !(cfg.data instanceof FormData)) {
    cfg.data = decamelizeKeys(cfg.data);
  }
  if (cfg.params) cfg.params = decamelizeKeys(cfg.params);
  return cfg;
});

// Normalize responses + errors
api.interceptors.response.use(
  (res) => { res.data = camelizeKeys(res.data); return res; },
  (err) => {
    if (err.response?.status === 401) { clearToken(); window.location.href = '/login'; }
    const body = err.response?.data?.error;
    return Promise.reject({
      code: body?.code ?? 'UNKNOWN',
      message: body?.message ?? err.message,
      details: body?.details ?? null,
      status: err.response?.status,
    });
  }
);

// Convenience: return .data directly
export default {
  get:   (...a) => api.get(...a).then(r => r.data),
  post:  (...a) => api.post(...a).then(r => r.data),
  put:   (...a) => api.put(...a).then(r => r.data),
  del:   (...a) => api.delete(...a).then(r => r.data),
};
```

Every page/module imports this single instance. **No component constructs `fetch()` directly.**

---

## 8. Pages — wireframe-level specification

### 8.1 Login

- Centered card on `--page`.
- Logo, "Sign in to InfraProv" header.
- Email + Password inputs (validation: required, email format).
- "Sign in" button.
- On submit → `POST /api/auth/login` → store token → `GET /api/auth/me` → `UserContext.setUser(user)` → navigate `/catalog`.
- Error from API rendered inline below the password field.

### 8.2 Catalog

- Page header: "VM Catalog" + search input + (Admin) "Manage Catalog" link to Settings.
- Grid: 3-up desktop / 2-up tablet / 1-up mobile. Each card = catalog item (image 64×64, name, OS, description preview, "Request VM" button → `/request-vm?catalog_id=…`).
- Empty state: "No published catalogs yet. Ask an administrator to publish one."
- Data: `GET /api/catalogs` (User sees only `status: 'Active'`).

### 8.3 VmRequest (3-step wizard)

Top stepper. Buttons: `Back`, `Next`, `Submit`. Unsaved-changes guard on browser nav.

**Step 1 — Environment**
- Cards or radio list of environments; each shows: name, description, expiry policy ("30 days" / "Permanent" / "60 days"), approval-required badge.
- Selection triggers `GET /api/environments/{id}/allowed-resources` to populate Step 2 options.

**Step 2 — Configuration**
- Catalog (pre-filled from `?catalog_id`; selectable from allowed list otherwise).
- Tier dropdown — shows `Bronze (2 vCPU · 4 GB RAM · 40 GB Disk)` etc. **Resolved from API, never hardcoded.**
- Network dropdown — published-name only.
- Datastore dropdown — published-name only.
- VM name input (regex `^[a-zA-Z0-9-]{3,30}$`, dedupe-check via `/api/inventory?vm_name=…`). This name becomes the provider VM name **and** the guest hostname (set by cloud-init/cloudbase-init).
- Boot disk size (GB) — optional; defaults to and is floored at the tier/template disk size. cloud-init/cloudbase-init grows the filesystem on first boot. (Adding *separate* data disks is not done here — see Inventory → Edit Resources.)
- Security Hardening — checkbox; when on, Ansible runs the hardening playbook after provisioning.
- Requested expiry — date picker, capped by environment policy.
- Description (optional, max 500 chars).
- Multi-VM batch: count (1–10) + prefix → auto-generates `${prefix}01`, `${prefix}02`, …

**Step 3 — Review**
- Read-only summary card. "Submit Request" button.
- On submit → `POST /api/provision-requests`. Response → toast + navigate `/inventory` (no-approval env) or `/approvals` view-your-own (approval env).

### 8.4 Inventory

- Stat widgets: Total VMs / Active / Provisioning / Expiring soon.
- Search + lifecycle-status filter (`All / Active / Provisioning / Failed / Expired / Deleted`); optional observed-power filter (running/stopped).
- Table columns: VM Name | Environment | Provider | Network | IP | **Status** | Expiry | Actions. The **Status** column shows the dual model: portal **lifecycle** (Active/Provisioning/Expired/…) next to the provider-synced **observed power** (running/stopped/`unknown`). There is **no "Resources" column** — compute/storage detail lives in the expandable row.
- **Expandable row detail:** Node / Datastore / Network, then a **Resources** block — vCPU shown as **sockets × cores**, RAM capacity, and a **per-disk breakdown** (each disk: bus/index + size), all allocation figures (snapshot). `last_sync_at` shown so staleness is visible; if `observed_power_state = unknown`, badge it as Provider Unreachable.
- Row action menu: Renew, Make Permanent, **Edit Resources**, Delete, Retry (if Failed), Provider Sync.
- **Edit Resources modal** — a single modal with two approval-gated sections, differing in what happens after approval:
  - **CPU / RAM:** CPU stepper + RAM stepper (GB display, MB on the wire). VM-name confirmation must equal `vm_name` exactly. Submit → `POST /api/inventory/{id}/resize`. On approval this is applied **automatically** (no admin step).
  - **Add Data Disk** (shown only when the VM's `environment.allowDataDisk` is true; otherwise hidden): size (GB) + a setup-intent description box with placeholder guidance — *Linux: mount `/data`, fs `ext4`/`xfs`, optional LVM; Windows: drive `D:`, `GPT`/`MBR`, `NTFS`*. Existing disks render disabled (no shrink/edit). VM-name confirmation required. Submit → `POST /api/inventory/{id}/add-disk`. On approval, Terraform attaches a raw disk, then the request shows **Pending Disk Setup** until an admin formats/mounts it and marks it Ready (admin-only `POST /api/inventory/{id}/disks/{diskId}/complete`). Surface the disk's `setupStatus` (Pending Setup / Ready) as a small badge; the VM lifecycle stays `Active`.
- **Delete confirmation:** typed VM-name confirmation. Submit → `POST /api/inventory/{id}/delete` → approval queue, lifecycle status stays `Active` until approved.
- **Admin utilization (separate from user inventory):** live CPU%/RAM-used per VM and node/datastore capacity are shown in the Admin/Provider dashboard (`GET /api/providers/{id}/capacity`), not in the user inventory table.

### 8.5 Approvals (Manager/Administrator)

- Stat widgets: Total / Pending / Approved / Rejected / Reverted.
- Tabs: Pending | All. Filter by request_type (Provision, Renewal, Permanent, Resize, Add Disk).
- Expandable rows: requester, environment, tier (resolved CPU/RAM/disk), network, datastore, VM name(s), reason.
- Actions: Approve / Reject / Revert. Each opens a modal requiring `action_reason` (textarea, min 10 chars).
- For Resize requests, show the diff (before → after).

### 8.6 Settings (Administrator only)

- Left rail tabs (or `?tab=` URL): Users · Roles · Groups · Providers · Catalog · Networks · Datastores · Tiers · Environments · Audit.
- Each tab loads the corresponding `<Entity>Management.jsx`.
- Shared module pattern — see § 9.

### 8.7 NotFound

- Centered illustration + "404 — page not found" + "Back to Catalog" button.

---

## 9. Settings module pattern (uniform across all eight)

Every module renders the same six-region layout:

```
┌─ Title + primary "+ Create" button ─────────────┐
│ Statistics widgets (4-up)                        │
│ Search · status filter · column toggle           │
│ Table (resizable cols, row action menu, paging)  │
│ ───────────────────────────────────────────────  │
│ Create/Edit Modal (entity Form, unsaved guard)   │
│ Confirm Modal (delete / disable / etc.)          │
└──────────────────────────────────────────────────┘
```

### 9.1 Provider module specifics

- **Form fields (eight credential-related, all required on create):**
  - Basic: `providerName`, `providerType` (select: Proxmox / [future] OpenStack / OLVM), `endpoint`, `description`.
  - **Discovery credential:** `discoveryUsername`, `discoveryTokenId`, `discoveryTokenSecret`.
  - **Provisioning credential:** `provisionUsername`, `provisionTokenId`, `provisionTokenSecret`.
  - Terraform: `terraformProviderSource` (e.g. `Telmate/proxmox`), `terraformProviderVersion` (e.g. `3.0.2-rc04`).
  - Auto-discovery: `autoDiscoveryEnabled` (bool), `discoveryInterval` (minutes).
- **Secret rule:** on edit, secret inputs render empty; sending an empty value means "do not change". The server never returns secrets.
- **Buttons inside the form:** `Test Connection` (calls `/test-connection`, shows badge), `Run Discovery Now` (calls `/discover`, shows counts).
- **Discovery Explorer drawer** (`ProviderDiscovery.jsx`): tabs Nodes / Templates / Networks / Datastores / **VMs**. Each entry shows discovered name, node, status (`Active` / `Missing`), `lastSyncAt`; the VMs tab also shows `externalVmid`, power state, and IP. Optionally surface drift (`GET /api/providers/{id}/drift`): VMs present on the provider but unmanaged, or inventory VMs now `Missing`.

### 9.2 Catalog, Network, Datastore (published abstractions)

- Each form picks a provider, then a provider-node, then the discovered resource on that node.
- The public-facing list (`Catalog.jsx`, wizard dropdowns) reads only `*_name` from these tables — never the underlying `provider_*` names. (ADR-04.)

### 9.3 Tier

- Form: `tierName`, `description`, `cpu` (int), `ram` (GB, integer; converted to `ram_mb`), `disk` (GB), `status` (Active/Inactive).
- Authoritative tier values: Bronze 2 / 4 / 40, Silver 4 / 8 / 80, Gold 8 / 16 / 160, Platinum 16 / 32 / 320 (CPU / GB-RAM / GB-disk). The backend **auto-seeds Bronze, Silver, Gold** (flag them read-only / `Default`); Platinum is a documented standard size an administrator may create.
- Delete blocked (409) if referenced by inventory / environment policy / request.

### 9.4 Environment

- Form: `environmentName`, `description`, `expiryType` (`days` / `permanent` / `custom`), `expiryValue`, `approvalRequired` (bool), `allowDataDisk` (bool — permits adding data disks to VMs in this environment; default off), `status`, `displayOrder`.
- Four multi-select fields for the policy: `allowedProviderIds`, `allowedTierIds`, `allowedNetworkIds`, `allowedDatastoreIds`.

### 9.5 User / Role / Group

- User form: name, email, password (create only; reset via separate menu), role (select), group (select), status.
- Role form: roleName, description. (Permissions are derived server-side from `role_name`.)
- Group form: groupName, roomFloor, description, manager (select user — nullable).
- Delete rules surface as 409 with explanatory message (per `architecture-v2-user-management.txt` delete policy).

### 9.6 Audit

- Read-only table: timestamp, user (snapshot name), action_type, target, description, ip_address.
- Filters: action_type select, user search, date range.
- "Download CSV" → `GET /api/audit-logs/export` respecting active filters.
- RBAC: Manager sees own group's audit rows; Administrator sees all.

---

## 10. Form patterns (react-hook-form + zod)

Every form follows the same pattern:

```jsx
const schema = z.object({ /* zod schema mirroring backend validation */ });

const { register, handleSubmit, formState, watch, reset } =
  useForm({ resolver: zodResolver(schema), defaultValues });

const onSubmit = async (data) => {
  try {
    await context.create(data);          // or .update(id, data)
    pushToast({ kind: 'success', message: 'Saved.' });
    onClose();
  } catch (e) {
    if (e.code === 'VALIDATION') setApiErrors(e.details);
    else pushToast({ kind: 'error', message: e.message });
  }
};
```

**Unsaved-changes guard.** `<UnsavedChangesGuard isDirty={formState.isDirty} />` intercepts modal close and browser navigation; shows a confirm dialog.

**Field-level API errors.** When the API returns `error.details = { field: 'vm_name', reason: 'duplicate' }`, the form maps it to the matching input.

---

## 11. Notifications

Two surfaces, both fed by `notificationStore` and (later) `GET /api/notifications`:

- **Inline toast** — short-lived (3s), top-center, success/info/warn/error.
- **Notification Center** — popover from the topbar bell. Persistent list; categories: Approval / Provisioning / Lifecycle / Expiry. Marked as read on open.

---

## 12. Auth & session

- `lib/auth.js` stores the bearer token in `localStorage` (`infraprov.token`) and exposes `getToken()`, `setToken()`, `clearToken()`.
- On boot, `<RequireAuth>` calls `GET /api/auth/me`; sets `UserContext.user`; if 401 → `/login`.
- Logout: `POST /api/auth/logout` → `clearToken()` → navigate `/login`.
- Reset password: from topbar menu → modal with old + new + confirm; `POST /api/auth/reset-password`.

---

## 13. Environment variables

```
# .env.example
VITE_API_BASE_URL=http://localhost:8000/api
VITE_APP_NAME=InfraProv
```

Dev: `vite.config.js` proxies `/api → VITE_API_BASE_URL` so cookies/CORS Just Work locally. Production: served behind the same origin as the API (recommended) — no CORS needed.

---

## 14. Build & deployment

- **Local dev:** `npm i && npm run dev` (default port 5173).
- **Production build:** `npm run build` → `dist/`. Serve via the backend's static handler, or nginx, or a CDN.
- **Versioning:** `package.json` `version`; `git rev-parse HEAD` baked into `import.meta.env.VITE_BUILD_SHA` at build time, surfaced in the Topbar tooltip.
- **CI:** lint + typecheck (if TS later) + `vitest run` + `npm run build`. Block merge on red.

---

## 15. Testing strategy

- **Unit:** `lib/*` helpers (case converter, format utilities, RBAC).
- **Component:** every `<Entity>Form` rendered with `msw` mocks; submit calls correct endpoint with correct body.
- **Integration:** wizard happy path (env → config → review → submit) with `msw` returning the policy endpoint and provision-request response.
- **RBAC:** `<RequireRole>` redirects an unauthorized user; sidebar omits hidden links.
- **Accessibility:** `axe-core` smoke run on each page.

---

## 16. Implementation order (suggested)

1. Scaffold Vite + Tailwind + tokens; `AppLayout` shell with mock data.
2. `lib/api.js` + `lib/auth.js`; wire `Login` end-to-end against the real API.
3. `UserContext` + `<RequireAuth>` + `<RequireRole>` + Sidebar filtering.
4. Settings → Users / Roles / Groups (smallest surface, exercises every CRUD pattern).
5. Providers (most complex form: dual credentials, Test Connection, Discovery drawer).
6. Catalogs / Networks / Datastores / Tiers / Environments — all share the module pattern, build in parallel.
7. Catalog page + VmRequest wizard.
8. Inventory + lifecycle actions (Renew, Permanent, Edit Resources, Delete, Retry, Provider Sync).
9. Approvals page + action modals.
10. Audit page.
11. Notification Center + toast queue polish.
12. Accessibility pass, axe-core fixes, dark-mode QA.
13. Bundle / Lighthouse pass; CI green; deploy.

---

## 17. Definition of done

- All API endpoints in `07-api-contract.md` consumed.
- No mock data files anywhere in `src/`.
- No `MOCK_USER` reference; auth required for every page except `/login`.
- No secret ever rendered to the DOM after save.
- Lighthouse: Performance > 85, Accessibility ≥ 95.
- Empty / loading / error states for every list and form.
- Keyboard-only walkthrough of the wizard, approvals, and a settings module completes successfully.
- Tier values displayed in the wizard exactly match `GET /api/tiers` (no local constants).
