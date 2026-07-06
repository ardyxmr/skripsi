# Gambar 3.9 — Sequence Diagram: Eksekusi Terraform ke Proxmox VE

Detail internal satu ProvisionVmJob: dari resolusi sumber daya hingga apply
Terraform terhadap Proxmox API dan sinkronisasi fakta VM. Diagram ini
melengkapi Gambar 3.7 dengan menampilkan lapisan layanan internal.

```mermaid
sequenceDiagram
    participant WK as Worker ProvisionVmJob
    participant RRS as ResourceResolutionService
    participant WSS as WorkspaceService
    participant TFR as TerraformRunner
    participant PX as Proxmox API
    participant DB as Database
    participant Q as Redis Queue (system)
    participant RV as Reverb WebSocket

    WK->>DB: Load ProvisionRequest + sumber daya terpublikasi
    WK->>RRS: resolve(catalog, node, network, datastore, tier)
    RRS->>DB: Lookup published + lapisan mirror provider
    DB-->>RRS: ID provider (vmid template, bridge, storage)
    RRS-->>WK: Bundel sumber daya provider siap apply

    WK->>WSS: Prepare workspace per VM
    WSS-->>WK: Path workspace + state file Terraform

    WK->>TFR: apply(workspace, provider)
    TFR->>PX: Clone template ke vmid baru
    PX-->>TFR: vmid baru
    TFR->>PX: Tulis cloud-init (user, SSH key, network, hostname)
    TFR->>PX: Start VM
    PX-->>TFR: Power on + IP awal terdeteksi
    TFR-->>WK: Outputs (vmid, ip)

    alt Apply berhasil
        WK->>DB: Update Inventory status=Active + vmid + ip + credential terenkripsi
        WK->>Q: dispatch SyncVmFactsJob (delay 5 detik) ke antrian system
        WK->>RV: broadcast VmStateChanged (Provisioning -> Active)
    else Apply gagal
        WK->>DB: Update Inventory status=Failed + error_message
        WK->>RV: broadcast VmStateChanged (Provisioning -> Failed)
    end
```
