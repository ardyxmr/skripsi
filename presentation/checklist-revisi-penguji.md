# Checklist Revisi Penguji 1 & 2 (Fokus Bab 1–3)

Status: ✅ selesai · 🟡 sebagian / butuh data · ❌ belum (bisa dikerjakan) · 📄 di luar Bab 1–3 (front matter Word)

---

## BAB 1

### 2. Latar Belakang — Catatan 1 (data kuantitatif besarnya masalah)

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Rata-rata waktu provisioning manual | ✅ | bab1 §1.1: 5–10 menit (standar), 10–20 menit (disk/paket tambahan) |
| Kebutuhan provisioning per bulan | ✅ | 30 tiket (Maret), 90 tiket (April); **Tabel 1.1** |
| Jumlah VM yang dikelola | ✅ | Data lapangan (Bab 1 §1.1): berkisar 700–2.400 mesin virtual (bervariasi antar perusahaan) |
| Jumlah administrator | ✅ | Data lapangan (Bab 1 §1.1): 3–5 administrator; hanya 2 orang membuat VM, sisanya spesialis OS Windows/Linux pasca-pembuatan |
| Tingkat human error | ✅ | Data lapangan ditambahkan (Bab 1 §1.1): 4/30 operasi (Maret) & 12/90 (April) ≈ 13,3%, terpusat di *batch* create+edit |

### 2. Latar Belakang — Catatan 3 (alasan pilih Proxmox)

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Open source | ✅ | bab1 §1.1 paragraf Proxmox |
| REST API | ✅ | "API terbuka" |
| Mendukung Terraform Provider | ✅ | disebut eksplisit |
| Lebih ringan vs OpenStack | ✅ | bonus, sudah ada |
| Banyak dipakai di institusi pendidikan | ✅ | Ditambah kalimat + 3 sitasi terverifikasi: Firmansyah dkk. (2019, Univ. NU Yogyakarta), Kardha dkk. (2020, STMIK AUB), Oleksiuk & Oleksiuk (2021, academic cloud) |

### 3. Rumusan Masalah

| Item diminta | Status | Keterangan |
|---|:---:|---|
| RM no.3 "Sejauh mana..." → pertanyaan penelitian | ✅ | RM3 & RM4 direframe jadi "Bagaimana hasil evaluasi..." — **tetap 4 RM tanpa menambah nomor** (RM1–2 pengembangan, RM3–4 evaluasi) |

### 4. Tujuan Penelitian

| Item diminta | Status | Keterangan |
|---|:---:|---|
| Indikator evaluasi: waktu provisioning | ✅ | Tujuan Khusus 3 (≥50%) |
| Indikator: SUS | ✅ | Tujuan Khusus 4 (≥68) |
| Indikator: konsistensi konfigurasi | ✅ | Tujuan Khusus 3 (100% tanpa drift) |
| Indikator: keberhasilan deployment (success deployment) | ✅ | Ditambahkan ke Tujuan Khusus no.3: "tingkat keberhasilan *deployment* mesin virtual sebesar 100%" |

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
| 12 | Instrumen: stopwatch, SUS, Blackbox checklist, Log System, API Response | ✅ | Lengkap di §3.3.5.b: stopwatch, kuesioner SUS, checklist black box, **log sistem**, **API Response** (dua terakhir ditambahkan) |
| 13 | Teknik Analisis Data (Independent T-Test/Wilcoxon; SUS score; Blackbox = % keberhasilan) | ✅ | **DONE.** Subbab baru **3.3.5.d Teknik Analisis Data**: uji Shapiro-Wilk → *Independent Sample T-Test* / Wilcoxon (efisiensi & konsistensi); skor SUS (usability); persentase keberhasilan (black box) |

---

## KONSISTENSI PENULISAN (Poin 14)

| Item diminta | Status | Keterangan |
|---|:---:|---|
| a. "Virtual" kapital → "virtual" (kecuali awal kalimat) | ✅ | Sudah dinormalkan di bab2 & bab3; bab1 aman (hanya nama produk) |
| b. Istilah Inggris (approval workflow, self-service, hardening) **dicetak miring** & konsisten | ✅ | **DONE.** Istilah asing dimiringkan konsisten di bab1–3: *self-service*, *approval workflow*, *hardening*, *provisioning*, *human error*, *audit trail*, *configuration drift*, *open source*, *black box*, *deployment*, *real-time* + kepanjangan singkatan. Nama produk & heading Title Case tetap tegak |
| c. Kata Pengantar (hal vii–ix) ada 2 versi/pengulangan | 📄 | **User perbaiki sendiri di Word** (front matter, di luar bab1–3.md) |

---

## RINGKASAN AKSI YANG MASIH PERLU DIKERJAKAN

**Sudah selesai 2026-07-03:**
1. ✅ **Poin 13** — subbab **Teknik Analisis Data** (3.3.5.d) ditambahkan.
2. ✅ **Poin 14b** — semua istilah asing dimiringkan konsisten di bab1–3.

3. ✅ **Poin 12** — instrumen **API Response** + log sistem ditambahkan (§3.3.5.b).
4. ✅ **Poin 4** — indikator **keberhasilan deployment** ditambahkan (Tujuan Khusus no.3).

5. ✅ **Catatan 3** — kalimat + 3 sitasi Proxmox di institusi pendidikan ditambahkan.
6. ✅ **Catatan 1 (human error)** — data lapangan 4/30 & 12/90 (≈13,3%) ditambahkan.

7. ✅ **Poin 3** — RM3 & RM4 direframe jadi "Bagaimana hasil evaluasi..." (tetap 4 RM).

**🎉 Semua poin Penguji yang bisa dikerjakan di Bab 1–3 sudah SELESAI.**

8. ✅ **Catatan 1 (skala)** — jumlah VM (700–2.400) & administrator (3–5; hanya 2 pembuat VM) ditambahkan.

**Menyusul / di luar Bab 1–3:**
- 🟡 **Poin 5** — angka manfaat (xx→xx) menyusul dari **Bab IV**.
- 📄 **Poin 14c** — Kata Pengantar (hal vii–ix): **user perbaiki sendiri di Word**.
