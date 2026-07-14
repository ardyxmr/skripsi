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

### 1.a Ruang lingkup waktu (BACA DULU sebelum mengukur)

H1 di `bab2.md` membandingkan **antarmuka aplikasi vs antarmuka Proxmox VE bawaan**, bukan membandingkan jabatan. Karena itu yang masuk uji beda hanya **waktu yang disebabkan oleh alat**, bukan waktu keputusan manusia. Waktu *provisioning* dipecah tiga segmen:

| Segmen | Portal (ExoVirt) | Manual (Proxmox GUI) | Masuk uji H1? |
|---|---|---|:---:|
| **t1** interaksi pengguna | mulai wizard → klik **Submit** | tercakup di `t_manual` | ✅ |
| **t2** tunggu keputusan approval | **Submit → Approve** | tiket/email mengendap di admin | ❌ **dikeluarkan** |
| **t3** eksekusi otomatis | **Approve → status Active** | tercakup di `t_manual` | ✅ |

- **Waktu provisioning portal (angka H1) = t1 + t3.** t2 **tidak** dijumlahkan.
- **Waktu provisioning manual (angka H1) = `t_manual`** = login Proxmox → VM benar-benar jalan, satu blok tanpa jeda.

**Kenapa t2 dikeluarkan (siapkan jawaban ini untuk penguji):**

1. **Approval ada di kedua alur.** Pada proses manual approval tetap terjadi lewat tiket/email ke administrator (lihat `bab1.md` latar belakang + PIECES *Service* di `bab3.md`), hanya saja informal dan tidak terekam. Portal tidak menambah langkah. Portal **memformalkan** approval yang tadinya tak tercatat menjadi tercatat di audit trail.
2. **Approval variabel tata kelola (RM2), bukan efisiensi (RM1).** Lamanya bergantung pada kapan *approver* membuka portal, bukan pada kualitas sistem. Memasukkannya ke uji beda sama saja mengukur ketersediaan manusia.
3. **Mengeluarkan t2 bersifat konservatif, justru menguntungkan manual.** Waktu tunggu nyata alur manual berjam-jam sampai berhari-hari (120 tiket / 2 bulan / 2 admin pembuat VM, lihat `bab1.md` Tabel 1.1). Angka 5–20 menit itu **waktu kerja admin**, bukan waktu tunggu pengguna. Dengan mengeluarkan waktu tunggu dari **kedua** sisi, manual diberi skenario terbaiknya dan portal tetap menang.

> **t2 tetap dicatat**, tapi dilaporkan **deskriptif** di Bab IV bagian tata kelola (RM2), bukan di uji beda §4.3.

### 1.b Penugasan aktor (asimetris dengan sengaja: ini temuan, bukan cacat)

| Arm | Aktor | Alasan |
|---|---|---|
| **Portal** | **User (Requestor)** biasa, admin hanya meng-*approve* | sesuai klaim *self-service*; ini pengguna paling awam |
| **Manual** | **Admin** ber-hak-akses penuh di Proxmox GUI | di alur manual **hanya** admin yang bisa; ini skenario **terbaik** manual |

Catat di Bab IV: pengguna biasa **tidak dapat sama sekali** melakukan *provisioning* manual karena tidak punya hak akses Proxmox, sehingga waktunya bukan lambat melainkan **tak terhingga**. Portal membuat tugas itu menjadi mungkin. Mengadu portal-pengguna-awam melawan manual-admin-ahli berarti pengujian sudah dicondongkan ke pihak manual, dan itu memperkuat kesimpulan.

**Ukuran sampel:** ulang **≥ 10 percobaan** untuk kondisi yang sama (1 VM) di portal, dan **≥ 10** untuk manual. Sepuluh angka per kelompok cukup untuk uji Shapiro-Wilk → T-Test/Wilcoxon.
**(Opsional, memperkuat H1 "O(1) vs O(N)"):** ukur juga batch **N = 1, 5, 10** → tunjukkan jumlah langkah pengguna portal ~tetap saat N naik, sedangkan manual naik linear.
**(Opsional, robustness):** arm tambahan **admin portal yang self-approve vs admin Proxmox GUI**. Aktor dan hak akses identik, approval hilang dari dua sisi, jadi murni mengukur gain otomatisasi. Pakai kalau waktu cukup; desain utama sudah sah tanpa ini.

### 1.c Langkah per percobaan — PORTAL

1. *Login* ke portal sebagai **User (Requestor)**.
2. Buka wizard **Request VM** → isi: Environment → Provider → Node → Catalog → Nama VM → Jumlah → Tier → Network → Datastore → halaman **Review** (lihat Total CPU/RAM/Disk) → **Submit**.
   - **Hitung jumlah langkah/klik pengguna** dari wizard terbuka sampai Submit.
   - **Catat t1**: stopwatch mulai saat wizard terbuka, stop saat klik Submit.
3. Admin lakukan **Approve** di menu Approvals. **Hitung langkah admin terpisah**, jangan dicampur ke langkah pengguna.
4. Tunggu sampai VM berstatus **Active** di **Inventory**.
5. Ambil **t2** dan **t3** dari **timestamp Audit Trail** (lebih objektif daripada stopwatch):
   - `t2` = waktu baris `approved` − waktu baris `created/submitted`
   - `t3` = waktu status `Active` − waktu baris `approved`
6. Hitung **t1 + t3**. Angka inilah yang masuk uji beda.

### 1.d Langkah per percobaan — MANUAL (Proxmox VE GUI)

Protokol identik, variabel kontrol sama (template, tier, network, datastore, pola nama).

1. *Login* ke Proxmox VE GUI sebagai **admin**. **Stopwatch mulai.**
2. Clone template → isi nama/VMID → set CPU/RAM/Disk sesuai tier → set network + datastore → konfigurasi cloud-init (user, password, IP) → **Start** VM.
3. **Stopwatch stop** saat VM benar-benar **jalan** (status running + bisa di-*login*), bukan saat tombol Start diklik.
4. **Hitung jumlah langkah/klik** sepanjang no. 2.
5. Angka ini = **`t_manual`**, langsung masuk uji beda.

> ⚠️ **Titik stop wajib sama makna di kedua arm: "VM siap dipakai".** Portal = status `Active` di Inventory. Manual = VM running + dapat di-*login*. Jangan stop di "tombol sudah diklik".

**Tabel pencatatan (portal):**

| Trial | Langkah user | Langkah admin (approve) | t1 interaksi (dtk) | t3 eksekusi (dtk) | **t1+t3 → uji H1** (dtk) | t2 tunggu approval (dtk, deskriptif) |
|------:|-------------:|------------------------:|-------------------:|------------------:|-------------------------:|-------------------------------------:|
| 1 | | | | | | |
| … | | | | | | |
| 10 | | | | | | |
| **Rata-rata** | | | | | | |

**Tabel pencatatan (manual):**

| Trial | Jumlah langkah | `t_manual` login → VM jalan (dtk) |
|------:|---------------:|----------------------------------:|
| 1 | | |
| … | | |
| 10 | | |
| **Rata-rata** | | |

> Kolom **`t1+t3`** (portal) vs kolom **`t_manual`** (manual) adalah dua kelompok yang masuk **Shapiro-Wilk → T-Test/Wilcoxon**. Kolom **t2 tidak ikut**.

**Screenshot bukti yang HARUS diambil:**
- [ ] Tiap langkah wizard (minimal: halaman Review dengan Total CPU/RAM/Disk)
- [ ] Menu Approvals saat Approve
- [ ] Inventory menampilkan VM **Active** + kolom waktu
- [ ] Audit Trail baris `created` → `approved` → `provisioned/Active` (bukti timestamp objektif untuk t2 & t3)
- [ ] **Manual:** tiap dialog Proxmox (clone, hardware, cloud-init, start) + VM status running

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
- **4.3 Efisiensi (H1):** dua kelompok = **`t1+t3` (portal)** vs **`t_manual`** → **Shapiro-Wilk** → **Independent T-Test** (normal) / **Wilcoxon** (tidak normal). Sertakan tabel jumlah langkah (user vs admin). **`t2` tidak masuk uji.** Terraform CLI (jurnal) di pembahasan.
- **4.4 Konsistensi (H2):** % kesesuaian Portal vs Manual → uji beda bila datanya numerik cukup, atau paparan deskriptif + tabel.
- **4.5 Kebergunaan (H3):** skor SUS + kategori.
- **4.6 Tata kelola (RM2, deskriptif):** laporkan **`t2` (waktu tunggu approval)** di sini sebagai karakteristik *approval workflow* + bukti audit trail. Tegaskan approval juga ada di alur manual namun informal dan tak terekam, sehingga portal memformalkan, bukan menambah, langkah tersebut.
- **4.7 Pembahasan:** kaitkan tiap hasil ke Rumusan Masalah 1–4 + keputusan H0/H1. Cantumkan **batasan ruang lingkup waktu** (§1.a): waktu tunggu keputusan manusia dikeluarkan dari kedua kelompok, dan pengeluaran itu konservatif karena menguntungkan alur manual.

> Alat bantu uji statistik: SPSS / Jamovi / Python (scipy `shapiro`, `ttest_ind`, `wilcoxon`) — **screenshot output ujinya juga** sebagai bukti.
