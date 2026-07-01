# Narasi Bab 3 — Versi High-Level (Perancangan)

Narasi pendamping untuk diagram versi high-level pada folder ini. Nada penulisan
adalah rancangan, bukan laporan hasil. Angka dan detail operasional ditegaskan
pada Bab 4.

---

## 3.5.1 Arsitektur Sistem

Sistem dirancang berlapis dan terdiri atas frontend React, backend Laravel, basis
data PostgreSQL, layanan real-time Reverb, serta integrasi ke Terraform, Ansible,
dan Proxmox VE. Backend mengakses provider hanya melalui satu lapisan driver, yaitu
abstraksi *ProviderDriver* yang dipilih oleh *ProviderFactory* berdasarkan tipe
provider, sehingga penambahan tipe provider baru tidak mengubah lapisan orkestrasi,
kebijakan, persetujuan, maupun siklus hidup. Setiap permintaan provisioning dirancang
memakai direktori kerja dan state Terraform yang terpisah agar prosesnya berjalan
independen tanpa konflik state. Gambar 3.2 menyajikan arsitektur sistem.

[Gambar 3.2 Arsitektur Sistem]

Arsitektur tersusun atas enam lapisan, yaitu klien, edge, aplikasi, eksekusi
asinkron, data, dan infrastruktur eksternal. Pemisahan lapisan ini memisahkan
tanggung jawab antarmuka pengguna, orkestrasi, eksekusi berdurasi panjang, dan
penyimpanan, sehingga tiap lapisan dapat dikembangkan dan diuji terpisah. Pada
lapisan klien dan edge, antarmuka pengguna berupa aplikasi React atau *Single Page
Application* (SPA) yang berjalan di peramban, dan seluruh trafik melewati nginx
sebagai reverse proxy dengan skema same-origin. Skema ini dirancang memungkinkan
autentikasi berbasis cookie tanpa menyimpan token pada sisi klien.

Pada lapisan aplikasi, inti sistem adalah *Application Programming Interface* (API)
Laravel bergaya *Representational State Transfer* (REST) beserta layanan domain, yaitu
Provisioning, Approval, Lifecycle, dan Audit. Akses ke provider dipusatkan pada
lapisan Discovery melalui *ProviderFactory* yang memilih implementasi *ProviderDriver*
sesuai tipe provider; pada penelitian ini implementasinya adalah *ProxmoxProvider* yang
bersifat hanya-baca. Server Reverb berada pada lapisan yang sama dan bertugas mendorong
pembaruan real-time ke klien.

Operasi yang memanggil Proxmox, seperti clone template, perubahan sumber daya,
penghapusan, dan hardening, berdurasi panjang sehingga tidak dijalankan inline oleh
API. Sistem dirancang mengirim pekerjaan tersebut ke antrian, lalu worker mengambil
dan mengeksekusinya secara asinkron; Terraform menangani siklus hidup mesin virtual,
sedangkan Ansible menangani konfigurasi di dalam guest. Rancangan ini memungkinkan
beberapa proses provisioning berjalan paralel tanpa memblokir API, dengan batas
paralelisme yang ditetapkan pada tahap implementasi dan diuji pada Bab IV.

Pada lapisan data, PostgreSQL menjadi sumber kebenaran transaksional, sedangkan Redis
dipakai dengan dua peran terpisah, yaitu sebagai cache dan sebagai penyimpan antrian,
sesi, serta kanal pub/sub. Pemisahan peran ini dirancang agar pekerjaan dan sesi
pengguna tidak ikut tergusur ketika cache penuh. Pada lapisan infrastruktur eksternal,
Proxmox VE menjadi target orkestrasi; lapisan Discovery membacanya melalui API hanya-baca
dan mencerminkannya ke basis data, sedangkan setelah provisioning worker menuliskan fakta
runtime berupa vmid, alamat *Internet Protocol* (IP), dan status daya kembali ke inventaris.

Dua keputusan desain menopang arsitektur ini. Pertama, seam *ProviderDriver* menjadikan
provider sebagai satu titik kontak, sehingga penambahan hypervisor lain dilakukan dengan
menulis implementasi driver baru tanpa mengubah lapisan orkestrasi, kebijakan, persetujuan,
maupun siklus hidup. Kedua, isolasi direktori kerja dan state Terraform per mesin virtual
dirancang agar kegagalan satu apply tidak merusak state mesin virtual lain dan memungkinkan
batch berjalan paralel. Kedua properti ini menjadi dasar klaim ekstensibilitas dan
skalabilitas yang dibahas pada Rumusan Masalah 1 dan Rumusan Masalah 3.

---

## 3.5.2 Pemodelan UML

Gambar 3.7 menyajikan sequence diagram provisioning mesin virtual dari submit
permintaan hingga mesin virtual siap. Partisipan mencakup Pengguna, Frontend, API
Laravel, basis data, antrian pekerjaan, worker, Proxmox, dan server Reverb.

Alur dimulai ketika pengguna mengisi wizard dan Frontend mengirim permintaan ke
endpoint provision-requests. API memvalidasi permintaan terhadap kebijakan
environment, yaitu daftar izin provider, node, dan tier. Rancangan memuat dua cabang.
Bila environment mewajibkan persetujuan dan pengguna bukan peran istimewa, sistem
menyimpan permintaan beserta entri persetujuan berstatus menunggu, lalu alur berlanjut
pada Gambar 3.8. Bila pengguna berperan istimewa atau environment tidak mewajibkan
persetujuan, sistem langsung mengirim pekerjaan provisioning ke antrian.

Setiap permintaan dipecah menjadi satu pekerjaan per instance. Worker mengambil
pekerjaan dari antrian, meresolusi sumber daya, menyiapkan direktori kerja Terraform
yang terpisah untuk tiap mesin virtual, lalu menjalankan Terraform untuk clone template
beserta cloud-init pada Proxmox. Setelah mesin virtual siap, worker memperbarui status
inventaris menjadi aktif dan menyiarkan event perubahan status yang diteruskan server
Reverb ke klien, sehingga antarmuka diperbarui tanpa polling. Rancangan satu pekerjaan
per instance beserta direktori kerja terpisah ini dimaksudkan agar beberapa proses
provisioning berjalan paralel tanpa saling mengganggu.

[Gambar 3.7 Sequence Diagram Provisioning Mesin Virtual]

Gambar 3.8 menyajikan sequence diagram keputusan persetujuan. Partisipan mencakup
Approver, Frontend, API Laravel, basis data, antrian pekerjaan, dan server Reverb.

Approver membuka halaman persetujuan, dan sistem menampilkan daftar permintaan
berstatus menunggu yang disaring sesuai peran. Approver memilih satu permintaan lalu
menekan Setujui, Tolak, atau Kembalikan disertai alasan. Sistem mencatat keputusan
beserta jejak audit, lalu menyiarkan notifikasi perubahan status melalui server Reverb
sehingga daftar persetujuan diperbarui tanpa muat ulang.

Rancangan memuat cabang untuk tiap keputusan. Pada persetujuan, sistem menjalankan
permintaan sesuai jenisnya: permintaan pembuatan mesin virtual dipecah menjadi satu
pekerjaan per instance, permintaan perubahan terhadap mesin virtual aktif dijalankan
sebagai satu pekerjaan, sedangkan perpanjangan dan penetapan permanen diterapkan sebagai
pembaruan data tanpa pekerjaan asinkron. Pada penolakan, permintaan tidak dijalankan.
Aksi Kembalikan berlaku khusus untuk permintaan pembuatan mesin virtual dan
mengembalikannya menjadi draf yang siap diedit ulang.

[Gambar 3.8 Sequence Diagram Approval Request]

Gambar 3.9 memperinci rancangan proses internal satu pekerjaan provisioning, dari
resolusi sumber daya hingga sinkronisasi fakta mesin virtual. Diagram ini melengkapi
Gambar 3.7 dengan menampilkan lapisan layanan internal. Partisipan mencakup worker,
resolusi sumber daya, penyiapan direktori kerja, eksekusi Terraform, Proxmox, basis
data, antrian pekerjaan, dan server Reverb.

Worker memuat permintaan beserta sumber daya terpublikasi, lalu meresolusi katalog,
node, jaringan, datastore, dan tier menjadi identitas teknis provider berupa template,
bridge, dan storage. Resolusi ini dirancang memisahkan identitas ramah pengguna dari
identitas teknis provider. Worker kemudian menyiapkan direktori kerja yang terpisah
untuk mesin virtual tersebut, sehingga tiap mesin virtual memperoleh direktori kerja
dan state Terraform sendiri dan eksekusi satu mesin virtual tidak memengaruhi yang lain.

Terraform menjalankan apply terhadap Proxmox untuk clone template menjadi vmid baru,
menulis konfigurasi cloud-init berupa pengguna, kunci SSH, jaringan, dan hostname, lalu
menyalakan mesin virtual. Proxmox mengembalikan vmid baru dan alamat IP awal. Rancangan
memuat dua cabang hasil. Pada keberhasilan, worker memperbarui status inventaris menjadi
aktif beserta vmid, alamat IP, dan kredensial login terenkripsi, menjadwalkan sinkronisasi
fakta untuk mengejar alamat IP yang dilaporkan agen tamu setelah mesin virtual selesai
boot, dan menyiarkan event perubahan status. Pada kegagalan, worker menandai status
menjadi gagal beserta pesan kesalahan dan menyiarkan event perubahan status.

[Gambar 3.9 Sequence Diagram Eksekusi Terraform ke Proxmox VE]
