# Poin-Poin Slide — Sidang Akhir (Skripsi)

Judul: **Rancang Bangun ExoVirt: Aplikasi Web Self-Service Provisioning Mesin Virtual Berbasis Infrastructure as Code pada Proxmox Virtual Environment**

Cara pakai: tiap "## Slide" = satu slide. Tempel judul + bullet ke PPT. Baris *(Catatan pembicara)* tidak usah ditempel, itu bahan ngomongmu. Baris **[VISUAL]** = petunjuk gambar yang perlu kamu siapkan.

**Target: 12 slide utama + 11 slide cadangan, durasi 20 menit.**

## Prinsip deck ini

**Bab I sampai III sudah lulus di sidang proposal, jadi deck ini tidak mengulangnya.** Hanya satu slide yang menengok ke belakang, yaitu slide 2, dan fungsinya bukan menjelaskan ulang melainkan memasang kontrak: inilah yang saya janjikan, dan sisa presentasi melaporkan hasilnya. Sepuluh slide berikutnya seluruhnya Bab IV dan Bab V.

Slide berfungsi sebagai jangkar, bukan naskah. Kamu yang bicara, slide cukup menahan bukti di layar supaya penguji punya sesuatu untuk dilihat sambil mendengarkanmu.

## Anggaran waktu

| Slide | Isi | Bab | Target | Sifat |
|---:|---|---|---:|---|
| 1 | Cover | — | 15 detik | Lewati cepat |
| 2 | Kontrak penelitian dan yang berubah | I–III | 1,5 menit | **Jangan melar** |
| 3 | Sistem yang jadi dibangun | IV | 2,5 menit | Boleh melar |
| 4 | Alur pakai dan tata kelola | IV | 2,5 menit | Boleh melar |
| 5 | Cara pengujian dan hasil fungsional | IV | 2 menit | Ketat |
| 6 | H1 efisiensi | IV | 2 menit | Ketat |
| 7 | Konteks lapangan tanpa template | IV | 2 menit | Boleh melar |
| 8 | Indikator waktu yang meleset | IV | 2,5 menit | **Wajib tuntas** |
| 9 | H2 konsistensi dan kesalahan manusia | IV | 2 menit | Boleh melar |
| 10 | H3 kebergunaan dan jurang antar-peran | IV | 2,5 menit | **Wajib tuntas** |
| 11 | Capaian indikator dan kesimpulan | IV–V | 1,5 menit | Ketat |
| 12 | Keterbatasan, saran, penutup | V | 1 menit | Cepat |

Sebaran: **1 slide menengok ke Bab I–III, 10 slide untuk Bab IV–V.**

**Peringatan ritme.** Di sidang proposal kamu memakai 30 menit untuk 10 slide, berarti sekitar 3 menit per slide. Dengan ritme itu deck ini mendarat di 36 menit, melewati jatah 20 menit. Latih dengan stopwatch dan patuhi kolom Target.

Semua angka pada berkas ini bersumber dari Bab IV dan Bab V. Jangan mengubahnya di slide.

⚠️ **Periksa dulu sebelum mencetak cover.** Judul terdaftar di prodi masih memakai nama lama ProvIO, sedangkan sistem sudah berganti nama menjadi ExoVirt dan perubahan judul itu belum di-ACC. Pastikan nama pada slide 1 sama persis dengan judul yang terdaftar, atau minta ACC lebih dulu. Penguji menyoroti ketidakcocokan judul sejak menit pertama.

---

## Slide 1 — Cover
- Judul lengkap penelitian
- Nama dan NIM
- Dosen Pembimbing
- Program Studi / Fakultas / Universitas / 2026

**[VISUAL]** Logo ExoVirt (`frontend/public/exovirt-icon.png`) besar di tengah, latar gelap.

*(Catatan pembicara: sebut judul sekali, jangan dibaca ulang, langsung lanjut. 15 detik.)*

---

## Slide 2 — Kontrak Penelitian dan Yang Berubah Sejak Proposal

**Empat rumusan masalah** (disetujui pada sidang proposal)
1. Abstraksi kompleksitas IaC bagi pengguna non-pakar
2. Tata kelola: aman, terkontrol, dapat diaudit
3. Efisiensi, konsistensi konfigurasi, kesalahan manusia
4. Kebergunaan dibanding antarmuka Proxmox VE bawaan

**Enam indikator yang saya kunci di Bab III, sebelum satu pun pengukuran berjalan**

| Indikator | Target | | Indikator | Target |
|---|---|---|---|---|
| Penurunan waktu | ≥ 50 % | | Keberhasilan deployment | 100 % |
| Penurunan langkah | Berkurang | | Kesalahan konfigurasi | ≈ 0 |
| Kesesuaian konfigurasi | 100 % | | Skor SUS | ≥ 68 |

**Yang berubah sejak proposal**: nama sistem, penambahan datacenter kedua, dan cakupan pengujian yang menjadi 40 skenario

*(Catatan pembicara: 1,5 menit, JANGAN MELAR. Slide ini bukan pengulangan Bab I sampai III. Bilang terus terang: "Bab satu sampai tiga sudah saya pertahankan di sidang proposal, jadi saya tidak mengulangnya. Slide ini saya pasang hanya sebagai kontrak, karena sisa presentasi melaporkan capaian terhadap enam indikator ini." Tunjuk tabel indikator, lalu segera lanjut. Kalau ada penguji baru yang tidak hadir di sidang proposal dan meminta konteks, buka slide cadangan B0 dan berikan 2 menit, jangan lebih.)*

---

## Slide 3 — Sistem yang Jadi Dibangun
- Dua datacenter Proxmox, Jakarta dan Lampung, masing-masing lima template termasuk Windows Server 2022
- Sistem berjalan di produksi, bukan di lingkungan uji coba
- Portal memvalidasi permintaan terhadap kebijakan lingkungan, lalu meneruskannya ke antrean persetujuan
- Persetujuan memicu Terraform menjalankan init, plan, apply pada workspace terpisah per mesin virtual
- Pengguna memilih tier, portal menerjemahkannya menjadi berkas variabel Terraform tanpa mengubah definisi utamanya
- Ansible berjalan sebagai aksi terpisah lewat kunci SSH yang Terraform suntikkan, dan pengguna tidak pernah melihat sintaks HCL maupun CLI

**[VISUAL]** Diagram alur satu baris: Portal → Kebijakan → Persetujuan → Terraform → Proxmox → Inventory. Di bawahnya dua kotak bersanding, kiri potongan `main.tf` dengan variabel disorot, kanan tangkapan layar wizard, panah dari kanan ke kiri.

*(Catatan pembicara: 2,5 menit, boleh melar. Bingkai slide ini sebagai HASIL, bukan rancangan. Kalimat pembuka yang tepat: "rancangannya sudah saya paparkan di sidang proposal, jadi sekarang saya tunjukkan apa yang jadi dibangun dan apa yang berjalan". Kalimat jualan yang wajib keluar: "permintaan sepuluh mesin virtual pecah menjadi sepuluh job terpisah, masing-masing dengan workspace Terraform sendiri, sehingga satu VM gagal tidak menyeret sisanya". Kalau penguji menggali soal kode, buka B6.)*

---

## Slide 4 — Alur Pakai dan Tata Kelola
- **RBAC**: peran menentukan lingkungan yang terlihat dan siapa boleh menyetujui
- **Persetujuan**: permintaan pada lingkungan tertentu wajib melewati approver beserta alasan
- **Audit trail**: setiap aksi tercatat append-only lengkap dengan pelaku, objek, dan waktu
- **Kredensial**: kata sandi acak 20 karakter per VM, terenkripsi, hanya pemilik yang boleh membukanya dan pembukaan itu ikut tercatat
- **Siklus hidup**: perubahan sumber daya, penambahan disk, hardening, perpanjangan, dan penghapusan berjalan lewat alur persetujuan yang sama

**[VISUAL]** Empat tangkapan layar bernomor: wizard, halaman approval, progres provisioning, kartu Inventory. Sisipkan satu tangkapan layar Audit Trail di sudut.

*(Catatan pembicara: 2,5 menit, boleh melar. Ini jawaban Rumusan Masalah 2 dan isinya Bab IV subbab 4.7, bukan pengulangan Bab III. Telusuri keempat tangkapan layar berurutan seolah kamu sedang memakai sistemnya. Kalimat kunci: "sistem tidak pernah menyimpan kata sandi dalam bentuk terbaca, dan bahkan tindakan membuka kredensial pun ikut tercatat". Kalau penguji mengizinkan demo langsung, ganti slide ini dengan demo, tetapi tetap siapkan tangkapan layarnya sebagai cadangan bila jaringan bermasalah.)*

---

## Slide 5 — Cara Pengujian dan Hasil Fungsional

| Uji | Objek | Instrumen | Hipotesis |
|---|---|---|---|
| Fungsional | 40 skenario black box | Lembar uji | - |
| Efisiensi | 10 VM manual vs 10 VM portal | Stopwatch + audit trail | H1 |
| Konsistensi | 50 parameter tiap kelompok | Verifikasi tab Hardware | H2 |
| Kebergunaan | 8 responden, dua sistem | Kuesioner SUS | H3 |

- Operator, perangkat keras, node, template, dan tier dikunci sama pada kedua kelompok; pembanding terkunci pada Proxmox VE bawaan sejak Bab II
- Waktu yang diukur mencakup interaksi pengguna dan eksekusi mesin, sedangkan waktu menunggu persetujuan dikeluarkan
- **Pengujian fungsional: 40 skenario black box, keberhasilan 100 %**, termasuk skenario negatif seperti kuota terlampaui, nama duplikat, dan akses lintas pemilik

**[VISUAL]** Sisi kiri tabel empat uji, sisi kanan peta area black box berbentuk kisi dengan centang dan jumlah skenario per area.

*(Catatan pembicara: 2 menit, slide ketat. Slide ini menyatukan cara pengujian dan hasil fungsional supaya deck tetap 12 slide. Buka dengan prosedur: "keempat uji ini prosedur Bab IV, dan variabel kontrolnya dikunci sama pada kedua kelompok". Yang wajib kamu ucapkan: "data VMware dan jurnal Terraform CLI hanya masuk sebagai pembanding deskriptif dan tidak pernah masuk uji statistik". Lalu tutup dengan fungsional 100 %, dan tekankan skenario negatif karena membuktikan pengujian tidak hanya menelusuri jalur bahagia. Rincian variabel kontrol di B2, 40 skenario di B9, pengujian otomatis di B10.)*

---

## Slide 6 — Hipotesis 1: Efisiensi Provisioning
- Jumlah langkah turun dari **23 menjadi 10**, atau **56,52 %**

| Statistik waktu | Portal | Manual |
|---|---:|---:|
| Rata-rata | 98,80 detik | 136,90 detik |
| Simpangan baku | 6,03 detik | 16,35 detik |
| Minimum–Maksimum | 94–110 | 121–175 |

- Mann-Whitney U: **U = 0, p = 1,08 × 10⁻⁵**, sehingga **H1 diterima**
- Kedua kelompok tidak beririsan sama sekali: portal paling lambat 110 detik, manual paling cepat 121 detik

**[VISUAL]** Dot plot 20 titik pada satu sumbu waktu, portal warna aksen di kiri, manual abu di kanan. Pemisahan sempurna terlihat tanpa perlu dijelaskan.

*(Catatan pembicara: 2 menit, slide ketat. Jelaskan U = 0 dengan kalimat awam: tidak ada satu pun nilai portal yang tumpang tindih dengan nilai manual, dan pemisahan sempurna itulah yang membuat U bernilai nol. Sebut juga bahwa data tidak normal sehingga jalurnya non-parametrik, dan pilihan itu ditetapkan berdasarkan bentuk data sebelum melihat hasil. Data mentah ada di B1, definisi langkah di B3, bukti silang stopwatch di B4, dan angka batch di B7.)*

---

## Slide 7 — Konteks Lapangan: Manual Tanpa Template
- Pengujian ini mengunci template yang sama pada **kedua** kelompok, jadi manual **136,90 detik** itu **kondisi terbaik manual**
- Di lapangan, banyak organisasi belum menstandarkan template dan membangun mesin virtual dari *base image*, dari awal
- Pembanding dari pengalaman kerja praktisi di lingkungan VMware, tanpa template: bangun *image* awal **1.110 detik** (18,5 menit), kloning rata-rata **282,56 detik**, tiap kloning masih set hostname dan machine-ID manual
- Angka ini **tidak pernah masuk uji H1**: enam variabel berbeda, hanya pembanding deskriptif
- Membangun dari awal membuka kembali celah inkonsistensi dan kesalahan manusia yang template kita tutup

**[VISUAL]** Tiga batang mendatar pada satu sumbu detik: manual penelitian 136,90 (warna aksen), kloning lapangan 282,56 (abu), *image* awal 1.110 (abu tua). Beri label "tanpa template" pada dua batang kanan.

*(Catatan pembicara: 2 menit, boleh melar. Ini intermezo, BUKAN usaha mengejar 50 %. Bingkai data VMware sebagai pengalaman kerja seorang praktisi, dan JANGAN sebut nama perusahaannya karena narasumber memintanya dirahasiakan. Bingkai: "saya sengaja memakai pembanding yang paling menguntungkan manual, dan angka jujur saya lahir dari kondisi itu". Sebut jelas data VMware tidak pernah masuk uji statistik karena enam variabel berbeda, dan menukar pembanding setelah tahu hasil adalah cacat metodologi. JANGAN mengklaim "template mempercepat 52 %", karena hypervisor dan operatornya berbeda; cukup sajikan angkanya berdampingan dan sebut selisihnya belum diuji sebabnya. Soal update OS, bicarakan kualitatif saja tanpa angka. Kalau penguji bertanya "kenapa pengujian diteruskan kalau manual diuntungkan?", buka B11.)*

---

## Slide 8 — Indikator Waktu Meleset, dan Inilah Sebabnya
- Target 50 %, capaian **27,83 %**
- **88,7 % waktu provisioning portal adalah waktu mesin**, yaitu Terraform bekerja lalu sistem operasi tamu melakukan boot
- Portal berjalan di atas hypervisor yang sama, sehingga kloning penuh 40 GB memakan waktu setara pada kedua jalur
- Yang portal pangkas adalah waktu perhatian manusia: **136,90 detik menjadi 11,20 detik**
- Definisi pengukuran terkunci sebelum kelompok portal diukur, dan tidak diubah setelah hasilnya diketahui

**[VISUAL]** Batang bertumpuk waktu portal: 11,3 % perhatian manusia berwarna aksen, 88,7 % waktu mesin berwarna abu. Beri label langsung pada batangnya.

*(Catatan pembicara: 2,5 menit, WAJIB TUNTAS. Ini slide penentu. Ambil duluan sebelum penguji bertanya. Jangan meminta maaf, jangan menurunkan ambang 50 %, dan jangan menambalnya dengan angka batch. Bedakan hipotesis dari indikator: H1 berbunyi "terdapat perbedaan signifikan" tanpa menyebut besaran dan ujinya menerima, sedangkan angka 50 % merupakan kriteria perancangan yang saya tetapkan sendiri. Tutup dengan kalimat ini: "yang portal tukar adalah puluhan detik orkestrasi dengan persetujuan, jejak audit, dan permukaan kesalahan yang lebih sempit, jadi perbandingannya bukan cepat melawan lambat melainkan cepat melawan jaminan".)*

---

## Slide 9 — Hipotesis 2 dan Kesalahan Manusia
- Konsistensi konfigurasi: manual **100 %**, portal **100 %**, keduanya tanpa penyimpangan
- **Temuan null**, dan hasil ini sudah diramalkan sebelum pengukuran berjalan lalu dicatat pada rencana pengukuran
- Kesalahan konfigurasi: **0 pada kedua kelompok**, tetapi angka nol kelompok manual muncul setelah peneliti mengalami dua insiden dan hafal letak jebakannya
- Insiden pertama: kolom *Size Increment* Proxmox meminta penambahan dalam GiB, bukan ukuran akhir. Nilai 40 pada template 10 GB menghasilkan disk 50 GB
- Tidak ada satu pun tanda kesalahan: kloning berhasil, VM menyala, partisi meluas, VM dapat dimasuki
- Portal menutup kolom itu, sehingga jenis kesalahan tersebut tidak punya tempat untuk muncul

**[VISUAL]** Dua tangkapan layar bersanding: dialog Resize Proxmox dengan kolom Increment dilingkari merah, dan wizard portal yang hanya menampilkan pilihan tier.

*(Catatan pembicara: 2 menit, boleh melar. JANGAN menguji beda pada H2. Simpangan baku kedua kelompok nol, sehingga uji statistik apa pun tidak berlaku, dan memaksakannya justru keliru secara metodologis. Kalau penguji bertanya kenapa tidak diuji, jawab persis begitu. Ceritakan insidennya sebagai cerita, karena inilah bukti paling kuat di seluruh bab: penyimpangan senyap lebih berbahaya daripada kegagalan, sebab kegagalan berteriak sedangkan penyimpangan diam. Keunggulan portal bersandar pada rancangan antarmuka, bukan pada jumlah sampel.)*

---

## Slide 10 — Hipotesis 3 dan Jurang Antar-Peran

**Skor SUS**: Portal **92,19** (Excellent) berbanding Proxmox VE **37,81** (Poor)
*Paired t-test* t(7) = 6,982, p = 0,000215 · *Wilcoxon* W = 0, p = 0,0078 · **H3 diterima**

| Peran | n | Portal | Proxmox VE | Jurang |
|---|---:|---:|---:|---:|
| Pengguna biasa | 5 | 88,00 (A) | **18,50 (F)** | 69,50 |
| Administrator TI | 3 | 99,17 (A) | **70,00 (C)** | 29,17 |
| **Jurang antar-peran** | | **11,17** | **51,50** | |

- Kedelapan responden memberi portal skor lebih tinggi, tanpa satu pun pembalikan arah
- Proxmox VE tidak buruk secara umum. Proxmox VE buruk bagi pengguna non-pakar
- Portal menutup jurang antar-peran dari **51,50 poin menjadi 11,17 poin**

**[VISUAL]** Dua garis penghubung antar-peran: garis Proxmox melebar jauh, garis portal hampir mendatar. Angka 51,50 dan 11,17 besar di ujungnya.

*(Catatan pembicara: 2,5 menit, WAJIB TUNTAS. Ini klimaks presentasi, dan angka inilah yang menjelaskan seluruh alasan penelitian ini ada. Sebutkan bahwa tiga administrator sengaja dimasukkan meski merekalah penilai yang paling tidak menguntungkan portal, sehingga komposisinya konservatif. Sebutkan juga batasnya sendiri: komposisi 5 berbanding 3 terlalu kecil untuk diuji beda, jadi temuan antar-peran ini deskriptif dan kekuatannya terletak pada besar selisih beserta arahnya yang konsisten. Skor per responden ada di B5.)*

---

## Slide 11 — Capaian Indikator dan Kesimpulan

| No | Indikator | Target | Capaian | |
|---:|---|---|---|:---:|
| 1 | Penurunan waktu | ≥ 50 % | 27,83 % | ❌ |
| 2 | Penurunan langkah | Berkurang | 56,52 % | ✅ |
| 3 | Kesesuaian konfigurasi | 100 % | 100 % | ✅ |
| 4 | Keberhasilan deployment | 100 % | 100 % | ✅ |
| 5 | Kesalahan konfigurasi | ≈ 0 | 0 | ✅ |
| 6 | Skor SUS | ≥ 68 | 92,19 | ✅ |

**Lima dari enam indikator tercapai.**

1. **RM1** — Abstraksi berlapis menyembunyikan Terraform dan Ansible. Langkah turun 56,52 %, black box 100 %, pengguna biasa memberi portal 88,00 berbanding 18,50
2. **RM2** — RBAC, persetujuan, audit append-only, dan kredensial terenkripsi per VM
3. **RM3** — H1 diterima, H2 menghasilkan temuan null yang sudah diramalkan, kesalahan manusia ditekan lewat rancangan antarmuka
4. **RM4** — H3 diterima, dan jurang antar-peran menyempit dari 51,50 menjadi 11,17 poin

*(Catatan pembicara: 1,5 menit, slide ketat. Tunjuk baris pertama sendiri, jangan menunggu ditanya, lalu bilang "penyebabnya sudah saya paparkan tadi dan itu saya perlakukan sebagai temuan". Kaitkan balik ke slide 2: keenam target ini saya pasang di awal presentasi, dan inilah hasilnya apa adanya. Untuk empat kesimpulan, satu kalimat per nomor, jangan lebih. Ini slide yang paling sering difoto penguji, jadi biarkan tampil agak lama.)*

---

## Slide 12 — Keterbatasan, Saran, dan Penutup

**Keterbatasan**
- Peneliti menjalankan kedua kelompok pengukuran sekaligus mengembangkan sistem yang diuji
- Angka nol kesalahan pada kelompok manual lahir dari operator yang sudah pernah gagal
- Responden SUS berjumlah 8, dan pemecahan 5 berbanding 3 terlalu kecil untuk diuji beda
- Percobaan batch berjumlah satu, dan pembanding manualnya merupakan ekstrapolasi

**Saran pengembangan**
- Status VM_READY yang menunggu alamat IP muncul, karena status Active menyala rata-rata 5,80 detik lebih awal
- Pengelolaan disk mandiri dan kendali daya dari portal
- Integrasi AD/SSO beserta MFA, dan hardening Windows
- Penskalaan antrean, multi-hypervisor, dan multi-tenancy

**Terima kasih**

**[VISUAL]** Dua kolom, keterbatasan di kiri dan saran di kanan. Logo ExoVirt di bawah.

*(Catatan pembicara: 1 menit, cepat. Bacakan keterbatasan dengan tenang, jangan buru-buru dan jangan defensif, karena menyebut batas sendiri memotong separuh pertanyaan penguji sedangkan diam soal batas justru memancing curiga. Butir VM_READY layak disebut karena lahir dari temuan pengukuranmu sendiri, bukan dari daftar keinginan. Bab V memuat 17 butir saran, dan sisanya simpan untuk tanya jawab. Setelah "terima kasih", berhenti bicara.)*

---

# SLIDE CADANGAN (siapkan, jangan ditampilkan)

Taruh setelah slide 12. Buka hanya bila penguji menggali. Deck utama sengaja ramping, jadi bagian cadangan inilah yang menahan detail.

## B0 — Konteks Bab I sampai III
Latar belakang, beban 120 tiket dalam dua bulan yang ditangani dua administrator, celah penelitian, dan enam tahap DSRM. **Buka HANYA bila ada penguji yang tidak hadir di sidang proposal dan meminta konteks.** Batasi 2 menit, jangan lebih, karena bagian ini sudah dinilai dan bukan objek sidang akhir.

## B1 — Data mentah 10 VM manual dan 10 VM portal
Tabel 4.11 dan Tabel 4.12 lengkap. Kolom `t1` dan `t3` terpisah, rata-rata `t1` = 11,20 detik dan `t3` = 87,60 detik.

## B2 — Variabel kontrol dan ruang lingkup waktu
Daftar variabel yang dikunci, alasan waktu menunggu persetujuan dikeluarkan, dan titik mulai serta titik berhenti pengukuran.

## B3 — Definisi operasional jumlah langkah
Aturan penghitungan langkah, rincian 23 langkah manual berbanding 10 langkah portal.

## B4 — Uji normalitas dan bukti silang stopwatch
Hasil Shapiro-Wilk beserta alasan memilih jalur non-parametrik. Kalimat kunci: memilih uji berdasarkan hasil yang lebih cantik punya nama, yaitu p-hacking, dan penelitian ini menetapkan jalurnya berdasarkan bentuk data sebelum melihat hasil. Tambahkan Tabel 4.13: nilai `t3` selalu melampaui durasi Terraform dengan selisih 2 sampai 10 detik, sehingga stopwatch di tanganmu dan `created_at` di basis data saling mengunci.

## B5 — Skor SUS per responden
Tabel 4.25 lengkap R1 sampai R8 beserta selisih tiap orang. Siapkan juga alasan n = 8: Wilcoxon dua sisi pada n = 5 tidak dapat mencapai p di bawah 0,05, karena hasil paling ekstrem sekalipun hanya menghasilkan p = 0,0625.

## B6 — Peta kode
Ambil dari `presentation/peta-kode.md`. Siapkan satu alur untuk ditelusuri langsung: wizard → route → controller → service → job → Terraform runner → event real-time.

## B7 — Provisioning batch
Portal 10 langkah dan 333 detik untuk 10 VM, manual 230 langkah dan 1.369 detik hasil ekstrapolasi. Selisih langkah menjadi 95,65 %. Sebut jelas bahwa ini perbedaan kemampuan, bukan perbedaan efisiensi, dan tidak dipakai untuk mengklaim indikator waktu.

## B8 — Arsitektur antrean dan isolasi kegagalan
Satu permintaan N VM pecah menjadi N job, masing-masing dengan workspace Terraform sendiri. Horizon masuk saran pengembangan.

## B9 — Rincian 40 skenario black box
Peta area pengujian beserta skenario negatif: permintaan melebihi kuota, nama duplikat, akses lintas pemilik.

## B10 — Cakupan pengujian otomatis
Jumlah dan cakupan test yang berjalan lewat `php artisan test`.

## B11 — Kenapa pengujian tetap dijalankan meski kondisinya menguntungkan manual
Jawaban untuk pertanyaan "kalau garis dasar manual diuntungkan pada waktu, kenapa tidak ganti pembanding atau berhenti saja?". Empat poin, sampaikan berurutan:

- **Justru itu yang membuat hasilnya sah.** Saya sengaja memilih perbandingan yang paling menguntungkan manual: template sama, hypervisor sama, dan operator yang menguasai Proxmox. Kemenangan di bawah kondisi yang memihak lawan tidak bisa dituduh memilih data. Kemenangan di bawah kondisi yang memihak saya bisa.
- **Waktu hanya satu dari enam indikator, dan bukan inti penelitian.** Rumusan masalah menyoal abstraksi, tata kelola, dan kebergunaan bagi pengguna non-pakar. Mengalah pada waktu terbaik manual sekalipun, portal tetap unggul telak pada langkah (56,52 %), tata kelola (manual nol persetujuan dan nol jejak), permukaan kesalahan (tertutup oleh rancangan antarmuka), kebergunaan (92,19 lawan 37,81), serta konsistensi dan deployment (100 %).
- **Berhenti atau menukar pembanding karena meramal hasil kurang bagus adalah desain yang digerakkan hasil.** Itu sekategori dengan p-hacking. Prosedur ilmiah mengunci definisi, mengukur, lalu melaporkan apa adanya.
- **Angka 27,83 % yang jujur pada kondisi sulit lebih bernilai daripada angka besar yang saya atur nyaman.**

---

# CATATAN DESAIN

## Ketentuan dasar
| Elemen | Ketentuan |
|---|---|
| Rasio | 16:9 |
| Latar | Gelap, mengikuti UI ExoVirt |
| Font | Inter atau Poppins |
| Ukuran | Judul 40pt, isi 24pt, angka hero 90pt |
| Warna | Satu warna aksen untuk hasil portal, abu untuk pembanding manual. Cukup dua warna |
| Batas teks | Maksimal 8 baris per slide |
| Logo | `frontend/public/exovirt-icon.png` di pojok kanan bawah tiap slide |

## Aturan visual untuk deck ramping
Deck 12 slide menuntut tiap slide menahan perhatian dua sampai tiga menit. Isinya bertambah, tetapi kata-katanya tidak boleh bertambah.

- **Naikkan bobot visual, bukan bobot teks.** Slide 6, 7, 8, dan 10 masing-masing wajib punya satu grafik, yaitu dot plot 20 titik, tiga batang pembanding lapangan, batang bertumpuk waktu mesin, dan garis jurang antar-peran. Grafik itulah yang menahan mata penguji selama kamu bicara
- Angka hasil tampil besar, keterangan kecil di bawahnya. Jangan menenggelamkan angka di dalam kalimat
- Bagi slide padat menjadi dua kolom, misalnya slide 2, 9, dan 12. Mata membaca dua kolom lebih cepat daripada satu daftar panjang
- Pakai tangkapan layar portal asli, bukan mockup. Beri bingkai tipis dan potong sidebar yang tidak relevan
- Batang untuk perbandingan SUS, dot plot untuk 20 titik waktu, dan jangan memakai pie chart
- Tabel maksimal 6 baris. Tabel penuh masuk slide cadangan
- Merah hanya untuk baris indikator yang meleset dan kolom Increment pada slide 9. Jangan menebar merah

## Yang perlu dihindari
- **Mengulang Bab I sampai III.** Materi itu sudah lulus di sidang proposal, dan mengulangnya memakan menit yang dibutuhkan Bab IV
- Membaca slide kata per kata, karena slide ini jangkar dan bukan naskah
- Animasi masuk per bullet, karena memakan waktu dan mengesankan mengulur
- Menempelkan potongan kode panjang di slide utama, sebab tempatnya di slide cadangan
- Menaruh dua grafik dalam satu slide

## Persiapan sebelum hari sidang
1. **Pastikan judul pada cover sama dengan judul terdaftar di prodi.** Perubahan nama ProvIO menjadi ExoVirt belum di-ACC, jadi selesaikan ini lebih dulu
2. **Latih dengan stopwatch dan catat waktu per slide.** Ritmemu di sidang proposal mencapai 3 menit per slide, sedangkan deck ini menuntut rata-rata 100 detik
3. Latih slide 8 dan slide 10 sampai lancar tanpa membaca, karena keduanya menentukan kesan akhir
4. Kalau latihan tembus 25 menit, potong dari slide 3 dan 4 lebih dulu, lalu ringkas slide 7 jadi satu menit. Jangan sekali-kali memotong slide 8 atau 10
5. Siapkan tangkapan layar cadangan bila demo langsung gagal
6. Buka `presentation/peta-kode.md` §6 untuk latihan tanya jawab bedah kode
7. Baca ulang `presentation/statistik-bab4-untuk-sidang.md` supaya penjelasan Mann-Whitney dan Wilcoxon keluar tanpa ragu
