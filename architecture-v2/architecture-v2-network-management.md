ARCHITECTURE-V2

MODULE 03 – NETWORK MANAGEMENT ARCHITECTURE

###PURPOSE###

Network Management berfungsi sebagai lapisan abstraksi untuk resource network yang ditemukan dari Provider.

Tujuan utama:

User tidak boleh memilih Network mentah dari Provider.

Administrator harus menentukan Network mana yang boleh digunakan untuk provisioning.

Contoh:

Provider Discovery:

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

User tidak boleh melihat:

* vmbr0
* vmbr10-dev
* vmbr20-prod
* vmbr30-dmz

User hanya boleh melihat:

* Development Network
* Production Network
* DMZ Network

yang telah dipublish oleh Administrator.

Network bukan Provider Resource.

Network adalah:

Published Network Service

yang berasal dari Network hasil discovery Provider.

###ARCHITECTURE POSITION###

Provider
│
▼
Provider Nodes
│
▼
Provider Networks
│
▼
Network Management
│
▼
Published Networks
│
▼
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
Discover Networks
│
▼
provider_networks
│
▼
Admin Publish Network
│
▼
networks
│
▼
Provision VM


###DESIGN PRINCIPLE###

Network Management bukan Network Discovery.

Network Management adalah:

Network Publishing Layer

###DISCOVERY LAYER###

Provider:

Proxmox DC Jakarta

Node:

pve01

Network:

vmbr10-dev

CIDR:

10.10.10.0/24

###PUBLISHED NETWORK###

Published Network:

Development Network

###DISCOVERY LAYER###

Provider:

Proxmox DC Jakarta

Node:

pve02

Network:

vmbr20-prod

CIDR:

10.20.20.0/24

###PUBLISHED NETWORK###

Published Network:

Production Network

###NETWORK ABSTRACTION###

User tidak pernah melihat:

* Provider Name
* Node Name
* Interface Name
* Bridge Name

User hanya melihat:

* Development Network
* Production Network
* DMZ Network

###PUBLISHING PRINCIPLE###

Published Network tidak membuat Network baru.

Published Network hanya melakukan publish terhadap Network yang ditemukan oleh Discovery Engine.

###SERVICE ABSTRACTION###

Provider Resource:

vmbr10-dev

Published Service:

Development Network

Provider Resource:

vmbr20-prod

Published Service:

Production Network

###MULTI NODE SUPPORT###

Network dengan nama yang sama dapat berada pada Node yang berbeda.

Contoh:

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

Walaupun nama Network sama, keduanya dianggap resource yang berbeda karena berasal dari Node yang berbeda.

Administrator menentukan Network mana yang akan dipublish menjadi Published Network.



###DATABASE DESIGN###

provider_networks

(sudah dibuat pada Provider Discovery)

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

###PUBLISHED NETWORK TABLE###

networks

Field	Type

id	bigint

network_name	varchar

network_description	text

provider_id	bigint

provider_node_id	bigint

provider_network_id	bigint

status	varchar

created_by	bigint

created_at	timestamp

updated_at	timestamp

###FIELD DESCRIPTION###

provider_id

Provider tempat Network ditemukan.

Contoh:

Proxmox DC Jakarta

provider_node_id

Node tempat Network ditemukan.

Contoh:

pve01

provider_network_id

Network hasil discovery yang dipublish menjadi Published Network.

Contoh:

vmbr0

###RELATIONSHIP###

Provider
│
▼
Provider Node
│
▼
Provider Network
│
▼
Published Network

###PURPOSE###

Published Network menyimpan referensi ke Network hasil discovery.

Published Network tidak menyimpan konfigurasi Network secara langsung.

Konfigurasi tetap berasal dari:

provider_networks

melalui Discovery Layer.


###NETWORK STATUS###

Possible values:

Active

Inactive

Provider Offline

Network Missing

###ACTIVE###

Published Network dapat digunakan untuk provisioning.

Provider, Node, dan Network masih tersedia.

###INACTIVE###

Published Network dinonaktifkan oleh Administrator.

Network tidak ditampilkan pada Provision VM.

###PROVIDER OFFLINE###

Provider dalam status:

Disconnected

Published Network tetap disimpan namun tidak dapat digunakan untuk provisioning.

###NETWORK MISSING###

Network hasil discovery tidak ditemukan pada proses synchronization terbaru.

Published Network tetap disimpan untuk:

* Audit
* History
* Traceability

Namun tidak dapat digunakan untuk provisioning hingga Network ditemukan kembali.

###WHY STATUS EXISTS###

Misalnya:

Provider:

Proxmox DC Jakarta

Status:

Disconnected

Maka seluruh Published Network yang berasal dari Provider tersebut:

* Development Network
* Production Network
* DMZ Network

otomatis berubah menjadi:

Provider Offline

###NETWORK MISSING EXAMPLE###

Discovery sebelumnya:

vmbr10-dev

Discovery terbaru:

Network tidak ditemukan

Maka:

Published Network:

Development Network

Status:

Network Missing

###AUTOMATIC RECOVERY###

Jika:

Provider kembali Connected

atau

Network ditemukan kembali pada proses discovery berikutnya

maka status otomatis berubah menjadi:

Active

tanpa memerlukan tindakan Administrator.

###PROVISIONING BEHAVIOR###

Published Network dengan status:

* Provider Offline
* Network Missing
* Inactive

tidak dapat dipilih pada:

Provision VM

Hanya Network dengan status:

Active

yang dapat digunakan untuk deployment.


###NETWORK RELATION###

providers
│
▼
provider_nodes
│
▼
provider_networks
│
▼
networks

###RELATIONSHIP DESCRIPTION###

Provider

memiliki banyak:

Provider Nodes

Provider Node

memiliki banyak:

Provider Networks

Provider Network

dapat dipublish menjadi:

Published Network

###EXAMPLE###

Provider:

Proxmox DC Jakarta
│
▼

Node:

pve01
│
▼

Network:

vmbr10-dev
│
▼

Published Network:

Development Network

###PURPOSE###

Relationship ini memastikan sistem dapat mengetahui:

* Provider asal Network
* Node asal Network
* Network yang digunakan Published Network

sehingga backend dapat melakukan provisioning dengan target Network yang benar.


###CREATE NETWORK FLOW###

Admin:

Settings
│
▼
Network Management
│
▼

* Create Network

###FORM###

Network Name

Description

Provider

Node

Source Network

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

Available Networks

berdasarkan:

provider_id
+
provider_node_id

Contoh:

vmbr0

vmbr10-dev

vmbr20-prod

Administrator memilih:

Source Network

Contoh:

vmbr10-dev

Administrator menentukan:

Network Name

Development Network

Administrator menentukan:

Status

Active

Lalu sistem membuat:

Published Network

###RELATIONSHIP CREATED###

Published Network
│
▼
Provider
│
▼
Node
│
▼
Network

###USER EXPERIENCE###

User tidak pernah melihat:

* Provider Network
* Node Name
* Interface Name
* Bridge Name

User hanya melihat:

* Development Network
* Production Network
* DMZ Network

pada halaman Provision VM.

###VALIDATION###

Published Network tidak dapat dibuat jika:

* Provider Offline
* Node Missing
* Network Missing

Hanya resource dengan:

discovered_status = Active

yang dapat dipilih saat pembuatan Published Network.


###NETWORK HEALTH CHECK###

Saat Provider Discovery Sync berjalan,

Backend melakukan verifikasi:

* Provider Connected?
* Network Exists?
* Resource Status Active?

###HEALTH CHECK FLOW###

Provider Discovery
│
▼
Sync Resources
│
▼
Validate Network Dependency
│
├── Provider Status
├── Network Status
└── Discovery Status
│
▼
Update Network Status

###PROVIDER OFFLINE###

Jika:

Provider Status

=

Disconnected

Maka seluruh Published Network yang berasal dari Provider tersebut berubah menjadi:

Provider Offline

###NETWORK MISSING###

Jika:

Provider Network

tidak ditemukan pada proses discovery terbaru

atau

provider_network.discovered_status

=

Missing

Maka Published Network berubah menjadi:

Network Missing

###ACTIVE###

Published Network berubah menjadi:

Active

jika:

* Provider Status = Connected
* Network Status = Active
* Published Network Status = Active secara administratif

###PROVIDER OFFLINE EXAMPLE###

Provider:

Proxmox DC Jakarta

Status:

Disconnected

Published Networks:

Development Network

Production Network

DMZ Network

Status berubah menjadi:

Provider Offline

###NETWORK MISSING EXAMPLE###

Discovery sebelumnya:

vmbr10-dev

Discovery terbaru:

Network tidak ditemukan

Maka:

Published Network:

Development Network

Status:

Network Missing

###AUTOMATIC RECOVERY###

Jika:

Provider kembali Connected

atau

Network ditemukan kembali pada proses discovery berikutnya

maka status Published Network otomatis dipulihkan menjadi:

Active

tanpa memerlukan tindakan Administrator.

###PROVISIONING BEHAVIOR###

Published Network dengan status:

* Inactive
* Provider Offline
* Network Missing

tidak dapat dipilih pada:

Provision VM

Hanya Published Network dengan status:

Active

yang dapat digunakan untuk deployment.

###PURPOSE###

Network Health Check memastikan hanya Network yang valid dan dapat digunakan yang ditampilkan pada:

* Network Management
* Provision VM

sehingga User tidak dapat memilih Network yang tidak tersedia pada Provider.


###NETWORK MANAGEMENT WIDGETS###

Widgets:

Published Networks

Active

Inactive

Provider Offline

Network Missing

###WIDGET DESCRIPTION###

Published Networks

Total Published Network yang terdaftar.

Active

Published Network yang dapat digunakan untuk provisioning.

Inactive

Published Network yang dinonaktifkan oleh Administrator.

Provider Offline

Published Network yang tidak dapat digunakan karena Provider dalam status:

Disconnected

Network Missing

Published Network yang kehilangan Network hasil discovery.

###DATA SOURCE###

Seluruh data berasal dari:

networks

Bukan dari:

provider_networks

###REFRESH BEHAVIOR###

Widget diperbarui saat:

* Sync Resources
* Automatic Discovery Sync

Widget tidak melakukan API Call langsung ke Provider.

###PURPOSE###

Widget memberikan ringkasan kesehatan Published Network yang tersedia pada sistem.


###NETWORK TABLE###

Network	Provider	Status

###EXAMPLE###

Network:

Development Network

Provider:

Proxmox DC Jakarta

Status:

Active

---

Network:

Production Network

Provider:

Proxmox DC Jakarta

Status:

Network Missing

###TABLE BEHAVIOR###

* Resizable Columns
* Search
* Status Filter
* Pagination
* Sortable Columns

###DATA SOURCE###

Data berasal dari:

networks

###ACTIONS###

Edit Network

Disable Network

Delete Network

###DETAIL VIEW###

Saat Administrator membuka:

Edit Network

Sistem menampilkan:

* Provider
* Node
* Source Network
* CIDR
* Gateway
* Discovery Status

Informasi Discovery tidak ditampilkan pada table utama.

###DELETE RULE###

Published Network tidak dapat dihapus jika:

Masih digunakan oleh:

* Environment Policy
* Active VM Request
* Inventory
* Active Deployment

###DELETE VALIDATION MESSAGE###

Network masih digunakan oleh resource aktif.

Hapus relasi atau deployment terkait terlebih dahulu sebelum menghapus Network.


###PROVISION INTEGRATION###

Saat User membuka:

Provision VM

Network Dropdown tidak membaca:

provider_networks

tetapi membaca:

networks

yang telah dipublish oleh Administrator.

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

Available Networks

berdasarkan:

* Environment Policy
* Provider
* Node
* Network Status

###NETWORK SOURCE###

Provision VM tidak pernah membaca:

provider_networks

secara langsung.

Provision VM hanya membaca:

networks

sebagai Published Network Layer.

###USER EXPERIENCE###

User melihat:

* Development Network
* Production Network
* DMZ Network

User tidak melihat:

* vmbr0
* vmbr10-dev
* vmbr20-prod
* vmbr30-dmz

###NETWORK RESOLUTION###

Saat User memilih:

Development Network

Backend melakukan resolve:

Published Network
│
▼
Provider Network
│
▼
Provider Node
│
▼
Provider

untuk menentukan Network yang digunakan pada deployment.

###VALIDATION###

Hanya Network dengan status:

Active

yang dapat ditampilkan pada:

Provision VM

Network dengan status:

* Inactive
* Provider Offline
* Network Missing

tidak dapat dipilih oleh User.

###ARCHITECTURAL PRINCIPLE###

Provision VM menggunakan:

Published Network

bukan:

Provider Network

karena User berinteraksi dengan Service Layer,

bukan Discovery Layer.


###FUTURE MULTI PROVIDER SUPPORT###

Published Network tidak bergantung pada jenis Provider tertentu.

###EXAMPLE###

Provider:

Proxmox DC Jakarta

Node:

pve01

Network:

vmbr10-dev

Published Network:

Development Network

---

Provider:

OpenStack LAB

Network:

tenant-net-01

Published Network:

Development Network

###PROVISIONING BEHAVIOR###

Provisioning tidak bergantung pada jenis Provider.

Provisioning selalu menggunakan:

network_id

sebagai entry point.

Backend melakukan resolve:

Published Network
│
▼
Provider Network
│
▼
Provider Node
│
▼
Provider

untuk menentukan Network yang digunakan saat deployment.

###PROVIDER ABSTRACTION###

User tidak mengetahui apakah Network berasal dari:

* Proxmox
* OpenStack
* OLVM
* VMware
* Nutanix

User hanya melihat:

* Development Network
* Production Network
* DMZ Network

###ARCHITECTURAL BENEFIT###

Penambahan Provider baru tidak memerlukan perubahan pada:

* Network Management
* Environment Management
* Provisioning
* Approval
* Inventory

karena seluruh proses selalu dimulai dari:

network_id

yang kemudian di-resolve melalui Discovery Layer.

###ARCHITECTURAL PRINCIPLE###

Discovery Layer

Provider
│
▼
Node
│
▼
Network

Service Layer

Published Network
│
▼
Provision VM

Published Network menjadi kontrak stabil antara Infrastructure Layer dan Application Layer.


###ENVIRONMENT INTEGRATION###

Published Network dapat dibatasi berdasarkan Environment Policy.

###PURPOSE###

Environment menentukan Network mana yang boleh digunakan untuk provisioning.

Environment tidak bergantung pada Provider Resource.

Environment hanya membaca:

Published Network

###EXAMPLE###

Published Network:

Development Network

Allowed Environment:

* Development
* Staging

---

Published Network:

Production Network

Allowed Environment:

* Production

###DATABASE DESIGN###

network_environment_rules

Field	Type

network_id	bigint

environment_id	bigint

###RELATIONSHIP###

Environment
│
▼
Network Policy
│
▼
Published Network

###PROVISIONING BEHAVIOR###

Saat User memilih:

Environment:

Development

Backend memfilter:

Available Networks

berdasarkan:

network_environment_rules

###FILTERING FLOW###

Environment
│
▼
Allowed Networks
│
▼
Published Networks
│
▼
Network Dropdown

###EXAMPLE###

Environment:

Development

Allowed Networks:

Development Network

Shared Services Network

Network Dropdown hanya menampilkan:

* Development Network
* Shared Services Network

---

Environment:

Production

Allowed Networks:

Production Network

DMZ Network

Network Dropdown hanya menampilkan:

* Production Network
* DMZ Network

###MULTI LAYER FILTERING###

Network yang ditampilkan pada Provision VM harus memenuhi seluruh syarat berikut:

* Environment Policy
* Provider Selection
* Node Selection
* Network Status = Active

###ARCHITECTURAL PRINCIPLE###

Environment menjadi:

Business Policy Layer

Network menjadi:

Published Infrastructure Service

Environment tidak mengetahui:

* Provider
* Node
* Network Interface

Environment hanya menentukan:

Network mana yang boleh digunakan.


###APPROVAL & INVENTORY INTEGRATION###

###INVENTORY INTEGRATION###

Saat VM berhasil dibuat,

Inventory menyimpan:

network_id

dan menampilkan:

Published Network Name

bukan:

Provider Network Name

###EXAMPLE###

Inventory menampilkan:

Development Network

bukan:

vmbr10-dev

###PURPOSE###

Published Network lebih mudah dipahami oleh:

* User
* Approver
* Administrator

dibandingkan nama Network mentah dari Provider.

###APPROVAL INTEGRATION###

Saat User mengajukan:

Provision VM

Approval Request menampilkan:

Network:

Development Network

bukan:

vmbr10-dev

###PROVISIONING RESOLUTION###

Saat deployment dijalankan,

Backend melakukan resolve:

network_id
│
▼
provider_network_id
│
▼
provider_node_id
│
▼
provider_id

untuk menentukan Network yang digunakan pada deployment.

###USER EXPERIENCE###

User melihat:

Development Network

Production Network

DMZ Network

User tidak pernah melihat:

* vmbr0
* vmbr10-dev
* vmbr20-prod
* tenant-net-01

###ARCHITECTURAL PRINCIPLE###

Inventory dan Approval menggunakan:

Published Network

sebagai representasi Network.

Provider Network tetap menjadi bagian dari:

Discovery Layer

dan tidak ditampilkan kepada User.

###AUDIT BENEFIT###

Audit Log tetap dapat melakukan trace:

Published Network
│
▼
Provider Network
│
▼
Provider Node
│
▼
Provider

untuk kebutuhan:

* Troubleshooting
* Audit
* Investigation

tanpa mengekspos detail infrastruktur kepada User.


###UI CONSISTENCY REQUIREMENT###

Mengikuti:

* User Management
* Provider Management
* Catalog Management

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

* Full Width Layout
* Tidak memiliki empty space kiri dan kanan
* Mengikuti pola User Management
* Mengikuti pola Provider Management
* Mengikuti pola Catalog Management
* Mendukung horizontal scrolling jika diperlukan
* Mendukung column resize
* Mengikuti tinggi data secara dinamis

###MODAL REQUIREMENT###

Create Network

Edit Network

menggunakan pola modal yang sama dengan:

* Provider Management
* Catalog Management
* User Management

###STATUS BADGE###

Status ditampilkan menggunakan badge:

* Active
* Inactive
* Provider Offline
* Network Missing

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

network_status


###ARCHITECTURAL PRINCIPLE###

Network Management adalah:

Published Network Layer

bukan:

Provider Network Discovery Layer

###LAYER SEPARATION###

Discovery Layer

Provider
│
▼
Provider Node
│
▼
Provider Network

Service Layer

Network Management
│
▼
Published Network

Consumption Layer

Provision VM
│
▼
Deployment

###ABSTRACTION PRINCIPLE###

Published Network menyembunyikan detail infrastruktur dari User.

User tidak melihat:

* Provider
* Node
* Network Interface
* Bridge Name

User hanya melihat:

* Development Network
* Production Network
* DMZ Network

###PUBLISHING PRINCIPLE###

Network Management tidak membuat Network baru.

Network Management hanya melakukan publish terhadap:

Provider Network

yang ditemukan oleh Discovery Engine.

###OWNERSHIP PRINCIPLE###

Provider tetap menjadi pemilik:

* Nodes
* Networks

Network Management menjadi pemilik:

* Network Name
* Network Description
* Visibility Status
* Environment Assignment

###ARCHITECTURAL BENEFIT###

Dengan pemisahan layer ini:

* Infrastruktur dapat berubah tanpa mempengaruhi User Experience
* Multi Provider dapat didukung tanpa mengubah Application Layer
* Discovery Layer dan Service Layer dapat berkembang secara independen
* User tidak terekspos terhadap detail Provider


###DEPENDENCIES###

Network Management akan digunakan oleh:

* Environment Management
* Provision VM
* Approval Request
* Inventory
* Terraform Deployment

###ENVIRONMENT MANAGEMENT###

Environment menentukan Network mana yang boleh digunakan.

Contoh:

Development

Allowed Networks:

* Development Network

Production

Allowed Networks:

* Production Network
* DMZ Network

###PROVISION VM###

User memilih:

Published Network

bukan:

Provider Network

###APPROVAL REQUEST###

Approval menampilkan:

Published Network Name

yang lebih mudah dipahami oleh Approver.

###INVENTORY###

Inventory menyimpan:

network_id

dan menampilkan:

Published Network Name

bukan:

Provider Network Name

###TERRAFORM DEPLOYMENT###

Saat deployment dijalankan,

Backend melakukan resolve:

network_id
│
▼
provider_network_id
│
▼
provider_node_id
│
▼
provider_id

untuk menentukan Network yang digunakan pada deployment.

###ARCHITECTURAL PRINCIPLE###

Seluruh lifecycle VM menggunakan:

Published Network

bukan:

Provider Network

sebagai representasi Network yang dipilih User.
