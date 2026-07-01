# Gambar 3.2 — Arsitektur Sistem (versi high-level)

Pandangan rancangan arsitektur berlapis. Versi ini menyembunyikan detail
operasional (port, jumlah worker, nama kelas teknis) yang ditegaskan pada Bab 4.

```mermaid
---
config:
  theme: neutral
  layout: elk
---
flowchart TB
  subgraph Client["Klien"]
    SPA["Aplikasi React (SPA) di peramban"]
  end
  subgraph Edge["Edge"]
    NGINX["nginx reverse proxy (same-origin)"]
  end
  subgraph App["Aplikasi — Laravel"]
    API["REST API + autentikasi berbasis cookie"]
    SVC["Layanan domain<br/>Provisioning · Approval · Lifecycle · Audit"]
    DISC["Discovery<br/>ProviderFactory → ProviderDriver<br/>(lapisan abstraksi provider)"]
    REVERB["Server WebSocket Reverb"]
  end
  subgraph Async["Eksekusi asinkron"]
    Q["Antrian pekerjaan"]
    W["Worker antrian<br/>provisioning · perubahan sumber daya · penghapusan · hardening · sinkronisasi"]
    TF["Eksekusi Terraform"]
    ANS["Eksekusi Ansible"]
  end
  subgraph Data["Data"]
    PG[("PostgreSQL")]
    R1[("Redis (cache)")]
    R2[("Redis (antrian, sesi, pub/sub)")]
  end
  subgraph Ext["Infrastruktur eksternal"]
    PVE["Kluster Proxmox VE"]
  end

  SPA -->|HTTPS| NGINX
  NGINX --> API
  NGINX -->|WSS| REVERB
  API --> SVC
  API --> PG
  API -. cache .-> R1
  SVC --> DISC
  SVC -->|kirim job| Q
  R2 --- Q
  Q --> W
  W --> TF --> PVE
  W --> ANS --> PVE
  DISC -->|API hanya-baca| PVE
  W -->|sinkronisasi fakta| PG
  SVC -->|event| REVERB
  REVERB -->|push| SPA
```
