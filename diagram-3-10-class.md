# Gambar 3.10 — Class Diagram

Lingkup entitas domain (Eloquent models di `backend/app/Models/`). Nama atribut
selaras dengan kolom kunci pada ERD Gambar 3.11; kolom foreign key tidak
ditampilkan secara eksplisit karena diwakili oleh relasi antar kelas. Detail
penuh tetap pada ERD. Kelas layanan (`ProvisionRequestService`,
`LifecycleService`, dll.) tidak ditampilkan demi menjaga pemisahan tanggung
jawab dengan diagram arsitektur.

```mermaid
classDiagram
    %% --- IAM ---
    class User {
        +id
        +name
        +email
        +status
    }
    class Role {
        +id
        +role_name
    }
    class Group {
        +id
        +group_name
    }
    User "*" -- "1" Role : memiliki
    User "*" -- "1" Group : tergabung
    Group "1" -- "1" User : dipimpin

    %% --- Lapisan mirror provider ---
    class Provider {
        +id
        +provider_name
        +provider_type
        +endpoint
        +status
    }
    class ProviderNode {
        +id
        +node_name
        +status
    }
    class ProviderTemplate {
        +id
        +template_name
    }
    class ProviderNetwork {
        +id
        +bridge
    }
    class ProviderDatastore {
        +id
        +storage
    }
    class ProviderVm {
        +id
        +external_vmid
        +power_state
    }
    Provider "1" -- "*" ProviderNode
    Provider "1" -- "*" ProviderTemplate
    Provider "1" -- "*" ProviderNetwork
    Provider "1" -- "*" ProviderDatastore
    Provider "1" -- "*" ProviderVm

    %% --- Lapisan abstraksi terpublikasi ---
    class Node {
        +id
        +node_name
    }
    class Catalog {
        +id
        +catalog_name
        +status
    }
    class CatalogHardeningVersion {
        +id
        +name
        +version
        +is_active
    }
    class Network {
        +id
        +network_name
        +status
    }
    class Datastore {
        +id
        +datastore_name
        +status
    }
    Node "0..1" -- "1" ProviderNode : alias
    Catalog "0..1" -- "1" ProviderTemplate : alias
    Network "0..1" -- "1" ProviderNetwork : alias
    Datastore "0..1" -- "1" ProviderDatastore : alias
    Catalog "1" -- "*" CatalogHardeningVersion

    %% --- Tier ---
    class Tier {
        +id
        +tier_name
        +vcpu
        +ram_mb
        +disk_gb
    }

    %% --- Environment dan lima aturan ---
    class Environment {
        +id
        +environment_name
        +expiry_type
        +expiry_value
        +grace_period_type
        +grace_period_value
        +approval_required
        +allow_data_disk
        +max_data_disks
        +status
    }
    Environment "*" -- "*" Provider : environment_provider_rules
    Environment "*" -- "*" Node : environment_node_rules
    Environment "*" -- "*" Tier : environment_tier_rules
    Environment "*" -- "*" Network : environment_network_rules
    Environment "*" -- "*" Datastore : environment_datastore_rules

    %% --- Workflow ---
    class ProvisionRequest {
        +id
        +status
    }
    class ApprovalRequest {
        +id
        +request_type
        +reference_id
        +status
        +action_type
        +action_reason
        +action_date
        +payload
    }
    class Inventory {
        +id
        +vm_name
        +external_vmid
        +status
        +expiry_date
    }
    class InventoryDisk {
        +id
        +disk_index
        +size_gb
    }
    User "1" -- "*" ProvisionRequest : mengajukan
    ProvisionRequest "1" -- "0..1" ApprovalRequest
    ProvisionRequest "1" -- "*" Inventory : menghasilkan
    Inventory "1" -- "*" InventoryDisk
    Inventory "1" -- "*" ApprovalRequest : siklus hidup
    Inventory "0..1" -- "1" CatalogHardeningVersion : hardened_version
    ProvisionRequest "*" -- "1" Environment
    ProvisionRequest "*" -- "1" Node
    ProvisionRequest "*" -- "1" Catalog
    ProvisionRequest "*" -- "1" Tier
    ProvisionRequest "*" -- "1" Network
    ProvisionRequest "*" -- "1" Datastore

    %% --- Audit ---
    class AuditLog {
        +id
        +action_type
        +description
        +metadata
        +created_at
    }
    User "1" -- "*" AuditLog : tercatat
```
