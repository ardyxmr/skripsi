---
config:
  theme: neutral
  layout: elk
---
flowchart TB
  subgraph Client
    SPA["React SPA (browser)"]
  end
  subgraph Edge
    NGINX["nginx reverse proxy<br/>same-origin /api + /app (WS)"]
  end
  subgraph App["Application — Laravel"]
    API["REST API + Sanctum cookie auth"]
    SVC["Domain services<br/>Provision · Approval · Lifecycle · Audit"]
    DISC["DiscoveryService<br/>ProviderFactory → ProviderDriver<br/>writes provider_* mirror"]
    REVERB["Reverb WebSocket server"]
  end
  subgraph Async["Asynchronous execution"]
    Q["Redis queue"]
    W["Queue workers<br/>ProvisionVm · Resize · AddDisk · EditResources · Destroy · Harden · SyncVmFacts"]
    TF["TerraformRunner"]
    ANS["AnsibleRunner"]
  end
  subgraph Data
    PG[("PostgreSQL")]
    R1[("Redis :6379 cache (LRU)")]
    R2[("Redis :6380 queue + sessions + pub/sub")]
  end
  subgraph Ext["External infrastructure"]
    PVE["Proxmox VE cluster(s)"]
  end

  SPA -->|HTTPS| NGINX
  NGINX --> API
  NGINX -->|WSS| REVERB
  API --> SVC
  API --> PG
  API --> R2
  API -. cache .-> R1
  SVC --> DISC
  SVC -->|dispatch jobs| Q
  R2 --- Q
  Q --> W
  W --> TF --> PVE
  W --> ANS --> PVE
  DISC -->|read-only API| PVE
  W -->|facts sync via provider_vms| PG
  SVC -->|events| REVERB
  REVERB -->|push| SPA