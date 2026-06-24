# Gambar 3.4 — Activity Diagram: Provisioning Mesin Virtual

Tiga swimlane: Pengguna, Sistem, Approver. Gerbang persetujuan aktif jika
environment menetapkan `approval_required` dan pengguna bukan privileged
(Manager/Admin).

```mermaid
flowchart TB
    subgraph PG [Pengguna]
        S1([Mulai])
        A1[Pilih Environment]
        A2[Pilih Provider dan Node]
        A3[Pilih Katalog, Tier, Network, Datastore]
        A4[Isi Nama VM dan Jumlah Instance]
        A5[Submit Permintaan]
    end

    subgraph SY [Sistem]
        V1{Valid terhadap kebijakan environment?}
        V2[Tampilkan pesan kesalahan]
        D1{approval_required dan pengguna non-privileged?}
        AR[Buat ApprovalRequest status=Pending]
        DJ["Dispatch ProvisionVmJob x N (per instance)"]
        WK[Worker jalankan Terraform apply]
        INV[Catat Inventory: Provisioning lalu Active]
        BR[Broadcast VmStateChanged]
        E1([Selesai])
    end

    subgraph AP [Approver]
        AP1[Tinjau permintaan]
        AP2{Setujui?}
        AP3[Tolak atau Kembalikan]
    end

    S1 --> A1 --> A2 --> A3 --> A4 --> A5 --> V1
    V1 -- tidak --> V2 --> E1
    V1 -- ya --> D1
    D1 -- tidak --> DJ
    D1 -- ya --> AR --> AP1 --> AP2
    AP2 -- ya --> DJ
    AP2 -- tidak --> AP3 --> E1
    DJ --> WK --> INV --> BR --> E1
```
