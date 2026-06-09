###ARCHITECTURE POSITION###

Datastore Management merupakan Published Storage Layer yang berada di antara Discovery Layer dan Provisioning Layer.

Provider tetap menjadi pemilik datastore hasil discovery.

Datastore Management hanya melakukan publish terhadap datastore yang ditemukan oleh Discovery Engine.

User tidak pernah berinteraksi langsung dengan datastore provider.

Architecture Flow:

Discovery Layer

Provider
    │
    ▼
Provider Nodes
    │
    ▼
Provider Datastores
    │
    ▼

Service Layer

Datastore Management
    │
    ▼
Published Datastores
    │
    ▼

Business Policy Layer

Environment Policy
    │
    ▼
Allowed Datastores
    │
    ▼

Consumption Layer

Provision VM

###HIGH LEVEL FLOW###

Provider
    │
    ▼
Sync Resources
    │
    ▼
Discover Nodes
    │
    ▼
Discover Datastores
    │
    ▼
provider_datastores
    │
    ▼
Admin Publish Datastore
    │
    ▼
datastores
    │
    ▼
Environment Assignment
    │
    ▼
Provision VM

###DESIGN PRINCIPLE###

Datastore Management bukan Datastore Discovery.

Datastore Management adalah:

Storage Publishing Layer

Provider Datastore:

local-lvm

Published Datastore:

Standard Storage

Provider Datastore:

vmdata

Published Datastore:

Production Storage

Provider Datastore:

ceph-prod

Published Datastore:

High Performance Storage

User tidak pernah melihat:

- Provider Datastore Name
- Provider Node Name
- Provider Storage Identifier

User hanya melihat:

- Standard Storage
- Production Storage
- High Performance Storage

Published Datastore merupakan kontrak stabil antara Infrastructure Layer dan Application Layer.

###DATABASE DESIGN###

provider_datastores

(sudah dibuat pada Provider Discovery)

provider_datastores

Field	Type

id	bigint

provider_id	bigint

provider_node_id	bigint

datastore_name	varchar

datastore_type	varchar

total_capacity	bigint

used_capacity	bigint

available_capacity	bigint

discovered_status	varchar

last_sync_at	datetime

###FIELD DESCRIPTION###

provider_id

Provider tempat Datastore ditemukan.

Contoh:

Proxmox DC Jakarta

provider_node_id

Node tempat Datastore ditemukan.

Contoh:

pve01

datastore_name

Nama Datastore hasil discovery Provider.

Contoh:

local-lvm

vmdata

ceph-prod

###MULTI NODE SUPPORT###

Datastore dengan nama yang sama dapat berada pada Node yang berbeda.

Contoh:

Node:

pve01

Datastore:

local-lvm

---

Node:

pve02

Datastore:

local-lvm

Walaupun nama Datastore sama, keduanya dianggap resource yang berbeda karena berasal dari Node yang berbeda.

Provider Node menjadi bagian dari identitas Datastore hasil discovery.

###PUBLISHED DATASTORE TABLE###

datastores

Field	Type

id	bigint

datastore_name	varchar

datastore_description	text

provider_id	bigint

provider_node_id	bigint

provider_datastore_id	bigint

status	varchar

created_by	bigint

created_at	timestamp

updated_at	timestamp

###FIELD DESCRIPTION###

provider_id

Provider tempat Datastore ditemukan.

Contoh:

Proxmox DC Jakarta

provider_node_id

Node tempat Datastore ditemukan.

Contoh:

pve01

provider_datastore_id

Datastore hasil discovery yang dipublish menjadi Published Datastore.

Contoh:

local-lvm

vmdata

ceph-prod

###RELATIONSHIP###

Provider
      │
      ▼
Provider Node
      │
      ▼
Provider Datastore
      │
      ▼
Published Datastore

###PURPOSE###

Published Datastore menyimpan referensi ke Datastore hasil discovery.

Published Datastore tidak menyimpan konfigurasi storage secara langsung.

Konfigurasi tetap berasal dari:

provider_datastores

melalui Discovery Layer.

###MULTI NODE SUPPORT###

Datastore dengan nama yang sama dapat berada pada Node yang berbeda.

Contoh:

Provider:

Proxmox DC Jakarta

Node:

pve01

Datastore:

local-lvm

---

Provider:

Proxmox DC Jakarta

Node:

pve02

Datastore:

local-lvm

Walaupun nama Datastore sama, keduanya dianggap resource yang berbeda karena berasal dari Node yang berbeda.

Published Datastore harus menyimpan:

provider_node_id

agar backend dapat menentukan lokasi Datastore yang benar saat provisioning.

###DATASTORE STATUS###

Possible values:

Active

Inactive

Provider Offline

Datastore Missing

Low Capacity

###ACTIVE###

Published Datastore dapat digunakan untuk provisioning.

Provider, Node, dan Datastore masih tersedia.

Kapasitas masih memenuhi batas minimum yang ditentukan sistem.

###INACTIVE###

Published Datastore dinonaktifkan oleh Administrator.

Datastore tidak dapat dipilih pada Provision VM.

###PROVIDER OFFLINE###

Provider dalam status:

Disconnected

Published Datastore tetap disimpan namun tidak dapat digunakan untuk provisioning.

###DATASTORE MISSING###

Datastore hasil discovery tidak ditemukan pada proses synchronization terbaru.

Published Datastore tetap disimpan untuk:

- Audit
- History
- Traceability

Namun tidak dapat digunakan untuk provisioning hingga Datastore ditemukan kembali.

###LOW CAPACITY###

Datastore masih tersedia pada Provider.

Namun kapasitas tersisa berada di bawah threshold yang ditentukan sistem.

Published Datastore tetap terlihat pada Datastore Management.

Namun tidak dapat digunakan untuk provisioning baru.

###CAPACITY THRESHOLD###

Default Threshold:

5%

Formula:

available_capacity
/
total_capacity
×
100

Jika hasil lebih kecil dari:

5%

maka status berubah menjadi:

Low Capacity

###LOW CAPACITY EXAMPLE###

Datastore:

vmdata

Total Capacity:

100 TB

Available Capacity:

2 TB

Remaining Capacity:

2%

Threshold:

5%

Status:

Low Capacity

###AUTOMATIC RECOVERY###

Jika kapasitas kembali berada di atas threshold,

status otomatis berubah menjadi:

Active

tanpa memerlukan tindakan Administrator.

###PROVISIONING BEHAVIOR###

Published Datastore dengan status:

- Inactive
- Provider Offline
- Datastore Missing
- Low Capacity

tidak dapat dipilih pada:

Provision VM

Hanya Datastore dengan status:

Active

yang dapat digunakan untuk deployment.

###ARCHITECTURAL PRINCIPLE###

Status Datastore ditentukan oleh:

- Administrative Status
- Provider Status
- Discovery Status
- Capacity Status

sehingga sistem dapat mencegah provisioning ke storage yang tidak tersedia atau hampir penuh.

###RELATIONSHIP###

providers
       │
       ▼
provider_nodes
       │
       ▼
provider_datastores
       │
       ▼
datastores

###RELATIONSHIP DESCRIPTION###

Provider

memiliki banyak:

Provider Nodes

Provider Node

memiliki banyak:

Provider Datastores

Provider Datastore

dapat dipublish menjadi:

Published Datastore

###EXAMPLE###

Provider:

Proxmox DC Jakarta
       │
       ▼

Node:

pve01
       │
       ▼

Datastore:

local-lvm
       │
       ▼

Published Datastore:

Standard Storage

###PURPOSE###

Relationship ini memastikan sistem dapat mengetahui:

- Provider asal Datastore
- Node asal Datastore
- Datastore yang digunakan Published Datastore

sehingga backend dapat melakukan provisioning ke storage yang benar.

###CREATE DATASTORE FLOW###

Admin:

Settings
    │
    ▼
Datastore Management
    │
    ▼
+ Create Datastore

###FORM###

Datastore Name

Description

Provider

Node

Source Datastore

Status

###FLOW###

Administrator memilih:

Provider

Contoh:

Proxmox DC Jakarta

Sistem memuat:

Available Nodes

berdasarkan:

provider_nodes

Contoh:

pve01

pve02

pve03

Administrator memilih:

Node

Contoh:

pve01

Sistem memuat:

Available Datastores

berdasarkan:

provider_id
+
provider_node_id

Contoh:

local

local-lvm

vmdata

ceph-prod

Administrator memilih:

Source Datastore

Contoh:

local-lvm

Administrator menentukan:

Datastore Name

Standard Storage

Administrator menentukan:

Status

Active

Lalu sistem membuat:

Published Datastore

###RELATIONSHIP CREATED###

Published Datastore
      │
      ▼
Provider
      │
      ▼
Node
      │
      ▼
Datastore

###USER EXPERIENCE###

User tidak pernah melihat:

- Provider Datastore
- Node Name
- Datastore Identifier

User hanya melihat:

- Standard Storage
- Production Storage
- High Performance Storage

pada halaman Provision VM.

###VALIDATION###

Published Datastore tidak dapat dibuat jika:

- Provider Offline
- Node Missing
- Datastore Missing

Hanya resource dengan:

discovered_status = Active

yang dapat dipilih saat pembuatan Published Datastore.

###DATASTORE HEALTH CHECK###

Saat Provider Discovery Sync berjalan,

Backend melakukan verifikasi:

- Provider Connected?
- Datastore Exists?
- Capacity Available?
- Discovery Status Active?

###HEALTH CHECK FLOW###

Provider Discovery
       │
       ▼
Sync Resources
       │
       ▼
Validate Datastore Dependency
       │
       ├── Provider Status
       ├── Datastore Status
       ├── Discovery Status
       └── Capacity Status
       │
       ▼
Update Datastore Status

###PROVIDER OFFLINE###

Jika:

Provider Status

=

Disconnected

Maka seluruh Published Datastore yang berasal dari Provider tersebut berubah menjadi:

Provider Offline

###DATASTORE MISSING###

Jika:

Provider Datastore

tidak ditemukan pada proses discovery terbaru

atau

provider_datastore.discovered_status

=

Missing

Maka Published Datastore berubah menjadi:

Datastore Missing

###LOW CAPACITY###

Jika:

available_capacity
/
total_capacity
×
100

lebih kecil dari:

capacity_threshold

Maka Published Datastore berubah menjadi:

Low Capacity

###DEFAULT THRESHOLD###

Default:

5%

Nilai threshold dapat dikonfigurasi pada sistem.

###ACTIVE###

Published Datastore berubah menjadi:

Active

jika:

- Provider Status = Connected
- Datastore Status = Active
- Discovery Status = Active
- Capacity Status = Healthy
- Datastore Status = Active secara administratif

###PROVIDER OFFLINE EXAMPLE###

Provider:

Proxmox DC Jakarta

Status:

Disconnected

Published Datastores:

- Standard Storage
- Production Storage
- High Performance Storage

Status berubah menjadi:

Provider Offline

###DATASTORE MISSING EXAMPLE###

Discovery sebelumnya:

local-lvm

Discovery terbaru:

Datastore tidak ditemukan

Maka:

Published Datastore:

Standard Storage

Status:

Datastore Missing

###LOW CAPACITY EXAMPLE###

Datastore:

vmdata

Total Capacity:

100 TB

Available Capacity:

2 TB

Remaining Capacity:

2%

Threshold:

5%

Status:

Low Capacity

###AUTOMATIC RECOVERY###

Jika:

- Provider kembali Connected
- Datastore ditemukan kembali
- Kapasitas kembali di atas threshold

maka status Published Datastore otomatis dipulihkan menjadi:

Active

tanpa memerlukan tindakan Administrator.

###PROVISIONING BEHAVIOR###

Published Datastore dengan status:

- Inactive
- Provider Offline
- Datastore Missing
- Low Capacity

tidak dapat dipilih pada:

Provision VM

Hanya Published Datastore dengan status:

Active

yang dapat digunakan untuk deployment.

###PURPOSE###

Datastore Health Check memastikan hanya Datastore yang valid dan memiliki kapasitas yang cukup yang ditampilkan pada:

- Datastore Management
- Provision VM

sehingga User tidak dapat melakukan provisioning ke storage yang tidak tersedia atau hampir penuh.

###CAPACITY DISCOVERY###

Capacity Information diperoleh dari:

Provider Discovery API

Contoh Proxmox API:

GET /api2/json/nodes/{node}/storage

###EXAMPLE RESPONSE###

{
  "storage": "local-lvm",
  "total": 14558429184,
  "used": 5184256632,
  "avail": 9374172552
}

###CAPACITY FIELDS###

Backend menyimpan:

Total Capacity

Used Capacity

Available Capacity

Used Percentage

###CAPACITY CALCULATION###

Used Percentage dihitung menggunakan:

used_capacity
/
total_capacity
×
100

###DISCOVERY UPDATE###

Nilai berikut diperbarui setiap kali:

Provider Discovery Sync

dijalankan.

Field yang diperbarui:

- total_capacity
- used_capacity
- available_capacity
- used_percentage
- last_sync_at

###DATA SOURCE###

Capacity Information berasal dari:

provider_datastores

Published Datastore tidak menyimpan data kapasitas secara langsung.

Capacity Information selalu mengikuti hasil discovery terbaru dari Provider.

###PURPOSE###

Capacity Information digunakan untuk:

- Datastore Health Check
- Low Capacity Detection
- Provisioning Validation
- Capacity Monitoring
- Future Capacity Planning

###PROVISIONING VALIDATION###

Sebelum deployment dijalankan,

Backend wajib memverifikasi:

- Datastore Status = Active
- Available Capacity mencukupi
- Datastore tidak berstatus Low Capacity

Jika validasi gagal:

Provisioning ditolak dan User menerima pesan error yang sesuai.

###ARCHITECTURAL PRINCIPLE###

Capacity Information merupakan bagian dari:

Discovery Layer

dan tidak dapat diubah secara manual oleh Administrator.

Seluruh data kapasitas harus berasal dari hasil discovery Provider.

###DATASTORE MANAGEMENT WIDGETS###

Widgets:

Published Datastores

Active

Low Capacity

Provider Offline

Total Available Capacity

###WIDGET DESCRIPTION###

Published Datastores

Total Published Datastore yang terdaftar.

Active

Published Datastore yang dapat digunakan untuk provisioning.

Low Capacity

Published Datastore yang kapasitas tersisanya berada di bawah threshold yang ditentukan sistem.

Provider Offline

Published Datastore yang tidak dapat digunakan karena Provider dalam status:

Disconnected

Total Available Capacity

Total kapasitas tersedia dari seluruh Published Datastore yang berstatus:

Active

###DATA SOURCE###

Published Datastores

Active

Low Capacity

Provider Offline

berasal dari:

datastores

Total Available Capacity

dihitung dari:

provider_datastores

melalui relasi:

datastores
      │
      ▼
provider_datastores

###REFRESH BEHAVIOR###

Widget diperbarui saat:

- Sync Resources
- Automatic Discovery Sync

Widget tidak melakukan API Call langsung ke Provider.

###CAPACITY AGGREGATION###

Total Available Capacity dihitung menggunakan:

SUM(available_capacity)

untuk seluruh Published Datastore dengan status:

Active

###PURPOSE###

Widget memberikan ringkasan:

- Jumlah Published Datastore
- Kesehatan Datastore
- Kapasitas Storage yang tersedia

sehingga Administrator dapat memantau kondisi storage sebelum provisioning dilakukan.

###DATASTORE TABLE###

Datastore	Provider	Type	Free Space	Status

###EXAMPLE###

Datastore:

Standard Storage

Provider:

Proxmox DC Jakarta

Type:

LVM Thin

Free Space:

8.7 GB

Status:

Active

---

Datastore:

Production Storage

Provider:

Proxmox DC Jakarta

Type:

Directory

Free Space:

2 TB

Status:

Low Capacity

###TABLE BEHAVIOR###

- Resizable Columns
- Search
- Provider Filter
- Node Filter
- Status Filter
- Pagination
- Sortable Columns

###DATA SOURCE###

Data berasal dari:

datastores

###DETAIL VIEW###

Saat Administrator membuka:

Edit Datastore

Sistem menampilkan:

- Provider
- Node
- Source Datastore
- Datastore Type
- Total Capacity
- Used Capacity
- Available Capacity
- Used Percentage
- Discovery Status

Informasi Discovery tidak ditampilkan pada table utama.

###ACTIONS###

Edit Datastore

Disable Datastore

Delete Datastore

###DELETE RULE###

Published Datastore tidak dapat dihapus jika:

Masih digunakan oleh:

- Environment Policy
- Active VM Request
- Inventory
- Active Deployment

###DELETE VALIDATION MESSAGE###

Datastore masih digunakan oleh resource aktif.

Hapus relasi atau deployment terkait terlebih dahulu sebelum menghapus Datastore.

###PROVISION INTEGRATION###

Saat User membuka:

Provision VM

Datastore Dropdown tidak membaca:

provider_datastores

secara langsung.

Provision VM hanya membaca:

datastores

sebagai Published Datastore Layer.

###RESOURCE FILTERING FLOW###

User memilih:

Environment
      │
      ▼
Provider
      │
      ▼
Node

Backend memfilter:

Available Datastores

berdasarkan:

- Environment Policy
- Provider
- Node
- Datastore Status

###DATASTORE SOURCE###

Provision VM tidak pernah membaca:

provider_datastores

secara langsung.

Provision VM hanya membaca:

datastores

yang telah dipublish oleh Administrator.

###USER EXPERIENCE###

User melihat:

- Standard Storage
- Production Storage
- High Performance Storage

User tidak melihat:

- local
- local-lvm
- vmdata
- ceph-prod

###DATASTORE RESOLUTION###

Saat User memilih:

Standard Storage

Backend melakukan resolve:

Published Datastore
      │
      ▼
Provider Datastore
      │
      ▼
Provider Node
      │
      ▼
Provider

untuk menentukan storage yang digunakan saat deployment.

###VALIDATION###

Hanya Datastore dengan status:

Active

yang dapat ditampilkan pada:

Provision VM

Datastore dengan status:

- Inactive
- Provider Offline
- Datastore Missing
- Low Capacity

tidak dapat dipilih oleh User.

###ARCHITECTURAL PRINCIPLE###

Provision VM menggunakan:

Published Datastore

bukan:

Provider Datastore

karena User berinteraksi dengan Service Layer,

bukan Discovery Layer.

###ENVIRONMENT INTEGRATION###

Published Datastore dapat dibatasi berdasarkan Environment Policy.

###PURPOSE###

Environment menentukan Datastore mana yang boleh digunakan untuk provisioning.

Environment tidak bergantung pada Provider Resource.

Environment hanya membaca:

Published Datastore

###EXAMPLE###

Published Datastore:

Standard Storage

Allowed Environment:

- Development
- Staging

---

Published Datastore:

Production Storage

Allowed Environment:

- Production

###DATABASE DESIGN###

datastore_environment_rules

Field	Type

datastore_id	bigint

environment_id	bigint

###RELATIONSHIP###

Environment
      │
      ▼
Datastore Policy
      │
      ▼
Published Datastore

###PROVISIONING BEHAVIOR###

Saat User memilih:

Environment:

Development

Backend memfilter:

Available Datastores

berdasarkan:

datastore_environment_rules

###FILTERING FLOW###

Environment
      │
      ▼
Allowed Datastores
      │
      ▼
Published Datastores
      │
      ▼
Datastore Dropdown

###EXAMPLE###

Environment:

Development

Allowed Datastores:

- Standard Storage
- Shared Storage

Datastore Dropdown hanya menampilkan:

- Standard Storage
- Shared Storage

---

Environment:

Production

Allowed Datastores:

- Production Storage
- High Performance Storage

Datastore Dropdown hanya menampilkan:

- Production Storage
- High Performance Storage

###MULTI LAYER FILTERING###

Datastore yang ditampilkan pada Provision VM harus memenuhi seluruh syarat berikut:

- Environment Policy
- Provider Selection
- Node Selection
- Datastore Status = Active

###CAPACITY VALIDATION###

Selain Environment Policy,

Datastore juga harus memenuhi:

- Available Capacity > Threshold
- Status ≠ Low Capacity

agar dapat digunakan untuk provisioning.

###ARCHITECTURAL PRINCIPLE###

Environment menjadi:

Business Policy Layer

Datastore menjadi:

Published Infrastructure Service

Environment tidak mengetahui:

- Provider
- Node
- Datastore Identifier

Environment hanya menentukan:

Datastore mana yang boleh digunakan.

###TIER INTEGRATION###

Published Datastore dapat dibatasi berdasarkan Tier Policy.

###PURPOSE###

Tier menentukan Datastore mana yang boleh digunakan untuk provisioning.

Tier tidak bergantung pada Provider Resource.

Tier hanya membaca:

Published Datastore

###EXAMPLE###

Tier:

Bronze

Allowed Datastores:

- Standard Storage

---

Tier:

Silver

Allowed Datastores:

- Standard Storage
- Production Storage

---

Tier:

Gold

Allowed Datastores:

- Production Storage
- High Performance Storage

###DATABASE DESIGN###

datastore_tier_rules

Field	Type

datastore_id	bigint

tier_id	bigint

###RELATIONSHIP###

Tier
      │
      ▼
Datastore Policy
      │
      ▼
Published Datastore

###PROVISIONING BEHAVIOR###

Saat User memilih:

Tier:

Bronze

Backend memfilter:

Available Datastores

berdasarkan:

datastore_tier_rules

###FILTERING FLOW###

Tier
      │
      ▼
Allowed Datastores
      │
      ▼
Published Datastores
      │
      ▼
Datastore Dropdown

###EXAMPLE###

Tier:

Bronze

Allowed Datastores:

- Standard Storage

Datastore Dropdown hanya menampilkan:

- Standard Storage

---

Tier:

Gold

Allowed Datastores:

- Production Storage
- High Performance Storage

Datastore Dropdown hanya menampilkan:

- Production Storage
- High Performance Storage

###MULTI LAYER FILTERING###

Datastore yang ditampilkan pada Provision VM harus memenuhi seluruh syarat berikut:

- Environment Policy
- Tier Policy
- Provider Selection
- Node Selection
- Datastore Status = Active
- Capacity Validation Passed

###ARCHITECTURAL PRINCIPLE###

Tier menjadi:

Resource Consumption Policy Layer

Datastore menjadi:

Published Infrastructure Service

Tier tidak mengetahui:

- Provider
- Node
- Datastore Identifier

Tier hanya menentukan:

Datastore mana yang boleh digunakan berdasarkan level layanan yang dipilih User.

###INVENTORY INTEGRATION###

###INVENTORY STORAGE###

Saat VM berhasil dibuat,

Inventory menyimpan:

datastore_id

dan menampilkan:

Published Datastore Name

bukan:

Provider Datastore Name

###EXAMPLE###

Inventory menampilkan:

Standard Storage

bukan:

local-lvm

###PURPOSE###

Published Datastore lebih mudah dipahami oleh:

- User
- Approver
- Administrator

dibandingkan nama Datastore mentah dari Provider.

###PROVISIONING RESOLUTION###

Saat deployment dijalankan,

Backend melakukan resolve:

datastore_id
      │
      ▼
provider_datastore_id
      │
      ▼
provider_node_id
      │
      ▼
provider_id

untuk menentukan Datastore yang digunakan pada deployment.

###USER EXPERIENCE###

User melihat:

- Standard Storage
- Production Storage
- High Performance Storage

User tidak pernah melihat:

- local
- local-lvm
- vmdata
- ceph-prod

###ARCHITECTURAL PRINCIPLE###

Inventory menggunakan:

Published Datastore

sebagai representasi Storage.

Provider Datastore tetap menjadi bagian dari:

Discovery Layer

dan tidak ditampilkan kepada User.

###AUDIT BENEFIT###

Audit Log tetap dapat melakukan trace:

Published Datastore
      │
      ▼
Provider Datastore
      │
      ▼
Provider Node
      │
      ▼
Provider

untuk kebutuhan:

- Troubleshooting
- Audit
- Capacity Investigation
- Root Cause Analysis

tanpa mengekspos detail infrastruktur kepada User.

###SOURCE OF TRUTH###

Inventory menyimpan:

datastore_id

sebagai referensi utama.

Published Datastore Name ditampilkan melalui relasi:

inventory
      │
      ▼
datastores
      │
      ▼
provider_datastores

sehingga perubahan nama Provider Datastore tidak mempengaruhi tampilan Inventory.

###APPROVAL INTEGRATION###

Approval Request menampilkan:

Storage:

Standard Storage

bukan:

local-lvm

###PURPOSE###

Approver melihat Published Datastore yang mudah dipahami.

Approver tidak perlu mengetahui detail storage Provider.

###APPROVAL DISPLAY###

Approval Request menampilkan:

- Datastore Name
- Datastore Description
- Tier
- Environment

tanpa menampilkan:

- Provider Datastore Name
- Provider Node Name

###TERRAFORM INTEGRATION###

Saat request disetujui,

Backend melakukan resolve:

Published Datastore
      │
      ▼
Provider Datastore
      │
      ▼
Provider Node
      │
      ▼
Provider

untuk menentukan storage yang digunakan saat deployment.

###RESOLUTION EXAMPLE###

Published Datastore:

Standard Storage

Resolve menjadi:

Provider:

Proxmox DC Jakarta

Node:

pve01

Datastore:

local-lvm

###TERRAFORM INPUT###

Terraform menerima:

storage = "local-lvm"

dan menggunakan datastore tersebut saat proses deployment.

###USER ABSTRACTION###

User tidak pernah mengetahui mapping berikut:

Standard Storage
      │
      ▼
local-lvm
      │
      ▼
pve01

User hanya melihat:

Standard Storage

selama seluruh lifecycle provisioning.

###ARCHITECTURAL PRINCIPLE###

Terraform tidak menggunakan:

datastore_name

secara langsung.

Terraform selalu menggunakan hasil resolve dari:

datastore_id
      │
      ▼
provider_datastore_id
      │
      ▼
provider_node_id
      │
      ▼
provider_id

agar deployment selalu mengarah ke Datastore yang benar.

###SOURCE OF TRUTH###

Published Datastore menjadi:

Service Layer

Provider Datastore menjadi:

Discovery Layer

Terraform selalu mengambil data dari Discovery Layer melalui proses resolve yang dilakukan Backend.

###FUTURE MULTI PROVIDER SUPPORT###

Published Datastore tidak bergantung pada jenis Provider tertentu.

###EXAMPLE###

Provider:

Proxmox DC Jakarta

Node:

pve01

Datastore:

local-lvm

Published Datastore:

Standard Storage

---

Provider:

OpenStack LAB

Datastore:

ceph-volume01

Published Datastore:

Standard Storage

###PROVISIONING BEHAVIOR###

Provisioning tidak bergantung pada jenis Provider.

Provisioning selalu menggunakan:

datastore_id

sebagai entry point.

Backend melakukan resolve:

Published Datastore
      │
      ▼
Provider Datastore
      │
      ▼
Provider Node
      │
      ▼
Provider

untuk menentukan storage yang digunakan saat deployment.

###PROVIDER ABSTRACTION###

User tidak mengetahui apakah Datastore berasal dari:

- Proxmox
- OpenStack
- OLVM
- VMware
- Nutanix

User hanya melihat:

- Standard Storage
- Production Storage
- High Performance Storage

###ARCHITECTURAL BENEFIT###

Penambahan Provider baru tidak memerlukan perubahan pada:

- Datastore Management
- Environment Management
- Provision VM
- Approval Request
- Inventory
- Terraform Deployment

karena seluruh proses selalu dimulai dari:

datastore_id

yang kemudian di-resolve melalui Discovery Layer.

###ARCHITECTURAL PRINCIPLE###

Discovery Layer

Provider
      │
      ▼
Node
      │
      ▼
Datastore

Service Layer

Published Datastore
      │
      ▼
Provision VM

Published Datastore menjadi kontrak stabil antara Infrastructure Layer dan Application Layer.

###PROVISIONING FLOW###

Environment
      │
      ▼
Provider
      │
      ▼
Node
      │
      ▼
Datastore
      │
      ▼
Terraform Deployment

Catalog tidak menentukan Datastore.

Catalog dan Datastore merupakan resource yang independen dan masing-masing dikontrol melalui Environment Policy dan Tier Policy.

###UI CONSISTENCY REQUIREMENT###

Mengikuti:

- User Management
- Provider Management
- Catalog Management
- Network Management

###REQUIRED COMPONENTS###

Statistics Widget

Search

Provider Filter

Node Filter

Status Filter

Resizable Columns

Scrollable Table

Pagination

Create/Edit Modal

Delete Confirmation Modal

Unsaved Changes Modal

###TABLE REQUIREMENT###

Table harus:

- Full Width Layout
- Tidak memiliki empty space kiri dan kanan
- Mengikuti pola User Management
- Mengikuti pola Provider Management
- Mengikuti pola Catalog Management
- Mengikuti pola Network Management
- Mendukung horizontal scrolling jika diperlukan
- Mendukung column resize
- Mengikuti tinggi data secara dinamis

###MODAL REQUIREMENT###

Create Datastore

Edit Datastore

menggunakan pola modal yang sama dengan:

- Provider Management
- Catalog Management
- Network Management
- User Management

###STATUS BADGE###

Status ditampilkan menggunakan badge:

- Active
- Inactive
- Provider Offline
- Datastore Missing
- Low Capacity

dengan style yang konsisten pada seluruh halaman Settings.

###ACTION MENU###

Action Menu menggunakan:

Three Dot Menu

yang ditampilkan di luar area scroll table.

Action Menu wajib tetap terlihat tanpa perlu melakukan horizontal scrolling.

###FILTER BEHAVIOR###

Provider Filter

memfilter berdasarkan:

provider_id

Node Filter

memfilter berdasarkan:

provider_node_id

Status Filter

memfilter berdasarkan:

datastore_status

###ARCHITECTURAL PRINCIPLE###

Datastore Management adalah:

Published Storage Layer

bukan:

Provider Storage Discovery Layer

###LAYER SEPARATION###

Discovery Layer

Provider
        │
        ▼
Provider Node
        │
        ▼
Provider Datastore

Service Layer

Datastore Management
        │
        ▼
Published Datastore

Consumption Layer

Provision VM
        │
        ▼
Deployment

###ABSTRACTION PRINCIPLE###

Published Datastore menyembunyikan detail storage provider dari User.

User tidak melihat:

- Provider
- Node
- Datastore Identifier
- Storage Internal Name

User hanya melihat:

- Standard Storage
- Production Storage
- High Performance Storage

###PUBLISHING PRINCIPLE###

Datastore Management tidak membuat Datastore baru.

Datastore Management hanya melakukan publish terhadap:

Provider Datastore

yang ditemukan oleh Discovery Engine.

###OWNERSHIP PRINCIPLE###

Provider tetap menjadi pemilik:

- Nodes
- Datastores
- Capacity Information

Datastore Management menjadi pemilik:

- Datastore Name
- Datastore Description
- Visibility Status
- Environment Assignment
- Tier Assignment

###ARCHITECTURAL BENEFIT###

Dengan pemisahan layer ini:

- Infrastruktur dapat berubah tanpa mempengaruhi User Experience
- Multi Provider dapat didukung tanpa mengubah Application Layer
- Discovery Layer dan Service Layer dapat berkembang secara independen
- User tidak terekspos terhadap detail storage provider

###DEPENDENCIES###

Datastore Management akan digunakan oleh:

- Environment Management
- Tier Management
- Provision VM
- Approval Request
- Inventory
- Terraform Deployment

###ENVIRONMENT MANAGEMENT###

Environment menentukan Datastore mana yang boleh digunakan.

Contoh:

Development

Allowed Datastores:

- Standard Storage

Production

Allowed Datastores:

- Production Storage
- High Performance Storage

###TIER MANAGEMENT###

Tier menentukan Datastore mana yang boleh digunakan berdasarkan level layanan.

Contoh:

Bronze

Allowed Datastores:

- Standard Storage

Gold

Allowed Datastores:

- Production Storage
- High Performance Storage

###PROVISION VM###

User memilih:

Published Datastore

bukan:

Provider Datastore

###APPROVAL REQUEST###

Approval menampilkan:

Published Datastore Name

yang lebih mudah dipahami oleh Approver.

###INVENTORY###

Inventory menyimpan:

datastore_id

dan menampilkan:

Published Datastore Name

bukan:

Provider Datastore Name

###TERRAFORM DEPLOYMENT###

Saat deployment dijalankan,

Backend melakukan resolve:

datastore_id
      │
      ▼
provider_datastore_id
      │
      ▼
provider_node_id
      │
      ▼
provider_id

untuk menentukan Datastore yang digunakan saat deployment.

###ARCHITECTURAL PRINCIPLE###

Seluruh lifecycle VM menggunakan:

Published Datastore

bukan:

Provider Datastore

sebagai representasi Storage yang dipilih User.