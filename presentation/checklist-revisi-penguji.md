# Checklist Revisi Penguji 1 & 2 (Fokus Bab 1–3)

Status: ✅ selesai · 🟡 sebagian / butuh data · ❌ belum (bisa dikerjakan) · 📄 di luar Bab 1–3 (front matter Word)

---

## BAB 1

### 2. Latar Belakang — Catatan 1 (data kuantitatif besarnya masalah)

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Rata-rata waktu provisioning manual | ✅ | bab1 §1.1: 5–10 menit (standar), 10–20 menit (disk/paket tambahan) |
| Kebutuhan provisioning per bulan | ✅ | 30 tiket (Maret), 90 tiket (April); **Tabel 1.1** |
| Jumlah VM yang dikelola | ❌ | Belum ada. **Butuh data lapangan dari kamu** |
| Jumlah administrator | ❌ | Belum ada. **Butuh data lapangan dari kamu** |
| Tingkat human error | 🟡 | Baru kualitatif. Angka rate belum ada di data/jurnal → butuh data lapangan atau pakai proxy konsistensi |

### 2. Latar Belakang — Catatan 3 (alasan pilih Proxmox)

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Open source | ✅ | bab1 §1.1 paragraf Proxmox |
| REST API | ✅ | "API terbuka" |
| Mendukung Terraform Provider | ✅ | disebut eksplisit |
| Lebih ringan vs OpenStack | ✅ | bonus, sudah ada |
| Banyak dipakai di institusi pendidikan | ❌ | Belum ada. Perlu 1 kalimat + **sitasi pendukung** |

### 3. Rumusan Masalah

| Item diminta | Status | Keterangan |
|---|:---:|---|
| RM no.3 "Sejauh mana..." dipisah jadi (a) pengembangan sistem & (b) hasil evaluasi | ❌ | **Belum**. RM3 masih berupa pertanyaan evaluasi. Perlu keputusan restrukturisasi rumusan masalah |

### 4. Tujuan Penelitian

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Indikator evaluasi: waktu provisioning | ✅ | Tujuan Khusus 3 (≥50%) |
| Indikator: SUS | ✅ | Tujuan Khusus 4 (≥68) |
| Indikator: konsistensi konfigurasi | ✅ | Tujuan Khusus 3 (100% tanpa drift) |
| Indikator: keberhasilan deployment (success deployment) | 🟡 | Belum eksplisit sebagai indikator → tinggal ditambah |

### 5. Manfaat Penelitian

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Manfaat dibuat spesifik/terukur (mis. "dari xx menit → xx menit", "kurangi manual xx%") | 🟡 | Sudah diarahkan ke terukur, tapi **angka xx→xx menyusul dari Bab IV** (belum bisa diisi sekarang) |

---

## BAB 3

| No | Item diminta | Status | Keterangan |
|---|---|:---:|---|
| 10 | Tambah Deployment Diagram | ✅ | Gambar 3.12 + SVG `diagram-3-12-deployment.svg` |
| 11 | Tabel Variabel Penelitian | ✅ | **Tabel 3.4** (Efisiensi/Konsistensi/Human Error/Usability + indikator + instrumen + skala) |
| 12 | Instrumen: stopwatch, SUS, Blackbox checklist, Log System, API Response | 🟡 | stopwatch ✅ · SUS ✅ · Blackbox ✅ · Log sistem ✅ · **API Response ❌ belum disebut** |
| 13 | Teknik Analisis Data (Independent T-Test/Wilcoxon; SUS score; Blackbox = % keberhasilan) | ❌ | **Belum ada subbab khusus.** Sekarang hanya tertulis "dianalisis secara statistik" tanpa menyebut ujinya. **Perlu ditambah** |

---

## KONSISTENSI PENULISAN (Poin 14)

| Item diminta | Status | Keterangan |
|---|:---:|---|
| a. "Virtual" kapital → "virtual" (kecuali awal kalimat) | ✅ | Sudah dinormalkan di bab2 & bab3; bab1 aman (hanya nama produk) |
| b. Istilah Inggris (approval workflow, self-service, hardening) **dicetak miring** & konsisten | ❌ | **BELUM & BENTROK dgn pilihan kita.** Penguji minta istilah umum ini **dimiringkan**. Pilihan italic kita tadi HANYA memiringkan singkatan → **perlu ganti ke "miringkan semua istilah asing"** |
| c. Kata Pengantar (hal vii–ix) ada 2 versi/pengulangan | 📄 | Di file Word (front matter), bukan di bab1–3.md → **tugas kamu di Word** |

---

## RINGKASAN AKSI YANG MASIH PERLU DIKERJAKAN

**Bisa saya kerjakan sekarang (Bab 1–3):**
1. ❌ **Poin 13** — tambah subbab **Teknik Analisis Data** di Bab 3 (Independent T-Test/Wilcoxon utk efisiensi & konsistensi; SUS score; Blackbox = % keberhasilan).
2. ❌ **Poin 14b** — ubah kebijakan italic → **miringkan semua istilah asing** (self-service, approval workflow, hardening, dll.) di bab1–3.
3. 🟡 **Poin 12** — tambahkan **API Response** sebagai instrumen.
4. 🟡 **Poin 4** — tambahkan indikator **keberhasilan deployment**.
5. ❌ **Catatan 3** — tambah kalimat "Proxmox banyak dipakai di institusi pendidikan" + sitasi.
6. ❌ **Poin 3** — restrukturisasi **Rumusan Masalah no.3** (pisah pengembangan vs evaluasi) — **perlu keputusan kamu dulu**.

**Butuh data/keputusan dari kamu:**
7. 🟡 **Catatan 1** — angka **jumlah VM dikelola**, **jumlah administrator**, **rate human error** (data lapangan; jangan dikarang).
8. 🟡 **Poin 5** — angka spesifik manfaat (xx→xx) menyusul dari **Bab IV**.
9. 📄 **Poin 14c** — periksa duplikasi Kata Pengantar di Word.
