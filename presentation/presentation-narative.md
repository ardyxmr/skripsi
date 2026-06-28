Opening
"Assalamualaikum wr wb. Selamat pagi/siang, Yang Saya Hormati Bapak zulkifli selaku dosen pembimbing, serta yang terhormat bapak a sebagai Penguji pertama, Anggota Penguji, serta Dosen Pembimbing yang telah hadir.
Perkenalkan, nama saya Ardi Maryanto. Pada hari ini, saya akan mempresentasikan proposal penelitian saya yang berjudul: [Perancangan Dan Pengembangan Aplikasi Web Self-service Untuk Orkestrasi Dan Otomatisasi Provisioning Mesin Virtual Berbasis Sumber Terbuka Menggunakan Infrastructure As Code].
Penelitian ini berangkat dari pengalaman dan pengamatan langsung saya di industri infrastruktur dan platform IT. Dalam mengelola ekosistem virtualisasi, kontainer, hingga big data, saya menemui sebuah tantangan nyata pada perusahaan yang sedang berkembang—khususnya yang mengandalkan teknologi virtualisasi open-source seperti Proxmox, OpenStack, maupun OLVM.
Di satu sisi, teknologi ini memberikan efisiensi biaya yang luar biasa. Namun di sisi lain, muncul celah besar terkait standarisasi, tata kelola keamanan, dan kecepatan provisioning yang sering kali masih dilakukan secara manual dan tidak terpusat. Celah inilah yang menjadi kegelisahan profesional sekaligus urgensi akademis yang melandasi penelitian ini.
Untuk melihat bagaimana benang merah dari tantangan industri tersebut membentuk dasar penelitian saya, mari kita masuk ke slide pertama..."













Slide1
"Bapak dan Ibu Penguji, memasuki slide pertama mengenai Latar Belakang, fokus utama penelitian ini diawali dari Tantangan Pengelolaan Infrastruktur Virtual yang diadopsi organisasi saat ini. Ada dua poin besar yang saling berbenturan di lapangan, yaitu antara fenomena kebutuhan dan realitas permasalahan.
Pertama, dari sisi Fenomena Infrastruktur: Saat ini infrastruktur TI bergerak semakin kompleks, di mana teknologi virtualisasi seperti Proxmox VE telah menjadi kebutuhan mutlak organisasi untuk mempermudah pengelolaan Virtual Machine. Dampaknya, volume kebutuhan provisioning VM baru pun melonjak secara signifikan.
Namun, lonjakan kebutuhan ini membentur blok kedua, yaitu Permasalahan di lapangan: Realitasnya, proses provisioning VM tersebut mayoritas masih dilakukan secara manual. Mulai dari alokasi CPU, RAM, storage, hingga konfigurasi jaringan harus disetel satu per satu secara berulang. Pendekatan manual ini memakan waktu yang lama, berisiko tinggi terhadap human error, dan memicu inkonsistensi konfigurasi antar-VM.
Oleh karena itu, seperti yang terangkum pada kesimpulan di bawah slide: Semakin tinggi kebutuhan akan Virtual Machine, semakin meningkat pula kompleksitas pengelolaannya. Dari titik inilah penelitian saya hadir, demi menjawab kebutuhan akan sebuah proses provisioning yang jauh lebih cepat, konsisten, dan terstandarisasi melalui otomatisasi platform."










Slide 2 
"Melanjutkan dari permasalahan manual tadi, solusi utama yang berkembang saat ini adalah penerapan Infrastructure as Code atau IaC. Melalui IaC, seluruh arsitektur infrastruktur didefinisikan ke dalam bentuk kode, sehingga proses penyediaan resource dapat berjalan otomatis dan konsisten.
Di dalam penelitian ini, ekosistem IaC yang dibangun mengombinasikan tiga teknologi utama:
1.	Proxmox VE bertindak sebagai platform virtualisasi dasar (hypervisor).
2.	Terraform digunakan untuk melakukan provisioning atau pembuatan VM secara otomatis di dalam Proxmox.
3.	Ansible bertanggung jawab melakukan konfigurasi server sekaligus eksekusi hardening keamanan otomatis pasca-VM terbentuk.
Jika kita melihat alur panah di bawah slide, proses idealnya terlihat sangat linear dan efisien: Dimulai dari adanya Request VM, logika kode Terraform akan meneruskannya ke pool Proxmox, dilanjutkan konfigurasi internal oleh Ansible, hingga menghasilkan status VM Ready yang siap digunakan.
Solusi ini di atas kertas terlihat sangat mempermudah operasional tim IT. Namun, pada praktiknya, penerapan kombinasi teknologi ini di lapangan masih menghadapi tantangan tersendiri, yang akan saya tunjukkan pada slide berikutnya..."












Slide 3
tantangan nyata yang saya maksud dapat kita lihat langsung pada contoh berkas konfigurasi di layar.

Di sebelah kiri adalah potongan kode deklaratif Terraform (main.tf), dan di sebelah kanan adalah skrip otomasi Ansible (hardening.yml). Secara teknis, kedua alat ini memang sangat kuat untuk mengotomatisasi infrastruktur. Namun, penerapannya di lapangan memunculkan dua hambatan utama:

Pertama, Kompleksitas Teknis (Hambatan Silo): Pengguna diwajibkan memahami sintaks kode, pengelolaan state, manajemen variabel, hingga parameter spesifik Proxmox. Akibatnya, adopsi teknologi ini hanya terbatas pada administrator pakar. Pengguna biasa atau tim pengembang non-pakar tetap memiliki ketergantungan penuh pada tim infra hanya untuk meminta sebuah VM baru. Proses ini menciptakan antrean kerja (bottleneck).

Kedua, Absennya Lapangan Tata Kelola (Governance): Eksekusi skrip CLI seperti ini tidak memiliki mekanisme kontrol bawaan. Tidak ada alur persetujuan (approval workflow), tidak ada pembatasan hak akses berjenjang (RBAC), dan tidak ada pelacakan riwayat aktivitas (audit trail).

Penelitian terdahulu umumnya hanya berfokus pada otomasi teknisnya saja secara terpisah. Belum ada platform berbasis open-source yang mampu mengintegrasikan fungsi self-service, governance, provisioning, dan hardening ke dalam satu ekosistem tunggal.

Di sinilah letak Urgensi Penelitian saya. Sistem yang dikembangkan bertindak sebagai lapisan abstraksi (abstraction layer). Kami menyembunyikan kompleksitas baris kode CLI ini di balik antarmuka web self-service yang ramah pengguna, namun tetap terstruktur secara ketat dari sisi tata kelola dan keamanan."



Slide 4 
berdasarkan urgensi dan kesenjangan riset tersebut, saya merumuskan empat poin masalah utama yang menjadi fokus dalam penelitian ini:
•	Poin Pertama, dari aspek Abstraksi Teknis: Bagaimana merancang aplikasi web self-service yang mampu menyembunyikan kompleksitas kode Terraform dan Ansible, sehingga proses provisioning di Proxmox menjadi mudah digunakan oleh pengguna non-pakar.
•	Poin Kedua, dari aspek Tata Kelola: Bagaimana menerapkan mekanisme kontrol yang mencakup RBAC, approval workflow, manajemen siklus hidup mesin virtual, serta audit trail demi menjamin keamanan sistem.
•	Poin Ketiga, dari aspek Efisiensi: Sejauh mana platform ini mampu meningkatkan efisiensi operasional dan mereduksi risiko human error jika dibandingkan dengan proses pengelolaan yang selama ini dilakukan secara manual.
•	Poin Keempat, dari aspek Aksesibilitas: Bagaimana mengukur tingkat keberdayaan atau usability dari aplikasi web yang dikembangkan ini bagi pengguna akhir.
Keempat rumusan masalah inilah yang menjadi landasan utama dari perancangan sistem yang saya lakukan. Selanjutnya, kita akan masuk ke..."













Slide 5
selaras dengan rumusan masalah yang telah diuraikan, Tujuan Penelitian ini secara eksplisit ditargetkan melalui empat poin utama yang terstruktur secara metodologis:
•	Poin Pertama dan Kedua merupakan tahap pengembangan: Yaitu merancang dan mengembangkan aplikasi web self-service guna menyembunyikan kompleksitas IaC di platform Proxmox, serta menerapkan mekanisme tata kelola yang aman melalui integrasi RBAC, approval workflow, dan audit trail.
•	Poin Ketiga dan Keempat merupakan tahap evaluasi: Yaitu mengevaluasi kemampuan sistem dalam meningkatkan efisiensi operasional dan mereduksi human error, serta mengevaluasi tingkat usability atau keterpakaian platform ini bagi pengguna akhir.
Sementara itu, pada bagian bawah slide, terdapat Manfaat Teoritis dari penelitian ini.
Karya ilmiah ini diharapkan dapat berkontribusi pada pengembangan ilmu pengetahuan di bidang Teknologi Informasi, khususnya dalam kajian orkestrasi IaC dan platform self-service. Selain itu, penelitian ini ditargetkan menjadi referensi akademik yang valid dalam penerapan Design Science Research Methodology (DSRM) untuk pengembangan sebuah artefak teknologi informasi.
Dari tujuan dan manfaat ini, mari kita bedah metodologi dan batasan sistem yang saya gunakan di slide berikutnya..











Slide 6 penelitian terdahulu
pada slide keenam ini, saya memetakan Perbandingan Penelitian Terdahulu dari tahun 2020 hingga 2025 untuk mempertegas posisi dan kebaruan (novelty) dari penelitian yang saya lakukan.
Secara umum, keenam literatur yang tertera di layar telah memvalidasi bahwa penggunaan Ansible dan Terraform terbukti secara ilmiah mampu meningkatkan efisiensi, menjaga konsistensi konfigurasi, serta mereduksi human error secara signifikan.
Namun, jika kita menelaah lebih dalam pada kolom Perbedaan Penelitian, terdapat dua keterbatasan utama dari riset-riset terdahulu yang menjadi celah bagi penelitian saya:
•	Pertama, Keterbatasan Abstraksi Antarmuka: Penelitian dari Hariyadi, Khumaidi, Marzuki, hingga Nabila, implementasinya masih berfokus pada sisi administrator, bersifat konseptual, atau berjalan sepenuhnya di level skrip CLI. Belum ada yang membungkus kompleksitas tersebut ke dalam sebuah aplikasi web portal self-service yang siap digunakan oleh pengguna non-pakar.
•	Kedua, Absennya Mekanisme Tata Kelola: Pada penelitian Nelmiawati yang sudah mengombinasikan provisioning dan hardening, fokusnya murni pada otomatisasi teknis. Sistem tersebut belum mengintegrasikan fungsi governance penting seperti approval workflow untuk persetujuan berjenjang dan manajemen hak akses berbasis peran (RBAC).
Di sinilah letak novelty atau pembeda utama dari penelitian saya. Saya tidak hanya berfokus pada fungsionalitas otomatisasi di balik layar, melainkan menyatukan self-service portal, approval workflow, orkestrasi Terraform, dan hardening Ansible dalam satu ekosistem web yang terpadu.
Selanjutnya, 







Slide 7:HIpotesis
"Bapak dan Ibu Penguji, dari kesenjangan riset yang telah dipetakan, saya mengajukan sebuah Hipotesis penelitian yang divalidasi melalui matriks perbandingan fitur pada image_1572bf.png.
Di sini, saya mengomparasi kapabilitas Ansible CLI, Terraform CLI, serta beberapa penelitian sejenis dengan Sistem yang Dikembangkan yang berada pada kolom paling kanan. Hipotesis utama dalam penelitian ini menyatakan bahwa integrasi seluruh fungsionalitas tersebut ke dalam satu platform web tunggal akan mampu menyelesaikan masalah tata kelola dan otomatisasi secara komprehensif.
Jika kita bedah kolom penilaian pada tabel, keunggulan mutlak dari sistem yang saya rancang mencakup tiga pemenuhan aspek sekaligus:
•	Pertama, Aspek Aksesibilitas dan Inventaris: Sistem ini menyediakan antarmuka berbasis web, mendukung self-service provisioning, pemantauan status permintaan, hingga manajemen masa aktif mesin virtual yang tidak diakomodasi oleh perkakas CLI murni.
•	Kedua, Aspek Tata Kelola (Governance): Fitur krusial seperti manajemen pengguna berbasis peran (RBAC) dan approval workflow berhasil disematkan secara penuh untuk menjamin kendali keamanan pra-eksekusi.
•	Ketiga, Aspek Orkestrasi Teknis: Sistem berhasil mengawinkan fungsi otomatisasi provisioning milik Terraform dengan otomatisasi hardening keamanan milik Ansible, untuk kemudian diintegrasikan langsung ke platform virtualisasi Proxmox VE.
Melalui visualisasi kolom paling kanan yang sepenuhnya terpenuhi ini, penelitian ini berhipotesis bahwa penyederhanaan arsitektur kompleks Infrastructure as Code ke dalam platform open-source terpadu sangat layak dan mampu diimplementasikan demi mendukung efisiensi operasional organisasi.
Untuk membuktikan hipotesis tersebut, pada slide berikutnya saya akan memaparkan mengenai alur metodologi pengembangan sistem..."






Slide 8: Metode Penelitian
"Bapak dan Ibu Penguji, memasuki bagian inti dari pelaksanaan riset, slide kedelapan ini memaparkan Metode Penelitian yang saya terapkan. Kerangka kerja ini dibangun di atas tiga pilar utama:
•	Pertama, Metode Pengumpulan Data (Sisi Kiri Atas): Untuk mengidentifikasi masalah provisioning dan merumuskan kebutuhan sistem secara akurat, saya menggunakan kombinasi tiga metode, yaitu observasi langsung terhadap operasional infrastruktur virtual, wawancara dengan praktisi terkait, serta studi literatur ilmiah.
•	Kedua, Bahan Penelitian (Sisi Kiri Bawah): Bahan yang dilibatkan dalam riset ini terbagi menjadi dokumen arsitektural dan komponen teknis. Ini mencakup source code, berkas konfigurasi Terraform, playbook Ansible, hingga skema basis data. Seluruh data lingkungan seperti parameter provider, jaringan, datastore, hingga skenario workflow persetujuan digunakan sebagai basis pengembangan sistem.
•	Ketiga, Tahapan Penelitian (Sisi Kanan): Sebagai metodologi utama, penelitian ini mengadopsi Design Science Research Methodology (DSRM). Melalui pendekatan DSRM, orientasi riset difokuskan pada perancangan dan penciptaan sebuah artefak teknologi berbentuk aplikasi web self-service. Artefak inilah yang nantinya bertugas mengorkestrasikan Terraform, Ansible, dan Proxmox VE ke dalam satu platform kendali yang terpusat.
Dengan landasan metodologi, data, dan bahan yang terstruktur ini, sistem dapat dirancang secara aman dan dapat dipertanggungjawabkan. Selanjutnya, mari kita bedah implementasi dari arsitektur sistem ini pada slide berikutnya..."









Slide 9: Arsitektur Sistem
"Bapak dan Ibu Penguji, pada slide kesembilan ini, saya akan memaparkan Arsitektur Sistem yang menjadi cetak biru teknis dan struktural dari artefak yang dikembangkan. Arsitektur ini mengintegrasikan seluruh komponen utama sistem ke dalam empat lapisan fungsional:
•	Pertama, Lapisan Klien (Client Layer): Pengguna berinteraksi melalui antarmuka berbasis React SPA di peramban, di mana seluruh lalu lintas data diamankan oleh Nginx reverse proxy melalui protokol HTTPS.
•	Kedua, Lapisan Aplikasi dan Data (Backend & Data Layer): Menggunakan framework Laravel sebagai pusat kendali logika bisnis. Lapisan ini menangani domain services inti seperti Provision, Approval, Lifecycle, hingga pencatatan Audit. Autentikasi API diamankan secara ketat oleh Laravel Sanctum. Dari sisi penyimpanan, data relasional dikelola oleh PostgreSQL, yang didukung oleh Redis sebagai penyedia layanan caching berkinerja tinggi.
•	Ketiga, Lapisan Eksekusi Asinkron (Asynchronous Execution): Ini merupakan jantung dari sistem orkestrasi yang saya bangun. Agar proses penyiapan mesin virtual tidak membebani performa aplikasi utama, setiap permintaan didelegasikan ke dalam antrean Redis Queue. Queue workers akan mengeksekusi job tersebut secara asinkron dengan memicu komponen TerraformRunner untuk otomatisasi infrastruktur dan AnsibleRunner untuk otomatisasi konfigurasi serta hardening.
•	Keempat, Infrastruktur Eksternal (Target Infrastructure): Seluruh hasil orkestrasi baris kode tersebut bermuara langsung pada klaster Proxmox VE sebagai platform virtualisasi target.
Sebagai penutup siklus arsitektur, segera setelah proses provisioning selesai, sistem memanfaatkan Reverb WebSocket Server untuk memancarkan pembaruan data secara real-time kembali ke sisi antarmuka pengguna melalui jalur WSS tanpa memerlukan penyegaran (refresh) halaman manual.
Selanjutnya, mari kita lihat bagaimana implementasi basis data..."





Slide 10: (Use Case & Activity Diagram)
" pada slide ini, saya akan memaparkan rancangan perilaku sistem pada gambar  dua diagram utama Use Case Diagram dan Activity Diagram.
1. Analisis Use Case Diagram (Sisi Kiri)
Diagram ini memetakan interaksi antara batas sistem dengan tiga aktor utama: User, Approver, dan Admin.
Ketiganya dirancang dalam hubungan generalisasi atau hierarchical access control, di mana peran yang lebih tinggi otomatis mewarisi kapabilitas peran di bawahnya tanpa pendefinisian ulang.
Dalam implementasinya, User mengakses fungsi provisioning inti dan pengelolaan siklus hidup (lifecycle) VM miliknya. Approver (Manager) memegang kendali tata kelola persetujuan, sedangkan Admin menguasai administrasi platform secara penuh. Pemisahan ini diterapkan demi menjaga prinsip pemisahan tugas (separation of duties).
2. Analisis Activity Diagram (Sisi Kanan)
Di sisi kanan, alur provisioning mesin virtual dibagi ke dalam tiga swimlane untuk memisahkan tanggung jawab sepanjang proses:
Swimlane Pengguna: Proses dimulai saat pengguna memilih parameter environment hingga mengirimkan permintaan secara mandiri berdasarkan sumber daya yang diizinkan.
Swimlane Sistem: Sistem langsung melakukan validasi kebijakan secara otomatis. Jika tidak valid, proses berhenti demi keamanan data. Bagi permintaan yang valid, sistem memeriksa kondisi persetujuan secara kondisional via parameter approval_required. Jika terpenuhi, sistem membentuk entitas ApprovalRequest berstatus Pending. Namun jika tidak diperlukan, sistem langsung melemparkannya ke tahap pengiriman pekerjaan (job submission).
Swimlane Approver: Di sinilah pihak berwenang meninjau antrean dokumen untuk menetapkan keputusan final.
Siklus Akhir Otomatisasi:
Begitu fase keputusan terlewati, sistem mengeksekusi ProvisionVmJob secara paralel pada pool worker melalui perintah terraform apply di direktori terisolasi. Setelah status inventaris diperbarui menjadi Active, sistem memancarkan event VmStateChanged untuk mendorong pembaruan data secara real-time ke antarmuka pengguna.
Selanjutnya.

Slide 11: Demonstrasi & Evaluasi
sebagai fase akhir dari penerapan metode DSRM dalam penelitian ini, slide ini memberikan point tahapan Demonstrasi dan Evaluasi terhadap artefak teknologi yang dikembangkan.
•	Tahap Demonstrasi (Sisi Atas): Tahapan ini dilakukan untuk membuktikan secara empiris bahwa sistem mampu menjalankan fungsionalitas utamanya secara terintegrasi. Cakupan demonstrasi ini meliputi seluruh siklus penyiapan infrastruktur, mulai dari proses pengajuan provisioning di portal self-service, berjalannya workflow persetujuan, eksekusi pembuatan VM menggunakan Terraform, hingga otomatisasi konfigurasi dan penguatan sistem menggunakan Ansible pada lingkungan Proxmox VE.
•	Tahap Evaluasi (Sisi Bawah): Setelah fungsionalitas sistem berhasil didemonstrasikan, proses dilanjutkan dengan evaluasi terstruktur untuk menilai tingkat keberhasilan sistem. Evaluasi ini mencakup pengujian fungsional komponen aplikasi, pengukuran efisiensi waktu pada provisioning otomatis, serta penilaian kemampuan platform dalam mendukung standarisasi infrastruktur. Hasil evaluasi ini mutlak diperlukan untuk memastikan bahwa aplikasi mampu mereduksi konfigurasi manual, meminimalkan risiko human error, dan menjawab kebutuhan pengguna secara optimal.
Melalui pemenuhan fase demonstrasi dan evaluasi ini, penelitian diharapkan mampu menghasilkan sebuah platform orkestrasi berbasis open-source yang tidak hanya fungsional, tetapi juga aman dan terstandarisasi untuk kebutuhan tata kelola infrastruktur modern.
Demikian pemaparan proposal penelitian saya. Terima kasih atas perhatian Bapak dan Ibu Penguji. Waktu dan kendali sidang saya kembalikan kepada Ketua Penguji untuk memasuki sesi tanya jawab dan diskusi."

