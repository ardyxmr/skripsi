# Status Keseluruhan Skripsi ExoVirt

_Terakhir diperbarui: 2026-07-03_

Status: ✅ selesai · 🟡 sebagian (menunggu Bab IV) · ⬜ belum dikerjakan

---

## 1. Revisi Dosen Penguji (Bab 1–3)

| # | Yang diminta dosen | Status | Lokasi |
|---|--------------------|:------:|--------|
| Catatan 1 | Data kuantitatif masalah (waktu manual, tiket/bulan, human error, jumlah VM, jumlah admin) | ✅ | Bab 1 §1.1 + Tabel 1.1 |
| Catatan 3 | Alasan pilih Proxmox (open source, REST API, Terraform provider, institusi pendidikan) | ✅ | Bab 1 §1.1 + 3 sitasi |
| 3 | Rumusan Masalah no.3 (frasa evaluasi → pertanyaan penelitian) | ✅ | Bab 1 §1.2 (RM3 & RM4) |
| 4 | Indikator evaluasi di Tujuan (+ keberhasilan deployment) | ✅ | Bab 1 §1.4.2 |
| 5 | Manfaat dibuat spesifik/terukur | 🟡 | angka xx→xx keluar dari Bab IV |
| 10 | Tambah Deployment Diagram | ✅ | Bab 3 (Gambar 3.12) + SVG |
| 11 | Tabel Variabel Penelitian | ✅ | Bab 3 (Tabel 3.4) |
| 12 | Instrumen (stopwatch, SUS, black box, log, API Response) | ✅ | Bab 3 §3.3.5.b |
| 13 | Teknik Analisis Data (T-Test/Wilcoxon, SUS, %) | ✅ | Bab 3 §3.3.5.d |
| 14a | Konsistensi: kapital "virtual" | ✅ | Bab 2 & 3 |
| 14b | Konsistensi: italic istilah asing | ✅ | Bab 1–3 |

Detail lengkap: `presentation/checklist-revisi-penguji.md`

---

## 2. Sudah Dikerjakan (ringkas)

- Bab 1–3: revisi sidang + revisi Penguji 1 & 2 **tuntas**.
- Reformat ke **markdown seragam** (heading, baris kosong antar-paragraf, tabel markdown, italic istilah asing) gaya `existing-ch-3-v2.md`.
- 2 diagram **SVG** dibuat: `diagram-3-2-usecase.svg` (Use Case) & `diagram-3-12-deployment.svg` (Deployment).
- 3 sitasi Proxmox di institusi pendidikan **terverifikasi** vs file `journal/`: Firmansyah dkk. (2019), Kardha dkk. (2020), Oleksiuk & Oleksiuk (2021).

---

## 3. Pending — Teknis Project

### Wajib untuk Bab IV (menghasilkan angka nyata)
- ⬜ Jalankan **eksperimen evaluasi**: benchmark efisiensi (manual vs aplikasi), uji konsistensi konfigurasi, hitung human error aplikasi, sebar **kuesioner SUS**, pengujian **black box**.
- ⬜ Tulis **Bab IV** (hasil + pembahasan, menjawab tiap Rumusan Masalah).
- ⬜ Tulis **Bab V** (kesimpulan + Future Work: queue scaling / Horizon).

### Future Work / opsional (tidak wajib untuk skripsi)
- ⬜ Deploy via **Docker/Podman** (path terkontainer).
- ⬜ **VM power control** Start/Stop (env-bound `allow_power_control`).
- ⬜ Checklist **prod-hardening**: APP_DEBUG=false, Reverb origins lock, Proxmox CA pinning, Redis requirepass, rotasi kredensial seed, nginx security headers, artefak systemd/nginx/TLS.
- ⬜ Template **Ubuntu24-lvm** opsional; **full Horizon** queue.
- ⬜ Cluster ke-2 (Lampung): perbaikan sisi Proxmox (token Datastore.Audit + bridge vmbr0).
