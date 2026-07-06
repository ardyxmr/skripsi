# Gambar 3.6 — Activity Diagram: Inventory Mesin Virtual

Tiga swimlane: Pengguna, Sistem, Approver. Empat aksi siklus hidup (Edit
Resources, Perpanjang, Hardening, Hapus) memakai gerbang persetujuan yang sama
seperti provisioning awal. Edit Resources menggabungkan perubahan CPU, RAM, dan
disk dalam satu persetujuan dan satu apply. Setelah lolos gerbang, Perpanjang dan
Permanent diterapkan sinkron sebagai pembaruan masa berlaku tanpa job; Edit
Resources dan Hapus menjalankan Terraform, sedangkan Hardening menjalankan Ansible.

```mermaid
flowchart TB
    subgraph PG [Pengguna]
        S1([Mulai])
        A1[Buka halaman Inventory]
        A2[Pilih VM miliknya]
        A3{Pilih aksi siklus hidup}
        AER[Edit Resources: CPU / RAM / Disk]
        APx[Perpanjang Masa Berlaku]
        AH[Harden / Patch]
        ADEL[Hapus VM]
    end

    subgraph SY [Sistem]
        V1{Valid dan sesuai kebijakan environment?}
        V2[Tampilkan pesan kesalahan]
        D1{approval_required dan pengguna non-privileged?}
        Q1[Buat ApprovalRequest Pending, tunggu approver]
        TYP{Jenis aksi}
        SYNC[Perbarui expiry_date atau is_permanent secara sinkron, tanpa job]
        J["Dispatch job: EditResourcesVmJob / HardenVmJob / DestroyVmJob"]
        EX[Worker jalankan Terraform atau Ansible]
        UP[Update Inventory dan InventoryDisk]
        BR[Broadcast VmStateChanged]
        E1([Selesai])
    end

    subgraph AV [Approver]
        AP1{Setujui?}
        AP2[Tolak]
    end

    S1 --> A1 --> A2 --> A3
    A3 --> AER
    A3 --> APx
    A3 --> AH
    A3 --> ADEL
    AER --> V1
    APx --> V1
    AH --> V1
    ADEL --> V1
    V1 -- tidak --> V2 --> E1
    V1 -- ya --> D1
    D1 -- tidak --> TYP
    D1 -- ya --> Q1 --> AP1
    AP1 -- ya --> TYP
    AP1 -- tidak --> AP2 --> E1
    TYP -- "Perpanjang / Permanent" --> SYNC
    TYP -- "Edit Resources / Harden / Hapus" --> J
    J --> EX --> UP --> BR
    SYNC --> BR
    BR --> E1
```
