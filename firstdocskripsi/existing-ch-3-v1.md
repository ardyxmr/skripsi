BAB III 
METODE PENELITIAN 
3.1 
Metode Pengumpulan Data 
Pengumpulan data merupakan salah satu tahapan penting dalam penelitian 
yang bertujuan untuk memperoleh informasi yang dibutuhkan dalam proses 
analisis, perancangan, implementasi, dan pengujian sistem. Data yang diperoleh 
digunakan sebagai dasar dalam pengembangan aplikasi web self-service untuk 
orkestrasi dan otomatisasi provisioning mesin virtual berbasis Infrastructure as 
Code (IaC). Teknik pengumpulan data yang digunakan dalam penelitian ini 
meliputi observasi, wawancara, dan studi literatur. 
3.3.1 Observasi 
Observasi dilakukan dengan mengamati secara langsung proses 
pengelolaan infrastruktur virtual dan mekanisme provisioning mesin virtual yang 
berjalan. Kegiatan observasi bertujuan untuk memahami alur kerja yang digunakan 
dalam penyediaan layanan mesin virtual, mengidentifikasi kebutuhan pengguna, 
serta menemukan kendala yang muncul pada proses provisioning yang dilakukan 
secara manual. 
Melalui observasi diketahui bahwa proses pembuatan mesin virtual 
memerlukan beberapa tahapan konfigurasi yang dilakukan secara berulang, mulai 
dari penentuan spesifikasi sumber daya, pemilihan template sistem operasi, 
konfigurasi jaringan, hingga konfigurasi sistem setelah mesin virtual berhasil 
dibuat. Proses tersebut memerlukan waktu yang relatif lama dan berpotensi 
menimbulkan kesalahan konfigurasi akibat campur tangan manusia. Oleh karena 
25 
26 
itu, diperlukan suatu sistem yang mampu mengotomatisasi proses provisioning dan 
konfigurasi mesin virtual secara terintegrasi. 
3.3.2 Wawancara 
Wawancara dilakukan untuk memperoleh informasi yang lebih mendalam 
mengenai kebutuhan sistem, proses bisnis yang berjalan, serta mekanisme 
pengelolaan infrastruktur yang diharapkan oleh pengguna. Wawancara dilakukan 
kepada pihak yang terlibat dalam proses pengelolaan layanan infrastruktur dan 
penyediaan mesin virtual. 
Hasil wawancara menunjukkan adanya kebutuhan terhadap sistem yang 
mampu menyediakan layanan pengajuan mesin virtual secara mandiri (self
service), menerapkan mekanisme persetujuan (approval workflow), melakukan 
otomatisasi provisioning, serta menyediakan fasilitas monitoring dan pengelolaan 
inventaris mesin virtual yang telah dibuat. Selain itu, diperlukan pula kemampuan 
pencatatan aktivitas pengguna melalui audit trail serta penerapan konfigurasi 
keamanan secara otomatis menggunakan proses hardening setelah mesin virtual 
berhasil dibuat. 
Informasi yang diperoleh dari hasil wawancara digunakan sebagai dasar 
dalam penyusunan kebutuhan sistem dan pengembangan fitur-fitur yang terdapat 
pada aplikasi. 
3.3.3 Studi Literatur 
Studi literatur dilakukan dengan mempelajari berbagai referensi yang 
berkaitan dengan topik penelitian. Referensi yang digunakan meliputi jurnal ilmiah, 
27 
skripsi, artikel penelitian, dokumentasi teknis, serta berbagai sumber akademik 
yang membahas mengenai virtualisasi, Infrastructure as Code, Terraform, Ansible, 
Proxmox Virtual Environment, otomatisasi provisioning, orkestrasi infrastruktur, 
dan pengembangan aplikasi berbasis web. 
Studi literatur bertujuan untuk memperoleh landasan teoritis yang 
mendukung penelitian, memahami konsep dan teknologi yang digunakan, serta 
mengidentifikasi penelitian terdahulu yang relevan. Selain itu, hasil studi literatur 
digunakan sebagai acuan dalam menentukan arsitektur sistem, metode 
pengembangan, mekanisme integrasi antar komponen, serta metode pengujian yang 
diterapkan dalam penelitian. 
Data yang diperoleh melalui observasi, wawancara, dan studi literatur 
kemudian dianalisis dan digunakan sebagai dasar dalam proses pengembangan 
aplikasi web self-service untuk orkestrasi dan otomatisasi provisioning mesin 
virtual berbasis sumber terbuka menggunakan Infrastructure as Code. 
3.2  
Alat & Bahan  
Tahapan penelitian merupakan rangkaian proses yang dilakukan secara 
sistematis untuk mencapai tujuan penelitian dan menghasilkan aplikasi web self
service yang mampu melakukan orkestrasi serta otomatisasi provisioning mesin 
virtual berbasis Infrastructure as Code (IaC). Tahapan penelitian dimulai dari 
identifikasi kebutuhan hingga pengujian sistem yang telah dikembangkan. 
Secara umum tahapan penelitian yang dilakukan dapat dilihat pada Gambar 
3.1. 
[Gambar 3.1 Tahapan Penelitian] 
Tahapan penelitian yang dilakukan terdiri dari beberapa tahap sebagai 
berikut: 
28 
1. Analisis Kebutuhan 
Tahap analisis kebutuhan dilakukan untuk mengidentifikasi kebutuhan 
pengguna, kebutuhan sistem, serta kebutuhan infrastruktur yang diperlukan dalam 
pengembangan aplikasi. Pada tahap ini dilakukan identifikasi terhadap proses 
provisioning mesin virtual yang berjalan, alur persetujuan pengguna, kebutuhan 
pengelolaan sumber daya virtual, serta kebutuhan integrasi dengan Proxmox VE, 
Terraform, dan Ansible. Hasil dari tahap ini digunakan sebagai dasar dalam 
menentukan kebutuhan fungsional dan nonfungsional sistem. 
2. Perancangan Sistem 
Tahap perancangan sistem dilakukan untuk menyusun rancangan aplikasi 
yang akan dikembangkan. Perancangan meliputi desain arsitektur sistem, 
perancangan basis data, perancangan antarmuka pengguna, serta pemodelan sistem 
menggunakan diagram UML dan Entity Relationship Diagram (ERD). Selain itu, 
pada tahap ini juga dirancang mekanisme integrasi antara aplikasi web dengan 
Terraform, Ansible, dan platform virtualisasi Proxmox VE. 
3. Implementasi Sistem 
Tahap implementasi merupakan proses pembangunan aplikasi berdasarkan 
rancangan yang telah dibuat. Frontend sistem dikembangkan menggunakan 
React.js, sedangkan backend dikembangkan menggunakan framework Laravel. 
PostgreSQL digunakan sebagai basis data untuk menyimpan data sistem. Pada 
tahap ini juga dilakukan implementasi Terraform sebagai alat provisioning mesin 
virtual serta Ansible sebagai alat konfigurasi dan hardening sistem operasi setelah 
proses provisioning berhasil dilakukan. 
4. Pengujian Sistem 
Setelah sistem selesai dikembangkan, dilakukan proses pengujian untuk 
memastikan seluruh fungsi sistem berjalan sesuai dengan kebutuhan pengguna. 
Pengujian dilakukan terhadap fitur pengajuan provisioning mesin virtual, proses 
persetujuan, eksekusi provisioning menggunakan Terraform, proses hardening 
menggunakan Ansible, pengelolaan inventaris mesin virtual, serta integrasi antar 
komponen sistem. Tahap ini bertujuan untuk mengidentifikasi kesalahan dan 
memastikan sistem dapat beroperasi secara optimal. 
5. Evaluasi Sistem 
29 
Tahap evaluasi dilakukan dengan menganalisis hasil implementasi dan 
pengujian sistem. Evaluasi bertujuan untuk mengetahui tingkat keberhasilan 
aplikasi dalam memenuhi kebutuhan pengguna, mendukung proses orkestrasi 
infrastruktur, serta meningkatkan efisiensi provisioning mesin virtual. Hasil 
evaluasi digunakan sebagai dasar untuk menilai kesesuaian sistem dengan tujuan 
penelitian yang telah ditetapkan. 
3.3 
Tahapan Penelitian 
Tahapan penelitian merupakan rangkaian proses yang dilakukan secara 
sistematis untuk mencapai tujuan penelitian dan menghasilkan aplikasi web self
service yang mampu melakukan orkestrasi serta otomatisasi provisioning mesin 
virtual berbasis Infrastructure as Code (IaC). Tahapan penelitian dimulai dari 
identifikasi kebutuhan hingga pengujian sistem yang telah dikembangkan. 
Secara umum tahapan penelitian yang dilakukan dapat dilihat pada Gambar 
3.1. 
[Gambar 3.1 Tahapan Penelitian] 
Tahapan penelitian yang dilakukan terdiri dari beberapa tahap sebagai 
berikut: 
1. Analisis Kebutuhan 
Tahap analisis kebutuhan dilakukan untuk mengidentifikasi kebutuhan 
pengguna, kebutuhan sistem, serta kebutuhan infrastruktur yang diperlukan dalam 
pengembangan aplikasi. Pada tahap ini dilakukan identifikasi terhadap proses 
provisioning mesin virtual yang berjalan, alur persetujuan pengguna, kebutuhan 
pengelolaan sumber daya virtual, serta kebutuhan integrasi dengan Proxmox VE, 
Terraform, dan Ansible. Hasil dari tahap ini digunakan sebagai dasar dalam 
menentukan kebutuhan fungsional dan nonfungsional sistem. 
2. Perancangan Sistem 
Tahap perancangan sistem dilakukan untuk menyusun rancangan aplikasi 
yang akan dikembangkan. Perancangan meliputi desain arsitektur sistem, 
perancangan basis data, perancangan antarmuka pengguna, serta pemodelan sistem 
menggunakan diagram UML dan Entity Relationship Diagram (ERD). Selain itu, 
30 
pada tahap ini juga dirancang mekanisme integrasi antara aplikasi web dengan 
Terraform, Ansible, dan platform virtualisasi Proxmox VE. 
3. Implementasi Sistem 
Tahap implementasi merupakan proses pembangunan aplikasi berdasarkan 
rancangan yang telah dibuat. Frontend sistem dikembangkan menggunakan 
React.js, sedangkan backend dikembangkan menggunakan framework Laravel. 
PostgreSQL digunakan sebagai basis data untuk menyimpan data sistem. Pada 
tahap ini juga dilakukan implementasi Terraform sebagai alat provisioning mesin 
virtual serta Ansible sebagai alat konfigurasi dan hardening sistem operasi setelah 
proses provisioning berhasil dilakukan. 
4. Pengujian Sistem 
Setelah sistem selesai dikembangkan, dilakukan proses pengujian untuk 
memastikan seluruh fungsi sistem berjalan sesuai dengan kebutuhan pengguna. 
Pengujian dilakukan terhadap fitur pengajuan provisioning mesin virtual, proses 
persetujuan, eksekusi provisioning menggunakan Terraform, proses hardening 
menggunakan Ansible, pengelolaan inventaris mesin virtual, serta integrasi antar 
komponen sistem. Tahap ini bertujuan untuk mengidentifikasi kesalahan dan 
memastikan sistem dapat beroperasi secara optimal. 
5. Evaluasi Sistem 
Tahap evaluasi dilakukan dengan menganalisis hasil implementasi dan 
pengujian sistem. Evaluasi bertujuan untuk mengetahui tingkat keberhasilan 
aplikasi dalam memenuhi kebutuhan pengguna, mendukung proses orkestrasi 
infrastruktur, serta meningkatkan efisiensi provisioning mesin virtual. Hasil 
evaluasi digunakan sebagai dasar untuk menilai kesesuaian sistem dengan tujuan 
penelitian yang telah ditetapkan. 
3.3.1  Analisis Kebutuhan 
Analisis kebutuhan sistem dilakukan untuk mengidentifikasi kebutuhan 
yang harus dipenuhi oleh aplikasi agar dapat mendukung proses orkestrasi dan 
31 
otomatisasi provisioning mesin virtual secara efektif. Kebutuhan sistem dibagi 
menjadi dua kategori utama, yaitu kebutuhan fungsional dan kebutuhan 
nonfungsional. Kebutuhan fungsional menjelaskan layanan yang harus disediakan 
oleh sistem, sedangkan kebutuhan nonfungsional menjelaskan karakteristik dan 
kualitas sistem yang harus dipenuhi selama operasional. 
1. Kebutuhan Fungsional 
Kebutuhan fungsional merupakan kebutuhan yang berkaitan dengan fungsi 
dan layanan yang harus disediakan oleh sistem. Berdasarkan hasil analisis 
kebutuhan, aplikasi yang dikembangkan memiliki fungsi-fungsi sebagai berikut: 
1. Sistem menyediakan mekanisme autentikasi dan otorisasi pengguna 
berdasarkan hak akses yang dimiliki. 
2. Sistem menyediakan manajemen pengguna yang memungkinkan 
administrator mengelola data pengguna serta menentukan peran pengguna 
sebagai Admin, Approver, atau User. 
3. Sistem menyediakan katalog template mesin virtual yang dapat digunakan 
sebagai dasar pembuatan mesin virtual baru. 
4. Sistem menyediakan layanan pengajuan provisioning mesin virtual melalui 
portal self-service. 
5. Sistem memungkinkan pengguna menentukan spesifikasi mesin virtual 
yang akan dibuat, seperti nama mesin virtual, jumlah mesin virtual, 
kapasitas penyimpanan, jaringan, lingkungan penggunaan, serta konfigurasi 
hardening. 
32 
6. Sistem menyediakan mekanisme persetujuan (approval workflow) yang 
memungkinkan Approver melakukan tindakan approve, reject, atau revert 
terhadap permintaan provisioning. 
7. Sistem mencatat alasan setiap keputusan yang diberikan pada proses 
persetujuan sebagai bagian dari riwayat aktivitas sistem. 
8. Sistem melakukan otomatisasi provisioning mesin virtual menggunakan 
Terraform setelah permintaan mendapatkan persetujuan. 
9. Sistem melakukan integrasi dengan platform Proxmox VE untuk proses 
pembuatan dan pengelolaan mesin virtual. 
10. Sistem menjalankan proses hardening menggunakan Ansible sesuai pilihan 
yang ditentukan pada saat pengajuan provisioning. 
11. Sistem menyediakan halaman inventaris yang menampilkan seluruh mesin 
virtual yang dimiliki pengguna. 
12. Sistem menampilkan status provisioning mesin virtual secara real-time 
selama proses pembuatan berlangsung. 
13. Sistem menyediakan fasilitas perpanjangan masa aktif mesin virtual sesuai 
kebijakan lingkungan yang digunakan. 
14. Sistem menyediakan fasilitas pengajuan perubahan sumber daya mesin 
virtual seperti CPU, RAM, dan penyimpanan. 
15. Sistem menyediakan pengelolaan provider infrastruktur yang digunakan 
untuk proses provisioning. 
16. Sistem menyediakan pengelolaan network yang dapat digunakan oleh mesin 
virtual. 
33 
17. Sistem menyediakan pengelolaan datastore yang digunakan sebagai lokasi 
penyimpanan mesin virtual. 
18. Sistem menyediakan pengelolaan environment yang digunakan untuk 
menentukan kebijakan masa aktif mesin virtual. 
19. Sistem menyediakan pengelolaan tier sumber daya yang digunakan sebagai 
standar alokasi CPU, RAM, dan penyimpanan. 
20. Sistem menyediakan audit trail untuk mencatat seluruh aktivitas pengguna 
dan aktivitas sistem. 
Sistem menyediakan pusat notifikasi untuk menyampaikan informasi terkait 
status permintaan, persetujuan, dan aktivitas provisioning kepada pengguna. 
2. Kebutuhan Nonfungsional 
Kebutuhan nonfungsional merupakan kebutuhan yang berkaitan dengan 
kualitas, performa, keamanan, dan karakteristik operasional sistem. 
1. Kebutuhan Hardware 
Perangkat keras yang digunakan untuk pengembangan dan implementasi 
sistem harus mampu menjalankan aplikasi frontend, backend, database, serta proses 
provisioning infrastruktur. Spesifikasi perangkat keras yang digunakan meliputi 
prosesor, memori, media penyimpanan, dan koneksi jaringan yang mendukung 
operasional sistem. 
2. Kebutuhan Software 
Perangkat lunak yang digunakan dalam pengembangan dan implementasi 
sistem meliputi sistem operasi, React.js sebagai frontend framework, Laravel 
sebagai backend framework, PostgreSQL sebagai basis data, Terraform sebagai alat 
34 
Infrastructure as Code, Ansible sebagai alat konfigurasi dan hardening, serta 
Proxmox VE sebagai platform virtualisasi. 
3. Security 
Sistem harus menerapkan mekanisme autentikasi dan otorisasi untuk 
memastikan bahwa setiap pengguna hanya dapat mengakses fitur sesuai hak akses 
yang dimiliki. Selain itu, sistem harus menyediakan audit trail untuk mencatat 
aktivitas pengguna serta mendukung penerapan hardening otomatis pada mesin 
virtual yang dibuat. 
4. Performance 
Sistem harus mampu memproses permintaan provisioning secara efisien 
serta menampilkan informasi status provisioning kepada pengguna tanpa 
mengganggu kinerja aplikasi secara keseluruhan. 
5. Availability 
Sistem harus tersedia dan dapat diakses oleh pengguna selama layanan 
infrastruktur berjalan. Ketersediaan sistem menjadi faktor penting karena seluruh 
proses pengajuan, persetujuan, dan monitoring mesin virtual dilakukan melalui 
aplikasi. 
6. Compatibility 
Sistem harus dapat berjalan pada berbagai peramban web modern dan 
mampu berintegrasi dengan layanan pendukung seperti PostgreSQL, Terraform, 
Ansible, dan Proxmox VE. 
7. Scalability 
35 
Sistem harus mampu mendukung pertumbuhan jumlah pengguna, jumlah 
permintaan provisioning, serta penambahan sumber daya infrastruktur tanpa 
memerlukan perubahan arsitektur secara signifikan. 
3.3.2 Perancangan Sistem 
Perancangan sistem dilakukan sebagai tahap untuk menggambarkan 
struktur, alur proses, serta hubungan antar komponen yang terdapat pada aplikasi 
web self-service provisioning mesin virtual. Perancangan ini bertujuan untuk 
memberikan gambaran mengenai bagaimana sistem bekerja sebelum 
diimplementasikan ke dalam bentuk aplikasi. Pada penelitian ini, perancangan 
sistem dilakukan menggunakan Unified Modeling Language (UML) dan Entity 
Relationship Diagram (ERD) untuk memodelkan kebutuhan sistem secara 
terstruktur. 
1. Use Case Diagram 
Use Case Diagram digunakan untuk menggambarkan interaksi antara aktor 
dengan sistem. Diagram ini menunjukkan fungsi-fungsi utama yang dapat 
dijalankan oleh masing-masing aktor sesuai dengan hak akses yang dimiliki. 
[Gambar 3.2 Use Case Diagram] 
Berdasarkan Use Case Diagram, terdapat tiga aktor utama yang berinteraksi 
dengan sistem, yaitu User, Approver, dan Admin. User memiliki hak akses untuk 
melihat katalog, mengajukan permintaan provisioning mesin virtual, serta 
mengelola inventaris mesin virtual yang dimiliki. Approver bertugas melakukan 
proses persetujuan terhadap permintaan yang diajukan oleh User melalui 
mekanisme approve, reject, atau revert. Admin memiliki hak akses tertinggi yang 
mencakup pengelolaan pengguna, provider, katalog, jaringan, datastore, 
environment, tier, serta monitoring seluruh aktivitas sistem. 
36 
Use Case Diagram memberikan gambaran menyeluruh mengenai ruang 
lingkup sistem dan hubungan antara pengguna dengan layanan yang disediakan 
aplikasi. 
2. Activity Diagram 
Activity Diagram digunakan untuk menggambarkan alur aktivitas yang 
terjadi pada sistem mulai dari proses awal hingga proses selesai. Diagram ini 
menunjukkan urutan aktivitas serta keputusan yang terjadi pada setiap proses bisnis. 
a. Activity Diagram Provisioning Mesin Virtual 
[Gambar 3.3 Activity Diagram Provisioning Mesin Virtual] 
Diagram ini menggambarkan proses pengajuan provisioning mesin virtual 
yang dilakukan oleh pengguna. Proses dimulai ketika pengguna memilih katalog 
mesin virtual, mengisi formulir provisioning, menentukan spesifikasi sumber daya, 
kemudian mengirimkan permintaan ke sistem. Selanjutnya sistem menyimpan data 
permintaan dan meneruskannya ke proses persetujuan. 
b. Activity Diagram Approval Request 
[Gambar 3.4 Activity Diagram Approval Request] 
Diagram ini menggambarkan proses persetujuan permintaan provisioning 
yang dilakukan oleh Approver. Setelah menerima permintaan, Approver dapat 
memberikan keputusan berupa approve, reject, atau revert. Setiap keputusan yang 
diberikan harus disertai alasan yang akan dicatat ke dalam riwayat aktivitas sistem. 
c. Activity Diagram Inventory Mesin Virtual 
[Gambar 3.5 Activity Diagram Inventory Mesin Virtual] 
Diagram ini menggambarkan proses pengelolaan inventaris mesin virtual 
yang telah berhasil dibuat. Pengguna dapat melihat status mesin virtual, 
37 
mengajukan perpanjangan masa aktif, melakukan permintaan perubahan sumber 
daya, serta mengajukan penghapusan mesin virtual sesuai kebutuhan. 
3. Sequence Diagram 
Sequence Diagram digunakan untuk menggambarkan urutan interaksi antar 
objek dalam sistem berdasarkan waktu pelaksanaan proses. 
a. Sequence Diagram Provisioning Mesin Virtual 
[Gambar 3.6 Sequence Diagram Provisioning Mesin Virtual] 
Diagram ini menggambarkan interaksi antara User, Frontend, Backend, dan 
Database ketika pengguna mengajukan permintaan provisioning mesin virtual. 
Data yang dimasukkan pengguna akan diterima oleh frontend, diteruskan ke 
backend untuk diproses, kemudian disimpan ke dalam basis data sebagai 
permintaan baru. 
b. Sequence Diagram Approval Request 
[Gambar 3.7 Sequence Diagram Approval Request] 
Diagram ini menunjukkan alur komunikasi ketika Approver melakukan 
proses persetujuan. Backend akan memperbarui status permintaan berdasarkan 
keputusan yang diberikan dan mencatat seluruh aktivitas ke dalam audit trail sistem. 
c. Sequence Diagram Provisioning Terraform 
[Gambar 3.8 Sequence Diagram Provisioning Terraform] 
Diagram ini menggambarkan proses eksekusi provisioning setelah 
permintaan mendapatkan persetujuan. Backend menjalankan Terraform untuk 
melakukan komunikasi dengan Proxmox VE. Setelah mesin virtual berhasil dibuat, 
sistem memperbarui status provisioning dan mencatat hasil proses ke dalam 
inventaris mesin virtual. 
4. Class Diagram 
38 
Class Diagram digunakan untuk menggambarkan struktur kelas yang 
membentuk aplikasi beserta hubungan antar kelas yang terdapat di dalam sistem. 
[Gambar 3.9 Class Diagram] 
Class Diagram pada sistem ini mencakup kelas-kelas utama seperti User, 
Role, Provider, Catalog, Network, Datastore, Environment, Tier, VmRequest, 
Approval, Inventory, Notification, dan AuditLog. Setiap kelas memiliki atribut dan 
fungsi yang mendukung proses bisnis sistem. Relasi antar kelas menunjukkan 
hubungan data yang digunakan dalam proses provisioning dan pengelolaan 
infrastruktur virtual. 
5. Entity Relationship Diagram (ERD) 
Entity Relationship Diagram digunakan untuk menggambarkan struktur 
basis data dan hubungan antar entitas yang digunakan oleh aplikasi. 
[Gambar 3.10 Entity Relationship Diagram] 
ERD menggambarkan hubungan antara data pengguna, permintaan 
provisioning, persetujuan, inventaris mesin virtual, konfigurasi provider, jaringan, 
datastore, environment, tier, notifikasi, dan audit log. Hubungan antar entitas 
dirancang untuk memastikan integritas data serta mendukung seluruh proses bisnis 
yang berjalan pada sistem. 
6. Perancangan Basis Data 
Perancangan basis data dilakukan untuk mendukung penyimpanan data 
yang digunakan oleh aplikasi selama proses operasional. Basis data yang digunakan 
dalam penelitian ini adalah PostgreSQL. 
Beberapa tabel utama yang digunakan dalam sistem meliputi: 
1. Tabel Users, digunakan untuk menyimpan data pengguna sistem. 
2. Tabel Roles, digunakan untuk menyimpan data hak akses pengguna. 
39 
3. Tabel Permissions, digunakan untuk mengatur izin akses setiap peran. 
4. Tabel Providers, digunakan untuk menyimpan konfigurasi provider 
infrastruktur. 
5. Tabel Catalogs, digunakan untuk menyimpan informasi template mesin 
virtual yang tersedia. 
6. Tabel Networks, digunakan untuk menyimpan data jaringan yang dapat 
digunakan oleh mesin virtual. 
7. Tabel Datastores, digunakan untuk menyimpan informasi media 
penyimpanan yang tersedia. 
8. Tabel Environments, digunakan untuk menyimpan kebijakan masa aktif 
mesin virtual. 
9. Tabel Tiers, digunakan untuk menyimpan konfigurasi standar CPU, RAM, 
dan penyimpanan. 
10. Tabel Vm_Requests, digunakan untuk menyimpan data permintaan 
provisioning mesin virtual. 
11. Tabel Approvals, digunakan untuk menyimpan data proses persetujuan 
permintaan. 
12. Tabel Inventories, digunakan untuk menyimpan informasi mesin virtual 
yang telah berhasil dibuat. 
13. Tabel Notifications, digunakan untuk menyimpan data notifikasi sistem. 
14. Tabel Audit_Logs, digunakan untuk menyimpan catatan aktivitas pengguna 
dan aktivitas sistem. 
Perancangan basis data tersebut menjadi fondasi utama dalam mendukung 
integrasi antara aplikasi web, Terraform, Ansible, dan platform virtualisasi 
40 
Proxmox VE sehingga seluruh proses provisioning dapat berjalan secara terstruktur 
dan terdokumentasi dengan baik. 
3.3.3 Implementasi Sistem 
Implementasi sistem merupakan tahap penerapan hasil perancangan ke 
dalam bentuk aplikasi yang dapat digunakan oleh pengguna. Pada penelitian ini, 
implementasi dilakukan dengan membangun aplikasi web self-service yang 
terintegrasi dengan Terraform, Ansible, dan Proxmox VE untuk mendukung proses 
orkestrasi serta otomatisasi provisioning mesin virtual. Implementasi sistem terdiri 
dari frontend, backend, basis data, Terraform, Ansible, serta integrasi antar 
komponen yang membentuk keseluruhan sistem. 
1. Implementasi Frontend 
Frontend merupakan bagian sistem yang berinteraksi langsung dengan 
pengguna. Frontend dibangun menggunakan React.js dengan pendekatan Single 
Page Application (SPA) sehingga proses navigasi antar halaman dapat dilakukan 
secara dinamis tanpa melakukan pemuatan ulang halaman secara penuh. 
Halaman pertama yang diakses pengguna adalah halaman login yang 
digunakan untuk melakukan autentikasi sebelum memasuki sistem. 
[Gambar 3.14 Halaman Login] 
Setelah berhasil melakukan autentikasi, pengguna akan diarahkan menuju 
dashboard utama yang menampilkan informasi ringkas mengenai aktivitas dan 
layanan yang tersedia pada sistem. 
[Gambar 3.15 Dashboard] 
Halaman katalog digunakan untuk menampilkan daftar template sistem 
operasi yang tersedia dan dapat digunakan sebagai dasar pembuatan mesin virtual. 
[Gambar 3.16 Halaman Catalog] 
41 
Halaman provisioning digunakan untuk melakukan pengajuan pembuatan 
mesin virtual dengan menentukan spesifikasi yang dibutuhkan seperti environment, 
tier, kapasitas penyimpanan, jaringan, dan opsi hardening. 
[Gambar 3.17 Halaman Provisioning VM] 
Halaman approval digunakan oleh Approver untuk melakukan proses 
persetujuan terhadap permintaan yang diajukan oleh pengguna. 
[Gambar 3.18 Halaman Approval Request] 
Halaman inventory digunakan untuk menampilkan seluruh mesin virtual 
yang telah berhasil dibuat serta menyediakan fitur monitoring dan pengelolaan 
mesin virtual. 
[Gambar 3.19 Halaman Inventory] 
Halaman settings digunakan oleh administrator untuk mengelola 
konfigurasi sistem seperti pengguna, provider, katalog, jaringan, datastore, 
environment, tier, audit trail, dan notifikasi. 
[Gambar 3.20 Halaman Settings] 
2. Implementasi Backend 
Backend dibangun menggunakan framework Laravel yang berfungsi 
sebagai pusat pengolahan logika bisnis sistem. Backend menyediakan API yang 
digunakan oleh frontend untuk melakukan komunikasi dengan sistem. 
Implementasi backend mencakup pengelolaan autentikasi pengguna, pengaturan 
hak akses berdasarkan peran pengguna, pengelolaan data master, proses approval 
request, pengelolaan inventaris mesin virtual, pengelolaan audit trail, serta integrasi 
dengan Terraform dan Ansible. 
Backend juga bertanggung jawab dalam menjalankan proses provisioning 
setelah permintaan mendapatkan persetujuan. Proses eksekusi dilakukan melalui 
42 
service yang menjalankan Terraform dan Ansible secara otomatis sehingga 
pengguna tidak perlu melakukan konfigurasi infrastruktur secara manual. 
3. Implementasi Basis Data 
Basis data yang digunakan pada sistem adalah PostgreSQL. Basis data 
berfungsi untuk menyimpan seluruh informasi yang dibutuhkan selama operasional 
sistem. Data yang disimpan meliputi data pengguna, hak akses, provider, katalog, 
jaringan, datastore, environment, tier, permintaan provisioning, data approval, 
inventaris mesin virtual, audit trail, serta notifikasi sistem. 
Penggunaan PostgreSQL dipilih karena memiliki kemampuan pengelolaan 
data yang baik, mendukung transaksi secara konsisten, serta mampu menangani 
kebutuhan penyimpanan data pada aplikasi berbasis web secara optimal. 
4. Implementasi Terraform 
Terraform digunakan sebagai komponen utama Infrastructure as Code 
dalam proses provisioning mesin virtual. Terraform bertugas menerjemahkan 
parameter yang diberikan oleh pengguna menjadi konfigurasi infrastruktur yang 
dapat diterapkan secara otomatis pada Proxmox VE. Sistem membentuk direktori 
kerja khusus untuk setiap permintaan provisioning sehingga setiap proses memiliki 
file konfigurasi dan state yang terpisah. Pendekatan ini memungkinkan beberapa 
proses provisioning berjalan secara independen tanpa menimbulkan konflik pada 
Terraform state. 
Terraform kemudian melakukan komunikasi dengan API Proxmox VE 
untuk membuat mesin virtual berdasarkan spesifikasi yang telah ditentukan oleh 
pengguna, seperti template sistem operasi, jumlah CPU, kapasitas RAM, ukuran 
penyimpanan, dan konfigurasi jaringan. 
5. Implementasi Ansible 
43 
Ansible digunakan untuk melakukan konfigurasi lanjutan dan hardening 
terhadap mesin virtual yang berhasil dibuat. Implementasi Ansible dilakukan 
menggunakan playbook yang dijalankan secara otomatis setelah proses 
provisioning selesai. 
Ansible memperoleh informasi target mesin virtual melalui inventory yang 
dibentuk secara dinamis berdasarkan hasil provisioning Terraform. Selanjutnya 
playbook hardening dijalankan untuk menerapkan konfigurasi keamanan sesuai 
standar yang telah ditentukan. 
Integrasi ini memungkinkan proses konfigurasi pasca-provisioning 
dilakukan secara otomatis sehingga mengurangi kebutuhan konfigurasi manual 
setelah mesin virtual tersedia. 
6. Integrasi Antar Komponen Sistem 
Sistem yang dikembangkan menerapkan integrasi antar komponen secara 
menyeluruh untuk mendukung proses provisioning mesin virtual yang 
terotomatisasi. Frontend React.js berkomunikasi dengan backend Laravel melalui 
API untuk mengirim dan menerima data dari pengguna. Backend Laravel 
melakukan pengolahan logika bisnis serta berinteraksi dengan PostgreSQL untuk 
menyimpan dan mengambil data yang diperlukan. 
Pada saat proses provisioning dilakukan, backend memanggil Terraform 
untuk membuat mesin virtual pada Proxmox VE. Setelah provisioning selesai, 
backend dapat menjalankan Ansible untuk melakukan hardening sesuai kebutuhan 
pengguna. Seluruh aktivitas yang terjadi selama proses tersebut dicatat ke dalam 
basis data dan ditampilkan kembali kepada pengguna melalui halaman inventory, 
approval, audit trail, dan notifikasi. Melalui integrasi tersebut, sistem mampu 
menyediakan layanan provisioning mesin virtual yang terpusat, terdokumentasi, 
44 
dan terotomatisasi sehingga dapat meningkatkan efisiensi pengelolaan infrastruktur 
virtual secara keseluruhan. 
3.3.4 Pengujian Sistem 
Pengujian sistem dilakukan untuk memastikan bahwa seluruh fungsi yang 
terdapat pada aplikasi berjalan sesuai dengan kebutuhan yang telah ditentukan. 
Pengujian bertujuan untuk mengetahui tingkat keberhasilan sistem dalam 
menjalankan proses provisioning mesin virtual, mekanisme persetujuan, 
pengelolaan inventaris, serta integrasi dengan Terraform, Ansible, dan Proxmox 
VE. Metode pengujian yang digunakan pada penelitian ini adalah Black Box 
Testing dan User Acceptance Testing (UAT). 
1. Black Box Testing 
Black Box Testing merupakan metode pengujian yang dilakukan dengan 
memeriksa fungsi sistem berdasarkan masukan dan keluaran yang dihasilkan tanpa 
memperhatikan struktur kode program yang digunakan. Pengujian ini bertujuan 
untuk memastikan bahwa setiap fitur pada sistem dapat berjalan sesuai dengan 
kebutuhan pengguna. 
Pengujian dilakukan pada fitur-fitur utama yang terdapat pada aplikasi, 
seperti autentikasi pengguna, pengajuan provisioning mesin virtual, proses 
persetujuan, pengelolaan inventaris, pengelolaan data master, serta proses integrasi 
dengan layanan provisioning. 
Tabel 3.1 Hasil Black Box Testing 
No Fitur yang 
Diuji 
Skenario 
Pengujian 
Hasil 
yang 
Hasil 
Status 
Diharapkan 
Pengujian 
45 
 
 
 
1 Login Pengguna 
memasukkan 
username dan 
password yang 
valid 
Sistem berhasil 
menampilkan 
dashboard 
sesuai hak 
akses pengguna 
Sesuai 
harapan 
Berhasil 
2 Catalog VM Pengguna 
memilih template 
sistem operasi 
Sistem 
menampilkan 
detail template 
yang dipilih 
Sesuai 
harapan 
Berhasil 
3 Provision 
VM 
Pengguna 
mengisi form 
provisioning dan 
mengirim 
permintaan 
Sistem 
menyimpan 
data 
permintaan dan 
mengubah 
status menjadi 
Pending 
Sesuai 
harapan 
Berhasil 
4 Approval 
Request 
Approver 
melakukan 
persetujuan 
permintaan 
Sistem 
memperbarui 
status 
permintaan 
menjadi 
Approved 
Sesuai 
harapan 
Berhasil 
46 
 
 
 
5 Reject 
Request 
Approver 
menolak 
permintaan 
Sistem 
memperbarui 
status menjadi 
Rejected dan 
menyimpan 
alasan 
penolakan 
Sesuai 
harapan 
Berhasil 
6 Revert 
Request 
Approver 
mengembalikan 
permintaan untuk 
diperbaiki 
Sistem 
mengubah 
status menjadi 
Need Action 
Sesuai 
harapan 
Berhasil 
7 Terraform 
Provisioning 
Sistem 
menjalankan 
proses 
provisioning 
Mesin virtual 
berhasil dibuat 
pada Proxmox 
VE 
Sesuai 
harapan 
Berhasil 
8 Ansible 
Hardening 
Opsi hardening 
diaktifkan 
Sistem 
menjalankan 
playbook 
hardening 
setelah 
provisioning 
selesai 
Sesuai 
harapan 
Berhasil 
47 
9 
Inventory 
VM 
Pengguna 
melihat 
mesin virtual 
Sistem 
daftar 
menampilkan 
data 
Sesuai 
harapan 
Berhasil 
mesin 
virtual 
tersedia 
10 Audit Trail 
Sistem mencatat 
aktivitas 
Aktivitas 
yang 
Sesuai 
Berhasil 
tersimpan pada 
pengguna 
audit log 
harapan 
Berdasarkan hasil pengujian Black Box Testing, seluruh fungsi utama 
sistem dapat berjalan sesuai dengan kebutuhan yang telah ditentukan. Tidak 
ditemukan kegagalan fungsi yang menghambat proses operasional aplikasi. 
2. User Acceptance Testing (UAT) 
User Acceptance Testing (UAT) merupakan metode pengujian yang 
dilakukan untuk mengetahui tingkat penerimaan pengguna terhadap sistem yang 
telah dikembangkan. Pengujian dilakukan dengan meminta pengguna mencoba 
fitur-fitur yang tersedia pada aplikasi dan memberikan penilaian terhadap 
kemudahan penggunaan, tampilan antarmuka, kinerja sistem, serta kesesuaian 
fungsi dengan kebutuhan pengguna. 
Instrumen pengujian menggunakan beberapa aspek penilaian yang 
berkaitan dengan kualitas sistem dan pengalaman pengguna. 
Tabel 3.2 Hasil User Acceptance Testing 
No Aspek Penilaian 
1 
Kemudahan penggunaan sistem 
Hasil 
Baik 
2 
Kemudahan navigasi antarmuka 
Baik 
48 
3 
Kejelasan informasi yang ditampilkan 
Baik 
4 
Kesesuaian fitur dengan kebutuhan pengguna Baik 
5 
Kemudahan proses provisioning VM 
Baik 
6 
Kemudahan proses approval 
Baik 
7 
Kemudahan monitoring inventaris VM 
Baik 
8 
Performa sistem secara keseluruhan 
Baik 
Hasil User Acceptance Testing menunjukkan bahwa sistem dapat diterima 
dengan baik oleh pengguna dan mampu mendukung proses provisioning mesin 
virtual secara lebih efektif dibandingkan proses yang dilakukan secara manual. 
3. Hasil Pengujian Sistem 
Berdasarkan hasil Black Box Testing dan User Acceptance Testing yang 
telah dilakukan, aplikasi web self-service untuk orkestrasi dan otomatisasi 
provisioning mesin virtual berhasil menjalankan seluruh fungsi utama yang 
dirancang pada penelitian ini. Sistem mampu mendukung proses pengajuan 
provisioning, proses persetujuan, pembuatan mesin virtual menggunakan 
Terraform, konfigurasi keamanan menggunakan Ansible, pengelolaan inventaris 
mesin virtual, serta pencatatan aktivitas pengguna melalui audit trail. 
Integrasi antara React.js, Laravel, PostgreSQL, Terraform, Ansible, dan 
Proxmox VE dapat berjalan dengan baik sehingga seluruh proses provisioning 
dapat dilakukan secara terpusat melalui satu aplikasi berbasis web. Hasil pengujian 
menunjukkan bahwa sistem mampu memenuhi kebutuhan pengguna dalam 
mengelola infrastruktur virtual secara lebih cepat, terstandarisasi, terdokumentasi, 
dan terotomatisasi.