# Gambar 3.7 — Sequence Diagram: Provisioning Mesin Virtual (versi high-level)

Urutan interaksi rancangan dari submit permintaan hingga mesin virtual siap.
Setiap permintaan dipecah menjadi satu pekerjaan per instance yang dirancang
berjalan paralel pada pool worker.

```mermaid
sequenceDiagram
    actor PG as Pengguna
    participant FE as Frontend SPA
    participant API as API Laravel
    participant DB as Basis Data
    participant Q as Antrian pekerjaan
    participant WK as Worker
    participant PX as Proxmox
    participant RV as Reverb

    PG->>FE: Isi wizard provisioning (environment, node, katalog, tier, jaringan, datastore)
    FE->>API: POST /provision-requests
    API->>API: Validasi kebijakan environment (provider, node, tier)

    alt environment wajib persetujuan dan pengguna biasa
        API->>DB: Simpan ProvisionRequest + ApprovalRequest (Pending)
        API->>RV: siarkan event ApprovalChanged
        API-->>FE: Status menunggu persetujuan
        Note over PG, API: Alur lanjut pada Gambar 3.8 (Approval)
    else pengguna privileged atau tanpa persetujuan
        API->>DB: Simpan ProvisionRequest
        loop satu job per instance
            API->>Q: kirim job provisioning
        end
        API-->>FE: Status sedang diproses
    end

    loop tiap job, berjalan paralel pada pool worker
        Q->>WK: Ambil pekerjaan dari antrian
        WK->>DB: Resolusi sumber daya + siapkan workspace Terraform
        WK->>PX: Jalankan Terraform (clone template, cloud-init)
        PX-->>WK: vmid baru + alamat IP
        WK->>DB: Perbarui status Inventory: Provisioning lalu Active
        WK->>RV: siarkan event VmStateChanged
        RV-->>FE: Push pembaruan real-time
    end
```
