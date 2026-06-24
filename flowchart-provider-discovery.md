---
config:
  theme: neutral
  layout: elk
---
flowchart LR
  subgraph PVE["Proxmox domain (raw)"]
    RAW["nodes · templates · bridges (vmbr*)<br/>storage pools · running VMs"]
  end
  subgraph DISC["Discovery (read-only driver) → provider_* mirror"]
    PN["provider_nodes"]
    PT["provider_templates"]
    PNET["provider_networks"]
    PDS["provider_datastores"]
    PVM["provider_vms (runtime facts)"]
  end
  subgraph PUB["Publishing — curated aliases (Active/Inactive)"]
    NODE["nodes"]
    CAT["catalogs<br/>(rocky-golden → rocky-linux-8)"]
    NET["networks<br/>(vmbr0 → VLAN-DEV)"]
    DS["datastores<br/>(local-lvm → Disk-ssd-dev)"]
  end
  subgraph POL["Policy — Environment + 5 allow-list rule tables"]
    ENV["environments<br/>approval · expiry · grace · disk caps"]
    RULES["environment_provider_rules<br/>environment_node_rules<br/>environment_tier_rules<br/>environment_network_rules<br/>environment_datastore_rules"]
    TIER["tiers (Bronze/Silver/Gold)"]
  end
  WIZ["Provisioning wizard (no HCL)"]
  INV["inventory"]

  RAW --> DISC
  PN --> NODE
  PT --> CAT
  PN --> CAT
  PNET --> NET
  PN --> NET
  PDS --> DS
  PN --> DS
  NODE --> RULES
  CAT --> WIZ
  NET --> RULES
  DS --> RULES
  TIER --> RULES
  RULES --- ENV
  ENV --> WIZ
  TIER --> WIZ
  WIZ --> REQ["provision_request"]
  PVM -. facts sync .-> INV