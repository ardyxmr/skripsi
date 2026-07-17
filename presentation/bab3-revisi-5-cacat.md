# Revisi Bab III: 5 Cacat (a, b, d, e, f)

Berkas ini memuat perubahan **sebelum → sesudah** untuk disalin langsung ke Word. Urutannya mengikuti posisi subbab dari atas ke bawah, sehingga cukup satu kali sisir.

**Tidak satu pun revisi di bawah menyentuh bunyi hipotesis**, sehingga tidak memerlukan ACC pembimbing terlebih dahulu. Yang memerlukan ACC hanya cacat (c), dan cacat itu tidak dikerjakan di sini.

**Angka 50% pada `bab1-new.md` dan pada §3.3.5c sengaja TIDAK disentuh.**

## Ringkasan

| # | Subbab | Yang berubah | Sifat |
|---|---|---|---|
| e | 3.3.5a, Tabel 3.4 | Satuan waktu: menit menjadi detik | Ganti satu kata |
| f | 3.3.5a, setelah Tabel 3.4 | Aturan hitung jumlah langkah | Tambah paragraf baru |
| d | 3.3.5c | Jumlah responden SUS | Tambah satu kalimat |
| a | 3.3.5d | Wilcoxon menjadi Mann-Whitney U | Ganti kalimat |
| b | 3.3.5d | Cara menguji SUS secara statistik | Tambah paragraf baru |

---

## Revisi (e): Satuan waktu pada Tabel 3.4

**Lokasi:** 3.3.5 Evaluasi → a. Variabel Penelitian → **Tabel 3.4**, baris nomor 1 (Efisiensi), kolom **Indikator**.

**Sebelum**

> Waktu provisioning (menit) dan jumlah langkah yang dilakukan

**Sesudah**

> Waktu provisioning (detik) dan jumlah langkah yang dilakukan

**Alasan:** seluruh data efisiensi tercatat dalam detik, dengan rentang 94 sampai 175 detik. Menuliskan satuan menit pada bab metode sementara Bab IV menyajikan detik akan langsung terlihat oleh penguji. Satuan menit juga terlalu kasar untuk selisih yang diukur, karena beda 38,10 detik akan menyusut menjadi 0,6 menit dan kehilangan makna.

---

## Revisi (f): Aturan hitung jumlah langkah

**Lokasi:** 3.3.5 Evaluasi → a. Variabel Penelitian → **tepat setelah Tabel 3.4**, sebelum subbagian b. Instrumen Penelitian.

**Sebelum**

> *(tidak ada; Tabel 3.4 menyebut indikator "jumlah langkah yang dilakukan" tanpa mendefinisikannya)*

**Sesudah** *(paragraf baru)*

> Indikator jumlah langkah pada Tabel 3.4 memerlukan definisi operasional agar penghitungannya dapat diulang. Penelitian ini mendefinisikan satu langkah sebagai satu aksi wajib pengguna yang memberi masukan, membuat keputusan, atau memajukan proses. Aksi yang dihitung meliputi pengisian satu field, pemilihan satu opsi pada dropdown atau checkbox, klik kanan yang diikuti pemilihan menu, penekanan tombol eksekusi seperti OK, Clone, atau Start, serta klik navigasi wajib seperti perpindahan tab dan penekanan tombol Edit. Mengetik satu nama mesin virtual dihitung sebagai satu langkah, bukan sebanyak jumlah ketukan tombol.
>
> Aktivitas berikut tidak dihitung sebagai langkah: proses masuk ke sistem, penggulungan layar, penempatan kursor, penutupan popup, penantian pemuatan, dan pembacaan halaman verifikasi. Definisi ini berlaku dengan granularitas yang sama pada kelompok aplikasi maupun kelompok manual.

**Alasan:** tanpa aturan hitung, angka 23 langkah berbanding 10 langkah tidak dapat diverifikasi siapa pun dan mengundang pertanyaan "kenapa bukan 25 atau 8". Aturan ini juga menutup celah terpenting: penguji berhak curiga peneliti memakai granularitas longgar pada kelompok manual dan granularitas ketat pada kelompok aplikasi. Kalimat terakhir menutup celah itu secara eksplisit.

---

## Revisi (d): Jumlah responden SUS

**Lokasi:** 3.3.5 Evaluasi → c. Rencana Pengujian → **pada kalimat "Keempat, pengujian kebergunaan..."**.

**Sebelum**

> Keempat, pengujian kebergunaan menggunakan kuesioner SUS, dengan indikator keberhasilan berupa perolehan skor SUS minimal 68 yang termasuk kategori dapat diterima (acceptable).

**Sesudah**

> Keempat, pengujian kebergunaan menggunakan kuesioner SUS yang melibatkan 8 responden, terdiri atas 5 pengguna biasa dan 3 administrator TI, dengan indikator keberhasilan berupa perolehan skor SUS minimal 68 yang termasuk kategori dapat diterima (acceptable). Setiap responden menilai kedua sistem, yaitu aplikasi yang dikembangkan dan antarmuka Proxmox VE bawaan, sehingga data yang diperoleh bersifat berpasangan.

**Alasan:** kata "responden" maupun "sampel" tidak pernah muncul satu kali pun di Bab II dan Bab III. Bab metode yang tidak menyebut jumlah subjeknya akan ditanya di sidang. Komposisi 5 berbanding 3 perlu ikut disebut karena Bab IV memakainya untuk memecah skor menurut peran.

**Catatan penting:** jumlah 8 dan komposisi 5 berbanding 3 ditetapkan **sebelum** satu pun skor SUS dihitung. Alasannya statistik, bukan selera: uji Wilcoxon signed-rank dua sisi pada n = 5 tidak mungkin mencapai p di bawah 0,05, karena hasil paling ekstrem sekalipun hanya menghasilkan p sebesar 0,0625. Sebutkan urutan waktu ini bila ditanya, karena menambah responden **setelah** melihat p adalah p-hacking, sedangkan menetapkannya di muka adalah perancangan.

---

## Revisi (a): Uji non-parametrik untuk efisiensi

**Lokasi:** 3.3.5 Evaluasi → d. Teknik Analisa Data → **paragraf kedua** (yang membahas data efisiensi dan konsistensi).

**Sebelum**

> Apabila data berdistribusi normal, digunakan uji Independent Sample T-Test; apabila data tidak berdistribusi normal, digunakan uji non parametrik, yaitu uji Wilcoxon.

**Sesudah**

> Apabila data berdistribusi normal, digunakan uji Independent Sample T-Test; apabila data tidak berdistribusi normal, digunakan uji nonparametrik, yaitu uji Mann-Whitney U. Uji Mann-Whitney U dipilih karena kelompok aplikasi dan kelompok manual merupakan dua kelompok yang saling bebas, sehingga uji Wilcoxon signed-rank yang diperuntukkan bagi data berpasangan tidak berlaku pada pengujian ini.

**Alasan:** ini cacat paling berbahaya dari kelimanya. Padanan non-parametrik untuk Independent Sample T-Test adalah **Mann-Whitney U**, yang juga dikenal sebagai Wilcoxon rank-sum test. Uji **Wilcoxon signed-rank** adalah padanan non-parametrik untuk **Paired** Sample T-Test. Menulis "T-Test independen atau Wilcoxon" dalam satu kalimat memasangkan uji bebas dengan uji berpasangan.

Bahayanya berlipat karena skripsi ini memakai **keduanya**: Mann-Whitney U untuk Hipotesis 1 dan Wilcoxon signed-rank untuk Hipotesis 3. Penguji yang membaca Bab IV akan melihat dua uji berbeda, lalu kembali ke Bab III dan menemukan hanya satu nama yang disebut, dan itu pun untuk hipotesis yang salah.

---

## Revisi (b): Cara menguji kebergunaan secara statistik

**Lokasi:** 3.3.5 Evaluasi → d. Teknik Analisa Data → **paragraf ketiga** (yang membahas data kebergunaan).

**Sebelum**

> Data kebergunaan (usability) dianalisis menggunakan perhitungan skor System Usability Scale (SUS). Skor SUS dihitung sesuai prosedur baku sehingga menghasilkan nilai dalam rentang 0 hingga 100, kemudian diinterpretasikan berdasarkan kategori penerimaan dengan ambang batas minimal 68 sebagai kategori dapat diterima (acceptable).

**Sesudah**

> Data kebergunaan (usability) dianalisis menggunakan perhitungan skor System Usability Scale (SUS). Skor SUS dihitung sesuai prosedur baku, yaitu butir bernomor ganjil bernilai jawaban dikurangi satu, butir bernomor genap bernilai lima dikurangi jawaban, kemudian jumlah seluruh butir dikali 2,5 sehingga menghasilkan nilai dalam rentang 0 hingga 100. Nilai tersebut diinterpretasikan berdasarkan kategori penerimaan dengan ambang batas minimal 68 sebagai kategori dapat diterima (acceptable).
>
> Selain interpretasi terhadap ambang batas, skor SUS aplikasi yang dikembangkan dibandingkan dengan skor SUS antarmuka Proxmox VE bawaan untuk menguji Hipotesis 3 sebagaimana dirumuskan pada Bab II. Responden yang sama menilai kedua sistem, sehingga datanya bersifat berpasangan. Normalitas diuji terlebih dahulu menggunakan uji Shapiro-Wilk terhadap selisih skor kedua sistem. Apabila selisih berdistribusi normal, digunakan uji Paired Sample T-Test; apabila selisih tidak berdistribusi normal, digunakan uji Wilcoxon signed-rank.

**Alasan:** §3.3.5c menjanjikan hasil kebergunaan "dianalisis secara statistik untuk menguji hipotesis penelitian", sedangkan §3.3.5d hanya menghitung skor lalu membandingkannya dengan ambang 68. Membandingkan satu angka dengan ambang bukan uji hipotesis, sehingga Bab III bertentangan dengan dirinya sendiri.

Perbaikan ini menyelaraskan Bab III dengan H3 yang **sudah tertulis** di Bab II, yaitu perbandingan antara aplikasi dan antarmuka Proxmox VE bawaan. Bunyi hipotesisnya tidak diubah sama sekali. Yang berubah hanya bab metode, yang kini menjelaskan cara menguji hipotesis yang selama ini sudah ada.

Penambahan rumus skoring pada paragraf pertama menutup celah kecil yang menyertainya: frasa "prosedur baku" mengasumsikan pembaca sudah tahu prosedurnya.

---

## Yang sengaja tidak dikerjakan

**Cacat (c), konflik H3 tiga arah.** Setelah revisi (b), Bab II dan Bab III sudah selaras. Yang tersisa hanya Tujuan Penelitian nomor 4 pada `bab1-new.md`, yang berbunyi evaluasi terhadap ambang 68 tanpa menyebut perbandingan.

Pandangan saya: ini **tidak perlu direvisi**, dan polanya sama persis dengan Hipotesis 1. Hipotesis menguji ada tidaknya perbedaan, sedangkan indikator keberhasilan menilai pencapaian terhadap ambang. Keduanya hidup berdampingan tanpa saling meniadakan. Bab IV melaporkan dua-duanya: uji beda menerima H3, dan skor 92,19 melampaui ambang 68 pada kedelapan responden. Tidak ada yang perlu dibuang.

Bawa ini ke pembimbing sebagai pertanyaan, bukan sebagai usulan perubahan: apakah Tujuan 4 perlu menyebut perbandingan, ataukah cukup sebagaimana adanya karena perbandingan sudah menjadi urusan hipotesis di Bab II.

**Angka 50%.** Tidak disentuh, dan jangan disentuh. Menurunkan ambang setelah mengetahui hasilnya meleset akan dibaca penguji sebagai penyelamatan pasca-fakta, dan itu jauh lebih merusak daripada satu indikator yang tidak tercapai. Melesetnya angka ini justru menjadi temuan, dan penjelasannya sudah tertulis pada subbab 4.8.5.
