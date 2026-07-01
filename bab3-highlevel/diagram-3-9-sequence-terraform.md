# Gambar 3.9 — Sequence Diagram: Eksekusi Terraform ke Proxmox VE (versi high-level)

Rincian rancangan satu proses provisioning, dari resolusi sumber daya hingga
eksekusi Terraform terhadap Proxmox dan sinkronisasi fakta mesin virtual. Diagram
ini melengkapi Gambar 3.7 dengan menampilkan lapisan layanan internal.

```mermaid
sequenceDiagram
    participant WK as Worker
    participant RRS as Resolusi sumber daya
    participant WSS as Penyiapan workspace
    participant TFR as Eksekusi Terraform
    participant PX as Proxmox
    participant DB as Basis Data
    participant Q as Antrian pekerjaan
    participant RV as Reverb

    WK->>DB: Muat ProvisionRequest + sumber daya terpublikasi
    WK->>RRS: Resolusi katalog, node, jaringan, datastore, tier
    RRS->>DB: Cari sumber daya terpublikasi + lapisan cermin provider
    DB-->>RRS: Identitas provider (template, bridge, storage)
    RRS-->>WK: Bundel sumber daya siap dipakai

    WK->>WSS: Siapkan direktori kerja per mesin virtual
    WSS-->>WK: Path direktori kerja + state Terraform

    WK->>TFR: Jalankan Terraform (apply)
    TFR->>PX: Clone template ke vmid baru
    PX-->>TFR: vmid baru
    TFR->>PX: Tulis cloud-init (pengguna, kunci SSH, jaringan, hostname)
    TFR->>PX: Nyalakan mesin virtual
    PX-->>TFR: Menyala + alamat IP awal terdeteksi
    TFR-->>WK: Keluaran (vmid, IP)

    alt Apply berhasil
        WK->>DB: Perbarui Inventory: Active + vmid + IP + kredensial terenkripsi
        WK->>Q: kirim job sinkronisasi fakta mesin virtual
        WK->>RV: siarkan event VmStateChanged (Provisioning ke Active)
    else Apply gagal
        WK->>DB: Perbarui Inventory: Failed + pesan kesalahan
        WK->>RV: siarkan event VmStateChanged (Provisioning ke Failed)
    end
```
