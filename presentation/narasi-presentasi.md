# Narasi Presentasi: Infrastructure as Code (Terraform dan Ansible)

Skrip ini saya susun untuk dibacakan saat menjelaskan dua berkas pada slide IaC:
*main.tf* dan *hardening.yml*. Setiap bagian bisa diucapkan apa adanya. Petunjuk
dalam tanda kurung adalah arahan layar, bukan untuk dibacakan.

---

## 1. Pembuka

(tampilkan *main.tf* utuh di layar)

"Pada bagian ini saya menunjukkan bagaimana sistem mengubah satu permintaan dari
portal menjadi sebuah mesin virtual yang siap pakai. Saya memakai dua alat.
Terraform membangun VM-nya. Ansible mengeraskan keamanannya. Seluruh kontrak
Terraform saya rangkum dalam satu berkas, *main.tf*, supaya terbaca dalam satu
layar. Pada sistem nyata berkas ini terpecah menjadi provider, variabel, dan
resource, lalu portal merender satu workspace untuk tiap VM."

"Platform ini berdiri di atas satu jenis resource, yaitu *proxmox_vm_qemu*. Saya
memilihnya dengan sadar. Kekuatan rancangan ada pada cara saya mengendalikan
satu resource itu dengan aman, per VM, dan pada skala batch. Saya akan
menjelaskan sepuluh keputusan teknis di balik berkas ini."

---

## 2. Terraform: menelusuri main.tf

### 2.1 Provider terkunci dan state terisolasi (penanda 1 dan 2)

(tunjuk blok *terraform { required_providers }*)

"Saya mengunci satu versi provider Telmate, lalu membekukan plugin yang terkunci
itu ke dalam setiap workspace VM. Akibatnya, ketika saya menaikkan versi provider
di kemudian hari, VM lama tidak ikut direncanakan ulang. Keputusan ini saya catat
sebagai ADR-18."

"Setiap VM punya satu berkas state sendiri. Bayangkan satu batch sepuluh VM. Jika
satu clone gagal, sembilan VM lain tetap selesai. State tunggal untuk sepuluh VM
akan menyandera seluruh batch saat satu di antaranya bermasalah. Isolasi ini
salah satu bukti kematangan arsitektur yang saya ajukan."

### 2.2 Berbasis variabel, clone, dan cloud-init (penanda 3 dan 4)

(tunjuk blok *variable* dan baris *clone*, *ciuser*, *ipconfig0*)

"Isi *main.tf* tetap sama untuk semua VM dan semua resize. Yang berubah hanya
*terraform.tfvars*. Saat user meminta resize, portal menulis nilai baru lalu
apply ulang. Kode tidak saya sentuh. Pendekatan ini membuat satu kontrak melayani
seluruh armada VM."

"VM dibuat dengan clone dari template golden. Sesudah itu cloud-init mengatur
identitas: nama host, user login, kunci SSH, dan alamat lewat DHCP. Cloud-init
juga memperbesar disk boot ke ukuran tier pada boot pertama."

### 2.3 Disk terstruktur dan disk data dinamis (penanda 5 dan 6)

(tunjuk blok *disks { scsi { ... } }* dan blok *dynamic "scsi1"*)

"Versi lama provider memakai daftar disk biasa. Daftar itu tersimpan terurut
menurut bus, sehingga setiap penyuntingan menggeser urutan dan Terraform
merencanakan perubahan disk yang palsu. Saya memakai blok disk terstruktur yang
menamai tiap slot, dari *scsi0* dan seterusnya. Slot tetap pada tempatnya tanpa
perlu pengabaian berbasis indeks."

"Disk data tambahan memakai blok dinamis. Sebuah slot muncul hanya ketika ada
entri yang cocok, dan user menambah disk satu per satu lewat aksi yang melewati
gerbang persetujuan. Terraform hanya menempel block device mentah. Format dan
mount saya jadikan langkah manual admin agar tidak ada tindakan merusak data yang
berjalan diam-diam. Jumlah slot yang saya pasang adalah batas fisik keras."

### 2.4 Resize langsung tanpa reboot (penanda 7)

(tunjuk *automatic_reboot*, *hotplug*, *numa*, *balloon*)

"Empat baris ini membuat resize berjalan pada VM yang hidup. Saya mematikan
reboot otomatis supaya Terraform tidak me-restart VM berjalan hanya untuk
menerapkan perubahan. Saya menyalakan hotplug, mengaktifkan numa yang menjadi
syarat hotplug memori, dan mematikan ballooning yang bentrok dengan hotplug
memori. Hasilnya, penambahan CPU, RAM, dan disk berlaku tanpa reboot. Menaikkan
sumber daya berjalan live. Menurunkan RAM tetap memerlukan reboot, dan itu saya
sampaikan apa adanya."

### 2.5 Kendali drift dan konsol serial (penanda 8 dan 9)

(tunjuk *lifecycle { ignore_changes }* dan *serial { id = 0 }*)

"Keadaan runtime dipegang oleh lapisan discovery, bukan Terraform. Karena itu
saya meminta Terraform mengabaikan dua hal: alamat dari lease DHCP dan rotasi
kunci SSH. Tanpa pengabaian ini, Terraform akan terus melihat selisih dan
merencanakan ulang. Pengabaian saya batasi pada dua kolom itu. Perubahan ukuran
dan disk tetap terlacak."

"Satu baris serial menyelesaikan masalah konsol. Template cloud-image memakai
perangkat serial untuk tampilannya, tetapi Telmate tidak membawa perangkat itu ke
hasil clone. Akibatnya konsol noVNC dan perintah *qm terminal* rusak. Saya
deklarasikan ulang serial agar konsol kembali berfungsi."

### 2.6 Output ke inventory (penanda 10)

(tunjuk blok *output*)

"Di akhir berkas, Terraform mengembalikan dua nilai: id VM dan alamat IP. Job
provisioning membaca keduanya untuk mengisi baris Inventory pada portal. Inilah
jembatan dari hasil Terraform kembali ke basis data aplikasi."

---

## 3. Ansible: konfigurasi di dalam guest

(beralih ke *hardening.yml*)

"Terraform berhenti setelah VM berdiri. Konfigurasi di dalam sistem operasi saya
serahkan ke Ansible. Portal terhubung sebagai user cloud-init memakai kunci SSH
yang tadi disuntikkan Terraform, lalu menaikkan hak akses lewat sudo. Tidak ada
kata sandi yang ikut dalam proses."

"Playbook ini menjalankan sepuluh task yang idempoten dan hanya menyentuh
konfigurasi, tanpa instalasi paket dan tanpa internet. Isinya antara lain
penguncian SSH, pengerasan kernel lewat sysctl, banner peringatan, kebijakan usia
kata sandi, dan pembatasan izin berkas shadow. Semua task aman: tidak ada yang
mematikan user login, sudo, atau akses kunci, sehingga VM tetap bisa dijangkau."

"Setiap run menyimpan workspace, inventory, dan log eksekusi sendiri sebagai jejak
audit. Pembagian peran inilah yang ingin saya tegaskan: Terraform memegang daur
hidup VM, Ansible memegang konfigurasi di dalam guest."

---

## 4. Penutup

"Jadi satu jenis resource Terraform menjalankan seluruh platform, dan saya
mengendalikannya lewat sepuluh keputusan tadi: provider terkunci, state
terisolasi, kontrak berbasis variabel, clone dengan cloud-init, disk terstruktur,
disk data bergerbang, resize tanpa reboot, kendali drift, perbaikan konsol, dan
output yang mengisi inventory. Di atasnya, Ansible mengeraskan keamanan setiap
VM. Dua alat ini menutup jarak dari satu klik di portal sampai VM yang aman dan
siap pakai."

---

## 5. Antisipasi pertanyaan penguji

Jawaban singkat untuk pertanyaan yang mungkin muncul.

**T: Mengapa hanya satu jenis resource Terraform?**
"Karena alur kerja portal adalah menyediakan VM dari template, dan satu resource
*proxmox_vm_qemu* sudah mencakup seluruh daur hidup VM itu. Saya memilihnya
dengan sadar. Bobot rekayasa saya taruh pada cara mengendalikannya per VM dengan
aman, bukan pada menambah jenis resource."

**T: Mengapa memakai provider versi release candidate?**
"Versi 3.x adalah seri pertama yang membawa blok disk terstruktur, dan blok itu
menyelesaikan masalah pergeseran urutan disk pada versi lama. Risiko memakai rc
saya batasi dengan mengunci versi dan membekukannya per workspace, sesuai ADR-18."

**T: Bagaimana jika satu VM gagal di tengah batch sepuluh?**
"Karena tiap VM punya state dan workspace sendiri, kegagalan itu terisolasi.
Sembilan VM lain tetap selesai. State tunggal akan menghentikan seluruh batch."

**T: Mengapa Terraform tidak memformat dan mount disk data?**
"Terraform hanya menempel block device mentah. Format dan mount saya jadikan
langkah manual admin agar tidak ada operasi merusak data yang berjalan otomatis.
Karena itu tidak ada blok provisioner di sini."

**T: Apakah ignore_changes menyembunyikan drift yang berbahaya?**
"Tidak. Saya hanya mengabaikan alamat dari lease DHCP dan rotasi kunci SSH, dua
hal yang memang dimiliki lapisan discovery. Perubahan ukuran, disk, dan
konfigurasi lain tetap terlacak oleh Terraform."

**T: Apa beda peran Terraform dan Ansible di sini?**
"Terraform memegang daur hidup VM: clone, resize, dan hapus. Ansible memegang
konfigurasi di dalam guest seperti pengerasan keamanan. Pemisahan tanggung jawab
ini membuat tiap alat fokus pada satu pekerjaan."

**T: Mengapa kata sandi awal dipaksa diganti pada login pertama?**
"Supaya admin tidak pernah tahu kata sandi akhir. User menjadi satu-satunya
pemilik. Portal tidak menerima dan tidak menyimpan kata sandi baru itu, sebuah
sifat zero-knowledge yang memperkuat sisi keamanan."

**T: Mengapa automatic_reboot dimatikan?**
"Agar Terraform tidak me-reboot VM berjalan hanya untuk menerapkan perubahan.
Resize berjalan live lewat hotplug. Numa menjadi syarat hotplug memori, dan
ballooning saya matikan karena bentrok dengannya."

**T: Bagaimana keamanan kredensial Proxmox?**
"Saya memakai API token bercakupan, bukan kata sandi root. Pada produksi token
datang dari environment variable dan tidak ditulis ke berkas."
