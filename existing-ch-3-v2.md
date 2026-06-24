# BAB III METODOLOGI PENELITIAN
<!--
  Revisi v2: merge Ch.3 v1 (R&D + diagram UML/ERD + Black Box/UAT) ke kerangka DSRM,
  selaras dengan Bab I v2 (DSRM, 4 Rumusan Masalah) dan Bab II (DSRM, SUS, STRIDE, hipotesis H1-H4).
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

Observasi dilakukan dengan mengamati proses provisioning mesin virtual yang berjalan manual.
Observasi memperlihatkan bahwa pembuatan satu mesin virtual menempuh banyak langkah berulang, mulai
dari penentuan spesifikasi sumber daya, pemilihan template, konfigurasi jaringan, hingga konfigurasi
sistem operasi. Proses tersebut memakan waktu dan membuka peluang kesalahan akibat campur tangan
manusia.

Wawancara dilakukan terhadap pihak pengelola infrastruktur untuk menggali kebutuhan sistem dan proses
bisnis. Hasil wawancara menunjukkan kebutuhan terhadap layanan pengajuan mandiri, mekanisme
persetujuan, otomatisasi provisioning, monitoring inventaris, pencatatan aktivitas melalui audit
trail, serta hardening otomatis setelah mesin virtual terbentuk.

Studi literatur dilakukan dengan mengkaji jurnal, skripsi, dan dokumentasi teknis tentang
virtualisasi, Infrastructure as Code, Terraform, Ansible, Proxmox VE, orkestrasi infrastruktur, server
hardening, kebergunaan, dan keamanan sebagai landasan teoretis serta acuan perancangan.

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
12. Sistem menyediakan inventaris mesin virtual beserta aksi siklus hidup: perpanjangan, Edit Resources
    (perubahan CPU, RAM, dan disk), dan penghapusan.
13. Sistem menyimpan kredensial login per mesin virtual secara terenkripsi dan menampilkannya
    melalui endpoint yang teraudit.
14. Sistem mencatat seluruh aktivitas pengguna dan sistem pada audit trail.

### 3.4.2 Kebutuhan Nonfungsional

1. Aspek keamanan diwujudkan melalui autentikasi berbasis sesi (cookie), otorisasi berbasis peran,
   pembatasan percobaan login (throttle), enkripsi kredensial, dan audit trail.
2. Aspek kinerja mengharuskan sistem memproses permintaan provisioning dan menampilkan status tanpa
   menurunkan responsivitas aplikasi.
3. Aspek ketersediaan menuntut sistem tetap dapat diakses selama layanan infrastruktur berjalan.
4. Aspek kompatibilitas mengharuskan sistem berjalan pada peramban modern dan berintegrasi dengan
   PostgreSQL, Redis, Terraform, Ansible, serta Proxmox VE.
5. Aspek skalabilitas menuntut sistem mendukung pertambahan pengguna, permintaan, dan provider tanpa
   perubahan arsitektur yang berarti.

## 3.5 Perancangan Sistem

### 3.5.1 Arsitektur Sistem

Sistem terdiri atas frontend React, backend Laravel, basis data PostgreSQL, layanan real-time
Reverb, serta integrasi ke Terraform, Ansible, dan Proxmox VE. Backend mengakses provider hanya
melalui satu lapisan driver (abstraksi *ProviderDriver* yang dipilih oleh *ProviderFactory*
berdasarkan tipe provider), sehingga penambahan tipe provider baru tidak mengubah lapisan
orkestrasi, kebijakan, persetujuan, maupun siklus hidup. Setiap permintaan provisioning memakai
direktori kerja dan state Terraform yang terpisah, sehingga proses berjalan independen tanpa konflik
state. Gambar 3.2 menyajikan arsitektur sistem.

[Gambar 3.2 Arsitektur Sistem]

Arsitektur sistem tersusun atas enam lapisan yang tampak pada Gambar 3.2, yaitu klien, edge,
aplikasi, eksekusi asinkron, data, dan infrastruktur eksternal. Pemisahan lapisan ini memisahkan
tanggung jawab antarmuka pengguna, orkestrasi, eksekusi berdurasi panjang, dan penyimpanan, sehingga
tiap lapisan dapat diuji dan diskalakan secara terpisah.

Pada lapisan klien dan edge, antarmuka pengguna berupa aplikasi React (Single Page Application) yang
berjalan di peramban. Seluruh trafik HTTPS melewati nginx sebagai reverse proxy dengan skema
same-origin, yaitu permintaan ke rute /api diteruskan ke API Laravel, sedangkan koneksi WebSocket
diteruskan ke server Reverb. Pendekatan same-origin memungkinkan autentikasi Sanctum berbasis cookie
HttpOnly tanpa menyimpan token pada sisi klien dan menghilangkan kebutuhan konfigurasi CORS lintas
domain.

Pada lapisan aplikasi, inti sistem adalah API REST Laravel beserta layanan domain, yaitu layanan
Provisioning, Approval, Lifecycle, dan Audit. Akses ke provider dipusatkan pada *DiscoveryService*
melalui *ProviderFactory* yang memilih implementasi *ProviderDriver* sesuai tipe provider; pada
penelitian ini implementasinya adalah *ProxmoxProvider* yang bersifat hanya-baca. Server Reverb berada
pada lapisan yang sama dan bertugas mengirim pembaruan real-time ke klien.

Pada lapisan eksekusi asinkron, operasi yang memanggil Proxmox, seperti clone template, perubahan
sumber daya, penghapusan, dan hardening, berdurasi panjang sehingga API tidak menjalankannya inline.
API mengirim job ke antrian Redis, lalu worker queue:work mengambil dan mengeksekusinya.
*TerraformRunner* menjalankan provisioning, Edit Resources, dan penghapusan, sedangkan
*AnsibleRunner* menjalankan hardening. Empat worker melayani antrian default sehingga maksimal empat
proses provisioning berjalan paralel (lihat hasil pada Bab IV). Satu worker terpisah melayani
antrian system untuk memproses event broadcast dan sinkronisasi fakta mesin virtual, sehingga antrian
provisioning yang berat tidak menghambat pembaruan real-time.

Pada lapisan data, PostgreSQL menjadi sumber kebenaran transaksional. Sistem memakai dua instance
Redis dengan peran berbeda: instance pada porta 6379 melayani cache dengan kebijakan LRU yang boleh
menggugurkan entri saat memori penuh, sedangkan instance pada porta 6380 melayani antrian, sesi, dan
pub/sub dengan kebijakan noeviction serta persistensi AOF. Pemisahan ini menjamin job dan sesi
pengguna tidak ikut tergusur ketika cache penuh.

Pada lapisan infrastruktur eksternal, Proxmox VE menjadi target orkestrasi. *DiscoveryService*
membaca sumber daya Proxmox melalui API hanya-baca dan mencerminkannya ke tabel berprefiks
provider_. Setelah provisioning, worker menulis fakta runtime berupa vmid, alamat IP, dan status daya
kembali ke tabel inventory melalui sinkronisasi provider_vms.

Gambar 3.2 memperlihatkan dua pola alur. Pada alur sinkron, permintaan baca dan operasi CRUD pendek
mengalir dari SPA, melewati nginx, menuju API Laravel, lalu API membaca atau menulis PostgreSQL dan
mengembalikan respons JSON. Pada alur asinkron, pengguna mengirim permintaan provisioning; API
menyimpan entitas *ProvisionRequest* dan mengirim *ProvisionVmJob* ke antrian Redis. Worker kemudian
meresolusi sumber daya, menyiapkan direktori kerja Terraform per mesin virtual, dan menjalankan
terraform apply untuk clone template beserta cloud-init di Proxmox. Worker memperbarui status
*Inventory* menjadi Active beserta vmid dan alamat IP, lalu memancarkan event *VmStateChanged*. Event
yang mengimplementasikan antarmuka *ShouldBroadcast* ini diproses pada antrian system, diteruskan
server Reverb, dan diterima klien melalui Laravel Echo sehingga antarmuka diperbarui tanpa polling.

Dua keputusan desain menopang arsitektur ini. Pertama, seam *ProviderDriver* menjadikan provider
sebagai satu titik kontak: penambahan hypervisor lain dilakukan dengan menulis implementasi driver baru
tanpa mengubah lapisan orkestrasi, kebijakan, persetujuan, maupun siklus hidup. Kedua, isolasi
direktori kerja dan state Terraform per mesin virtual membuat kegagalan satu apply tidak merusak
state mesin virtual lain dan memungkinkan batch berjalan paralel. Kedua properti ini menjadi dasar
klaim ekstensibilitas dan skalabilitas yang dibahas pada Rumusan Masalah 1 dan Rumusan Masalah 3.

### 3.5.2 Pemodelan UML

Pemodelan UML pada subbab ini mencakup empat jenis diagram, yaitu use case diagram untuk batasan
fungsi dan aktor, activity diagram untuk alur kerja, sequence diagram untuk urutan interaksi
antarkomponen, dan class diagram untuk struktur kelas domain.

Use case diagram pada Gambar 3.3 menggambarkan batas sistem beserta interaksi tiga aktor, yaitu User,
Approver, dan Admin. Ketiga aktor disusun dalam hubungan generalisasi: Approver mewarisi seluruh
kemampuan User, dan Admin mewarisi seluruh kemampuan Approver. Pada implementasi, aktor User memetakan
peran User, Approver memetakan peran Manager yang berwenang menyetujui permintaan, dan Admin memetakan
peran Administrator. Hubungan generalisasi ini mencerminkan model hak akses berjenjang, yaitu peran
yang lebih tinggi memperoleh kapabilitas peran di bawahnya tanpa pendefinisian ulang.

Aktor User mengakses fungsi swalayan inti. User melakukan login, melihat katalog layanan, mengajukan
permintaan provisioning mesin virtual, melihat status permintaan, dan mengelola inventaris miliknya.
Pengelolaan inventaris dirinci melalui relasi include menjadi empat aksi siklus hidup, yaitu Edit
Resources yang menggabungkan perubahan CPU, RAM, dan disk dalam satu permintaan, memperpanjang masa
berlaku, menjalankan hardening atau patch, dan menghapus mesin virtual. Relasi include menegaskan
bahwa keempat aksi tersebut merupakan bagian wajib dari kemampuan pengelolaan inventaris, bukan use
case yang berdiri sendiri.

Aktor Approver menambahkan kewenangan tata kelola. Approver meninjau daftar permintaan yang menunggu
keputusan dan menetapkan keputusan berupa menyetujui, menolak, atau mengembalikan permintaan. Use
case keputusan memiliki relasi include ke peninjauan daftar, karena keputusan selalu didahului
peninjauan. Kewenangan ini menjadi inti mekanisme persetujuan yang dibahas pada Rumusan Masalah 2
mengenai tata kelola dan keamanan.

Aktor Admin memegang fungsi administrasi platform. Admin mengelola pengguna, peran, dan grup;
mengelola provider dan menjalankan discovery; mengelola katalog, jaringan, datastore, dan node yang
dipublikasikan; mengelola environment dan tier; serta memantau audit log. Pemusatan fungsi
administrasi pada satu aktor menjaga pemisahan tugas antara pengguna swalayan, pemberi persetujuan,
dan pengelola platform.

[Gambar 3.3 Use Case Diagram]

Activity diagram pada Gambar 3.4 menggambarkan alur provisioning mesin virtual dalam tiga swimlane,
yaitu Pengguna, Sistem, dan Approver. Pembagian swimlane memisahkan tanggung jawab tiap pihak
sepanjang proses.

Pada swimlane Pengguna, proses dimulai ketika pengguna memilih environment, lalu memilih provider dan
node, kemudian memilih katalog, tier, jaringan, dan datastore, mengisi nama mesin virtual dan jumlah
instance, dan mengirim permintaan. Urutan ini mengikuti wizard yang membatasi pilihan pada sumber daya
yang diizinkan environment, sehingga pengguna tidak menyusun konfigurasi infrastruktur dari awal.

Pada swimlane Sistem, permintaan pertama melalui simpul keputusan validasi terhadap kebijakan
environment. Sistem memeriksa apakah provider, node, dan tier termasuk dalam daftar izin environment,
serta apakah katalog, jaringan, dan datastore berstatus aktif dan berada pada node yang sama. Jika
tidak valid, sistem menampilkan pesan kesalahan dan proses berakhir tanpa perubahan data.

Permintaan yang lolos validasi memasuki simpul keputusan gerbang persetujuan. Gerbang aktif jika
environment menetapkan approval_required bernilai benar dan pengguna bukan peran privileged, yaitu
Manager atau Administrator. Jika gerbang aktif, sistem membuat entitas *ApprovalRequest* berstatus
Pending dan menyerahkan keputusan kepada Approver. Jika gerbang tidak aktif, baik karena environment
tidak mewajibkan persetujuan maupun karena pengguna berperan privileged, sistem melanjutkan ke
pengiriman job.

Pada swimlane Approver, Approver meninjau permintaan dan menetapkan keputusan. Persetujuan mengarahkan
proses ke pengiriman job, sedangkan penolakan atau pengembalian mengakhiri alur tanpa pembuatan mesin
virtual. Setelah gerbang terlewati, sistem mengirim *ProvisionVmJob* sebanyak jumlah instance yang
diminta. Setiap job dijalankan worker yang menjalankan terraform apply pada direktori kerja terpisah,
sehingga permintaan batch berjalan paralel pada pool worker.

Worker mencatat entitas *Inventory* dengan status Provisioning, lalu mengubahnya menjadi Active setelah
apply selesai. Sistem kemudian memancarkan event *VmStateChanged* yang mendorong pembaruan real-time ke
antarmuka pengguna. Urutan pesan provisioning yang lengkap diperinci pada sequence diagram Gambar 3.7.

[Gambar 3.4 Activity Diagram Provisioning Mesin Virtual]

Activity diagram pada Gambar 3.5 menggambarkan alur keputusan persetujuan dalam dua swimlane, yaitu
Approver dan Sistem. Pada swimlane Approver, proses dimulai ketika Approver membuka daftar permintaan
berstatus Pending, memilih satu permintaan, dan menetapkan keputusan. Diagram menyediakan tiga cabang
keputusan, yaitu Setujui, Tolak, dan Kembalikan.

Cabang Setujui menerapkan keputusan sesuai jenis permintaan. Permintaan provisioning memicu pengiriman
*ProvisionVmJob*; permintaan Edit Resources, hardening, dan penghapusan memicu job yang sesuai;
sedangkan perpanjangan dan penetapan permanen diterapkan sinkron tanpa job, lalu status
*ApprovalRequest* berubah menjadi Approved. Cabang Tolak mengubah status
*ApprovalRequest* menjadi Rejected disertai alasan, dan meninggalkan mesin virtual pada keadaan bersih
sebelum permintaan, karena perubahan tidak diterapkan.

Cabang Kembalikan mengubah status menjadi Reverted dan mengaktifkan kembali draf untuk diedit ulang.
Aksi ini berlaku khusus untuk permintaan jenis provisioning, karena hanya permintaan pembuatan mesin
virtual baru yang memiliki draf wizard sebagai editornya. Permintaan siklus hidup terhadap aset yang
sudah aktif tidak memiliki draf, sehingga hanya menerima Setujui atau Tolak.

Setiap keputusan diakhiri pencatatan audit log dan pemancaran event *ApprovalChanged*. Pencatatan
audit menjadikan tiap keputusan dapat dilacak, sedangkan event broadcast memperbarui daftar persetujuan
pada antarmuka tanpa muat ulang. Mekanisme persetujuan ini menjadi salah satu kontrol tata kelola yang
dibahas pada Rumusan Masalah 2.

[Gambar 3.5 Activity Diagram Approval Request]

Activity diagram pada Gambar 3.6 menggambarkan alur pengelolaan inventaris dalam tiga swimlane, yaitu
Pengguna, Sistem, dan Approver. Diagram ini memakai gerbang persetujuan yang sama seperti provisioning
awal, tetapi menambahkan pemilahan jenis penerapan setelah gerbang terlewati.

Pada swimlane Pengguna, pengguna membuka halaman inventaris, memilih mesin virtual miliknya, dan
memilih satu dari empat aksi siklus hidup, yaitu Edit Resources yang menggabungkan perubahan CPU, RAM,
dan disk dalam satu permintaan, memperpanjang masa berlaku, hardening atau patch, dan menghapus mesin
virtual. Pada swimlane Sistem, setiap aksi
melalui validasi kebijakan environment, lalu memasuki gerbang persetujuan dengan syarat yang sama,
yaitu approval_required bernilai benar dan pengguna bukan peran privileged. Jika gerbang aktif, sistem
membuat *ApprovalRequest* berstatus Pending dan menunggu keputusan Approver. Jika gerbang tidak aktif,
sistem menerapkan perubahan.

Setelah gerbang terlewati, sistem memilah jenis penerapan. Aksi perpanjangan masa berlaku dan
penetapan permanen diterapkan secara sinkron sebagai pembaruan kolom expiry_date atau is_permanent
tanpa pengiriman job, karena keduanya tidak mengubah konfigurasi infrastruktur. Aksi Edit Resources,
hardening, dan penghapusan diterapkan secara asinkron melalui pengiriman job.

Pada jalur asinkron, sistem mengirim job yang sesuai, yaitu *EditResourcesVmJob*, *HardenVmJob*, atau
*DestroyVmJob*. Worker menjalankan Terraform untuk Edit Resources dan penghapusan, serta Ansible untuk
hardening, lalu memperbarui entitas *Inventory* beserta *InventoryDisk* sesuai hasil. Kedua jalur penerapan berujung pada pemancaran event
*VmStateChanged* sehingga antarmuka memperlihatkan keadaan terbaru. Pemilahan sinkron dan asinkron ini
menjaga akurasi diagram terhadap implementasi, karena perpanjangan masa berlaku tidak memanggil
Terraform maupun Ansible.

[Gambar 3.6 Activity Diagram Inventory Mesin Virtual]

Sequence diagram pada Gambar 3.7 menggambarkan urutan pesan provisioning dari pengiriman permintaan
hingga mesin virtual siap. Partisipan mencakup Pengguna, Frontend SPA, API Laravel, basis data,
antrian Redis, worker, Proxmox, dan server Reverb.

Urutan dimulai ketika pengguna mengisi wizard dan Frontend mengirim permintaan POST ke endpoint
provision-requests. API memvalidasi permintaan terhadap daftar izin lima sumber daya environment
sebelum melanjutkan. Diagram memuat fragmen alternatif pada gerbang persetujuan. Jika environment
mewajibkan persetujuan dan pengguna bukan peran privileged, API menyimpan *ProvisionRequest* dan
*ApprovalRequest* berstatus Pending, memancarkan event *ApprovalChanged*, dan mengembalikan respons
berstatus menunggu persetujuan, dengan kelanjutan mengikuti Gambar 3.8. Jika pengguna berperan
privileged atau environment tidak mewajibkan persetujuan, API menyimpan *ProvisionRequest* dan
mengirim job.

Pada cabang langsung, API mengirim *ProvisionVmJob* untuk tiap instance melalui fragmen loop, dengan
penamaan berurutan sesuai indeks instance. Pendekatan ini menjadikan permintaan satu instance maupun
batch memakai jalur yang sama. Fragmen loop berikutnya menggambarkan eksekusi job oleh worker dengan
maksimal empat job paralel pada pool worker. Worker mengambil job dari antrian default, meresolusi
sumber daya, menyiapkan direktori kerja Terraform, dan menjalankan apply untuk clone template,
cloud-init, serta menyalakan mesin virtual.

Setelah apply selesai, Proxmox mengembalikan vmid baru dan alamat IP. Worker memperbarui status
*Inventory* dari Provisioning menjadi Active, lalu memancarkan event *VmStateChanged*. Server Reverb
meneruskan event tersebut ke Frontend sehingga status diperbarui real-time tanpa polling. Batas empat
job paralel berkaitan dengan hasil benchmark backend pada Bab IV dan menjadi dasar pembahasan
efisiensi operasional pada Rumusan Masalah 3.

[Gambar 3.7 Sequence Diagram Provisioning Mesin Virtual]

Sequence diagram pada Gambar 3.8 menggambarkan urutan keputusan persetujuan oleh Approver. Partisipan
mencakup Approver, Frontend SPA, API Laravel, *ApprovalWorkflowService*, basis data, antrian Redis,
dan server Reverb.

Urutan dimulai ketika Approver membuka halaman persetujuan dan Frontend meminta daftar melalui
endpoint approvals. API mengambil daftar berstatus Pending yang telah disaring sesuai peran, lalu
mengembalikannya untuk ditampilkan. Approver memilih satu permintaan dan menekan tombol Setujui,
Tolak, atau Kembalikan. Frontend mengirim permintaan ke endpoint aksi disertai alasan bila diperlukan,
dan API meneruskannya ke *ApprovalWorkflowService*.

Diagram memuat fragmen alternatif untuk tiap keputusan. Pada cabang Setujui, layanan mengubah status
menjadi Approved, lalu memilah jenis permintaan melalui fragmen alternatif bersarang: permintaan
provisioning mengirim *ProvisionVmJob* untuk tiap instance melalui loop; permintaan Edit Resources,
hardening, dan penghapusan mengirim satu job sesuai jenisnya; sedangkan perpanjangan dan penetapan
permanen diterapkan sinkron tanpa job. Pada cabang Tolak, layanan mengubah status menjadi Rejected
disertai alasan. Pada cabang Kembalikan, layanan mengubah status menjadi Reverted dan mengembalikan
*ProvisionRequest* menjadi draf yang siap diedit ulang, dan cabang ini berlaku khusus untuk permintaan
provisioning.

Setiap cabang ditutup dengan penulisan audit log dan pemancaran event *ApprovalChanged*. API
mengembalikan respons keberhasilan ke Frontend, sedangkan server Reverb mendorong pembaruan ke seluruh
klien terkait sehingga daftar persetujuan diperbarui tanpa muat ulang.

[Gambar 3.8 Sequence Diagram Approval Request]

Sequence diagram pada Gambar 3.9 memperinci proses internal satu *ProvisionVmJob*, dari resolusi
sumber daya hingga sinkronisasi fakta mesin virtual. Diagram ini melengkapi Gambar 3.7 dengan
menampilkan lapisan layanan internal. Partisipan mencakup worker, *ResourceResolutionService*,
*WorkspaceService*, *TerraformRunner*, Proxmox, basis data, antrian system, dan server Reverb.

Worker memuat *ProvisionRequest* beserta sumber daya yang dipublikasikan, lalu memanggil
*ResourceResolutionService* untuk meresolusi katalog, node, jaringan, datastore, dan tier menjadi
identifier provider yang konkret, yaitu vmid template, bridge, dan storage. Resolusi memisahkan
identitas ramah pengguna dari identitas teknis provider. Worker kemudian meminta *WorkspaceService*
menyiapkan direktori kerja khusus untuk mesin virtual tersebut. Tiap mesin virtual memperoleh
direktori kerja dan berkas state Terraform sendiri, sehingga eksekusi satu mesin virtual tidak
memengaruhi state mesin virtual lain.

*TerraformRunner* menjalankan apply terhadap Proxmox. Proses ini melakukan clone template menjadi vmid
baru, menulis konfigurasi cloud-init berupa pengguna, kunci SSH, jaringan, dan hostname, lalu
menyalakan mesin virtual. Proxmox mengembalikan vmid baru dan alamat IP awal yang terdeteksi.

Diagram memuat fragmen alternatif untuk hasil apply. Pada keberhasilan, worker memperbarui status
*Inventory* menjadi Active beserta vmid, alamat IP, dan kredensial login terenkripsi yang tersimpan
pada baris inventaris. Worker lalu mengirim *SyncVmFactsJob* dengan jeda lima detik ke antrian system
untuk mengejar alamat IP yang dilaporkan agen tamu setelah mesin virtual selesai melakukan boot, dan
memancarkan event *VmStateChanged* dari status Provisioning menjadi Active. Pada kegagalan, worker
memperbarui status *Inventory* menjadi Failed beserta pesan kesalahan, lalu memancarkan event
*VmStateChanged* dari status Provisioning menjadi Failed. Penempatan *SyncVmFactsJob* pada antrian
system memastikan sinkronisasi fakta tidak menghambat antrian provisioning.

[Gambar 3.9 Sequence Diagram Provisioning Terraform]

Class diagram pada Gambar 3.10 menggambarkan struktur kelas domain, yaitu model Eloquent pada
direktori backend/app/Models. Nama atribut diselaraskan dengan kolom kunci pada ERD Gambar 3.11,
sedangkan kolom foreign key tidak ditampilkan eksplisit karena diwakili relasi antarkelas. Kelas
layanan tidak ditampilkan agar diagram fokus pada entitas data. Kelas dikelompokkan menjadi tujuh
kelompok sesuai lapisan arsitektur.

Kelompok IAM terdiri atas *User*, *Role*, dan *Group*, dengan *User* terhubung ke satu *Role* dan satu
*Group*, serta *Group* dipimpin satu *User*. Kelompok mirror provider terdiri atas *Provider* beserta
*ProviderNode*, *ProviderTemplate*, *ProviderNetwork*, *ProviderDatastore*, dan *ProviderVm*, yang
menyimpan hasil discovery sumber daya provider, dan satu *Provider* memiliki banyak entitas pada tiap
kelas mirror tersebut.

Kelompok abstraksi terpublikasi terdiri atas *Node*, *Catalog*, *Network*, dan *Datastore*, yang
masing-masing menjadi alias bagi satu entitas mirror provider, ditambah *CatalogHardeningVersion* yang
menyimpan versi playbook hardening per katalog. Kelompok tier berisi *Tier* dengan atribut vcpu,
ram_mb, dan disk_gb. Kelompok environment berisi *Environment* yang menyimpan kebijakan masa berlaku,
masa tenggang, gerbang persetujuan, dan kuota disk, serta terhubung ke *Provider*, *Node*, *Tier*,
*Network*, dan *Datastore* melalui lima tabel aturan.

Kelompok alur kerja terdiri atas *ProvisionRequest*, *ApprovalRequest*, *Inventory*, dan
*InventoryDisk*. Satu *User* mengajukan banyak *ProvisionRequest*; satu *ProvisionRequest* menghasilkan
banyak *Inventory* dan dapat memiliki satu *ApprovalRequest*; satu *Inventory* memiliki banyak
*InventoryDisk* serta banyak *ApprovalRequest* siklus hidup. *Inventory* juga terhubung ke
*CatalogHardeningVersion* sebagai versi hardening yang diterapkan. Kelompok audit berisi *AuditLog*
yang mencatat tiap aktivitas pengguna beserta metadata. Pengelompokan ini memperlihatkan pemisahan
tanggung jawab antara identitas, cerminan provider, abstraksi terpublikasi, kebijakan, alur kerja, dan
audit.

[Gambar 3.10 Class Diagram]

### 3.5.3 Perancangan Basis Data dan ERD

Basis data memakai PostgreSQL. Entity Relationship Diagram pada Gambar 3.11 menggambarkan entitas
dan relasinya.

[Gambar 3.11 Entity Relationship Diagram]

Skema terdiri atas dua puluh enam tabel domain yang dikelompokkan menjadi tujuh kelompok, di luar
tabel kerangka kerja Laravel yang tidak menyimpan data domain.

Kelompok IAM terdiri atas tabel roles, groups, dan users. Tabel users merujuk roles dan groups,
sedangkan groups merujuk users melalui kolom manager_user_id untuk menandai pemimpin grup. Relasi ini
menjadi dasar penyelesaian approver dan pelingkupan data berbasis peran.

Kelompok hasil discovery terdiri atas providers beserta provider_nodes, provider_templates,
provider_networks, provider_datastores, dan provider_vms. Tabel providers menyimpan konfigurasi
koneksi, sedangkan kelima tabel turunannya menyimpan cerminan sumber daya Proxmox dan merujuk
providers serta provider_nodes. Lapisan ini berfungsi sebagai cerminan baca yang dipisahkan dari
sumber daya yang dipublikasikan.

Kelompok publikasi terdiri atas nodes, catalogs, networks, datastores, dan catalog_hardening_versions.
Tiap tabel publikasi merujuk lapisan discovery, misalnya catalogs merujuk provider_templates dan
provider_nodes, sehingga alias ramah pengguna selalu terikat pada sumber daya nyata. Pemisahan lapisan
publikasi dari lapisan discovery menjadi penerapan pola anti-corruption layer yang melindungi katalog
layanan dari perubahan mentah pada Proxmox.

Kelompok kebijakan terdiri atas tiers, environments, dan lima tabel aturan, yaitu
environment_provider_rules, environment_node_rules, environment_tier_rules, environment_network_rules,
dan environment_datastore_rules. Tiap tabel aturan menghubungkan environments dengan satu jenis sumber
daya yang diizinkan. Struktur lima tabel aturan ini mewujudkan kebijakan sebagai konfigurasi, yaitu
batasan sumber daya dapat diubah tanpa mengubah kode.

Kelompok permintaan terdiri atas provision_requests dan approval_requests. Tabel provision_requests
menyimpan identifier sumber daya terpublikasi yang dipilih pengguna, sedangkan approval_requests
memakai rujukan polimorfik melalui kolom request_type dan reference_id agar satu tabel persetujuan
melayani permintaan provisioning maupun aksi siklus hidup, beserta kolom payload yang menyimpan
perubahan yang menunggu persetujuan.

Kelompok inventaris terdiri atas inventory dan inventory_disks, sedangkan kelompok audit berisi
audit_logs. Tabel inventory menyimpan rujukan ke sumber daya terpublikasi dan ke provision_requests
untuk pelacakan asal, serta kolom external_vmid yang menjadi titik sinkronisasi fakta dari
provider_vms. Tabel audit_logs menyimpan action_type, description, dan metadata dalam bentuk JSON untuk
penelusuran. Pemisahan tujuh kelompok ini, ditambah lapisan cerminan dan lapisan publikasi yang
terpisah, menjadi dasar argumen tata kelola pada Rumusan Masalah 2.

### 3.5.4 Lapisan Abstraksi dan Kebijakan

Lapisan abstraksi menyembunyikan kompleksitas Proxmox dari pengguna. Discovery mencerminkan sumber
daya mentah Proxmox (node, template, jaringan, datastore, mesin virtual) ke dalam tabel
provider_. Publikasi memetakan sumber daya mentah tersebut menjadi alias ramah pengguna, misalnya
template rocky-golden menjadi katalog rocky-linux-8, bridge vmbr0 menjadi jaringan VLAN-DEV,
dan storage pool local-lvm menjadi datastore Disk-ssd-dev. Dengan demikian pengguna menyusun
mesin virtual dari pilihan menu, tanpa menyentuh berkas HCL, identifier bridge, atau nama storage
pool.

Lapisan kebijakan berpusat pada environment. Environment membatasi provider, node, tier, jaringan,
dan datastore melalui lima tabel aturan, sehingga pengguna hanya melihat sumber daya yang
dialirkan ke node yang diizinkan. Environment juga mengatur gerbang persetujuan
(approval_required), masa berlaku dan masa tenggang, serta kuota disk data. Tier menstandarkan
ukuran sumber daya (CPU, RAM, penyimpanan) lepas dari provider.

Gambar 3.12 menyajikan aliran data lapisan abstraksi, dari sumber daya mentah
Proxmox, melalui pencerminan discovery dan publikasi alias, hingga kebijakan
environment yang membatasi pilihan pada wizard.

[Gambar 3.12 Diagram Aliran Data Lapisan Abstraksi]

Diagram aliran data pada Gambar 3.12 memperlihatkan empat tahap transformasi sumber daya. Tahap
pertama adalah domain Proxmox mentah yang berisi node, template, bridge, storage pool, dan mesin
virtual yang sedang berjalan. Tahap kedua adalah discovery, yaitu driver hanya-baca yang mencerminkan
sumber daya mentah tersebut ke tabel provider_nodes, provider_templates, provider_networks,
provider_datastores, dan provider_vms.

Tahap ketiga adalah publikasi, yaitu pemetaan sumber daya hasil discovery menjadi alias terkurasi yang
berstatus aktif atau nonaktif. Administrator memetakan template menjadi katalog, bridge menjadi
jaringan, dan storage pool menjadi datastore dengan nama ramah pengguna. Tahap keempat adalah kebijakan
yang berpusat pada environment beserta lima tabel aturan, yang menyaring sumber daya terpublikasi
menjadi himpunan yang boleh dipakai pengguna, ditambah tier yang menstandarkan ukuran sumber daya.

Aliran berakhir pada wizard provisioning. Wizard menampilkan hanya sumber daya yang lolos saringan
environment, sehingga pengguna menyusun mesin virtual dari pilihan menu tanpa menyentuh berkas HCL,
identifier bridge, maupun nama storage pool. Setelah mesin virtual terbentuk, fakta runtime dari
provider_vms disinkronkan kembali ke tabel inventory, sehingga keadaan yang ditampilkan portal
mengikuti keadaan nyata pada Proxmox.

Lapisan abstraksi ini menjadi inti kontribusi yang dibahas pada Rumusan Masalah 1, yaitu menyediakan
kekakuan Infrastructure as Code tanpa membebani pengguna dengan kurva belajar Infrastructure as Code.
Pemisahan antara cerminan mentah, alias terkurasi, dan kebijakan menjadikan kompleksitas Proxmox
tersembunyi, sedangkan tata kelola tetap terjaga melalui saringan environment.

## 3.6 Pengembangan Sistem

Peneliti membangun sistem secara iteratif dan incremental, menambah fungsi bertahap sambil menerapkan
security-by-design. Implementasi mencakup komponen frontend, backend, basis data, Terraform, Ansible,
serta integrasi antarbagian.

Pada sisi frontend, React.js dengan pendekatan Single Page Application menyajikan halaman login,
dashboard, katalog, provisioning, approval, inventaris, dan settings. Pada sisi backend, Laravel
menyediakan API, logika bisnis, autentikasi berbasis sesi, otorisasi berbasis peran, pengelolaan data
master, alur persetujuan, pengelolaan inventaris, audit trail, serta integrasi Terraform dan Ansible.
Basis data PostgreSQL menyimpan seluruh data sistem dan mendukung transaksi yang konsisten.

Terraform menerjemahkan parameter pengguna menjadi konfigurasi infrastruktur lalu menerapkannya ke
Proxmox VE, dengan direktori kerja dan state terpisah untuk tiap permintaan. Ansible menjalankan
playbook hardening atas mesin virtual yang terbentuk, memakai inventory dinamis dari hasil
provisioning dan koneksi SSH berbasis kunci.

Pada sisi integrasi, frontend memanggil backend melalui API. Saat provisioning, backend memanggil
Terraform untuk membuat mesin virtual, lalu menjalankan Ansible untuk hardening. Sistem mencatat
seluruh aktivitas ke basis data dan menampilkannya kembali melalui halaman inventaris, approval,
audit trail, serta notifikasi real-time.

## 3.7 Demonstrasi

Peneliti mendemonstrasikan kelayakan artefak dengan menjalankan alur penuh pada cluster Proxmox
nyata: permintaan, persetujuan, provisioning Terraform, hardening Ansible, dan siklus hidup
(perpanjangan, Edit Resources, penghapusan). Demonstrasi multi-cluster menambahkan provider
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
risiko sisa sebagai daftar pengerasan tahap produksi. Evaluasi ini mendukung jawaban atas Rumusan Masalah 2.
