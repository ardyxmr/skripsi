# ExoVirt — Prod Hardening Checklist (Runbook)

**Konteks deployment:** VM internal (jaringan kampus/lab), TLS self-signed, akses via IP + domain Netbird. Bukan server publik.
Runbook ini memisahkan **yang wajib untuk deployment internal (thesis)** dari **yang baru relevan kalau nanti go-public**. Setiap item: *cek dulu → kalau belum, perbaiki*.

> Jalankan perintah di bawah **di host prod** (`/home/app/exovirt`), bukan di mesin dev.

---

## A. WAJIB untuk deployment internal (kerjakan sekarang)

### A1 — Debug mode mati
Kalau `APP_DEBUG=true`, stack trace + isi `.env` bisa bocor ke halaman error.
```bash
grep -E '^APP_(ENV|DEBUG)=' backend/.env
# HARUS: APP_ENV=production  dan  APP_DEBUG=false
# kalau salah: edit backend/.env lalu:  php artisan config:cache
```

### A2 — Reverb `allowed_origins` dikunci ke origin SPA
Default repo = `['*']` (siapa pun boleh buka WebSocket). Kunci ke host prod.
```bash
grep -n "allowed_origins" backend/config/reverb.php
# ganti ['*'] → daftar host prod, mis:
# 'allowed_origins' => ['192.168.200.150', 'exovirt.netbird.host'],
php artisan config:cache && sudo systemctl restart infraprov-reverb
```

### A3 — Password di kedua instance Redis
Redis sudah `bind 127.0.0.1` (tidak terekspos ke jaringan) — ini proteksi utama. `requirepass` = lapis tambahan terhadap user lain di VM yang sama.
```bash
# instance queue/reverb (6380) — file: deploy/redis/redis-queue.conf ada "requirepass CHANGE_ME_IN_PROD"
redis-cli -p 6380 CONFIG GET requirepass          # kalau kosong → belum di-set
redis-cli -p 6379 CONFIG GET requirepass
# set password di masing-masing .conf → restart → sinkronkan ke backend/.env:
#   REDIS_PASSWORD=... (cache 6379) ; queue/reverb pakai password 6380
php artisan config:cache && php artisan queue:restart
```

### A4 — Backup terjadwal (PALING PENTING)
Kehilangan **Terraform state** = kehilangan kontrol atas semua VM yang sudah diprovision. Backup 3 hal: DB, tfstate, gambar katalog.
```bash
# contoh: simpan sebagai /home/app/exovirt/scripts/backup.sh lalu cron harian
pg_dump "$DB_DATABASE" | gzip > /var/backups/exovirt/db-$(date +%F).sql.gz
tar czf /var/backups/exovirt/state-$(date +%F).tgz \
    backend/storage/app/provisioning backend/storage/app/catalog-images
# cron:  0 2 * * *  bash /home/app/exovirt/scripts/backup.sh   (+ retensi mis. 14 hari)
```

### A5 — Rate limit login + API
Cegah brute-force ke endpoint login. Laravel punya middleware `throttle`.
```bash
grep -rnE "throttle" backend/routes/*.php
# pastikan grup /api pakai throttle (mis. throttle:60,1) dan login pakai throttle ketat (mis. 5/menit)
```

### A6 — Audit dependency
```bash
cd backend && composer audit
cd ../frontend && npm audit --omit=dev
# tambal yang High/Critical; catat sisanya sebagai known-accepted di lampiran thesis
```

### A7 — Permission file sensitif
```bash
ls -l backend/storage/app/ansible/automation_key   # HARUS 600
chmod 600 backend/storage/app/ansible/automation_key
```

---

## B. Baru relevan kalau GO-PUBLIC (jangan sekarang)

> Deployment internal self-signed + akses IP **sengaja** pakai `SESSION_SECURE_COOKIE=false` + `SESSION_DOMAIN=null` (lihat `docs/multi-domain-access.md`). Item di bawah justru **merusak login** kalau dipaksa di setup IP/self-signed.

- **Cookie secure + domain:** `SESSION_SECURE_COOKIE=true`, `SESSION_DOMAIN=.domain-asli` — hanya setelah ada domain + sertifikat TLS asli (Let's Encrypt).
- **Nginx HSTS + CSP:** HSTS jangan dipasang di self-signed/IP (browser akan menolak akses selamanya). `X-Content-Type-Options: nosniff` aman dipasang kapan saja.
- **Proxmox TLS:** pin CA / hindari `pm_tls_insecure`. Untuk lab self-signed cukup **didokumentasikan** sebagai batasan.

---

## C. Sudah aman by-design (untuk ditulis sebagai bukti di thesis)

- Kredensial per-VM: password acak `Str::password(20)` → `encrypted` at rest → reveal oleh pemilik + **teraudit**. Tidak ada plain password di response API.
- Redis `bind 127.0.0.1` (tidak terekspos jaringan).
- Auth SPA cookie Sanctum; **tidak ada seeded credential di prod** — admin dibuat lewat first-run installer.
- Audit trail metadata terstruktur untuk seluruh aksi lifecycle.

---

## Ringkasan untuk thesis (Bab implementasi / keamanan §5)
Untuk lingkup penelitian (deployment internal), kontrol keamanan yang **diterapkan**: debug-off, isolasi WebSocket (Reverb origin), auth Redis, backup DB+state, rate-limit, dependency audit, kredensial terenkripsi + audit. Kontrol yang **disebut sebagai future/production-public** (jujur sebagai batasan di Bab V): TLS domain asli + HSTS/CSP + secure-cookie + Proxmox CA pinning.
