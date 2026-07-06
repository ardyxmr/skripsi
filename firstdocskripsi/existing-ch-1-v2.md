# BAB I PENDAHULUAN
<!--
  REVISI v2 (selaras dengan sistem final + kerangka DSRM).
  Perubahan utama vs v1:
   1. Metode penelitian: Research & Development (R&D) -> Design Science Research Methodology (DSRM, Peffers dkk. 2007),
      dengan model pengembangan iteratif-inkremental + security-by-design.
   2. Rumusan masalah & tujuan: 5 butir berorientasi-fitur -> 4 RQ/RO co-equal yang dipetakan 1:1 ke metode evaluasi.
   3. Latar belakang menambah sudut pandang: kompleksitas IaC/CLI bagi non-pakar/UKM, lapisan abstraksi (anti-corruption),
      tata kelola (approval + kebijakan + audit), dan orkestrasi multi-provider.
   4. Batasan: multi-cluster (in) vs multi-hypervisor & multi-tenancy penuh (future work); evaluasi diperluas
      (uji fungsional + benchmark efisiensi + SUS + STRIDE).
   5. Sistematika diperluas dari Bab I-III (proposal) menjadi Bab I-V.
  v2.1: lolos stop-slop (buang adverbia/intensifier "sangat/relatif/umumnya", hapus em-dash, hapus kontras
        "tidak hanya...tetapi", variasikan pembuka paragraf; register pasif akademik Bahasa dipertahankan
        di tempat yang dituntut konvensi skripsi).
  CATATAN SITASI: referensi v1 dipertahankan; tambahkan Peffers dkk. (2007) dan Brooke (1996) ke daftar pustaka.
-->

## 1.1 Latar Belakang

Perkembangan teknologi informasi mendorong organisasi mengadopsi infrastruktur komputasi yang
semakin kompleks untuk mendukung kebutuhan operasional, penyimpanan data, dan penyediaan layanan
digital. Infrastruktur server menentukan ketersediaan layanan, keandalan sistem, dan kontinuitas
proses bisnis. Ketika kebutuhan sumber daya komputasi meningkat, pengelolaan server dan mesin
virtual menjadi lebih menantang karena harus berlangsung cepat, konsisten, dan terskala. Kondisi
ini mendorong pemanfaatan virtualisasi untuk meningkatkan efisiensi penggunaan perangkat keras
sekaligus mempermudah pengelolaan lingkungan komputasi. Marzuki dkk. (2023) menyatakan bahwa
virtualisasi mengoptimalkan sumber daya fisik melalui mesin virtual yang dapat dikelola secara
fleksibel dalam satu platform terpusat.

Penyediaan (provisioning) mesin virtual pada banyak organisasi masih berlangsung manual, mencakup
pembuatan mesin virtual, konfigurasi sumber daya komputasi, pengaturan jaringan, penentuan
penyimpanan, dan konfigurasi sistem operasi. Pengelolaan manual memakan waktu lama, terlebih ketika
jumlah server bertambah, dan proses berulang membuka peluang kesalahan konfigurasi (human error)
yang menurunkan stabilitas, keamanan, serta konsistensi infrastruktur. Khumaidi (2021) mencatat
bahwa pengelolaan server secara manual memaksa administrator mengulang konfigurasi yang sama
sehingga tidak efisien, memakan waktu, dan menambah risiko kesalahan manusia. Nabila dan Indrawati
(2025) menambahkan bahwa pengelolaan infrastruktur teknologi informasi (TI) secara manual menempuh banyak tahap, memakan
waktu, dan berisiko tinggi terhadap kesalahan konfigurasi yang berujung pada inefisiensi serta
ketidakstabilan sistem.

*Infrastructure as Code* (IaC) menjawab persoalan tersebut dengan mendefinisikan infrastruktur dalam
bentuk kode, sehingga penyediaan dan pengelolaan sumber daya berlangsung otomatis dan berulang
dengan hasil yang konsisten. Jangam dan Muntala (2025) menyatakan bahwa IaC meningkatkan efisiensi,
reliabilitas, dan skalabilitas pengelolaan infrastruktur karena seluruh konfigurasi dikelola
terstruktur, terdokumentasi, dan terintegrasi dengan otomatisasi, sekaligus menekan configuration
drift. Pada praktiknya, Terraform menangani provisioning infrastruktur secara otomatis, sedangkan
Ansible menangani konfigurasi lanjutan dan penguatan keamanan (hardening) sistem. Nelmiawati dkk.
(2025) menunjukkan bahwa kombinasi Terraform dan Ansible mempercepat implementasi sekaligus
menghasilkan konfigurasi keamanan yang lebih konsisten.

Kekuatan IaC menuntut harga berupa kompleksitas. Pemanfaatan Terraform dan Ansible mensyaratkan
penguasaan sintaks kode, antarmuka baris perintah atau *Command Line Interface* (CLI), konsep state, serta
pemahaman identifier teknis platform seperti nama node, bridge jaringan, storage pool, dan identifier template. Bagi pengguna non-pakar dan usaha kecil dan menengah (UKM) yang sumber dayanya
terbatas, kurva pembelajaran ini menghambat adopsi. Akibatnya pengguna tetap bergantung pada
administrator untuk mengajukan kebutuhan mesin virtual, sehingga penyediaan layanan tidak efisien
dan belum mandiri (self-service).

Tata kelola (governance) dan keamanan menjadi syarat penting bagi penyediaan layanan mandiri.
Penyediaan mandiri yang tidak terkendali memicu pemborosan sumber daya, konfigurasi tak terstandar,
dan hilangnya jejak pertanggungjawaban. Karena itu sistem memerlukan mekanisme persetujuan (approval
workflow), kebijakan berbasis lingkungan berupa kuota, masa berlaku (expiry), dan daftar sumber daya
yang diizinkan, kontrol akses berbasis peran atau *Role-Based Access Control* (RBAC), serta jejak audit (audit trail). Pada sisi
keamanan sistem operasi, Nelmiawati dkk. (2025) menjelaskan bahwa server hardening meningkatkan
ketahanan sistem terhadap ancaman sekaligus menekan risiko akibat kesalahan konfigurasi manual.

Penelitian terdahulu telah membahas pemanfaatan Ansible dan Terraform dalam pengelolaan
infrastruktur. Hariyadi dan Marzuki (2020) memanfaatkan Ansible untuk manajemen konfigurasi Virtual
Private Server. Khumaidi (2021) menerapkan Ansible untuk otomatisasi manajemen server dan akun
pengguna. Marzuki dkk. (2023) mengimplementasikan Ansible untuk otomatisasi konfigurasi jaringan
virtual berbasis Open vSwitch pada Proxmox. Nelmiawati dkk. (2025) mengombinasikan Terraform dan
Ansible untuk provisioning dan hardening server.

Kajian tersebut memperlihatkan kesenjangan penelitian (research gap). Sebagian besar penelitian
terdahulu berfokus pada otomatisasi konfigurasi, jaringan virtual, atau hardening secara terpisah
dan mengevaluasinya pada tataran CLI atau kinerja teknis, sehingga aspek kebergunaan dari sisi
manusia (human usability) belum banyak dikaji. Solusi yang mengintegrasikan (a) self-service dengan
approval workflow, (b) provisioning berbasis Proxmox *Virtual Environment* (Proxmox VE), (c) orkestrasi Terraform, dan (d) hardening
Ansible dalam satu aplikasi web berbasis sumber terbuka, yang mengabstraksikan kompleksitas IaC/CLI
dan sesuai untuk UKM, masih terbatas. Perangkat manajemen kelas enterprise dengan kemampuan serupa
umumnya bersifat proprietary dan berbiaya tinggi, sedangkan perkakas sumber terbuka yang tersedia
belum memenuhi irisan kebutuhan tersebut secara utuh (lihat perbandingan pada Bab II).

Permasalahan ini menuntut sebuah aplikasi web self-service yang mengotomatisasi permintaan,
persetujuan, orkestrasi, dan provisioning mesin virtual secara terintegrasi, sekaligus
menyembunyikan kompleksitas IaC di balik antarmuka terpandu. Dengan Proxmox VE sebagai lingkungan
virtualisasi sumber terbuka, Terraform sebagai IaC, dan Ansible sebagai alat konfigurasi serta
hardening, pengguna mengajukan kebutuhan mesin virtual secara mandiri tanpa menulis kode atau
menyentuh CLI. Sistem juga dirancang portabel terhadap banyak penyedia (multi-provider) sehingga
dapat mengorkestrasikan provisioning pada lebih dari satu cluster Proxmox dari satu kendali
terpusat, serta menegakkan konsistensi konfigurasi, tata kelola, dan keamanan.

Atas dasar tersebut, penelitian ini mengusung judul “Perancangan dan Pengembangan Aplikasi Web
Self-Service untuk Orkestrasi dan Otomatisasi Provisioning Mesin Virtual Berbasis Sumber Terbuka
Menggunakan Infrastructure as Code.” Penelitian ini menargetkan solusi yang mendukung otomatisasi
pengelolaan infrastruktur virtual secara efektif, terstandar, aman, dan mudah digunakan oleh
pengguna non-pakar.

## 1.2 Rumusan Masalah

Berdasarkan latar belakang, penelitian ini menetapkan empat pertanyaan penelitian yang saling
setara:

1. **(Perancangan & Abstraksi)** Bagaimana merancang dan membangun aplikasi web self-service yang
   mengabstraksikan kompleksitas IaC/CLI (Terraform dan Ansible) menjadi alur provisioning mesin
   virtual yang terpandu pada Proxmox VE, dengan tetap mempertahankan reproduktifitas dan state khas
   Infrastructure as Code?
2. **(Tata Kelola & Keamanan)** Bagaimana sistem menegakkan tata kelola (otorisasi, persetujuan,
   siklus hidup/expiry, dan kuota sumber daya) serta keamanan (hardening otomatis dan jejak audit)
   sehingga penyediaan layanan mandiri tetap aman dan dapat diaudit?
3. **(Efisiensi Operasional)** Sejauh mana aplikasi mengurangi upaya operasional pengguna dan
   inkonsistensi konfigurasi dibandingkan antarmuka web Proxmox bawaan, termasuk untuk pembuatan
   mesin virtual secara batch?
4. **(Kebergunaan/Usability)** Bagaimana persepsi pengguna terhadap kebergunaan (usability) aplikasi
   dibandingkan antarmuka web Proxmox bawaan?

## 1.3 Batasan Masalah

Agar penelitian terarah, peneliti menetapkan batasan berikut:

1. Penelitian berfokus pada perancangan dan pengembangan aplikasi web self-service untuk orkestrasi
   dan otomatisasi provisioning mesin virtual.
2. Platform virtualisasi yang digunakan adalah Proxmox Virtual Environment (Proxmox VE) 9.1.
3. Provisioning mesin virtual menggunakan Terraform sebagai Infrastructure as Code.
4. Konfigurasi dan hardening mesin virtual menggunakan Ansible.
5. Sistem memiliki tiga hak akses, yaitu User (Requestor), Approver (Manager), dan Admin, dengan
   kontrol akses berbasis peran (RBAC).
6. Ruang lingkup sistem mencakup request, persetujuan (approval), provisioning, inventarisasi, siklus
   hidup (perpanjangan, resize, penghapusan), dan hardening mesin virtual.
7. Sistem mendukung orkestrasi multi-provider/multi-cluster pada penyedia bertipe Proxmox. Dukungan
   untuk hypervisor lain seperti OpenStack dan oVirt tersedia secara arsitektural melalui abstraksi
   driver, namun implementasinya menjadi pekerjaan lanjutan dan tidak diuji pada penelitian ini.
   Multi-tenancy penuh (isolasi keras antar-tenant) berada di luar lingkup; pemisahan akses
   dilakukan melalui RBAC berbasis peran dan grup.
8. Mesin virtual dibuat dari template sistem operasi yang telah tersedia pada Proxmox.
9. Penelitian tidak membahas backup, disaster recovery, migrasi mesin virtual, dan analisis biaya
   infrastruktur.
10. Evaluasi sistem menempuh empat cara: (a) verifikasi fungsional melalui pengujian otomatis;
    (b) studi komparatif efisiensi operasional terhadap antarmuka Proxmox bawaan; (c) evaluasi
    kebergunaan menggunakan *System Usability Scale* (SUS); dan (d) evaluasi keamanan menggunakan
    pemodelan ancaman STRIDE (*Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege*).

## 1.4 Tujuan Penelitian

### 1.4.1 Tujuan Umum

Merancang dan mengembangkan aplikasi web self-service untuk orkestrasi dan otomatisasi provisioning
mesin virtual berbasis sumber terbuka menggunakan konsep Infrastructure as Code pada platform
Proxmox, yang aman, ter-tata-kelola, dan mudah digunakan oleh pengguna non-pakar.

### 1.4.2 Tujuan Khusus

Sejalan dengan rumusan masalah, penelitian ini menetapkan tujuan khusus berikut:

1. Merancang dan membangun aplikasi self-service yang mengabstraksikan kompleksitas IaC/CLI menjadi
   alur provisioning terpandu pada Proxmox VE, dengan tetap mempertahankan reproduktifitas dan state
   IaC (menjawab Rumusan Masalah 1).
2. Merancang dan mengevaluasi mekanisme tata kelola dan keamanan, yaitu otorisasi, persetujuan,
   siklus hidup, kuota, hardening otomatis, dan audit, agar layanan mandiri tetap aman serta dapat
   diaudit (menjawab Rumusan Masalah 2).
3. Mengukur pengaruh aplikasi terhadap upaya operasional dan konsistensi konfigurasi dibandingkan
   antarmuka Proxmox bawaan, termasuk provisioning batch (menjawab Rumusan Masalah 3).
4. Menilai persepsi kebergunaan (usability) aplikasi dibandingkan antarmuka Proxmox bawaan (menjawab Rumusan Masalah 4).

## 1.5 Manfaat Penelitian

### 1.5.1 Manfaat Teoritis

Penelitian ini berkontribusi pada pengembangan ilmu di bidang teknologi informasi, khususnya
penerapan Infrastructure as Code, otomatisasi provisioning, orkestrasi infrastruktur, dan integrasi
Terraform serta Ansible pada virtualisasi berbasis Proxmox. Sebagai pengetahuan perancangan yang
dapat dialihgunakan, penelitian ini merumuskan prinsip perancangan berikut: abstraksikan
Infrastructure as Code di balik lapisan self-service yang terikat kebijakan dan melibatkan
persetujuan manusia, agar penyediaan mesin virtual yang aman dan terdokumentasi terjangkau oleh
pengguna tanpa keahlian IaC/CLI.

### 1.5.2 Manfaat Praktis

a. Bagi Organisasi: penelitian ini mempercepat penyediaan mesin virtual, meningkatkan konsistensi
   konfigurasi, menekan risiko human error, serta memperkuat tata kelola dan kepatuhan melalui
   approval dan audit.
b. Bagi Administrator Infrastruktur: penelitian ini mengurangi pekerjaan repetitif dan memungkinkan
   pengelolaan terstandar melalui kebijakan lingkungan serta katalog sumber daya yang dikurasi.
c. Bagi Pengguna: penelitian ini memungkinkan pengajuan mesin virtual secara mandiri melalui
   antarmuka web tanpa menulis kode atau menggunakan CLI.

## 1.6 Metode Penelitian

Penelitian ini memakai kerangka *Design Science Research Methodology* (DSRM) sebagaimana dirumuskan
Peffers dkk. (2007). DSRM cocok karena penelitian bersifat konstruktif: penelitian menghasilkan dan
mengevaluasi sebuah artefak berupa aplikasi web self-service, sekaligus menghasilkan pengetahuan
perancangan yang dapat dialihgunakan. DSRM menempuh enam aktivitas: (1) identifikasi masalah dan
motivasi; (2) penetapan tujuan solusi; (3) perancangan dan pengembangan; (4) demonstrasi;
(5) evaluasi; dan (6) komunikasi.

Pada aktivitas perancangan dan pengembangan, peneliti membangun sistem dengan model iteratif dan
incremental, yaitu mengembangkan sistem bertahap berdasarkan kebutuhan fungsional. Model ini
memberi fleksibilitas, memungkinkan penyempurnaan berkelanjutan, dan memudahkan integrasi
antarkomponen frontend, backend, basis data, serta infrastruktur otomatisasi. Peneliti menerapkan
keamanan sebagai aspek lintas-tahap (security-by-design), yaitu memperkenalkan kendali keamanan pada
setiap penambahan fungsi sejak awal pengembangan. Terraform menyediakan provisioning mesin virtual
pada Proxmox VE, sedangkan Ansible menjalankan konfigurasi dan hardening setelah provisioning
berhasil.

### 1.6.1 Metode Pengumpulan Data

Peneliti mengumpulkan data melalui observasi, wawancara, dan studi literatur. Observasi mengamati
langsung alur provisioning manual untuk memahami alur kerja dan kendalanya. Wawancara menggali
kebutuhan sistem dan proses bisnis dari pihak pengelola infrastruktur. Studi literatur mengkaji
referensi tentang IaC, Terraform, Ansible, Proxmox VE, orkestrasi infrastruktur, server hardening,
kebergunaan, dan keamanan sebagai landasan teoretis.

### 1.6.2 Tahapan Penelitian (Pemetaan DSRM)

1. **Identifikasi Masalah & Motivasi (DSRM-1):** peneliti menganalisis permasalahan provisioning
   manual dan kompleksitas IaC/CLI beserta dampaknya terhadap efisiensi, konsistensi, dan tata
   kelola.
2. **Penetapan Tujuan Solusi (DSRM-2):** peneliti merumuskan kebutuhan fungsional dan
   non-fungsional, yaitu self-service, orkestrasi IaC, tata kelola/approval, hardening, sifat sumber
   terbuka, dan kesesuaian untuk UKM.
3. **Perancangan & Pengembangan (DSRM-3):** peneliti merancang arsitektur, basis data, antarmuka,
   dan alur bisnis, lalu membangun sistem secara iteratif-inkremental dengan integrasi aplikasi web,
   Terraform, Ansible, dan Proxmox VE, serta menerapkan security-by-design.
4. **Demonstrasi (DSRM-4):** peneliti menjalankan alur end-to-end (request, approval, provisioning
   Terraform, hardening Ansible, dan siklus hidup) pada cluster Proxmox nyata.
5. **Evaluasi (DSRM-5):** peneliti menguji artefak melalui verifikasi fungsional dengan pengujian
   otomatis, studi komparatif efisiensi operasional terhadap antarmuka Proxmox bawaan, evaluasi
   kebergunaan dengan System Usability Scale (SUS; Brooke, 1996), dan pemodelan ancaman STRIDE.
6. **Komunikasi (DSRM-6):** peneliti mendokumentasikan seluruh hasil dalam bentuk laporan skripsi.

## 1.7 Sistematika Penulisan

Laporan ini tersusun atas lima bab berikut:

**BAB I PENDAHULUAN** berisi latar belakang, rumusan masalah, batasan masalah, tujuan penelitian,
manfaat penelitian, metode penelitian, dan sistematika penulisan.

**BAB II LANDASAN TEORI** berisi kajian penelitian terdahulu dan landasan teori: virtualisasi,
Proxmox VE, Infrastructure as Code, Terraform, Ansible, orkestrasi infrastruktur, server hardening,
kerangka DSRM, kebergunaan (SUS), pemodelan ancaman (STRIDE), serta perbandingan perangkat sejenis
yang menegaskan kesenjangan penelitian.

**BAB III METODOLOGI PENELITIAN** berisi kerangka DSRM, teknik pengumpulan data, analisis kebutuhan,
perancangan sistem (arsitektur, basis data, antarmuka, lapisan abstraksi, dan kebijakan), serta
rancangan evaluasi (uji fungsional, benchmark efisiensi, SUS, dan STRIDE).

**BAB IV HASIL DAN PEMBAHASAN** berisi hasil implementasi artefak dan hasil evaluasi atas keempat
pertanyaan penelitian, termasuk demonstrasi multi-cluster, hasil benchmark, skor SUS, dan ringkasan
pemodelan ancaman, beserta pembahasannya.

**BAB V PENUTUP** berisi simpulan yang menjawab rumusan masalah serta saran dan pekerjaan lanjutan,
antara lain dukungan multi-hypervisor, multi-tenancy penuh, dan pengerasan tahap produksi.
