# Revisi Bab I: Manfaat Penelitian (Poin 5 Revisi Penguji)

Menutup poin 5 pada `presentation/checklist-revisi-penguji.md`, satu-satunya butir revisi penguji yang berstatus menunggu karena angkanya harus keluar dari Bab IV.

**Permintaan penguji:** Manfaat masih terlalu umum, perlu dibuat lebih spesifik. Contoh yang diberikan: "mampu mengurangi waktu provisioning dari xx menit menjadi xx menit" atau "mengurangi konfigurasi manual sebanyak xx%".

**Status:** angka sudah tersedia seluruhnya. Berkas ini mengisi setiap xx.

**Cakupan:** hanya §1.5.2 Manfaat Praktis butir a, b, dan c. Butir d dan §1.5.1 Manfaat Teoritis tidak berubah.

---

## Catatan Satuan

Penguji mencontohkan "dari xx menit menjadi xx menit". Naskah ini memakai **detik**, dengan dua alasan. Pertama, seluruh data efisiensi tercatat dalam detik pada rentang 94 sampai 175 detik, sehingga satuan menit akan menyusutkan selisih 38,10 detik menjadi 0,6 menit dan menghilangkan maknanya. Kedua, Tabel 3.4 baru saja diperbaiki dari "(menit)" menjadi "(detik)", sehingga memakai menit di Manfaat akan membuat Bab I bertentangan dengan Bab III. Contoh penguji menunjuk pada bentuk "dari sekian menjadi sekian", dan bentuk itu tetap dipenuhi.

---

## Revisi 1: Butir a. Bagi Organisasi

**Lokasi:** 1.5 Manfaat Penelitian → 1.5.2 Manfaat Praktis → a. Bagi Organisasi.

**Sebelum**

> Penelitian ini diharapkan dapat membantu organisasi dalam menyediakan layanan mesin Virtual secara lebih cepat, terstandarisasi, dan terkontrol melalui penerapan mekanisme self-service, approval workflow, serta otomatisasi berbasis IaC. Selain itu, sistem yang dikembangkan diharapkan dapat meningkatkan tata kelola infrastruktur, memperkuat keamanan, dan mengurangi ketergantungan terhadap proses pengelolaan yang dilakukan secara manual.

**Sesudah**

> Penelitian ini diharapkan dapat membantu organisasi dalam menyediakan layanan mesin Virtual secara lebih cepat, terstandarisasi, dan terkontrol melalui penerapan mekanisme self-service, approval workflow, serta otomatisasi berbasis IaC. Manfaat terbesar yang terukur terletak pada berkurangnya beban operasi. Jumlah langkah yang harus dikerjakan untuk menyediakan satu mesin virtual turun dari 23 menjadi 10 langkah, atau berkurang 56,52%.
>
> Keunggulan tersebut melebar pada permintaan berjumlah banyak. Jumlah langkah pada aplikasi tidak bertambah seiring jumlah mesin virtual yang diminta, karena pengguna cukup mengubah satu angka pada kolom jumlah. Permintaan sepuluh mesin virtual sekaligus tetap menuntut 10 langkah, sedangkan cara manual menuntut 230 langkah, sehingga beban kerja berkurang 95,65%. Waktu penyelesaiannya 333 detik berbanding 1.369 detik apabila sepuluh mesin virtual tersebut dikerjakan satu per satu secara manual. Antarmuka Proxmox VE bawaan tidak menyediakan mekanisme permintaan berjumlah banyak dalam bentuk apa pun.
>
> Pada penyediaan satu mesin virtual, waktu turun dari 136,90 detik menjadi 98,80 detik, atau berkurang 27,83%. Penurunan waktu memang tidak sebesar penurunan jumlah langkah, dan sebabnya bersifat mendasar. Sebanyak 88,7% waktu penyediaan pada aplikasi merupakan waktu mesin, yaitu Terraform menjalankan kloning penuh lalu sistem operasi tamu melakukan boot. Lama proses tersebut ditentukan oleh platform hypervisor beserta spesifikasi perangkat kerasnya, bukan oleh antarmuka yang dipakai memintanya. Aplikasi ini berjalan di atas hypervisor yang sama dengan cara manual, sehingga tidak mungkin melampaui batas kecepatan mesinnya sendiri. Yang aplikasi pangkas adalah waktu perhatian manusia, dari 136,90 detik menjadi 11,20 detik.
>
> Selain itu, sistem yang dikembangkan diharapkan dapat meningkatkan tata kelola infrastruktur, memperkuat keamanan, dan mengurangi ketergantungan terhadap proses pengelolaan yang dilakukan secara manual. Seluruh mesin virtual yang diminta berhasil dibangun tanpa kegagalan, dan seluruh parameter konfigurasinya sesuai standar tier yang ditetapkan tanpa configuration drift. Satu persetujuan menanggung sepuluh mesin virtual sekaligus beserta jejak auditnya, sehingga tata kelola ikut menskala tanpa menambah beban penyetuju.

**Angka yang mengisi xx:** langkah 23 menjadi 10 (56,52%); batch 230 menjadi 10 (95,65%) dan 1.369 menjadi 333 detik; waktu satu mesin virtual 136,90 menjadi 98,80 detik (27,83%); waktu perhatian manusia 136,90 menjadi 11,20 detik; porsi waktu mesin 88,7%; keberhasilan deployment 100%; konsistensi konfigurasi 100%.

### Catatan penulisan untuk butir a

**Urutannya disengaja.** Paragraf pertama membuka dengan langkah, bukan waktu, karena di situlah angka terkuatnya berada. Waktu baru muncul di paragraf ketiga, sudah bersama penjelasannya. Membuka dengan 27,83% akan membuat pembaca menilai seluruh Manfaat dari angka terlemahnya.

**Angka batch 1.369 detik adalah ekstrapolasi**, yaitu 136,90 dikali sepuluh, bukan hasil pengukuran sepuluh percobaan manual berturut-turut. Bab IV subbab 4.3.11 sudah menyatakannya. Di Manfaat, kalimat "apabila sepuluh mesin virtual tersebut dikerjakan satu per satu secara manual" sudah membawa sifat ekstrapolasi itu tanpa perlu istilah teknisnya.

**🚫 Jangan memakai angka batch untuk mengklaim indikator 50% tercapai.** Penurunan waktu batch mencapai 75,68%, dan angka itu sengaja tidak ditulis sebagai persentase di Manfaat supaya tidak ada pembaca yang membandingkannya dengan ambang 50% pada Tujuan 3. Indikator tersebut menilai satuan per mesin virtual, dan di sana angkanya tetap 27,83%. Batch dilaporkan berdampingan, bukan menggantikan.

**Batch adalah perbedaan kemampuan, bukan perbedaan kecepatan.** Kalimat penutup paragraf kedua ("Antarmuka Proxmox VE bawaan tidak menyediakan mekanisme permintaan berjumlah banyak dalam bentuk apa pun") memikul seluruh bobot klaim itu. Tanpa kalimat tersebut, pembaca akan mengira aplikasi ini sekadar lebih cepat pada pekerjaan yang sama. Dengan kalimat itu, klaimnya menjadi kategorikal dan tidak memerlukan uji statistik.

⚠️ **Batas kejujuran angka 11,20 detik.** Angka ini adalah `t1`, yaitu waktu pengguna berinteraksi dengan formulir, dan **bukan** metrik yang dipakai menguji Hipotesis 1. Uji hipotesis memakai `t1+t3` sebesar 98,80 detik, dan angka itulah yang dipakai menghitung 27,83%. Angka 11,20 boleh disebut di sini karena Manfaat memang berbicara tentang beban kerja orang, dan Bab IV subbab 4.8.5 sudah memaparkan dekomposisinya secara terbuka. **Jangan pernah menukar 11,20 detik ke tempat 98,80 detik pada pembahasan efisiensi.** Menukarnya berarti mengganti definisi metrik setelah mengetahui hasilnya, dan definisi `t1+t3` sudah terkunci sejak sebelum kelompok portal diukur.

---

## Revisi 2: Butir b. Bagi Administrator Infrastruktur

**Lokasi:** 1.5 Manfaat Penelitian → 1.5.2 Manfaat Praktis → b. Bagi Administrator Infrastuktur.

⚠️ **Sekalian perbaiki typo pada judul butirnya: "Infrastuktur" menjadi "Infrastruktur".**

**Sebelum**

> Penelitian ini diharapkan dapat membantu administrator dalam mengelola proses penyediaan mesin virtual secara lebih efisien serta mengurangi kesalahan konfigurasi (human error) melalui otomatisasi provisioning, konfigurasi, dan hardening mesin virtual. Sistem yang dikembangkan juga mendukung pengelolaan sumber daya yang lebih terstruktur melalui mekanisme kontrol akses, pencatatan aktivitas pengguna (audit trail), dan pengelolaan siklus hidup mesin virtual.

**Sesudah**

> Penelitian ini diharapkan dapat membantu administrator dalam mengelola proses penyediaan mesin virtual secara lebih efisien serta mengurangi kesalahan konfigurasi (human error) melalui otomatisasi provisioning, konfigurasi, dan hardening mesin virtual. Pengujian mencatat nol kesalahan konfigurasi dari sepuluh percobaan mesin virtual yang dibangun melalui aplikasi.
>
> Manfaat tersebut menyasar tepat pada sumber kesalahan yang tercatat pada subbab 1.1. Dari 120 operasi manual yang terpantau selama dua bulan, terdapat 16 kesalahan konfigurasi atau sekitar 13,3%, dan kesalahan itu paling banyak muncul pada pembuatan serta perubahan beberapa mesin virtual yang dikerjakan berdekatan. Pola tersebut dapat dijelaskan: administrator mengulang rangkaian langkah yang sama sebanyak jumlah mesin virtual yang diminta, dan pengulangan itulah yang melahirkan kesalahan. Aplikasi yang dikembangkan meniadakan pengulangan tersebut. Permintaan sepuluh mesin virtual ditempuh melalui 10 langkah yang sama persis dengan permintaan satu mesin virtual, dan pengujian mencatat kesepuluhnya berhasil dibangun tanpa satu pun kesalahan konfigurasi.
>
> Manfaat yang lebih mendasar terletak pada penyempitan peluang kesalahan. Prosedur manual menuntut administrator menghitung sendiri nilai penambahan ukuran disk, dan Proxmox VE tidak memvalidasi hasilnya terhadap standar organisasi mana pun. Sistem yang dikembangkan meniadakan isian tersebut karena ukuran disk ditulis otomatis dari definisi tier. Sistem ini juga mendukung pengelolaan sumber daya yang lebih terstruktur melalui mekanisme kontrol akses, pencatatan aktivitas pengguna (audit trail), dan pengelolaan siklus hidup mesin virtual.

**Angka yang mengisi xx:** kesalahan konfigurasi 0 dari 10 percobaan; rujukan silang ke 16 kesalahan dari 120 operasi (13,3%) pada subbab 1.1.

**Catatan pembagian tugas antar butir.** Angka 11,20 detik sengaja **hanya muncul di butir a**, tempatnya menjadi penutup penjelasan mengapa waktu turun 27,83%. Draft sebelumnya mengulangnya di sini, dan pengulangan itu dibuang. Tiap butir kini memikul satu tema: butir a beban kerja dan waktu, butir b kesalahan, butir c kebergunaan, butir d kontribusi ilmiah.

### Catatan penulisan untuk butir b

**Paragraf kedua adalah bagian terkuat dari seluruh Manfaat.** Ia menutup lingkaran naskah: subbab 1.1 mencatat kesalahan lapangan terpusat pada operasi berulang, dan Bab IV membuktikan sistem ini meniadakan pengulangan itu. Manfaat yang menunjuk balik ke masalah yang naskahnya sendiri dokumentasikan jauh lebih kuat daripada manfaat yang berdiri sendiri.

**🚫 Jangan menulis "VMware tidak mendukung batch deployment".** Godaannya besar, tetapi itu klaim kemampuan teknis yang dapat dibantah, karena batch dapat dibuat melalui skrip PowerCLI atau API. Yang tidak terbantah adalah apa yang catatan lapangan perlihatkan: administrator mengulang langkah yang sama berkali-kali. Naskah cukup menyatakan pengulangannya, tanpa mengklaim ketiadaan fiturnya.

**Perhatikan batas klaimnya.** Kalimat "pola tersebut dapat dijelaskan" bersifat penafsiran, bukan pengukuran. Catatan lapangan mencatat kesalahan terpusat pada operasi berdekatan, dan naskah menafsirkan pengulangan sebagai sebabnya. Penafsiran itu masuk akal dan didukung mekanismenya, namun jangan ditulis seolah tercatat langsung. Angka 13,3% berasal dari lingkungan VMware, sedangkan pengujian berjalan di Proxmox VE, sehingga keduanya tidak dibandingkan secara langsung. Yang dinyatakan adalah keduanya berbagi sumber kesalahan yang sama, yaitu pengulangan manual.

**Angka 16 dan 120 sudah ada di subbab 1.1** dalam bentuk "4 dari 30 pada Maret dan 12 dari 90 pada April". Menjumlahkannya menjadi 16 dari 120 tidak menambah data baru, hanya merangkum yang sudah tertulis.

---

## Revisi 3: Butir c. Bagi Pengguna

**Lokasi:** 1.5 Manfaat Penelitian → 1.5.2 Manfaat Praktis → c. Bagi Pengguna.

**Sebelum**

> Penelitian ini diharapkan dapat memberikan kemudahan bagi pengguna dalam mengajukan, memantau, dan mengelola layanan mesin virtual secara mandiri melalui aplikasi web self-service tanpa harus memahami kompleksitas teknis penggunaan Terraform, Ansible, maupun konfigurasi infrastruktur virtual yang mendasarinya, di mana kemudahan tersebut diukur melalui skor kebergunaan (usability) sistem.

**Sesudah**

> Penelitian ini diharapkan dapat memberikan kemudahan bagi pengguna dalam mengajukan, memantau, dan mengelola layanan mesin virtual secara mandiri melalui aplikasi web self-service tanpa harus memahami kompleksitas teknis penggunaan Terraform, Ansible, maupun konfigurasi infrastruktur virtual yang mendasarinya. Kemudahan tersebut diukur melalui skor kebergunaan (usability) sistem, dan hasil pengujian menunjukkan skor System Usability Scale sebesar 92,19 yang termasuk kategori sangat baik, dibandingkan 37,81 pada antarmuka Proxmox VE bawaan.
>
> Manfaat terbesarnya dirasakan pengguna non-pakar. Kelompok pengguna biasa memberi skor 18,50 kepada antarmuka Proxmox VE bawaan dan 88,00 kepada aplikasi yang dikembangkan, sehingga selisih penerimaan antara pengguna biasa dan administrator TI menyusut dari 51,50 poin menjadi 11,17 poin. Aplikasi ini menempatkan pengguna non-pakar pada tingkat penerimaan yang setara dengan pengguna ahli.

**Angka yang mengisi xx:** SUS 92,19 berbanding 37,81; pengguna biasa 88,00 berbanding 18,50; jurang antar-peran 51,50 menjadi 11,17 poin.

---

## Revisi 4: Butir d. Bagi Peneliti Selanjutnya

**Lokasi:** 1.5 Manfaat Penelitian → 1.5.2 Manfaat Praktis → d. Bagi Peneliti Selanjutnya.

**Sebelum**

> Penelitian ini diharapkan dapat menjadi referensi dan bahan pengembangan bagi penelitian selanjutnya yang berkaitan dengan IaC, orkestrasi infrastruktur virtual, platform self-service, tata kelola layanan infrastruktur, serta penerapan DSRM dalam pengembangan solusi teknologi informasi.

**Sesudah**

> Penelitian ini diharapkan dapat menjadi referensi dan bahan pengembangan bagi penelitian selanjutnya yang berkaitan dengan IaC, orkestrasi infrastruktur virtual, platform self-service, tata kelola layanan infrastruktur, serta penerapan DSRM dalam pengembangan solusi teknologi informasi. Hasil pengukuran pada penelitian ini menyediakan angka acuan yang dapat dipakai langsung sebagai pembanding, yaitu waktu provisioning melalui antarmuka Proxmox VE bawaan sebesar 136,90 detik dan melalui aplikasi sebesar 98,80 detik pada sepuluh percobaan terkontrol, jumlah langkah 23 berbanding 10, serta skor SUS antarmuka Proxmox VE bawaan sebesar 37,81 yang terpecah menjadi 18,50 bagi pengguna biasa dan 70,00 bagi administrator TI.
>
> Penelitian selanjutnya juga dapat memakai ulang definisi operasional jumlah langkah pada subbab 3.3.5 untuk membandingkan antarmuka lain dengan granularitas yang sama, serta menindaklanjuti temuan jeda 5,80 detik antara penetapan status Active dan kemunculan alamat IP sebagaimana dibahas pada Bab V.

**Angka yang mengisi xx:** waktu 136,90 berbanding 98,80 detik; langkah 23 berbanding 10; SUS Proxmox VE 37,81 (18,50 pengguna biasa, 70,00 administrator TI); jeda Active ke IP 5,80 detik.

### Catatan penulisan untuk butir d

**Butir ini semula tidak saya sentuh, dan itu keliru.** Bunyi lamanya persis jenis keumuman yang penguji keluhkan: menawarkan naskah sebagai rujukan tanpa menyebut apa yang bisa dirujuk. Sekarang butir ini menyebut angka yang benar-benar dapat dipakai orang lain.

**Nilai yang ditawarkan bukan aplikasinya, melainkan angkanya.** Peneliti lain tidak dapat memakai ExoVirt, tetapi dapat memakai 136,90 detik sebagai baseline manual Proxmox VE, memakai aturan hitung langkah untuk membandingkan antarmuka mereka sendiri, dan memakai skor SUS Proxmox VE yang terpecah menurut peran.

**🚫 Jangan menambahkan klaim bahwa angka SUS terpecah menurut peran ini belum ada di literatur.** Godaannya ada, karena klaim itu akan terdengar seperti kebaruan. Naskah ini tidak pernah melakukan penelusuran pustaka untuk memastikannya, sehingga klaim tersebut tidak dapat dipertanggungjawabkan. Cukup sajikan angkanya dan biarkan pembaca menilai kegunaannya.

---

## Yang Tidak Diubah

**§1.5.1 Manfaat Teoritis.** Manfaat teoritis berbicara tentang kontribusi keilmuan, dan bentuknya memang tidak berangka. Permintaan penguji menunjuk pada manfaat praktis, terlihat dari contoh yang diberikan ("dari xx menit menjadi xx menit", "mengurangi konfigurasi manual xx%"). Keduanya berada di Manfaat Praktis.

**Indikator penurunan waktu 50% pada Tujuan Penelitian 3.** Tidak disentuh.

---

## Satu Hal yang Perlu Kamu Sadari Sebelum Mengajukan

Setelah revisi ini, Bab I akan memuat dua angka yang tidak bertemu. Tujuan Penelitian 3 menargetkan penurunan waktu **minimal 50%**, sedangkan Manfaat melaporkan penurunan dari 136,90 menjadi 98,80 detik, yaitu **27,83%**. Jaraknya hanya beberapa paragraf.

Ini keputusan sadar, bukan kelalaian. Tiga alasan.

**Pertama, angka 27,83% tetap muncul apa pun yang dipilih.** Bab IV melaporkannya, dan subbab 4.8.5 membahas sebabnya. Yang bisa diatur hanya kapan pembaca pertama kali melihatnya.

**Kedua, penguji yang menemukan sendiri selisih itu di Bab IV akan bertanya mengapa Bab I diam.** Pertanyaan itu jauh lebih sulit dijawab daripada pertanyaan mengapa targetnya meleset, karena yang pertama menyangkut itikad sedangkan yang kedua menyangkut hasil.

**Ketiga, Manfaat ini justru penuh angka yang menang.** Langkah berkurang 56,52%, beban batch berkurang 95,65%, deployment berhasil 100%, konsistensi 100%, kesalahan nol, dan SUS melonjak dari 37,81 ke 92,19. Satu indikator yang meleset berdiri di antara lima yang tercapai.

Kalau pembimbing meminta angka waktu dihapus dari Manfaat, turuti. Sisa angkanya tetap memenuhi permintaan penguji. Yang tidak boleh dilakukan adalah menurunkan ambang 50% pada Tujuan 3 agar cocok dengan hasil.
