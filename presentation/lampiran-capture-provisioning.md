# Lampiran — Pengatur Caption Bukti Konfigurasi Mesin Virtual

**Judul lampiran:** Bukti Konfigurasi Mesin Virtual Hasil Pengujian Provisioning

Panduan urutan tempel tangkapan layar. Setiap baris satu mesin virtual, urut dari nomor 1. Kolom "Harus terlihat" adalah nilai yang wajib tampak di gambar, supaya kamu bisa memastikan tiap tangkapan cocok sebelum menempel.

Badan sudah menampilkan satu contoh tiap kelompok (Gambar 4.23 manual, Gambar 4.25 portal), jadi lampiran ini memuat kesepuluh-sepuluhnya sebagai bukti lengkap Tabel 4.20 dan Tabel 4.21.

**Cara penomoran yang disarankan:** satu caption per kelompok, gambarnya disusun kisi (grid) berlabel per mesin virtual. Jadi hanya ada **Gambar L.1** dan **Gambar L.2**, bukan dua puluh nomor. Kalau prodimu menuntut tiap gambar bernomor sendiri, ganti jadi Gambar L.1 sampai L.20.

---

## Gambar L.1 — Kelompok Manual (tab Hardware Proxmox VE)

Tangkapan = tab **Hardware** tiap mesin virtual. Harus terlihat: Processors 1, Memory 2.00 GiB, Hard Disk (scsi0) 40G.

| Urutan | Mesin virtual | VMID | Alamat IP (verifikasi) |
|---:|---|---:|---|
| 1 | `manual-1` | 101 | 192.168.200.82 |
| 2 | `manual-2` | 102 | 192.168.200.84 |
| 3 | `manual-3` | 103 | 192.168.200.85 |
| 4 | `manual-4` | 104 | 192.168.200.86 |
| 5 | `manual-5` | 105 | 192.168.200.87 |
| 6 | `manual-6` | 106 | 192.168.200.88 |
| 7 | `manual-7` | 107 | 192.168.200.89 |
| 8 | `manual-8` | 108 | 192.168.200.90 |
| 9 | `manual-9` | 109 | 192.168.200.91 |
| 10 | `manual-10` | 110 | 192.168.200.92 |

**Caption:** Gambar L.1 Konfigurasi perangkat keras sepuluh mesin virtual kelompok manual (`manual-1` sampai `manual-10`)

---

## Gambar L.2 — Kelompok Portal (keluaran `qm config`)

Tangkapan = keluaran `qm config <vmid>` pada node `pve`. Harus terlihat: `vcpus: 1`, `memory: 2048`, `scsi0: ...,size=40G`, `ipconfig0: ip=dhcp`.

| Urutan | Mesin virtual | VMID |
|---:|---|---:|
| 1 | `PROVE-1` | 100 |
| 2 | `PROVE-2` | 101 |
| 3 | `PROVE-3` | 102 |
| 4 | `PROVE-4` | 103 |
| 5 | `PROVE-5` | 104 |
| 6 | `PROVE-6` | 105 |
| 7 | `PROVE-7` | 106 |
| 8 | `PROVE-8` | 107 |
| 9 | `PROVE-9` | 108 |
| 10 | `PROVE-10` | 109 |

**Caption:** Gambar L.2 Konfigurasi sepuluh mesin virtual kelompok portal melalui `qm config`

---

## Gambar L.3 — Provisioning Batch (keluaran `qm config`)

Tangkapan = keluaran `qm config <vmid>` sepuluh mesin virtual dari satu permintaan batch. Harus terlihat nilai seragam: `vcpus: 1`, `memory: 2048`, `scsi0: ...,size=40G`, `ipconfig0: ip=dhcp`. Lingkungan `Development/UAT`.

| Urutan | Mesin virtual | VMID |
|---:|---|---:|
| 1 | `BULK-01` | 100 |
| 2 | `BULK-02` | 101 |
| 3 | `BULK-03` | 102 |
| 4 | `BULK-04` | 103 |
| 5 | `BULK-05` | 104 |
| 6 | `BULK-06` | 105 |
| 7 | `BULK-07` | 106 |
| 8 | `BULK-08` | 107 |
| 9 | `BULK-09` | 108 |
| 10 | `BULK-10` | 109 |

**Caption:** Gambar L.3 Konfigurasi sepuluh mesin virtual hasil provisioning batch (`BULK-01` sampai `BULK-10`)

Alternatif: kalau kamu lebih suka menampilkan hasilnya sekaligus, satu tangkapan sidebar Inventory yang memuat `BULK-01` sampai `BULK-10` juga sah, dengan caption yang sama.

---

## Catatan
- `qm config` kelompok portal menampilkan `cores: 8` sebagai plafon topologi, sedangkan `vcpus: 1` adalah CPU aktif. Ini sudah dijelaskan di subbab 4.4.3, jadi tidak perlu diulang di lampiran
- Rujukan silang sudah ada di badan: Gambar 4.23 menyebut sembilan Hardware manual lainnya berada di lampiran ini. Pastikan nomor Gambar L.1 yang kamu pakai cocok dengan yang dirujuk
- Jangan menaruh tangkapan proses (dialog Clone, wizard, Resize) di sini, karena sudah menjadi Gambar 4.46 sampai 4.50 di badan
