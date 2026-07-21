# BAB V PENUTUP

Bab ini merangkum hasil penelitian menjadi kesimpulan atas keempat rumusan masalah, memaparkan keterbatasan penelitian, lalu menurunkan saran bagi pengembangan sistem dan penelitian selanjutnya. Kesimpulan tidak memunculkan angka baru, melainkan mengondensasi temuan yang sudah dipaparkan pada Bab IV.

---

## 5.1 Kesimpulan

Penelitian ini membangun, menerapkan, dan menguji ExoVirt, yaitu portal penyediaan mesin virtual mandiri di atas Proxmox VE. Sistem berjalan pada lingkungan produksi yang melayani dua pusat data dengan lima *golden image* pada setiap pusat data. Keempat rumusan masalah terjawab sebagai berikut.

Rumusan Masalah 1 terjawab melalui abstraksi berlapis yang menyembunyikan Terraform dan Ansible dari pengguna. Portal menerjemahkan pilihan tier menjadi berkas variabel Terraform tanpa mengubah definisi utamanya, menjalankan Ansible sebagai aksi tersendiri melalui kunci SSH yang Terraform suntikkan, dan tidak pernah memaparkan antarmuka Proxmox VE kepada pemohon. Ukuran keberhasilan abstraksi terbaca pada jumlah langkah, yang turun dari 23 pada prosedur manual menjadi 10 pada portal, atau 56,52 %. Pengujian *black box* atas 40 skenario mencapai keberhasilan fungsional 100 %. Bukti empiris kemudahan pakai muncul pada skor SUS: lima pengguna biasa memberi portal 88,00 berkategori Excellent terhadap 18,50 untuk Proxmox VE yang berkategori Poor, dan angka itu berasal dari orang-orang yang menjadi sasaran perancangan sistem.

Rumusan Masalah 2 terjawab melalui tata kelola yang menyatu. Tiga peran membatasi kewenangan sekaligus cakupan data. Setiap permintaan pengguna biasa menunggu persetujuan sebelum Terraform berjalan. Enam jenis permintaan siklus hidup menempatkan perubahan terhadap mesin virtual hidup di bawah gerbang yang sama dengan pembuatan mesin virtual baru. Setiap peristiwa masuk ke jejak audit yang bersifat *append-only*. Nilai tata kelola ini terletak pada celah yang portal isi, karena Proxmox VE hanya menyediakan dua pilihan ekstrem, yaitu tanpa akses sama sekali atau akses penuh tanpa persetujuan, kuota, maupun jejak yang mengaitkan tindakan dengan alasannya.

Rumusan Masalah 3 terjawab pada tiga variabel. Pada efisiensi, uji Mann-Whitney U menghasilkan U = 0 dengan p = 1,08 × 10⁻⁵ sehingga Hipotesis 1 diterima; waktu turun 27,83 % dan jumlah langkah turun 56,52 %, dengan kedua kelompok yang tidak beririsan sama sekali. Pada konsistensi, kedua kelompok mencapai 100 % tanpa *configuration drift* sehingga Hipotesis 2 menghasilkan temuan null yang peneliti ramalkan sebelum pengukuran berjalan dan catat pada rencana pengukuran. Pada kesalahan manusia, keunggulan portal bersandar pada rancangan antarmuka yang menutup kolom *increment* disk, bukan pada jumlah sampel maupun keberuntungan operator.

Rumusan Masalah 4 terjawab melalui skor SUS. Portal memperoleh 92,19 berkategori Excellent terhadap 37,81 untuk Proxmox VE. *Paired sample t-test* menghasilkan t(7) = 6,982 dengan p = 0,000215, dan uji konfirmasi *Wilcoxon signed-rank* menghasilkan W = 0 dengan p = 0,0078, sehingga Hipotesis 3 diterima. Kedelapan responden memberi skor lebih tinggi kepada portal tanpa satu pun pembalikan arah. Pemecahan menurut peran memperlihatkan Proxmox VE bukan sistem yang buruk secara umum, karena administrator TI memberinya 70,00, melainkan tidak cocok sebagai antarmuka layanan mandiri bagi pengguna non-pakar yang memberinya 18,50. Portal menutup jurang antar-peran dari 51,50 poin menjadi 11,17 poin.

Ringkasan capaian terbaca pada indikator keberhasilan. Lima dari enam indikator tercapai, sebagaimana Tabel 4.33. Indikator penurunan waktu sebesar 50 % meleset pada 27,83 %, dan penyebabnya merupakan temuan tersendiri. Sebanyak 88,7 % waktu penyediaan merupakan waktu mesin yang ditentukan hypervisor, sedangkan portal berjalan di atas hypervisor yang sama, sehingga kloning penuh memakan waktu yang setara pada kedua jalur. Yang portal pangkas adalah waktu perhatian manusia, dari 136,90 detik menjadi 11,20 detik.

Secara keseluruhan, ketiga hipotesis penelitian diterima, dan melesetnya satu indikator perancangan tidak mengubah keputusan tersebut. Penelitian ini membuktikan bahwa antarmuka layanan mandiri yang mengabstraksikan *Infrastructure as Code* dapat memindahkan penyediaan mesin virtual dari kewenangan administrator ke tangan pengguna non-pakar tanpa mengorbankan tata kelola. Perbandingan yang sesungguhnya bukan cepat melawan lambat, melainkan cepat melawan jaminan berupa persetujuan, jejak audit, dan permukaan kesalahan yang lebih sempit.

---

## 5.2 Keterbatasan Penelitian

Penelitian ini memiliki sejumlah keterbatasan yang perlu dinyatakan agar pembaca dapat menimbang hasilnya secara adil, dan sekaligus menjadi pijakan bagi saran penelitian selanjutnya.

Peneliti menjalankan kedua kelompok pengukuran, dan peneliti juga merupakan pengembang sistem yang diuji. Kondisi ini menguntungkan kelompok manual pada variabel waktu karena operatornya menguasai Proxmox VE, namun sekaligus membuat angka kesalahan nol pada kelompok manual sulit digeneralisasi. Angka tersebut lahir setelah peneliti mengalami dua insiden dan hafal letak jebakannya, sehingga tidak mewakili operator yang belum pernah gagal.

Rancangan pengujian konsistensi mempersempit ruang munculnya perbedaan sampai ke satu parameter, yaitu disk. Hasil null pada Hipotesis 2 karena itu berlaku untuk rancangan ini dan tidak dapat digeneralisasi menjadi pernyataan bahwa prosedur manual sama konsistennya dengan portal pada kondisi lapangan yang membuka lebih banyak parameter terhadap kesalahan.

Jumlah responden SUS sebanyak 8 memadai untuk uji berpasangan, namun pemecahan menurut peran dengan komposisi 5 berbanding 3 terlalu kecil untuk diuji beda. Temuan antar-peran karena itu bersifat deskriptif, dan kekuatannya bersandar pada besar selisih beserta arahnya yang konsisten.

Percobaan batch berjumlah satu, sehingga angkanya deskriptif. Waktu manual pada perbandingan batch merupakan ekstrapolasi dari 136,90 detik dikali sepuluh, bukan hasil pengukuran sepuluh percobaan berturut-turut. Selain itu, dua mesin virtual memiliki dua sesi wizard akibat percobaan pendahuluan, sehingga peneliti tidak dapat memastikan sesi mana yang menghasilkan nilai `t1` keduanya, meskipun dampaknya terhadap Hipotesis 1 dapat diabaikan.

Data pembanding dari lingkungan VMware berdasarkan pengalaman kerja seorang praktisi dan dari jurnal mengenai Terraform hanya masuk sebagai pembanding deskriptif. Hypervisor, operator, dan perangkat kerasnya berbeda, sehingga keduanya tidak pernah masuk ke dalam uji statistik. Hipotesis pada subbab 2.4 mengunci pembandingnya pada antarmuka Proxmox VE bawaan.

Garis dasar prosedur manual pada penelitian ini merupakan kondisi paling menguntungkan bagi prosedur manual. Kedua kelompok berangkat dari template yang sama, sedangkan banyak organisasi masih membangun mesin virtual dari *base image* tanpa standarisasi, sebagaimana subbab 4.8.5 uraikan. Penurunan waktu sebesar 27,83 % karena itu terukur terhadap prosedur manual tercepat, dan selisih pada kondisi lapangan berpeluang lebih besar. Penelitian ini tidak mengklaim selisih yang lebih besar itu, karena pengukurannya berada di luar variabel kontrol yang ditetapkan.

---

## 5.3 Saran

### 5.3.1 Saran Pengembangan Sistem

Sistem yang berjalan pada lingkungan produksi masih menyisakan sejumlah kekurangan. Subbab ini mendaftar kekurangan tersebut beserta saran pengembangan untuk mengatasinya. Setiap butir menyebut keadaan sekarang lalu arah penyempurnaannya, dan diurutkan menurut kelompok kebutuhan.

**a. Kelengkapan operasi siklus hidup**

Pengelolaan disk belum lengkap, dan perilakunya berbeda antara tahap permintaan dan Inventory. Pada tahap permintaan, portal sudah memperluas boot disk secara otomatis melalui proses cloud-init, sehingga ukuran boot disk yang pemohon tetapkan langsung berlaku pada sistem operasi tamu tanpa langkah tambahan. Penambahan disk baru pada tahap ini belum didukung, karena cloud-init tidak dapat membuat partisi secara andal ketika mesin virtual memiliki lebih dari satu disk. Keterbatasan tersebut bersifat teknis dan disengaja, agar penyediaan awal tetap sederhana dan hasilnya dapat diprediksi.

Kekurangan yang sesungguhnya berada pada Inventory. Setelah mesin virtual berjalan, pengguna belum dapat menambah disk baru berikut pembuatan partisinya secara otomatis, dan belum dapat memperluas disk yang sudah ada secara otomatis. Pengembangan yang disarankan memindahkan pengelolaan disk ke Inventory dengan dua kemampuan. Kemampuan pertama adalah penambahan disk baru yang langsung dipartisi dan dipasang di dalam sistem operasi tamu. Kemampuan kedua adalah perluasan disk yang sudah terpasang disusul perluasan partisi dan sistem berkasnya. Karena cloud-init hanya berjalan pada boot pertama, kedua operasi tersebut sebaiknya memakai otomasi sisi tamu seperti Ansible melalui SSH, dan melewati alur persetujuan yang sama dengan permintaan lain.

Penyuntikan kunci SSH milik pengguna belum tersedia pada tahap permintaan. Portal saat ini menyuntikkan kunci yang sistem kelola, sehingga pengguna yang memiliki jump host sendiri belum dapat menambahkan kunci publiknya agar mesin virtual baru langsung memercayainya. Pengembangan yang disarankan menyediakan kolom pada menu permintaan untuk menempelkan atau memilih satu atau beberapa kunci SSH publik milik pengguna, yang kemudian cloud-init suntikkan saat boot pertama. Dengan begitu pengguna dapat langsung mengakses mesin virtual dari jump host miliknya tanpa meminta bantuan administrator.

Penggandaan mesin virtual belum tersedia. Portal belum menyediakan cara menyalin mesin virtual yang sudah dibuat menjadi mesin virtual baru beserta seluruh datanya. Pengembangan yang disarankan menambahkan fitur *clone* yang membangun mesin virtual baru dari sumber yang dipilih, lengkap dengan konfigurasi dan isi disknya, melalui alur persetujuan yang sama. Fitur ini memudahkan pengguna menduplikasi lingkungan yang sudah tertata, misalnya untuk keperluan pengujian, tanpa membangunnya dari awal.

Impor massal mesin virtual yang sudah ada belum tersedia. Banyak organisasi memiliki mesin virtual yang dibuat manual langsung dari Proxmox VE sebelum portal hadir, dan mesin tersebut berada di luar tata kelola portal. Pengembangan yang disarankan menyediakan fitur *bulk import* yang memanfaatkan mekanisme *discovery* untuk mendaftarkan mesin virtual yang sudah ada ke dalam Inventory, sehingga mesin lama ikut memperoleh siklus hidup, kuota, dan jejak audit tanpa perlu dibangun ulang.

Kontrol daya mesin virtual belum tersedia dari portal. Pengguna masih harus membuka Proxmox VE untuk menyalakan, mematikan, atau memulai ulang mesin virtual. Pengembangan yang disarankan menambahkan aksi daya pada Inventory agar operasi harian tetap berada di dalam satu antarmuka.

Status *Active* saat ini menyala rata-rata 5,80 detik sebelum alamat IP tersedia, sebagaimana subbab 4.3.7, sehingga pengguna yang langsung mengakses mesin virtual dapat gagal. Pengembangan yang disarankan menambahkan penanda `VM_READY` yang terbit saat alamat IP pertama muncul, agar status yang ditampilkan mencerminkan kesiapan sebenarnya.

**b. Keamanan dan autentikasi**

Autentikasi portal kini bertumpu pada akun lokal yang dibuat melalui pemasang awal. Integrasi dengan Active Directory atau LDAP belum tersedia. Pengembangan yang disarankan menghubungkan portal dengan direktori identitas organisasi melalui *single sign-on*, sehingga pengelolaan akun terpusat, pencabutan akses berlangsung serentak dengan status kepegawaian, dan permukaan risiko kata sandi lokal berkurang.

Autentikasi multifaktor belum tersedia. Portal yang memegang kewenangan membuat dan menghapus mesin virtual sepatutnya melindungi proses masuk dengan lapisan kedua. Pengembangan yang disarankan menambahkan autentikasi multifaktor berbasis aplikasi pengotentikasi atau kode sekali pakai, terutama bagi peran administrator.

Pengerasan mesin virtual kini berjalan melalui Ansible untuk sistem Linux, sedangkan Windows masih ditangani manual. Pengembangan yang disarankan menambahkan jalur pengerasan otomatis untuk Windows melalui WinRM atau agen, agar cakupan pengerasan seragam pada seluruh sistem operasi.

**c. Pemantauan dan integrasi**

Dasbor pemantauan belum tersedia. Fitur ini sengaja ditunda pada penelitian ini demi menghemat waktu pengembangan. Pengembangan yang disarankan menambahkan halaman ringkasan yang menampilkan kapasitas node, jumlah dan status mesin virtual, panjang antrean, serta kesehatan penyedia secara langsung, sehingga administrator memperoleh gambaran menyeluruh dalam satu tampilan.

Notifikasi kini hanya muncul di dalam aplikasi. Integrasi dengan kanal eksternal belum tersedia. Pengembangan yang disarankan menghubungkan peristiwa penting seperti permintaan persetujuan, keberhasilan penyediaan, kegagalan, dan mendekati kedaluwarsa ke kanal seperti Slack, surel, dan Telegram, agar pemangku kepentingan menerima pemberitahuan tanpa harus membuka portal.

Jejak audit kini tersimpan di basis data dan dapat diekspor sebagai berkas CSV, tetapi belum dialirkan ke sistem agregasi log. Pengembangan yang disarankan mengalirkan jejak audit ke sistem seperti Loki atau Logstash, sehingga peristiwa portal dapat disimpan jangka panjang, dikorelasikan dengan sumber log lain, dan dianalisis pada perkakas pemantauan keamanan terpusat.

**d. Aksesibilitas dan antarmuka**

Antarmuka portal kini dirancang dengan prioritas peramban desktop, dan tampilan pada ponsel berada di luar cakupan penelitian. Pengembangan yang disarankan menyempurnakan tata letak agar responsif pada beragam perangkat, termasuk ponsel pintar dan tablet, sehingga persetujuan dan pemantauan dapat dilakukan dari mana saja.

Aplikasi bergerak khusus belum tersedia. Pengembangan yang disarankan menyediakan aplikasi bergerak, baik dalam bentuk aplikasi web progresif maupun aplikasi native, yang berfokus pada tugas yang menuntut kesigapan seperti menyetujui permintaan dan menerima peringatan.

Akses konsol langsung belum tersedia dari portal. Pengguna masih harus membuka Proxmox VE untuk mencapai konsol mesin virtual, misalnya ketika jaringan belum siap atau saat memperbaiki kegagalan boot. Pengembangan yang disarankan menyematkan konsol berbasis peramban dengan teknologi seperti noVNC untuk tampilan grafis atau xterm.js untuk terminal, sehingga pengguna memperoleh akses konsol tanpa meninggalkan portal. Fitur ini menutup salah satu alasan terakhir membuka antarmuka hypervisor secara langsung, dan pendekatan berbasis peramban memudahkan dukungan lintas platform hypervisor.

**e. Skala, ketahanan, dan portabilitas**

Prioritas terpenting pada kelompok ini adalah penskalaan lapisan antrean. Saat ini penyedia menjalankan sejumlah pekerja berjumlah tetap yang menarik tugas dari antrean secara berurutan. Model ini bekerja pada beban ringan, namun tidak menyediakan keadilan antar-pengguna. Satu pemohon yang mengirim permintaan batch dapat menahan permintaan pemohon lain di belakang antrean, dan pekerjaan ringan seperti penyiaran pembaruan status dapat mengantre di belakang eksekusi Terraform yang berat. Percobaan batch pada subbab 4.3.11 memperlihatkan penyediaan sepuluh mesin virtual berjalan sebagai sepuluh pekerjaan paralel, sehingga titik jenuh pekerja menjadi nyata ketika permintaan bersamaan bertambah.

Arah penyempurnaannya memakai Laravel Horizon sebagai supervisor antrean. Horizon menggantikan daemon pekerja yang disusun tangan dengan model per-antrean yang menyediakan pemulihan otomatis dan papan pemantauan. Antrean dipisah menjadi jalur penyediaan yang berat dan berbatas serta jalur sistem yang ringan dan elastis, sehingga penyiaran dan sinkronisasi tidak pernah tertahan di belakang eksekusi Terraform. Keadilan antar-pengguna diperoleh melalui *middleware* pembatas konkurensi seperti Redis Funnel, yang membatasi jumlah pekerjaan penyediaan aktif per pengguna, sehingga satu pemohon tidak dapat memonopoli seluruh kolam pekerja.

Penskalaan otomatis melengkapi rancangan ini dengan menambah dan mengurangi pekerja mengikuti panjang antrean, dengan batas atas yang terikat pada kapasitas node Proxmox VE. Batas ini penting karena kendala *throughput* yang sesungguhnya terletak pada operasi cakram node saat kloning penuh berjalan, bukan pada aplikasi. Horizon karena itu tidak membuat penyediaan lebih cepat daripada perangkat kerasnya. Nilainya terletak pada penskalaan yang lebih aman, lebih adil, dan dapat dipantau.

Portal kini terikat pada satu jenis hypervisor, yaitu Proxmox VE. Lapisan abstraksi Terraform membuka peluang penambahan penyedia lain seperti VMware tanpa mengubah antarmuka pengguna. Pengembangan yang disarankan menambahkan dukungan multi-hypervisor agar portal dapat melayani infrastruktur yang beragam.

Isolasi antar-tenant masih dapat diperkuat. Pengembangan yang disarankan memperketat batas multi-tenancy agar organisasi dengan banyak unit dapat berbagi satu portal dengan pemisahan sumber daya dan data yang lebih tegas.

Data mesin virtual yang tidak lagi ada saat ini tetap tersimpan penuh. Pengembangan yang disarankan mengarsipkan atau mempartisi data lama, bukan menghapusnya, agar jejak audit yang bersifat *append-only* tetap utuh sementara tabel aktif tetap ringkas.

### 5.3.2 Saran Penelitian Selanjutnya

Keterbatasan pada subbab 5.2 membuka arah penelitian selanjutnya. Pengujian efisiensi dan kesalahan manusia sebaiknya melibatkan operator selain peneliti, agar angka kesalahan nol pada kelompok manual dapat diuji pada pengguna yang belum pernah mengalami kegagalan, sehingga hasilnya lebih mewakili kondisi lapangan.

Pengujian kebergunaan dapat memakai responden yang lebih banyak dengan komposisi peran yang seimbang, sehingga temuan antar-peran dapat diuji beda secara statistik dan tidak sekadar deskriptif. Penambahan responden juga memperkuat daya uji dan memperkecil ketergantungan pada besar selisih semata.

Pengujian konsistensi dapat diperluas ke banyak parameter di luar disk, seperti jaringan, sistem operasi, dan konfigurasi pasca-penyediaan, agar hasil null pada Hipotesis 2 teruji pada ruang kesalahan yang lebih lebar dan lebih menyerupai kondisi lapangan.

Percobaan batch dapat diulang beberapa kali dengan pengukuran langsung untuk menggantikan ekstrapolasi. Pengukuran berulang pada berbagai ukuran batch sekaligus menyediakan dasar empiris bagi pengujian penskalaan antrean yang disarankan pada subbab 5.3.1, sehingga saran arsitektur tersebut dapat diverifikasi dengan data, bukan sekadar diusulkan.
