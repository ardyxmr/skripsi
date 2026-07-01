# Peta Kode — Panduan Bedah Code untuk Sidang

Dokumen ini bukan penjelasan tiap file satu per satu. Ini contekan untuk kamu sendiri
saat penguji minta "tunjukkan di code-nya". Penguji sebut satu fitur, kamu langsung tahu
file dan barisnya. Semua referensi di bawah sudah dicocokkan dengan code yang berjalan
(path relatif dari root project; backend Laravel ada di `backend/`).

## Cara pakai saat sidang

1. Kuasai **satu** alur dulu: Alur Provisioning di bawah. Latih sampai bisa cerita tanpa baca.
2. Fitur lain (approval, resize, hapus, hardening) polanya sama: Controller → Service → Job → Terraform/Ansible. Tinggal ganti nama Job.
3. Setiap diagram di Bab III sudah dipetakan ke file nyata. Diagram = peta, code = wilayahnya.

---

## 1. Peta lapisan (arsitektur besar)

| Lapisan | Lokasi | Isi |
|---|---|---|
| Frontend (SPA React) | `frontend/src/pages/` | Wizard, Inventory, Approvals, Settings |
| Rute API | `backend/routes/api.php` | Semua endpoint, dijaga Sanctum + role |
| Controller | `backend/app/Http/Controllers/Api/` | Validasi request, panggil Service |
| Service (logika bisnis) | `backend/app/Services/` | Aturan approval, kebijakan, lifecycle |
| Job (kerja async) | `backend/app/Jobs/` | Provision, Resize, Harden, Destroy, Sync |
| Provisioning engine | `backend/app/Services/Provisioning/` | Terraform + Ansible runner, workspace |
| Discovery (abstraksi provider) | `backend/app/Services/Discovery/` | Driver seam Proxmox, discovery |
| Event real-time | `backend/app/Events/` | VmStateChanged, ApprovalChanged (Reverb) |
| Model / ORM | `backend/app/Models/` | Entitas Eloquent (padanan tabel ERD) |
| Proses berjalan | `scripts/backend.sh` | serve :8000, reverb :8080, worker1-4, worker_sys |

---

## 2. Alur inti: Provisioning VM (hafalkan yang ini)

Alur dari pengguna klik "Ajukan" di wizard sampai VM jadi dan tampil real-time.
Ini menjawab Sequence Diagram **Gambar 3.7** dan **3.9**, Activity **Gambar 3.4**, Arsitektur **Gambar 3.2**.

| # | Langkah | File : baris | Keterangan |
|---|---|---|---|
| 1 | Wizard submit | `frontend/src/pages/VmRequest.jsx:249` | `api.post('/provision-requests', payload)` |
| 2 | Rute API | `backend/routes/api.php:44` | `POST provision-requests` → `store` |
| 3 | Controller | `ProvisionRequestController.php:16` | Validasi input, panggil Service |
| 4 | **Gerbang approval** | `ProvisionRequestService.php:38` dan `:40` | `$env->approval_required && ! $actor->isPrivileged()` |
| 5a | Perlu approval | `ProvisionRequestService.php:53` | Buat ApprovalRequest, status `pending_approval` |
| 5b | Tidak perlu (admin/manager) | `ProvisionRequestService.php:64` | Langsung `dispatchProvisioning()` |
| 6 | **Fan-out per VM** | `ProvisionRequestService.php:118`–`129` | Satu `ProvisionVmJob` per instance (ADR-08) |
| 7 | Job jalan di worker | `scripts/backend.sh:34`–`37` | worker1-4, antrian `redis` default, paralel |
| 8 | Resolusi resource | `ProvisionVmJob.php:50` → `ResourceResolutionService.php:27` | Tier, katalog, jaringan, datastore |
| 9 | **Password sekali-pakai** | `ResourceResolutionService.php:42` | `Str::password(20,...)`, disimpan terenkripsi |
| 10 | **Workspace per-VM** | `ProvisionVmJob.php:51` → `WorkspaceService.php:34` | State Terraform terisolasi per VM (ADR-08) |
| 11 | Catat inventory | `ProvisionVmJob.php:80` | `Inventory::create`, status Provisioning |
| 12 | **Terraform apply** | `ProvisionVmJob.php:107` → `TerraformRunner.php:18` | Panggil API Proxmox, clone + cloud-init |
| 13 | Ambil hasil (vmid) | `ProvisionVmJob.php:119`,`124` → `TerraformRunner.php:48` | `external_vmid` masuk inventory |
| 14 | Sinkron fakta VM | `ProvisionVmJob.php:146` → `SyncVmFactsJob.php:49` | Antrian `system` terpisah (worker_sys) |
| 15 | **Push real-time** | `app/Events/VmStateChanged.php:22`,`:40` | `ShouldBroadcast` → Reverb :8080 → Echo di frontend |

Kalimat kunci untuk diucapkan: "Satu permintaan N VM difan-out jadi N job yang jalan
paralel, masing-masing punya workspace Terraform sendiri, jadi kalau satu VM gagal, yang
lain tetap selesai." Ini keunggulan arsitektur paling kuat (isolasi kegagalan, ADR-08).

---

## 3. Fitur lain → Diagram → File (pola sama)

| Fitur | Diagram (Gambar) | Titik masuk | Logika inti |
|---|---|---|---|
| Approval (setuju/tolak/kembalikan) | 3.5, 3.8 | `routes/api.php:68`–`70` → `ApprovalController.php:59/64/69` | `ApprovalWorkflowService.php:23` (`act`); revert khusus PROVISION `:35` |
| Terapkan hasil approval | 3.8 | `ApprovalController.php:77` | PROVISION → `dispatchProvisioning`; lifecycle → `LifecycleService.php:69` |
| Edit Resources (CPU/RAM/disk) | 3.6 | `routes/api.php:59` → `InventoryController.php:184` | `LifecycleService.php:118` → `EditResourcesVmJob` |
| Resize | 3.6 | `routes/api.php:58` → `InventoryController.php:162` | `LifecycleService.php:113` → `ResizeVmJob` |
| Tambah disk data | 3.6 | `routes/api.php:62` → `InventoryController.php:243` | `LifecycleService.php:123` → `AddDiskJob` |
| Hardening (Stage 8, Ansible) | 3.6 | `routes/api.php:60` → `InventoryController.php:129` | `HardenVmJob.php:33` → `AnsibleRunner.php:17` (SSH key-based) |
| Hapus VM | 3.6 | `routes/api.php:61` → `InventoryController.php:229` | `LifecycleService.php:128` → `DestroyVmJob` |
| Perpanjang / permanen | 3.6 | `routes/api.php:56`,`57` | `LifecycleService.php:80`–`105` (tulis DB sinkron, tanpa job) |
| Reveal kredensial (zero-knowledge) | — | `routes/api.php:54` → `InventoryController.php:51` | `authorizeView` + audit `VIEW_CREDENTIALS:54` + dekripsi `:58` |
| Discovery / seam multi-provider | 3.12 | `routes/api.php:121` → `ProviderController@discover` | `ProviderFactory.php:10` (`match provider_type` `:12`) → `ProxmoxProvider` |
| Kebijakan Environment (3-way) | 3.12, 3.13 | `ProvisionRequestService.php:134` (`validatePolicy`) | Allow-list provider/node/tier; `checkNodeResource:175` |

---

## 4. Keputusan desain → bukti di code (jawaban "kenapa begini")

Penguji sering tanya "kenapa dirancang begitu". Ini yang tersulit dan paling menentukan.

| Pertanyaan | Jawaban singkat | Bukti |
|---|---|---|
| Kenapa satu workspace Terraform per VM? | Isolasi kegagalan + resize per-VM lewat tfvars, tanpa state monolitik yang bisa rusak sebatch. | `WorkspaceService.php:34`, `ProvisionVmJob.php:51` (ADR-08) |
| Kenapa admin/manager bypass approval? | Peran istimewa dianggap sudah terverifikasi; kebijakan ada di satu tempat agar tidak melenceng. | `ProvisionRequestService.php:40` |
| Kenapa provider pakai interface + factory? | Kontribusi arsitektur: bisa tambah hypervisor lain tanpa ubah alur inti (Proxmox = impl referensi). | `ProviderDriver.php:11`, `ProviderFactory.php:10` |
| Kenapa password tidak pernah dipegang portal? | Password awal sekali-pakai; pengguna ganti saat login pertama, portal tak pernah tahu. Klaim STRIDE. | `ResourceResolutionService.php:42`, `InventoryController.php:51` (audit) |
| Kenapa ada antrian `system` terpisah? | Job ringan (sync/broadcast) tidak antre di belakang Terraform yang berat. | `SyncVmFactsJob.php:49`, `scripts/backend.sh:38` |
| Kenapa broadcast queued (bukan `...Now`)? | Reverb mati/lambat tidak boleh menggagalkan transaksi bisnis. | `app/Events/VmStateChanged.php:22` |

---

## 5. Kalau ditanya sesuatu yang belum kamu hafal

1. Buka `routes/api.php` dulu. Cari endpoint fiturnya. Baris itu menunjuk Controller + method.
2. Dari Controller, cari pemanggilan Service (biasanya baris awal method).
3. Kalau kerjanya async, Service memanggil `SomethingJob::dispatch(...)`. Buka Job itu, method `handle()`.
Tiga langkah ini berlaku untuk hampir semua fitur. Tunjukkan kamu bisa menelusuri, bukan menghafal.

---

## 6. Antisipasi pertanyaan penguji (bedah code)

Format: pertanyaan, jawaban lisan orang-pertama, lalu baris yang bisa kamu tunjuk di layar.
Ucapkan jawaban dengan tenang, lalu buka file yang disebut.

### Alur dan arsitektur

**T: Coba jelaskan alurnya dari user klik sampai VM jadi.**
"Wizard mengirim permintaan ke satu endpoint. Controller memvalidasi, lalu Service
menentukan perlu approval atau tidak. Kalau lolos, permintaan dipecah jadi beberapa job
yang jalan di worker. Tiap job memanggil Terraform untuk membuat VM, lalu hasilnya
disinkronkan dan didorong ke UI secara real-time."
Tunjuk ke: alur lengkap ada di bagian 2 dokumen ini, mulai *VmRequest.jsx:249*.

**T: Kenapa provisioning pakai job antrian, bukan diproses langsung saat request?**
"Satu apply Terraform butuh satu sampai dua menit. Kalau saya proses di dalam request HTTP,
pengguna menunggu lama dan koneksi bisa timeout. Saya lempar ke antrian supaya request
langsung balas, dan pekerjaan berat jalan di latar oleh worker."
Tunjuk ke: *ProvisionRequestService.php:118* (dispatch), *ProvisionVmJob.php:37* (handle), *scripts/backend.sh:34*.

**T: Kalau user minta sepuluh VM sekaligus, bagaimana?**
"Satu permintaan saya fan-out jadi sepuluh job terpisah, masing-masing punya nama dan
workspace Terraform sendiri. Empat worker menjalankannya paralel. Kalau satu gagal, sembilan
lainnya tetap selesai karena state-nya terisolasi."
Tunjuk ke: *ProvisionRequestService.php:129*, *WorkspaceService.php:34*.

### Keamanan dan tata kelola

**T: Bagaimana memastikan seorang user hanya melihat VM miliknya?**
"Setiap pembacaan inventory lewat satu penjaga yang membatasi berdasarkan pemilik. Kalau VM
bukan miliknya dan dia bukan manajer atau admin, sistem menjawab tidak ditemukan, bukan
sekadar ditolak, supaya keberadaan VM itu pun tidak bocor."
Tunjuk ke: *InventoryController.php:341* (*authorizeView*), *:308* (*authorizeActionable*).

**T: Siapa yang boleh menyetujui permintaan? Bagaimana ditegakkan?**
"Persetujuan dibatasi peran lewat middleware di level rute, bukan cuma disembunyikan di UI.
Rute approve, reject, dan revert hanya bisa diakses Manajer dan Administrator."
Tunjuk ke: *routes/api.php:66* (*role:Manager,Administrator*), *ApprovalWorkflowService.php:23*.

**T: Autentikasinya pakai apa?**
"Saya memakai Sanctum dengan model SPA berbasis cookie. Sesi disimpan di cookie HttpOnly, jadi
tidak ada token yang dipegang JavaScript di sisi klien, dan itu mengurangi risiko pencurian
token lewat XSS."
Tunjuk ke: *bootstrap/app.php:27* (*auth:sanctum*), *:32* (*statefulApi*).

**T: Bagaimana kata sandi VM diamankan?**
"Kata sandi awal dibuat unik per VM dan disimpan terenkripsi lewat cast model. Ia hanya bisa
dibuka oleh pemilik atau admin, dan setiap pembukaan tercatat di audit. Karena login pertama
memaksa ganti sandi, portal tidak pernah tahu sandi akhirnya."
Tunjuk ke: *ResourceResolutionService.php:42* (generate), *InventoryController.php:51* (reveal + audit *:54*).

**T: Bagaimana mencegah user meminta di luar kebijakan, misalnya tier yang tak diizinkan?**
"Sebelum dispatch, Service memvalidasi permintaan terhadap kebijakan environment: provider,
node, dan tier harus ada di allow-list. Jaringan dan datastore mengikuti node. Validasi ada di
sisi server, jadi tidak bisa diakali dari frontend."
Tunjuk ke: *ProvisionRequestService.php:134* (*validatePolicy*), *:175* (*checkNodeResource*).

**T: Apakah tindakan pengguna terekam?**
"Ya. Tindakan penting seperti membuka kredensial, menyetujui, dan mengubah VM ditulis ke log
audit lewat satu service khusus, dan hanya admin yang bisa membacanya."
Tunjuk ke: *AuditService.php*, contoh pemakaian *InventoryController.php:54*.

### Asinkron, antrian, dan kegagalan

**T: Kenapa ada dua antrian, default dan system?**
"Job berat provisioning jalan di antrian default. Job ringan seperti sinkronisasi fakta dan
siaran real-time saya taruh di antrian system dengan worker sendiri, supaya notifikasi tidak
antre di belakang apply Terraform yang lama."
Tunjuk ke: *SyncVmFactsJob.php:49* (*onQueue('system')*), *scripts/backend.sh:38* (*worker_sys*).

**T: Kalau worker mati atau job gagal di tengah jalan?**
"Job dikonfigurasi satu percobaan tanpa ulang otomatis, supaya tidak ada risiko VM ganda. Kalau
apply gagal, VM ditandai gagal beserta pesan errornya, dan pengguna bisa menekan Retry. Supervisi
otomatis dengan Horizon saya catat sebagai pekerjaan lanjutan di Bab V."
Tunjuk ke: *scripts/backend.sh:34* (*--tries=1*), *InventoryController.php:86* (*retry*).

### Real-time

**T: Bagaimana UI ter-update tanpa refresh manual?**
"Saat status VM berubah, sistem memancarkan event yang disiarkan lewat WebSocket Reverb, dan
frontend berlangganan lewat Echo. Event ini disiarkan lewat antrian, jadi seandainya Reverb mati,
transaksi bisnis tetap aman dan tidak ikut gagal."
Tunjuk ke: *app/Events/VmStateChanged.php:22* (*ShouldBroadcast*), *:40* (*broadcastOn*).

### Abstraksi dan perluasan

**T: Kalau nanti mau mendukung hypervisor lain selain Proxmox?**
"Lapisan discovery memakai antarmuka driver dengan pola factory. Menambah hypervisor lain berarti
menulis satu kelas driver baru dan mendaftarkannya di factory, tanpa mengubah alur inti. Proxmox
adalah implementasi referensinya. Dukungan hypervisor lain sendiri saya nyatakan sebagai pekerjaan
lanjutan, bukan yang sudah jadi."
Tunjuk ke: *ProviderDriver.php:11* (interface), *ProviderFactory.php:10* dan *:12*.

**T: Apa bedanya tabel provider_* dengan tabel published seperti catalogs?**
"Tabel provider_* adalah cermin mentah hasil discovery dari Proxmox. Tabel published adalah
katalog terkurasi yang admin pilih untuk ditawarkan ke pengguna. Pemisahan ini bertindak sebagai
lapisan anti-korupsi: data mentah infrastruktur tidak langsung bocor ke pengguna."
Tunjuk ke: *flowchart-provider-discovery.md* (Gambar 3.12), *Services/Discovery/*.

### Kualitas dan kejujuran

**T: Bagaimana kamu yakin code ini benar?**
"Saya menulis rangkaian tes otomatis untuk fitur dan unit inti, enam puluh delapan metode uji,
yang saya jalankan dengan satu perintah. Tes ini menutup jalur approval, kebijakan, dan lifecycle."
Tunjuk ke: *backend/tests/*, jalankan `php artisan test`.

**T: Apa batasan sistem ini?**
"Tiga hal yang saya nyatakan jujur sebagai pekerjaan lanjutan: dukungan multi-hypervisor,
multi-tenancy keras antar organisasi, dan penskalaan worker otomatis dengan Horizon. Yang saya
kirim adalah orkestrasi multi-cluster Proxmox dengan tata kelola berbasis peran, dan itu yang saya
klaim, tidak lebih."
Tunjuk ke: Bab V Saran dan Pekerjaan Lanjutan.

**T: Mana yang benar-benar kamu tulis sendiri?**
"Seluruh logika bisnis di *app/Services* dan *app/Jobs* saya rancang dan tulis: gerbang approval,
mesin kebijakan, fan-out per VM, dan runner Terraform serta Ansible. Saya bisa telusuri barisnya
sekarang untuk fitur apa pun yang Bapak atau Ibu sebut."
Tunjuk ke: gunakan tabel di bagian 3, atau tiga langkah di bagian 5.

---

## Lampiran: peta diagram Bab III ke file source

| Gambar | File diagram | Padanan code |
|---|---|---|
| 3.2 Arsitektur | `flowchart-system-architecture.md` | `scripts/backend.sh` (proses berjalan) |
| 3.3 Use Case | `diagram-3-3-use-case.md` | seluruh `routes/api.php` |
| 3.4 Activity Provisioning | `diagram-3-4-activity-provisioning.md` | Alur bagian 2 di atas |
| 3.5 Activity Approval | `diagram-3-5-activity-approval.md` | `ApprovalWorkflowService.php` |
| 3.6 Activity Inventory | `diagram-3-6-activity-inventory.md` | `LifecycleService.php:77` |
| 3.7 Sequence Provisioning | `diagram-3-7-sequence-provisioning.md` | `ProvisionVmJob.php` |
| 3.8 Sequence Approval | `diagram-3-8-sequence-approval.md` | `ApprovalWorkflowService.php:23` |
| 3.9 Sequence Terraform/Proxmox | `diagram-3-9-sequence-terraform-proxmox.md` | `TerraformRunner.php`, `WorkspaceService.php` |
| 3.10 Class | `diagram-3-10-class.md` | `backend/app/Models/` |
| 3.11 ERD | `Database-relation.md` | migrasi `backend/database/migrations/` |
| 3.12 Lapisan Abstraksi | `flowchart-provider-discovery.md` | `Services/Discovery/`, `ProvisionRequestService.php:134` |
| 3.13 Activity Admin | `diagram-3-13-activity-admin.md` | Controller Settings (Provider/Catalog/Environment) |
