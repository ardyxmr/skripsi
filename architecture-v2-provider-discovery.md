ARCHITECTURE-V2
MODULE 01 – PROVIDER DISCOVERY ARCHITECTURE
###PURPOSE###

Provider Management merupakan Discovery Layer yang bertugas menghubungkan aplikasi dengan platform virtualisasi eksternal.

Provider merepresentasikan:

Infrastructure Endpoint

atau

Virtualization Platform Cluster

bukan individual node.

Contoh:

Provider:

Proxmox DC Jakarta

Node:

* pve01
* pve02
* pve03
* pve04

Provider:

Proxmox DC Lampung

Node:

* pve01
* pve02
* pve03

Saat ini implementasi menggunakan:

* Proxmox VE

Namun arsitektur harus disiapkan agar dapat mendukung:

* OpenStack
* OLVM
* VMware
* Nutanix

tanpa melakukan perubahan pada:

* Catalog Management
* Network Management
* Datastore Management
* Provisioning
* Approval
* Inventory

Provider bertanggung jawab melakukan:

* Authentication
* Discovery
* Resource Synchronization

Provider tidak bertanggung jawab terhadap:

* Provisioning Policy
* Approval Policy
* Environment Policy

karena fungsi tersebut berada pada layer yang berbeda.


###HIGH LEVEL FLOW###

Admin
│
▼
Add Provider
│
▼
Test Connection
│
▼
Save Provider
│
▼
Sync Resources
│
├── Discover Nodes
│
├── Discover Templates
│
├── Discover Networks
│
└── Discover Datastores
│
▼
Store Discovery Result
│
├── provider_nodes
├── provider_templates
├── provider_networks
└── provider_datastores
│
▼
Database
│
▼
Used By:
Catalog Management
Network Management
Datastore Management
Provisioning
Inventory



###PROVIDER TYPES###

Database harus mendukung tipe provider berikut:

proxmox
openstack
olvm

Implementasi saat ini:

proxmox

Future Ready:

openstack
olvm


###PROVIDER DRIVER ARCHITECTURE###

Backend menggunakan konsep Provider Driver.

ProviderFactory
│
├── ProxmoxProvider
├── OpenStackProvider
└── OLVMProvider

###BASE DRIVER INTERFACE###

Semua provider wajib memiliki method berikut:

testConnection()

discoverNodes()

discoverTemplates()

discoverNetworks()

discoverDatastores()

syncResources()

getNodeHealth()

###PURPOSE###

Provider Driver bertanggung jawab melakukan:

* Authentication
* Resource Discovery
* Resource Synchronization
* Node Health Validation

Provider Driver tidak bertanggung jawab melakukan:

* Provisioning
* Approval
* Environment Policy
* Inventory Policy

karena fungsi tersebut berada pada layer yang berbeda.


###DATABASE DESIGN###

providers

Field	Type

id	bigint

provider_name	varchar

provider_type	varchar

endpoint	varchar

username	varchar

token_id	varchar

token_secret	encrypted text

terraform_provider_source	varchar

terraform_provider_version	varchar

status	enum

last_tested_at	datetime

last_sync_at	datetime

created_at	timestamp

updated_at	timestamp

###FIELD DESCRIPTION###

provider_name

Nama provider yang ditampilkan pada aplikasi.

Contoh:

Proxmox DC Jakarta

Proxmox DC Lampung

provider_type

Possible values:

proxmox

openstack

olvm

terraform_provider_source

Contoh:

Telmate/proxmox

terraform_provider_version

Contoh:

3.0.2-rc04

Digunakan untuk generate provider.tf secara dinamis saat provisioning.







###PROVIDER RESOURCE DISCOVERY###

Provider tidak langsung digunakan oleh user.

Provider hanya melakukan discovery resource dari platform virtualisasi.

Discovery akan menghasilkan:

Nodes

Templates

Networks

Datastores

###DISCOVERY ORDER###

Provider
│
▼
Discover Nodes
│
▼
Discover Templates
│
▼
Discover Networks
│
▼
Discover Datastores

###DISCOVERY RESULT###

Discovery Result disimpan pada:

provider_nodes

provider_templates

provider_networks

provider_datastores

Resource hasil discovery belum dapat digunakan untuk provisioning.

Administrator harus melakukan proses Publish Resource melalui:

Catalog Management

Network Management

Datastore Management

Hanya resource yang telah dipublish yang dapat digunakan oleh user saat provisioning.


###PROVIDER NODES TABLE###

provider_nodes

Field	Type

id	bigint

provider_id	bigint

external_node_id	varchar

node_name	varchar

status	varchar

cpu_count	integer

total_memory	bigint

total_storage	bigint

discovered_status	varchar

last_sync_at	datetime

###NODE STATUS###

Possible values:

online

Offline

Maintenance

###PURPOSE###

Provider:

Proxmox DC Jakarta

dapat memiliki:

- pve01
- pve02
- pve03
- pve04

Node digunakan oleh:

- Catalog Management
- Network Management
- Datastore Management
- Provisioning
- Inventory

Node bukan Provider.

Provider adalah Cluster / Platform Endpoint.

Node adalah Resource Location.


###STATUS BEHAVIOR###

Connected

Provider dapat diakses.

Discovery dan Synchronization dapat dijalankan.

Node Discovery dapat dijalankan.

Template, Network, dan Datastore Discovery dapat dijalankan.

Disconnected

Provider tidak dapat diakses.

Discovery tidak dapat dijalankan.

Node Status tidak dapat diperbarui.

Resource yang berasal dari Provider tetap disimpan pada database namun ditandai sebagai:

Provider Offline

hingga koneksi kembali normal.

###RESOURCE BEHAVIOR###

Provider Status tidak menghapus hasil discovery sebelumnya.

Contoh:

Provider:

Proxmox DC Jakarta

Status:

Disconnected

Maka:

provider_nodes

provider_templates

provider_networks

provider_datastores

tetap disimpan untuk:

* Audit
* History
* Troubleshooting

Namun resource tersebut tidak dapat digunakan untuk provisioning hingga Provider kembali Connected.


###PROVIDER TEMPLATES TABLE###

provider_templates

Field	Type

id	bigint

provider_id	bigint

provider_node_id	bigint

external_template_id	varchar

template_name	varchar

node_name	varchar

template_type	varchar

discovered_status	varchar

last_sync_at	datetime

###TEMPLATE TYPE###

Possible values:

VM Template

Cloud Image

Template

###PURPOSE###

Template hasil discovery dari Provider.

Contoh:

Provider:

Proxmox DC Jakarta

Node:

pve01

Template:

ubuntu2204-template

Node:

pve02

Template:

rhel9-template

Template dapat berada pada node yang berbeda dalam Provider yang sama.

###NODE RELATION###

Provider
│
▼
Provider Node
│
▼
Provider Template

Template selalu terhubung ke Node tempat template tersebut ditemukan.

###DISCOVERY SOURCE###

Contoh Proxmox:

GET /api2/json/nodes/{node}/qemu

Filter:

template = 1

Hanya VM yang berstatus template yang akan disimpan ke:

provider_templates



###PROVIDER NETWORKS TABLE###

provider_networks

Field	Type

id	bigint

provider_id	bigint

provider_node_id	bigint

network_name	varchar

network_type	varchar

cidr	varchar

gateway	varchar

discovered_status	varchar

last_sync_at	datetime

###PURPOSE###

Network hasil discovery dari Provider.

Contoh:

Provider:

Proxmox DC Jakarta

Node:

pve01

Network:

vmbr0

CIDR:

10.10.10.0/24

Node:

pve02

Network:

vmbr0

CIDR:

10.10.11.0/24

Walaupun memiliki nama network yang sama, keduanya dianggap resource yang berbeda karena berada pada node yang berbeda.

###NODE RELATION###

Provider
│
▼
Provider Node
│
▼
Provider Network

Network selalu terhubung ke Node tempat network tersebut ditemukan.

###DISCOVERY SOURCE###

Contoh Proxmox:

GET /api2/json/nodes/{node}/network

Data yang diambil:

* Interface Name
* Network Type
* CIDR
* Gateway

Hasil discovery disimpan ke:

provider_networks

###WHY NODE IS REQUIRED###

Contoh:

pve01

vmbr0

10.10.10.0/24

pve02

vmbr0

10.10.11.0/24

Walaupun nama interface sama:

vmbr0

resource tetap dianggap berbeda karena berada pada node yang berbeda dan dapat memiliki konfigurasi jaringan yang berbeda.


###PROVIDER DATASTORES TABLE###

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

###PURPOSE###

Datastore hasil discovery dari Provider.

Contoh:

Provider:

Proxmox DC Jakarta

Node:

pve01

Datastore:

local-lvm

Capacity:

500 GB

Node:

pve02

Datastore:

local-lvm

Capacity:

1 TB

Walaupun memiliki nama datastore yang sama, keduanya dianggap resource yang berbeda karena berada pada node yang berbeda.

###NODE RELATION###

Provider
│
▼
Provider Node
│
▼
Provider Datastore

Datastore selalu terhubung ke Node tempat datastore tersebut ditemukan.

###DISCOVERY SOURCE###

Contoh Proxmox:

GET /api2/json/nodes/{node}/storage

Data yang diambil:

* Datastore Name
* Datastore Type
* Total Capacity
* Used Capacity
* Available Capacity

Hasil discovery disimpan ke:

provider_datastores

###WHY NODE IS REQUIRED###

Contoh:

pve01

local-lvm

500 GB

pve02

local-lvm

1 TB

Walaupun nama datastore sama:

local-lvm

resource tetap dianggap berbeda karena berada pada node yang berbeda dan dapat memiliki kapasitas yang berbeda.

###CAPACITY INFORMATION###

Capacity information digunakan untuk:

* Monitoring
* Datastore Health Check
* Future Capacity Validation
* Future Automatic Placement

Capacity information tidak digunakan sebagai provisioning policy.

Provisioning policy tetap ditentukan oleh:

* Environment
* Published Datastore
* Tier


###DISCOVERED STATUS###

Semua Discovery Resource memiliki field:

discovered_status

Termasuk:

* provider_nodes
* provider_templates
* provider_networks
* provider_datastores

###VALUES###

Active

Missing

###ACTIVE###

Resource ditemukan pada proses discovery terbaru.

###MISSING###

Resource tidak ditemukan pada proses discovery terbaru.

Resource tidak dihapus dari database.

Resource tetap disimpan untuk:

* Audit
* History
* Troubleshooting
* Traceability

###EXAMPLE###

Provider sebelumnya memiliki:

vmbr0

vmbr1

vmbr2

Sync berikutnya menemukan:

vmbr0

vmbr1

Maka:

vmbr2

tidak dihapus.

Status berubah menjadi:

Missing

###NODE EXAMPLE###

Discovery sebelumnya:

pve01

pve02

pve03

Sync berikutnya:

pve01

pve03

Maka:

pve02

Status:

Missing

###TEMPLATE EXAMPLE###

Discovery sebelumnya:

ubuntu2204-template

rhel9-template

Sync berikutnya:

ubuntu2204-template

Maka:

rhel9-template

Status:

Missing

###PROVISIONING BEHAVIOR###

Resource dengan status:

Missing

tidak dapat digunakan untuk:

* Catalog Creation
* Network Publication
* Datastore Publication
* Provisioning

hingga resource ditemukan kembali pada proses discovery berikutnya.

###RESTORE BEHAVIOR###

Jika resource ditemukan kembali pada proses discovery berikutnya:

Status otomatis berubah menjadi:

Active

tanpa membuat record baru.


###PROVIDER API CONFIGURATION###

Backend menggunakan:

config/provider_endpoints.php

Contoh:

return [

'proxmox' => [

```
'discover_nodes'
    => '/api2/json/nodes',

'discover_templates'
    => '/api2/json/cluster/resources?type=vm',

'discover_networks'
    => '/api2/json/nodes/{node}/network',

'discover_datastores'
    => '/api2/json/nodes/{node}/storage',

'discover_vm_inventory'
    => '/api2/json/cluster/resources?type=vm',
```

],

];

###PURPOSE###

Seluruh endpoint discovery disimpan pada:

config/provider_endpoints.php

agar setiap Provider Driver memiliki konfigurasi endpoint yang berbeda tanpa mengubah business logic.

###NODE VARIABLE###

Placeholder:

{node}

akan diisi menggunakan data dari:

provider_nodes

Contoh:

Node:

pve01

Endpoint:

/api2/json/nodes/pve01/network

Node:

pve02

Endpoint:

/api2/json/nodes/pve02/storage

###MULTI PROVIDER SUPPORT###

Contoh:

'openstack' => [ ... ]

'olvm' => [ ... ]

Setiap provider dapat memiliki endpoint discovery yang berbeda.

Business Logic tetap menggunakan:

discoverNodes()

discoverTemplates()

discoverNetworks()

discoverDatastores()

tanpa mengetahui detail implementasi API masing-masing provider.

###DISCOVERY FLOW###

Provider
│
▼
Discover Nodes
│
▼
Loop Each Node
│
├── Discover Networks
├── Discover Datastores
└── Discover Templates
│
▼
Store Discovery Result

```
```


###PROVIDER API AUTHENTICATION###

Provider Authentication menggunakan:

API Credential

bukan:

Browser Session

Cookie

###CURRENT IMPLEMENTATION###

Proxmox VE menggunakan:

API Token Authentication

Header:

Authorization:

PVEAPIToken=

terraform@pve!selfservice=

TOKEN_SECRET

###CREDENTIAL STORAGE###

Credential disimpan pada:

providers

Field:

token_id

token_secret

token_secret harus disimpan dalam bentuk:

Encrypted

dan tidak boleh ditampilkan kembali pada UI setelah Provider berhasil dibuat.

###AUTHENTICATION FLOW###

Admin
│
▼
Create Provider
│
▼
Input Credential
│
▼
Test Connection
│
▼
Authentication Success
│
▼
Save Provider
│
▼
Discovery Enabled

###MULTI PROVIDER SUPPORT###

Setiap Provider Driver bertanggung jawab mengimplementasikan mekanisme authentication masing-masing.

Contoh:

Proxmox

API Token

OpenStack

Keystone Authentication

OLVM

API Token / OAuth

Business Logic tidak bergantung pada jenis authentication provider.

Semua Provider Driver wajib menyediakan method:

testConnection()

untuk memvalidasi credential sebelum Provider disimpan.

###SECURITY REQUIREMENT###

Credential tidak boleh:

* ditampilkan pada table Provider
* ditampilkan pada Audit Log
* dikirim kembali ke Frontend setelah disimpan

Audit hanya mencatat:

Provider Created

Provider Updated

Provider Deleted

tanpa menyimpan nilai credential.


###TEST CONNECTION FLOW###

Admin
│
▼
Test Connection
│
▼
Provider Driver
│
▼
Authentication
│
▼
GET Provider Version
│
▼
Success
│
▼
Status = Connected

Jika gagal:

Status = Disconnected

###CURRENT IMPLEMENTATION###

Proxmox:

GET /api2/json/version

###MULTI PROVIDER SUPPORT###

Setiap Provider Driver dapat menggunakan endpoint berbeda untuk validasi koneksi.

Contoh:

Proxmox

/api2/json/version

OpenStack

Keystone Authentication

OLVM

API Health Endpoint

Business Logic hanya memanggil:

testConnection()


###SYNC RESOURCES FLOW###

Admin:

Provider Management
│
▼
Sync Resources

Backend:

Discover Nodes
│
▼
Loop Each Node
│
├── Discover Templates
├── Discover Networks
└── Discover Datastores
│
▼
Store Result

provider_nodes

provider_templates

provider_networks

provider_datastores

Update:

last_sync_at

###SYNC BEHAVIOR###

Discovery tidak menghapus resource yang sudah ada.

Jika resource tidak ditemukan:

discovered_status = Missing

Jika resource ditemukan kembali:

discovered_status = Active

###NODE DISCOVERY FLOW###

Provider
│
▼
Discover Nodes
│
▼
Store provider_nodes
│
▼
Loop Each Node
│
├── Networks
├── Datastores
└── Templates


###AUTOMATIC SYNC###

Background Scheduler:

Every 30 Minutes

atau

Every 1 Hour

menggunakan:

Laravel Scheduler

###SYNC TYPES###

Resource Discovery Sync

Tujuan:

* Update Nodes
* Update Templates
* Update Networks
* Update Datastores

Inventory Discovery Sync

Tujuan:

* Update VM Location
* Update Current Node
* Update VM Status

###MANUAL SYNC###

Administrator tetap dapat menjalankan:

Sync Resources

secara manual melalui:

Provider Management

untuk mempercepat proses discovery tanpa menunggu scheduler berikutnya.


###UI STATISTICS###

Provider Management Widgets

Providers

Connected

Nodes

Templates

Datastores

###WIDGET DESCRIPTION###

Providers

Total Provider yang terdaftar.

Connected

Jumlah Provider dengan status:

Connected

Nodes

Total Node hasil discovery dari seluruh Provider.

Templates

Total Template hasil discovery dengan:

discovered_status = Active

Datastores

Total Datastore hasil discovery dengan:

discovered_status = Active

###DATA SOURCE###

Semua data berasal dari database discovery.

Bukan hardcoded.

Data diambil dari:

providers

provider_nodes

provider_templates

provider_datastores

###REFRESH BEHAVIOR###

Widget diperbarui saat:

* Sync Resources
* Automatic Discovery Sync

Widget tidak melakukan API Call langsung ke Provider.


###RESOURCE OWNERSHIP###

Provider adalah Source of Truth.

Provider
├ Nodes
├ Templates
├ Networks
└ Datastores

Discovery Result disimpan ke:

* provider_nodes
* provider_templates
* provider_networks
* provider_datastores

###OWNERSHIP RULE###

Provider memiliki ownership terhadap seluruh resource hasil discovery.

Catalog

Network

Datastore

hanya melakukan publish resource dari Discovery Layer.

Application Layer tidak memiliki ownership terhadap resource Provider.

###SINGLE SOURCE OF TRUTH###

Jika terjadi perbedaan antara:

Provider

dan

Database

maka hasil discovery terbaru dari Provider menjadi sumber data utama.

###NO DIRECT API ACCESS###

Modul berikut tidak boleh melakukan API Call langsung ke Provider:

* Catalog Management
* Network Management
* Datastore Management
* Provisioning
* Inventory
* Approval

Semua modul wajib membaca data melalui Database.


###ARCHITECTURAL PRINCIPLE###

###DISCOVERY LAYER###

Provider API
│
▼
Provider Driver
│
▼
Discovery Engine
│
▼
Database

###APPLICATION LAYER###

Catalog

Network

Datastore

Environment

Tier

Provisioning

Inventory

Approval

Audit

###DATA ACCESS RULE###

Application Layer tidak pernah melakukan query langsung ke:

* Proxmox
* OpenStack
* OLVM

Application Layer hanya membaca data yang telah disimpan oleh Discovery Engine.

###BENEFITS###

* Mengurangi API Load ke Provider
* Meningkatkan Performance
* Mendukung Multi Provider
* Mendukung Offline Discovery Data
* Mempermudah Audit dan History Tracking

###ARCHITECTURAL FLOW###

Provider
│
▼
Discovery Layer
│
▼
Database
│
▼
Application Layer
│
▼
Provisioning & Lifecycle Management


###FUTURE PROVIDER SUPPORT###

Arsitektur menggunakan:

Provider Driver Pattern

ProviderFactory
│
├── ProxmoxProvider
├── OpenStackProvider
└── OLVMProvider

Ketika menambahkan Provider baru:

OpenStack

OLVM

VMware

Nutanix

yang perlu dibuat hanya:

OpenStackProvider

OLVMProvider

VMwareProvider

NutanixProvider

###NO APPLICATION CHANGES###

Penambahan Provider baru tidak memerlukan perubahan pada:

* Catalog Management
* Network Management
* Datastore Management
* Environment Management
* Tier Management
* Provisioning
* Approval
* Inventory
* Audit

###REQUIRED DRIVER METHODS###

Setiap Provider Driver wajib mengimplementasikan:

testConnection()

discoverNodes()

discoverTemplates()

discoverNetworks()

discoverDatastores()

syncResources()

###ARCHITECTURAL BENEFIT###

Application Layer tidak mengetahui jenis Provider yang digunakan.

Application Layer hanya membaca:

* provider_nodes
* provider_templates
* provider_networks
* provider_datastores

melalui Database.

Dengan pendekatan ini, penambahan Provider baru hanya memerlukan implementasi Driver tanpa mengubah Business Logic yang sudah ada.
