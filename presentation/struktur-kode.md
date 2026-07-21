# Struktur Kode dan Berkas Utama

Dua bagian. Bagian A pohon struktur direktori untuk ditempel sebagai gambaran arsitektur. Bagian B daftar berkas kode utama beserta path-nya, kamu salin sendiri isinya dari path tersebut. Tidak perlu semua berkas, cukup yang bertanda prioritas.

**Penempatan yang disarankan:** pohon struktur (Bagian A) cocok di Bab III bagian arsitektur atau Bab IV.1 implementasi. Daftar berkas (Bagian B) cocok sebagai lampiran atau acuan saat memilih cuplikan kode.

---

# A. Pohon Struktur Direktori

Tempel dengan style Courier New 10, spasi 1.

```
exovirt/
├── backend/                         # Laravel: API dan logika bisnis
│   ├── app/
│   │   ├── Http/
│   │   │   ├── Controllers/Api/      # endpoint: validasi lalu panggil Service
│   │   │   └── Middleware/           # autentikasi Sanctum dan pembatasan peran
│   │   ├── Services/                 # logika bisnis
│   │   │   ├── Provisioning/         # penggerak Terraform dan Ansible
│   │   │   └── Discovery/            # lapisan abstraksi provider Proxmox
│   │   ├── Jobs/                     # pekerjaan asinkron pada antrean
│   │   ├── Models/                   # entitas Eloquent (padanan tabel basis data)
│   │   ├── Events/                   # siaran real-time (Reverb)
│   │   └── Observers/                # pemicu audit dan siaran
│   ├── routes/
│   │   └── api.php                   # seluruh definisi endpoint
│   └── database/
│       ├── migrations/               # skema tabel
│       └── seeders/                  # data awal (peran, tier)
├── frontend/                        # React dan Vite: antarmuka SPA
│   └── src/
│       ├── pages/                    # Wizard, Inventory, Approvals, Catalog
│       ├── components/               # komponen UI dan pengawal akses
│       ├── contexts/                 # state global per sumber daya
│       └── lib/                      # klien API, Echo real-time, utilitas
├── terraform/                       # Infrastructure as Code
│   ├── main.tf
│   ├── variables.tf
│   └── provider.tf
└── Harden-script/                   # playbook Ansible hardening
    └── hardening.yml
```

---

# B. Berkas Kode Utama

Kolom prioritas menandai berkas yang paling menjelaskan cara kerja sistem. Kalau ingin ringkas, ambil yang bertanda ⭐ lebih dulu.

## Backend: alur permintaan sampai mesin virtual jadi

| Prioritas | Path | Peran |
|:-:|---|---|
| ⭐ | `backend/routes/api.php` | Seluruh endpoint, dijaga Sanctum dan peran |
| ⭐ | `backend/app/Http/Controllers/Api/ProvisionRequestController.php` | Terima permintaan provisioning, panggil Service |
| ⭐ | `backend/app/Services/ProvisionRequestService.php` | Gerbang persetujuan dan pemecahan satu job per mesin virtual |
| ⭐ | `backend/app/Jobs/ProvisionVmJob.php` | Pekerjaan yang menjalankan satu mesin virtual |
| ⭐ | `backend/app/Services/Provisioning/TerraformRenderer.php` | Menulis terraform.tfvars dari pilihan pengguna |
| ⭐ | `backend/app/Services/Provisioning/TerraformRunner.php` | Menjalankan init, plan, apply Terraform |
| ⭐ | `backend/app/Services/ResourceResolutionService.php` | Resolusi tier ke sumber daya, kata sandi acak per VM |
|  | `backend/app/Services/Provisioning/WorkspaceService.php` | Workspace Terraform terisolasi per mesin virtual |
|  | `backend/app/Services/Provisioning/AnsibleRunner.php` | Menjalankan playbook hardening |
|  | `backend/app/Jobs/HardenVmJob.php` | Pekerjaan hardening on-demand |
|  | `backend/app/Jobs/SyncVmFactsJob.php` | Sinkron fakta mesin virtual, antrean terpisah |

## Backend: tata kelola

| Prioritas | Path | Peran |
|:-:|---|---|
| ⭐ | `backend/app/Http/Controllers/Api/ApprovalController.php` | Proses setuju, tolak, kembalikan |
| ⭐ | `backend/app/Services/ApprovalWorkflowService.php` | Logika keputusan persetujuan |
| ⭐ | `backend/app/Models/User.php` | `visibleOwnerIds()`, cakupan data RBAC di lapisan kueri |
|  | `backend/app/Http/Controllers/Api/InventoryController.php` | Inventaris, aksi siklus hidup, owner-scoping |
|  | `backend/app/Services/LifecycleService.php` | Perpanjang, resize, tambah disk, hapus |
|  | `backend/app/Services/CredentialCipher.php` | Enkripsi kredensial per mesin virtual |
|  | `backend/app/Http/Middleware/` | Middleware autentikasi dan peran |
|  | `backend/app/Observers/` | Pemicu audit dan siaran `ApprovalChanged` |

## Backend: real-time dan model

| Prioritas | Path | Peran |
|:-:|---|---|
|  | `backend/app/Events/VmStateChanged.php` | Siaran perubahan status mesin virtual |
|  | `backend/app/Events/ApprovalChanged.php` | Siaran perubahan status persetujuan |
|  | `backend/app/Models/Inventory.php` | Entitas mesin virtual |
|  | `backend/app/Models/ProvisionRequest.php` | Entitas permintaan |
|  | `backend/app/Models/ApprovalRequest.php` | Entitas persetujuan |
|  | `backend/app/Models/AuditLog.php` | Entitas jejak audit |

## Frontend

| Prioritas | Path | Peran |
|:-:|---|---|
| ⭐ | `frontend/src/pages/VmRequest.jsx` | Wizard permintaan mesin virtual |
| ⭐ | `frontend/src/pages/Catalog.jsx` | Katalog layanan, titik masuk provisioning |
| ⭐ | `frontend/src/pages/Approvals.jsx` | Halaman persetujuan |
| ⭐ | `frontend/src/pages/Inventory.jsx` | Inventaris dan aksi siklus hidup |
| ⭐ | `frontend/src/lib/api.js` | Klien Axios dengan cookie Sanctum |
|  | `frontend/src/lib/echo.js` | Laravel Echo, kanal real-time Reverb |
|  | `frontend/src/App.jsx` | Rute dan kerangka antarmuka |
|  | `frontend/src/components/RequireAuth.jsx` | Pengawal rute terautentikasi |
|  | `frontend/src/components/RequireRole.jsx` | Pengawal rute berbasis peran |
|  | `frontend/src/contexts/` | State global per sumber daya |

---

## Catatan
- Path relatif dari akar proyek. Backend Laravel di `backend/`, frontend React di `frontend/`
- Untuk skripsi, ambil yang bertanda ⭐ dulu. Sebelas berkas itu sudah cukup menceritakan alur permintaan sampai mesin virtual jadi beserta tata kelolanya
- Empat cuplikan pada Kode 4.1 sampai 4.4 di badan diambil dari `ProvisionRequestService.php`, `terraform/main.tf`, `TerraformRenderer.php`, dan `User.php`, sehingga daftar ini melengkapinya
- Kalau ingin memangkas, satu berkas cukup ditampilkan sebagian, yaitu fungsi kuncinya saja, tidak harus utuh
