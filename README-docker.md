# ExoVirt — Deploy pakai Container (Docker & Podman)

Stack lengkap dalam container: Nginx + PHP-FPM (Laravel) + Postgres + 2× Redis + queue workers +
Reverb + scheduler. Provisioning (Terraform + Ansible) jalan dari dalam container `worker`.

```
                 ┌── nginx (:80) ──────────────────────────────┐
  browser ──────▶│  /            → SPA (dist, di image)         │
                 │  /api,/storage→ app  (PHP-FPM :9000)         │
                 │  /app/        → reverb (:8080)               │
                 └──────┬─────────────┬───────────────┬─────────┘
             redis-cache(LRU)   redis-queue(noevict)  │
                                       ▲               ▼
                        worker × N / reverb / scheduler ──▶ db (Postgres)
```

## Prasyarat
- **Docker** (+ compose plugin) **atau Podman** (+ `podman-compose`).
- VM ini bisa menjangkau **Proxmox** (`https://<host>:8006`) + `registry.terraform.io` (worker download provider).
- Golden-image templates sudah ada di Proxmox + API token (sama seperti deploy biasa).

---

## Docker — langkah

```bash
cd /home/app/exovirt

# 1) Siapkan environment
cp .env.docker .env.docker.local 2>/dev/null || true   # opsional: simpan salinan
#    Edit .env.docker: DB_PASSWORD, REVERB_APP_SECRET, APP_URL/SANCTUM_STATEFUL_DOMAINS (lihat catatan bawah)

# 2) Generate APP_KEY (bypass entrypoint dengan --entrypoint php)
docker compose --env-file .env.docker build app
docker compose --env-file .env.docker run --rm --entrypoint php app artisan key:generate --show
#    → tempel hasil "base64:...." ke APP_KEY= di .env.docker

# 3) Build + jalan
docker compose --env-file .env.docker up -d --build

# 4) Cek
docker compose --env-file .env.docker ps
docker compose --env-file .env.docker logs -f app        # lihat entrypoint: migrate dst
```

Buka **http://localhost:8080** (atau `HTTP_PORT` yang kamu set) → muncul **Create Administrator**
(installer first-run) → bikin admin → login.

> ⚠️ **`SANCTUM_STATEFUL_DOMAINS` harus = host:port di URL browser.** Akses `http://192.168.1.50:8080`
> → set `SANCTUM_STATEFUL_DOMAINS=192.168.1.50:8080` + `APP_URL=http://192.168.1.50:8080`. Kalau tidak,
> login gagal 500 "Session store not set". Ubah `.env.docker` lalu `docker compose ... up -d` lagi.

### Operasi harian
```bash
docker compose --env-file .env.docker logs -f worker      # log job/terraform
docker compose --env-file .env.docker exec app php artisan migrate:status
docker compose --env-file .env.docker restart worker      # setelah update kode
docker compose --env-file .env.docker down                # stop (volume TETAP aman)
```

### Update ke versi baru
```bash
git pull
docker compose --env-file .env.docker up -d --build       # rebuild image + migrate otomatis
```

---

## Podman — langkah

Podman jalanin `docker-compose.yml` yang **sama** lewat `podman-compose` (multi-container). Rootless bisa.

```bash
# ganti 'docker compose' → 'podman-compose', sisanya identik:
podman-compose --env-file .env.docker build app
podman-compose --env-file .env.docker run --rm --entrypoint php app artisan key:generate --show
podman-compose --env-file .env.docker up -d --build
podman-compose --env-file .env.docker ps
```

Catatan khusus Podman:
- **Rootless port:** user biasa tidak bisa bind port < 1024 → biarkan `HTTP_PORT=8080` (default). Mau di 80?
  jalankan rootful (`sudo podman-compose ...`) atau set `net.ipv4.ip_unprivileged_port_start=80`.
- **SELinux (Fedora/RHEL):** bind-mount `./docker/redis-queue.conf` bisa kena "permission denied". Tambah label:
  ubah baris mount di `docker-compose.yml` jadi `:ro,z` (mis. `./docker/redis-queue.conf:/etc/redis/redis-queue.conf:ro,z`)
  dan `esv_appdata:...:ro,z` untuk nginx. (Named volume biasanya aman.)
- **`podman compose`** (tanpa tanda hubung, Podman 4.7+) juga bisa — dia mendelegasikan ke `podman-compose`/`docker-compose`.
- **Native quadlet (opsional):** kalau mau systemd-managed tanpa compose, generate unit: `podman generate systemd`
  per container, atau tulis `.container` quadlet files. Compose sudah cukup untuk mayoritas kasus.

---

## Volume & backup (penting)
| Volume | Isi | Backup? |
|---|---|---|
| `esv_provisioning` | **workspace + terraform state** | ⭐ **WAJIB** — kehilangan ini = tak bisa destroy/kelola VM lama |
| `esv_db` | Postgres | ✅ wajib |
| `esv_appdata` | ansible key, catalog images, private, stub | ✅ (kunci ansible + gambar) |
| `esv_redis_queue` | AOF antrean job | opsional |

`storage/logs` **tidak** di-volume → log ke `docker/podman logs`. `storage/framework` (cache) container-local.

Backup cepat:
```bash
docker run --rm -v exovirt_esv_provisioning:/d -v "$PWD":/b alpine tar czf /b/provisioning-backup.tgz -C /d .
```

---

## TLS (prod)
Nginx container ini HTTP di `:80`. Untuk HTTPS pilih salah satu:
1. **Reverse proxy TLS di depan** (Caddy/Traefik/nginx host/LB) → arahkan ke `HTTP_PORT`. Set
   `SESSION_SECURE_COOKIE=true`, `APP_URL=https://domain`, `SANCTUM_STATEFUL_DOMAINS=domain`.
2. **TLS di dalam nginx container** → mount cert + tambah `server { listen 443 ssl; ... }` di `docker/nginx.conf`
   dan publish `443:443`.

Setelah TLS aktif: `SESSION_SECURE_COOKIE=true`.

## Catatan
- **APP_KEY harus tetap** (dipakai enkripsi kredensial provider). Jangan ganti setelah ada provider tersimpan.
- **`VITE_REVERB_APP_KEY` di-bake saat build** = harus sama dengan `REVERB_APP_KEY`. Ganti key → `up --build` ulang.
- **`migrate` jalan otomatis, TANPA seed** (entrypoint) → installer yang bikin admin. Data aman antar-restart (volume).
- Worker butuh egress ke Proxmox + registry Terraform; kredensial Proxmox TIDAK di `.env` (tersimpan terenkripsi di DB, diisi lewat UI).
