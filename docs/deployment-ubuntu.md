# ExoVirt — Deploy dari Nol di Ubuntu (Step-by-Step)

Panduan urut untuk stand-up **ExoVirt** di **VM Ubuntu bersih** (22.04 / 24.04), dari VM kosong sampai
halaman login jalan. Ini menggabungkan + memperbarui `08-deployment-workflow.md` dan
`deployment-realtime-topology.md` untuk skenario **deploy prod pertama kali** (DB kosong → first-run
installer bikin admin, bukan seeder).

Ganti di seluruh dokumen: `exovirt.example.com` → domainmu, `/home/appd/my-project` → path install-mu,
user `appd` → user deploy-mu.

```
                       ┌── Nginx (:443 TLS) ─────────────────────────┐
  browser ─wss/https──▶│  /             → SPA (frontend/dist, static)│
                       │  /api,/storage → Laravel (PHP-FPM, backend) │
                       │  /app/         → Reverb (:8080) ws proxy    │
                       └───────┬───────────────┬─────────────────────┘
                    Redis :6379 (cache, LRU)   │ broadcast API (127.0.0.1:8080)
                    Redis :6380 (queue+pubsub,  ▼
                       noeviction+AOF) ◀── workers / reverb / scheduler ──▶ Postgres
```

---

## Fase 0 — Sebelum mulai (yang harus siap)

- VM Ubuntu bersih, ada user sudo (contoh `appd`).
- Domain (mis. `exovirt.example.com`) sudah mengarah ke IP VM (A record) — dibutuhkan untuk TLS.
- **Proxmox prod** sudah bisa dijangkau dari VM ini (`https://<host>:8006`), dan **golden-image templates
  sudah ada di cluster** (Rocky/Ubuntu/Fedora/RHEL/Windows) + **API token** dengan permission benar.
  (Template hidup di Proxmox, bukan di DB app.)
- Timezone: `sudo timedatectl set-timezone Asia/Jakarta`.

---

## Fase 1 — Install semua package

```bash
sudo apt-get update
# Runtime inti: PHP 8.3 + ekstensi, Postgres, Redis, Nginx, TLS, git
sudo apt-get install -y \
  postgresql redis-server nginx certbot python3-certbot-nginx git unzip curl \
  php8.3 php8.3-fpm php8.3-cli php8.3-pgsql php8.3-redis php8.3-gd \
  php8.3-mbstring php8.3-xml php8.3-curl php8.3-zip php8.3-bcmath
# Ekstensi khas proyek ini: php8.3-redis (cache/queue/Reverb) + php8.3-gd (resize gambar katalog).

# Composer
curl -sS https://getcomposer.org/installer | php
sudo mv composer.phar /usr/local/bin/composer

# Node.js 20 (buat build frontend)
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Terraform (repo resmi HashiCorp)
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt-get update && sudo apt-get install -y terraform

# Ansible (buat hardening lifecycle / Stage 8)
sudo apt-get install -y ansible
```

Cek: `php -v` (8.3), `composer -V`, `node -v` (20), `terraform -version`, `ansible --version`.

---

## Fase 2 — Ambil kode aplikasi

Bawa kode lewat **git clone** (paling bersih — `.gitignore` sudah mengecualikan `.env`, `storage`,
`vendor`, `node_modules`). **Jangan copy folder dev apa adanya.**

```bash
sudo mkdir -p /home/appd && sudo chown appd:appd /home/appd
cd /home/appd
git clone <URL_REPO_KAMU> my-project     # → /home/appd/my-project
```

> Kalau repo belum ada remote: bikin arsip bersih di mesin dev
> (`git archive --format=tar.gz -o /tmp/exovirt.tgz HEAD`), pindahkan, lalu extract di VM.

---

## Fase 3 — PostgreSQL (DB kosong)

```bash
sudo -u postgres psql <<'SQL'
CREATE DATABASE exovirt;
CREATE USER exovirt WITH ENCRYPTED PASSWORD 'GANTI_PASSWORD_KUAT';
GRANT ALL PRIVILEGES ON DATABASE exovirt TO exovirt;
\c exovirt
GRANT ALL ON SCHEMA public TO exovirt;   -- wajib di Postgres 15+
SQL
```

---

## Fase 4 — Redis dua instance

**Cache (:6379)** — service apt bawaan, cukup set policy-nya:

```bash
redis-cli -p 6379 CONFIG SET maxmemory 256mb
redis-cli -p 6379 CONFIG SET maxmemory-policy allkeys-lru
# (prod) set password:
redis-cli -p 6379 CONFIG SET requirepass 'GANTI_PASS_CACHE'
redis-cli -p 6379 CONFIG REWRITE
```

**Queue + Reverb pub/sub (:6380)** — `noeviction` + AOF, lewat systemd:

```bash
cd /home/appd/my-project
sudo cp deploy/redis/redis-queue.conf /etc/redis/redis-queue.conf
# (prod) buka comment requirepass di file itu → set 'GANTI_PASS_QUEUE'
sudo mkdir -p /var/lib/redis-queue && sudo chown redis:redis /var/lib/redis-queue
sudo cp deploy/systemd/redis-queue.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now redis-queue
redis-cli -p 6380 ping                          # PONG
redis-cli -p 6380 config get maxmemory-policy   # noeviction
```

> **Kenapa dua instance, bukan dua DB:** cache HARUS evict (`allkeys-lru`); queue TIDAK BOLEH
> (`noeviction`) — job hilang = provision/destroy hilang. Satu instance cuma bisa satu policy.

---

## Fase 5 — Tuning kernel (Redis + WebSocket)

```bash
cd /home/appd/my-project
sudo cp deploy/sysctl/99-infraprov.conf /etc/sysctl.d/ && sudo sysctl --system
sudo cp deploy/systemd/disable-thp.service /etc/systemd/system/
sudo systemctl daemon-reload && sudo systemctl enable --now disable-thp
# Naikkan limit file descriptor (tiap koneksi WS + client Redis = 1 fd):
printf 'appd soft nofile 100000\nappd hard nofile 100000\n' | sudo tee -a /etc/security/limits.conf
```

---

## Fase 6 — Backend (Laravel)

```bash
cd /home/appd/my-project/backend
composer install --no-dev --optimize-autoloader
cp .env.example .env
php artisan key:generate            # APP_KEY (dipakai enkripsi kredensial provider)
# → EDIT .env sekarang, isi sesuai Fase 7, LALU lanjut:

php artisan migrate --force         # ⚠️ TANPA --seed → users KOSONG → installer yang bikin admin
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan event:cache

# Kunci SSH otomatis untuk Ansible (di-inject ke tiap VM baru via cloud-init):
mkdir -p storage/app/ansible
ssh-keygen -t ed25519 -f storage/app/ansible/automation_key -N '' -C exovirt-ansible
chmod 600 storage/app/ansible/automation_key

# Pastikan stub Terraform ada (default variant = 'structured').
# storage/ biasanya gitignore → salin dari repo/mesin dev kalau clone tidak membawanya:
ls storage/app/master-provisioning/terraform-structured/{main.tf,variables.tf}
```

> ❗ **Perbedaan paling penting dari runbook lama:** jalankan `migrate --force` **TANPA** `db:seed`.
> Kalau di-seed, malah kebikin `admin@infraprov.local` / `Password123!`. Dengan DB kosong,
> **first-run installer** (Fase 11) yang bikin admin pertama. **JANGAN `migrate:fresh` di prod setelah go-live** — itu drop semua data.

Set kepemilikan agar PHP-FPM (`www-data`) bisa tulis storage:

```bash
sudo chown -R appd:www-data storage bootstrap/cache
sudo chmod -R g+rwX storage bootstrap/cache
```

---

## Fase 7 — Isi `backend/.env` (prod)

Nilai penting (gabungkan dengan sisa `.env.example`):

```ini
APP_NAME=ExoVirt
APP_ENV=production
APP_DEBUG=false
APP_URL=https://exovirt.example.com
APP_TIMEZONE=Asia/Jakarta
# APP_KEY sudah diisi oleh key:generate

DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=exovirt
DB_USERNAME=exovirt
DB_PASSWORD=GANTI_PASSWORD_KUAT

# --- Redis: cache (:6379) ---
REDIS_CLIENT=phpredis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=GANTI_PASS_CACHE
CACHE_STORE=redis

# --- Redis: queue + session + Reverb pub/sub (:6380, noeviction) ---
QUEUE_CONNECTION=redis
REDIS_QUEUE_CONNECTION=queue
REDIS_QUEUE_HOST=127.0.0.1
REDIS_QUEUE_PORT=6380
REDIS_QUEUE_PASSWORD=GANTI_PASS_QUEUE
REDIS_QUEUE_RETRY_AFTER=1800        # harus > worker --timeout (600) + runtime job

# --- Session (cookie SPA auth, ADR-24) — di instance :6380, JANGAN cache LRU ---
SESSION_DRIVER=redis
SESSION_CONNECTION=session
REDIS_SESSION_DB=2
SESSION_LIFETIME=60
SESSION_EXPIRE_ON_CLOSE=true
SESSION_SECURE_COOKIE=true
SESSION_DOMAIN=exovirt.example.com
SANCTUM_STATEFUL_DOMAINS=exovirt.example.com

# --- Broadcasting / Reverb ---
BROADCAST_CONNECTION=reverb
REVERB_APP_ID=GANTI_ID              # mis. `openssl rand -hex 8`
REVERB_APP_KEY=GANTI_KEY            # mis. `openssl rand -hex 16`
REVERB_APP_SECRET=GANTI_SECRET      # mis. `openssl rand -hex 20`
REVERB_HOST=127.0.0.1
REVERB_PORT=8080
REVERB_SCHEME=http
REVERB_SCALING_ENABLED=true
REVERB_REDIS_HOST=127.0.0.1
REVERB_REDIS_PORT=6380
REVERB_REDIS_PASSWORD=GANTI_PASS_QUEUE

# --- Mail (untuk notifikasi / reset password) ---
MAIL_MAILER=smtp
MAIL_HOST=smtp.provider.com
MAIL_PORT=587
MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_FROM_ADDRESS="no-reply@exovirt.example.com"
MAIL_FROM_NAME=ExoVirt

# --- Ansible (default sudah benar, override kalau path beda) ---
# ANSIBLE_PUBLIC_KEY_PATH=storage/app/ansible/automation_key.pub
```

Setelah edit `.env`: `php artisan config:cache` lagi.

---

## Fase 8 — Frontend (build SPA statis)

`frontend/.env`:

```ini
VITE_API_BASE_URL=/api           # relatif → same-origin (cookie/CSRF tanpa CORS)
VITE_APP_NAME=ExoVirt
VITE_REVERB_APP_KEY=GANTI_KEY    # = REVERB_APP_KEY
VITE_REVERB_HOST=                # kosong → client pakai origin halaman (nginx /app → wss)
VITE_REVERB_PORT=
VITE_IDLE_TIMEOUT_MIN=60
VITE_IDLE_WARN_MIN=5
```

```bash
cd /home/appd/my-project/frontend
npm ci && npm run build          # → frontend/dist (termasuk logo ExoVirt di public/)
```

---

## Fase 9 — systemd services (workers, Reverb, scheduler)

```bash
cd /home/appd/my-project
sudo cp deploy/systemd/infraprov-worker@.service   /etc/systemd/system/
sudo cp deploy/systemd/infraprov-reverb.service    /etc/systemd/system/
sudo cp deploy/systemd/infraprov-scheduler.service /etc/systemd/system/
# (unit ini sudah User=appd, WorkingDirectory=/home/appd/my-project/backend, php /usr/bin/php —
#  sesuaikan kalau path/user-mu beda)
sudo systemctl daemon-reload

sudo systemctl enable --now infraprov-worker@1 infraprov-worker@2 infraprov-worker@3  # 3 worker paralel
sudo systemctl enable --now infraprov-reverb          # 1 per node
sudo systemctl enable --now infraprov-scheduler       # ⚠️ TEPAT SATU fleet-wide (discovery/expiry)
```

Cek: `systemctl status infraprov-reverb`, `journalctl -u infraprov-worker@1 -f`.

---

## Fase 10 — Nginx + TLS

```bash
sudo cp deploy/nginx/infraprov.conf /etc/nginx/sites-available/exovirt
# EDIT file itu: ganti semua `server_name infraprov.example.com` → domainmu,
# pastikan `root` menunjuk ke /home/appd/my-project/frontend/dist dan backend/public,
# dan fastcgi_pass = unix:/run/php/php8.3-fpm.sock (cek: `ls /run/php/`).
sudo ln -s /etc/nginx/sites-available/exovirt /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d exovirt.example.com     # provisions + auto-renew TLS
```

Nginx menyajikan SPA, mem-proxy `/api` ke PHP-FPM, dan meng-upgrade `/app/` ke Reverb (wss). Broadcast
API (`/apps/{id}/events`) sengaja TIDAK diekspos — worker menghubungi Reverb di `127.0.0.1:8080`.

---

## Fase 11 — First-run: bikin admin & konfigurasi

1. Buka `https://exovirt.example.com` → karena DB kosong, muncul layar **"Create Administrator"**.
2. Isi nama/email/password → submit → mendarat di **halaman login** → sign in.
   (Role Administrator/Manager/User, grup, dan tier default dibuat otomatis di belakang layar.)
3. Admin → Settings → tambah **Provider** (isi 2 pasang kredensial) → **Test Connection** = Connected →
   **Run Discovery Now** (mengisi 4 tabel `provider_*`).
4. Publish **node**, **catalog**, **network**, **datastore**; definisikan **tier** + **environment**.
5. Smoke test end-to-end: request VM → (approve) → ProvisionVmJob → VM Active + IP muncul.

---

## Fase 12 — Checklist hardening sebelum go-live

- [ ] `APP_ENV=production`, `APP_DEBUG=false`.
- [ ] Reverb `allowed_origins` dikunci ke origin SPA (bukan `['*']`) — cek `config/reverb.php`.
- [ ] Redis `requirepass` di **kedua** instance; `.env` sinkron.
- [ ] `SESSION_SECURE_COOKIE=true`, `SESSION_DOMAIN` + `SANCTUM_STATEFUL_DOMAINS` = domain asli.
- [ ] Nginx: HTTPS-only + HSTS + `X-Content-Type-Options` + CSP; rate-limit API.
- [ ] Proxmox TLS: verifikasi/pin CA (hindari `pm_tls_insecure`); dokumentasikan kalau self-signed.
- [ ] Tidak ada field kredensial di response API mana pun.
- [ ] `composer audit` + `npm audit` bersih.
- [ ] Backup terjadwal: DB + `storage/app/provisioning/` (workspace/state) + `storage/app/catalog-images/`.

---

## Fase 13 — Deploy berikutnya (update)

```bash
cd /home/appd/my-project/backend && git pull && composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan config:cache && php artisan route:cache && php artisan event:cache
php artisan queue:restart          # WAJIB — worker cache kode saat boot
sudo systemctl restart infraprov-reverb infraprov-scheduler
cd ../frontend && npm ci && npm run build
```

---

## Lampiran — Yang dibersihkan vs yang dibawa

**Tidak dibawa (mulai bersih di prod):** DB dev, Redis dev, Terraform workspaces/tfstate dev, `.env` dev
+ APP_KEY dev, seeded creds `admin@infraprov.local`/`Password123!` (digantikan installer), log/node_modules/vendor/dist.

**Dibawa:** kode via git (termasuk `frontend/public/` logo + `deploy/`), `.env` prod BARU, dan di sisi Proxmox
prod: golden-image templates + token API. Runtime (PHP/Postgres/Redis/Terraform/Ansible/Node) di-install di VM (Fase 1).

> Referensi lebih dalam: `08-deployment-workflow.md` (Part B provisioning flow, Part D checklist penuh) &
> `docs/deployment-realtime-topology.md` (verifikasi topologi realtime, §8).
