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

  **✅ TERISI 2026-07-15** (terbaca dari screenshot console manual-9):

  | Item | Nilai | Bukti |
  |---|---|---|
  | **Versi Proxmox VE** | **9.1.11** | header GUI |
  | **Node** | `pve` (Datacenter → pve) | sidebar |
  | **Template dipakai** | **`rhel10-cloud` (VMID 9003)** | sidebar |
  | Peta VMID template | 9000 `rocky10-cloud` · 9001 `ubuntu26-cloud` · 9002 `fedora44-cloud` · **9003 `rhel10-cloud`** · 9004 `winserver2022` | sidebar |
  | Datastore | `local` · `local-lvm` · `vmdata` | sidebar |
  | VM uji manual | `manual-1`..`manual-10` = **VMID 101–110** | sidebar |
  | ⬜ Spek host (CPU/RAM) | **belum dicatat** — ambil dari pve → Summary | — |
- **Kunci variabel kontrol** (WAJIB sama di semua percobaan & di kedua metode):
  - **Template/katalog sama → `RHEL`** (2026-07-14). Rocky dibuang: template Jakarta-nya ter-resize permanen ke 40 GB karena salah sasaran → Insiden #2 §2b. Ubuntu dibuang: *base image* **3584M = 3,5 GiB** → increment jadi **36,5** (pecahan, di kolom yang sudah terbukti menjebak). **RHEL bawaan 10 GB → increment +30 → 40 GB, bulat.**
  - **Tier sama → CPU/RAM/Disk identik.** Dipakai: **Bronze** (`disk_gb` = 40).
  - ✅ **CPU/RAM template RHEL = identik dengan Rocky = spek Bronze** (diverifikasi 2026-07-14) → **tidak ada langkah setel CPU/RAM**. Tulis alasannya di Bab IV: template disamakan dengan spesifikasi tier Bronze, bukan kelalaian pengukuran.
  - ✅ **Cloud-init RHEL identik dengan Rocky** (diverifikasi 2026-07-14) → Upgrade packages diperlakukan sama (uncheck, langkah 12–14). ⚠️ **Khusus RHEL:** kalau ternyata boot pertama menggantung, curigai `dnf upgrade` tanpa langganan aktif — hentikan dan kabari, jangan dipaksa masuk tabel.
  - ➡️ **Konsekuensi: alur manual = 23 langkah, persis lembar hitung §1.d.** Hanya nama template yang berubah.
  - ✅ Kunci `exovirt-ansible` + katalog: keempat template Linux Jakarta sudah di-bake 2026-07-13 [[hardening-key-rollout-templates]], RHEL termasuk.
  - **Clone mode = Full Clone** di manual. Portal memaku `full_clone = true` (`backend/storage/app/master-provisioning/terraform/main.tf:9`). ⚠️ Link Clone nyaris instan (cuma lapisan diff) — memakainya di manual = mengadu jalan pintas lawan salinan penuh, hasil uji jadi tidak sah.
  - **IP = DHCP** di kedua metode (sudah diverifikasi pada cloud-init VM buatan portal, 2026-07-14).
  - Environment, network, datastore sama
  - Pola nama VM konsisten (mis. `UJI-01`, `UJI-02`, …)
- **Alat:** timer HP/stopwatch **atau** (lebih objektif) pakai timestamp sistem sendiri (Inventory/Audit `created_at` → status `Active`). Tool screenshot.
- **Satuan waktu: DETIK saja** untuk semua trial. Uji statistik butuh satu satuan; konversi menit-detik di 10 baris tabel = sumber salah hitung.

> ⚠️ **JEBAKAN PROXMOX #1 — Resize itu INCREMENT (kena 2026-07-14):** dialog Disk Action → Resize isinya **Size Increment (GiB)**, BUKAN ukuran akhir. Template 10 GB + isi `40` → hasilnya **50 GB**, bukan 40. Cek tab Hardware setelah clone untuk memastikan angkanya benar. Portal tidak punya jebakan ini: pengguna memilih tier, Terraform menulis 40 GB langsung.
>
> ⚠️ **JEBAKAN PROXMOX #2 — salah sasaran resize (kena 2026-07-14):** **PASTIKAN kamu berdiri di VM CLONE, bukan di TEMPLATE**, sebelum menyentuh tab Hardware. Cek nama + VMID di panel kiri. Proxmox tidak memperingatkan, tidak bertanya, tidak ada undo — **disk TIDAK BISA dikecilkan** (GUI tak punya opsi, `qm resize` menolak, dan shrink di lapisan storage `lvreduce`/`zfs set volsize`/`qemu-img --shrink` memotong blok data → template rusak). Satu klik di baris yang salah = template hangus permanen dan **setiap VM turunannya ikut kena**.

> ℹ️ **Kenapa template rusak tidak bisa "diperbaiki" begitu saja:** akun `sysuser` + `sysadmin` + kunci `exovirt-ansible` semuanya **di dalam disk** (hasil virt-customize), bukan di config VM. Hapus disk + import cloud image baru = ketiganya lenyap → portal tak bisa deploy + hardening patah → wajib bake ulang. Detach lalu re-attach **tidak menolong**: itu operasi config, volume-nya tetap seukuran semula.
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

> 🔒 **TITIK MASUK = MENU CATALOG, bukan menu Provisioning** (keputusan 2026-07-15, **sebelum** arm portal diukur).
> **Alasan utama — `bab3.md:147` sudah mendeskripsikan alurnya:** *"proses provisioning dimulai ketika pengguna **memilih layanan yang tersedia** dan mengisi formulir permintaan mesin virtual"*. Pilih layanan dulu, baru isi formulir. Itu jalur katalog, dan itulah alur pada Gambar 3.3. Mengukur jalur lain = mengukur sesuatu yang tidak pernah dideskripsikan naskah.
> **Alasan pendukung — padanan struktural dengan manual:** di manual, satu tindakan klik-kanan pada template RHEL sudah sekaligus menentukan image + node + provider; admin tidak memilih node secara terpisah. Jalur katalog bekerja identik.
>
> **Yang SEBENARNYA otomatis (dibaca dari kode, jangan dari asumsi):** `Catalog.jsx:93` hanya mengoper `{ catalogId, tierId }`. Blok rekonsiliasi `VmRequest.jsx:118-146` menurunkan sisanya, **tetapi baris 120 menunggu `environmentId` terisi lebih dulu** (perlu allow-list kebijakan environment).
>
> | Field | Status di jalur katalog |
> |---|---|
> | Environment | ⌨️ **tetap dipilih manual** (rekonsiliasi menunggunya) |
> | Provider · Node · Catalog · Tier | ✅ otomatis (`VmRequest.jsx:137-144`), **hanya bila kebijakan env mengizinkan** (`providerOk && node`) |
> | Network · Datastore | ⌨️ **tetap manual** — tidak ada `setNetworkId`/`setDatastoreId` di blok rekonsiliasi |
> | Nama VM · Jumlah · disk (opsional) | ⌨️ manual |
>
> ➡️ Jalur katalog memangkas **4 pemilihan**, bukan seluruhnya.
>
> ⚠️ **KESEPULUH TRIAL WAJIB MEMAKAI TITIK MASUK YANG SAMA.** Trial 1–5 lewat katalog lalu 6–10 lewat menu provisioning = jumlah langkah berubah di tengah seri = penyakit yang sama dengan yang membunuh seri Rocky. Pilih satu, umumkan di Bab IV, konsisten sampai trial ke-10.
>
> ℹ️ Pilihan ini nyaris tidak mengubah kesimpulan: `t3` mendominasi waktu (selisih `t1` antar-jalur hanya ±20 dtk), dan untuk langkah katalog ≈8 vs menu penuh ≈12, keduanya jauh di bawah manual 23. Yang dibeli di sini adalah **kemampuan bertahan saat diuji**, bukan angka.

1. *Login* ke portal sebagai **User (Requestor)**. **TIDAK dihitung** (waktu maupun langkah) — sama seperti manual, lihat §1.e.
2. Buka menu **Catalog** → klik kartu katalog **RHEL** ⏱️ *(stopwatch `t1` MULAI di sini — setara "klik kanan template" pada manual)* → wizard terbuka → isi: Environment → *(provider/node/catalog/tier terisi otomatis — **verifikasi**, jangan diasumsikan)* → Nama VM → **Jumlah = 1** → Network → Datastore → halaman **Review** (lihat Total CPU/RAM/Disk) → **Submit**.
   - **Hitung jumlah langkah/klik pengguna** dari wizard terbuka sampai Submit.
   - **Catat t1**: stopwatch mulai saat wizard terbuka, stop saat klik Submit.
3. Admin lakukan **Approve** di menu Approvals. **Hitung langkah admin terpisah**, jangan dicampur ke langkah pengguna.
4. Tunggu sampai VM berstatus **Active** di **Inventory**.
5. Ambil **t2** dari **timestamp Audit Trail**: `t2` = waktu baris **`APPROVE_REQUEST`** − waktu baris **`CREATE_PROVISION_REQUEST`**.
   - Action `APPROVE_REQUEST` dirakit dinamis di `ApprovalWorkflowService.php:47` (`strtoupper($action).'_REQUEST'`), karena itu tidak muncul saat mencari string literal `'APPROVE_REQUEST'` di kode. **Barisnya ADA** — terbukti pada log prod 2026-07-14: `20:35:01 budi CREATE_PROVISION_REQUEST` → `20:35:21 ani APPROVE_REQUEST` → `20:36:31 budi CREATE_VM`.
   - ⚠️ Log admin **tanpa** baris `APPROVE_REQUEST` bukan berarti fiturnya tidak ada: admin melewati approval (bypass). Pada arm portal, aktor = **User (Requestor)**, penyetuju = orang lain, jadi barisnya pasti terbit.
6. **`t3` = stopwatch dari klik Approve sampai IP muncul di Proxmox Summary.** Setelah klik Approve, pindah ke Proxmox, tunggu VM barunya muncul, buka **Summary**, hentikan stopwatch saat IP terbaca. **Prosedur dan layarnya sama persis dengan manual.**
   - **Pakai stopwatch, JANGAN mengurangkan timestamp audit.** Versi sebelumnya menulis `t3` = (IP muncul) − (timestamp `APPROVE_REQUEST`), yang memaksa pencatatan **jam dinding** saat IP muncul — merepotkan bila diulang 10×. Selisih antara klik Approve dan baris audit hanya latensi jaringan (milidetik), tidak berarti. **Bonusnya: `t3` jadi diukur dengan alat yang sama seperti `t_manual`** — stopwatch dan mata — bukan campuran stopwatch dan timestamp server.
   - Audit tetap dipakai untuk **`t2`**, dan itu tepat: `t2` murni waktu tunggu manusia dan toh dikeluarkan dari uji beda.

**📺 Pembagian layar (arm portal memakai DUA layar — ini disengaja):**

| Segmen | Diukur di | Cara |
|---|---|---|
| `t1` | **ExoVirt** saja | stopwatch: klik kartu katalog → klik Submit |
| `t2` | **Audit Trail ExoVirt** | `APPROVE_REQUEST` − `CREATE_PROVISION_REQUEST` |
| `t3` | mulai ExoVirt, **berhenti di Proxmox** | stopwatch: klik Approve → IP muncul di Proxmox Summary |

Proxmox dipakai **hanya untuk titik berhentinya**, justru supaya identik dengan kelompok manual (yang juga berhenti saat IP muncul di layar Proxmox). Layar sama, mekanisme guest-agent sama, lag sama.

> 🚫 **DUA sumber waktu portal yang DITOLAK, keduanya bias tapi berlawanan arah:** (a) status **`Active` di Inventory ExoVirt** — menyala saat `terraform apply` selesai padahal guest masih boot → berhenti terlalu awal, **menguntungkan portal**; (b) **IP yang tampil di Inventory ExoVirt** — memuat tunda 5 dtk buatan + hingga 6 percobaan `SyncVmFactsJob` + polling UI 10 dtk + kemungkinan sapuan 30 dtk → **menghukum portal** dengan latensi pembukuan murni. Titik berhenti yang sah hanya **Proxmox Summary**, sama seperti manual.
7. Hitung **t1 + t3**. Angka inilah yang masuk uji beda.
8. Catat juga **selisih `Active` → IP muncul** per trial (deskriptif, lihat kotak di bawah).

> 🚨 **KOREKSI BESAR 2026-07-15 — `Active` BUKAN padanan "IP muncul". Versi lama runbook ini SALAH.**
> §1.d sebelumnya menyatakan *"IP muncul = padanan persis status `Active` di portal (Terraform selesai, IP diketahui)"*. **Klaim itu keliru dan biasnya menguntungkan portal.**
>
> **Bukti di kode:** `ProvisionVmJob.php:122-126` menetapkan `status = 'Active'` **langsung setelah `terraform->apply()` kembali**, dengan `ip_address = $out['default_ipv4'] ?? null`. Komentar di `ProvisionVmJob.php:142-144` mengakuinya: *"Guest-agent IP lag: a fresh clone reports its IP only after it finishes booting, so the sync above **often gets vmid/specs but no IP**"*. Audit `'Provisioned ...'` menyusul di baris 150. → **timestamp `Active` dan timestamp audit sama-sama berarti "Terraform selesai", bukan "VM hidup dan dapat diakses".** IP baru dikejar `SyncVmFactsJob` (tunda 5 dtk, maks 6 × 5 dtk ≈ 30 dtk, lalu diserahkan ke sapuan 30 dtk).
>
> **Kenapa fatal:** manual menghentikan stopwatch saat guest sudah boot dan melaporkan IP; portal akan berhenti sebelum guest boot. **Portal berhenti lebih awal → bias searah dengan hipotesis kita.** Jenis kesalahan paling berbahaya.
>
> **Jebakan kebalikannya — JANGAN pakai IP yang tampil di Inventory portal:** angka itu memuat tunda 5 dtk buatan + hingga 6 percobaan + polling UI 10 dtk + kemungkinan sapuan 30 dtk. Itu **menghukum portal** dengan latensi pembukuan yang tak ada hubungannya dengan kecepatan provisioning. Dua instrumen portal ini bias ke arah berlawanan; keduanya ditolak.
>
> **✅ Aturan yang berlaku: amati peristiwa FISIK yang sama dengan ALAT yang sama di kedua kelompok — IP muncul di Proxmox Summary.** Timestamp `approved` tetap dari audit (tindakan manusia, tercatat seketika, tidak ambigu).

> 📊 **CATAT SEBAGAI TEMUAN: selisih `Active` → IP muncul.** Portal menandai `Active` saat Terraform selesai, padahal VM belum tentu dapat dimasuki. Pengguna yang melihat `Active` lalu langsung SSH akan gagal. Catat selisihnya tiap trial, laporkan **deskriptif** (bukan uji beda). Ini bahan **Bab V**: status `Active` portal bersifat optimistis, dan penyempurnaannya adalah menunda `Active` sampai IP terkonfirmasi.

> ⚠️ **Konsekuensi jujur:** `t3` menjadi lebih besar daripada perkiraan awal, sehingga H1 pada metrik **waktu** makin berat. Itu memang harga dari titik ukur yang benar. Angka yang benar lebih berharga daripada angka yang menang.

> 🔒 **KOLOM "Jumlah" WAJIB = 1 UNTUK KESEPULUH TRIAL H1** (keputusan 2026-07-15, diambil **sebelum** arm portal diukur).
> Portal memang punya **batch mode** — kolom `instance_count` pada tabel `provision_requests` (default 1, komentar `// batch size`), dibatasi **60** oleh `ProvisionRequestController.php:21` agar sufiks `-0N` muat dalam batas 63 karakter hostname. Manual **tidak punya padanannya**.
> **Tetap 1-per-1 di H1, alasannya statistik dan mengunci:** Mann-Whitney U menuntut dua sampel independen. Arm manual memberi **10 pengukuran**; satu batch berisi 10 VM hanya menghasilkan **1 peristiwa = 1 pengukuran**. Uji 10 lawan 1 tidak dapat dijalankan. Untuk memperoleh 10 pengukuran portal via batch dibutuhkan **10 batch × 10 VM = 100 VM ≈ 4 TB** — tidak mungkin. Tambahan: satuan `t_manual` = waktu membuat **satu** VM, dan `bab2.md:177` berbunyi *"dalam proses provisioning mesin virtual"* (satuannya proses per VM).

### 1.c-bis BATCH MODE — temuan deskriptif TERPISAH, 🚫 di luar uji beda H1

**Diputuskan 2026-07-15, SEBELUM hasil H1 diketahui.** Pencatatan tanggal ini penting: bila batch baru dimunculkan **setelah** H1-waktu ketahuan gagal, ia terbaca sebagai penyelamatan pasca-fakta dan masuk kategori yang sama dengan menukar pembanding ke VMware (§1.f).

**Kenapa batch JUSTRU lemah bila dipaksa masuk H1:** batch bukan selisih *efisiensi*, melainkan selisih **kemampuan**. Penguji akan berkata *"Anda mengadu satu aksi batch melawan sepuluh aksi manual — itu bukan tugas yang sama"*, dan klaimnya runtuh. Bentuknya identik dengan argumen §1.b (pengguna non-admin tidak bisa provisioning manual sama sekali → waktunya tak terhingga, bukan lambat). Dilaporkan sebagai **temuan deskriptif**, klaimnya tidak dapat dibantah.

**Protokol:** jalankan **SATU** batch **setelah** 10 trial pokok selesai (jangan sebelum — bisa mencemari kapasitas node dan antrean). Ukuran batch menyesuaikan sisa kapasitas (5 atau 10 VM).

| Yang dicatat | Portal (1 batch berisi N VM) | Manual (padanan N VM) |
|---|---|---|
| Jumlah langkah | dari wizard terbuka → Submit | **23 × N** |
| `t1` | wizard terbuka → Submit | — |
| `t3` | Approve → seluruh N VM `Active` | — |
| Waktu total N VM | `t1 + t3` | **136,90 × N** (ekstrapolasi, **tandai sebagai ekstrapolasi**) |

**Perkiraan hasil pada N = 10:** langkah manual **230** lawan portal **≈12**. Perbandingan ini sah karena keluarannya sama-sama 10 VM. ⚠️ Untuk kolom waktu manual, **jangan mengaku mengukur** 10 VM manual berturut-turut kalau yang dilakukan hanya mengalikan 136,90 × 10 — tulis tegas "ekstrapolasi dari rata-rata 10 trial".

**Tempat pelaporan:** (1) **§4 black-box bagian C** (Provisioning & Inventaris) — tambahkan skenario "ajukan permintaan batch N VM → N VM ter-provision dengan sufiks `-01`..`-0N`"; (2) **4.6 Pembahasan** sebagai temuan deskriptif menjawab RM1; (3) bahan Bab V *queue scaling* [[next-session-future-work-narrative]].

### 1.d Langkah per percobaan — MANUAL (Proxmox VE GUI)

Protokol identik, variabel kontrol sama (§0). Aktor = **admin**.

**Lembar hitung (alur terverifikasi 2026-07-14, Rocky Linux + Bronze + DHCP).** Contreng per trial; koreksi kalau layarmu beda.

| # | Aksi | Langkah |
|---|---|:---:|
| — | *Login Proxmox VE GUI* | **0** (tidak dihitung) |
| 1 | Klik kanan template → **Clone** ⏱️ **stopwatch MULAI** | 1 |
| 2 | Isi **Name** | 1 |
| 3 | Pilih Mode = **Full Clone** | 1 |
| 4 | Klik tombol **Clone** | 1 |
| 5 | Klik tab **Cloud-Init** | 1 |
| 6 | Klik **Edit** pada User | 1 |
| 7 | Isi username | 1 |
| 8 | Klik **OK** | 1 |
| 9 | Klik **Edit** pada Password | 1 |
| 10 | Isi password | 1 |
| 11 | Klik **OK** | 1 |
| 12 | Klik **Edit** pada **Upgrade packages** | 1 |
| 13 | **Uncheck** Upgrade packages | 1 |
| 14 | Klik **OK** | 1 |
| 15 | Klik **Edit** pada IP Config | 1 |
| 16 | Pilih **DHCP** | 1 |
| 17 | Klik **OK** | 1 |
| 18 | Klik tab **Hardware** | 1 |
| 19 | Klik **Hard Disk** → **Disk Action** | 1 |
| 20 | Klik **Resize** | 1 |
| 21 | Isi increment = **30** (10 GB → 40 GB, lihat jebakan §0) | 1 |
| 22 | Klik **Resize disk** | 1 |
| 23 | Klik **Start** VM | 1 |
| — | Tunggu sampai **IP muncul** ⏱️ **stopwatch STOP** | 0 |
| — | *Putty + tes login* (verifikasi §4, DI LUAR jendela ukur) | 0 |
| | | **= 23** |

**Kenapa Upgrade packages di-uncheck (langkah 12–14):** VM buatan portal keluar dalam keadaan **unchecked** (diverifikasi 2026-07-14), sedangkan clone manual datang **checked** → manual butuh 3 klik untuk menyamai. Stub Terraform tidak menyetel `ciupgrade`/`package_upgrade` sama sekali, jadi cocokkan selalu ke VM portal, jangan ke asumsi. Kalau dibiarkan checked di manual, `dnf upgrade` jalan saat boot pertama → waktunya melar dan bergantung jaringan (tidak deterministik) **dan** isi paketnya beda dari VM portal.

**Aturan titik ukur:**
- ⏱️ **MULAI** saat klik kanan template. **Login TIDAK dihitung** (waktu maupun langkah) — login itu autentikasi, bukan *provisioning*, dan bentuknya sama di kedua metode. Portal juga mulai setelah login (saat wizard terbuka), jadi ini menjaga kesetaraan.
- ⏱️ **STOP** saat **IP muncul**, bukan saat tombol Start diklik dan **bukan** setelah putty/ganti password. ~~"IP muncul" = padanan persis status `Active` di portal (Terraform selesai, IP diketahui).~~ 🚨 **KOREKSI 2026-07-15: kalimat coret itu SALAH.** `Active` hanya berarti Terraform selesai, dan saat itu VM masih boot serta `ip_address` kerap masih NULL (`ProvisionVmJob.php:122-126` + komentar baris 142-144). Padanan yang benar untuk "IP muncul" pada kelompok portal adalah **"IP muncul di Proxmox Summary"** juga — peristiwa fisik yang sama, layar yang sama, mekanisme guest-agent yang sama. Lihat kotak koreksi di §1.c.
- **Putty + tes login + ganti password ADA DI LUAR jendela ukur.** Force-change itu bawaan template `sysuser` [[template-account-model]] dan **terjadi di kedua metode** — pengguna portal juga harus reveal password → putty → ganti password. Memasukkannya hanya ke manual = membebani manual dengan pekerjaan yang portal tidak dibebani. Terukur **±45 dtk** (2026-07-14); laporkan **deskriptif** saja, jangan masuk uji beda.
- Angka ini = **`t_manual`**, langsung masuk uji beda.

> ⚠️ **Titik stop wajib sama makna di kedua kelompok: "VM siap dipakai".** Portal = status `Active` di Inventory. Manual = **IP muncul**.

**📊 Trial #1 (2026-07-14, SAH):** `t_manual` = **191 dtk** (3:11) · **23 langkah** · disk 40 GB terverifikasi · 236 dtk (3:56) bila putty+ganti-password ikut dihitung → selisih **45 dtk** = beban *onboarding*, di luar uji.

**Catatan hasil untuk Bab IV (bukan langkah, tapi temuan):** hostname otomatis mengikuti nama VM dan filesystem auto-extend setelah resize. Keduanya kerja **template + cloud-init**, identik di manual maupun portal → **BUKAN keunggulan portal**, jangan diklaim di efisiensi.

**✅ AUTO-EXTEND + HOSTNAME TERVERIFIKASI DARI DALAM VM (2026-07-15, `manual-9` & `manual-10`).** Bukti console:
- `df -h` → `/dev/sda3  40G  2.4G  38G  6%  /` — **filesystem root benar-benar 40 GB**, bukan hanya disk virtualnya.
- `lsblk` → `sda 40G disk` · `sda1 1M` · `sda2 200M /boot/efi` · **`sda3 39.8G /`**
- `hostname` → `manual-9` (= nama VM) · prompt `[sysuser@manual-9 ~]$` (akun `sysuser` berfungsi)

> **Kenapa ini penting dan kenapa tab Hardware saja tidak cukup:** tab Hardware hanya membuktikan **disk virtual** = 40 GB. Bila `growpart`/cloud-init gagal, hasilnya 40 GB teralokasi tapi `/` tetap 10 GB — VM tetap boot, tetap bisa login, **tanpa satu pun tanda kesalahan**. Itu persis pola *drift senyap* yang jadi tema §2b, dan hanya `df -h`/`lsblk` dari dalam guest yang menangkapnya. **Hasilnya: tidak terjadi.** Template 10 GB → +30 → 40 GB, filesystem ikut tumbuh. Parameter ke-6 ini bersih, memperkuat temuan 0 kesalahan seri RHEL.

> 🔧 **KOREKSI RUJUKAN (2026-07-15).** Versi sebelumnya menulis *"Tabel 3.3 baris cloud-init hostname/auto-resize"* — **itu keliru**. Isi `bab3.md` sebenarnya: **Tabel 3.1** Perangkat Keras · **3.2** Perangkat Lunak · **3.3 Analisis PIECES** · **3.4** Variabel Penelitian · **3.5** Jadwal. **Tidak ada tabel skenario pengujian di `bab3.md`.** Skenario black-box berada di file terpisah **`presentation/bab4-blackbox-skenario.md`** (bagian A–G).
> **Konsekuensi:** hostname-ikut-nama-VM dan filesystem auto-extend **belum punya baris skenario di dokumen mana pun**. Bila hendak diuji, **tambahkan sebagai skenario baru di bagian C (Provisioning & Inventaris)** pada `bab4-blackbox-skenario.md` — diuji pada VM **portal** (black-box menguji sistem yang dibangun). Bukti sisi **manual** hanya diperlukan untuk menopang kalimat kejujuran *"ini perilaku cloud-init, bukan keunggulan portal"*.

### 1.e Aturan menghitung langkah (kunci SEBELUM trial pertama)

`bab3.md` Tabel 3.4 hanya menulis indikator "jumlah langkah yang dilakukan" tanpa mendefinisikannya. Definisi operasional yang dipakai penelitian ini:

> **1 langkah = 1 aksi wajib pengguna yang memberi masukan, membuat keputusan, atau memajukan proses.**

**DIHITUNG (@ 1 langkah):**
- Mengisi satu field. Mengetik `UJI-01` = **1**, bukan 6 ketukan.
- Memilih satu opsi dropdown/radio/checkbox. **Buka + pilih = 1** (satu keputusan), bukan 2.
- Klik kanan → pilih menu = **1** (pola sama dengan dropdown).
- Klik tombol yang mengeksekusi: OK, Clone, Resize disk, Start, Next, Submit.
- Klik navigasi wajib: tab Cloud-Init, tab Hardware, tombol Edit (setara "Next" di wizard portal).

**TIDAK DIHITUNG (0):**
- *Login*.
- Scroll, hover, klik sekadar memfokuskan field, menutup popup.
- Menunggu *loading*.
- Membaca/verifikasi (mis. halaman Review).

> **ATURAN EMAS:** kelonggaran apa pun yang dipakai, pakai **persis sama** di kedua kelompok, dan tulis aturan ini di Bab IV **sebelum** tabel angkanya. Penguji tidak mempersoalkan 4 atau 5; yang dipersoalkan kalau manual dihitung longgar tapi portal dihitung ketat. Aturan yang konsisten + diumumkan selalu lebih kuat daripada aturan "benar" yang tidak pernah dijelaskan.

**Tabel pencatatan (portal):**

| Trial | Langkah user | Langkah admin (approve) | t1 interaksi (dtk) | t3 eksekusi (dtk) | **t1+t3 → uji H1** (dtk) | t2 tunggu approval (dtk, deskriptif) |
|------:|-------------:|------------------------:|-------------------:|------------------:|-------------------------:|-------------------------------------:|
| 1 | | | | | | |
| … | | | | | | |
| 10 | | | | | | |
| **Rata-rata** | | | | | | |

**Tabel pencatatan (manual):**

**Template: RHEL** (10 GB → +30 → 40 GB) · reset 2026-07-14 (data Rocky VOID — baseline template berubah, lihat §0)
**Status: ✅ SERI SELESAI 2026-07-15** (10/10 trial). Kolom waktu terisi dari catatan stopwatch; kolom langkah/disk/putty **masih menunggu konfirmasi** — jangan diisi dengan asumsi.

| Trial | VM (VMID) | Jumlah langkah | **`t_manual` → uji H1** (dtk)<br>klik-kanan → IP muncul | Disk aktual (verifikasi) |
|------:|---|---------------:|--------------------------------------:|:---:|
| 1 | manual-1 (101) | 23 | **175** (02:55) | ✅ 40 GB |
| 2 | manual-2 (102) | 23 | **146** (02:26) | ✅ 40 GB |
| 3 | manual-3 (103) | 23 | **138** (02:18) | ✅ 40 GB |
| 4 | manual-4 (104) | 23 | **150** (02:30) | ✅ 40 GB |
| 5 | manual-5 (105) | 23 | **130** (02:10) | ✅ 40 GB |
| 6 | manual-6 (106) | 23 | **129** (02:09) | ✅ 40 GB |
| 7 | manual-7 (107) | 23 | **128** (02:08) | ✅ 40 GB |
| 8 | manual-8 (108) | 23 | **121** (02:01) | ✅ 40 GB |
| 9 | manual-9 (109) | 23 | **123** (02:03) | ✅ 40 GB |
| 10 | manual-10 (110) | 23 | **129** (02:09) | ✅ 40 GB |
| **Rata-rata** | — | **23** (SD = 0) | **136,90** | **10/10 sesuai** |

> ✅ **ARM MANUAL DITUTUP 2026-07-15.** 10 trial mulus mengikuti lembar hitung §1.d tanpa penyimpangan langkah (dikonfirmasi user). Karena SD = 0, angka 23 dilaporkan sebagai **hitungan deterministik**, bukan variabel yang diuji-beda.

> **Kolom `+putty/ganti-pwd` DIHAPUS (keputusan 2026-07-15).** Alasan: (a) sudah ditetapkan **di luar jendela ukur** dan **tidak pernah masuk uji beda**; (b) **identik di kedua metode** — pengguna portal juga reveal password → putty → ganti password ([[template-account-model]]), jadi tidak menyumbang apa pun ke perbandingan; (c) bukan variabel di `bab3.md` Tabel 3.4 (efisiensi = waktu + langkah). **Tidak perlu diukur ulang di seri RHEL.** Yang dipertahankan hanya **kalimat pertahanannya** di Bab IV: *"Proses putty, uji login, dan penggantian kata sandi paksa berada di luar jendela pengukuran karena merupakan perilaku template `sysuser` yang terjadi identik pada kedua metode (terukur ±45 detik pada pengukuran pendahuluan), sehingga memasukkannya hanya ke salah satu kelompok akan membebani kelompok tersebut secara tidak setara."* Angka ±45 dtk berasal dari seri Rocky dan **hanya boleh disebut sebagai ancar-ancar pendahuluan**, bukan data seri RHEL.

> **Tentang kolom `Jumlah langkah`:** angka ini **deterministik, bukan hasil ukur** — selama prosedurnya mengikuti lembar hitung §1.d, nilainya sama di tiap trial (SD = 0). Karena itu **jumlah langkah TIDAK diuji statistik**; ia dilaporkan sebagai **tabel hitungan** pembanding (manual vs portal), sesuai §5. Kolom per-trial ini hanya untuk mencatat **penyimpangan**: bila ada trial yang meleset dari 23 (salah klik lalu mengulang, dialog nyangkut, balik ke tab sebelumnya), tulis angka sebenarnya di baris itu dan jelaskan sebabnya.

**Ringkasan statistik `t_manual` (n = 10, satuan detik):**

| Statistik | Nilai |
|---|---:|
| Mean | 136,90 |
| Median | 129,50 |
| SD | 16,35 |
| CV | 11,94 % |
| Min – Max | 121 – 175 (rentang 54) |
| Q1 / Q3 (IQR) | 128,25 / 144,00 (15,75) |

**⚠️ Normalitas — Shapiro-Wilk: W = 0,837 · p = 0,041 → `t_manual` TIDAK normal (p ≤ 0,05).**
Konsekuensinya sudah diantisipasi desain (`bab3.md` §3.3.5): uji beda H1 memakai jalur **non-parametrik**. ⚠️ **Presisi istilah:** portal dan manual = **dua kelompok independen**, jadi uji yang benar adalah **Mann-Whitney U** (= *Wilcoxon rank-sum*), **BUKAN** *Wilcoxon signed-rank* (itu untuk data berpasangan). Runbook/bab3 yang menulis "Wilcoxon" saja harus dipertegas — ini umpan empuk penguji. Angka Shapiro-Wilk di atas = **pratinjau**; bukti Bab IV tetap ambil dari **output SPSS/Jamovi** (screenshot).

**📉 EFEK BELAJAR — signifikan, dan ini TEMUAN, bukan cacat:**

| Ukuran | Nilai |
|---|---:|
| Spearman ρ (urutan trial vs waktu) | **−0,857** (p = 0,0015) |
| Slope regresi | **−4,41 dtk per trial** |
| Mean trial 1–5 | 147,80 dtk |
| Mean trial 6–10 | **126,00 dtk** (−21,80 dtk / −14,7 %) |
| Trial 1 (175) vs Trial 10 (129) | −46 dtk = **26,3 % lebih cepat** |

Operator makin cepat seiring pengulangan, lalu **mendatar di ~121–130 dtk mulai trial ~5**. Artinya: (a) seri ini mencapai *steady state*, jadi valid secara internal; (b) angka manual ini adalah **kondisi TERBAIK manual** — dikerjakan admin penuh-hak yang juga pengembang sistemnya, setelah 10 kali latihan. Operator baru butuh 175 dtk. Ini memperkuat argumen §1.b, bukan melemahkannya.

> 🚫 **JANGAN buang Trial #1 diam-diam.** Trial #1 (175 dtk) adalah *mild outlier* Tukey (pagar atas = 167,6) dan kalau dibuang datanya jadi normal (W = 0,894 · p = 0,218 · mean 132,67) sehingga "boleh" pakai T-Test. **Itu justru jebakannya.** Membuang data setelah melihat hasilnya, demi lolos uji normalitas, persis yang dicari penguji. Trial #1 adalah pengukuran sah (disk benar, prosedur benar) — satu-satunya "dosanya" adalah operator belum hafal. **Keputusan: pakai 10-10-nya + Mann-Whitney.** Non-parametrik sudah ada di desain sejak awal, jadi tidak butuh pembenaran pasca-fakta, dan median (129,5) tahan outlier.

**🎯 Ambang target H1** (`bab3`: waktu turun ≥ 50 %): portal (`t1+t3`) harus **≤ 68,5 dtk** (basis mean) atau **≤ 64,8 dtk** (basis median).

> ⚠️ **SEPULUH trial WAJIB memakai template yang SAMA.** Baseline berubah di tengah jalan = sepuluh-sepuluhnya hangus. Ini yang membunuh seri Rocky.
> Trial yang **dibatalkan** (mis. salah *increment* → disk 50 GB) jangan dihapus — pindahkan ke lembar observasi **§2b** sebagai data kesalahan manusia.

**🗑️ Seri Rocky (VOID, disimpan sebagai jejak):** Trial #1 = 191 dtk / 23 langkah / disk 40 GB / Δ45 dtk putty. Angkanya **tidak dipakai** (template Rocky ter-resize permanen di tengah seri → baseline berubah). **Insidennya tetap dipakai** di §2b.

> Kolom **`t1+t3`** (portal) vs kolom **`t_manual`** (manual) adalah dua kelompok yang masuk **Shapiro-Wilk → Independent T-Test / Mann-Whitney U**. Kolom **t2 tidak ikut**.
> ⚠️ Karena Shapiro-Wilk `t_manual` sudah menolak normalitas (p = 0,041), jalur yang terpakai = **Mann-Whitney U** (*Wilcoxon rank-sum*, dua kelompok **independen**) — **bukan** *Wilcoxon signed-rank* (berpasangan).

**Screenshot bukti yang HARUS diambil:**
- [ ] Tiap langkah wizard (minimal: halaman Review dengan Total CPU/RAM/Disk)
- [ ] Menu Approvals saat Approve
- [ ] Inventory menampilkan VM **Active** + kolom waktu
- [ ] Audit Trail baris `created` → `approved` → `provisioned/Active` (bukti timestamp objektif untuk t2 & t3)
- [ ] **Manual:** tiap dialog Proxmox (clone, hardware, cloud-init, start) + VM status running

### 1.g Dua jenis bukti — jangan dicampur (ditetapkan 2026-07-15)

Proses pembuatan VM manual **tidak direkam** saat 10 trial berlangsung; yang tersisa hanya VM jadi (`manual-1`..`manual-10`). Itu **tidak menghilangkan bukti apa pun**, asalkan dua kategori ini dibedakan:

| | **Bukti ANTARMUKA** | **Bukti HASIL PENGUKURAN** |
|---|---|---|
| Isinya | Bentuk dialog & label alat: dialog Clone, tab Cloud-Init, **dialog Resize berlabel "Size Increment (GiB)"** | Konfigurasi VM aktual, timestamp, disk terverifikasi, tabel waktu |
| Sifat | **Properti perangkat lunak** — sama kapan pun difoto | **Peristiwa** — terikat pada trial yang benar-benar terjadi |
| Boleh diambil ulang belakangan? | ✅ **Ya** | 🚫 **Tidak.** Merekonstruksinya = memalsukan data |
| Status sekarang | ⬜ belum, **bisa diambil kapan saja** | ✅ **utuh** — 10 VM masih hidup, tinggal difoto tab Hardware-nya |

**Aturan caption:** tulis apa adanya — *"Gambar 4.x — Dialog Resize pada Proxmox VE menampilkan label Size Increment (GiB)"*. **JANGAN** menulis *"dokumentasi saat trial #3 berlangsung"* untuk gambar yang diambil belakangan. Yang didokumentasikan adalah **antarmuka**, bukan pengakuan telah merekam proses. Selama caption-nya jujur, tidak ada yang dilanggar.

> ⚠️ **PROSEDUR AMAN mengambil screenshot dialog Resize — baca dulu.** Membuka dialog ini **persis cara Insiden #1 dan #2 terjadi**. Jangan sampai memotret bukti malah melahirkan insiden ketiga.
> 1. Pakai **`manual-10` (VMID 110)** — VM yang memang akan dihapus. Salah klik = kerugian nol.
> 2. **JANGAN PERNAH di template.** Cek nama + VMID di panel kiri sebelum menyentuh tab Hardware.
> 3. Hardware → Hard Disk → Disk Action → Resize → **screenshot** → **Cancel**. Jangan tekan "Resize disk".
> 4. Dialog Clone: klik-kanan template RHEL → Clone → screenshot → **Cancel** (aman: tidak ada perubahan sampai tombol Clone ditekan).
> 5. Cloud-Init: buka `manual-10` → tab Cloud-Init. **Lebih baik daripada foto saat pembuatan** — membuktikan kondisi akhir sebenarnya (user, Upgrade packages ter-*uncheck*, IP DHCP).

### 1.f Data pembanding EKSTERNAL — VMware (bank) · 🚫 DI LUAR UJI BEDA

**Sumber:** kerabat peneliti, admin di sebuah bank, mengukur di environment VMware tempatnya bekerja (2026-07-15). **Protokol:** *tanpa template* — native install 1 VM, lalu clone; IP DHCP; tiap hasil clone wajib **set hostname + reset machine-ID** secara manual.

| Trial | mm:ss | Detik | Jenis operasi |
|------:|:-----:|------:|---|
| 1 | 18:30 | **1110** | **Native install** (bangun VM sumber — *bukan* provisioning) |
| 2 | 06:43 | 403 | clone + hostname + reset machine-ID |
| 3 | 04:46 | 286 | clone + hostname + reset machine-ID |
| 4 | 04:38 | 278 | clone + hostname + reset machine-ID |
| 5 | 04:50 | 290 | clone + hostname + reset machine-ID |
| 6 | 04:52 | 292 | clone + hostname + reset machine-ID |
| 7 | 04:21 | 261 | clone + hostname + reset machine-ID |
| 8 | 04:01 | 241 | clone + hostname + reset machine-ID |
| 9 | 04:03 | 243 | clone + hostname + reset machine-ID |
| 10 | 04:09 | 249 | clone + hostname + reset machine-ID |

| Kelompok | n | Mean | Median | SD | CV |
|---|--:|-----:|-------:|---:|---:|
| Semua-10 (campur install + clone) | 10 | 365,30 | 282,00 | 265,78 | **72,76 %** ⚠️ |
| **Clone saja (trial 2–10)** | 9 | **282,56** | 278,00 | 49,45 | 17,50 % |
| Clone mantap (trial 3–10) | 8 | 267,50 | 269,50 | 21,53 | 8,05 % |

> ⚠️ **Trial #1 (1110 dtk) BUKAN kurva belajar — itu operasi yang berbeda jenis.** Native install = biaya membangun *golden image* secara manual (3,9× satu clone), dibayar **sekali**, bukan biaya provisioning per-VM. Mencampurnya ke dalam satu mean menghasilkan CV 72,76 % yang tidak bermakna. Laporkan terpisah.

**🚫 KENAPA DATA INI TIDAK BOLEH MASUK UJI BEDA H1 — enam variabel berbeda:**

| # | Variabel | VMware (bank) | Arm manual penelitian |
|--:|---|---|---|
| 1 | **Hypervisor** | VMware | **Proxmox VE** ← `bab2.md:177` mengunci *"antarmuka Proxmox VE bawaan"* |
| 2 | **Template** | tidak ada | RHEL golden image |
| 3 | **Operator** | kerabat (admin bank) | peneliti |
| 4 | **Hardware/host** | env bank, spek tak diketahui | lab Proxmox Jakarta |
| 5 | **Prosedur** | + set hostname + reset machine-ID | otomatis (cloud-init) |
| 6 | **OS/datastore/jaringan** | tidak terkontrol | terkunci §0 |

**Alasan #1 sudah menutup perkara sendirian:** H1 yang terdaftar berbunyi *"antara aplikasi yang dikembangkan dan **antarmuka Proxmox VE bawaan**"*. VMware bukan Proxmox VE. Memasukkannya = menguji hipotesis yang tidak pernah dirumuskan. **Perlakuan sama persis dengan data Terraform CLI dari jurnal:** pembanding **deskriptif** di pembahasan, tidak pernah masuk statistik inferensial.

> 🚨 **PERINGATAN INTEGRITAS — baca sebelum tergoda.** Angka VMware (282,56 dtk) hampir **dua kali** arm manual Proxmox (136,90 dtk). Kalau `t1+t3` portal ternyata ~160 dtk, memakai VMware sebagai pembanding membuat H1 **lolos telak**, sedangkan pembanding yang sah bisa **gagal**. Justru karena itulah ia tidak boleh dipakai: **mengganti kelompok pembanding setelah melihat bahwa kelompok yang sah mungkin tidak menguntungkan** adalah pelanggaran metodologi yang jauh lebih fatal daripada hipotesis yang gagal. Hipotesis gagal itu temuan; pembanding yang ditukar itu cacat.

**✅ DI MANA DATA INI JUSTRU BERHARGA (pakai di sini):**
1. **Triangulasi Bab I.** Survei lapangan mengklaim manual = **5–20 menit/VM** [[proposal-revisi-plan]]. Clone VMware = 282,56 dtk ≈ **4,7 menit**, native install = **18,5 menit**. Rentang 5–20 menit itu kini punya pengukuran independen yang mendukungnya — bukan lagi sekadar estimasi tiket. Ini menambal kritik "angka masalahnya dari mana?".
2. **Membuktikan arm manual penelitian adalah kondisi TERBAIK manual.** Praktisi sungguhan di env produksi butuh 282 dtk; peneliti di lab terkontrol dengan template butuh 136,90 dtk (**2,06× lebih cepat**). Jadi 136,90 dtk itu *optimistis untuk manual* = **konservatif untuk klaim portal**. Memperkuat §1.b.
3. **Membenarkan keputusan desain golden image + cloud-init.** 18:30 menguantifikasi biaya tidak punya template; "set hostname + reset machine-ID" menguantifikasi biaya tidak punya cloud-init. ⚠️ Tapi ini perbandingan **rekayasa template**, bukan portal-vs-manual — jangan diklaim sebagai keunggulan portal (lihat catatan §1.d soal hostname/auto-extend).
4. **Validitas eksternal di pembahasan (RM1).** Temuan tidak terkurung di Proxmox: provisioning manual lambat di env bank ber-VMware juga.

**⚠️ Etika/kerahasiaan sebelum masuk naskah:** data berasal dari environment internal sebuah bank. Sebelum dikutip di Bab IV — pastikan ada **izin**, **anonimkan** nama bank/host/IP/spek, dan jangan lampirkan screenshot env-nya. Cukup tulis sebagai "environment VMware pada sebuah institusi perbankan" + tabel waktu.

---

## 2. KONSISTENSI KONFIGURASI  ·  (Hipotesis 2)

**Yang diukur:** % VM yang konfigurasinya **sesuai spec (tanpa *configuration drift*)**.
**Indikator target (bab3):** kesesuaian 100%.

### 2.0 SPEC ACUAN — tier Bronze (nilai PROD, terkonfirmasi user 2026-07-15)

| Parameter | Nilai spec | Cara verifikasi |
|---|---|---|
| **CPU** | **1 vCPU** | Proxmox → VM → Hardware → Processors |
| **RAM** | **2 GB (2048 MB)** | Proxmox → VM → Hardware → Memory |
| **Disk** | **40 GB** | Proxmox → VM → Hardware → Hard Disk |
| **Network** | vmbr0, **IP DHCP** | Hardware → Network Device + Summary (IP) |
| **Hostname** | **= nama VM** | login/console: `hostname` |

> ⚠️ **Jangan pakai angka seeder.** `backend/database/seeders/DatabaseSeeder.php:49` menulis default `['Bronze', 2, 4096, 40]` = 2 vCPU / 4096 MB. Itu **nilai awal instalasi**, dan tier bisa diedit admin (`TierForm.jsx`). **Prod sudah diubah ke 1 vCPU / 2048 MB / 40 GB** — itulah spec yang mengikat pengukuran ini. Kalau ragu, baca ulang dari Settings → Tier di prod, jangan dari repo.

**Langkah:**
1. *Provision* **K VM** (mis. 10) via portal dengan **spec identik** (Bronze + RHEL).
2. Untuk tiap VM, periksa konfigurasi **aktual** (CPU, RAM, Disk, Network/IP, Hostname) di **Proxmox** (tab Hardware) atau **detail Inventory**.
3. Cocokkan ke **checklist spec §2.0**. Tandai Sesuai / Tidak per parameter.

**Tabel checklist (isi untuk KEDUA kelompok — manual & portal):**

**Kelompok MANUAL — ✅ TERISI 2026-07-15** (Proxmox GUI, template RHEL, tier Bronze, VMID 101–110)

| VM (VMID) | CPU (1) | RAM (2 GB) | Disk (40 GB) | Network/IP (DHCP) | Hostname (= nama VM) | Sesuai spec? |
|----|:---:|:---:|:----:|:-------:|:---:|:------------:|
| manual-1 (101) | ✓ | ✓ | ✓ | ✓ 192.168.200.82 | ✓ | ✅ |
| manual-2 (102) | ✓ | ✓ | ✓ | ✓ 192.168.200.84 | ✓ | ✅ |
| manual-3 (103) | ✓ | ✓ | ✓ | ✓ 192.168.200.85 | ✓ | ✅ |
| manual-4 (104) | ✓ | ✓ | ✓ | ✓ 192.168.200.86 | ✓ | ✅ |
| manual-5 (105) | ✓ | ✓ | ✓ | ✓ 192.168.200.87 | ✓ | ✅ |
| manual-6 (106) | ✓ | ✓ | ✓ | ✓ 192.168.200.88 | ✓ | ✅ |
| manual-7 (107) | ✓ | ✓ | ✓ | ✓ 192.168.200.89 | ✓ | ✅ |
| manual-8 (108) | ✓ | ✓ | ✓ | ✓ 192.168.200.90 | ✓ | ✅ |
| manual-9 (109) | ✓ | ✓ | ✓ | ✓ 192.168.200.91 | ✓ | ✅ |
| manual-10 (110) | ✓ | ✓ | ✓ | ✓ 192.168.200.92 | ✓ | ✅ |
| **% Sesuai** | **100%** | **100%** | **100%** | **100%** | **100%** | **100% (10/10)** |

**Kelompok PORTAL — ⬜ belum diukur**

| VM (VMID) | CPU (1) | RAM (2 GB) | Disk (40 GB) | Network/IP (DHCP) | Hostname (= nama VM) | Sesuai spec? |
|----|:---:|:---:|:----:|:-------:|:---:|:------------:|
| … | | | | | | |
| **% Sesuai** | | | | | | |

> 🚫 **Kolom "Hardening" DIHAPUS dari checklist H2 — ini akan jadi kesalahan faktual.** `backend/app/Jobs/ProvisionVmJob.php:97-99` menyatakan tegas: *"Hardening is no longer a provision-time choice (Stage 8): it's an on-demand, catalog-bound Inventory action. **A new VM starts un-hardened**"* → VM portal lahir dengan `hardening_status = 'Not Hardened'`. Jadi di titik ukur, **VM portal dan VM manual sama-sama belum di-harden**. Mengisi "portal ✓ / manual ✗" = **salah fakta** dan menggelembungkan H2 secara tidak sah. Hardening = aksi Inventory terpisah, di luar ruang lingkup H1 maupun H2. **Efek samping baiknya: `t3` tidak mengandung waktu hardening → perbandingan H1 tetap apple-to-apple.**

> ⚠️ **Ekspektasi jujur untuk H2 — baca sebelum kecewa.** Karena variabel kontrol §0 mengharuskan **template RHEL sudah disetel ke spek Bronze**, arm manual **mewarisi** CPU/RAM/Network dari template tanpa satu pun langkah manual → baris CPU/RAM/Network hampir pasti **100% di KEDUA kelompok**. Satu-satunya parameter yang benar-benar bisa *drift* di manual adalah **Disk**, karena hanya di situ ada field yang diisi tangan (*increment*). Artinya H2 berpeluang menunjukkan **tidak ada beda signifikan** — dan itu **temuan yang sah, bukan kegagalan**. Konsekuensi ini lahir dari keputusan kontrol kita sendiri, jadi **deklarasikan di Bab IV**: permukaan kesalahan manual sudah dipersempit oleh desain eksperimen (template pre-Bronze), sehingga H2 mengukur sisa permukaan yang tinggal satu kolom. Argumen sesungguhnya ada di **§2b Lapis 3**, bukan di persentase H2.

**Screenshot bukti:**
- [ ] Konfigurasi aktual tiap VM (Proxmox Hardware / detail Inventory)
- [ ] Settings → Tier (prod) memperlihatkan Bronze = 1 vCPU / 2 GB / 40 GB (bukti spec acuan)
- [ ] Tabel checklist terisi
- [ ] (Pembanding) contoh VM manual yang *drift* bila ada

---

## 2b. KESALAHAN MANUSIA (*human error*)  ·  Variabel 3, TANPA hipotesis

**Kenapa ada:** `bab3.md` Tabel 3.4 mendeklarasikan **4 variabel**, tapi §1–§4 runbook ini semula hanya mengukur 3. Variabel 3 = *"kesalahan konfigurasi yang terjadi selama proses provisioning"*, indikator *"jumlah kesalahan konfigurasi per proses provisioning"*, instrumen *"lembar observasi dan log sistem"*. Ini menutup celah itu. Variabel ini **tidak punya hipotesis** (H1–H3 hanya efisiensi/konsistensi/SUS) → dilaporkan **deskriptif**, memperkuat **Rumusan Masalah 3**.

**Definisi 1 kesalahan:** satu parameter hasil yang **menyimpang dari spec**, meski prosesnya berhasil. Bedakan tegas:
- **Failed operation** = proses GAGAL (clone error, VM tidak mau boot). **Bukan** yang diukur di sini.
- **Human error / drift** = proses **BERHASIL**, VM jalan normal, **tapi hasilnya salah**. **Ini** yang dihitung.

Parameter yang dicek per trial: **CPU · RAM · Disk · Network/IP · Hostname · Nama VM**.

**Lembar observasi (isi per trial, kedua kelompok):**

| Trial | Metode | Parameter menyimpang | Jml kesalahan | Terdeteksi otomatis? | Ketahuan lewat | Radius |
|------:|--------|----------------------|--------------:|:--------------------:|----------------|--------|
| *Rocky #1* ⚠️ | Manual | Disk 50 GB (spec 40 GB) | 1 | ❌ tidak | pemeriksaan tab Hardware | 1 VM |
| *Rocky #2* ⚠️ | Manual | **Disk TEMPLATE** 10→40 GB (salah sasaran) | 1 | ❌ tidak | disadari sendiri | **semua VM turunan, permanen** |
| RHEL #1 (manual-1) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #2 (manual-2) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #3 (manual-3) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #4 (manual-4) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #5 (manual-5) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #6 (manual-6) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #7 (manual-7) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #8 (manual-8) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #9 (manual-9) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| RHEL #10 (manual-10) | Manual | — | **0** | — | verifikasi 5 parameter | — |
| | | **Total seri RHEL (n=10)** | **0** | | 50/50 parameter sesuai | |

> **Baca tabel ini dengan benar.** Dua baris *Rocky* (miring) berasal dari **seri yang dibatalkan** — insidennya nyata dan tetap dilaporkan sebagai **Lapis 1 (narasi)**, tetapi **tidak boleh dijumlahkan** ke dalam *error rate* seri RHEL, karena seri Rocky bukan bagian dari 10 trial yang diukur. Menggabungkannya = melaporkan 2 kesalahan dari "12 trial" yang tidak pernah ada.
>
> **Hasil terukur seri RHEL = 0 kesalahan dari 10 trial (50/50 parameter sesuai spec). Ditulis 0, sesuai Lapis 2.** Nol tetap temuan.
>
> ⚠️ **Bias yang WAJIB disebut sebagai keterbatasan** (Lapis 2 sudah mengamanatkannya): angka 0 ini diperoleh **setelah** peneliti mengalami Insiden #1 dan #2, sehingga ia sudah hafal persis letak jebakannya (kolom *increment*, dan bahaya salah sasaran template). Operator yang belum pernah tertipu tidak berada pada kondisi yang sama. **Jadi 0 di sini bukan bukti "manual itu aman"** — ia bukti "manual bisa aman **bila** operatornya sudah pernah gagal dan ingat pelajarannya". Kondisi itu tidak dapat diasumsikan berlaku di organisasi dengan 120 tiket / 2 bulan / 2 admin.

### Tiga lapis pelaporan (JANGAN dilanggar)

> ⚠️ **Godaan terbesar di bagian ini = mengarang statistik.** Insiden n=1 yang dialami peneliti sendiri BUKAN bukti "manual rawan error". Penguji akan bertanya "berapa sampelnya?" dan "siapa operatornya?" — dua pertanyaan itu menjatuhkan klaimnya. **Dan jangan pernah sengaja berbuat salah di manual supaya angkanya bagus.** Itu pemalsuan data.

**Lapis 1 — laporkan insiden sebagai OBSERVASI, bukan statistik.** Satu paragraf jujur, tanpa persentase. Justru meyakinkan karena mengakui kesalahan sendiri.

**Lapis 2 — hitung yang benar-benar terjadi.** Selama 10 trial, isi lembar observasi apa adanya. **Kalau hasilnya 0 kesalahan, tulis 0.** Itu tetap temuan. Catatan kejujuran wajib: setelah insiden pertama, peneliti sudah tahu jebakannya, sehingga error rate trial berikutnya cenderung 0 — **sebutkan bias ini** sebagai keterbatasan.

**Lapis 3 — argumen PERMUKAAN KESALAHAN (paling kuat, tidak butuh sampel).** Arsitektural, bukan empiris:

> Di manual terdapat **field yang bisa salah isi**: nilai *increment* disk dihitung sendiri oleh operator (40 − 10 = 30), dan Proxmox tidak memvalidasinya terhadap standar apa pun karena Proxmox tidak mengetahui standar organisasi. Di portal **field itu tidak ada**: pengguna memilih tier, lalu Terraform menuliskan 40 GB. Kolom yang tidak ada tidak dapat diisi salah.

Klaim ini berdiri di atas **kode**, bukan di atas sampel, sehingga tidak dapat dipatahkan dengan "n-nya berapa?". **Tetap jujur pada batasnya:** portal **mengecilkan** permukaan kesalahan, tidak menghapusnya — pengguna portal masih bisa salah pilih tier atau template. Bedanya, salah pilih tier **terlihat di halaman Review sebelum Submit**, sedangkan salah *increment* di Proxmox **tidak terlihat di mana pun**.

**Sifat drift yang layak ditonjolkan: SENYAP.** VM tidak protes, tidak ada error di layar, tidak ada log merah. Ketahuan hanya bila seseorang sengaja membuka tab Hardware dan mencocokkan angkanya. Di organisasi dengan **120 tiket / 2 bulan / 2 admin** (`bab1.md` Tabel 1.1), pemeriksaan itu tidak terjadi.

### 📌 INSIDEN TERCATAT — 2026-07-14, trial manual #1 (bahan Lapis 1)

Peneliti — yang merupakan **pengembang sistem** dan sudah familier dengan Proxmox — tetap salah pada percobaan manual pertama. Dialog Disk Action → Resize meminta **Size Increment (GiB)**, bukan ukuran akhir. Nilai `40` dimasukkan dengan maksud "jadikan 40 GB", padahal template Rocky bawaan **10 GB**, sehingga hasilnya **50 GB** — menyimpang 10 GB dari spec tier Bronze (40 GB).

Yang menentukan: **tidak ada satu pun indikasi kesalahan.** Clone berhasil, VM boot normal, filesystem auto-extend bekerja, hostname terisi benar, VM dapat di-login. Penyimpangan baru ketahuan setelah tab Hardware dibuka dan angkanya dicocokkan manual. Trial dibatalkan dan diulang dengan increment 30.

### 📌 INSIDEN TERCATAT #2 — 2026-07-14, salah sasaran resize (bahan Lapis 1 & 3)

Masih pada hari yang sama, peneliti bermaksud memperbesar disk **VM hasil clone**, namun yang terpilih adalah **template**-nya. Nilai increment 30 GB masuk ke template, sehingga disk template Rocky berubah permanen dari 10 GB menjadi 40 GB. Proxmox tidak menampilkan konfirmasi, peringatan, maupun pembeda yang menonjol antara template dan mesin virtual biasa pada operasi tersebut.

**Radiusnya jauh lebih luas daripada Insiden #1.** Insiden #1 merusak satu mesin virtual; Insiden #2 merusak **artefak bersama**, sehingga setiap mesin virtual yang lahir dari template itu ikut membawa penyimpangannya, tanpa batas waktu. Kesalahan juga **tidak dapat dibatalkan**: Proxmox tidak menyediakan operasi pengecilan disk, `qm resize` menolaknya, dan pengecilan pada lapisan penyimpanan memotong blok data sehingga merusak citra template. Pemulihan menuntut pembangunan ulang template beserta proses *virt-customize* untuk akun `sysuser`, `sysadmin`, dan kunci otomasi di dalamnya.

Akibatnya seri pengukuran Rocky dibatalkan dan pengukuran diulang memakai template Ubuntu Server.

**Nilai insiden ini untuk Lapis 3 (permukaan kesalahan):** kesalahan seperti ini **tidak mungkin dilakukan pengguna portal** — bukan karena ia lebih berhati-hati, melainkan karena portal tidak menyediakan jalan menuju template. Antarmuka *self-service* hanya memaparkan pilihan tier; template dikelola administrator dan tidak pernah tersentuh alur permintaan. Permukaan kesalahan di sini bukan sekadar "kolom yang tidak ada", melainkan **artefak bersama yang tidak dapat dijangkau**.

**Screenshot bukti:**
- [ ] Dialog Resize Proxmox (memperlihatkan label "Size Increment")
- [ ] Tab Hardware VM manual (disk aktual) + VM portal (disk aktual) sebagai pembanding
- [ ] Tab Hardware template Rocky (disk 40 GB — bukti Insiden #2)
- [ ] Wizard portal: tidak ada jalan menuju template (bukti Lapis 3)
- [ ] Lembar observasi terisi

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
- **4.4b Kesalahan manusia (Variabel 3, RM3, deskriptif — TANPA hipotesis):** lembar observasi §2b + insiden tercatat (Lapis 1) + argumen permukaan kesalahan (Lapis 3). **Tanpa uji statistik** — n kecil dan operator = peneliti sendiri; sebutkan bias ini sebagai keterbatasan. Kalau error rate terukur 0, **tulis 0**.
- **4.5 Kebergunaan (H3):** skor SUS + kategori.
- **4.6 Tata kelola (RM2, deskriptif):** laporkan **`t2` (waktu tunggu approval)** di sini sebagai karakteristik *approval workflow* + bukti audit trail. Tegaskan approval juga ada di alur manual namun informal dan tak terekam, sehingga portal memformalkan, bukan menambah, langkah tersebut.
- **4.7 Pembahasan:** kaitkan tiap hasil ke Rumusan Masalah 1–4 + keputusan H0/H1. Cantumkan **batasan ruang lingkup waktu** (§1.a): waktu tunggu keputusan manusia dikeluarkan dari kedua kelompok, dan pengeluaran itu konservatif karena menguntungkan alur manual.

> Alat bantu uji statistik: SPSS / Jamovi / Python (scipy `shapiro`, `ttest_ind`, `wilcoxon`) — **screenshot output ujinya juga** sebagai bukti.
