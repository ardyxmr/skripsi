# Gambar 3.7 — Sequence Diagram: Provisioning Mesin Virtual

Urutan interaksi end-to-end mulai dari submit permintaan hingga VM siap.
Pengiriman pekerjaan ke queue dilakukan per instance; pool worker menjalankan
maksimal 4 pekerjaan secara paralel (lihat §3.7 hasil benchmark backend).

```mermaid
sequenceDiagram
    actor PG as Pengguna
    participant FE as Frontend SPA
    participant API as API Laravel
    participant DB as Database
    participant Q as Redis Queue
    participant WK as Worker ProvisionVmJob
    participant PX as Proxmox API
    participant RV as Reverb WebSocket

    PG->>FE: Isi wizard provisioning (env, node, catalog, tier, network, datastore)
    FE->>API: POST /provision-requests
    API->>API: Validasi kebijakan environment (allow-list 5 sumber daya)

    alt approval_required dan pengguna non-privileged
        API->>DB: Simpan ProvisionRequest + ApprovalRequest (Pending)
        API->>RV: broadcast ApprovalChanged
        API-->>FE: 201 status=Pending approval
        Note over PG, API: Alur lanjut pada Gambar 3.8 (Approval)
    else privileged atau approval tidak diperlukan
        API->>DB: Simpan ProvisionRequest
        loop untuk tiap instance i = 1..N
            API->>Q: dispatch ProvisionVmJob (vm_name-0i)
        end
        API-->>FE: 201 status=Provisioning
    end

    loop tiap ProvisionVmJob, maksimal 4 paralel pada pool worker
        Q->>WK: Ambil pekerjaan dari antrian default
        WK->>DB: Resolve sumber daya + siapkan workspace Terraform
        WK->>PX: terraform apply (clone template, cloud-init, start)
        PX-->>WK: vmid baru + IP
        WK->>DB: Update Inventory status=Provisioning lalu Active
        WK->>RV: broadcast VmStateChanged
        RV-->>FE: Push update real-time
    end
```
