BAB III
METODE PENELITIAN
3.1	Metode Pengumpulan Data
Metode pengumpulan data merupakan tahapan yang dilakukan untuk memperoleh informasi dan data yang dibutuhkan sebagai dasar dalam proses analisis, perancangan, dan pengembangan sistem. Pengumpulan data pada penelitian ini dilakukan untuk memahami proses pengelolaan infrastruktur virtual yang berjalan, mengidentifikasi permasalahan yang terjadi pada proses provisioning mesin virtual, serta memperoleh kebutuhan sistem yang akan dikembangkan. Metode pengumpulan data yang digunakan dalam penelitian ini meliputi observasi, wawancara, dan studi literatur.
3.3.1	Observasi
Observasi dilakukan dengan mengamati secara langsung proses provisioning mesin virtual pada lingkungan virtualisasi yang digunakan. Kegiatan observasi bertujuan untuk memahami alur kerja yang berjalan, mengidentifikasi tahapan yang masih dilakukan secara manual, serta menemukan kendala yang muncul selama proses penyediaan layanan mesin virtual.
Berdasarkan hasil observasi, proses provisioning mesin virtual memerlukan beberapa tahapan konfigurasi yang dilakukan secara berulang, mulai dari pemilihan template sistem operasi, penentuan spesifikasi sumber daya, konfigurasi jaringan, hingga konfigurasi sistem operasi setelah mesin virtual berhasil dibuat. Proses tersebut membutuhkan waktu yang relatif lama dan berpotensi menimbulkan inkonsistensi konfigurasi apabila dilakukan secara manual.
3.3.2	Wawancara
Wawancara dilakukan untuk memperoleh informasi yang lebih mendalam mengenai kebutuhan pengguna dan pengelola infrastruktur terhadap sistem yang akan dikembangkan. Wawancara dilakukan kepada pihak yang terlibat dalam pengelolaan layanan infrastruktur virtual guna memperoleh gambaran mengenai kebutuhan layanan, kendala yang dihadapi, serta harapan terhadap sistem yang akan dibangun.
Hasil wawancara menunjukkan adanya kebutuhan terhadap mekanisme self-service provisioning yang mampu mempermudah proses pengajuan mesin virtual, menyediakan alur persetujuan yang terstruktur, mendukung standarisasi konfigurasi layanan, serta mampu mengotomatisasi proses provisioning dan konfigurasi sistem sehingga dapat meningkatkan efisiensi operasional.
3.3.3	Studi Literatur
Studi literatur dilakukan dengan mempelajari berbagai referensi yang berkaitan dengan topik penelitian. Referensi yang digunakan meliputi jurnal ilmiah, artikel penelitian, dokumentasi teknis, serta sumber akademik lain yang membahas Infrastructure as Code (IaC), Terraform, Ansible, Proxmox Virtual Environment (Proxmox VE), orkestrasi infrastruktur, otomatisasi provisioning mesin virtual, keamanan sistem, dan pengembangan aplikasi berbasis web.
Studi literatur digunakan sebagai landasan teoritis dalam memahami konsep, metode, dan teknologi yang digunakan pada penelitian. Selain itu, studi literatur juga digunakan untuk mendukung proses analisis kebutuhan, perancangan sistem, pengembangan aplikasi, serta penyusunan metode evaluasi yang digunakan dalam penelitian.
3.2 	Alat & Bahan 
Alat dan bahan yang digunakan dalam penelitian ini berfungsi untuk mendukung proses perancangan, pengembangan, implementasi, dan pengujian aplikasi web self-service untuk orkestrasi dan otomatisasi provisioning mesin virtual berbasis sumber terbuka menggunakan pendekatan Infrastructure as Code (IaC). Alat dan bahan yang digunakan terdiri dari perangkat keras, perangkat lunak, dan bahan penelitian.
3.2.1	Perangkat Keras
Perangkat keras digunakan sebagai sarana dalam proses pengembangan, implementasi, dan pengujian sistem. Perangkat keras yang digunakan harus mampu menjalankan aplikasi frontend, backend, basis data, serta mendukung proses orkestrasi dan otomatisasi infrastruktur.
Tabel 3. 1 Perangkat Keras Penelitian
No	Perangkat Keras	Fungsi
1	Komputer atau Laptop	Digunakan untuk proses perancangan, pengembangan, dan pengujian aplikasi.
2	Server Proxmox VE	Digunakan sebagai platform virtualisasi untuk menjalankan mesin virtual.
3	Media Penyimpanan	Digunakan untuk menyimpan source code, konfigurasi sistem, dan basis data.
4	Jaringan Komputer	Digunakan untuk mendukung komunikasi antar komponen sistem.
3.2.2	Perangkat Lunak
Perangkat lunak digunakan untuk mendukung proses pengembangan aplikasi, pengelolaan basis data, orkestrasi infrastruktur, konfigurasi sistem, dan pengujian aplikasi.
Tabel 3. 2 Perangkat Lunak Penelitian
No	Perangkat Lunak	Fungsi
1	React.js	Digunakan untuk membangun antarmuka pengguna (frontend).
2	Laravel	Digunakan untuk membangun layanan backend dan API sistem.
3	PostgreSQL	Digunakan sebagai sistem manajemen basis data.
4	Redis	Digunakan untuk manajemen caching, antrean job (queue). 
5	Laravel Reverb	Penyediaan koneksi WebSocket real-time guna memperbarui status sistem secara langsung.
6	Terraform	Digunakan untuk melakukan provisioning mesin virtual secara otomatis menggunakan pendekatan Infrastructure as Code (IaC).
7	Ansible	Digunakan untuk konfigurasi dan hardening sistem operasi secara otomatis.
8	Proxmox Virtual Environment (Proxmox VE)	Digunakan sebagai platform virtualisasi untuk penyediaan mesin virtual.
9	Visual Studio Code	Digunakan sebagai editor kode dalam proses pengembangan aplikasi.
10	Git dan GitHub	Digunakan untuk pengelolaan versi source code.
11	Web Browser	Digunakan untuk mengakses dan menguji aplikasi berbasis web.
3.2.3	Bahan Penelitian
Bahan penelitian merupakan sumber data dan dokumen yang digunakan sebagai dasar dalam proses analisis, perancangan, pengembangan, dan evaluasi sistem. Bahan penelitian yang digunakan dalam penelitian ini meliputi dokumen kebutuhan sistem, dokumentasi arsitektur aplikasi, source code aplikasi, konfigurasi Terraform, playbook Ansible, struktur basis data, serta berbagai referensi ilmiah yang berkaitan dengan Infrastructure as Code, orkestrasi infrastruktur, virtualisasi, dan otomatisasi provisioning mesin virtual.
Selain itu, penelitian ini juga menggunakan data konfigurasi provider, katalog sistem operasi, jaringan, datastore, Environment, tier sumber daya, serta workflow persetujuan yang diterapkan pada aplikasi. Seluruh bahan penelitian tersebut digunakan untuk mendukung proses pengembangan artefak berupa aplikasi web self-service yang mampu melakukan orkestrasi dan otomatisasi provisioning mesin virtual secara terintegrasi.
3.3	Tahapan Penelitian
Tahapan penelitian merupakan rangkaian proses yang dilakukan untuk merancang dan mengembangkan aplikasi web self-service untuk orkestrasi dan otomatisasi provisioning mesin virtual berbasis sumber terbuka menggunakan pendekatan Infrastructure as Code (IaC). Penelitian ini menggunakan Design Science Research Methodology (DSRM) sebagai landasan dalam pengembangan artefak berupa aplikasi yang mampu mengotomatisasi proses provisioning mesin virtual, mengelola workflow persetujuan, serta mengintegrasikan Terraform, Ansible, dan Proxmox Virtual Environment (Proxmox VE) dalam satu platform terpusat.

3.3.1		Identifikasi Masalah dan Motivasi
Tahap identifikasi masalah dan motivasi dilakukan untuk memahami permasalahan yang terjadi pada proses provisioning mesin virtual. Berdasarkan hasil observasi dan wawancara, proses provisioning masih memerlukan berbagai konfigurasi yang dilakukan secara manual sehingga membutuhkan waktu yang relatif lama serta berpotensi menimbulkan inkonsistensi konfigurasi. Selain itu, belum tersedia mekanisme layanan mandiri yang memungkinkan pengguna mengajukan kebutuhan mesin virtual secara terstruktur melalui satu platform terintegrasi.
Permasalahan tersebut mendorong kebutuhan akan sebuah sistem yang mampu menyediakan layanan self-service provisioning, menerapkan standarisasi konfigurasi sumber daya, mengintegrasikan mekanisme persetujuan layanan, serta mengotomatisasi proses provisioning dan konfigurasi sistem menggunakan pendekatan Infrastructure as Code.
3.3.2	Penetapan Tujuan Solusi
Tahap penetapan tujuan solusi dilakukan untuk menentukan karakteristik solusi yang akan dikembangkan berdasarkan permasalahan yang telah diidentifikasi. Solusi yang dirancang harus mampu menyediakan portal self-service berbasis web yang memungkinkan pengguna mengajukan kebutuhan mesin virtual secara mandiri, mendukung mekanisme approval workflow, mengotomatisasi proses provisioning menggunakan Terraform, melakukan konfigurasi dan hardening sistem menggunakan Ansible, serta menyediakan pengelolaan inventaris mesin virtual secara terpusat.
Selain itu, sistem juga dirancang untuk mendukung pengelolaan sumber daya infrastruktur melalui konsep lapisan abstraksi sehingga administrator dapat mengelola provider, katalog layanan, jaringan, datastore, Environment, dan tier sumber daya secara terstandarisasi tanpa harus berinteraksi langsung dengan konfigurasi infrastruktur fisik.
3.3.3	Perancangan dan Pengembangan
Tahap perancangan dan pengembangan dilakukan untuk menghasilkan desain sistem yang menjadi dasar implementasi aplikasi. Perancangan meliputi arsitektur sistem, pemodelan sistem menggunakan Unified Modeling Language (UML), perancangan basis data, serta perancangan lapisan abstraksi dan kebijakan yang digunakan dalam pengelolaan sumber daya infrastruktur.
a. Arsitektur Sistem
Arsitektur sistem digunakan untuk menggambarkan hubungan antar komponen utama yang membentuk aplikasi. Arsitektur ini menunjukkan integrasi antara antarmuka pengguna, layanan backend, basis data, layanan orkestrasi, serta platform virtualisasi yang digunakan dalam proses provisioning mesin virtual.
 
Gambar 3. 1 Arsitektur Sistem
Berdasarkan Gambar 3.1, pengguna mengakses sistem melalui antarmuka web yang dibangun menggunakan React.js. Permintaan yang dikirimkan pengguna diproses oleh backend Laravel yang bertugas menangani autentikasi, otorisasi, workflow persetujuan, pengelolaan inventaris, serta integrasi dengan Terraform dan Ansible. Seluruh data aplikasi disimpan pada PostgreSQL, sedangkan proses provisioning dilakukan melalui Terraform yang berkomunikasi dengan API Proxmox VE. Setelah mesin virtual berhasil dibuat, Ansible digunakan untuk melakukan konfigurasi dan hardening sistem operasi sesuai kebijakan yang telah ditentukan.
b. Use Case Diagram
Use Case Diagram digunakan untuk menggambarkan interaksi antara aktor dengan sistem yang dikembangkan.
 
Gambar 3. 2 Use Case Diagram
Berdasarkan Gambar 3.2, sistem memiliki tiga aktor utama yaitu User, Approver, dan Administrator. User dapat melakukan pengajuan provisioning mesin virtual dan mengelola inventaris layanan yang dimiliki. Approver bertanggung jawab melakukan persetujuan, penolakan, atau pengembalian permintaan yang diajukan pengguna. Administrator memiliki hak akses untuk mengelola konfigurasi sistem, pengguna, provider, node, katalog layanan, jaringan, datastore, Environment, tier sumber daya, serta berbagai komponen pendukung lainnya.
c. Activity Diagram
Activity Diagram digunakan untuk menggambarkan alur aktivitas yang terjadi pada sistem.
 
Gambar 3. 3 Activity Diagram Provisioning Mesin Virtual
Berdasarkan Gambar 3.3, proses provisioning dimulai ketika pengguna memilih layanan yang tersedia dan mengisi formulir permintaan mesin virtual. Sistem melakukan validasi terhadap data yang diberikan sebelum mengirimkan permintaan ke tahap persetujuan. Setelah memperoleh persetujuan, sistem menjalankan proses provisioning menggunakan Terraform dan memperbarui data inventaris setelah mesin virtual berhasil dibuat.
 
Gambar 3. 4 Activity Diagram Approval Request
Berdasarkan Gambar 3.4, proses approval dilakukan oleh Approver dengan memberikan keputusan berupa persetujuan, penolakan, atau pengembalian permintaan untuk diperbaiki. Setiap keputusan yang diberikan akan dicatat oleh sistem dan digunakan sebagai dasar dalam menentukan proses berikutnya.
 
Gambar 3. 5 Activity Diagram Inventory Mesin Virtual
Berdasarkan Gambar 3.5, pengguna dapat melakukan pengelolaan mesin virtual melalui halaman inventaris. Aktivitas yang tersedia meliputi melihat informasi mesin virtual, melakukan perpanjangan masa aktif layanan, mengajukan perubahan sumber daya, serta melakukan penghapusan mesin virtual sesuai kebutuhan.
d. Sequence Diagram
Sequence Diagram digunakan untuk menggambarkan urutan komunikasi antar objek yang terlibat dalam proses bisnis sistem.
 
Gambar 3. 6 Sequence Diagram Provisioning Mesin Virtual
Berdasarkan Gambar 3.6, proses provisioning melibatkan komunikasi antara pengguna, aplikasi web, basis data, dan layanan backend yang bertugas mengelola permintaan provisioning. Seluruh proses dilakukan secara terintegrasi sehingga status provisioning dapat dipantau melalui aplikasi.
 
Gambar 3. 7 Sequence Diagram Approval Request
Berdasarkan Gambar 3.7, proses persetujuan melibatkan interaksi antara pengguna, Approver, dan sistem. Keputusan yang diberikan oleh Approver akan menentukan apakah proses provisioning dapat dilanjutkan atau harus dihentikan.
 
Gambar 3. 8 Sequence Diagram Terraform dan Proxmox VE
Berdasarkan Gambar 3.8, backend melakukan komunikasi dengan Terraform untuk membangun infrastruktur yang dibutuhkan. Terraform kemudian berinteraksi dengan API Proxmox VE untuk membuat mesin virtual sesuai spesifikasi yang telah ditentukan. Setelah proses berhasil dilakukan, sistem memperbarui informasi inventaris dan status provisioning pada basis data.
e. Class Diagram
Class Diagram digunakan untuk menggambarkan struktur kelas yang membentuk aplikasi beserta hubungan antar kelas yang digunakan pada implementasi sistem.
 

Gambar 3. 9 Class Diagram
Berdasarkan Gambar 3.9, sistem terdiri dari berbagai kelas yang mendukung pengelolaan pengguna, workflow persetujuan, katalog layanan, inventaris mesin virtual, audit trail, serta berbagai komponen yang digunakan untuk mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual.
f. Entity Relationship Diagram (ERD)
Entity Relationship Diagram digunakan untuk menggambarkan struktur basis data dan hubungan antar entitas yang digunakan dalam sistem.
 

Gambar 3. 10 Entity Relationship Diagram (ERD)
Berdasarkan Gambar 3.10, basis data dirancang untuk mendukung pengelolaan pengguna, provider, katalog layanan, jaringan, datastore, environment, tier sumber daya, provisioning request, approval workflow, inventaris mesin virtual, audit log, serta data pendukung lainnya yang dibutuhkan oleh sistem.
g. Lapisan Abstraksi dan Kebijakan
Lapisan abstraksi dan kebijakan digunakan untuk memisahkan pengelolaan sumber daya infrastruktur dari layanan yang digunakan pengguna. Pendekatan ini memungkinkan pengelolaan infrastruktur dilakukan secara lebih terstruktur dan mudah dikendalikan.
 

Gambar 3. 11 Lapisan Abstraksi dan Kebijakan
Berdasarkan Gambar 3.11, sistem menerapkan mekanisme discovery terhadap sumber daya yang tersedia pada provider infrastruktur. Hasil discovery kemudian dipublikasikan menjadi sumber daya yang dapat digunakan pada katalog layanan. Selanjutnya diterapkan kebijakan berupa environment, tier sumber daya, serta workflow persetujuan yang berfungsi mengendalikan proses provisioning mesin virtual secara terstandarisasi.
3.3.4	Demonstrasi
Tahap demonstrasi dilakukan untuk menunjukkan bahwa sistem yang dikembangkan mampu menjalankan fungsi-fungsi utama sesuai tujuan penelitian. Demonstrasi dilakukan dengan menjalankan skenario penggunaan sistem yang mencakup proses pengajuan provisioning mesin virtual, pelaksanaan approval workflow, provisioning menggunakan Terraform, konfigurasi menggunakan Ansible, serta pengelolaan inventaris mesin virtual melalui portal self-service yang telah dikembangkan.
Melalui tahap demonstrasi, dapat diketahui bahwa seluruh komponen sistem mampu bekerja secara terintegrasi dalam mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual pada platform Proxmox Virtual Environment.
3.3.5	Evaluasi
Tahap evaluasi dilakukan untuk menilai tingkat keberhasilan sistem yang telah dikembangkan. Evaluasi dilakukan melalui pengujian fungsional terhadap seluruh fitur aplikasi, pengukuran efektivitas proses provisioning setelah penerapan otomatisasi, serta penilaian terhadap kemampuan sistem dalam mendukung pengelolaan infrastruktur secara terstandarisasi.
Hasil evaluasi digunakan untuk memastikan bahwa aplikasi yang dikembangkan mampu memenuhi kebutuhan pengguna, mendukung proses provisioning mesin virtual secara otomatis, mengurangi ketergantungan terhadap konfigurasi manual, serta meningkatkan efisiensi pengelolaan infrastruktur virtual melalui penerapan pendekatan Infrastructure as Code.
3.4	Jadwal Penelitian
Jadwal Penelitian ini dilaksanakan dari bulan Maret sampai bulan Juni
Tabel 3. 3 Jadwal Penelitian
No	Kegiatan	Maret	April	Mei	Juni
		1	2	3	4	1	2	3	4	1	2	3	4	1	2	3	4
1.	Studi Literatur dan Analisis Kebutuhan Sistem																
2.	Perancangan Sistem dan Pengembangan Aplikasi Web																
3.	Implementasi Terraform, Ansible, dan Integrasi Proxmox																
4.	Pengujian Sistem, Evaluasi, dan Analisis Hasil																
5.	Penyusunan Laporan Skripsi dan Revisi																

