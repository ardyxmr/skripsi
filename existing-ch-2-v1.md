# BAB II — LANDASAN TEORI
<!--
  Draft Bab II (Landasan Teori) selaras dengan sistem final + kerangka DSRM.
  Struktur: 2.1 Penelitian Terdahulu; 2.2 Landasan Teori; 2.3 Perbandingan Perangkat Sejenis;
            2.4 Kerangka Pemikiran; 2.5 Hipotesis Penelitian.
  Kaidah: lolos stop-slop (tanpa em-dash, buang adverbia/intensifier, kalimat langsung, register
          akademik Bahasa dipertahankan).
  SITASI: gunakan 6 karya v1 (Hariyadi & Marzuki 2020; Khumaidi 2021; Marzuki dkk. 2023;
          Jangam & Muntala 2025; Nelmiawati dkk. 2025; Nabila & Indrawati 2025) + Peffers dkk. (2007)
          untuk DSRM + Brooke (1996) untuk SUS. Tanda [SITASI DIBUTUHKAN: ...] menandai teori yang
          masih memerlukan sumber; isi dari Mendeley/Zotero. JANGAN memalsukan sitasi.
-->

## 2.1 Penelitian Terdahulu

Sejumlah penelitian terdahulu membahas otomatisasi pengelolaan infrastruktur menggunakan Ansible,
Terraform, dan virtualisasi Proxmox. Tabel 2.1 merangkum penelitian tersebut beserta fokus,
teknologi, kontribusi, dan perbedaannya dengan penelitian ini.

**Tabel 2.1 Ringkasan Penelitian Terdahulu**

| No | Penulis (Tahun) | Fokus | Teknologi | Kontribusi | Perbedaan dengan penelitian ini |
|----|-----------------|-------|-----------|------------|---------------------------------|
| 1 | Hariyadi & Marzuki (2020) | Manajemen konfigurasi Virtual Private Server | Ansible | Mengurangi intervensi manual pada pengelolaan server | Tidak menyediakan portal self-service, approval, maupun provisioning Terraform pada Proxmox |
| 2 | Khumaidi (2021) | Otomatisasi manajemen server dan akun pengguna | Ansible | Menekan pengulangan konfigurasi manual | Berfokus pada konfigurasi, bukan provisioning mandiri berbasis web |
| 3 | Marzuki dkk. (2023) | Otomatisasi konfigurasi jaringan virtual Open vSwitch | Ansible, Proxmox, Open vSwitch | Mengotomatiskan konfigurasi jaringan virtual | Berfokus pada jaringan, tanpa alur permintaan dan persetujuan VM |
| 4 | Jangam & Muntala (2025) | Konsep Infrastructure as Code | Terraform, Ansible | Menunjukkan IaC meningkatkan efisiensi, reliabilitas, dan skalabilitas | Bersifat konseptual, bukan aplikasi web self-service untuk Proxmox dengan approval |
| 5 | Nelmiawati dkk. (2025) | Provisioning dan hardening server | Terraform, Ansible | Mengotomatiskan provisioning sekaligus hardening | Berbasis skrip/CLI, tanpa portal self-service, RBAC, multi-provider, dan audit trail |
| 6 | Nabila & Indrawati (2025) | Kendala pengelolaan infrastruktur TI manual | Kajian | Mengidentifikasi inefisiensi dan risiko konfigurasi manual | Mengidentifikasi masalah, belum menghasilkan solusi aplikasi |

Penelitian terdahulu menyelesaikan otomatisasi konfigurasi, jaringan virtual, atau hardening secara
terpisah, dan mengevaluasinya pada tataran skrip atau kinerja teknis. Belum ada penelitian yang
menyatukan permintaan mandiri (self-service), persetujuan (approval workflow), provisioning Proxmox
melalui Terraform, dan hardening Ansible dalam satu aplikasi web sumber terbuka yang
menyembunyikan kompleksitas IaC/CLI dari pengguna non-pakar. Penelitian ini mengisi celah tersebut
sekaligus menambahkan tata kelola berbasis kebijakan, kontrol akses berbasis peran, jejak audit,
dan orkestrasi multi-provider.

## 2.2 Landasan Teori

### 2.2.1 Virtualisasi dan Proxmox Virtual Environment

Virtualisasi memungkinkan satu perangkat keras fisik menjalankan beberapa mesin virtual yang
saling terpisah, sehingga organisasi memakai sumber daya komputasi dengan lebih efisien. Marzuki
dkk. (2023) menyatakan bahwa virtualisasi mengoptimalkan sumber daya fisik melalui mesin virtual
yang dapat dikelola secara fleksibel dalam satu platform terpusat. Proxmox Virtual Environment
(Proxmox VE) adalah platform virtualisasi sumber terbuka berbasis kernel Linux dan hypervisor KVM
yang menyediakan pengelolaan mesin virtual serta antarmuka berbasis web dan API
[SITASI DIBUTUHKAN: Proxmox VE / dokumentasi resmi]. Penelitian ini memanfaatkan API Proxmox VE
sebagai sasaran provisioning.

### 2.2.2 Infrastructure as Code (IaC)

Infrastructure as Code mendefinisikan infrastruktur dalam bentuk berkas kode yang bersifat
deklaratif dan dapat dieksekusi berulang dengan hasil yang konsisten. Jangam dan Muntala (2025)
menyatakan bahwa IaC meningkatkan efisiensi, reliabilitas, dan skalabilitas pengelolaan
infrastruktur karena konfigurasi tersimpan terstruktur, terdokumentasi, dan terintegrasi dengan
otomatisasi, sekaligus menekan configuration drift. Sifat idempoten dan reproducible inilah yang
penelitian ini pertahankan, sementara kompleksitas penulisannya disembunyikan dari pengguna akhir
[SITASI DIBUTUHKAN: konsep dan prinsip IaC].

### 2.2.3 Terraform

Terraform adalah perkakas IaC yang menyediakan infrastruktur secara deklaratif. Pengguna
mendefinisikan sumber daya pada berkas konfigurasi, lalu Terraform menyusun rencana perubahan
(plan) dan menerapkannya (apply) sambil menyimpan state untuk melacak kondisi infrastruktur
[SITASI DIBUTUHKAN: Terraform / dokumentasi HashiCorp]. Sejak 2023 Terraform memakai lisensi
Business Source License (BSL) yang bersifat source-available, sedangkan OpenTofu hadir sebagai fork
berlisensi sumber terbuka (MPL 2.0) di bawah Linux Foundation
[SITASI DIBUTUHKAN: pengumuman lisensi Terraform/OpenTofu]. Pada penelitian ini, istilah sumber
terbuka pada judul merujuk pada platform virtualisasi (Proxmox VE/KVM), sedangkan Terraform
berperan sebagai metode (perkakas IaC).

### 2.2.4 Ansible dan Server Hardening

Ansible adalah perkakas manajemen konfigurasi tanpa agen (agentless) yang menjalankan serangkaian
tugas melalui playbook dan terhubung ke target melalui SSH. Hariyadi dan Marzuki (2020) serta
Khumaidi (2021) memanfaatkan Ansible untuk menggantikan konfigurasi server yang berulang, sedangkan
Marzuki dkk. (2023) memakainya untuk konfigurasi jaringan virtual pada Proxmox. Server hardening
adalah proses memperkuat konfigurasi sistem operasi dan layanan agar tahan terhadap ancaman.
Nelmiawati dkk. (2025) menunjukkan bahwa hardening otomatis menghasilkan konfigurasi keamanan yang
lebih konsisten dibanding konfigurasi manual [SITASI DIBUTUHKAN: konsep hardening / acuan CIS
Benchmark].

### 2.2.5 Orkestrasi dan Otomatisasi Infrastruktur

Otomatisasi menjalankan satu tugas tanpa intervensi manusia, sedangkan orkestrasi mengoordinasikan
banyak tugas dan komponen menjadi satu alur kerja yang utuh. Pada penelitian ini, Terraform
menyediakan mesin virtual sementara Ansible mengonfigurasi dan mengeraskannya, dan aplikasi web
mengorkestrasikan keduanya bersama proses permintaan serta persetujuan. Jangam dan Muntala (2025)
menegaskan kombinasi Terraform dan Ansible membentuk alur otomatisasi terintegrasi yang memisahkan
penyediaan infrastruktur dari konfigurasi sistem [SITASI DIBUTUHKAN: definisi orkestrasi
infrastruktur].

### 2.2.6 Self-Service, RBAC, dan Approval Workflow

Layanan mandiri (self-service) memungkinkan pengguna mengajukan kebutuhan secara langsung melalui
antarmuka tanpa perantara administrator. Role-Based Access Control (RBAC) membatasi akses
berdasarkan peran pengguna, sehingga setiap peran hanya menjalankan fungsi yang menjadi
kewenangannya [SITASI DIBUTUHKAN: konsep RBAC]. Approval workflow menambahkan kontrol manusia
sebelum eksekusi, yaitu permintaan ditinjau dan disetujui terlebih dahulu. Penelitian ini
memadukan ketiganya bersama kebijakan berbasis lingkungan (environment) dan standar sumber daya
(tier) agar layanan mandiri tetap terkendali [SITASI DIBUTUHKAN: tata kelola layanan TI mandiri].

### 2.2.7 Keamanan dan Pemodelan Ancaman STRIDE

STRIDE adalah kerangka pemodelan ancaman yang mengelompokkan ancaman menjadi enam kategori:
Spoofing, Tampering, Repudiation, Information disclosure, Denial of service, dan Elevation of
privilege [SITASI DIBUTUHKAN: STRIDE / Shostack]. Penelitian ini memakai STRIDE untuk memetakan
ancaman terhadap kendali yang diterapkan, lalu mengevaluasi keamanan sistem secara terstruktur.

### 2.2.8 Aplikasi Web dan Basis Data

Frontend sistem memakai React.js dengan pendekatan Single Page Application, sehingga navigasi antar
halaman berlangsung dinamis tanpa pemuatan ulang penuh [SITASI DIBUTUHKAN: React]. Backend memakai
framework Laravel yang menyediakan API serta logika bisnis [SITASI DIBUTUHKAN: Laravel]. PostgreSQL
menyimpan seluruh data sistem sebagai basis data relasional yang mendukung transaksi konsisten
[SITASI DIBUTUHKAN: PostgreSQL].

### 2.2.9 Design Science Research Methodology (DSRM)

DSRM adalah kerangka penelitian yang membangun dan mengevaluasi artefak untuk menyelesaikan masalah
nyata sekaligus menghasilkan pengetahuan perancangan. Peffers dkk. (2007) merumuskan enam aktivitas
DSRM: identifikasi masalah dan motivasi, penetapan tujuan solusi, perancangan dan pengembangan,
demonstrasi, evaluasi, serta komunikasi. Penelitian ini memakai DSRM karena sasarannya membangun
dan mengevaluasi sebuah aplikasi, bukan menguji hubungan antar variabel.

### 2.2.10 Kebergunaan (Usability) dan System Usability Scale (SUS)

Kebergunaan mengukur sejauh mana pengguna dapat memakai sistem dengan efektif, efisien, dan puas
[SITASI DIBUTUHKAN: definisi usability / ISO 9241-11]. System Usability Scale (SUS) yang dirumuskan
Brooke (1996) adalah instrumen kebergunaan berisi sepuluh pernyataan dengan skala Likert lima
tingkat. Perhitungan SUS menghasilkan skor 0 sampai 100; skor di atas sekitar 68 menunjukkan
kebergunaan di atas rata-rata [SITASI DIBUTUHKAN: norma SUS, mis. Sauro & Lewis]. Penelitian ini
memakai SUS untuk membandingkan persepsi pengguna terhadap aplikasi dan antarmuka Proxmox bawaan.

## 2.3 Perbandingan Perangkat Sejenis

Untuk menegaskan kesenjangan penelitian, Tabel 2.2 membandingkan perangkat sumber terbuka dan
komersial terhadap kriteria yang mendefinisikan artefak sasaran. Kriteria tersebut adalah: C1
sumber terbuka/tanpa biaya lisensi; C2 integrasi native Proxmox VE; C3 provisioning IaC (Terraform);
C4 konfigurasi dan hardening (Ansible); C5 alur persetujuan (approval); C6 hardening keamanan
otomatis; C7 abstraksi self-service tanpa keterampilan IaC/CLI; dan C8 kesesuaian untuk UKM.
Tanda centang penuh, separuh, dan kosong menyatakan tingkat pemenuhan.

**Tabel 2.2 Perbandingan Perangkat Sejenis** (Penuh / Separuh / Tidak)

| Perangkat | C1 | C2 | C3 | C4 | C5 | C6 | C7 | C8 |
|-----------|----|----|----|----|----|----|----|----|
| Antarmuka Proxmox VE bawaan | Penuh | Penuh | Tidak | Tidak | Tidak | Tidak | Tidak | Separuh |
| HCP Terraform (Terraform Cloud) | Tidak | Separuh | Penuh | Tidak | Separuh | Tidak | Tidak | Separuh |
| AWX / Ansible Automation Platform | Separuh | Tidak | Tidak | Penuh | Penuh | Separuh | Separuh | Separuh |
| Foreman / Katello | Penuh | Separuh | Tidak | Separuh | Tidak | Separuh | Separuh | Separuh |
| OpenStack (Horizon) | Penuh | Tidak | Separuh | Tidak | Tidak | Tidak | Penuh | Tidak |
| Apache CloudStack | Penuh | Tidak | Separuh | Tidak | Tidak | Tidak | Penuh | Tidak |
| Platform CMP komersial (Morpheus, VMware Aria) | Tidak | Separuh | Penuh | Penuh | Penuh | Separuh | Penuh | Tidak |
| **Penelitian ini** | Penuh | Penuh | Penuh | Penuh | Penuh | Penuh | Penuh | Penuh |

Fakta lisensi dan dukungan pada Tabel 2.2 dirangkum dari dokumentasi resmi tiap perkakas (diakses
Juni 2026): Terraform memakai lisensi BSL dengan OpenTofu sebagai fork sumber terbuka; AWX bersifat
sumber terbuka sedangkan Ansible Automation Platform berlangganan; dukungan Proxmox pada Foreman
melalui plugin resmi `foreman_fog_proxmox`; dan dukungan Proxmox pada Morpheus melalui plugin
HPE [SITASI DIBUTUHKAN: dokumentasi resmi masing-masing perangkat]. Perangkat yang mengabstraksikan
kompleksitas (OpenStack, CloudStack, CMP komersial) bukan native Proxmox, berat dioperasikan, atau
proprietary dan mahal. Perangkat native Proxmox (antarmuka bawaan) tidak menyediakan orkestrasi IaC,
tata kelola, maupun abstraksi self-service. Belum ada perangkat sumber terbuka yang memenuhi C2
sampai C7 sekaligus pada biaya yang sesuai untuk UKM (C1, C8). Irisan inilah yang penelitian ini
isi.

## 2.4 Kerangka Pemikiran

Kerangka pemikiran menghubungkan masalah, proses pengembangan, dan keluaran penelitian. Masukan
berupa permasalahan provisioning manual yang lambat dan rawan kesalahan, ditambah kompleksitas
IaC/CLI yang menghambat pengguna non-pakar. Proses berupa pembangunan artefak melalui DSRM:
aplikasi web self-service yang mengabstraksikan IaC di balik lapisan publikasi sumber daya,
menegakkan tata kelola melalui kebijakan lingkungan dan persetujuan, mengorkestrasikan Terraform
dan Ansible, serta mencatat seluruh aktivitas pada audit trail. Keluaran berupa aplikasi yang aman,
terstandar, dan mudah digunakan, beserta hasil evaluasi atas keempat pertanyaan penelitian. Gambar
2.1 menyajikan kerangka pemikiran tersebut.

[Gambar 2.1 Kerangka Pemikiran]

## 2.5 Hipotesis Penelitian

Penelitian ini mengikuti paradigma Design Science Research yang menjawab pertanyaan secara
konstruktif. Pertanyaan perancangan dan tata kelola (RQ1 dan RQ2) dijawab melalui pembangunan
artefak, verifikasi fungsional, dan pemodelan ancaman, sehingga tidak dirumuskan sebagai hipotesis.
Hipotesis berikut berlaku khusus pada dua studi komparatif empiris, yaitu efisiensi operasional
(RQ3) dan kebergunaan (RQ4), terhadap antarmuka Proxmox bawaan. Hipotesis dirumuskan secara
direksional dan deskriptif karena jumlah operator uji terbatas, sehingga penelitian tidak mengklaim
signifikansi statistik.

- **H1 (Efisiensi, jumlah aksi).** Jumlah aksi operator pada aplikasi bersifat tetap (O(1)) dan
  lebih sedikit dibanding antarmuka Proxmox bawaan yang tumbuh linear (O(N)) seiring bertambahnya
  jumlah mesin virtual.
- **H2 (Efisiensi, waktu).** Rata-rata waktu interaksi operator pada aplikasi lebih rendah dibanding
  antarmuka Proxmox bawaan untuk pembuatan lima mesin virtual atau lebih.
- **H3 (Konsistensi).** Tingkat inkonsistensi konfigurasi pada aplikasi mendekati nol dan lebih
  rendah dibanding antarmuka Proxmox bawaan.
- **H4 (Kebergunaan).** Skor SUS aplikasi lebih tinggi dibanding antarmuka Proxmox bawaan dan berada
  di atas ambang rata-rata sekitar 68.

Hipotesis H1 sampai H3 menjawab RQ3, sedangkan H4 menjawab RQ4. Bab III menjabarkan rancangan
pengujian yang dipakai untuk menilai keempat hipotesis tersebut.
