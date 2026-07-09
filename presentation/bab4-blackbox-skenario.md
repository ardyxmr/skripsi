# Pengujian Black Box — Lembar Skenario (siap isi)

Instrumen pengujian fungsional ExoVirt. Jalankan tiap skenario → isi **Hasil Aktual**, **Status** (✅ Lolos / ❌ Gagal), dan nama file **Bukti** (screenshot). Skenario diambil dari fungsi/endpoint nyata sistem.

> **% Keberhasilan = (jumlah ✅ / total skenario) × 100.** Simpan screenshot di `presentation/bukti/blackbox/`.

## A. Autentikasi & Instalasi Awal

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| A1 | Instalasi awal (buat admin) | DB kosong → isi form "Create Administrator" | Akun admin terbuat, wizard mengunci diri | | | |
| A2 | Login valid | Email + password benar | Berhasil masuk, diarahkan ke dashboard | | | |
| A3 | Login salah | Password salah | Ditolak; percobaan berlebihan → dibatasi (*throttle*) | | | |
| A4 | Logout | Klik logout | Sesi berakhir, kembali ke halaman login | | | |
| A5 | Ganti password | Isi password lama+baru | Password berubah, bisa login dgn yg baru | | | |

## B. Permintaan (*Request*) & Persetujuan (*Approval*)

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| B1 | Ajukan VM (tunggal) valid | Isi wizard lengkap → Submit | Tersimpan, status *Pending Approval* | | | |
| B2 | Ajukan VM batch (N unit) | Jumlah instance > 1 | N VM terjadwal dgn nama `-01..-0N` | | | |
| B3 | Nama VM duplikat | Pakai nama VM yg sudah ada | Ditolak dgn pesan nama sudah dipakai | | | |
| B4 | Boot disk < ukuran tier | Isi boot disk di bawah floor tier | Tombol Next terkunci + peringatan minimum | | | |
| B5 | Edit/ajukan ulang request | Ubah request yg pending | Perubahan tersimpan | | | |
| B6 | Setujui request | Admin klik Approve | *Provisioning* berjalan (Terraform) | | | |
| B7 | Tolak request | Admin klik Reject | Status jadi Rejected, tidak diprovision | | | |
| B8 | Kembalikan/revert request | Admin revert | Request kembali ke pemohon | | | |
| B9 | Node kapasitas kritis | Ajukan ke node critical (hard-block ON) | Node di-*disable*/diblok di wizard/approve | | | |

## C. *Provisioning* & Inventaris

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| C1 | *Provisioning* sukses | Setelah approve | VM dibuat di Proxmox → status **Active** di Inventory | | | |
| C2 | Lihat daftar inventaris | Buka menu Inventory | Daftar VM + status tampil | | | |
| C3 | Lihat detail VM | Klik satu VM | Detail konfigurasi + IP + deskripsi tampil | | | |
| C4 | Reveal kredensial | Buka kredensial VM (verifikasi password) | Password acak tampil + tercatat di audit | | | |
| C5 | Retry VM gagal | VM status Failed → Retry | *Provisioning* diulang | | | |
| C6 | Sinkronisasi inventaris | Klik Sync | Status VM disegarkan dari Proxmox | | | |

## D. Siklus Hidup (*Lifecycle*)

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| D1 | Perpanjang (*renew*) VM | Ajukan renew | Tanggal kedaluwarsa mundur, tercatat | | | |
| D2 | Jadikan permanen | Klik permanent | VM tanpa kedaluwarsa | | | |
| D3 | Resize (CPU/RAM) | Ubah CPU/RAM (via approval) | Sumber daya VM berubah di Proxmox | | | |
| D4 | Edit resources | Ubah beberapa parameter | Perubahan diterapkan | | | |
| D5 | Tambah disk | Add disk (ukuran/slot) | Disk baru muncul di VM | | | |
| D6 | *Hardening* VM | Jalankan harden (Ansible) | Playbook jalan, versi hardening tercatat | | | |
| D7 | Hapus VM | Klik delete | VM dihancurkan di Proxmox + status Deleted | | | |
| D8 | Auto-expiry | Biarkan VM lewat masa berlaku | Masuk grace → auto-destroy + audit | | | |

## E. *Discovery* & Provider (sumber daya terpublikasi)

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| E1 | Tambah provider + Test Connection | Isi endpoint+token → Test | Status Connected | | | |
| E2 | Jalankan Discovery | Klik Run Discovery | Node/template/network/datastore terdeteksi | | | |
| E3 | Provider terputus | Putuskan provider | Katalog/network-nya jadi abu + hilang dari wizard | | | |
| E4 | Publikasi node/katalog/network/datastore/tier/environment | Buat/edit/hapus (CRUD) | Tersimpan & muncul di wizard | | | |

## F. Manajemen Akses (IAM)

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| F1 | CRUD User | Tambah/edit/hapus user | Perubahan tersimpan | | | |
| F2 | CRUD Role (RBAC) | Atur permission role | Hak akses sesuai role | | | |
| F3 | CRUD Group | Tambah/edit/hapus grup | Perubahan tersimpan | | | |
| F4 | Proteksi hapus | Hapus user yg jadi manager grup | Ditolak (409) dgn alasan | | | |
| F5 | Batasan environment | Wizard di environment tertentu | Hanya resource yg diizinkan yg muncul | | | |

## G. Audit

| No | Skenario | Langkah / Input | Hasil Diharapkan | Hasil Aktual | Status | Bukti |
|---:|----------|-----------------|------------------|--------------|:------:|-------|
| G1 | Lihat audit trail | Buka menu Audit | Aktivitas tercatat (siapa/apa/kapan) | | | |
| G2 | Filter audit | Filter vmid / environment | Hasil sesuai filter | | | |
| G3 | Ekspor CSV | Klik export | File CSV terunduh + kolom metadata | | | |

---

## Rekapitulasi

| Area | Jumlah Skenario | Lolos | Gagal |
|------|:---------------:|:-----:|:-----:|
| A. Autentikasi | 5 | | |
| B. Request & Approval | 9 | | |
| C. Provisioning & Inventaris | 6 | | |
| D. Lifecycle | 8 | | |
| E. Discovery & Provider | 4 | | |
| F. IAM | 5 | | |
| G. Audit | 3 | | |
| **TOTAL** | **40** | | |

**% Keberhasilan Fungsional = (Total Lolos / 40) × 100 = ____ %**
