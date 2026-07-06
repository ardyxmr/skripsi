# Deployment Workflow
## Proxmox Self-Service VM Provisioning Portal

Two senses of "deployment" matter here:
- **A. Application deployment** — how to stand up the portal (backend, frontend, queue, Terraform).
- **B. Provisioning workflow** — how a single VM request flows from submission to a running VM via Terraform.

Both are specified below.

---

## Part A — Application deployment

### A.1 Components

| Component | Role |
|---|---|
| Backend API (Laravel) | HTTP API, services, scheduler |
| Queue worker | Runs `ProvisionVmJob` and lifecycle jobs |
| Scheduler (cron) | Auto-discovery + expiry/lifecycle engine |
| Frontend (React/Vite build) | Static SPA served by web server/CDN |
| Database | PostgreSQL |
| Terraform CLI | Invoked by the queue worker per workspace |
| Ansible | Invoked by the queue worker for post-provision hardening |
| Object/file storage | `storage/app/...` for workspaces, catalog images, terraform templates |
| Proxmox VE | Target hypervisor (reachable from the worker host) |

### A.2 Prerequisites on the worker host
- Terraform CLI installed and on `PATH`.
- The required Terraform provider downloadable (e.g. `Telmate/proxmox` at the version stored on each provider).
- **Ansible installed and on `PATH`** (`ansible-playbook`) for the hardening lifecycle action (Stage 8 / ADR-14 amendment). Hardening playbooks are uploaded **per catalog** by an admin (private disk `storage/app/private/catalog-hardening/{id}/`), not shipped in the repo. **Generate an automation SSH keypair** (`storage/app/ansible/automation_key`, chmod 600) whose **public key** is set in `ANSIBLE_PUBLIC_KEY_PATH`/config — it's injected into every NEW VM via cloud-init so Ansible connects key-based (works regardless of template `ssh_pwauth`). Existing VMs provisioned before this lack the key.
- **OS templates prepared for self-service:** cloud-init (Linux) / cloudbase-init (Windows) installed (hostname + boot-disk growth on first boot); **virtio-scsi** controller with **disk hotplug enabled** (so data disks attach without reboot); **virtio drivers** installed in Windows templates. **→ Full step-by-step + gotchas: [`docs/template-preparation.md`](docs/template-preparation.md)** (CPU `host` for EL9, qemu-guest-agent, thin storage, lvm2-in-initramfs, cloud-init networking, verify-by-clone).
- Network reachability + TLS trust to each Proxmox endpoint (e.g. `https://<host>:8006`).
- Write access to `storage/app/provisioning/` and `storage/app/master-provisioning/terraform/`.

### A.3 Environment configuration
- `VITE_API_BASE_URL` (frontend) → backend API base. Prefer a **relative `/api`** so the SPA is same-origin with the API (cookies/CSRF "just work"); in dev the Vite proxy forwards `/api`, `/sanctum`, `/storage`, and `/app` (Reverb WS) to the backend, and in prod nginx serves them on one domain. `VITE_IDLE_TIMEOUT_MIN` / `VITE_IDLE_WARN_MIN` configure the idle auto-logout (default 60 / 5).
- Backend `.env`: DB connection, app key (used by `CredentialCipher` to encrypt provider secrets), queue driver. **Cookie-based SPA auth (ADR-24):** `SESSION_DRIVER=redis`, `SESSION_CONNECTION=session` (the `noeviction` Redis instance, dedicated DB — never the LRU cache), `SESSION_LIFETIME=60` (idle backstop), `SESSION_EXPIRE_ON_CLOSE=true`, `SESSION_SECURE_COOKIE=true` (prod/HTTPS), `SESSION_DOMAIN=<your-domain>`, and `SANCTUM_STATEFUL_DOMAINS=<spa-origin>`. CORS `supports_credentials=true` with an exact origin allow-list (or rely on same-origin via nginx). Full topology + Redis-instance details: `docs/deployment-realtime-topology.md`.
- **Important:** the legacy Vite `apiSimulationPlugin` that read a root `.env` for `PROXMOX_*` and generated workspaces in dev is **removed** for production. Provider credentials now live encrypted in the `providers` table; the real `ProvisionVmJob` generates workspaces. No Proxmox credentials belong in any `.env` in production.

### A.4 First-time bring-up sequence
1. Run DB migrations.
2. Run the **bootstrap seeder**: System Administrators group (manager null) → roles (Administrator/Manager/User) → admin user → set group manager. Seed default tiers (Bronze/Silver/Gold, authoritative values).
3. Place Terraform templates `main.tf.stub` / `variables.tf.stub` in `storage/app/master-provisioning/terraform/`.
4. Build and deploy the frontend; deploy the backend API.
5. Start the queue worker and the scheduler.
6. Admin logs in and configures the first provider (both credential pairs) → Test Connection → Run Discovery Now.
7. Admin publishes nodes, catalog, networks, datastores, defines tiers/environments.
8. Smoke test (Part B end-to-end).

### A.5 Ongoing operations
- **Service control (dev/non-systemd hosts)** — three scripts under `scripts/`, split by restart cadence:
  - `postgres.sh {start|stop|restart|status}` — Postgres only. It's a systemd-**enabled** service (auto-starts on boot), so you rarely touch this.
  - `redis.sh {start|stop|restart|status}` — both Redis instances (:6379 cache, systemd/auto-start; :6380 queue+sessions+Reverb pub/sub, a user daemon — the one you usually `start` after a reboot).
  - `backend.sh {start|stop|restart|status|logs}` — the app daemons (serve + 2 queue workers + Reverb + scheduler), restarted often (after `.env`/job/route edits). It tracks PIDs, kills detached `serve`/`reverb` children by port on stop, runs `config:clear` on start, and warns on stale queued jobs.
  - Frontend `npm run dev` is run separately. Prod uses the systemd units in `deploy/systemd/` instead.
- **Auto-discovery** runs per provider on its interval; "Run Discovery Now" forces a sync.
- **Lifecycle engine** runs on schedule: expiry warnings → Expired → grace → auto-destroy.
- **Backups:** database + `storage/app/provisioning/` (workspaces/state) + `storage/app/catalog-images/`. Terraform state lives only on disk, so workspace backup is essential for destroy/recovery.
- **Worker hygiene:** the `database` queue persists jobs across sessions. **Before starting `queue:work` on a host, check `DB::table('jobs')->count()` / `php artisan queue:clear database`** — an old worker will otherwise drain stale `ProvisionVmJob`s and spin up unintended VMs.

### A.6 Upgrading the Terraform provider (ADR-18)
The provider version is configuration (per-provider, in the DB), and existing VMs are **frozen** to the version in their own workspace (`provider.tf` + `.terraform.lock.hcl`); `TerraformRunner` uses plain `terraform init` (never `-upgrade`), so a bump only affects **new** provisions. To upgrade safely:
1. **Gate the candidate offline:** `backend/scripts/check-provider-compat.sh <version>` — validates the master stub against the new provider in a throwaway workspace (catches schema breaks, e.g. the legacy `disk` list block being removed). Must exit `PASS` before proceeding.
2. **Smoke-test one VM:** on a throwaway environment, bump that provider's version, then provision → add-disk → resize → destroy one VM and confirm a clean re-plan.
3. **Roll forward:** only then set the real `terraform_provider_version`. New VMs use it; running VMs are untouched.
4. **Never** introduce `init -upgrade` into `TerraformRunner` (it would un-freeze existing workspaces). A schema change instead gets a **new stub variant selected by version** in `WorkspaceService` (ADR-18 §4). A *forced* migration of existing VMs is done **one workspace at a time** (snapshot → `plan`, never auto-apply → `moved {}`/`state mv`/`import`).

---

## Part B — Provisioning workflow (per request)

### B.1 Submission & governance
```
User completes wizard (Environment → Configuration → Review)
        │
        ▼
POST /api/provision-requests   (stores IDs only, validated vs environment policy)
        │
        ▼
environment.approval_required ?
   ├── false ──────────────► Terraform Queue (enqueue ProvisionVmJob)
   └── true  ──► approval_requests(PROVISION, Pending)
                     │  approver = user → group → group manager
                     ▼
                Manager acts (reason required)
                   ├── Approve ─► Terraform Queue
                   ├── Reject  ─► closed, no VM
                   └── Revert  ─► Need Modification ─► user edits ─► resubmit ─► Pending
```

### B.2 Terraform execution (`ProvisionVmJob`)
A request with `instance_count = N` **fans out to N `ProvisionVmJob`s** (one per VM, parallel on the queue); each job below provisions **one** VM into its **own** workspace/state and creates **one** inventory row (ADR-08, per-VM). Batch VM names are suffixed `-01..-0N`.
```
1. Create workspace:  storage/app/provisioning/{username}/date_pr{DDMMYYYY_His}/{vm_name}/
2. Resolve resources (IDs → provider values):
      node_id (published) → provider_node_id → target_node   # ADR-17
      catalog_id       → template
      network_id       → network (bridge)
      datastore_id     → storage
      tier_id          → cpu, memory(MB), disk_size(GB)  # boot disk floor; request boot_disk_gb may raise it
3. Load provider config (uses PROVISIONING credential)
4. Render provider.tf  (from terraform_provider_source + version)
5. Render terraform.tfvars  (resolved values; e.g. vm_name, cpu, memory, disk list,
                              target_node, network, storage, template, cloud-init params)
                              # vm_name → provider VM name AND cloud-init hostname
                              # cloud-init/cloudbase-init sets hostname + grows boot disk on first boot
6. Copy main.tf / variables.tf from master-provisioning stubs
7. Write deployment.json (request metadata)
8. terraform init → validate → plan → apply
```
Terraform receives **only resolved values** — never any `*_id`.

### B.3 Outcomes
```
apply success
   ├─► Inventory record created (lifecycle status Active; stores workspace_path + terraform_state_path; captures external_vmid)
   ├─► Scoped VM discovery (discovery layer → provider_vms), then VmFactSyncService maps observed power/IP/
   │     allocation/utilization into inventory by external_vmid, retry until guest-agent IP available  (no direct provider call here)
   ├─► if security_hardening: render playbook + inventory into the SAME workspace →
   │     run Ansible against the discovered IP → set hardening_status (Success/Failed) → audit HARDEN_VM
   │     (hardening failure leaves the VM lifecycle Active, flagged; it does NOT destroy the VM)
   └─► audit CREATE_VM

apply failure
   ├─► Deployment status Failed; error message captured
   ├─► Workspace RETAINED (provider.tf, main.tf, variables.tf, terraform.tfvars,
   │     terraform.tfstate(.backup), deployment.json, logs)
   └─► Retry available (reuses SAME workspace + state; no new workspace, no new request)
```

### B.4 Lifecycle actions (post-provision)
```
Renew      → approval(RENEWAL)   → on approve: extend expiry_date
Permanent  → approval(PERMANENT) → on approve: is_permanent=true, expiry_date=null
Resize     → approval(RESIZE)    → on approve: terraform reconfigure CPU/RAM in existing workspace
              (CPU/RAM only; auto-applied, no admin step; VM-name confirmation required)
Add disk   → approval(ADD_DISK)  → on approve: terraform attaches RAW disk → status Pending Disk Setup
              → admin formats/mounts in-guest (hotplug rescan; reboot only as fallback) → mark Ready
              (only if environment.allow_data_disk; existing disks never shrunk; VM-name confirmation required;
               full automation via guest-agent exec / Ansible = future work)
Delete     → approval/queue → terraform destroy (uses workspace state) → status Deleted (row + workspace retained)
Re-harden  → re-run Ansible playbook in existing workspace (only when hardening_status == Failed); no Terraform re-run
Provider Sync → scoped VM discovery (provider_vms) → sync IP/status into inventory by external_vmid
Expiry     → warning → Expired → grace_period_until → auto destroy → Deleted
```

### B.5 Workspace contents (reference)
```
storage/app/provisioning/user01/date_pr19062026_154501/
├── provider.tf            # generated from provider source/version
├── main.tf                # copied from stub
├── variables.tf           # copied from stub
├── terraform.tfvars       # generated from resolved values
├── terraform.tfstate      # state (NEVER in DB)
├── terraform.tfstate.backup
├── deployment.json        # local metadata (DB remains source of truth)
├── hardening.yml          # Ansible playbook (only when security_hardening is on)
├── ansible-inventory.ini  # generated; targets the discovered IP
├── ansible-hardening.log  # hardening run log (retained)
└── terraform / apply logs
```

---

## Part C — Release & rollback notes

- **Schema migrations** are forward-only in normal operation; pair each with a tested down-migration for rollback in staging.
- **Frontend** is a static build; rollback = redeploy the previous build artifact.
- **Workspaces are immutable history** — never delete on failure or destroy; they are the recovery and audit substrate.
- **Credential rotation:** update a provider's discovery/provisioning credentials via `PUT /api/providers/{id}` (secrets re-encrypted on write); re-run Test Connection. Existing workspaces are unaffected; new deployments use the new provisioning credential.
- **Adding a provider type** (OpenStack/OLVM/etc.): add a Provider Driver + endpoint config (+ Terraform provider source/version). No changes to catalog, network, datastore, environment, tier, approval, provisioning flow, or inventory.

---

## Part D — Pre-go-live checklist

- [ ] Migrations + bootstrap seeder run; admin can log in.
- [ ] Default tiers seeded with authoritative values; frontend mock reconciled.
- [ ] First provider configured; Test Connection = Connected; discovery populated all four `provider_*` tables.
- [ ] No credential field appears in any API response (verified against API contract §13).
- [ ] Catalog/network/datastore published; environment + tier policies defined.
- [ ] Published nodes created; wizard node list shows friendly names only (never raw `provider_nodes`).
- [ ] End-to-end: request (with approval) → approve → ProvisionVmJob → Active VM + discovered IP + observed power synced.
- [ ] Failure path: forced failure retains workspace and is retryable.
- [ ] Resize path: CPU/RAM only, auto-applied on approval, VM-name confirmation.
- [ ] Add-disk path: env allow_data_disk gated, Terraform attaches raw, admin format/mount → Ready, VM-name confirmation.
- [ ] Delete path: terraform destroy, status Deleted, workspace retained.
- [ ] Audit rows present for every mutating action; CSV export respects filters + visibility.
- [ ] Queue worker + scheduler running; lifecycle/expiry engine verified.

**Auth & security hardening (ADR-24 + security review):**
- [ ] Auth is cookie-based: login sets an HttpOnly session cookie, **no token in browser storage**; `/api/*` + `/api/broadcasting/auth` authenticate from the cookie; CSRF enforced on writes.
- [ ] Sessions on the **`noeviction`** Redis instance (dedicated DB), not the `allkeys-lru` cache.
- [ ] `SANCTUM_STATEFUL_DOMAINS` = the real SPA origin; CORS `supports_credentials=true` with an exact origin (no `*`); `SESSION_SECURE_COOKIE=true`, `SESSION_DOMAIN` set.
- [ ] Login throttle returns `429` after repeated failures; `LOGIN_FAILED`/`LOGIN_THROTTLED` audited. Idle auto-logout fires (warn 55 / out 60 min).
- [ ] `vm_name` rejects non-DNS-label input (path-traversal / `${}` blocked) at the API.
- [ ] **`APP_ENV=production`, `APP_DEBUG=false`** (no stack-trace/secret leakage).
- [ ] Reverb `allowed_origins` locked to the SPA origin (not `['*']`).
- [ ] Proxmox TLS: pin/verify the CA in prod (avoid `pm_tls_insecure` if possible) — document the trust boundary if self-signed.
- [ ] Per-VM credentials: not the shared default (`ChangeMe123!`); seeded dev creds (DB / sudo / `Password123!`) rotated.
- [ ] Redis `requirepass` set (defense-in-depth even when localhost-bound); `npm audit` + `composer audit` clean.
- [ ] nginx: HTTPS-only + HSTS + `X-Content-Type-Options` + a CSP; general API rate limit.

### Post-Stage-7 ops notes (live)
- **Run set:** `php artisan serve` + `php artisan queue:work --timeout=600 --tries=1` + `php artisan schedule:work`. The worker MUST use `--timeout=600` (a ~80s Terraform apply exceeds the default 60s). Before starting a worker, check `DB::table('jobs')->count()` — stale jobs auto-drain into real VMs.
- **Scheduler (routes/console.php):** `vms:lifecycle` (1m — expiry/grace), `discovery:refresh` (30s — per-provider auto-discovery, ADR-19), `discovery:prune` (hourly — deletes resources Missing > 24h). `schedule:work` must run for auto-discovery to fire; without it the DB snapshot goes stale.
- **Edit Resources (ADR-20):** the unified `EDIT_RESOURCES` request runs one `EditResourcesVmJob` = one Terraform apply (CPU/RAM + disk hotplug). Restart `queue:work` after editing job/service/config code (the worker caches at startup).
- [ ] Auto-discovery: a provider with `auto_discovery_enabled` shows a real "Next Discovery" time and refreshes on its interval; stale Missing rows prune after 24h.
- [ ] Edit Resources bundle: CPU/RAM + add-disk in one modal → one approval → one apply (live hotplug, no reboot).