# ExoVirt — Akses Publik via Cloudflare Tunnel

Tujuan: buka ExoVirt ke **internet publik** tanpa port-forward / IP publik, buat prod yang jalan di **VM di balik NAT** (mis. VMware di laptop). Ini jalur ketiga selain LAN IP + Netbird (lihat `multi-domain-access.md`).

> ⚠️ **Ini expose portal yang mengontrol Proxmox/VM ke publik.** Wajib pasang **Cloudflare Access** (§5) sebagai gerbang. Jangan biarkan halaman login terbuka bebas.

## Arsitektur
```
browser (mana pun) ──https──▶ Cloudflare edge ──tunnel(http2/7844)──▶ cloudflared (VM prod) ──https://localhost:443──▶ nginx ──▶ app
                    TLS publik CF                                     keluar via ens33/NAT        origin self-signed (No TLS Verify)
```
- **Nggak perlu buka/forward port** apa pun di router — cloudflared bikin koneksi **keluar** ke edge Cloudflare.
- TLS publik di-handle Cloudflare; origin ke nginx tetap self-signed → butuh **No TLS Verify** di sisi tunnel.

## Prasyarat
- Domain yang **zone-nya ada di akun Cloudflare** (mis. `proxtes.cyou`).
- Akun Cloudflare **Zero Trust** (gratis).

## Langkah

### 1. Install cloudflared (repo resmi)
```bash
sudo mkdir -p --mode=0755 /usr/share/keyrings
curl -fsSL https://pkg.cloudflare.com/cloudflare-main.gpg | sudo tee /usr/share/keyrings/cloudflare-main.gpg >/dev/null
echo "deb [signed-by=/usr/share/keyrings/cloudflare-main.gpg] https://pkg.cloudflare.com/cloudflared any main" | sudo tee /etc/apt/sources.list.d/cloudflared.list
sudo apt-get update && sudo apt-get install -y cloudflared
```

### 2. Buat tunnel (dashboard, remotely-managed / token)
Zero Trust → **Networks → Tunnels → Create a tunnel** → **Cloudflared** → kasih nama (mis. `exovirt`) → dashboard nampilin command install ber-token. Jalankan di VM prod:
```bash
sudo cloudflared service install <TOKEN-dari-dashboard>
```

### 3. ⚠️ GOTCHA A — VMware NAT blokir QUIC (UDP) → paksa HTTP/2 (TCP)
Default cloudflared pakai **QUIC (UDP 7844)**, yang sering **di-mangle/blok VMware NAT** → log `Failed to dial a quic connection ... failed to dial to edge with quic`. Paksa http2:
```bash
sudo systemctl edit cloudflared
```
```ini
[Service]
Environment=TUNNEL_TRANSPORT_PROTOCOL=http2
TimeoutStartSec=90
```

### 4. ⚠️ GOTCHA B — TimeoutStartSec default (15s) kekecilan
Unit bawaan `TimeoutStartSec=15` + `Type=notify`. Saat start, cloudflared **nyantol ~10 detik** di fetch "features" DNS (`cfd-features.argotunnel.com` via `127.0.0.53`; diperlambat **Netbird split-DNS** `netbird.cloud` di `wt0`). Ini **non-fatal**, tapi ngabisin budget 15s → systemd **Terminating** sebelum edge connect → semua error jadi **"operation was canceled"** (BUKAN gagal koneksi beneran). Fix = `TimeoutStartSec=90` (udah di blok §3 di atas).
```bash
sudo systemctl daemon-reload && sudo systemctl restart cloudflared
journalctl -u cloudflared -f
```
Sukses ditandai: `Initial protocol http2` → **`Registered tunnel connection`** (dan di dashboard connector = **Connected**).

### 5. Public Hostname (dashboard) — routing trafik ke app
Tunnel connect ≠ trafik ke-route. Di tunnel → **Public Hostname → Add**:
- Subdomain + Domain → mis. `exovirt.proxtes.cyou`
- **Service**: `https://localhost:443`
- **Additional application settings → TLS → No TLS Verify: ON** (origin nginx self-signed)

### 6. Sanctum — biar LOGIN nggak 500
Host publik baru harus masuk daftar stateful (lihat `multi-domain-access.md`):
```bash
cd /home/app/exovirt/backend
# SANCTUM_STATEFUL_DOMAINS=<host-lain>,...,exovirt.proxtes.cyou
# (SESSION_DOMAIN=null, SESSION_SECURE_COOKIE=true, server_name _ — sudah cocok)
php artisan config:clear && php artisan config:cache
sudo systemctl reload php8.3-fpm
```
Opsional: `APP_URL=https://exovirt.proxtes.cyou` untuk link absolut (email/reset).

### 7. 🔒 Cloudflare Access — gerbang wajib
Zero Trust → **Access → Applications → Add → Self-hosted** → domain `exovirt.proxtes.cyou` → policy **Allow → Emails = email kamu**. URL tetap publik, tapi harus lolos auth Cloudflare (email OTP/Google) sebelum nyentuh app.

## Verifikasi
Dari device **tanpa Netbird** (mis. HP pakai data seluler): buka `https://exovirt.proxtes.cyou` → halaman kebuka, (lolos Access), **login jalan**.

## Troubleshooting

| Gejala (log/GUI) | Sebab | Fix |
|---|---|---|
| `failed to dial to edge with quic` | QUIC/UDP 7844 diblok (VMware NAT) | `Environment=TUNNEL_TRANSPORT_PROTOCOL=http2` (§3) |
| `start operation timed out` + `operation was canceled` di detik ~15 | `TimeoutStartSec=15` kekecilan, keabisan gara-gara stall DNS features 10s | `TimeoutStartSec=90` (§4) |
| `dial tcp <edge>:7844: i/o timeout` (timeout beneran) | Outbound **TCP 7844** diblok | buka 7844/tcp keluar (ufw host / VMware NAT / router). Tes cepat: `timeout 5 bash -c 'cat </dev/null >/dev/tcp/198.41.192.7/7844' && echo OPEN \|\| echo BLOCKED` |
| Login **500 "Session store not set"** | host publik belum di `SANCTUM_STATEFUL_DOMAINS` | tambah host + `config:clear && config:cache` (§6) |
| `lookup cfd-features... 127.0.0.53:53 i/o timeout` | Netbird split-DNS bikin lambat; **non-fatal** | abaikan; sudah ditutup TimeoutStartSec=90 |
| Redirect loop | tunnel diarahkan ke `http://localhost:80` (nginx redirect ke https) | arahkan ke **`https://localhost:443`** + No TLS Verify |

## Catatan
- WebSocket (Reverb `/app/`) jalan lewat Cloudflare Tunnel by default — realtime tetap hidup.
- Service auto-start saat boot: `systemctl is-enabled cloudflared`.
- Matiin akses publik = `sudo systemctl stop cloudflared` (atau hapus Public Hostname di dashboard). LAN + Netbird tetap jalan.
