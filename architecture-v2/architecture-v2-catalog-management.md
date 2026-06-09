ARCHITECTURE-V2

MODULE 02 – CATALOG MANAGEMENT ARCHITECTURE

###PURPOSE###

Catalog Management berfungsi sebagai lapisan abstraksi antara resource mentah hasil discovery provider dan resource yang dapat digunakan oleh end-user.

Tujuan utama:

Menyembunyikan resource mentah provider dan hanya menampilkan service yang telah dipublish oleh administrator.

User tidak boleh melihat:

* ubuntu2204-template-v3
* rhel9-template
* rocky9-template

User hanya boleh melihat:

* Ubuntu 22.04 LTS
* Red Hat Enterprise Linux 9
* Rocky Linux 9

Catalog bukan Template.

Catalog adalah:

Published Service Offering

yang berasal dari Template hasil discovery Provider.

Catalog juga menentukan:

* Nama yang ditampilkan ke User
* Deskripsi Service
* Icon / Thumbnail
* Visibility Status
* Environment Assignment
* Tier Assignment

User hanya berinteraksi dengan Catalog.

User tidak pernah melihat Template mentah Provider.

###ARCHITECTURE POSITION###

Provider
│
▼
Provider Nodes
│
▼
Provider Templates
│
▼
Catalog Management
│
▼
Published Catalog
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
Discover Templates
│
▼
provider_templates
│
▼
Catalog Management
│
▼
Admin Publish Catalog
│
▼
catalogs
│
▼
Catalog Page
│
▼
Provision VM


###DESIGN PRINCIPLE###

Catalog bukan Template.

Catalog adalah:

Service Offering

yang dipublikasikan dari Template hasil discovery Provider.

Contoh:

Provider:

Proxmox DC Jakarta

Node:

pve01

Template:

ubuntu2204-template

Catalog:

Ubuntu 22.04 LTS

Provider:

Proxmox DC Jakarta

Node:

pve02

Template:

rockylinux9-template

Catalog:

Rocky Linux 9

Catalog adalah produk yang dikonsumsi User.

User tidak pernah melihat:

* Provider
* Node
* Template Mentah

User hanya melihat:

* Nama Catalog
* Deskripsi Catalog
* Icon / Thumbnail
* Status Catalog

###SERVICE ABSTRACTION###

Catalog menyembunyikan detail infrastruktur dari User.

User tidak mengetahui:

* Nama Template
* Nama Node
* Nama Provider Resource

Contoh:

User melihat:

Ubuntu 22.04 LTS

Backend melakukan resolve:

Catalog
│
▼
Provider Template
│
▼
Provider Node
│
▼
Provider

saat proses provisioning.

###CATALOG OWNERSHIP###

Catalog tidak memiliki Template.

Template tetap dimiliki oleh Provider Discovery Layer.

Catalog hanya melakukan publish terhadap Template yang telah ditemukan oleh Discovery Engine.

###MULTI NODE SUPPORT###

Template dengan nama yang sama dapat berada pada Node yang berbeda.

Contoh:

pve01

ubuntu2204-template

pve02

ubuntu2204-template

Catalog tetap dapat dipublikasikan dari Template yang dipilih administrator.

Node asal Template akan digunakan saat proses provisioning.


###DATABASE DESIGN###

catalogs

Field	Type

id	bigint

catalog_name	varchar

catalog_description	text

provider_id	bigint

provider_node_id	bigint

provider_template_id	bigint

catalog_image	varchar

status	varchar

created_by	bigint

created_at	timestamp

updated_at	timestamp

###FIELD DESCRIPTION###

provider_id

Provider tempat Template ditemukan.

Contoh:

Proxmox DC Jakarta

provider_node_id

Node tempat Template ditemukan.

Contoh:

pve01

provider_template_id

Template hasil discovery yang dipublish menjadi Catalog.

Contoh:

ubuntu2204-template

catalog_image

Thumbnail atau gambar Catalog yang ditampilkan pada Catalog Page dan Provision VM.

###RELATIONSHIP###

Provider
│
▼
Provider Node
│
▼
Provider Template
│
▼
Catalog

###PURPOSE###

Catalog menyimpan referensi ke Template hasil discovery.

Catalog tidak menyimpan informasi Template secara langsung.

Informasi Template tetap berasal dari:

provider_templates

melalui Discovery Layer.

###MULTI NODE SUPPORT###

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

ubuntu2204-template

Walaupun nama Template sama, keduanya dianggap resource yang berbeda karena berasal dari Node yang berbeda.

Catalog harus menyimpan:

provider_node_id

agar backend dapat menentukan lokasi Template yang benar saat provisioning.


###CATALOG STATUS###

Possible values:

Active

Inactive

Provider Offline

Template Missing

###ACTIVE###

Catalog dapat digunakan untuk provisioning.

Provider, Node, dan Template masih tersedia.

###INACTIVE###

Catalog dinonaktifkan oleh Administrator.

Catalog tidak ditampilkan pada Provision VM.

###PROVIDER OFFLINE###

Provider dalam status:

Disconnected

Catalog tetap ditampilkan pada Catalog Management namun tidak dapat digunakan untuk provisioning.

###TEMPLATE MISSING###

Template hasil discovery tidak ditemukan pada proses synchronization terbaru.

Catalog tetap disimpan untuk:

* Audit
* History
* Traceability

Namun tidak dapat digunakan untuk provisioning hingga Template ditemukan kembali.

###WHY STATUS EXISTS###

Misalnya:

Provider:

Proxmox DC Jakarta

Status:

Disconnected

Maka seluruh Catalog:

Ubuntu 22.04

Debian 12

Rocky Linux 9

otomatis berubah:

Provider Offline

User tidak dapat melakukan provisioning.

###TEMPLATE MISSING EXAMPLE###

Discovery sebelumnya:

ubuntu2204-template

Discovery terbaru:

Template tidak ditemukan

Maka:

Catalog:

Ubuntu 22.04 LTS

Status:

Template Missing

User tidak dapat melakukan provisioning hingga Template ditemukan kembali pada proses discovery berikutnya.


###TEMPLATE RELATION###

Catalog selalu berasal dari satu Template hasil discovery Provider.

Relationship:

Catalog
│
▼
Provider Template
│
▼
Provider Node
│
▼
Provider

###EXAMPLE###

Catalog:

Ubuntu 22.04 LTS

Provider:

Proxmox DC Jakarta

Node:

pve01

Template:

ubuntu2204-template

###ONE CATALOG ONE TEMPLATE###

Satu Catalog hanya dapat terhubung ke satu Template.

Contoh:

Catalog:

Ubuntu 22.04 LTS

terhubung ke:

provider_template:

ubuntu2204-template

###PROVISIONING RESOLUTION###

Saat provisioning dilakukan, backend melakukan resolve:

Catalog
│
▼
Provider Template
│
▼
Provider Node
│
▼
Provider

untuk menentukan:

* Provider Target
* Node Target
* Template Target

yang akan digunakan pada proses Terraform Deployment.

###DISCOVERY DEPENDENCY###

Jika Provider Template berubah menjadi:

Missing

maka Catalog tetap disimpan namun status berubah menjadi:

Template Missing

hingga Template ditemukan kembali pada proses discovery berikutnya.


###CATALOG IMAGE###

Administrator dapat mengunggah gambar Catalog.

Supported Format:

* PNG
* JPG
* JPEG
* WEBP

Recommended Size:

* 512 x 512 px

Maximum Size:

* 2 MB

Disimpan pada:

storage/app/catalog-images/

Database:

catalogs

Field:

catalog_image

###PURPOSE###

Gambar digunakan untuk:

* Catalog Page
* Provision VM
* Future Dashboard Widget

###DEFAULT IMAGE###

Jika Administrator tidak mengunggah gambar:

Sistem menggunakan:

Default Catalog Image

berdasarkan jenis Operating System.

Contoh:

Ubuntu

Debian

Rocky Linux

Windows Server

Red Hat Enterprise Linux

Oracle Linux

Fedora

OpenSUSE

###IMAGE REPLACEMENT###

Saat Administrator mengganti gambar Catalog:

File lama dapat dihapus secara otomatis oleh sistem.

Hanya satu gambar aktif yang diperbolehkan untuk setiap Catalog.


###CATALOG VISIBILITY###

Hanya Catalog dengan status:

Active

yang ditampilkan pada:

* Catalog Page
* Provision VM

Catalog dengan status:

* Inactive
* Provider Offline
* Template Missing

tidak dapat dipilih oleh User saat provisioning.

Administrator tetap dapat melihat seluruh Catalog melalui:

Catalog Management.



###CREATE CATALOG FLOW###

Admin:

Catalog Management
│
▼

* Create Catalog

###FORM###

Catalog Name

Description

Provider

Node

Source Template

Catalog Image

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

Available Templates

berdasarkan:

provider_id
+
provider_node_id

Contoh:

ubuntu2204-template

debian12-template

rockylinux9-template

Administrator memilih:

Source Template

Contoh:

ubuntu2204-template

Administrator menentukan:

Catalog Name

Ubuntu 22.04 LTS

Administrator mengunggah:

Catalog Image

Administrator menentukan:

Status

Active

Lalu sistem membuat:

Catalog

###RELATIONSHIP CREATED###

Catalog
│
▼
Provider
│
▼
Node
│
▼
Template

###USER EXPERIENCE###

User tidak pernah melihat:

* Provider Template
* Provider Node
* Template Name

User hanya melihat:

Ubuntu 22.04 LTS

beserta:

* Catalog Image
* Description

saat membuka Catalog Page atau Provision VM.

###VALIDATION###

Catalog tidak dapat dibuat jika:

* Provider Offline
* Node Missing
* Template Missing

Hanya resource dengan:

discovered_status = Active

yang dapat dipilih saat pembuatan Catalog.


###DATABASE RELATION###

providers
│
▼
provider_nodes
│
▼
provider_templates
│
▼
catalogs

###RELATIONSHIP DESCRIPTION###

Provider

memiliki banyak:

Provider Nodes

Provider Node

memiliki banyak:

Provider Templates

Provider Template

dapat dipublish menjadi:

Catalog

###EXAMPLE###

Provider:

Proxmox DC Jakarta
│
▼

Node:

pve01
│
▼

Template:

ubuntu2204-template
│
▼

Catalog:

Ubuntu 22.04 LTS

###PURPOSE###

Relationship ini memastikan sistem dapat mengetahui:

* Provider asal Template
* Node asal Template
* Template yang digunakan Catalog

sehingga backend dapat melakukan provisioning dengan target resource yang tepat.

###PROVISIONING RESOLUTION###

Saat user memilih:

Ubuntu 22.04 LTS

Backend melakukan resolve:

Catalog
│
▼
Provider Template
│
▼
Provider Node
│
▼
Provider

untuk menghasilkan konfigurasi Terraform yang sesuai.


###CATALOG PAGE###

Catalog Page membaca data dari:

catalogs

bukan:

provider_templates

###PURPOSE###

Provider Resource tidak boleh terekspos kepada User.

User tidak boleh melihat:

* Provider Name
* Node Name
* Template Name
* Provider Resource ID

User hanya melihat:

* Catalog Image
* Catalog Name
* Catalog Description

###DATA SOURCE###

Catalog Page mengambil data dari:

catalogs

dan tidak pernah melakukan query langsung ke:

provider_templates

provider_nodes

providers

###EXAMPLE###

User melihat:

Ubuntu 22.04 LTS

Description:

Ubuntu Server 22.04 Long Term Support

Image:

Ubuntu Logo

User tidak melihat:

Provider:

Proxmox DC Jakarta

Node:

pve01

Template:

ubuntu2204-template

###VISIBILITY RULE###

Hanya Catalog dengan status:

Active

yang ditampilkan pada:

* Catalog Page
* Provision VM

Catalog dengan status:

* Inactive
* Provider Offline
* Template Missing

tidak ditampilkan kepada User.

###ARCHITECTURAL PRINCIPLE###

Catalog Page merupakan bagian dari:

Service Layer

bukan:

Discovery Layer

Sehingga seluruh informasi yang ditampilkan kepada User berasal dari Catalog yang telah dipublish oleh Administrator.


###CATALOG WIDGETS###

Widgets:

Catalogs

Active

Inactive

Provider Offline

Template Missing

###WIDGET DESCRIPTION###

Catalogs

Total Catalog yang terdaftar.

Active

Catalog yang dapat digunakan untuk provisioning.

Inactive

Catalog yang dinonaktifkan oleh Administrator.

Provider Offline

Catalog yang tidak dapat digunakan karena Provider dalam status:

Disconnected

Template Missing

Catalog yang kehilangan Template hasil discovery.

###DATA SOURCE###

Seluruh data berasal dari:

catalogs

Bukan dari:

provider_templates


###CATALOG TABLE###

Catalog	Image	Provider	Status

###EXAMPLE###

Ubuntu 22.04 LTS

Ubuntu Logo

Proxmox DC Jakarta

Active

Rocky Linux 9

Rocky Logo

Proxmox DC Jakarta

Template Missing

###TABLE BEHAVIOR###

* Resizable Columns
* Search
* Status Filter
* Pagination
* Sortable Columns

###DATA SOURCE###

Data berasal dari:

catalogs

###ACTIONS###

Edit Catalog

Disable Catalog

Delete Catalog

###DELETE RULE###

Catalog tidak dapat dihapus jika:

Masih digunakan oleh:

* VM Request
* Active Deployment

Popup:

Catalog masih digunakan oleh deployment aktif.

Pindahkan atau hapus deployment terkait sebelum menghapus Catalog.



###CATALOG HEALTH CHECK###

Saat Provider Discovery Sync berjalan,

Backend melakukan verifikasi:

* Provider Connected?
* Template Exists?
* Resource Status Active?

###HEALTH CHECK FLOW###

Provider Discovery
│
▼
Sync Resources
│
▼
Validate Catalog Dependency
│
├── Provider Status
├── Template Status
└── Discovery Status
│
▼
Update Catalog Status

###PROVIDER OFFLINE###

Jika:

Provider Status

=

Disconnected

Maka seluruh Catalog yang berasal dari Provider tersebut berubah menjadi:

Provider Offline

###TEMPLATE MISSING###

Jika:

Provider Template

tidak ditemukan pada proses discovery terbaru

atau

provider_template.discovered_status

=

Missing

Maka Catalog berubah menjadi:

Template Missing

###ACTIVE###

Catalog berubah menjadi:

Active

jika:

* Provider Status = Connected
* Template Status = Active
* Catalog Status = Active secara administratif

###EXAMPLE###

Provider:

Proxmox DC Jakarta

Status:

Disconnected

Catalog:

Ubuntu 22.04 LTS

Debian 12

Rocky Linux 9

Status berubah menjadi:

Provider Offline

###TEMPLATE EXAMPLE###

Discovery sebelumnya:

ubuntu2204-template

Discovery terbaru:

Template tidak ditemukan

Maka:

Catalog

Ubuntu 22.04 LTS

Status:

Template Missing

###AUTOMATIC RECOVERY###

Jika Provider kembali Connected

atau

Template ditemukan kembali pada proses discovery berikutnya

maka status Catalog otomatis dipulihkan menjadi:

Active

tanpa memerlukan tindakan Administrator.

###PURPOSE###

Catalog Health Check memastikan hanya Catalog yang valid dan dapat digunakan yang ditampilkan pada:

* Catalog Page
* Provision VM

sehingga User tidak dapat memilih Catalog yang tidak dapat diprovisioning.


###PROVISION INTEGRATION###

Saat User membuka:

Catalog Page

yang ditampilkan:

* Ubuntu 22.04 LTS
* Debian 12
* Rocky Linux 9

User tidak melihat:

* Provider
* Node
* Template

Saat User memilih:

Provision VM

Backend menerima:

catalog_id

###PROVISION RESOLUTION###

Backend melakukan resolve:

Catalog
│
▼
Provider Template
│
▼
Provider Node
│
▼
Provider

berdasarkan relasi:

catalogs

provider_templates

provider_nodes

providers

###RESOLUTION RESULT###

Backend memperoleh:

Provider

Node

Template

yang akan digunakan untuk proses provisioning.

Contoh:

Catalog:

Ubuntu 22.04 LTS

Resolve menjadi:

Provider:

Proxmox DC Jakarta

Node:

pve01

Template:

ubuntu2204-template

###PROVISIONING FLOW###

Catalog Selected
│
▼
Catalog Resolution
│
▼
Provider
│
▼
Node
│
▼
Template
│
▼
Terraform Deployment

###USER ABSTRACTION###

User hanya memilih:

Catalog

sedangkan detail infrastruktur:

* Provider
* Node
* Template

ditentukan oleh Backend berdasarkan konfigurasi Catalog yang telah dipublish Administrator.

###VALIDATION###

Sebelum provisioning dijalankan, Backend wajib memverifikasi:

* Catalog Status = Active
* Provider Status = Connected
* Template Status = Active

Jika salah satu validasi gagal:

Provisioning ditolak dan User menerima pesan error yang sesuai.


###FUTURE MULTI PROVIDER SUPPORT###

Catalog tidak bergantung pada jenis Provider tertentu.

Catalog selalu menjadi:

Service Offering Layer

di atas Discovery Layer.

###EXAMPLE###

Catalog:

Ubuntu 22.04 LTS

Provider:

Proxmox DC Jakarta

Template:

ubuntu2204-template

---

Catalog:

Ubuntu 22.04 OpenStack

Provider:

OpenStack LAB

Template:

ubuntu2204-image

###PROVISIONING BEHAVIOR###

Provisioning tidak bergantung pada jenis Provider.

Provisioning selalu menggunakan:

catalog_id

sebagai entry point.

Backend melakukan resolve:

Catalog
│
▼
Provider Template
│
▼
Provider Node
│
▼
Provider

untuk menentukan resource yang digunakan saat deployment.

###PROVIDER ABSTRACTION###

User tidak mengetahui apakah Catalog berasal dari:

* Proxmox
* OpenStack
* OLVM
* VMware
* Nutanix

User hanya melihat:

* Catalog Name
* Catalog Description
* Catalog Image

###ARCHITECTURAL BENEFIT###

Penambahan Provider baru tidak memerlukan perubahan pada:

* Catalog Management
* Environment Management
* Tier Management
* Provisioning
* Approval
* Inventory

karena seluruh proses selalu dimulai dari:

catalog_id

yang kemudian di-resolve melalui Discovery Layer.

###ARCHITECTURAL PRINCIPLE###

Discovery Layer

Provider
│
▼
Node
│
▼
Template

Service Layer

Catalog
│
▼
Provision VM

Catalog menjadi kontrak stabil antara Infrastructure Layer dan Application Layer.


###ARCHITECTURAL PRINCIPLE###

Catalog adalah:

Published Service

bukan:

Provider Resource

###LAYER SEPARATION###

Discovery Layer

Provider
│
▼
Provider Node
│
▼
Provider Template

Service Layer

Catalog Management
│
▼
Published Catalog

Consumption Layer

User
│
▼
Provision VM

###ABSTRACTION PRINCIPLE###

Catalog menyembunyikan detail infrastruktur dari User.

User tidak melihat:

* Provider
* Node
* Template
* Provider Resource ID

User hanya melihat:

* Catalog Name
* Catalog Description
* Catalog Image

###PUBLISHING PRINCIPLE###

Catalog tidak membuat resource baru.

Catalog hanya melakukan publish terhadap:

Provider Template

yang telah ditemukan oleh Discovery Engine.

###OWNERSHIP PRINCIPLE###

Provider tetap menjadi pemilik:

* Nodes
* Templates

Catalog menjadi pemilik:

* Catalog Name
* Catalog Description
* Catalog Image
* Visibility Status

###ARCHITECTURAL BENEFIT###

Dengan pemisahan layer ini:

* Infrastruktur dapat berubah tanpa mempengaruhi User Experience
* Provider dapat diganti tanpa mengubah Catalog yang telah dipublish
* Multi Provider dapat didukung tanpa mengubah Application Layer
* Discovery Layer dan Service Layer dapat berkembang secara independen


###UI CONSISTENCY REQUIREMENT###

Mengikuti pola User Management dan Provider Management:

Statistics Widget

Search

Filter

Resizable Columns

Scrollable Tables

Pagination

Create/Edit Modal

Delete Confirmation Modal

Unsaved Changes Modal

Image Upload Preview

Status Badge

###TABLE REQUIREMENT###

Table harus:

* Full Width Layout
* Tidak memiliki empty space kiri dan kanan
* Mengikuti lebar container seperti User Management
* Mengikuti tinggi data secara dinamis
* Mendukung horizontal scrolling jika diperlukan
* Mendukung column resize

###MODAL REQUIREMENT###

Create Catalog

Edit Catalog

menggunakan pola modal yang sama dengan:

* Provider Management
* User Management

###IMAGE PREVIEW REQUIREMENT###

Saat Administrator mengunggah:

Catalog Image

Sistem menampilkan preview gambar sebelum data disimpan.

Supported Format:

* PNG
* JPG
* JPEG
* WEBP

###STATUS BADGE###

Status ditampilkan menggunakan badge:

Active

Inactive

Provider Offline

Template Missing

dengan style yang konsisten dengan seluruh halaman Settings.


###FUTURE MODULE DEPENDENCIES###

Catalog akan menjadi parent dependency untuk:

Provision VM
Inventory
Approval Request
Terraform Deployment

Karena semua provisioning harus dimulai dari:

Catalog

bukan dari template mentah provider.

###FUTURE MODULE DEPENDENCIES###

Catalog akan digunakan oleh:

* Provision VM
* Inventory
* Approval Request
* Terraform Deployment

###PROVISIONING DEPENDENCY###

Catalog menyediakan:

* Operating System Template
* Catalog Information
* Catalog Image
* Service Description

yang digunakan saat proses provisioning.

###PROVISION VM INTEGRATION###

Provisioning menggunakan:

Environment
│
▼
Provider
│
▼
Node
│
▼
Catalog
Network
Datastore
Tier

Catalog menjadi sumber informasi Operating System yang akan digunakan untuk deployment.

###INVENTORY INTEGRATION###

Inventory menyimpan:

catalog_id

agar sistem dapat mengetahui Catalog yang digunakan saat VM dibuat.

Contoh:

VM:

web-dev-01

Catalog:

Ubuntu 22.04 LTS

###APPROVAL INTEGRATION###

Approval Request menampilkan:

* Catalog Name
* Catalog Image
* Catalog Description

sebagai bagian dari informasi deployment yang diajukan.

###TERRAFORM DEPLOYMENT INTEGRATION###

Saat request disetujui,

Backend melakukan resolve:

catalog_id
│
▼
provider_template_id
│
▼
provider_node_id
│
▼
provider_id

untuk menghasilkan konfigurasi Terraform yang sesuai.

###ARCHITECTURAL PRINCIPLE###

Catalog merupakan:

Service Definition Layer

bukan:

Infrastructure Resource Layer

Karena itu seluruh modul menggunakan:

catalog_id

untuk merepresentasikan Operating System yang dipilih User,

bukan menggunakan:

provider_template_id

secara langsung.
