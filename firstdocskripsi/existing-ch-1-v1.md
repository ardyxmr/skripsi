BAB I 
PENDAHULUAN 
1.1 
Latar Belakang 
Perkembangan teknologi informasi telah mendorong organisasi untuk 
mengadopsi infrastruktur komputasi yang semakin kompleks guna mendukung 
kebutuhan operasional, penyimpanan data, serta penyediaan layanan digital. 
Infrastruktur server menjadi komponen penting dalam memastikan ketersediaan 
layanan, keandalan sistem, dan kontinuitas proses bisnis. Seiring meningkatnya 
kebutuhan akan sumber daya komputasi, pengelolaan server dan mesin virtual 
menjadi semakin menantang karena harus dilakukan secara cepat, konsisten, dan 
dapat diskalakan sesuai kebutuhan organisasi. Kondisi ini mendorong pemanfaatan 
teknologi virtualisasi sebagai solusi untuk meningkatkan efisiensi penggunaan 
sumber daya perangkat keras serta mempermudah pengelolaan lingkungan 
komputasi. Menurut Marzuki dkk. (2023), virtualisasi memungkinkan optimalisasi 
sumber daya fisik melalui pemanfaatan mesin virtual yang dapat dikelola secara 
fleksibel dalam satu platform terpusat.  
Meskipun virtualisasi memberikan banyak keuntungan, proses penyediaan 
atau provisioning mesin virtual masih sering dilakukan secara manual. Proses 
tersebut mencakup pembuatan mesin virtual, konfigurasi sumber daya komputasi, 
pengaturan jaringan, penentuan penyimpanan, hingga konfigurasi sistem operasi. 
Pengelolaan secara manual membutuhkan waktu yang relatif lama, terutama ketika 
jumlah server yang harus dibuat semakin banyak. Selain itu, proses yang berulang 
berpotensi menimbulkan kesalahan konfigurasi (human error) yang dapat 
memengaruhi stabilitas, keamanan, dan konsistensi lingkungan infrastruktur. 
Khumaidi (2021) menyatakan bahwa pengelolaan server secara manual 
mengharuskan administrator melakukan konfigurasi yang sama secara berulang 
pada beberapa server sehingga menjadi tidak efisien, membutuhkan waktu lebih 
lama, dan meningkatkan risiko kesalahan manusia.  
Permasalahan serupa juga ditemukan pada lingkungan komputasi awan 
(cloud computing) dan virtualisasi modern. Pengelolaan infrastruktur yang masih 
1 
2 
mengandalkan konfigurasi manual menyebabkan proses penyediaan layanan 
menjadi kurang fleksibel dan sulit memenuhi kebutuhan organisasi yang 
berkembang secara dinamis. Nabila dan Indrawati (2025) menjelaskan bahwa 
pengelolaan infrastruktur teknologi informasi secara manual memerlukan banyak 
tahapan, memakan waktu, serta memiliki risiko tinggi terhadap kesalahan 
konfigurasi yang dapat menyebabkan inefisiensi dan ketidakstabilan sistem. Oleh 
karena itu, dibutuhkan pendekatan yang mampu mengotomatisasi proses 
penyediaan infrastruktur agar dapat dilakukan secara cepat, konsisten, dan 
terdokumentasi dengan baik. 
Salah satu pendekatan yang berkembang pesat dalam pengelolaan 
infrastruktur modern adalah Infrastructure as Code (IaC). Konsep ini 
memungkinkan infrastruktur didefinisikan dalam bentuk kode sehingga proses 
penyediaan dan pengelolaan sumber daya dapat dilakukan secara otomatis dan 
berulang dengan hasil yang konsisten. Jangam dan Muntala (2025) menyatakan 
bahwa Infrastructure as Code mampu meningkatkan efisiensi, reliabilitas, dan 
skalabilitas pengelolaan infrastruktur karena seluruh konfigurasi dapat dikelola 
secara terstruktur, terdokumentasi, serta terintegrasi dengan proses otomatisasi. 
Selain itu, penggunaan IaC dapat mengurangi configuration drift dan 
meminimalkan kesalahan akibat intervensi manual. 
Dalam implementasinya, Terraform merupakan salah satu perangkat lunak 
Infrastructure as Code yang banyak digunakan untuk melakukan provisioning 
infrastruktur 
secara 
otomatis. 
Terraform memungkinkan administrator 
mendefinisikan sumber daya seperti mesin virtual, jaringan, penyimpanan, dan 
layanan lainnya melalui berkas konfigurasi sehingga proses penyediaan 
infrastruktur dapat dilakukan secara konsisten dan berulang. Setelah proses 
provisioning selesai dilakukan, konfigurasi lanjutan dan penguatan keamanan 
sistem dapat diotomatisasi menggunakan Ansible. Menurut Jangam dan Muntala 
(2025), kombinasi Terraform dan Ansible mampu membentuk alur otomatisasi 
yang terintegrasi, di mana Terraform bertugas menyediakan infrastruktur, 
sedangkan Ansible menangani konfigurasi sistem, instalasi layanan, serta 
pengelolaan keamanan secara otomatis. 
3 
Selain aspek otomatisasi, keamanan server juga menjadi perhatian penting 
dalam pengelolaan infrastruktur virtual. Kesalahan konfigurasi sistem operasi 
maupun layanan yang berjalan pada server dapat membuka celah keamanan yang 
berpotensi dimanfaatkan oleh pihak yang tidak bertanggung jawab. Nelmiawati 
dkk. (2025) menjelaskan bahwa proses server hardening diperlukan untuk 
meningkatkan ketahanan sistem terhadap ancaman keamanan sekaligus 
mengurangi risiko yang muncul akibat kesalahan konfigurasi manual. Penelitian 
tersebut 
menunjukkan bahwa otomatisasi provisioning dan hardening 
menggunakan Terraform dan Ansible mampu mempercepat proses implementasi 
sekaligus menghasilkan konfigurasi keamanan yang lebih konsisten.  
Berbagai penelitian sebelumnya telah membahas implementasi Ansible 
maupun Terraform dalam pengelolaan infrastruktur. Hariyadi dan Marzuki (2020) 
memanfaatkan Ansible untuk manajemen konfigurasi Virtual Private Server 
sehingga dapat mengurangi intervensi manual dalam pengelolaan server. 
Khumaidi (2021) menerapkan Ansible untuk otomatisasi manajemen server dan 
akun pengguna. Marzuki dkk. (2023) mengimplementasikan Ansible untuk 
otomatisasi konfigurasi jaringan virtual berbasis Open vSwitch pada Proxmox. 
Sementara itu, Nelmiawati dkk. (2025) mengombinasikan Terraform dan Ansible 
untuk otomatisasi server provisioning dan hardening.  
Meskipun demikian, berdasarkan kajian terhadap penelitian terdahulu, 
masih terdapat kesenjangan penelitian (research gap). Sebagian besar penelitian 
berfokus pada otomatisasi konfigurasi server, jaringan virtual, atau hardening 
sistem secara terpisah. Penelitian yang mengintegrasikan proses self-service 
request, mekanisme persetujuan (approval workflow), provisioning mesin virtual 
berbasis Proxmox, orkestrasi menggunakan Terraform, serta opsi hardening 
menggunakan Ansible dalam satu aplikasi berbasis web masih terbatas. Selain itu, 
pengguna umumnya masih harus berinteraksi langsung dengan administrator untuk 
mengajukan kebutuhan mesin virtual sehingga proses penyediaan layanan menjadi 
kurang efisien.  
Berdasarkan permasalahan tersebut, diperlukan sebuah aplikasi web self
service yang mampu mengotomatisasi proses permintaan, persetujuan, orkestrasi, 
dan provisioning mesin virtual secara terintegrasi. Melalui pemanfaatan platform 
4 
Proxmox sebagai lingkungan virtualisasi, Terraform sebagai Infrastructure as 
Code, serta Ansible sebagai alat konfigurasi dan hardening, pengguna dapat 
mengajukan kebutuhan mesin virtual secara mandiri melalui antarmuka web tanpa 
harus melakukan konfigurasi secara manual. Sistem juga mampu memastikan 
konsistensi konfigurasi, mempercepat proses penyediaan layanan, mengurangi 
risiko kesalahan manusia, serta meningkatkan efisiensi pengelolaan infrastruktur 
virtual. 
Berdasarkan uraian tersebut, penelitian ini dilakukan dengan judul 
“Perancangan dan Pengembangan Aplikasi Web Self-Service untuk Orkestrasi dan 
Otomatisasi Provisioning Mesin Virtual Berbasis Sumber Terbuka Menggunakan 
Infrastructure as Code.” Penelitian ini diharapkan dapat menghasilkan solusi yang 
mendukung otomatisasi pengelolaan infrastruktur virtual secara efektif, 
terstandarisasi, dan sesuai dengan kebutuhan organisasi modern. 
1.2 
Rumusan Masalah 
Berdasarkan latar belakang yang telah diuraikan, maka rumusan masalah 
dalam penelitian ini adalah sebagai berikut: 
1. Bagaimana merancang dan mengembangkan aplikasi web self-service yang 
dapat digunakan untuk mengelola proses permintaan (request) mesin 
virtual secara mandiri oleh pengguna?  
2. Bagaimana mengimplementasikan teknologi Infrastructure as Code 
menggunakan Terraform untuk mengotomatisasi proses provisioning 
mesin virtual pada platform Proxmox?  
3. Bagaimana mengimplementasikan Ansible untuk melakukan konfigurasi 
dan hardening mesin virtual secara otomatis setelah proses provisioning 
selesai dilakukan?  
4. Bagaimana menerapkan mekanisme persetujuan (approval workflow) 
dalam proses penyediaan mesin virtual sehingga setiap permintaan dapat 
ditinjau dan disetujui sebelum dilakukan provisioning?  
5. Bagaimana menghasilkan sistem yang mampu meningkatkan efisiensi, 
konsistensi konfigurasi, serta mengurangi risiko kesalahan manusia 
(human error) dalam proses pengelolaan dan penyediaan mesin virtual? 
5 
1.3 
Batasan Masalah 
Agar penelitian lebih terarah dan sesuai dengan tujuan yang ingin dicapai, 
maka batasan masalah dalam penelitian ini adalah sebagai berikut: 
1. Penelitian difokuskan pada perancangan dan pengembangan aplikasi web 
self-service untuk orkestrasi dan otomatisasi provisioning mesin virtual.  
2. Platform virtualisasi yang digunakan adalah Proxmox Virtual Environment 
(Proxmox VE) 9.1.  
3. Proses provisioning mesin virtual dilakukan menggunakan Terraform 
sebagai Infrastructure as Code (IaC).  
4. Proses konfigurasi dan hardening mesin virtual dilakukan menggunakan 
Ansible.  
5. Sistem memiliki tiga hak akses, yaitu User (Requestor), Approver 
(Manager), dan Admin.  
6. Sistem mencakup proses request, persetujuan (approval), provisioning, 
inventarisasi, dan hardening mesin virtual.  
7. Mesin virtual dibuat berdasarkan template sistem operasi yang telah 
tersedia pada Proxmox.  
8. Penelitian tidak membahas backup, disaster recovery, migrasi mesin 
virtual, serta analisis biaya infrastruktur.  
9. Pengujian difokuskan pada keberhasilan fungsi sistem dan proses 
otomatisasi provisioning mesin virtual. 
1.4 
Tujuan Penelitian 
1.4.1 Tujuan Umum 
Tujuan umum dari penelitian ini adalah merancang dan mengembangkan 
aplikasi web self-service untuk orkestrasi dan otomatisasi provisioning mesin 
virtual berbasis sumber terbuka menggunakan konsep Infrastructure as Code pada 
platform Proxmox.  
1.4.2 Tujuan Khusus 
6 
Tujuan khusus yang ingin dicapai dalam penelitian ini adalah sebagai 
berikut: 
1. Merancang dan mengembangkan aplikasi web self-service yang dapat 
digunakan untuk mengelola permintaan (request) mesin virtual secara 
mandiri oleh pengguna.  
2. Mengimplementasikan Terraform sebagai Infrastructure as Code (IaC) 
untuk mengotomatisasi proses provisioning mesin virtual pada platform 
Proxmox.  
3. Mengimplementasikan Ansible untuk melakukan konfigurasi dan 
hardening mesin virtual secara otomatis setelah proses provisioning.  
4. Menerapkan mekanisme persetujuan (approval workflow) dalam proses 
penyediaan mesin virtual sebelum dilakukan provisioning.  
5. Meningkatkan efisiensi, konsistensi konfigurasi, dan mengurangi risiko 
human error dalam pengelolaan serta penyediaan mesin virtual melalui 
proses otomatisasi berbasis Infrastructure as Code. 
1.5 
Manfaat Penelitian 
1.5.1 Manfaat Teoritis 
Penelitian 
ini 
diharapkan dapat memberikan kontribusi dalam 
pengembangan ilmu pengetahuan di bidang teknologi informasi, khususnya terkait 
penerapan Infrastructure as Code (IaC), otomatisasi provisioning mesin virtual, 
orkestrasi infrastruktur, serta implementasi Terraform dan Ansible dalam 
pengelolaan lingkungan virtualisasi berbasis Proxmox. Selain itu, penelitian ini 
dapat menjadi referensi bagi penelitian selanjutnya yang membahas otomatisasi 
infrastruktur dan pengelolaan sumber daya komputasi berbasis self-service. 
1.5.2 Manfaat Praktis 
7 
Secara praktis, penelitian ini diharapkan dapat memberikan manfaat bagi 
beberapa pihak sebagai berikut: 
a. Bagi Organisasi 
Penelitian ini dapat membantu organisasi dalam mempercepat proses 
penyediaan mesin virtual, meningkatkan konsistensi konfigurasi, 
mengurangi risiko human error, serta meningkatkan efisiensi pengelolaan 
infrastruktur virtual melalui proses otomatisasi. 
b. Bagi Administrator Infrastuktur 
Penelitian ini dapat mempermudah administrator dalam melakukan 
pengelolaan, konfigurasi, dan provisioning mesin virtual secara 
terstandarisasi sehingga mengurangi pekerjaan yang bersifat repetitif dan 
memakan waktu. 
c. Bagi Pengguna 
Penelitian ini memberikan kemudahan bagi pengguna untuk mengajukan 
permintaan mesin virtual secara mandiri melalui aplikasi web self-service 
tanpa harus melakukan proses pengajuan secara manual kepada 
administrator. 
1.6 
Metode Penelitian 
Penelitian ini menggunakan metode penelitian Research and Development 
(R&D) dengan pendekatan pengembangan sistem berbasis Infrastructure as Code 
(IaC). Metode ini dipilih karena penelitian tidak hanya berfokus pada analisis suatu 
permasalahan, tetapi juga menghasilkan sebuah produk berupa aplikasi web self
service yang mampu melakukan orkestrasi dan otomatisasi provisioning mesin 
virtual pada lingkungan virtualisasi Proxmox VE menggunakan Terraform dan 
Ansible. 
8 
Pendekatan Research and Development digunakan untuk menghasilkan 
solusi yang dapat mendukung pengelolaan infrastruktur virtual secara lebih efektif, 
terstandarisasi, dan terdokumentasi. Melalui pendekatan ini, proses penelitian 
dilakukan secara sistematis mulai dari identifikasi kebutuhan pengguna, 
perancangan sistem, pembangunan aplikasi, implementasi teknologi pendukung, 
hingga pengujian terhadap sistem yang telah dikembangkan. 
Pengembangan aplikasi pada penelitian ini menerapkan konsep 
Infrastructure as Code (IaC) sebagai landasan utama dalam pengelolaan 
infrastruktur. Konsep ini memungkinkan konfigurasi dan penyediaan sumber daya 
infrastruktur dilakukan secara otomatis melalui kode sehingga dapat mengurangi 
kesalahan konfigurasi manual, meningkatkan konsistensi implementasi, serta 
mempercepat proses provisioning mesin virtual. Dalam implementasinya, 
Terraform digunakan untuk melakukan provisioning mesin virtual pada platform 
Proxmox VE, sedangkan Ansible digunakan untuk melakukan konfigurasi dan 
hardening sistem operasi setelah proses provisioning berhasil dilakukan. 
Metode pengembangan sistem yang digunakan adalah pendekatan iteratif 
dan incremental, yaitu sistem dikembangkan secara bertahap berdasarkan 
kebutuhan fungsional yang telah diidentifikasi. Pendekatan ini memberikan 
fleksibilitas dalam proses pengembangan, memungkinkan penyempurnaan fitur 
secara berkelanjutan, serta memudahkan integrasi antar komponen sistem yang 
terdiri dari frontend, backend, basis data, dan infrastruktur otomatisasi.  
9 
1.6.1 Metode Pengumpulan Data 
Teknik pengumpulan data dilakukan untuk memperoleh informasi yang 
diperlukan dalam proses analisis, perancangan, pengembangan, dan pengujian 
sistem. Teknik pengumpulan data yang digunakan dalam penelitian ini meliputi 
observasi, wawancara, dan studi literatur. 
1.6.1.1 Metode Observasi  
Observasi dilakukan dengan mengamati secara langsung proses 
pengelolaan dan provisioning mesin virtual pada lingkungan infrastruktur virtual 
yang digunakan. Kegiatan observasi bertujuan untuk memahami alur kerja yang 
berjalan, mengidentifikasi kebutuhan pengguna, serta menemukan permasalahan 
yang muncul dalam proses provisioning yang masih dilakukan secara manual. 
1.6.1.2 Wawancara 
Wawancara dilakukan kepada pihak yang terlibat dalam pengelolaan 
infrastruktur dan penyediaan layanan mesin virtual. Wawancara bertujuan untuk 
memperoleh informasi mengenai kebutuhan sistem, mekanisme pengelolaan 
infrastruktur, proses bisnis yang berjalan, serta kebutuhan pengguna terhadap 
sistem yang akan dikembangkan. 
1.6.1.3 Studi Literatur 
Studi literatur dilakukan dengan mempelajari berbagai referensi yang 
berkaitan dengan topik penelitian, seperti Infrastructure as Code (IaC), Terraform, 
Ansible, Proxmox Virtual Environment, orkestrasi infrastruktur, otomatisasi 
provisioning, serta pengembangan aplikasi berbasis web. Studi literatur digunakan 
sebagai landasan teoritis dan acuan dalam pengembangan sistem. 
10 
1.6.2 Tahapan Penelitian 
Tahapan penelitian yang dilakukan terdiri dari beberapa langkah utama, 
yaitu: 
1. Analisis Kebutuhan 
Tahap ini dilakukan untuk mengidentifikasi kebutuhan pengguna, 
kebutuhan sistem, serta kebutuhan infrastruktur yang diperlukan dalam 
pengembangan aplikasi. Analisis dilakukan terhadap proses provisioning 
mesin virtual yang berjalan secara manual beserta berbagai kendala yang 
muncul pada proses tersebut. 
2. Perancangan Sistem 
Tahap perancangan meliputi perancangan arsitektur aplikasi, perancangan 
basis data, perancangan antarmuka pengguna, serta perancangan alur bisnis 
sistem. Pada tahap ini juga dilakukan perancangan integrasi antara aplikasi 
web, Terraform, Ansible, dan Proxmox VE agar seluruh komponen dapat 
bekerja secara terintegrasi. 
3. Implementasi Sistem 
Tahap implementasi merupakan proses pembangunan aplikasi berdasarkan 
hasil analisis dan perancangan yang telah dilakukan. Implementasi 
mencakup pengembangan frontend, backend, basis data, integrasi 
Terraform sebagai provisioning engine, serta integrasi Ansible untuk 
konfigurasi dan hardening mesin virtual. 
4. Pengujian Sistem 
Tahap pengujian dilakukan untuk memastikan seluruh fungsi sistem 
berjalan sesuai dengan kebutuhan yang telah ditentukan. Pengujian 
meliputi proses pengajuan request, mekanisme persetujuan (approval 
11 
workflow), otomatisasi provisioning mesin virtual, integrasi Terraform 
dengan Proxmox VE, proses hardening menggunakan Ansible, serta 
pengelolaan inventaris mesin virtual. 
5. Evaluasi dan Dokumentasi 
6. Tahap terakhir dilakukan dengan mengevaluasi hasil implementasi dan 
pengujian sistem untuk mengetahui tingkat keberhasilan aplikasi dalam 
mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual. 
Seluruh hasil penelitian kemudian didokumentasikan dalam bentuk laporan 
skripsi. 
1.7 
Sistematika Penulisan 
Sistematika penulisan dalam proposal skripsi ini disusun untuk 
memberikan gambaran secara umum mengenai isi dan struktur pembahasan pada 
setiap bab. Adapun sistematika penulisan dalam penelitian ini adalah sebagai 
berikut: 
BAB 
I 
PENDAHULUAN 
Bab ini berisi latar belakang penelitian, rumusan masalah, batasan masalah, tujuan 
penelitian, manfaat penelitian, metode penelitian, serta sistematika penulisan. Bab 
ini menjelaskan alasan dilakukannya penelitian dan gambaran umum mengenai 
permasalahan yang melatarbelakangi pengembangan aplikasi web self-service 
untuk orkestrasi dan otomatisasi provisioning mesin virtual berbasis Infrastructure 
as Code. 
BAB 
II 
LANDASAN 
TEORI 
Bab ini memuat kajian penelitian terdahulu yang relevan dengan topik penelitian 
serta landasan teori yang digunakan sebagai dasar dalam penelitian. Teori yang 
dibahas meliputi virtualisasi, Proxmox Virtual Environment, Infrastructure as 
Code (IaC), Terraform, Ansible, orkestrasi infrastruktur, server hardening, 
aplikasi web, basis data, serta konsep-konsep lain yang mendukung pengembangan 
sistem. 
BAB 
III 
METODOLOGI 
PENELITIAN 
Bab ini menjelaskan metode penelitian yang digunakan, teknik pengumpulan data, 
12 
analisis kebutuhan sistem, perancangan sistem, arsitektur aplikasi, perancangan 
basis data, perancangan antarmuka pengguna, serta tahapan implementasi dan 
pengujian sistem yang digunakan dalam penelitian.