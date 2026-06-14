# InfraProv — Real-time topology deployment & redeploy runbook

How to stand up (or redeploy to a fresh server) the full production topology: Postgres + **two Redis
instances** + Laravel (PHP-FPM) + **Reverb** WebSockets + queue workers + scheduler, behind Nginx/TLS.

All config artifacts referenced here live in [`deploy/`](../deploy). Replace `infraprov.example.com`
and the `/home/appd/my-project` path with your domain / install path throughout.

```
                          ┌── Nginx (:443 TLS) ──────────────────────────┐
   browser  ──wss/https──▶│  /            → SPA  (frontend/dist, static)  │
                          │  /api,/storage→ Laravel (PHP-FPM, backend)    │
                          │  /app/        → Reverb (:8080)  ws proxy      │
                          └───────┬───────────────┬──────────────────────┘
                                  │               │
                    Redis :6379 (cache, LRU)      │ broadcast API (127.0.0.1:8080, internal)
                    Redis :6380 (queue+pubsub,    ▼
                       noeviction + AOF) ◀── workers / reverb / scheduler ──▶ Postgres
```

---

## 1. Prerequisites (packages)

```bash
sudo apt-get update
sudo apt-get install -y \
  postgresql redis-server \
  php8.3 php8.3-fpm php8.3-cli php8.3-pgsql php8.3-redis php8.3-gd \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath \
  nginx certbot python3-certbot-nginx git unzip
# Composer + Node 20 + Terraform per their own installers (unchanged from dev).
```

> The two app-specific PHP extensions this project added over a base install: **`php8.3-redis`**
> (cache + queue + Reverb scaling) and **`php8.3-gd`** (catalog image resize).

## 2. Kernel tuning (Redis + WebSockets)

```bash
sudo cp deploy/sysctl/99-infraprov.conf /etc/sysctl.d/ && sudo sysctl --system
sudo cp deploy/systemd/disable-thp.service /etc/systemd/system/
sudo systemctl enable --now disable-thp
```

Raise file-descriptor limits (every WS connection + Redis client is an fd). The systemd units already
set `LimitNOFILE`; for any manually-run process also add to `/etc/security/limits.conf`:

```
appd  soft  nofile  100000
appd  hard  nofile  100000
```

## 3. Redis — two instances

**Cache instance (:6379)** is the stock apt service; just set its policy and persist it:

```bash
redis-cli -p 6379 CONFIG SET maxmemory 256mb
redis-cli -p 6379 CONFIG SET maxmemory-policy allkeys-lru
redis-cli -p 6379 CONFIG REWRITE          # persists to /etc/redis/redis.conf
```

**Queue + pub/sub instance (:6380)** — `noeviction` + AOF, via systemd:

```bash
sudo cp deploy/redis/redis-queue.conf /etc/redis/redis-queue.conf
sudo mkdir -p /var/lib/redis-queue && sudo chown redis:redis /var/lib/redis-queue
sudo cp deploy/systemd/redis-queue.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now redis-queue
# verify
redis-cli -p 6380 ping                                   # PONG
redis-cli -p 6380 config get maxmemory-policy            # noeviction
redis-cli -p 6380 config get appendonly                  # yes
```

> **Why two instances, not two DBs:** the cache must evict (`allkeys-lru`); the queue must NOT
> (`noeviction`) or a dropped job = a lost provision. One instance can only have one policy.

## 4. Application

```bash
# Backend
cd /home/appd/my-project/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env   # then edit per §6
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan event:cache

# Frontend (built static SPA served by Nginx)
cd ../frontend
npm ci && npm run build         # → frontend/dist
```

## 5. systemd services (workers, Reverb, scheduler)

```bash
sudo cp deploy/systemd/infraprov-worker@.service   /etc/systemd/system/
sudo cp deploy/systemd/infraprov-reverb.service    /etc/systemd/system/
sudo cp deploy/systemd/infraprov-scheduler.service /etc/systemd/system/
sudo systemctl daemon-reload

# Workers: run 3 instances for parallel provisioning (processes jobs AND queued broadcasts).
sudo systemctl enable --now infraprov-worker@1 infraprov-worker@2 infraprov-worker@3
# Reverb (one per node; scaling shares state via Redis pub/sub).
sudo systemctl enable --now infraprov-reverb
# Scheduler — EXACTLY ONE instance fleet-wide.
sudo systemctl enable --now infraprov-scheduler
```

Check: `systemctl status infraprov-reverb`, `journalctl -u infraprov-worker@1 -f`.

## 6. `.env` — the topology-relevant keys

```ini
APP_URL=https://infraprov.example.com

CACHE_STORE=redis                 # cache → :6379 (config/cache.php 'cache' connection)
QUEUE_CONNECTION=redis            # queue → :6380
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# Dedicated queue + Reverb pub/sub instance (:6380)
REDIS_QUEUE_CONNECTION=queue
REDIS_QUEUE_HOST=127.0.0.1
REDIS_QUEUE_PORT=6380
REDIS_QUEUE_RETRY_AFTER=1800      # MUST exceed worker --timeout (600) + job runtime, or parallel re-dispatch

# Broadcasting
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=...  REVERB_APP_KEY=...  REVERB_APP_SECRET=...
REVERB_HOST=127.0.0.1  REVERB_PORT=8080  REVERB_SCHEME=http
REVERB_SCALING_ENABLED=true       # multi-node connection-state sharing via Redis pub/sub
REVERB_REDIS_HOST=127.0.0.1  REVERB_REDIS_PORT=6380
```

`frontend/.env` (baked into the build — clients connect through Nginx/TLS, not directly to :8080):

```ini
VITE_API_BASE_URL=https://infraprov.example.com/api
VITE_REVERB_APP_KEY=...           # = REVERB_APP_KEY
VITE_REVERB_HOST=infraprov.example.com
VITE_REVERB_PORT=443
VITE_REVERB_SCHEME=https
```

## 7. Nginx + TLS

```bash
sudo cp deploy/nginx/infraprov.conf /etc/nginx/sites-available/infraprov
sudo ln -s /etc/nginx/sites-available/infraprov /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d infraprov.example.com     # provisions + auto-renews TLS
```

The site serves the SPA, reverse-proxies `/api` to PHP-FPM, and upgrades `/app/` to Reverb (wss).
The broadcast API (`/apps/{id}/events`) is intentionally **not** exposed — workers reach Reverb on
`127.0.0.1:8080`.

## 8. Verify the live topology

```bash
redis-cli -p 6379 ping                                   # cache
redis-cli -p 6380 ping                                   # queue
redis-cli -p 6380 pubsub channels '*'                    # → "reverb" once Reverb is up (scaling wired)
systemctl is-active infraprov-reverb infraprov-scheduler infraprov-worker@1
# end-to-end broadcast: dispatch a state change and confirm the worker POSTs to Reverb (job DONE)
php artisan tinker --execute='broadcast(new App\Events\VmStateChanged(App\Models\Inventory::first(),"Active","Updating"));'
# then in two browser sessions: mutate a VM in one → the other updates with no poll.
```

## 9. Deploys (after the first install)

```bash
cd backend && git pull && composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan event:cache
php artisan queue:restart          # gracefully cycles the workers onto the new code (they cache it)
sudo systemctl restart infraprov-reverb infraprov-scheduler
cd ../frontend && npm ci && npm run build
```

> **Always run `php artisan queue:restart` on deploy** — workers cache code at boot; the `--max-time=3600`
> in the unit also recycles them hourly as a backstop.

## Redeploy-to-a-new-server checklist (condensed)

1. §1 packages → §2 kernel → §3 two Redis instances.
2. Postgres DB + user; set `.env` (§6); `key:generate`, `migrate --force`, `storage:link`.
3. `composer install`; build frontend (`npm ci && npm run build`).
4. Copy systemd units (§5), `daemon-reload`, `enable --now` workers/reverb/scheduler.
5. Nginx site + `certbot` (§7).
6. Run the §8 verification.

## Deferred (documented constraints — see `docs/realtime-push-reverb.md` & the architecture log)

- **Single worker node only**: terraform state + per-VM workspaces are on local disk (ADR-08), so
  workers are NOT yet horizontally scalable across hosts. Externalize state (remote backend) before
  scaling workers onto multiple nodes / k8s.
- **Catalog images** are on the local `public` disk → move to object storage (S3) for multi-node.
- Redis here is single-node per role; for HA, Redis Sentinel/Cluster + managed Postgres.
