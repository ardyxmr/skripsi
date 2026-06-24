# BAB III — METODOLOGI PENELITIAN
<!--
  Revisi v2: merge Ch.3 v1 (R&D + diagram UML/ERD + Black Box/UAT) ke kerangka DSRM,
  selaras dengan Bab I v2 (DSRM, 4 RQ) dan Bab II (DSRM, SUS, STRIDE, hipotesis H1-H4).
  Perubahan utama vs v1:
   1. Kerangka: Research & Development -> Design Science Research Methodology (Peffers dkk. 2007),
      model pengembangan iteratif-inkremental + security-by-design.
   2. Entitas basis data diselaraskan ke skema nyata (provider_* discovered layer, lapisan published,
      lima rule table environment, provision_requests, approval_requests, inventory, audit_logs).
   3. Rancangan evaluasi diperluas: verifikasi fungsional (pengujian otomatis) + benchmark efisiensi
      + SUS + STRIDE. UAT "Baik" v1 digantikan SUS. Hasil pengujian dipindah ke Bab IV.
   4. Artefak konkret v1 dipertahankan: Use Case, Activity, Sequence, Class Diagram, ERD, tabel skenario.
  Kaidah: lolos stop-slop (tanpa em-dash, buang adverbia/intensifier, kalimat langsung).
  SITASI: tanda [SITASI DIBUTUHKAN: ...] menandai sumber yang masih perlu diisi dari Mendeley/Zotero.
-->

## 3.1 Kerangka Metodologi Penelitian

Penelitian ini memakai kerangka Design Science Research Methodology (DSRM) yang dirumuskan Peffers
dkk. (2007). DSRM cocok karena penelitian membangun dan mengevaluasi sebuah artefak berupa aplikasi
web self-service, sekaligus menghasilkan pengetahuan perancangan yang dapat dialihgunakan. DSRM
menempuh enam aktivitas: identifikasi masalah dan motivasi, penetapan tujuan solusi, perancangan
dan pengembangan, demonstrasi, evaluasi, serta komunikasi. Gambar 3.1 menyajikan alur keenam
aktivitas tersebut.

[Gambar 3.1 Alur Design Science Research Methodology]

Pada aktivitas perancangan dan pengembangan, peneliti memakai model iteratif dan incremental, yaitu
membangun sistem bertahap berdasarkan kebutuhan fungsional. Peneliti menerapkan keamanan sebagai
aspek lintas-tahap (security-by-design), yaitu memperkenalkan kendali keamanan pada setiap
penambahan fungsi sejak awal pengembangan. Tabel 3.1 memetakan aktivitas DSRM ke tahapan penelitian.

**Tabel 3.1 Pemetaan Aktivitas DSRM ke Tahapan Penelitian**

| Aktivitas DSRM | Tahapan penelitian | Subbab |
|----------------|--------------------|--------|
| 1. Identifikasi masalah & motivasi | Observasi dan wawancara atas provisioning manual | 3.3, 3.4 |
| 2. Penetapan tujuan solusi | Analisis kebutuhan fungsional dan nonfungsional | 3.4 |
| 3. Perancangan & pengembangan | Perancangan sistem dan pembangunan artefak | 3.5, 3.6 |
| 4. Demonstrasi | Alur end-to-end pada cluster Proxmox nyata | 3.7 |
| 5. Evaluasi | Verifikasi fungsional, benchmark, SUS, STRIDE | 3.8 |
| 6. Komunikasi | Penulisan laporan skripsi | Bab IV, Bab V |

## 3.2 Alat dan Bahan

Tabel 3.2 merinci perangkat lunak yang dipakai untuk membangun dan menjalankan sistem.

**Tabel 3.2 Perangkat Lunak**

| Komponen | Perangkat lunak |
|----------|-----------------|
| Platform virtualisasi | Proxmox Virtual Environment 9.1 |
| Provisioning (IaC) | Terraform |
| Konfigurasi & hardening | Ansible |
| Frontend | React.js (Single Page Application) |
| Backend | Laravel (PHP) |
| Basis data | PostgreSQL |
| Sesi & real-time | Redis dan Laravel Reverb (WebSocket) |
| Pengujian otomatis | PHPUnit |

Perangkat keras untuk pengembangan dan pengujian mencakup prosesor, memori, media penyimpanan, dan
jaringan yang mampu menjalankan frontend, backend, basis data, serta proses provisioning ke Proxmox
VE [SITASI DIBUTUHKAN: spesifikasi perangkat keras laboratorium yang dipakai].

## 3.3 Metode Pengumpulan Data

Peneliti mengumpulkan data melalui observasi, wawancara, dan studi literatur.

**Observasi.** Peneliti mengamati langsung proses provisioning mesin virtual yang berjalan manual.
Observasi memperlihatkan bahwa pembuatan satu mesin virtual menempuh banyak langkah berulang, mulai
dari penentuan spesifikasi sumber daya, pemilihan template, konfigurasi jaringan, hingga konfigurasi
sistem operasi. Proses tersebut memakan waktu dan membuka peluang kesalahan akibat campur tangan
manusia.

**Wawancara.** Peneliti mewawancarai pihak pengelola infrastruktur untuk menggali kebutuhan sistem
dan proses bisnis. Hasil wawancara menunjukkan kebutuhan terhadap layanan pengajuan mandiri,
mekanisme persetujuan, otomatisasi provisioning, monitoring inventaris, pencatatan aktivitas melalui
audit trail, serta hardening otomatis setelah mesin virtual terbentuk.

**Studi literatur.** Peneliti mengkaji jurnal, skripsi, dan dokumentasi teknis tentang virtualisasi,
Infrastructure as Code, Terraform, Ansible, Proxmox VE, orkestrasi infrastruktur, server hardening,
kebergunaan, dan keamanan sebagai landasan teoretis serta acuan perancangan.

## 3.4 Analisis Kebutuhan

Peneliti membagi kebutuhan sistem menjadi kebutuhan fungsional dan nonfungsional.

### 3.4.1 Kebutuhan Fungsional

1. Sistem menyediakan autentikasi dan otorisasi berbasis peran (User, Approver, Admin).
2. Administrator mengelola pengguna, peran, dan grup.
3. Sistem menemukan sumber daya provider (discovery) lalu memublikasikannya sebagai katalog,
   jaringan, datastore, dan node dengan nama yang ramah pengguna.
4. Sistem mengelola lebih dari satu provider Proxmox dari satu kendali terpusat (multi-provider).
5. Administrator menyusun kebijakan lingkungan (environment) yang membatasi provider, node, tier,
   jaringan, dan datastore yang boleh dipakai, beserta masa berlaku, masa tenggang, dan kuota disk.
6. Administrator menetapkan standar sumber daya (tier) untuk CPU, RAM, dan penyimpanan.
7. Pengguna mengajukan provisioning mesin virtual melalui portal self-service tanpa menulis kode.
8. Approver menyetujui, menolak, atau mengembalikan (approve, reject, revert) permintaan, disertai
   alasan yang tercatat.
9. Sistem menjalankan provisioning melalui Terraform setelah permintaan disetujui.
10. Sistem menjalankan hardening melalui Ansible sesuai versi playbook katalog yang dipilih.
11. Sistem menampilkan status provisioning secara real-time melalui WebSocket.
12. Sistem menyediakan inventaris mesin virtual beserta aksi siklus hidup: perpanjangan, perubahan
    sumber daya (resize), penambahan disk, dan penghapusan.
13. Sistem menyimpan kredensial login per mesin virtual secara terenkripsi dan menampilkannya
    melalui endpoint yang teraudit.
14. Sistem mencatat seluruh aktivitas pengguna dan sistem pada audit trail.

### 3.4.2 Kebutuhan Nonfungsional

1. **Keamanan.** Sistem menerapkan autentikasi berbasis sesi (cookie), otorisasi berbasis peran,
   pembatasan percobaan login (throttle), enkripsi kredensial, dan audit trail.
2. **Kinerja.** Sistem memproses permintaan provisioning serta menampilkan status tanpa mengganggu
   responsivitas aplikasi.
3. **Ketersediaan.** Sistem tersedia selama layanan infrastruktur berjalan.
4. **Kompatibilitas.** Sistem berjalan pada peramban modern dan berintegrasi dengan PostgreSQL,
   Redis, Terraform, Ansible, serta Proxmox VE.
5. **Skalabilitas.** Sistem mendukung pertambahan pengguna, permintaan, dan provider tanpa mengubah
   arsitektur secara berarti.

## 3.5 Perancangan Sistem

### 3.5.1 Arsitektur Sistem

Sistem terdiri atas frontend React, backend Laravel, basis data PostgreSQL, layanan real-time
Reverb, serta integrasi ke Terraform, Ansible, dan Proxmox VE. Backend mengakses provider hanya
melalui satu lapisan driver (abstraksi `ProviderDriver` yang dipilih oleh `ProviderFactory`
berdasarkan tipe provider), sehingga penambahan tipe provider baru tidak mengubah lapisan
orkestrasi, kebijakan, persetujuan, maupun siklus hidup. Setiap permintaan provisioning memakai
direktori kerja dan state Terraform yang terpisah, sehingga proses berjalan independen tanpa konflik
state. Gambar 3.2 menyajikan arsitektur sistem.

[Gambar 3.2 Arsitektur Sistem]

### 3.5.2 Pemodelan UML

**Use Case Diagram.** Diagram ini menggambarkan interaksi tiga aktor dengan sistem. User melihat
katalog, mengajukan provisioning, dan mengelola inventaris miliknya. Approver menyetujui, menolak,
atau mengembalikan permintaan. Admin mengelola pengguna, provider, katalog, jaringan, datastore,
environment, tier, serta memantau seluruh aktivitas.

[Gambar 3.3 Use Case Diagram]

**Activity Diagram.** Diagram aktivitas menggambarkan alur provisioning, alur persetujuan, dan alur
pengelolaan inventaris.

[Gambar 3.4 Activity Diagram Provisioning Mesin Virtual]
[Gambar 3.5 Activity Diagram Approval Request]
[Gambar 3.6 Activity Diagram Inventory Mesin Virtual]

**Sequence Diagram.** Diagram sekuens menggambarkan urutan interaksi pada provisioning, persetujuan,
dan eksekusi Terraform ke Proxmox VE.

[Gambar 3.7 Sequence Diagram Provisioning Mesin Virtual]
[Gambar 3.8 Sequence Diagram Approval Request]
[Gambar 3.9 Sequence Diagram Provisioning Terraform]

**Class Diagram.** Diagram kelas menggambarkan struktur kelas utama beserta relasinya.

[Gambar 3.10 Class Diagram]

### 3.5.3 Perancangan Basis Data dan ERD

Basis data memakai PostgreSQL. Entity Relationship Diagram pada Gambar 3.11 menggambarkan entitas
dan relasinya.

[Gambar 3.11 Entity Relationship Diagram]

Entitas utama sistem meliputi:

1. **users, roles, groups** menyimpan data pengguna, peran, dan grup.
2. **providers** menyimpan konfigurasi provider infrastruktur.
3. **provider_nodes, provider_templates, provider_networks, provider_datastores, provider_vms**
   menyimpan hasil discovery sumber daya provider (lapisan tercermin/mirror).
4. **nodes, catalogs, networks, datastores** menyimpan sumber daya yang dipublikasikan dengan nama
   ramah pengguna dan terikat ke sumber daya hasil discovery.
5. **catalog_hardening_versions** menyimpan versi playbook hardening per katalog.
6. **tiers** menyimpan standar CPU, RAM, dan penyimpanan.
7. **environments** menyimpan kebijakan lingkungan, bersama lima tabel aturan
   (**environment_provider_rules, environment_node_rules, environment_tier_rules,
   environment_network_rules, environment_datastore_rules**) yang membatasi sumber daya yang boleh
   dipakai.
8. **provision_requests** menyimpan permintaan provisioning.
9. **approval_requests** menyimpan proses persetujuan beserta alasan dan payload.
10. **inventory** dan **inventory_disks** menyimpan mesin virtual yang terbentuk beserta disknya.
11. **audit_logs** menyimpan catatan aktivitas pengguna dan sistem.

### 3.5.4 Lapisan Abstraksi dan Kebijakan

Lapisan abstraksi menyembunyikan kompleksitas Proxmox dari pengguna. Discovery mencerminkan sumber
daya mentah Proxmox (node, template, jaringan, datastore, mesin virtual) ke dalam tabel
`provider_*`. Publikasi memetakan sumber daya mentah tersebut menjadi alias ramah pengguna, misalnya
template `rocky-golden` menjadi katalog `rocky-linux-8`, bridge `vmbr0` menjadi jaringan `VLAN-DEV`,
dan storage pool `local-lvm` menjadi datastore `Disk-ssd-dev`. Dengan demikian pengguna menyusun
mesin virtual dari pilihan menu, tanpa menyentuh berkas HCL, identifier bridge, atau nama storage
pool.

Lapisan kebijakan berpusat pada environment. Environment membatasi provider, node, tier, jaringan,
dan datastore melalui lima tabel aturan, sehingga pengguna hanya melihat sumber daya yang
dialirkan ke node yang diizinkan. Environment juga mengatur gerbang persetujuan
(`approval_required`), masa berlaku dan masa tenggang, serta kuota disk data. Tier menstandarkan
ukuran sumber daya (CPU, RAM, penyimpanan) lepas dari provider.

Gambar 3.12 menyajikan aliran data lapisan abstraksi, dari sumber daya mentah
Proxmox, melalui pencerminan discovery dan publikasi alias, hingga kebijakan
environment yang membatasi pilihan pada wizard.

[Gambar 3.12 Diagram Aliran Data Lapisan Abstraksi]

## 3.6 Pengembangan Sistem

Peneliti membangun sistem secara iteratif dan incremental, menambah fungsi bertahap sambil menerapkan
security-by-design. Implementasi mencakup komponen berikut.

**Frontend.** React.js dengan pendekatan Single Page Application menyajikan halaman login,
dashboard, katalog, provisioning, approval, inventaris, dan settings.

**Backend.** Laravel menyediakan API, logika bisnis, autentikasi berbasis sesi, otorisasi berbasis
peran, pengelolaan data master, alur persetujuan, pengelolaan inventaris, audit trail, serta
integrasi Terraform dan Ansible.

**Basis data.** PostgreSQL menyimpan seluruh data sistem dan mendukung transaksi yang konsisten.

**Terraform.** Terraform menerjemahkan parameter pengguna menjadi konfigurasi infrastruktur lalu
menerapkannya ke Proxmox VE. Sistem membentuk direktori kerja dan state terpisah untuk tiap
permintaan.

**Ansible.** Ansible menjalankan playbook hardening atas mesin virtual yang terbentuk, memakai
inventory dinamis dari hasil provisioning dan koneksi SSH berbasis kunci.

**Integrasi.** Frontend memanggil backend melalui API. Saat provisioning, backend memanggil
Terraform untuk membuat mesin virtual, lalu menjalankan Ansible untuk hardening. Sistem mencatat
seluruh aktivitas ke basis data dan menampilkannya kembali melalui halaman inventaris, approval,
audit trail, serta notifikasi real-time.

## 3.7 Demonstrasi

Peneliti mendemonstrasikan kelayakan artefak dengan menjalankan alur penuh pada cluster Proxmox
nyata: permintaan, persetujuan, provisioning Terraform, hardening Ansible, dan siklus hidup
(perpanjangan, resize, penambahan disk, penghapusan). Demonstrasi multi-cluster menambahkan provider
Proxmox kedua untuk memperlihatkan bahwa jalur driver provider berjalan pada dua cluster tanpa
perubahan kode.

## 3.8 Rancangan Evaluasi

Evaluasi memakai empat metode yang saling melengkapi. Setiap metode menjawab pertanyaan penelitian
tertentu (lihat Bab I dan Bab II). Hasil pengujian disajikan pada Bab IV.

### 3.8.1 Verifikasi Fungsional

Verifikasi fungsional memastikan logika aplikasi berjalan benar. Peneliti menyusun rangkaian
pengujian otomatis (PHPUnit) yang menjalankan jalur HTTP nyata terhadap basis data PostgreSQL, dan
memalsukan antrian pekerjaan (job bus) sehingga pengujian tidak menjalankan Terraform atau Ansible
yang sesungguhnya. Selain pengujian otomatis, Tabel 3.3 mendefinisikan skenario pengujian fungsional
beserta hasil yang diharapkan; hasil aktual dilaporkan pada Bab IV.

**Tabel 3.3 Skenario Pengujian Fungsional**

| No | Fitur | Skenario | Hasil yang diharapkan |
|----|-------|----------|-----------------------|
| 1 | Login | Pengguna memasukkan kredensial valid | Sistem menampilkan dashboard sesuai peran |
| 2 | Katalog | Pengguna memilih template | Sistem menampilkan detail katalog terpilih |
| 3 | Provisioning | Pengguna mengisi formulir dan mengirim permintaan | Sistem menyimpan permintaan berstatus Pending |
| 4 | Approval | Approver menyetujui permintaan | Sistem mengubah status menjadi Approved |
| 5 | Reject | Approver menolak permintaan | Sistem menyimpan alasan dan status Rejected |
| 6 | Revert | Approver mengembalikan permintaan | Sistem mengubah status menjadi perlu perbaikan |
| 7 | Terraform | Sistem menjalankan provisioning | Mesin virtual terbentuk pada Proxmox VE |
| 8 | Ansible | Opsi hardening aktif | Sistem menjalankan playbook hardening |
| 9 | Inventaris | Pengguna membuka inventaris | Sistem menampilkan daftar mesin virtual |
| 10 | Audit trail | Sistem mencatat aktivitas | Aktivitas tersimpan pada audit log |

### 3.8.2 Studi Komparatif Efisiensi Operasional

Studi ini membandingkan upaya operasional aplikasi terhadap antarmuka Proxmox bawaan. Studi ini
bukan perbandingan kecepatan hypervisor karena kedua jalur memanggil API Proxmox yang sama; fokusnya
pada upaya operator, konsistensi, dan penskalaan batch. Variabel bebas adalah metode (aplikasi atau
antarmuka Proxmox) dan ukuran batch N pada nilai 1, 5, dan 10. Variabel terikat adalah jumlah aksi
operator, waktu interaksi aktif (detik), dan tingkat inkonsistensi konfigurasi. Variabel kontrol
mencakup template, node, spesifikasi, jaringan, operator, serta kondisi cluster yang sama. Peneliti
mengulang tiap kombinasi minimal tiga kali dan melaporkan rata-rata beserta simpangan baku. Studi
ini menguji H1, H2, dan H3.

### 3.8.3 Evaluasi Kebergunaan (SUS)

Peneliti memakai System Usability Scale (Brooke, 1996) yang berisi sepuluh pernyataan dengan skala
Likert lima tingkat. Responden mengisi SUS segera setelah memakai tiap metode, baik aplikasi maupun
antarmuka Proxmox bawaan, sehingga menghasilkan skor kebergunaan komparatif. Perhitungan mengikuti
prosedur SUS dan menghasilkan skor 0 sampai 100. Evaluasi ini menguji H4.

### 3.8.4 Evaluasi Keamanan (STRIDE)

Peneliti mengevaluasi keamanan melalui pemodelan ancaman STRIDE. Peneliti mendaftar aset dan batas
kepercayaan, memetakan tiap ancaman ke kendali yang diterapkan beserta buktinya, lalu mencatat
risiko sisa sebagai daftar pengerasan tahap produksi. Evaluasi ini mendukung jawaban atas RQ2.
