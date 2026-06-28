# Contoh Presentasi: Terraform dan Ansible

Dua berkas menjadi dasar slide "Infrastructure as Code":

- *main.tf* memuat seluruh kontrak provisioning dalam satu berkas (provider,
  variabel, resource *proxmox_vm_qemu*, dan output).
- *hardening.yml* memuat playbook Ansible yang mengonfigurasi VM setelah
  Terraform membangunnya.

Keduanya berasal langsung dari sistem yang berjalan. Perintah *terraform fmt*
dan *ansible-playbook --syntax-check* lolos pada kedua berkas.

> Untuk skrip presentasi yang bisa langsung dibacakan ke dosen dan penguji,
> lihat *narasi-presentasi.md*.

## Platform berjalan di atas satu resource Terraform

Setiap VM adalah *proxmox_vm_qemu* hasil clone dari template golden cloud-init.
Kontribusi tesis terletak pada cara portal mengendalikan satu resource itu
dengan aman, per VM, dan pada skala batch. Jumlah jenis resource bukan
ukurannya. Setiap poin di bawah memiliki penanda [n] di dalam *main.tf*.

| # | Tantangan | Letak di kode | Yang saya sampaikan |
|---|-----------|---------------|---------------------|
| 1 | Pinning provider | blok *terraform { required_providers }* | Saya mengunci satu versi provider dan membekukan plugin-nya di tiap workspace, sehingga upgrade provider tidak merencanakan ulang VM lama (ADR-18). |
| 2 | Isolasi state | satu resource per workspace | Satu VM satu state. Satu clone gagal di antara sepuluh tidak mengganggu sembilan lainnya. State tunggal akan menyandera seluruh batch. |
| 3 | Berbasis variabel | blok *variable* | *main.tf* tetap sama untuk semua VM. Portal menulis *terraform.tfvars* baru lalu apply ulang. Resize mengubah nilai, bukan kode. |
| 4 | Clone dan cloud-init | *clone*, *ciuser*, *ipconfig0* | Clone template, lalu cloud-init mengatur hostname, user, kunci, dan memperbesar disk boot pada boot pertama. |
| 5 | Disk terstruktur | *disks { scsi { ... } }* | Daftar *disk* lama Telmate berubah urutan di state dan memunculkan rencana palsu. Slot bernama tetap pada tempatnya. |
| 6 | Disk data dinamis | *dynamic "scsi1"* | Disk data menempel satu per satu lewat aksi bergerbang persetujuan. Jumlah slot yang terpasang menjadi batas keras. |
| 7 | Hotplug langsung | *automatic_reboot*, *hotplug*, *numa*, *balloon* | Resize CPU, RAM, dan disk pada VM hidup tanpa reboot. Menaikkan berjalan live; menurunkan RAM tetap perlu reboot. |
| 8 | Kendali drift | *lifecycle { ignore_changes }* | Discovery yang memegang keadaan runtime. Terraform mengabaikan lease DHCP dan rotasi kunci agar tidak memicu rencana ulang. |
| 9 | Konsol serial | *serial { id = 0 }* | Telmate membuang perangkat serial template saat clone sehingga konsol rusak. Deklarasi ulang memulihkan noVNC dan *qm terminal*. |
| 10 | Output | *output "vmid"*, *output "default_ipv4"* | Job provisioning membaca nilai ini untuk mengisi baris Inventory. |

## Lalu Ansible mengambil alih

Terraform membangun VM. *hardening.yml* mengonfigurasinya. Portal terhubung
sebagai user cloud-init memakai kunci SSH yang disuntikkan Terraform, menaikkan
hak akses lewat sudo, dan menjalankan sepuluh task idempoten tanpa instalasi
paket (penguncian SSH, sysctl, banner, izin berkas shadow, dan lainnya). Tidak
ada kata sandi yang ikut dalam proses. Setiap run menyimpan workspace,
inventory, dan log eksekusi sendiri untuk jejak audit.

Pembagian dua alat yang layak diucapkan di depan penguji: Terraform memegang
daur hidup VM, Ansible memegang konfigurasi di dalam guest.
