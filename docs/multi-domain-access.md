# ExoVirt — Akses Multi-Host (LAN + Netbird / multi-domain)

Tujuan: buka prod ExoVirt dari **dua jalur sekaligus**, dan login jalan di dua-duanya:

1. **Dari dalam LAN** → pakai **IP lokal VM** (`https://<ip-vm>`).
2. **Dari luar network** → pakai **domain/IP Netbird** (`https://<host-netbird>`).

Pola yang sama berlaku untuk berapa pun host (tambah domain ke-3, ke-4, dst).

---

## Kenapa ini butuh setting khusus

App-nya **same-origin** — nginx nyajikan frontend DAN nge-proxy `/api` di host yang sama, jadi **CORS tidak ikut campur**. Yang mengatur "host mana yang boleh login" cuma dua env:

| Env | Fungsi |
|-----|--------|
| `SANCTUM_STATEFUL_DOMAINS` | Daftar host yang boleh dapat sesi cookie SPA. Dipisah **koma**, boleh banyak. |
| `SESSION_DOMAIN` | Domain yang di-*bind* ke cookie. **Set `null`** → cookie jadi *host-only* (nempel ke host manapun yang lagi dipakai). Ini kunci multi-host. |

Kalau `SESSION_DOMAIN` diisi salah satu host, cookie ke-bind ke host itu → host lain **gagal login (500 "Session store not set")**. `null` bikin tiap host punya cookie sendiri, independen.

---

## Langkah

### 1. Catat host-host yang dipakai
Di VM prod:
```bash
ip a                      # → IP lokal VM, mis. 192.168.1.50
netbird status            # → IP overlay Netbird (100.x.x.x) + domain kalau ada
```
Kumpulkan: `IP-lokal-VM`, `IP-atau-domain-Netbird`.

### 2. Edit `.env` prod
```env
# Daftar SEMUA host yang diketik di browser (koma, TANPA spasi).
# Tambah :port kalau bukan 443, mis. 192.168.1.50:8443
SANCTUM_STATEFUL_DOMAINS=192.168.1.50,exovirt.netbird.cloud,localhost,127.0.0.1

# WAJIB null → cookie host-only, inilah yang bikin IP lokal & domain Netbird jalan bareng.
SESSION_DOMAIN=null

# true kalau kedua jalur https; false kalau ada jalur yang http (lihat catatan di bawah).
SESSION_SECURE_COOKIE=true
SESSION_SAME_SITE=lax

# Cuma boleh SATU nilai — pilih host utama. Tidak mem-blokir host lain (UI pakai URL relatif).
APP_URL=https://exovirt.netbird.cloud
```

### 3. nginx: terima semua Host
Biar nginx tidak nolak request dari IP maupun domain Netbird, pakai catch-all `server_name`:
```nginx
server {
    listen 443 ssl http2;
    server_name _;          # ← terima Host apa pun (IP lokal + domain Netbird)
    ...
}
```
Test + reload:
```bash
sudo nginx -t && sudo systemctl reload nginx
```

### 4. Terapkan perubahan `.env`
```bash
php artisan config:clear     # WAJIB tiap habis ubah .env (config di-cache)
# kalau prod pakai config cache: php artisan config:cache
```

### 5. Verifikasi
- **Dari laptop di LAN:** `https://192.168.1.50` → login harus jalan.
- **Dari device yang join Netbird:** `https://exovirt.netbird.cloud` → login harus jalan.
- Cert self-signed → browser kasih warning → klik "Advanced / Lanjutkan".

---

## Nambah host baru (multi-domain)

Mau nambah domain/IP lain (mis. Cloudflare Tunnel atau domain kedua)?

1. Tambahin host-nya ke `SANCTUM_STATEFUL_DOMAINS` (pisah koma):
   ```env
   SANCTUM_STATEFUL_DOMAINS=192.168.1.50,exovirt.netbird.cloud,vm.example.com,localhost,127.0.0.1
   ```
2. `php artisan config:clear`.
3. Selesai — `server_name _` sudah nangkep Host baru, `SESSION_DOMAIN=null` sudah handle cookie-nya. Nginx tidak perlu diubah lagi.

`APP_URL` tetap satu; ganti hanya kalau mau ganti host utama untuk link email/absolut.

---

## Troubleshooting

| Gejala | Sebab & fix |
|--------|-------------|
| Login **500 "Session store not set on request"** | Host di URL browser belum ada di `SANCTUM_STATEFUL_DOMAINS`. Tambahin (persis, termasuk `:port` kalau ada) → `config:clear`. |
| Login "sukses" tapi langsung balik ke halaman login | Cookie tidak keset. Cek: (a) `SESSION_DOMAIN=null`, (b) `SESSION_SECURE_COOKIE` cocok dengan http/https yang dipakai — **`true` blokir cookie di http**, jadi kalau ada jalur http set `false`. |
| Nginx balikin 404 / default page dari domain Netbird | `server_name` tidak match. Pakai `server_name _;`. |
| Warning sertifikat | Self-signed, wajar. Klik lanjut, atau pasang cert Netbird/Let's Encrypt kalau mau bersih. |

**Catatan Netbird:** trafiknya sudah dienkripsi WireGuard, IP `100.x` cuma kelihatan di device yang join network kamu (bukan public beneran). Kalau ribet sama self-signed, boleh jalanin jalur Netbird via **http** (transport tetap terenkripsi) — tapi kalau begitu `SESSION_SECURE_COOKIE=false`, dan idealnya konsisten satu skema biar satu config nginx.

---

## Ringkas (TL;DR)
```
SANCTUM_STATEFUL_DOMAINS = <ip-lokal>,<host-netbird>,localhost,127.0.0.1
SESSION_DOMAIN           = null
server_name              = _
→ php artisan config:clear
```
Dari LAN pakai `https://<ip-vm>`, dari luar pakai `https://<host-netbird>` — dua-duanya login jalan.
