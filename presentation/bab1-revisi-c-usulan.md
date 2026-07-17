# Usulan Revisi Bab I: Rumusan Masalah 4 dan Tujuan Penelitian 4

Berkas ini berisi usulan untuk diajukan kepada pembimbing. Berbeda dengan lima revisi Bab III yang sudah diterapkan, usulan ini menyentuh bunyi rumusan masalah, sehingga memerlukan persetujuan terlebih dahulu.

**Cakupan perubahan: dua kalimat di Bab I.** Hipotesis 3 pada Bab II tidak berubah. Bab III tidak berubah. Bab IV tidak berubah.

---

## 1. Temuan

Bab I tidak simetris terhadap dirinya sendiri. Rumusan Masalah 3 menjanjikan perbandingan terhadap proses manual, lalu Hipotesis 1 dan Hipotesis 2 memenuhi janji itu. Rumusan Masalah 4 tidak menjanjikan perbandingan, tetapi Hipotesis 3 tetap membandingkan aplikasi dengan antarmuka Proxmox VE bawaan.

| | Menyebut perbandingan | Hipotesis yang melayaninya | Hipotesisnya membandingkan |
|---|:---:|---|:---:|
| RM3 dan Tujuan 3 | Ya | H1, H2 | Ya |
| RM4 dan Tujuan 4 | **Tidak** | H3 | **Ya** |

Kata "dibandingkan" muncul pada Rumusan Masalah 3 dan Tujuan Penelitian 3, dan tidak pernah muncul pada Rumusan Masalah 4 maupun Tujuan Penelitian 4.

Akibatnya, Bab IV menyajikan uji beda skor SUS antara dua sistem, sementara pembaca yang menelusuri kembali ke Bab I tidak menemukan pertanyaan penelitian yang meminta perbandingan tersebut.

## 2. Usulan Perubahan

### 2.1 Rumusan Masalah 4

**Sebelum**

> Bagaimana hasil evaluasi tingkat kebergunaan (usability) aplikasi web self-service yang dikembangkan dalam mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual bagi pengguna, berdasarkan System Usability Scale (SUS)?

**Sesudah**

> Bagaimana hasil evaluasi tingkat kebergunaan (usability) aplikasi web self-service yang dikembangkan dalam mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual bagi pengguna, dibandingkan dengan antarmuka Proxmox VE bawaan, berdasarkan System Usability Scale (SUS)?

### 2.2 Tujuan Penelitian 4

**Sebelum**

> Mengevaluasi tingkat kebergunaan (usability) aplikasi web self-service yang dikembangkan dalam mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual, dengan indikator keberhasilan berupa perolehan skor System Usability Scale (SUS) minimal 68 yang termasuk dalam kategori dapat diterima (acceptable).

**Sesudah**

> Mengevaluasi tingkat kebergunaan (usability) aplikasi web self-service yang dikembangkan dalam mendukung proses orkestrasi dan otomatisasi provisioning mesin virtual dibandingkan dengan antarmuka Proxmox VE bawaan, dengan indikator keberhasilan berupa perolehan skor System Usability Scale (SUS) minimal 68 yang termasuk dalam kategori dapat diterima (acceptable).

**Yang ditambahkan hanya frasa "dibandingkan dengan antarmuka Proxmox VE bawaan".** Ambang 68 tetap utuh pada posisinya.

## 3. Alasan yang Dapat Disampaikan kepada Pembimbing

**Pertama, perubahan ini menyamakan Tujuan 4 dengan Tujuan 3 yang sudah disetujui.** Tujuan Penelitian 3 memuat dua hal sekaligus: pembanding ("dibandingkan proses manual") dan ambang ("minimal 50%"). Tujuan Penelitian 4 yang memuat pembanding ("dibandingkan antarmuka Proxmox VE bawaan") dan ambang ("minimal 68") mengikuti pola yang sudah ada, bukan memperkenalkan pola baru.

**Kedua, perubahan ini menyesuaikan rumusan dengan pengukuran yang sudah berjalan, bukan sebaliknya.** Hipotesis 3 pada Bab II sudah berbunyi perbandingan sejak sidang proposal, dan datanya sudah terkumpul untuk kedua sistem. Yang selama ini tertinggal adalah rumusan masalahnya, yang menggambarkan lebih sempit daripada apa yang dirancang untuk diukur.

**Ketiga, perbandingan menjawab pertanyaan yang tidak dijawab oleh ambang.** Ambang 68 menjawab "apakah aplikasi ini dapat diterima". Perbandingan menjawab "apakah aplikasi ini lebih baik daripada cara yang dipakai sekarang". Penelitian yang mengembangkan pengganti bagi proses eksisting perlu menjawab keduanya.

**Keempat, hasil pengukurannya justru menguatkan keperluan perbandingan itu.** Skor SUS antarmuka Proxmox VE bawaan bernilai 37,81 bagi keseluruhan responden, namun terpecah tajam menurut peran: administrator TI memberi 70,00 yang melampaui ambang 68, sedangkan pengguna biasa memberi 18,50. Temuan bahwa satu sistem yang sama dapat lolos ambang bagi satu kelompok dan gagal telak bagi kelompok lain hanya dapat muncul apabila kedua sistem diukur berdampingan. Tanpa perbandingan, temuan ini tidak memiliki tempat di dalam naskah.

## 4. Kesejajaran dengan Bab IV

Bab IV tidak memerlukan perubahan apa pun, baik usulan ini diterima maupun ditolak. Subbab berikut sudah melaporkan ambang dan perbandingan secara berdampingan.

| Subbab Bab IV | Isi | Melayani |
|---|---|---|
| 4.6.2 | Skor SUS portal 92,19 dan Proxmox VE 37,81; kedelapan responden individual melampaui 68 | Ambang dan perbandingan |
| 4.6.4 | Paired sample t-test t(7) = 6,982, p = 0,000215; konfirmasi Wilcoxon signed-rank W = 0, p = 0,0078 | Perbandingan (H3) |
| 4.6.5 | Skor menurut peran: Proxmox VE 18,50 bagi pengguna biasa dan 70,00 bagi administrator TI | Perbandingan |
| 4.8.4 | Jawaban Rumusan Masalah 4 | Keduanya |

Apabila usulan diterima, Bab I dan Bab IV berbicara dengan bahasa yang sama tanpa satu kalimat pun diubah di Bab IV.

## 5. Apabila Usulan Ditolak

Naskah tetap dapat dipertahankan tanpa perubahan apa pun. Jawaban yang disiapkan:

Perbandingan merupakan salah satu cara melakukan evaluasi, sehingga Hipotesis 3 tetap melayani Rumusan Masalah 4 sebagaimana bunyinya sekarang. Polanya juga sama dengan Hipotesis 1: hipotesis menguji ada tidaknya perbedaan yang signifikan, sedangkan indikator keberhasilan menilai pencapaian terhadap ambang yang ditetapkan peneliti. Keduanya berdampingan tanpa saling meniadakan, dan Bab IV melaporkan keduanya.

Pilihan ini tidak mengubah satu angka pun.

## 6. Yang Tidak Diusulkan Berubah

**Hipotesis 3 pada Bab II.** Bunyinya sudah tepat dan sudah lolos sidang proposal.

**Bab III.** Setelah revisi 3.3.5c dan 3.3.5d, bab metode sudah menjelaskan kedua hal tersebut: jumlah responden, sifat data yang berpasangan, prosedur skoring, dan uji beda yang dipakai.

**Indikator penurunan waktu 50% pada Tujuan Penelitian 3.** Angka ini terpisah dari usulan di atas dan tidak diusulkan berubah. Indikator tersebut tidak tercapai pada pengukuran, dan Bab IV melaporkannya apa adanya beserta sebabnya pada subbab 4.8.5.
