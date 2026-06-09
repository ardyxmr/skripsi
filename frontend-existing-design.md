# Frontend — Existing Design Fix List
## Patches to apply to the current GitHub repo before backend integration

This document is a **surgical patch list** for the existing React frontend (the one already in the user's GitHub repo and mirrored in this project). It is NOT a from-scratch spec — it assumes the agent keeps the current files, layout, and visual design and applies the targeted changes below.

**Audience:** an implementation agent given commit access to the frontend repo.
**Authority:** where this file disagrees with `Frontend-new-Design.md` or the architecture-v2 specs, those win. This file is operational, not declarative.

---

## 0. Ground rules for the agent

- **Do not** rebuild the UI. Preserve every page's existing JSX structure, Tailwind classes, dark-mode tokens, and component composition.
- **Do not** delete the visual design tokens in `src/index.css` or the layout in `src/App.jsx`. Keep the 3-layer (`page`/`card`/`surface`) background system.
- **Do** create a small shared `lib/` directory for the API client, auth, and RBAC helpers. Never inline `fetch()` calls in components.
- **Do** preserve component file names that already exist; only rename where this doc explicitly says to.
- After each numbered section is applied, the app should still build (`npm run build`) and the dev server should still render the page that section touches.

---

## 1. Repository hygiene (apply first)

### 1.1 Add `.env` plumbing
- Create `frontend/.env.example`:
  ```
  VITE_API_BASE_URL=http://localhost:8000/api
  VITE_APP_NAME=InfraProv
  ```
- Add `frontend/.env` to `.gitignore` (if not already).
- In `vite.config.js`, add a dev proxy (after the `apiSimulationPlugin` removal in § 9):
  ```js
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
  ```

### 1.2 Add runtime deps
```
npm i humps react-hook-form zod @hookform/resolvers
```
(`axios` and `zustand` are already listed in `package.json`.)

### 1.3 Tailwind off the CDN
- `npm i -D tailwindcss postcss autoprefixer`
- `npx tailwindcss init -p`
- In `tailwind.config.js`: `content: ['./index.html', './src/**/*.{js,jsx}'], darkMode: 'class'`.
- Replace the CDN `<script>` in `index.html` with the standard `@tailwind base; @tailwind components; @tailwind utilities;` at the top of `src/index.css` (keep the existing CSS variable block).
- Smoke-test that all existing utility classes still resolve.

---

## 2. New shared modules (create these files)

### 2.1 `src/lib/api.js`
Single axios instance, used by every context and page. See `Frontend-new-Design.md` § 7 for the full content; key points:
- `baseURL: import.meta.env.VITE_API_BASE_URL`.
- Request interceptor: attach `Authorization: Bearer <token>` from `localStorage('infraprov.token')`; `humps.decamelizeKeys` on outgoing body and params.
- Response interceptor: `humps.camelizeKeys` on incoming body; on 401, clear token and redirect to `/login`; normalize errors to `{ code, message, details, status }`.

### 2.2 `src/lib/auth.js`
```js
const KEY = 'infraprov.token';
export const getToken   = () => localStorage.getItem(KEY);
export const setToken   = (t) => localStorage.setItem(KEY, t);
export const clearToken = () => localStorage.removeItem(KEY);
```

### 2.3 `src/lib/rbac.js`
```js
export const ROLES = { ADMIN: 'Administrator', MANAGER: 'Manager', USER: 'User' };
export const isAdmin   = (u) => u?.role === ROLES.ADMIN;
export const isManager = (u) => u?.role === ROLES.MANAGER || isAdmin(u);
export const canApprove = isManager;
export const canManageSettings = isAdmin;
```
**Every UI gate must call these helpers.** Never compare role strings inline.

### 2.4 `src/components/RequireAuth.jsx`
Renders children if `UserContext.user` is set; otherwise `<Navigate to="/login" replace />`. On mount, if `getToken()` exists but `user` is null, calls `GET /auth/me` and populates the context.

### 2.5 `src/components/RequireRole.jsx`
Takes a `roles={['Manager','Administrator']}` prop. If the current user's role is not in the list, redirects to `/catalog` and pushes a "You don't have access to that page." toast.

### 2.6 `src/components/common/ConfirmModal.jsx`
Promote `modules/settings/provider/ProviderActionModal.jsx` to a generic shared modal. Props: `isOpen`, `title`, `message`, `confirmLabel`, `confirmKind` (default `'primary'` / `'danger'`), `onConfirm`, `onClose`, optional `typedConfirmation` (string that must be typed to enable the confirm button — used for VM delete and resize). Then update `ProviderActionModal` references to use this shared component (or keep the old file as a thin re-export).

### 2.7 `src/stores/uiStore.js` (Zustand)
```js
import { create } from 'zustand';
export const useUI = create((set) => ({
  darkMode: localStorage.getItem('darkMode') === 'true',
  toggleDarkMode: () => set((s) => {
    const next = !s.darkMode;
    localStorage.setItem('darkMode', String(next));
    return { darkMode: next };
  }),
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toasts: [],
  pushToast: (t) => set((s) => ({ toasts: [...s.toasts, { id: crypto.randomUUID(), ...t }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter(x => x.id !== id) })),
}));
```
Use this everywhere instead of the per-page `useState` for toasts and dark-mode.

---

## 3. `src/App.jsx` — required edits

### 3.1 Remove `MOCK_USER`, add a real current-user source
Delete the `MOCK_USER` constant and the `useState(MOCK_USER)` that feeds `currentUser` to `<Sidebar>` / `<Topbar>`.

**Important:** the existing `UserContext` only holds the admin-managed `users` / `roles` / `groups` lists — it does **not** hold the authenticated current user. So you must add a current-user slice. Pick one:
- (A, recommended) Extend `UserContext` with `currentUser` + `setCurrentUser`, set on login from `GET /api/auth/me`. Then `AppLayout` reads `const { currentUser } = useUserContext()`.
- (B) Create a dedicated `AuthContext` (or a Zustand `authStore`) holding `{ currentUser, login, logout }`, leaving `UserContext` for the admin lists.

Whichever you choose, `<RequireAuth>` populates it on boot and `AppLayout` consumes it.

### 3.2 Fix the role string
Replace every `'Admin'` comparison with `'Administrator'` and route through `lib/rbac.js`:

```diff
- if (user?.role === 'Manager' || user?.role === 'Admin') {
+ if (canApprove(user)) {
    links.splice(2, 0, { name: 'Approval Requests', icon: <CheckSquare size={15} />, path: '/approvals' });
  }

- if (user?.role === 'Admin') {
+ if (canManageSettings(user)) {
    links.push({ name: 'Settings', icon: <SettingsIcon size={15} />, path: '/settings' });
  }
```

### 3.3 Wire the `/login` route
The current `<Routes>` block imports `Login` but doesn't register a route. Add it **and** wrap the protected ones:

```jsx
<Routes>
  <Route path="/login" element={<Login />} />
  <Route element={<RequireAuth />}>
    <Route path="/" element={<Navigate to="/catalog" replace />} />
    <Route path="/catalog" element={<Catalog />} />
    <Route path="/request-vm" element={<VmRequest />} />
    <Route path="/inventory" element={<Inventory />} />
    <Route element={<RequireRole roles={['Manager','Administrator']} />}>
      <Route path="/approvals" element={<Approvals />} />
    </Route>
    <Route element={<RequireRole roles={['Administrator']} />}>
      <Route path="/settings" element={<Settings />} />
    </Route>
  </Route>
  <Route path="*" element={<NotFound />} />
</Routes>
```
(Use `<Outlet />` inside `RequireAuth`/`RequireRole`.)

### 3.4 Hide chrome on `/login`
Sidebar already returns null on `/login`. Do the same in Topbar so the login page renders edge-to-edge.

### 3.5 Replace inline toast state
The existing `globalToast` state belongs in `uiStore.toasts`. Replace the JSX block that renders `globalToast` with a `<Toast />` mapper reading from the store.

---

## 4. `src/pages/Login.jsx` — implement real auth

`Login.jsx` is imported in `App.jsx` but is not wired to a route, so its current state is effectively unused — verify whether it's a stub or partially built, then ensure this behavior:

1. Email + password form (use `react-hook-form` + `zod`).
2. On submit:
   - `POST /api/auth/login` with `{ email, password }`.
   - On success: `setToken(response.token)`, then `GET /api/auth/me`, then set the current user (via `setCurrentUser` from the auth slice added in § 3.1), then `navigate('/catalog')`.
   - On 401: render "Invalid email or password" under the password field.
   - On 5xx: push an error toast.
3. Visual styling: reuse the same `--card`/`--surface` tokens already in `index.css`. Center the card; max-width 400px.

---

## 5. `src/contexts/*.jsx` — fetch-on-mount pattern

Apply the same transformation to **every** context (UserContext, ProviderContext, CatalogContext, NetworkContext, DatastoreContext, TierContext, EnvironmentContext):

**Before**
```jsx
const [items, setItems] = useState(initialMockArray);
```

**After**
```jsx
const [items, setItems] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

const fetch = useCallback(async () => {
  setLoading(true); setError(null);
  try { setItems(await api.get('/<resource>')); }
  catch (e) { setError(e); }
  finally { setLoading(false); }
}, []);

useEffect(() => { fetch(); }, [fetch]);

const create = async (data) => { await api.post('/<resource>', data); await fetch(); };
const update = async (id, data) => { await api.put(`/<resource>/${id}`, data); await fetch(); };
const remove = async (id) => { await api.del(`/<resource>/${id}`); await fetch(); };

return (
  <Ctx.Provider value={{ items, loading, error, fetch, create, update, remove }}>
    {children}
  </Ctx.Provider>
);
```

After this, **delete every `*Data.js` file** under `src/modules/settings/*/`. They're no longer used.

Per-context endpoint mapping:
| Context | Endpoint |
|---|---|
| UserContext | `/users`, `/roles`, `/groups` (admin lists) — the current authenticated user is a separate slice, see § 3.1 |
| ProviderContext | `/providers` |
| CatalogContext | `/catalogs` |
| NetworkContext | `/networks` |
| DatastoreContext | `/datastores` |
| TierContext | `/tiers` |
| EnvironmentContext | `/environments` |

Note: the existing `UserContext` already holds `users`, `roles`, **and** `groups` (three lists, three setters) — fetch all three on mount (`/users`, `/roles`, `/groups`). It does **not** hold the authenticated current user today; that lives in the new auth slice from § 3.1. Consider exposing `useCurrentUser()` (auth slice) and `useUsers()` / `useRoles()` / `useGroups()` (admin lists) as distinct hooks for clarity.

---

## 6. `src/pages/VmRequest.jsx` — hard required fixes

### 6.1 Delete the hardcoded `getTierDetails()`
Currently the file defines:
```js
const getTierDetails = (t) => {
  switch(t) {
    case 'bronze': return { cpu: 1, ram: 1, disk: 50 };
    case 'silver': return { cpu: 2, ram: 4, disk: 100 };
    case 'gold':   return { cpu: 3, ram: 8, disk: 200 };
    ...
```
These values are **wrong** and contradict both the architecture spec and the project's own `tierData.js`. Delete this function entirely.

### 6.2 Source tiers from context
Replace its usage with:
```jsx
const { items: tiers } = useTierContext();
const selectedTier = tiers.find(t => t.id === tierId);
// selectedTier.cpu, selectedTier.ramMb / 1024, selectedTier.diskGb
```
The wizard must **display GB but submit ID only**. The request body sends `tierId`; the backend resolves to CPU/RAM/disk at provisioning time (ADR-05).

### 6.3 Step-1 filtering via the policy endpoint
On environment selection, call `GET /api/environments/{envId}/allowed-resources` and store the returned id arrays in local state. Step 2 dropdowns must filter their context items by membership in those arrays **and** by `status === 'Active'`.

### 6.4 Submit
Step 3 submit → `POST /api/provision-requests` with body `{ vmName, environmentId, providerId, providerNodeId, catalogId, tierId, networkId, datastoreId, securityHardening, bootDiskGb, requestedExpiry, description }`. (Axios's `decamelizeKeys` interceptor converts to snake_case.)

### 6.5 Add the boot-disk size field and Security Hardening checkbox
Step 2 needs two inputs the current form lacks:
- **Boot disk size (GB):** optional integer, floored at the selected tier/template disk size; the backend grows the filesystem on first boot via cloud-init/cloudbase-init. (This is the boot/root(C:) disk only — adding *separate* data disks happens in Inventory → Edit Resources, never here.)
- **Security Hardening:** checkbox (the control exists in the current UI — wire its value into the submit body as `securityHardening`).
The entered VM name doubles as the guest hostname; no separate hostname field is needed.

### 6.6 Pre-fill from `?catalog_id=…`
If the Catalog page launched the wizard with `?catalog_id=N`, pre-select that catalog after Step 1 in Step 2.

---

## 7. `src/pages/Inventory.jsx` — lifecycle action fixes

### 7.1 Edit Resources modal
A single modal with two approval-gated sections that behave differently after approval.

**CPU / RAM (auto-applied):**
- At least one of CPU change / RAM change is present.
- The VM-name confirmation field must equal the row's `vmName` **exactly**, case-sensitive. Use the shared `ConfirmModal` with the `typedConfirmation` prop.
- Submit → `POST /api/inventory/{id}/resize` with body `{ cpu?, ramMb?, vmNameConfirmation }`. On approval the backend reconfigures automatically — no admin step.

**Add Data Disk (manual fulfilment, environment-gated):**
- Render this section **only when the VM's `environment.allowDataDisk` is true**; otherwise hide it.
- Existing disks are listed **disabled** (no shrink/edit). New disk takes a positive integer GB plus a free-text setup-intent box with placeholder guidance: *Linux — mount `/data`, fs `ext4`/`xfs`, optional LVM; Windows — drive `D:`, `GPT`/`MBR`, `NTFS`*.
- VM-name typed confirmation required.
- Submit → `POST /api/inventory/{id}/add-disk` with body `{ sizeGb, setupDescription, vmNameConfirmation }`. On approval Terraform attaches a raw disk; the disk then shows **Pending Setup** until an admin completes it.

### 7.1a Admin: complete a data-disk setup
For Administrators, surface a **Mark Ready** action on any inventory disk whose `setupStatus === 'Pending Setup'` → `POST /api/inventory/{id}/disks/{diskId}/complete`. Show each disk's `setupStatus` as a small badge in the row's expanded detail; the VM lifecycle status stays `Active` throughout.

### 7.2 Delete confirmation
Same typed-confirmation pattern. Submit → `POST /api/inventory/{id}/delete`. The row stays in the table (lifecycle status flips to `Deleted` after approval and destroy complete).

### 7.3 Renew / Make Permanent
Open the Renew modal; "Request Permanent" toggle disables the duration input. Submit → `POST /api/inventory/{id}/renew` or `/permanent`.

### 7.4 Retry / Provider Sync
Surface only when lifecycle status is `Failed` (Retry) or `Active` (Provider Sync). Endpoints: `POST /api/inventory/{id}/retry`, `POST /api/inventory/{id}/sync`.

### 7.5 Table layout: dual-status column + resources in the expandable row
Two changes to the inventory table:
- **Remove the "Resources" column.** Do not render the `4C / 8G / 100G` array in a main-table cell. Move the breakdown into the **expandable row** (accordion), under the existing Node / Datastore / Network block: show vCPU as **sockets × cores**, RAM capacity, and a **per-disk list** (bus/index + size). These are allocated sizes (snapshot from `vcpu`, `ram_mb`, `disk_allocated_gb`, `disks[]`).
- **Add a dual "Status" column** in its place: render the portal **lifecycle status** (`Active`/`Provisioning`/`Expired`/`Failed`/`Deleted`) next to the provider-synced **observed power** (`running`/`stopped`/`unknown`). When `observedPowerState === 'unknown'`, badge it "Provider Unreachable" and show `lastSyncAt`.
- Update the status filter to lifecycle values (`All / Active / Provisioning / Failed / Expired / Deleted`).
- **Live utilization stays out of this table** — `cpuUtilization`/`ramUsageMb` and node/datastore capacity belong to the Admin/Provider dashboard, not the user inventory.

---

## 7.5 Settings — Environment form: add the `allowDataDisk` policy field

`EnvironmentForm.jsx` must gain one checkbox, **Allow data disks** (`allowDataDisk`, default off), alongside `approvalRequired`. It's part of the environment policy: when off, the Inventory → Edit Resources "Add Data Disk" section (§7.1) is hidden for VMs in that environment. Include it in the create/edit submit body; the API accepts `allow_data_disk` (`07-api-contract.md` § Environments).

---

## 8. `src/modules/settings/provider/ProviderForm.jsx` — credential & field-mapping fixes

**What's already there (do NOT re-add):** the form already contains all six credential inputs — `discoveryUsername`, `discoveryTokenId`, `discoverySecret`, `provisionUsername`, `provisionTokenId`, `provisionSecret` — plus an `autoDiscovery` checkbox, a `discoveryInterval` select, and a working **Test Connection** button (`handleTestConnection` + a `Connected` status pill). The fixes below are corrections to the existing fields, not additions of missing ones.

### 8.1 Fix the conflated secret/credential bindings (real bug)
Today both credential pairs read from the **same** mock fields:
- `discoverySecret` and `provisionSecret` both use `defaultValue={data?.secret || ''}`
- `provisionTokenId` uses `defaultValue={data?.tokenId || ''}`, `provisionUsername` uses `defaultValue={data?.username || ''}`

This means (a) the two credential pairs are not actually distinct in the data model, and (b) on edit the secrets pre-fill into the inputs, which violates the write-only rule. Fix:
- Give each input its own distinct source field (`data.discoveryUsername`, `data.discoveryTokenId`, `data.provisionUsername`, `data.provisionTokenId`, etc.).
- On **edit**, render all `*Secret` (and ideally `*TokenId`) inputs **empty** with placeholder `Leave blank to keep current`. Never pre-fill a secret from server data — `GET /api/providers/{id}` won't return secrets anyway.

### 8.2 Fix the `name=` attributes so they map to the API contract
Several `name=` attributes don't decamelize to the API field names. Correct them:

| Current `name=` | Decamelizes to | API expects | Action |
|---|---|---|---|
| `name` | `name` | `provider_name` | rename input to `providerName` |
| `discoverySecret` | `discovery_secret` | `discovery_token_secret` | rename to `discoveryTokenSecret` |
| `provisionSecret` | `provision_secret` | `provision_token_secret` | rename to `provisionTokenSecret` |
| `autoDiscovery` | `auto_discovery` | `auto_discovery_enabled` | rename to `autoDiscoveryEnabled` |
| (verify) provider type | — | `provider_type` | ensure a `providerType` select exists |
| (verify) endpoint | — | `endpoint` | confirm present |

`discoveryUsername`, `discoveryTokenId`, `provisionUsername`, `provisionTokenId`, `discoveryInterval`, `description` already map cleanly via the axios `decamelizeKeys` interceptor.

### 8.3 Edit-mode secret omission on submit
The submit handler must **omit** any empty secret/token field from the request body (don't send empty strings). The server's PUT handler only updates secrets when a value is present (per `07-api-contract.md` § 2). Empty string would overwrite a stored secret with blank — guard against it.

### 8.4 Add the two genuinely-missing fields: `terraformProviderSource` / `terraformProviderVersion`
The form has Basic Info, both credential groups, and Discovery Config — but **no Terraform provider source/version inputs**, which the API requires (`terraform_provider_source`, `terraform_provider_version`) and the backend uses to render `provider.tf`. Add a small "Terraform Provider" section with two text inputs. Defaults for Proxmox: source `Telmate/proxmox`, version `3.0.2-rc04`. Mark required.

### 8.5 Wire the existing Test Connection button + add Run Discovery Now
- **Test Connection** (button already present) — replace its mock `handleTestConnection` with a real `POST /api/providers/{id}/test-connection`. Keep the existing `Connected` pill; add a `Disconnected` state and optional version string.
- **Run Discovery Now** — this action is **not** in the form today. Add it (in the form footer, or — better — as a row action in `ProviderManagement.jsx` and inside the `ProviderDiscovery.jsx` drawer): `POST /api/providers/{id}/discover`, then show the returned counts (nodes/templates/networks/datastores/**vms**) and refresh the discovery drawer. Add a **VMs** tab to the drawer (discovered `externalVmid`, name, node, power state, IP, `Active`/`Missing`); the VM runtime facts shown in Inventory are synced from these `provider_vms` rows by `external_vmid`, so the drawer and Inventory stay consistent. (Optional: a drift view from `GET /api/providers/{id}/drift`.)

---

## 9. `src/vite.config.js` — remove `apiSimulationPlugin`

Strip the entire `apiSimulationPlugin` function and its registration in `plugins`. The mock provisioning that wrote Terraform workspaces from the dev server is now done by the backend `ProvisionVmJob`. Replace `defineConfig` with:

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8000',
        changeOrigin: true,
      }
    }
  }
});
```

After this, no Vite-side filesystem access to `../.env`, `../<username>/`, or `../backend/storage/...` remains. **This is critical** — the existing plugin reads `../.env` and writes files outside the frontend, which is a security and portability liability.

---

## 10. Settings — Audit page

`AuditManagement.jsx` currently has inline mock data. Replace with:
- `useEffect` → `GET /api/audit-logs` with active filters as query params.
- Filters: `actionType` select, `userId` (Admin) or auto-scoped (Manager), `dateStart` / `dateEnd`, free-text `search`.
- "Download CSV" → `GET /api/audit-logs/export` (server respects filters). Trigger download via a hidden anchor or `window.location.assign(url)`.
- No create/update/delete UI — the audit log is immutable.

---

## 11. Settings — User / Role / Group splits

`userData.js` already seeds `initialUsers`, `initialRoles`, **and** `initialGroups`, and `UserContext` exposes all three. **Verify** whether the repo already has `RoleManagement.jsx` / `GroupManagement.jsx` UIs (only `UserManagement.jsx` is confirmed imported in `Settings.jsx`). If they're missing, add them. Either way, surface all three as Settings tabs (or tabs-within-the-User-tab):
- User: blocked (409) if user is `groups.manager_user_id` somewhere.
- Role: blocked (409) if any user has that `role_id`.
- Group: blocked (409) if any user has that `group_id`.

Render the 409 message inline using the API's `error.message`.

---

## 12. Field-mapping cleanup (one pass across the codebase)

Apply the field-name conventions in `Frontend-new-Design.md` — the per-module field names in § 9 (settings module pattern) plus the humps camelCase↔snake_case conversion at the axios layer in § 7. Concretely:

- `tierData.js` (about to be deleted): the in-memory tier ram is in GB; the API returns `ram_mb`. After axios `camelizeKeys`, components see `ramMb`. Display as `ramMb / 1024` GB; the Tier form input is GB and multiplies by 1024 before submit. **No `* 1024` math should live anywhere except the Tier form's `onSubmit`.**
- `userData.js` (about to be deleted): role lookups change from `name` to `roleName`.
- All settings modules reading `*.name` need to switch to the API field (`providerName`, `catalogName`, `networkName`, etc.) — the camelized form of the snake_case API field. Keep a single grep pass: `git grep -E "\.name\b" src/modules/settings/` and convert each match.

---

## 13. Naming normalization (small, low-risk)

Rename `DatastoreExplorer.jsx` → `DatastoreDiscovery.jsx` (and its import in `DatastoreManagement.jsx`). This aligns with `ProviderDiscovery.jsx`; the rest of the docs refer uniformly to "Discovery Explorer." Single rename + single import update.

(Optional, lower priority): rename `ProviderDiscovery.jsx` → `ProviderExplorer.jsx` instead, if you prefer the Explorer name. Either way, **pick one** and apply it.

---

## 14. Non-blocking improvements (apply if time permits)

These will not break integration but materially help long-term quality.

1. **Promote `ResizableTh` widths** out of `localStorage` into `uiStore` so they survive a logout/login cycle.
2. **Form validation with zod** instead of HTML5 `required` only. Better error messages, better matching to API validation.
3. **`AbortController`** per fetch in every context; cancel on unmount to stop React 18 StrictMode double-fetch warnings.
4. **Loading skeletons** in lists (not just a spinner). Each settings page list, the Catalog grid, and the Inventory table benefit.
5. **`pages/NotFound.jsx`** + catch-all route as shown in § 3.3.
6. **Settings tab persistence** via `?tab=…` URL (already partially done in `Settings.jsx` — confirm every module supports it).
7. **i18n scaffolding** — wrap user-visible strings in a `t()` helper from `src/lib/i18n.js`. Even if v1 ships English-only, this prevents a painful retrofit.
8. **Bundle analyzer** (`vite-plugin-visualizer`) once during pre-release to spot any accidental large imports.
9. **`vitest` setup** with one smoke test per page rendering against `msw` mocks. Even minimal coverage catches regressions.
10. **`README.md` for the frontend** documenting: how to run, the `VITE_API_BASE_URL` requirement, the role-string contract, the test commands.

---

## 15. Acceptance checklist (what "done" means)

The agent should self-check all of these before opening a PR:

- [ ] `npm run build` succeeds with no warnings about CDN Tailwind or `apiSimulationPlugin`.
- [ ] `grep -rn "MOCK_USER" src/` returns nothing.
- [ ] `grep -rn "'Admin'" src/` returns nothing (only `'Administrator'`).
- [ ] `grep -rn "Data.js" src/modules/` returns nothing (mocks all removed).
- [ ] `grep -rn "getTierDetails" src/` returns nothing.
- [ ] `grep -rn "apiSimulationPlugin" .` returns nothing.
- [ ] Visiting `/approvals` as a User redirects to `/catalog` with a toast.
- [ ] Visiting `/settings` as a Manager redirects to `/catalog` with a toast.
- [ ] Visiting any protected route with no token redirects to `/login`.
- [ ] Logging in restores the requested route (`?next=…` round-trip).
- [ ] The Provider form has all six credential inputs (3 discovery + 3 provisioning) with each bound to its own field (no shared `data.secret`), plus `terraformProviderSource` / `terraformProviderVersion`.
- [ ] `grep -rn 'name="discoverySecret"\|name="provisionSecret"\|name="autoDiscovery"' src/` returns nothing (renamed to map to the API contract).
- [ ] Editing a Provider shows blank secret fields and submitting without filling them does not change the stored secrets (verified by re-testing connection).
- [ ] The wizard's tier dropdown shows `Bronze · 2 vCPU · 4 GB RAM · 40 GB Disk` (and Silver 4/8/80, Gold 8/16/160, Platinum 16/32/320), sourced from `/api/tiers`.
- [ ] The wizard has a boot-disk size input (≥ tier/template size) and a Security Hardening checkbox; both are sent in the provision-request body.
- [ ] Edit Resources resize covers CPU/RAM only and submits to `/resize`; no `addDisks` in the resize body.
- [ ] Add Data Disk appears only when the VM's environment has `allowDataDisk`, submits to `/add-disk`, and disables existing disks.
- [ ] An Administrator can Mark Ready a `Pending Setup` data disk (`/disks/{id}/complete`); the VM lifecycle stays `Active`.
- [ ] Inventory table has no Resources column; vCPU (sockets×cores), RAM, and per-disk sizes appear in the expandable row; the Status column shows lifecycle + observed power.
- [ ] The Environment form has an `allowDataDisk` checkbox.
- [ ] Inventory Delete, resize, and add-disk all require VM-name-exact confirmation.
- [ ] Audit page shows real data with CSV export, RBAC-scoped.
- [ ] Dark-mode toggle persists across reload and applies to every page.
- [ ] No credential string is ever present in any DOM node after a save (DevTools search for the value typed in).

---

## 16. Suggested PR sequence

Break the work into small reviewable PRs in this order. Each PR should land green before the next is opened.

1. **infra:** `.env.example`, Tailwind build dep, dev proxy, remove `apiSimulationPlugin`.
2. **lib:** `api.js`, `auth.js`, `rbac.js`, `uiStore`. No UI changes yet.
3. **auth:** `Login.jsx`, `RequireAuth`, `RequireRole`, role-string fix in `App.jsx`, route wiring.
4. **contexts:** API-backed fetches; delete `*Data.js`.
5. **provider form:** add provision credential pair fields + terraform_provider_* + Test Connection / Run Discovery Now.
6. **wizard:** delete `getTierDetails`, source from context, environment-policy filtering, real submit.
7. **inventory:** Edit Resources / Delete / Renew / Permanent / Retry / Sync wired to API.
8. **approvals:** queue, widgets, Approve / Reject / Revert with reasons.
9. **audit:** API-backed list + CSV export.
10. **polish:** confirm modal promotion, naming normalization, NotFound, acceptance checklist green.
