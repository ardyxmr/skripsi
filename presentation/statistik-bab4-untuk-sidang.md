# Statistik Bab IV untuk Sidang

Berkas ini bekal belajarmu, bukan bagian skripsi. Jangan ditempel ke Word. Tujuannya satu: begitu selesai membacanya, kamu paham tiap angka di Bab IV cukup untuk menjelaskannya sendiri, dan keraguan yang muncul saat menyalin 4.3.9 hilang.

---

## Bagian 1: Tiga nama, dijelaskan seperti ke teman

Ada tiga nama yang bikin blank. Semuanya sebenarnya sederhana.

### Shapiro-Wilk = pemeriksa bentuk

Ini bukan uji yang lulus atau gagal. Ia cuma memeriksa **bentuk** sebaran angkamu, dan menjawab satu pertanyaan: "apakah angka-angka ini menumpuk di tengah membentuk lonceng, atau mencong ke satu sisi?"

Hasilnya cuma rambu jalan. Kalau nilai p di atas 0,05, bentuknya cukup mirip lonceng, dan ia bilang "belok ke jalur normal". Kalau p di bawah 0,05, bentuknya mencong, dan ia bilang "belok ke jalur tidak normal".

Titik. Tidak ada nilai bagus atau jelek di sini. Termometer tidak menghakimi, ia cuma menunjukkan angka.

### Mann-Whitney U = pembanding dua kelompok berbeda

Dipakai kalau kamu membandingkan **dua rombongan yang berbeda orang atau berbeda unit**. Di skripsimu: 10 mesin virtual dibuat manual lawan 10 mesin virtual dibuat portal. Dua rombongan berbeda.

Cara kerjanya tanpa menghitung rata-rata: semua 20 angka dari dua kelompok dijejer dari kecil ke besar, lalu dilihat apakah satu kelompok cenderung berkumpul di peringkat bawah dan satunya di peringkat atas.

Di datamu, seluruh waktu portal (paling lambat 110 detik) berada di bawah seluruh waktu manual (paling cepat 121 detik). Tidak ada satu pun yang tumpang tindih. Pemisahan sempurna itu yang membuat nilai U = 0. Angka U kecil berarti pemisahan makin tegas, dan 0 adalah setegas-tegasnya.

Nama lain Mann-Whitney U adalah **Wilcoxon rank-sum**. Sama persis, dua nama satu alat. Ini sumber kebingunganmu kemarin.

### Wilcoxon signed-rank = pembanding penilaian orang yang sama

Dipakai kalau **orang yang sama menilai dua hal**. Di skripsimu: 8 responden, tiap orang mencoba portal DAN Proxmox, lalu memberi dua skor.

Cara kerjanya: lihat selisih tiap orang (skor portalnya dikurangi skor Proxmox-nya), lalu periksa apakah selisih itu konsisten mengarah ke satu sisi. Kalau 8 dari 8 orang memberi portal lebih tinggi, arahnya sangat konsisten, dan hasilnya signifikan.

Perhatikan bedanya dengan Mann-Whitney. Di sini yang dibandingkan bukan dua rombongan orang, melainkan dua penilaian dari orang yang sama.

---

## Bagian 2: Keraguan yang muncul di kepalamu, dan kenapa ia keliru

Saat menyalin 4.3.9, kepalamu bertanya: "kalau ujinya tidak normal, apa dosen tidak bertanya kenapa tidak ganti metode yang hasilnya bagus?"

Keraguan ini berdiri di atas satu salah baca: kamu membaca "tidak normal" sebagai "hasil jelek". Padahal keduanya beda hal.

**"Tidak normal" bukan nilai. Ia keterangan bentuk.** Sama seperti termometer membaca 38 derajat bukan berarti "jelek", tapi informasi yang menentukan tindakan. Shapiro-Wilk membaca "tidak normal" berarti "pakai jalur non-parametrik", bukan "datamu buruk".

**Dan inilah yang penting: yang menjebak justru KEBALIKAN dari dugaanmu.**

Yang bahaya bukan memakai tes non-normal. Yang bahaya adalah mengganti tes demi hasil yang lebih cantik. Kamu tidak boleh memilih tes dengan mengintip mana yang memberi p paling kecil. Kamu memilihnya berdasarkan bentuk data dan struktur kelompok, sebelum melihat hasil. Mengganti tes karena hasilnya lebih bagus punya nama di dunia akademik: p-hacking. Itulah yang penguji buru.

Jadi posisi paling aman, yang tidak bisa diserang, persis yang sudah kamu lakukan:

> "Data saya bentuknya tidak normal, jadi saya pakai uji yang memang dirancang untuk data tidak normal, dan saya laporkan apa pun hasilnya."

Kalau ada mahasiswa berkata "data saya tidak normal, jadi saya ganti ke uji yang memberi signifikansi", itu yang dikuliti. Yang kamu lakukan kebalikannya.

**Bonus: data tidak normal justru membuatmu lebih aman.** Uji non-parametrik seperti Mann-Whitney mengandaikan lebih sedikit hal. Kalau kamu memaksa T-Test pada data tidak normal, penguji bisa menyerang "data Anda melanggar syarat normalitas T-Test". Dengan memakai Mann-Whitney, kamu menutup serangan itu lebih dulu.

---

## Bagian 3: Kenapa dua hipotesis pakai uji berbeda, dan itu benar

Pertanyaan yang mungkin muncul di sidang: "kenapa H1 dan H3 pakai uji berbeda? Kenapa tidak satu uji untuk semua?"

Jawabannya: karena struktur datanya berbeda, dan uji harus mengikuti struktur data.

| | H1 Efisiensi | H3 Kebergunaan |
|---|---|---|
| Yang dibandingkan | 10 VM manual vs 10 VM portal | 8 orang menilai 2 sistem |
| Siapa | 1 operator, mesin berbeda-beda | 8 orang berbeda |
| Struktur | Dua kelompok bebas | Berpasangan |
| Uji | Mann-Whitney U | Paired t-test (utama) + Wilcoxon signed-rank (konfirmasi) |

Kunci untuk memahami "bebas" lawan "berpasangan":

**Berpasangan butuh pasangannya berbeda-beda.** Di H3 ada 8 orang berbeda. Tiap orang punya selera sendiri, ada yang murah nilai ada yang pelit. Memasangkan nilai portal dan Proxmox dari orang yang sama menghilangkan perbedaan selera itu. Itu gunanya pasangan.

Di H1 operatornya satu orang, sama di seluruh 20 percobaan. Satu orang yang konstan tidak bisa membuat pasangan. manual-3 dipasangkan dengan portal-3 atas dasar apa? Cuma karena sama-sama urutan ketiga, dan itu nomor urut, bukan unit bersama.

Analogi paling gampang: satu koki memasak 10 piring cara A dan 10 piring cara B. Koki yang sama itu variabel kontrol, bukan pasangan. Piring A3 tidak berpasangan dengan piring B3. Bandingkan dengan 8 juri yang masing-masing mencicipi 2 hidangan, di situ tiap juri adalah satu pasangan sungguhan.

**Kalau dipaksa satu uji untuk semua, itu justru kesalahan:**

- Signed-rank untuk H1 → mengarang pasangan yang tidak ada. Penguji tajam langsung menangkapnya.
- Mann-Whitney untuk H3 → membuang informasi bahwa 8 orang menilai keduanya, uji jadi lebih lemah, model salah.

Jadi memakai uji berbeda untuk struktur berbeda bukan tanda plin-plan. Itu tanda kamu paham. Yang salah adalah memaksakan satu uji ke semua demi terlihat konsisten.

Kalimat pertahananmu:

> "Saya memakai satu kerangka keputusan yang sama untuk keduanya: pertama uji normalitas dengan Shapiro-Wilk, lalu cocokkan uji dengan struktur data. Kerangka yang sama diterapkan pada struktur berbeda memang menghasilkan uji berbeda."

---

## Bagian 4: Angkanya berarti apa

### H1 Efisiensi

| Angka | Arti dalam bahasa manusia |
|---|---|
| Shapiro-Wilk p = 0,0006 (portal) dan 0,041 (manual) | Kedua kelompok bentuknya tidak normal, jadi turun ke jalur non-parametrik |
| Mann-Whitney U = 0 | Dua kelompok tidak tumpang tindih sama sekali, pemisahan sempurna |
| p = 0,0000108 | Peluang perbedaan sebesar ini muncul karena kebetulan hampir nol. Perbedaannya nyata |
| Kesimpulan | H0 ditolak, H1 diterima. Ada perbedaan efisiensi yang signifikan |

### H3 Kebergunaan

| Angka | Arti dalam bahasa manusia |
|---|---|
| Shapiro-Wilk pada selisih, p = 0,1753 | Selisih skornya kali ini cukup normal, jadi boleh pakai uji parametrik berpasangan |
| Paired t-test t = 6,982, p = 0,000215 | Uji utama. Perbedaan portal dan Proxmox nyata |
| Wilcoxon signed-rank W = 0, p = 0,0078 | Uji cadangan, dijalankan untuk memastikan. Hasilnya sama, tetap signifikan |
| Kesimpulan | H0 ditolak, H3 diterima. Ada perbedaan kebergunaan yang signifikan |

Perhatikan: H3 justru pakai dua uji sekaligus, dan itu disengaja. Uji utamanya paired t-test karena selisihnya normal. Wilcoxon ditambahkan sebagai konfirmasi supaya kesimpulan tidak bergantung pada satu uji saja. Kalau ada penguji ragu pada salah satunya, yang satunya sudah menjawab.

---

## Bagian 5: Daftar pertanyaan penguji dan jawaban siap-hafal

**"Kenapa datanya tidak normal, apa tidak diganti ujinya supaya lebih baik?"**
> Tidak normal itu keterangan bentuk data, bukan hasil yang buruk. Justru karena tidak normal, saya memakai uji non-parametrik yang memang dirancang untuk bentuk itu. Mengganti uji demi hasil yang lebih baik adalah p-hacking, dan saya menghindarinya. Hasil ujinya pun sudah signifikan, p sekitar 0,00001.

**"Kenapa H1 dan H3 pakai uji berbeda?"**
> Karena struktur datanya berbeda. H1 membandingkan dua kelompok mesin yang berbeda, jadi bebas, memakai Mann-Whitney U. H3 melibatkan orang yang sama menilai dua sistem, jadi berpasangan, memakai uji berpasangan. Saya memakai kerangka yang sama, yaitu cek normalitas lalu cocokkan uji dengan struktur data. Memaksakan satu uji untuk dua struktur berbeda justru keliru.

**"Kenapa respondennya cuma 8?"**
> Delapan responden ditetapkan sebelum satu pun skor dihitung. Alasannya statistik: pada uji berpasangan, jumlah di bawah 6 tidak mungkin mencapai signifikansi berapa pun bagusnya skornya. Delapan memberi ruang aman. Komposisi 5 pengguna biasa dan 3 administrator juga ditetapkan di muka.

**"Kenapa Mann-Whitney U bisa 0?"**
> Karena kedua kelompok tidak tumpang tindih sama sekali. Waktu portal yang paling lambat pun masih lebih cepat daripada waktu manual yang paling cepat. Nilai U mengukur seberapa banyak tumpang tindih, dan nol berarti tidak ada tumpang tindih.

**"Kenapa waktu cuma turun 27,83%, padahal target 50%?"**
> Karena 88,7% waktu penyediaan adalah waktu mesin, yaitu Terraform mengkloning lalu sistem operasi melakukan boot. Waktu itu ditentukan hypervisor dan perangkat kerasnya, dan aplikasi saya berjalan di atas hypervisor yang sama, jadi tidak mungkin lebih cepat dari mesinnya sendiri. Yang aplikasi pangkas adalah waktu perhatian manusia, dari 136,90 detik menjadi 11,20 detik, dan jumlah langkah dari 23 menjadi 10. Target 50% adalah indikator perancangan, bukan hipotesis, dan hipotesisnya sendiri diterima.

**"Angka-angka statistik ini dihitung pakai apa?"**
> (Jawab jujur sesuai yang kamu pakai nanti. Kalau pakai SPSS atau Jamovi, sebut itu, dan tunjukkan screenshot output-nya. Jangan bilang dihitung manual kalau tidak.)

---

## Catatan penting untuk kamu

Angka statistik di Bab IV sekarang masih hasil pratinjau Python. Sebelum sidang, jalankan ulang di SPSS atau Jamovi lalu pakai angka dari sana, dan simpan screenshot output-nya sebagai bukti. Aku masih punya utang mengajarimu cara menjalankan Shapiro-Wilk di SPSS. Ingatkan saja kalau internetmu sudah beres.
