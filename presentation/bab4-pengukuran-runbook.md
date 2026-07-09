# Runbook Pengukuran Data — Web Portal (untuk Bab IV)

Panduan langkah demi langkah untuk **mengukur data nyata** portal ExoVirt + **screenshot bukti** yang harus diambil. Mengikuti rancangan pengujian `bab3.md §3.3.5` (efisiensi, konsistensi, kebergunaan/SUS, fungsional black box).

**Tiga sumber data perbandingan:**
| Metode | Status data | Peran di Bab IV |
|---|---|---|
| **Web Portal (ExoVirt)** | 🔴 diukur di runbook INI | kelompok utama |
| **Manual (Proxmox VE GUI)** | 🟢 kamu sudah punya (data lapangan) | pembanding uji statistik |
| **Terraform CLI** | 🟢 dari jurnal | rujukan **pembahasan** (bukan uji statistik — beda lingkungan/hardware) |

> ⚠️ **Catatan integritas (penting):** uji beda statistik (T-Test/Wilcoxon) hanya sah antara **dua kelompok yang kamu ukur sendiri dengan protokol sama** → **Portal vs Manual**. Angka Terraform CLI dari jurnal dipakai sebagai **konteks/pembanding deskriptif** di pembahasan, bukan dimasukkan ke uji beda. Kalau data manual lamamu berupa *estimasi lapangan* (5–20 mnt), sebaiknya ukur ulang manual dengan protokol identik di bawah supaya benar-benar apple-to-apple; data tiket lapangan tetap dipakai di Bab I (besaran masalah), bukan di sini.

---

## 0. Persiapan (sekali di awal)

- **Dokumentasikan lingkungan uji** (untuk reproducibility di Bab IV): provider Proxmox (Jakarta/Lampung), node, spek host (CPU/RAM), template katalog yang dipakai, versi Proxmox VE.
- **Kunci variabel kontrol** (WAJIB sama di semua percobaan & di kedua metode):
  - Template/katalog sama (mis. Ubuntu Server)
  - Tier sama → CPU/RAM/Disk identik (mis. 2 vCPU / 4 GB / 60 GB)
  - Environment, network, datastore sama
  - Pola nama VM konsisten (mis. `UJI-01`, `UJI-02`, …)
- **Alat:** timer HP/stopwatch **atau** (lebih objektif) pakai timestamp sistem sendiri (Inventory/Audit `created_at` → status `Active`). Tool screenshot.
- **Folder bukti:** `presentation/bukti/{efisiensi,konsistensi,sus,blackbox}/` — simpan screenshot ber-nomor rapi (mis. `efisiensi-portal-trial01-wizard.png`).

---

## 1. EFISIENSI — waktu & jumlah langkah  ·  (Hipotesis 1)

**Yang diukur:** (a) waktu proses *provisioning*, (b) jumlah langkah/klik pengguna.
**Indikator target (bab3):** penurunan waktu ≥ 50% + langkah berkurang vs manual.

**Ukuran sampel:** ulang **≥ 10 percobaan** untuk kondisi yang sama (1 VM) di portal, dan **≥ 10** untuk manual. Sepuluh angka per kelompok cukup untuk uji Shapiro-Wilk → T-Test/Wilcoxon.
**(Opsional, memperkuat H1 "O(1) vs O(N)"):** ukur juga batch **N = 1, 5, 10** → tunjukkan jumlah langkah pengguna portal ~tetap saat N naik, sedangkan manual naik linear.

**Langkah (per percobaan, portal):**
1. *Login* ke portal.
2. Buka wizard **Request VM** → isi: Environment → Provider → Node → Catalog → Nama VM → Jumlah → Tier → Network → Datastore → halaman **Review** (lihat Total CPU/RAM/Disk) → **Submit**. **Hitung jumlah langkah/klik** dari mulai wizard sampai Submit.
3. Admin lakukan **Approve** di menu Approvals.
4. Tunggu sampai VM berstatus **Active** di **Inventory**.
5. **Catat dua waktu** (pisahkan, karena approval bersifat async):
   - **Waktu interaksi pengguna** = mulai wizard → klik Submit.
   - **Waktu total** = Submit → status Active (pakai timestamp Inventory/Audit agar objektif).

**Tabel pencatatan (portal):**

| Trial | Jumlah langkah | Waktu interaksi (dtk) | Waktu total → Active (dtk) |
|------:|---------------:|----------------------:|---------------------------:|
| 1 | | | |
| … | | | |
| 10 | | | |
| **Rata-rata** | | | |

**Screenshot bukti yang HARUS diambil:**
- [ ] Tiap langkah wizard (minimal: halaman Review dengan Total CPU/RAM/Disk)
- [ ] Menu Approvals saat Approve
- [ ] Inventory menampilkan VM **Active** + kolom waktu
- [ ] Audit Trail baris `created` → `provisioned/Active` (bukti timestamp objektif)

> Lakukan **hal yang sama untuk Manual (Proxmox GUI)** dengan protokol identik → tabel manual terpisah. Dua tabel ini yang masuk uji beda.

---

## 2. KONSISTENSI KONFIGURASI  ·  (Hipotesis 2)

**Yang diukur:** % VM yang konfigurasinya **sesuai spec (tanpa *configuration drift*)**.
**Indikator target (bab3):** kesesuaian 100%.

**Langkah:**
1. *Provision* **K VM** (mis. 10) via portal dengan **spec identik**.
2. Untuk tiap VM, periksa konfigurasi **aktual** (CPU, RAM, Disk, Network, status *hardening*) di **Proxmox** (tab Hardware) atau **detail Inventory**.
3. Cocokkan ke **checklist spec**. Tandai Sesuai / Tidak per parameter.

**Tabel checklist:**

| VM | CPU | RAM | Disk | Network | Hardening | Sesuai spec? |
|----|:---:|:---:|:----:|:-------:|:---------:|:------------:|
| UJI-01 | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ |
| … | | | | | | |
| **% Sesuai** | | | | | | |

**Screenshot bukti:**
- [ ] Konfigurasi aktual tiap VM (Proxmox Hardware / detail Inventory)
- [ ] Tabel checklist terisi
- [ ] (Pembanding) contoh VM manual yang *drift* bila ada

---

## 3. KEBERGUNAAN — SUS  ·  (Hipotesis 3)

**Yang diukur:** skor **System Usability Scale** 0–100.
**Indikator target (bab3):** SUS ≥ 68 (kategori *acceptable*). **n ≥ 5 responden** (idealnya pengguna non-teknis, sesuai klaim *self-service*).

**Langkah:**
1. Tiap responden diminta menyelesaikan **satu tugas nyata** (mis. *provision* 1 VM lewat portal).
2. Isi **kuesioner SUS** 10 butir, skala Likert 1–5.
3. Hitung skor per responden dengan **rumus baku**: butir **ganjil** → (nilai − 1); butir **genap** → (5 − nilai); jumlahkan lalu **× 2,5** → skor 0–100.
4. Rata-ratakan seluruh responden → skor SUS akhir + kategori.
5. *(Opsional H3 pembanding)*: minta responden juga coba **Proxmox GUI** + isi SUS-nya → bandingkan.

**Tabel jawaban & skor:**

| Responden | Q1 | Q2 | … | Q10 | Skor SUS |
|-----------|:--:|:--:|:-:|:---:|---------:|
| R1 | | | | | |
| … | | | | | |
| **Rata-rata** | | | | | |

**Screenshot bukti:**
- [ ] Formulir kuesioner (mis. Google Form)
- [ ] Rekap jawaban mentah tiap responden
- [ ] Perhitungan skor SUS

---

## 4. FUNGSIONAL — Black Box

**Yang diukur:** **% skenario lolos** (kesesuaian input↔output).

**Langkah:** untuk tiap fitur, definisikan skenario → jalankan → catat output aktual → Lolos/Gagal. Cakup: Request, Approval, Provisioning (Terraform), Hardening (Ansible), Inventory & lifecycle (renew/resize/add-disk/delete), IAM (user/role/group), Discovery, Policy/Environment, Catalog/Network/Datastore/Tier.

**Tabel:**

| No | Fitur | Skenario | Input | Output diharapkan | Output aktual | Status |
|---:|-------|----------|-------|-------------------|---------------|:------:|
| 1 | Request VM | Ajukan VM valid | … | Tersimpan, status Pending | | ✅/❌ |
| … | | | | | | |
| | | | | | **% Lolos** | |

**Screenshot bukti:** input + hasil/kondisi akhir tiap skenario.

---

## 5. Alur data → Bab IV

- **4.2 Fungsional:** tabel black box + **% keberhasilan**.
- **4.3 Efisiensi (H1):** tabel Portal vs Manual → **Shapiro-Wilk** → **Independent T-Test** (normal) / **Wilcoxon** (tidak normal). Terraform CLI (jurnal) di pembahasan.
- **4.4 Konsistensi (H2):** % kesesuaian Portal vs Manual → uji beda bila datanya numerik cukup, atau paparan deskriptif + tabel.
- **4.5 Kebergunaan (H3):** skor SUS + kategori.
- **4.6 Pembahasan:** kaitkan tiap hasil ke Rumusan Masalah 1–4 + keputusan H0/H1.

> Alat bantu uji statistik: SPSS / Jamovi / Python (scipy `shapiro`, `ttest_ind`, `wilcoxon`) — **screenshot output ujinya juga** sebagai bukti.
