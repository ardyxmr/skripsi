# BAB III METODE PENELITIAN

## 3.1 Metode Pengumpulan Data

Metode pengumpulan data merupakan tahapan yang dilakukan untuk memperoleh informasi dan data yang dibutuhkan sebagai dasar dalam proses analisis, perancangan, dan pengembangan sistem. Pengumpulan data pada penelitian ini dilakukan untuk memahami proses pengelolaan infrastruktur virtual yang berjalan, mengidentifikasi permasalahan yang terjadi pada proses *provisioning* mesin virtual, serta memperoleh kebutuhan sistem yang akan dikembangkan. Metode pengumpulan data yang digunakan dalam penelitian ini meliputi observasi, wawancara, dan studi literatur.

### 3.1.1 Observasi

Observasi dilakukan dengan mengamati secara langsung proses *provisioning* mesin virtual pada lingkungan virtualisasi yang digunakan. Kegiatan observasi bertujuan untuk memahami alur kerja yang berjalan, mengidentifikasi tahapan yang masih dilakukan secara manual, serta menemukan kendala yang muncul selama proses penyediaan layanan mesin virtual.

Berdasarkan hasil observasi, proses *provisioning* mesin virtual memerlukan beberapa tahapan konfigurasi yang dilakukan secara berulang, mulai dari pemilihan template sistem operasi, penentuan spesifikasi sumber daya, konfigurasi jaringan, hingga konfigurasi sistem operasi setelah mesin virtual berhasil dibuat. Proses tersebut membutuhkan waktu yang relatif lama dan berpotensi menimbulkan inkonsistensi konfigurasi apabila dilakukan secara manual.

### 3.1.2 Wawancara

Wawancara dilakukan untuk memperoleh informasi yang lebih mendalam mengenai kebutuhan pengguna dan pengelola infrastruktur terhadap sistem yang akan dikembangkan. Wawancara dilakukan kepada pihak yang terlibat dalam pengelolaan layanan infrastruktur virtual guna memperoleh gambaran mengenai kebutuhan layanan, kendala yang dihadapi, serta harapan terhadap sistem yang akan dibangun.

Hasil wawancara menunjukkan adanya kebutuhan terhadap mekanisme *self-service* *provisioning* yang mampu mempermudah proses pengajuan mesin virtual, menyediakan alur persetujuan yang terstruktur, mendukung standarisasi konfigurasi layanan, serta mampu mengotomatisasi proses *provisioning* dan konfigurasi sistem sehingga dapat meningkatkan efisiensi operasional.

### 3.1.3 Studi Literatur

Studi literatur dilakukan dengan mempelajari berbagai referensi yang berkaitan dengan topik penelitian. Referensi yang digunakan meliputi jurnal ilmiah, artikel penelitian, dokumentasi teknis, serta sumber akademik lain yang membahas *Infrastructure as Code* (IaC), Terraform, Ansible, Proxmox Virtual Environment (Proxmox VE), orkestrasi infrastruktur, otomatisasi *provisioning* mesin virtual, keamanan sistem, dan pengembangan aplikasi berbasis web.

Studi literatur digunakan sebagai landasan teoritis dalam memahami konsep, metode, dan teknologi yang digunakan pada penelitian. Selain itu, studi literatur juga digunakan untuk mendukung proses analisis kebutuhan, perancangan sistem, pengembangan aplikasi, serta penyusunan metode evaluasi yang digunakan dalam penelitian.

## 3.2 Alat dan Bahan

Alat dan bahan yang digunakan dalam penelitian ini berfungsi untuk mendukung proses perancangan, pengembangan, implementasi, dan pengujian aplikasi web *self-service* untuk orkestrasi dan otomatisasi *provisioning* mesin virtual berbasis sumber terbuka menggunakan pendekatan *Infrastructure as Code* (IaC). Alat dan bahan yang digunakan terdiri dari perangkat keras, perangkat lunak, dan bahan penelitian.

### 3.2.1 Perangkat Keras

Perangkat keras digunakan sebagai sarana dalam proses pengembangan, implementasi, dan pengujian sistem. Perangkat keras yang digunakan harus mampu menjalankan aplikasi frontend, backend, basis data, serta mendukung proses orkestrasi dan otomatisasi infrastruktur.

**Tabel 3.1 Perangkat Keras Penelitian**

| No | Perangkat Keras | Fungsi |
|----|-----------------|--------|
| 1 | Komputer atau Laptop | Digunakan untuk proses perancangan, pengembangan, dan pengujian aplikasi. |
| 2 | Server Proxmox VE | Digunakan sebagai platform virtualisasi untuk menjalankan mesin virtual. |
| 3 | Media Penyimpanan | Digunakan untuk menyimpan source code, konfigurasi sistem, dan basis data. |
| 4 | Jaringan Komputer | Digunakan untuk mendukung komunikasi antar komponen sistem. |

### 3.2.2 Perangkat Lunak

Perangkat lunak digunakan untuk mendukung proses pengembangan aplikasi, pengelolaan basis data, orkestrasi infrastruktur, konfigurasi sistem, dan pengujian aplikasi.

**Tabel 3.2 Perangkat Lunak Penelitian**

| No | Perangkat Lunak | Fungsi |
|----|-----------------|--------|
| 1 | React.js | Digunakan untuk membangun antarmuka pengguna (frontend). |
| 2 | Laravel | Digunakan untuk membangun layanan backend dan API sistem. |
| 3 | PostgreSQL | Digunakan sebagai sistem manajemen basis data. |
| 4 | Redis | Digunakan untuk manajemen caching dan antrean job (queue). |
| 5 | Laravel Reverb | Penyediaan koneksi WebSocket *real-time* guna memperbarui status sistem secara langsung. |
| 6 | Terraform | Digunakan untuk melakukan *provisioning* mesin virtual secara otomatis menggunakan pendekatan *Infrastructure as Code* (IaC). |
| 7 | Ansible | Digunakan untuk konfigurasi dan *hardening* sistem operasi secara otomatis. |
| 8 | Proxmox Virtual Environment (Proxmox VE) | Digunakan sebagai platform virtualisasi untuk penyediaan mesin virtual. |
| 9 | Visual Studio Code | Digunakan sebagai editor kode dalam proses pengembangan aplikasi. |

### 3.2.3 Bahan Penelitian

Bahan penelitian merupakan sumber data dan dokumen yang digunakan sebagai dasar dalam proses analisis, perancangan, pengembangan, dan evaluasi sistem. Bahan penelitian yang digunakan dalam penelitian ini meliputi dokumen kebutuhan sistem, dokumentasi arsitektur aplikasi, source code aplikasi, konfigurasi Terraform, playbook Ansible, struktur basis data, serta berbagai referensi ilmiah yang berkaitan dengan Infrastructure as Code, orkestrasi infrastruktur, virtualisasi, dan otomatisasi *provisioning* mesin virtual.

Selain itu, penelitian ini juga menggunakan data konfigurasi provider, katalog sistem operasi, jaringan, datastore, Environment, tier sumber daya, serta *workflow* persetujuan yang diterapkan pada aplikasi. Seluruh bahan penelitian tersebut digunakan untuk mendukung proses pengembangan artefak berupa aplikasi web *self-service* yang mampu melakukan orkestrasi dan otomatisasi *provisioning* mesin virtual secara terintegrasi.

## 3.3 Tahapan Penelitian

Tahapan penelitian merupakan rangkaian proses yang dilakukan untuk merancang dan mengembangkan aplikasi web *self-service* untuk orkestrasi dan otomatisasi *provisioning* mesin virtual berbasis sumber terbuka menggunakan pendekatan *Infrastructure as Code* (IaC). Penelitian ini menggunakan *Design Science Research Methodology* (DSRM) sebagai landasan dalam pengembangan artefak berupa aplikasi yang mampu mengotomatisasi proses *provisioning* mesin virtual, mengelola *workflow* persetujuan, serta mengintegrasikan Terraform, Ansible, dan Proxmox Virtual Environment (Proxmox VE) dalam satu platform terpusat.

### 3.3.1 Identifikasi Masalah dan Motivasi

Tahap identifikasi masalah dan motivasi dilakukan untuk memahami permasalahan yang terjadi pada proses *provisioning* mesin virtual. Berdasarkan hasil observasi dan wawancara, proses *provisioning* masih memerlukan berbagai konfigurasi yang dilakukan secara manual sehingga membutuhkan waktu yang relatif lama serta berpotensi menimbulkan inkonsistensi konfigurasi. Selain itu, belum tersedia mekanisme layanan mandiri yang memungkinkan pengguna mengajukan kebutuhan mesin virtual secara terstruktur melalui satu platform terintegrasi.

Permasalahan tersebut mendorong kebutuhan akan sebuah sistem yang mampu menyediakan layanan *self-service* *provisioning*, menerapkan standarisasi konfigurasi sumber daya, mengintegrasikan mekanisme persetujuan layanan, serta mengotomatisasi proses *provisioning* dan konfigurasi sistem menggunakan pendekatan Infrastructure as Code.

**a. Analisis PIECES**

Untuk memperoleh gambaran yang lebih menyeluruh terhadap permasalahan pada sistem yang berjalan, dilakukan analisis menggunakan kerangka PIECES yang meliputi aspek Performance (kinerja), Information (informasi), Economy (ekonomi), Control (kontrol), Efficiency (efisiensi), dan Service (layanan). Analisis ini digunakan untuk mengidentifikasi kelemahan pada proses *provisioning* mesin virtual yang masih dilakukan secara manual. Hasil analisis PIECES disajikan pada Tabel 3.3.

**Tabel 3.3 Analisis PIECES**

| Aspek | Permasalahan pada Sistem Berjalan |
|-------|-----------------------------------|
| Performance (Kinerja) | Proses *provisioning* mesin virtual masih dilakukan secara manual sehingga membutuhkan waktu yang relatif lama, yaitu sekitar 5–20 menit untuk setiap mesin virtual, dan harus diulang pada setiap permintaan. Kinerja layanan menurun ketika volume permintaan meningkat, sebagaimana terlihat pada lonjakan permintaan hingga tiga kali lipat dalam periode pengamatan. |
| Information (Informasi) | Belum tersedia pencatatan terpusat mengenai pihak yang mengajukan permintaan, jenis layanan yang diminta, serta waktu pengajuan. Status permintaan sulit dipantau dan riwayat aktivitas (*audit trail*) belum terekam secara lengkap. |
| Economy (Ekonomi) | Waktu kerja administrator banyak terpakai untuk tugas konfigurasi yang berulang. Beban biaya operasional meningkat seiring bertambahnya volume permintaan mesin virtual. |
| Control (Kontrol) | Konfigurasi yang dilakukan secara manual berpotensi menimbulkan inkonsistensi dan *configuration drift*. Proses *hardening* keamanan tidak seragam dan belum terdapat mekanisme persetujuan yang terstruktur sehingga meningkatkan risiko kesalahan manusia (*human error*). |
| Efficiency (Efisiensi) | Proses *provisioning* melibatkan banyak langkah manual yang berulang untuk setiap mesin virtual sehingga pemanfaatan sumber daya administrator menjadi kurang efisien. |
| Service (Layanan) | Belum tersedia layanan mandiri (*self-service*) bagi pengguna. Pengguna bergantung sepenuhnya pada administrator dalam penyediaan mesin virtual sehingga waktu tunggu layanan menjadi lama. |

**b. Analisis Kelayakan**

Analisis kelayakan dilakukan untuk menilai apakah sistem yang diusulkan layak untuk dikembangkan dan diterapkan. Analisis kelayakan pada penelitian ini meliputi kelayakan teknis, kelayakan operasional, dan kelayakan ekonomi.

**1) Kelayakan Teknis**

Secara teknis, sistem layak dikembangkan karena seluruh teknologi yang digunakan tersedia dan bersifat sumber terbuka (*open source*), meliputi Proxmox VE sebagai platform virtualisasi, Terraform untuk *provisioning*, Ansible untuk konfigurasi dan *hardening*, serta Laravel, React.js, PostgreSQL, dan Redis untuk membangun aplikasi. Teknologi tersebut telah teruji, memiliki dokumentasi yang memadai, serta dapat berjalan pada infrastruktur yang telah dimiliki sehingga tidak memerlukan pengadaan perangkat khusus.

**2) Kelayakan Operasional**

Secara operasional, sistem layak diterapkan karena selaras dengan alur kerja pengelolaan infrastruktur yang berjalan serta menjawab kebutuhan terhadap layanan mandiri dan mekanisme persetujuan yang terstruktur. Dibandingkan proses manual melalui antarmuka Proxmox VE bawaan maupun penggunaan perintah command line yang menuntut keahlian teknis khusus, sistem ini menyederhanakan proses *provisioning* melalui portal *self-service* sehingga mengurangi ketergantungan pada administrator dan menurunkan beban kerja operasional.

**3) Kelayakan Ekonomi**

Secara ekonomi, sistem layak dikembangkan karena seluruh komponen berbasis sumber terbuka sehingga tidak memerlukan biaya lisensi perangkat lunak. Hal ini menjadikan biaya pengembangan lebih rendah dibandingkan penggunaan solusi komersial sejenis seperti VMware Aria Automation atau ServiceNow yang membutuhkan biaya lisensi tinggi. Selain itu, otomatisasi proses *provisioning* menghemat waktu kerja administrator sehingga memberikan nilai efisiensi secara ekonomi.

### 3.3.2 Penetapan Tujuan Solusi

Tahap penetapan tujuan solusi dilakukan untuk menentukan karakteristik solusi yang akan dikembangkan berdasarkan permasalahan yang telah diidentifikasi. Solusi yang dirancang harus mampu menyediakan portal *self-service* berbasis web yang memungkinkan pengguna mengajukan kebutuhan mesin virtual secara mandiri, mendukung mekanisme *approval workflow*, mengotomatisasi proses *provisioning* menggunakan Terraform, melakukan konfigurasi dan *hardening* sistem menggunakan Ansible, serta menyediakan pengelolaan inventaris mesin virtual secara terpusat.

Selain itu, sistem juga dirancang untuk mendukung pengelolaan sumber daya infrastruktur melalui konsep lapisan abstraksi sehingga administrator dapat mengelola provider, katalog layanan, jaringan, datastore, Environment, dan tier sumber daya secara terstandarisasi tanpa harus berinteraksi langsung dengan konfigurasi infrastruktur fisik.

### 3.3.3 Perancangan dan Pengembangan

Tahap perancangan dan pengembangan dilakukan untuk menghasilkan desain sistem yang menjadi dasar implementasi aplikasi. Perancangan meliputi arsitektur sistem, pemodelan sistem menggunakan *Unified Modeling Language* (UML), perancangan basis data, serta perancangan lapisan abstraksi dan kebijakan yang digunakan dalam pengelolaan sumber daya infrastruktur.

Pada tahap ini, pengembangan artefak dilakukan menggunakan metode Prototyping yang bersarang di dalam tahapan DSRM. Metode Prototyping dipilih karena kebutuhan pengguna terhadap sistem berkembang secara bertahap sehingga memerlukan proses pengembangan yang bersifat iteratif dan umpan balik yang cepat. Melalui pendekatan ini, rancangan sistem tidak dibangun secara sekaligus, melainkan dikembangkan secara bertahap dalam bentuk prototipe yang terus disempurnakan hingga sesuai dengan kebutuhan pengguna.

Metode Prototyping pada penelitian ini dilakukan melalui beberapa tahapan yang berulang, yaitu identifikasi kebutuhan, pembangunan prototipe, evaluasi, serta perbaikan. Tahap identifikasi kebutuhan dilakukan untuk menentukan fungsi yang harus disediakan sistem berdasarkan hasil analisis permasalahan. Tahap pembangunan prototipe dilakukan dengan mengembangkan bagian sistem sesuai kebutuhan yang telah ditetapkan. Tahap evaluasi dilakukan untuk menilai kesesuaian prototipe terhadap kebutuhan melalui pengujian dan umpan balik pengguna. Tahap perbaikan dilakukan untuk menyempurnakan prototipe berdasarkan hasil evaluasi. Keempat tahapan tersebut dilakukan secara berulang sehingga fitur-fitur utama, seperti *self-service* *provisioning*, *approval workflow*, otomatisasi *provisioning* menggunakan Terraform, serta konfigurasi dan *hardening* menggunakan Ansible, dikembangkan secara bertahap hingga mencapai fungsi yang diharapkan.

**a. Arsitektur Sistem**

Arsitektur sistem digunakan untuk menggambarkan hubungan antar komponen utama yang membentuk aplikasi. Arsitektur ini menunjukkan integrasi antara antarmuka pengguna, layanan backend, basis data, layanan orkestrasi, serta platform virtualisasi yang digunakan dalam proses *provisioning* mesin virtual.

[Gambar 3.1 Arsitektur Sistem]

Berdasarkan Gambar 3.1, pengguna mengakses sistem melalui antarmuka web yang dibangun menggunakan React.js. Permintaan yang dikirimkan pengguna diproses oleh backend Laravel yang bertugas menangani autentikasi, otorisasi, *workflow* persetujuan, pengelolaan inventaris, serta integrasi dengan Terraform dan Ansible. Seluruh data aplikasi disimpan pada PostgreSQL, sedangkan proses *provisioning* dilakukan melalui Terraform yang berkomunikasi dengan API Proxmox VE. Setelah mesin virtual berhasil dibuat, Ansible digunakan untuk melakukan konfigurasi dan *hardening* sistem operasi sesuai kebijakan yang telah ditentukan.

**b. Use Case Diagram**

Use Case Diagram digunakan untuk menggambarkan interaksi antara aktor dengan sistem yang dikembangkan.

[Gambar 3.2 Use Case Diagram]

Berdasarkan Gambar 3.2, sistem memiliki tiga aktor utama, yaitu User, Approver, dan Administrator. Ketiga aktor tersebut memiliki hubungan generalisasi (pewarisan), di mana User merupakan aktor dasar, Approver mewarisi seluruh kemampuan User dengan tambahan wewenang melakukan persetujuan permintaan, sedangkan Administrator mewarisi seluruh kemampuan Approver dan User dengan tambahan wewenang mengelola konfigurasi sistem. Dengan demikian, cakupan hak akses Administrator mencakup hak akses Approver, dan hak akses Approver mencakup hak akses User.

User dapat melakukan pengajuan *provisioning* mesin virtual serta mengelola inventaris layanan yang dimilikinya. Approver bertanggung jawab melakukan persetujuan terhadap permintaan yang diajukan pengguna. Administrator memiliki hak akses untuk mengelola konfigurasi sistem, pengguna, provider, katalog layanan, jaringan, datastore, Environment, tier sumber daya, serta berbagai komponen pendukung lainnya.

Selain relasi generalisasi, Use Case Diagram juga menggunakan relasi «include» dan «extend». Relasi «include» menunjukkan use case yang selalu dijalankan sebagai bagian dari use case utama, misalnya proses autentikasi yang selalu disertakan pada setiap akses ke sistem, validasi data yang selalu disertakan pada proses pengajuan *provisioning*, serta pencatatan *audit trail* yang selalu disertakan pada setiap aktivitas yang mengubah data. Adapun relasi «extend» menunjukkan use case tambahan yang hanya dijalankan pada kondisi tertentu, misalnya proses penolakan dan pengembalian permintaan yang merupakan perluasan dari proses persetujuan, serta perpanjangan masa aktif, perubahan sumber daya, dan penghapusan mesin virtual yang merupakan perluasan dari pengelolaan inventaris.

**c. Activity Diagram**

Activity Diagram digunakan untuk menggambarkan alur aktivitas yang terjadi pada sistem.

[Gambar 3.3 Activity Diagram Provisioning Mesin Virtual]

Berdasarkan Gambar 3.3, proses *provisioning* dimulai ketika pengguna memilih layanan yang tersedia dan mengisi formulir permintaan mesin virtual. Sistem melakukan validasi terhadap data yang diberikan sebelum mengirimkan permintaan ke tahap persetujuan. Setelah memperoleh persetujuan, sistem menjalankan proses *provisioning* menggunakan Terraform dan memperbarui data inventaris setelah mesin virtual berhasil dibuat.

[Gambar 3.4 Activity Diagram Approval Request]

Berdasarkan Gambar 3.4, proses approval dilakukan oleh Approver dengan memberikan keputusan berupa persetujuan, penolakan, atau pengembalian permintaan untuk diperbaiki. Setiap keputusan yang diberikan akan dicatat oleh sistem dan digunakan sebagai dasar dalam menentukan proses berikutnya.

[Gambar 3.5 Activity Diagram Inventory Mesin Virtual]

Berdasarkan Gambar 3.5, pengguna dapat melakukan pengelolaan mesin virtual melalui halaman inventaris. Aktivitas yang tersedia meliputi melihat informasi mesin virtual, melakukan perpanjangan masa aktif layanan, mengajukan perubahan sumber daya, serta melakukan penghapusan mesin virtual sesuai kebutuhan.

**d. Sequence Diagram**

Sequence Diagram digunakan untuk menggambarkan urutan komunikasi antar objek yang terlibat dalam proses bisnis sistem.

[Gambar 3.6 Sequence Diagram Provisioning Mesin Virtual]

Berdasarkan Gambar 3.6, proses *provisioning* melibatkan komunikasi antara pengguna, aplikasi web, basis data, dan layanan backend yang bertugas mengelola permintaan *provisioning*. Seluruh proses dilakukan secara terintegrasi sehingga status *provisioning* dapat dipantau melalui aplikasi.

[Gambar 3.7 Sequence Diagram Approval Request]

Berdasarkan Gambar 3.7, proses persetujuan melibatkan interaksi antara pengguna, Approver, dan sistem. Keputusan yang diberikan oleh Approver akan menentukan apakah proses *provisioning* dapat dilanjutkan atau harus dihentikan.

[Gambar 3.8 Sequence Diagram Terraform dan Proxmox VE]

Berdasarkan Gambar 3.8, backend melakukan komunikasi dengan Terraform untuk membangun infrastruktur yang dibutuhkan. Terraform kemudian berinteraksi dengan API Proxmox VE untuk membuat mesin virtual sesuai spesifikasi yang telah ditentukan. Setelah proses berhasil dilakukan, sistem memperbarui informasi inventaris dan status *provisioning* pada basis data.

**e. Class Diagram**

Class Diagram digunakan untuk menggambarkan struktur kelas yang membentuk aplikasi beserta hubungan antar kelas yang digunakan pada implementasi sistem.

[Gambar 3.9 Class Diagram]

Berdasarkan Gambar 3.9, sistem terdiri dari berbagai kelas yang mendukung pengelolaan pengguna, *workflow* persetujuan, katalog layanan, inventaris mesin virtual, *audit trail*, serta berbagai komponen yang digunakan untuk mendukung proses orkestrasi dan otomatisasi *provisioning* mesin virtual.

**f. Entity Relationship Diagram (ERD)**

*Entity Relationship Diagram* (ERD) digunakan untuk menggambarkan struktur basis data dan hubungan antar entitas yang digunakan dalam sistem.

[Gambar 3.10 Entity Relationship Diagram]

Berdasarkan Gambar 3.10, basis data dirancang untuk mendukung pengelolaan pengguna, provider, katalog layanan, jaringan, datastore, Environment, node, tier sumber daya, *provisioning* request, *approval workflow*, inventaris mesin virtual, audit log, serta data pendukung lainnya yang dibutuhkan oleh sistem.

**g. Lapisan Abstraksi dan Kebijakan**

Lapisan abstraksi dan kebijakan digunakan untuk memisahkan pengelolaan sumber daya infrastruktur dari layanan yang digunakan pengguna. Pendekatan ini memungkinkan pengelolaan infrastruktur dilakukan secara lebih terstruktur dan mudah dikendalikan.

[Gambar 3.11 Lapisan Abstraksi dan Kebijakan]

Berdasarkan Gambar 3.11, sistem menerapkan mekanisme discovery terhadap sumber daya yang tersedia pada provider infrastruktur. Hasil discovery kemudian dipublikasikan menjadi sumber daya yang dapat digunakan pada katalog layanan. Selanjutnya diterapkan kebijakan berupa Environment, tier sumber daya, serta *workflow* persetujuan yang berfungsi mengendalikan proses *provisioning* mesin virtual secara terstandarisasi.

**h. Deployment Diagram**

Deployment Diagram digunakan untuk menggambarkan penempatan komponen perangkat lunak pada perangkat keras serta hubungan antar node dalam menjalankan sistem.

[Gambar 3.12 Deployment Diagram]

Berdasarkan Gambar 3.12, pengguna mengakses sistem melalui peramban (web browser) pada perangkat klien. Permintaan pengguna diteruskan melalui jaringan menuju server aplikasi yang menjalankan beberapa komponen, yaitu antarmuka React.js, layanan backend Laravel, basis data PostgreSQL, Redis sebagai layanan caching dan antrean job, serta Laravel Reverb sebagai layanan komunikasi *real-time* berbasis WebSocket. Pada server aplikasi juga terdapat Terraform dan Ansible yang bertugas menjalankan proses *provisioning* serta konfigurasi sistem. Server aplikasi berkomunikasi dengan cluster Proxmox VE melalui API untuk membuat dan mengelola mesin virtual pada node-node yang tersedia. Mesin virtual yang telah dibuat selanjutnya dikonfigurasi dan di-*hardening* secara otomatis menggunakan Ansible sesuai kebijakan yang telah ditentukan.

### 3.3.4 Demonstrasi

Tahap demonstrasi dilakukan untuk menunjukkan bahwa sistem yang dikembangkan mampu menjalankan fungsi-fungsi utama sesuai tujuan penelitian. Demonstrasi dilakukan dengan menjalankan skenario penggunaan sistem yang mencakup proses pengajuan *provisioning* mesin virtual, pelaksanaan *approval workflow*, *provisioning* menggunakan Terraform, konfigurasi menggunakan Ansible, serta pengelolaan inventaris mesin virtual melalui portal *self-service* yang telah dikembangkan.

Melalui tahap demonstrasi, dapat diketahui bahwa seluruh komponen sistem mampu bekerja secara terintegrasi dalam mendukung proses orkestrasi dan otomatisasi *provisioning* mesin virtual pada platform Proxmox Virtual Environment.

### 3.3.5 Evaluasi

Tahap evaluasi dilakukan untuk menilai tingkat keberhasilan sistem yang telah dikembangkan. Evaluasi dilakukan melalui pengujian fungsional terhadap seluruh fitur aplikasi, pengukuran efektivitas proses *provisioning* setelah penerapan otomatisasi, serta penilaian terhadap kemampuan sistem dalam mendukung pengelolaan infrastruktur secara terstandarisasi.

Hasil evaluasi digunakan untuk memastikan bahwa aplikasi yang dikembangkan mampu memenuhi kebutuhan pengguna, mendukung proses *provisioning* mesin virtual secara otomatis, mengurangi ketergantungan terhadap konfigurasi manual, serta meningkatkan efisiensi pengelolaan infrastruktur virtual melalui penerapan pendekatan Infrastructure as Code.

**a. Variabel Penelitian**

Variabel penelitian merupakan atribut atau aspek yang diukur untuk menilai keberhasilan sistem yang dikembangkan. Penelitian ini menggunakan empat variabel utama, yaitu efisiensi, konsistensi konfigurasi, kesalahan manusia (*human error*), dan kebergunaan (*usability*). Definisi operasional, indikator, instrumen, serta skala pengukuran dari setiap variabel disajikan pada Tabel 3.4.

**Tabel 3.4 Variabel Penelitian**

| No | Variabel | Definisi Operasional | Indikator | Instrumen | Skala |
|----|----------|----------------------|-----------|-----------|-------|
| 1 | Efisiensi | Kecepatan dan kemudahan proses *provisioning* mesin virtual | Waktu *provisioning* (menit) dan jumlah langkah yang dilakukan | Stopwatch dan lembar observasi | Rasio |
| 2 | Konsistensi konfigurasi | Keseragaman hasil konfigurasi mesin virtual terhadap standar yang ditetapkan | Tingkat kesesuaian konfigurasi (jumlah deviasi terhadap standar) | Lembar checklist perbandingan konfigurasi | Rasio |
| 3 | Kesalahan manusia (*human error*) | Kesalahan konfigurasi yang terjadi selama proses *provisioning* | Jumlah kesalahan konfigurasi per proses *provisioning* | Lembar observasi dan log sistem | Rasio |
| 4 | Kebergunaan (*usability*) | Tingkat kemudahan penggunaan aplikasi oleh pengguna | Skor *System Usability Scale* (SUS) | Kuesioner SUS (10 butir, skala Likert 1–5) | Interval |

**b. Instrumen Penelitian**

Instrumen penelitian merupakan alat yang digunakan untuk mengumpulkan data pada proses pengujian. Instrumen yang digunakan dalam penelitian ini meliputi pengujian *black box* untuk memvalidasi fungsionalitas seluruh fitur aplikasi dengan memeriksa kesesuaian antara masukan dan keluaran tanpa melihat struktur kode internal; stopwatch dan lembar observasi untuk mencatat waktu serta jumlah langkah pada proses *provisioning*, baik menggunakan aplikasi maupun proses manual melalui antarmuka Proxmox VE bawaan; lembar checklist perbandingan konfigurasi untuk menilai keseragaman konfigurasi mesin virtual yang dihasilkan terhadap standar yang telah ditetapkan; pencatatan log sistem untuk menelusuri aktivitas dan kesalahan yang terjadi selama proses *provisioning*; pemeriksaan respons *Application Programming Interface* (API Response), yaitu pengamatan terhadap kode status dan data keluaran yang dikembalikan sistem untuk memastikan setiap permintaan diproses dengan benar oleh backend; serta kuesioner *System Usability Scale* (SUS) yang terdiri dari sepuluh butir pernyataan dengan skala Likert lima tingkat untuk mengukur tingkat kebergunaan aplikasi berdasarkan persepsi pengguna.

**c. Rancangan Pengujian**

Pengujian dilakukan untuk menilai keberhasilan sistem berdasarkan variabel yang telah ditetapkan, dengan membandingkan aplikasi yang dikembangkan terhadap proses manual melalui antarmuka Proxmox VE bawaan. Rancangan pengujian terdiri atas empat bagian. Pertama, pengujian fungsional menggunakan metode *black box* terhadap seluruh fitur aplikasi, seperti permintaan, persetujuan, *provisioning*, *hardening*, dan pengelolaan inventaris, untuk memastikan setiap fungsi berjalan sesuai kebutuhan. Kedua, pengujian efisiensi dengan membandingkan waktu dan jumlah langkah proses *provisioning*, dengan indikator keberhasilan berupa penurunan waktu *provisioning* minimal 50% disertai berkurangnya jumlah langkah. Ketiga, pengujian konsistensi dengan membandingkan keseragaman konfigurasi mesin virtual yang dihasilkan, dengan indikator keberhasilan berupa tingkat kesesuaian konfigurasi sebesar 100% tanpa *configuration drift*. Keempat, pengujian kebergunaan menggunakan kuesioner SUS, dengan indikator keberhasilan berupa perolehan skor SUS minimal 68 yang termasuk kategori dapat diterima (acceptable). Hasil pengujian efisiensi, konsistensi, dan kebergunaan selanjutnya dianalisis secara statistik untuk menguji hipotesis penelitian sebagaimana dirumuskan pada Bab II.

**d. Teknik Analisis Data**

Data yang diperoleh dari proses pengujian dianalisis menggunakan teknik yang disesuaikan dengan jenis data pada setiap variabel penelitian.

Data efisiensi, yang meliputi waktu dan jumlah langkah *provisioning*, serta data konsistensi konfigurasi dianalisis menggunakan uji statistik komparatif untuk membandingkan aplikasi yang dikembangkan dengan proses manual melalui antarmuka Proxmox VE bawaan. Sebelum uji beda dilakukan, data terlebih dahulu diuji normalitasnya menggunakan uji Shapiro-Wilk. Apabila data berdistribusi normal, digunakan uji *Independent Sample T-Test*; apabila data tidak berdistribusi normal, digunakan uji nonparametrik, yaitu uji Wilcoxon. Uji beda ini digunakan untuk menentukan apakah terdapat perbedaan yang signifikan antara kedua metode sebagaimana dirumuskan pada hipotesis penelitian di Bab II.

Data kebergunaan (*usability*) dianalisis menggunakan perhitungan skor *System Usability Scale* (SUS). Skor SUS dihitung sesuai prosedur baku sehingga menghasilkan nilai dalam rentang 0 hingga 100, kemudian diinterpretasikan berdasarkan kategori penerimaan dengan ambang batas minimal 68 sebagai kategori dapat diterima (acceptable).

Data pengujian fungsional dianalisis menggunakan persentase keberhasilan, yaitu perbandingan antara jumlah skenario pengujian *black box* yang berhasil sesuai hasil yang diharapkan terhadap total skenario yang diuji. Persentase keberhasilan tersebut digunakan untuk menilai tingkat kesesuaian fungsionalitas aplikasi terhadap kebutuhan yang telah ditetapkan.

## 3.4 Jadwal Penelitian

Jadwal penelitian ini dilaksanakan dari bulan Maret sampai bulan Juni. Rincian kegiatan penelitian disajikan pada Tabel 3.5.

**Tabel 3.5 Jadwal Penelitian**

| No | Kegiatan | Maret | April | Mei | Juni |
|----|----------|:-----:|:-----:|:---:|:----:|
| 1 | Studi Literatur dan Analisis Kebutuhan Sistem | ✓ | ✓ | | |
| 2 | Perancangan Sistem dan Pengembangan Aplikasi Web | ✓ | ✓ | | |
| 3 | Implementasi Terraform, Ansible, dan Integrasi Proxmox | | ✓ | ✓ | |
| 4 | Pengujian Sistem, Evaluasi, dan Analisis Hasil | | | ✓ | ✓ |
| 5 | Penyusunan Laporan Skripsi dan Revisi | | | ✓ | ✓ |
