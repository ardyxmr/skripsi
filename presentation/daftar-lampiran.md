# Daftar Lampiran — Draf untuk Ditempel ke Word

Format front matter: nomor lampiran, judul, titik penuntun, nomor halaman. Urutan front matter: Daftar Gambar → Daftar Kode Program → **Daftar Lampiran**.

Item di bawah diurutkan menurut kemunculan pertamanya di teks. Kamu tinggal isi nomor halaman dan sesuaikan bila ada yang kurang.

---

## DAFTAR LAMPIRAN

| Lampiran | Judul | Hal. |
|---|---|---|
| Lampiran 1 | Instrumen kuesioner *System Usability Scale* (SUS) | ... |
| Lampiran 2 | Rekap jawaban SUS tiap responden | ... |
| Lampiran 3 | Notebook perhitungan statistik (Colab): kode dan output uji | ... |
| Lampiran 4 | Kode sumber Terraform (`main.tf`, `variables.tf`, `provider.tf`) | ... |
| Lampiran 5 | *Playbook* Ansible *hardening* | ... |
| Lampiran 6 | Ketersediaan kode sumber aplikasi (repositori privat) | ... |

**Ditahan dulu (belum diminta, tambahkan bila prodi meminta):** surat keterangan atau izin penelitian, dan hasil uji plagiarisme (Turnitin).

*(Nomor halaman diisi setelah tata letak final. Di Word, tandai tiap halaman lampiran dengan Heading atau Caption, lalu daftar ini bisa diperbarui otomatis.)*

---

# Catatan penyusunan

## Aturan yang perlu dijaga
- **Urutkan menurut kemunculan pertama di teks.** Lampiran 1 dirujuk paling awal (Bab III metode), Lampiran 6 dan 7 tidak dirujuk sehingga diletakkan terakhir
- **Tiap lampiran harus dirujuk minimal sekali** di badan, misalnya "instrumen selengkapnya pada Lampiran 1". Kalau sebuah lampiran tidak pernah disebut, hapus atau tambahkan rujukannya
- **Penomoran konsisten.** Pilih "Lampiran 1, 2, 3" atau "Lampiran A, B, C", satu gaya di seluruh dokumen. Draf ini pakai angka

## Isi tiap lampiran
| Lampiran | Isi | Sumber yang sudah ada |
|---|---|---|
| 1 | Sepuluh butir SUS + skala 1–5 | `bab4-sus-kuesioner.md` |
| 2 | Tabel L.1 dan L.2, jawaban 1–5 R1–R8 | `lampiran-sus-rekap.md` (sudah terisi) |
| 3 | Notebook Colab penuh (kode + output), ekspor PDF. BUKAN capture ulang Tabel 4.11/4.12 yang sudah di badan | `bab4-statistik-colab.ipynb` |
| 4 | Isi berkas Terraform, Courier New 10 | `lampiran-terraform.md` (siap tempel) |
| 5 | Isi *playbook* hardening | `lampiran-ansible.md` (siap tempel) |
| 6 | URL repositori privat + cara meminta akses kontributor | teks siap tempel di bawah |
| 7 | Pindaian surat dari kampus atau tempat penelitian | dokumen fisik |
| 8 | Tangkapan hasil Turnitin atau sejenis | bila diminta |

## Yang sengaja TIDAK jadi lampiran
- **Pengujian black box.** Seluruh 40 skenario sudah didokumentasikan di badan Bab IV dengan Gambar 4.4 sampai 4.43, jadi lampiran black box hanya akan mengulang
- **Data pembanding VMware.** Tidak ada surat izin, dan sumbernya minta instansinya tidak disebut. Datanya tetap di badan subbab 4.8.5 sebagai pembanding deskriptif anonim, bukan lampiran tersendiri
- **Kode sumber aplikasi tidak dicetak penuh.** Backend Laravel dan frontend React terlalu besar untuk dicetak. Aplikasi diwakili tiga lapis: cuplikan kunci di badan (Kode 4.1 sampai 4.4), dan sumber lengkapnya pada repositori privat (Lampiran 6). Hanya kode IaC yang dicetak penuh, yaitu Lampiran 4 dan 5

## Perlu kamu putuskan
- **Lampiran 3 (data waktu + uji statistik) berpeluang ikut mengulang.** Data mentah waktu sudah ada di badan (Tabel 4.11 dan 4.12), dan hasil ujinya sudah tampil sebagai Gambar 4.52, 4.53, dan 4.60. Pertahankan Lampiran 3 hanya kalau kamu ingin melampirkan notebook Colab penuh sebagai bukti hitung ulang. Kalau tidak, boleh dihapus seperti black box

---

# Teks Lampiran 6 — siap tempel

## LAMPIRAN 6. KETERSEDIAAN KODE SUMBER APLIKASI

Kode sumber lengkap aplikasi ExoVirt, meliputi backend Laravel dan frontend React beserta berkas konfigurasi deployment, disimpan pada repositori privat di alamat berikut.

**`https://github.com/ardyxmr/exovirt`**

Repositori bersifat privat karena aplikasi berjalan pada lingkungan produksi. Akses baca diberikan kepada dosen pembimbing dan penguji atas permintaan. Pemohon menghubungi peneliti secara langsung, lalu peneliti memberikan akses baca yang terbatas waktu. Rincian akses, seperti token atau undangan, tidak dicantumkan pada naskah demi menjaga keamanan repositori.

Struktur direktori utama repositori:

| Direktori | Isi |
|---|---|
| `backend/` | Laravel: API, layanan, pekerjaan antrean, model, dan template Terraform master pada `storage/app/master-provisioning/` |
| `frontend/` | React dan Vite: antarmuka pengguna |
| `deploy/` | Konfigurasi Nginx, systemd, dan Redis |
| `docs/` | Panduan deployment |
| `terraform/` | Contoh definisi Terraform |
| `Harden-script/` | Playbook Ansible hardening |

Potongan kode terpenting ada langsung di badan sebagai Kode 4.1 sampai Kode 4.4. Kode Terraform dan playbook Ansible dicetak penuh pada Lampiran 4 dan Lampiran 5.

*(Catatan: beri penguji akses baca lebih awal sebelum sidang supaya mereka sempat menelusuri kode. Jangan menjadikan repositori publik karena aplikasi berjalan di produksi, dan jangan mencantumkan token atau tautan berkredensial di naskah.)*
