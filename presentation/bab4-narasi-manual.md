# BAB IV — Narasi Kelompok Manual (siap salin ke Word)

> **Cara pakai berkas ini.**
> Setiap tempat penyisipan gambar ditandai blok 📸 yang berisi: gambar mana yang dipasang, dan caption yang sudah jadi. Salin narasinya, tempel gambarnya, hapus blok penandanya.
> **Penomoran** gambar dan tabel di sini dimulai dari 4.1 supaya rapi dibaca. Setelah digabung dengan 4.1 Hasil Implementasi dan 4.2 Black Box, sesuaikan nomornya.
> **Bagian yang menunggu data portal** ditandai ⏳. Jangan diisi sampai pengukuran arm portal selesai.

---

## 4.3 Efisiensi Provisioning (Hipotesis 1)

### 4.3.1 Lingkungan Pengujian

Pengujian efisiensi dijalankan pada satu node Proxmox VE bernama `pve` dengan versi 9.1.11. Mesin virtual uji dibangun dari template `rhel10-cloud` (VMID 9003), salah satu dari lima *golden image* yang tersedia pada lingkungan penelitian. Penyimpanan yang tersedia meliputi `local`, `local-lvm`, dan `vmdata`.

**Tabel 4.1 Lingkungan pengujian efisiensi**

| Komponen | Spesifikasi |
|---|---|
| Platform virtualisasi | Proxmox VE 9.1.11 |
| Node | `pve` |
| Template | `rhel10-cloud` (VMID 9003) |
| Datastore | `local`, `local-lvm`, `vmdata` |
| Tier | Bronze (1 vCPU, 2 GB RAM, 40 GB disk) |
| Mesin virtual uji | `manual-1` sampai `manual-10` (VMID 101–110) |
| Spesifikasi host | *(isi dari pve → Summary)* |

### 4.3.2 Variabel Kontrol

Kedua kelompok pengujian memakai template, tier, mode kloning, dan konfigurasi jaringan yang sama. Penyamaan ini menutup kemungkinan perbedaan waktu berasal dari sumber lain di luar antarmuka yang dibandingkan.

Template `rhel10-cloud` sudah disetel ke spesifikasi tier Bronze sejak awal, sehingga prosedur manual tidak memerlukan langkah pengaturan CPU maupun RAM. Kondisi ini merupakan keputusan desain eksperimen, bukan kelalaian pengukuran, dan konsekuensinya dibahas pada subbab 4.4.

Mode kloning dikunci pada Full Clone karena portal menetapkan `full_clone = true` pada berkas `main.tf`. Link Clone hanya membuat lapisan pembeda sehingga selesai nyaris seketika, dan memakainya pada kelompok manual berarti mengadu jalan pintas melawan salinan penuh.

**Tabel 4.2 Variabel kontrol pengujian**

| Variabel | Nilai | Alasan penguncian |
|---|---|---|
| Template | `rhel10-cloud` (10 GB) | Sama di kedua kelompok |
| Tier | Bronze (1 vCPU / 2 GB / 40 GB) | Spesifikasi keluaran identik |
| Mode kloning | Full Clone | Portal memakai `full_clone = true` |
| Alamat IP | DHCP | Sesuai cloud-init VM buatan portal |
| Upgrade packages | Nonaktif | VM buatan portal keluar dalam keadaan nonaktif |
| Node, jaringan, datastore | Sama | Menghilangkan variasi infrastruktur |

> 📸 **[TEMPEL — Gambar 4.1]**
> Screenshot: **Settings → Tier** pada portal, memperlihatkan Bronze = 1 vCPU / 2 GB / 40 GB.
> Caption: **Gambar 4.1** Spesifikasi tier Bronze pada portal ExoVirt

> 📸 **[TEMPEL — Gambar 4.2]**
> Screenshot: **tab Hardware template `rhel10-cloud` (VMID 9003)**.
> Caption: **Gambar 4.2** Konfigurasi template `rhel10-cloud` sebagai baseline pengujian

### 4.3.3 Ruang Lingkup Waktu yang Diuji

Hipotesis 1 membandingkan antarmuka aplikasi dengan antarmuka Proxmox VE bawaan. Yang masuk uji beda karena itu hanya waktu yang ditimbulkan oleh alat, bukan waktu keputusan manusia. Waktu provisioning pada portal dipecah menjadi tiga segmen.

**Tabel 4.3 Segmen waktu provisioning**

| Segmen | Portal | Manual | Masuk uji H1 |
|---|---|---|:---:|
| `t1` interaksi pengguna | wizard terbuka sampai Submit | tercakup dalam `t_manual` | Ya |
| `t2` tunggu persetujuan | Submit sampai Approve | mengendap di administrator | **Tidak** |
| `t3` eksekusi otomatis | Approve sampai status Active | tercakup dalam `t_manual` | Ya |

Angka yang diuji pada kelompok portal adalah `t1 + t3`. Segmen `t2` dikeluarkan dan dilaporkan terpisah pada subbab 4.6 sebagai karakteristik tata kelola.

Tiga alasan mendasari pengeluaran `t2`. Pertama, persetujuan sudah ada pada alur manual dalam bentuk tiket atau surat elektronik kepada administrator, hanya saja informal dan tidak terekam. Portal memformalkan langkah itu, tidak menambahkannya. Kedua, lama persetujuan bergantung pada kapan penyetuju membuka portal, sehingga mengukur kesigapan orang, bukan mutu sistem. Ketiga, pengeluaran ini menguntungkan kelompok manual. Waktu tunggu manual yang sesungguhnya berjalan dalam hitungan jam sampai hari, sebagaimana terlihat pada beban 120 tiket dalam dua bulan yang ditangani dua administrator, sedangkan rentang 5 sampai 20 menit pada Bab I merupakan waktu kerja administrator, bukan waktu tunggu pengguna.

Penugasan aktor pada kedua kelompok memang tidak simetris. Kelompok portal dijalankan pengguna biasa, kelompok manual dijalankan administrator berhak penuh. Asimetri ini disengaja dan menempatkan kelompok manual pada kondisi terbaiknya, sebab pengguna tanpa hak administrator tidak dapat melakukan provisioning manual sama sekali.

### 4.3.4 Definisi Operasional Jumlah Langkah

Tabel 3.4 menyebut indikator "jumlah langkah yang dilakukan" tanpa mendefinisikannya. Penelitian ini memakai definisi berikut: satu langkah adalah satu aksi wajib pengguna yang memberi masukan, membuat keputusan, atau memajukan proses.

Yang dihitung sebagai satu langkah: mengisi satu field (mengetik `manual-01` dihitung 1, bukan 9 ketukan), memilih satu opsi dropdown atau checkbox, klik kanan lalu memilih menu, menekan tombol eksekusi seperti OK atau Clone atau Start, dan klik navigasi wajib seperti pindah tab atau menekan tombol Edit.

Yang tidak dihitung: proses masuk, menggulir layar, menempatkan kursor, menutup popup, menunggu pemuatan, dan membaca halaman verifikasi.

Definisi ini berlaku sama pada kedua kelompok.

### 4.3.5 Prosedur Kelompok Manual

Prosedur manual terdiri atas 23 langkah, dihitung sejak klik kanan pada template sampai penekanan tombol Start.

**Tabel 4.4 Rincian langkah provisioning manual melalui Proxmox VE GUI**

| No | Aksi |
|---:|---|
| 1 | Klik kanan template, pilih Clone (**stopwatch mulai**) |
| 2 | Mengisi Name |
| 3 | Memilih Mode = Full Clone |
| 4 | Menekan tombol Clone |
| 5 | Membuka tab Cloud-Init |
| 6 | Menekan Edit pada User |
| 7 | Mengisi username |
| 8 | Menekan OK |
| 9 | Menekan Edit pada Password |
| 10 | Mengisi password |
| 11 | Menekan OK |
| 12 | Menekan Edit pada Upgrade packages |
| 13 | Menonaktifkan Upgrade packages |
| 14 | Menekan OK |
| 15 | Menekan Edit pada IP Config |
| 16 | Memilih DHCP |
| 17 | Menekan OK |
| 18 | Membuka tab Hardware |
| 19 | Memilih Hard Disk, membuka Disk Action |
| 20 | Menekan Resize |
| 21 | Mengisi increment = 30 |
| 22 | Menekan Resize disk |
| 23 | Menekan Start (**stopwatch berhenti saat IP muncul**) |

Proses masuk ke Proxmox VE tidak dihitung, baik waktunya maupun langkahnya, karena merupakan autentikasi dan bentuknya sama pada kedua kelompok. Kelompok portal juga dimulai setelah proses masuk, yaitu saat wizard terbuka.

Titik berhenti ditetapkan pada saat alamat IP muncul. Titik ini setara dengan status `Active` pada portal, yaitu ketika Terraform selesai dan alamat IP sudah diketahui. Pada kedua kelompok, titik berhenti bermakna sama: mesin virtual siap dipakai.

Penggantian kata sandi paksa, uji masuk melalui Putty, dan pengungkapan kata sandi berada di luar jendela pengukuran. Ketiganya merupakan perilaku template `sysuser` yang terjadi identik pada kedua kelompok dan terukur sekitar 45 detik pada pengukuran pendahuluan. Memasukkannya hanya ke satu kelompok akan membebani kelompok tersebut dengan pekerjaan yang tidak dibebankan kepada kelompok pembanding.

Nonaktifnya Upgrade packages pada langkah 12 sampai 14 mengikuti keluaran portal. Mesin virtual buatan portal keluar dengan opsi tersebut nonaktif, sedangkan hasil kloning manual datang dengan opsi aktif, sehingga kelompok manual memerlukan tiga klik tambahan untuk menyamainya. Membiarkannya aktif akan menjalankan `dnf upgrade` pada boot pertama, membuat waktu bergantung pada kondisi jaringan dan menghasilkan susunan paket yang berbeda dari mesin virtual buatan portal.

> 📸 **[TEMPEL — Gambar 4.3]**
> Screenshot: **dialog Clone** (memperlihatkan field Name dan Mode = Full Clone).
> Caption: **Gambar 4.3** Dialog Clone pada Proxmox VE

> 📸 **[TEMPEL — Gambar 4.4]**
> Screenshot: **tab Cloud-Init** `manual-10` (user, Upgrade packages nonaktif, IP DHCP).
> Caption: **Gambar 4.4** Konfigurasi Cloud-Init pada mesin virtual kelompok manual

> 📸 **[TEMPEL — Gambar 4.5]**
> Screenshot: **dialog Resize** dengan label **Size Increment (GiB)** terbaca jelas.
> Caption: **Gambar 4.5** Dialog Resize pada Proxmox VE dengan label Size Increment (GiB)

### 4.3.6 Hasil Pengukuran Kelompok Manual

Sepuluh percobaan dijalankan berurutan oleh operator yang sama dengan variabel kontrol pada Tabel 4.2. Seluruh percobaan mengikuti 23 langkah pada Tabel 4.4 tanpa penyimpangan.

**Tabel 4.5 Hasil pengukuran provisioning manual**

| Percobaan | Mesin virtual (VMID) | Jumlah langkah | `t_manual` (detik) | Disk hasil verifikasi |
|---:|---|---:|---:|:---:|
| 1 | manual-1 (101) | 23 | 175 | 40 GB |
| 2 | manual-2 (102) | 23 | 146 | 40 GB |
| 3 | manual-3 (103) | 23 | 138 | 40 GB |
| 4 | manual-4 (104) | 23 | 150 | 40 GB |
| 5 | manual-5 (105) | 23 | 130 | 40 GB |
| 6 | manual-6 (106) | 23 | 129 | 40 GB |
| 7 | manual-7 (107) | 23 | 128 | 40 GB |
| 8 | manual-8 (108) | 23 | 121 | 40 GB |
| 9 | manual-9 (109) | 23 | 123 | 40 GB |
| 10 | manual-10 (110) | 23 | 129 | 40 GB |
| **Rata-rata** | | **23** | **136,90** | **10/10 sesuai** |

**Tabel 4.6 Statistik deskriptif `t_manual`**

| Statistik | Nilai |
|---|---:|
| n | 10 |
| Rata-rata | 136,90 detik |
| Median | 129,50 detik |
| Simpangan baku | 16,35 detik |
| Koefisien variasi | 11,94 % |
| Minimum | 121 detik |
| Maksimum | 175 detik |
| Kuartil 1 / Kuartil 3 | 128,25 / 144,00 |

Jumlah langkah bernilai tetap 23 pada seluruh percobaan sehingga simpangan bakunya nol. Angka ini dilaporkan sebagai hitungan prosedur, bukan sebagai variabel yang diuji beda.

> 📸 **[TEMPEL — Gambar 4.6]**
> Screenshot: **Summary** salah satu VM manual (memperlihatkan IP dan status berjalan).
> Caption: **Gambar 4.6** Status mesin virtual kelompok manual setelah provisioning

### 4.3.7 Uji Normalitas Kelompok Manual

Uji Shapiro-Wilk terhadap `t_manual` menghasilkan W = 0,837 dengan p = 0,041. Nilai p berada di bawah 0,05 sehingga sebaran data menyimpang dari normal. Uji beda Hipotesis 1 karena itu memakai jalur non-parametrik, yaitu **uji Mann-Whitney U**, sesuai rancangan pada subbab 3.3.5 yang sudah menyiapkan alternatif non-parametrik. Kelompok portal dan kelompok manual merupakan dua kelompok yang saling bebas, sehingga uji berpasangan tidak berlaku di sini.

> 📸 **[TEMPEL — Gambar 4.7]**
> Screenshot: **output SPSS/Jamovi** uji Shapiro-Wilk.
> Caption: **Gambar 4.7** Hasil uji normalitas Shapiro-Wilk pada kelompok manual
> *(Catatan: angka W dan p di atas berasal dari perhitungan pendahuluan. Jalankan ulang di SPSS atau Jamovi dan pakai angka dari sana.)*

### 4.3.8 Efek Belajar pada Kelompok Manual

Waktu percobaan menurun seiring pengulangan. Korelasi Spearman antara urutan percobaan dan waktu bernilai −0,857 dengan p = 0,0015, dan garis regresi menunjukkan penurunan 4,41 detik setiap percobaan.

**Tabel 4.7 Efek belajar kelompok manual**

| Ukuran | Nilai |
|---|---:|
| Korelasi Spearman (urutan terhadap waktu) | −0,857 (p = 0,0015) |
| Kemiringan regresi | −4,41 detik per percobaan |
| Rata-rata percobaan 1–5 | 147,80 detik |
| Rata-rata percobaan 6–10 | 126,00 detik |
| Percobaan 1 dibanding percobaan 10 | 175 detik menjadi 129 detik (turun 26,3 %) |

Waktu mendatar pada kisaran 121 sampai 130 detik sejak percobaan kelima, menandakan operator sudah mencapai kondisi mantap. Sepuluh data tetap dipakai seluruhnya. Percobaan pertama memang terhitung *outlier* ringan menurut pagar Tukey pada 167,6 detik, dan membuangnya akan membuat sebaran menjadi normal. Percobaan tersebut merupakan pengukuran yang sah: prosedurnya benar, hasil disknya benar, dan satu-satunya pembedanya adalah operator belum hafal alur. Membuang data setelah mengetahui hasilnya, demi memenuhi syarat uji parametrik, akan mencederai keabsahan pengujian.

Temuan ini memperkuat kedudukan angka 136,90 detik sebagai kondisi terbaik kelompok manual. Angka tersebut dihasilkan administrator berhak penuh yang sekaligus merupakan pengembang sistem, setelah sepuluh kali pengulangan. Operator yang baru pertama kali menjalankan prosedur membutuhkan 175 detik.

⏳ *Hasil uji beda Mann-Whitney U ditulis setelah pengukuran kelompok portal selesai.*

---

## 4.4 Konsistensi Konfigurasi (Hipotesis 2)

### 4.4.1 Spesifikasi Acuan

Kesesuaian konfigurasi dinilai terhadap spesifikasi tier Bronze yang berlaku pada portal, yaitu 1 vCPU, 2 GB memori, dan 40 GB disk, ditambah alamat IP dari DHCP dan nama host yang mengikuti nama mesin virtual. Lima parameter tersebut diperiksa pada setiap mesin virtual.

Status *hardening* tidak dimasukkan sebagai parameter. Berkas `ProvisionVmJob.php` menetapkan bahwa hardening bukan pilihan saat provisioning melainkan aksi Inventory tersendiri, sehingga mesin virtual baru lahir dengan status `Not Hardened`. Pada titik pengukuran, mesin virtual dari kedua kelompok sama-sama belum melalui proses hardening.

### 4.4.2 Hasil Kelompok Manual

**Tabel 4.8 Kesesuaian konfigurasi mesin virtual kelompok manual**

| Mesin virtual (VMID) | CPU | RAM | Disk | IP | Hostname | Sesuai |
|---|:---:|:---:|:---:|---|:---:|:---:|
| manual-1 (101) | ✓ | ✓ | ✓ | 192.168.200.82 | ✓ | Ya |
| manual-2 (102) | ✓ | ✓ | ✓ | 192.168.200.84 | ✓ | Ya |
| manual-3 (103) | ✓ | ✓ | ✓ | 192.168.200.85 | ✓ | Ya |
| manual-4 (104) | ✓ | ✓ | ✓ | 192.168.200.86 | ✓ | Ya |
| manual-5 (105) | ✓ | ✓ | ✓ | 192.168.200.87 | ✓ | Ya |
| manual-6 (106) | ✓ | ✓ | ✓ | 192.168.200.88 | ✓ | Ya |
| manual-7 (107) | ✓ | ✓ | ✓ | 192.168.200.89 | ✓ | Ya |
| manual-8 (108) | ✓ | ✓ | ✓ | 192.168.200.90 | ✓ | Ya |
| manual-9 (109) | ✓ | ✓ | ✓ | 192.168.200.91 | ✓ | Ya |
| manual-10 (110) | ✓ | ✓ | ✓ | 192.168.200.92 | ✓ | Ya |
| **Kesesuaian** | 100% | 100% | 100% | 100% | 100% | **100%** |

Seluruh 50 parameter pada 10 mesin virtual sesuai spesifikasi.

Pemeriksaan diperluas sampai ke dalam sistem operasi tamu untuk memastikan disk 40 GB benar-benar terpakai. Perintah `df -h` pada `manual-9` menunjukkan `/dev/sda3` berukuran 40 GB terpasang pada `/`, dan `lsblk` menegaskan `sda` 40 GB dengan partisi `sda3` sebesar 39,8 GB. Perintah `hostname` mengembalikan `manual-9`.

Pemeriksaan ini perlu karena tab Hardware hanya membuktikan ukuran disk virtual. Seandainya perluasan partisi oleh cloud-init gagal, disk akan tercatat 40 GB sementara partisi akar tetap 10 GB, dan mesin virtual tetap menyala tanpa menampilkan pesan kesalahan apa pun.

> 📸 **[TEMPEL — Gambar 4.8]**
> Screenshot: **tab Hardware** salah satu VM manual (CPU, RAM, disk 40 GB).
> Caption: **Gambar 4.8** Konfigurasi perangkat keras mesin virtual kelompok manual
> *(Sembilan screenshot Hardware lainnya dapat diletakkan pada Lampiran.)*

> 📸 **[TEMPEL — Gambar 4.9]**
> Screenshot: **console `manual-9`** berisi `df -h`, `lsblk`, dan `hostname`.
> Caption: **Gambar 4.9** Verifikasi perluasan partisi dan nama host dari dalam sistem operasi tamu

### 4.4.3 Catatan Ruang Lingkup

Nama host yang mengikuti nama mesin virtual dan perluasan partisi otomatis merupakan pekerjaan template dan cloud-init. Keduanya terjadi identik pada kelompok manual maupun portal, sehingga tidak dihitung sebagai keunggulan portal.

Penyamaan template ke spesifikasi Bronze membuat kelompok manual mewarisi CPU, RAM, dan jaringan tanpa satu pun langkah pengisian tangan. Satu-satunya parameter yang masih terbuka terhadap kesalahan pengisian pada kelompok manual adalah disk, karena hanya di situ operator memasukkan angka. Rancangan pengujian ini karena itu mempersempit ruang munculnya perbedaan konsistensi, dan hal tersebut perlu diperhitungkan saat membaca hasilnya.

⏳ *Hasil kelompok portal dan uji bedanya ditulis setelah pengukuran kelompok portal selesai.*

---

## 4.4b Kesalahan Manusia (Variabel 3)

Tabel 3.4 mencantumkan kesalahan konfigurasi selama proses provisioning sebagai variabel ketiga dengan indikator jumlah kesalahan per proses dan instrumen berupa lembar observasi. Variabel ini tidak memiliki hipotesis dan dilaporkan secara deskriptif untuk menjawab Rumusan Masalah 3.

Satu kesalahan didefinisikan sebagai satu parameter hasil yang menyimpang dari spesifikasi meskipun prosesnya berhasil. Definisi ini memisahkan dua hal yang kerap tertukar. Operasi gagal berarti prosesnya berhenti: kloning error, atau mesin virtual menolak menyala. Kesalahan manusia berarti prosesnya berhasil, mesin virtual menyala normal, tetapi hasilnya salah. Yang dihitung di sini hanya jenis kedua.

### 4.4b.1 Hasil Pengukuran

Sepuluh percobaan pada seri RHEL tidak menghasilkan penyimpangan. Seluruh 50 parameter sesuai spesifikasi, sebagaimana Tabel 4.8. Jumlah kesalahan terukur adalah nol.

Angka nol ini menuntut satu catatan keterbatasan. Kesepuluh percobaan dijalankan setelah peneliti mengalami dua insiden yang diuraikan di bawah, sehingga peneliti sudah mengetahui persis letak jebakannya. Operator yang belum pernah mengalami kesalahan serupa tidak berada pada kondisi yang sama. Angka nol karena itu tidak membuktikan bahwa prosedur manual aman, melainkan menunjukkan bahwa prosedur manual dapat berjalan aman apabila operatornya sudah pernah gagal dan mengingat pelajarannya. Kondisi tersebut tidak dapat diasumsikan berlaku pada organisasi dengan beban 120 tiket dalam dua bulan yang ditangani dua administrator.

### 4.4b.2 Insiden Pertama: Salah Membaca Satuan Kolom

Peneliti, yang merupakan pengembang sistem dan sudah terbiasa dengan Proxmox VE, tetap melakukan kesalahan pada percobaan manual pertama. Dialog Disk Action → Resize meminta Size Increment dalam GiB, bukan ukuran akhir. Nilai 40 dimasukkan dengan maksud menjadikan disk berukuran 40 GB, padahal template berukuran 10 GB, sehingga hasilnya menjadi 50 GB dan menyimpang 10 GB dari spesifikasi tier Bronze.

Tidak ada satu pun tanda kesalahan. Kloning berhasil, mesin virtual menyala normal, partisi meluas otomatis, nama host terisi benar, dan mesin virtual dapat dimasuki. Penyimpangan baru diketahui setelah tab Hardware dibuka dan angkanya dicocokkan secara manual. Percobaan dibatalkan lalu diulang dengan increment 30.

### 4.4b.3 Insiden Kedua: Salah Sasaran

Pada hari yang sama, peneliti bermaksud memperbesar disk mesin virtual hasil kloning, namun yang terpilih adalah templatenya. Nilai increment 30 GB masuk ke template, sehingga disk template Rocky berubah permanen dari 10 GB menjadi 40 GB. Proxmox VE tidak menampilkan konfirmasi, peringatan, maupun pembeda yang menonjol antara template dan mesin virtual biasa pada operasi tersebut.

Radius kerusakan insiden kedua jauh lebih luas. Insiden pertama merusak satu mesin virtual, sedangkan insiden kedua merusak artefak bersama, sehingga setiap mesin virtual yang lahir dari template itu ikut membawa penyimpangannya tanpa batas waktu. Kesalahan tersebut juga tidak dapat dibatalkan. Proxmox VE tidak menyediakan operasi pengecilan disk, perintah `qm resize` menolaknya, dan pengecilan pada lapisan penyimpanan memotong blok data sehingga merusak citra template. Pemulihan menuntut pembangunan ulang template beserta proses `virt-customize` untuk akun `sysuser`, akun `sysadmin`, dan kunci otomasi yang tertanam di dalam disknya.

Seri pengukuran yang memakai template Rocky dibatalkan seluruhnya, lalu pengukuran diulang dari awal memakai template RHEL. Kedua insiden ini tidak dijumlahkan ke dalam angka kesalahan seri RHEL, karena seri Rocky bukan bagian dari sepuluh percobaan yang dilaporkan.

> 📸 **[TEMPEL — Gambar 4.10]**
> Screenshot: **tab Hardware template Rocky** memperlihatkan disk 40 GB.
> Caption: **Gambar 4.10** Disk template Rocky setelah perubahan permanen akibat salah sasaran

### 4.4b.4 Sifat Penyimpangan yang Senyap

Kedua insiden memiliki pola yang sama. Mesin virtual tidak memprotes, layar tidak menampilkan kesalahan, dan berkas log tidak mencatat apa pun. Penyimpangan hanya diketahui bila seseorang membuka tab Hardware lalu mencocokkan angkanya satu per satu. Pada organisasi yang menangani 120 tiket dalam dua bulan dengan dua administrator, pemeriksaan semacam itu tidak terjadi.

### 4.4b.5 Perbandingan Permukaan Kesalahan

Argumen yang paling kuat pada bagian ini bersandar pada rancangan antarmuka, bukan pada jumlah sampel.

Prosedur manual menyediakan kolom yang dapat terisi salah. Nilai increment disk dihitung sendiri oleh operator melalui pengurangan 40 dikurangi 10, dan Proxmox VE tidak memvalidasi hasilnya terhadap standar apa pun karena Proxmox VE tidak mengetahui standar organisasi. Portal tidak menyediakan kolom tersebut. Pengguna memilih tier, lalu Terraform menuliskan angka 40 GB. Kolom yang tidak ada tidak dapat diisi salah.

Insiden kedua memperlihatkan lapisan berikutnya. Kesalahan tersebut tidak mungkin dilakukan pengguna portal, bukan karena pengguna portal lebih berhati-hati, melainkan karena portal tidak menyediakan jalan menuju template. Antarmuka layanan mandiri hanya memaparkan pilihan tier, sedangkan template dikelola administrator dan tidak pernah tersentuh alur permintaan.

Batas kejujuran argumen ini perlu dinyatakan. Portal mempersempit permukaan kesalahan, tidak menghapusnya. Pengguna portal masih dapat memilih tier atau template yang keliru. Perbedaannya terletak pada visibilitas: pilihan tier yang keliru tampak pada halaman Review sebelum Submit, sedangkan nilai increment yang keliru tidak tampak di mana pun.

> 📸 **[TEMPEL — Gambar 4.11]**
> Screenshot: **wizard portal**, memperlihatkan pengguna hanya memilih tier dan tidak memiliki akses ke template.
> Caption: **Gambar 4.11** Wizard permintaan pada portal tanpa jalur menuju template
> *(Ambil saat pengukuran kelompok portal.)*

---

## Daftar Penempatan Gambar

| Gambar | Isi | Sumber screenshot | Status |
|---|---|---|:---:|
| 4.1 | Spesifikasi tier Bronze | Settings → Tier | ✅ ada |
| 4.2 | Template `rhel10-cloud` | Hardware template RHEL | ✅ ada |
| 4.3 | Dialog Clone | dialog Clone manual-10 | ✅ ada |
| 4.4 | Konfigurasi Cloud-Init | tab Cloud-Init manual-10 | ✅ ada |
| 4.5 | Dialog Resize (Size Increment) | dialog Resize manual-10 | ✅ ada |
| 4.6 | Status VM setelah provisioning | Summary VM manual | ✅ ada |
| 4.7 | Output Shapiro-Wilk | SPSS/Jamovi | ⬜ belum |
| 4.8 | Hardware VM manual | tab Hardware manual-1..10 | ✅ ada |
| 4.9 | `df -h`, `lsblk`, `hostname` | console manual-9 | ✅ ada |
| 4.10 | Disk template Rocky 40 GB | Hardware template Rocky | ✅ ada |
| 4.11 | Wizard portal tanpa jalur template | portal | ⬜ saat arm portal |
