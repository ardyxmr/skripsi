ARCHITECTURE-V2

MODULE 05 – ENVIRONMENT MANAGEMENT ARCHITECTURE

PURPOSE

Environment Management berfungsi sebagai Policy Layer yang mengatur aturan Provisioning berdasarkan jenis Environment.

Environment bukan hanya label.

Environment menentukan aturan yang digunakan selama proses:

Provisioning

Approval

Expiry Management

Lifecycle Management

Contoh:

Development

Allowed Provider:

* Proxmox LAB
* Proxmox DC1

Expiry:

30 Days

Approval:

Required

Allowed Tier:

* Bronze
* Silver

Allowed Network:

* Development Network

Allowed Storage:

* Standard Storage

###DESIGN PRINCIPLE###

Environment adalah:

Provisioning Policy

bukan:

DEV

STAGING

PRODUCTION

semata.

Environment menentukan:

* Expiry Policy
* Approval Policy
* Allowed Providers
* Allowed Tiers
* Allowed Networks
* Allowed Datastores

###ENVIRONMENT POLICY EXAMPLES###

Development

Allowed Provider:

* Proxmox LAB
* Proxmox DC1

Expiry:

30 Days

Approval:

Required

Allowed Tier:

* Bronze
* Silver

Allowed Network:

* Development Network

Allowed Storage:

* Standard Storage

Production

Allowed Provider:

* Proxmox DC1

Expiry:

Lifetime

Approval:

Required

Allowed Tier:

* Gold

Allowed Network:

* Production Network

Allowed Storage:

* Production Storage

###ARCHITECTURAL PRINCIPLE###

Environment menjadi sumber kebijakan utama untuk proses:

Provisioning

Approval

Expiry

Lifecycle

Resource Filtering

Modul lain tidak menyimpan aturan Environment.

Seluruh kebijakan Environment berasal dari:

Environment Management.



###ARCHITECTURE POSITION###

Environment
│
▼
Provider
│
▼
Catalog

Network

Datastore

Tier
│
▼
Provision Request
│
▼
Approval
│
▼
Terraform

###HIGH LEVEL FLOW###

Admin
│
▼
Create Environment
│
▼
Configure Policies
│
├── Allowed Providers
├── Allowed Tiers
├── Allowed Networks
├── Allowed Datastores
├── Expiry Policy
└── Approval Policy
│
▼
Environment Database
│
▼
Provision VM
│
▼
Environment Policy Validation
│
▼
Provider Filtering
│
▼
Resource Filtering
│
▼
Provision Request Creation

###DATABASE DESIGN###

environments

Field	Type

id	bigint

environment_name	varchar

description	text

expiry_type	varchar

expiry_value	integer

approval_required	boolean

status	varchar

display_order	integer

created_by	bigint

created_at	timestamp

updated_at	timestamp

###FIELD DESCRIPTION###

environment_name

Nama Environment.

Contoh:

Development

Staging

Production

description

Deskripsi tujuan penggunaan Environment.

expiry_type

Possible values:

days

hours

minutes

lifetime

expiry_value

Nilai Expiry berdasarkan:

expiry_type

Contoh:

expiry_type = days

expiry_value = 30

approval_required

Menentukan apakah Provision Request wajib melalui:

Approval Workflow

status

Possible values:

Active

Inactive

display_order

Digunakan untuk menentukan urutan tampilan Environment pada:

Provision VM

dan

Settings Page

created_by

User yang membuat Environment.

###ARCHITECTURAL PRINCIPLE###

Environment menyimpan:

Policy Configuration

bukan:

Provision Request

atau

Inventory Data

Environment hanya menentukan aturan yang digunakan saat:

Provisioning

Approval

Lifecycle Management

Environment tidak menyimpan data VM yang menggunakan Environment tersebut.



###EXPIRY TYPES###

Possible values:

days

hours

minutes

lifetime

###EXPIRY EXAMPLES###

Development

expiry_type:

days

expiry_value:

30

Staging

expiry_type:

days

expiry_value:

60

Production

expiry_type:

lifetime

expiry_value:

null

###STATUS###

Possible values:

Active

Inactive

###ACTIVE###

Environment dapat digunakan untuk:

Provisioning

Environment ditampilkan pada:

Provision VM

dan

Settings Page

###INACTIVE###

Environment tidak dapat digunakan untuk:

Provisioning baru

Environment tidak ditampilkan pada:

Provision VM

VM yang sudah ada dan menggunakan Environment tersebut tetap berjalan normal.

###ENVIRONMENT POLICY TABLES###

Environment menjadi pusat Policy Configuration dan Resource Filtering.

environment_provider_rules

environment_id

provider_id

environment_tier_rules

environment_id

tier_id

environment_network_rules

environment_id

network_id

environment_datastore_rules

environment_id

datastore_id

###PROVIDER POLICY###

Environment menentukan Provider mana yang dapat digunakan untuk Provisioning.

###POLICY EXAMPLES###

Development

Allowed Providers:

* Proxmox LAB
* Proxmox DC1

Production

Allowed Providers:

* Proxmox DC1

###POLICY BEHAVIOR###

Environment dapat memiliki lebih dari satu Provider.

Saat User memilih:

Development

Provider Dropdown hanya menampilkan:

* Proxmox LAB
* Proxmox DC1

Saat User memilih:

Production

Provider Dropdown hanya menampilkan:

* Proxmox DC1

Provider lain tidak ditampilkan dan tidak dapat digunakan untuk Provisioning.

###PROVISIONING FLOW###

User
│
▼
Select Environment
│
▼
Load Allowed Providers
│
▼
Select Provider
│
▼
Load Available Resources

###ARCHITECTURAL PRINCIPLE###

Environment tidak menyimpan:

Provider

Tier

Network

Datastore

secara langsung.

Environment menggunakan:

Policy Rules

untuk menentukan Resource mana yang boleh digunakan saat Provisioning.


###DEFAULT ENVIRONMENTS###

Saat instalasi awal sistem, Environment berikut otomatis dibuat:

* Development
* Staging
* Production

Environment bawaan sistem dapat:

* Edit
* Disable

Namun tidak dapat:

* Delete

###SYSTEM ENVIRONMENT RULE###

Environment bawaan sistem dianggap sebagai:

System Environment

System Environment selalu tersedia untuk digunakan oleh sistem.

Administrator dapat mengubah:

Description

Expiry Policy

Approval Policy

Allowed Providers

Status

Namun tidak dapat menghapus:

Development

Staging

Production

###CUSTOM ENVIRONMENTS###

Administrator dapat membuat Environment tambahan sesuai kebutuhan.

Contoh:

* Testing
* Sandbox
* Lab
* QA
* UAT

Environment tambahan dianggap sebagai:

Custom Environment

Custom Environment dapat:

* Create
* Edit
* Disable
* Delete

###DELETE RULE###

Custom Environment hanya dapat dihapus jika tidak digunakan oleh:

Catalog

Provision Request

Inventory

Jika masih terdapat referensi aktif,

maka proses Delete harus ditolak.

###CREATE ENVIRONMENT FLOW###

Admin
│
▼
Settings
│
▼
Environment Management
│
▼
Create Environment

###FORM FIELDS###

Environment Name

Description

Expiry Type

Expiry Value

Approval Required

Status

Allowed Providers

(Multi Select)

###EXAMPLES###

Development

Environment Name:

Development

Description:

Development Environment

Expiry Type:

Days

Expiry Value:

30

Approval Required:

Yes

Allowed Providers:

* Proxmox LAB
* Proxmox DC1

Status:

Active

Production

Environment Name:

Production

Description:

Production Environment

Expiry Type:

Lifetime

Expiry Value:

null

Approval Required:

Yes

Allowed Providers:

* Proxmox DC1

Status:

Active

###ARCHITECTURAL PRINCIPLE###

Environment menjadi:

Policy Configuration

yang digunakan oleh:

Provisioning Engine

Approval Engine

Lifecycle Engine

Environment tidak menyimpan:

VM

Provision Request

Approval Request

Inventory Record

Environment hanya menyimpan:

Provisioning Policy.


###POST-CREATION CONFIGURATION###

Setelah Environment dibuat, Administrator dapat melakukan assignment tambahan untuk:

* Allowed Tiers
* Allowed Networks
* Allowed Datastores

Konfigurasi dapat dilakukan melalui:

Edit Environment

atau

Policy Assignment

Perubahan Policy akan digunakan pada Provision Request berikutnya.

Perubahan Policy tidak mengubah VM yang sudah ada pada Inventory.

###PROVIDER POLICY###

Environment dapat membatasi Provider yang dapat digunakan untuk Provisioning.

###POLICY EXAMPLES###

Development

Allowed Providers:

* Proxmox LAB
* Proxmox DC1

Production

Allowed Providers:

* Proxmox DC1

###PROVISIONING BEHAVIOR###

Saat User memilih:

Environment = Production

Provider Dropdown hanya menampilkan:

* Proxmox DC1

User tidak dapat memilih Provider lain.

Saat User memilih:

Environment = Development

Provider Dropdown hanya menampilkan:

* Proxmox LAB
* Proxmox DC1

###POLICY ENFORCEMENT###

Provider Filtering dilakukan berdasarkan:

environment_provider_rules

Hanya Provider dengan Status:

Active

yang ditampilkan pada:

Provision VM

Provider dengan Status:

Inactive

atau

Disconnected

tidak dapat digunakan untuk Provisioning.

Jika seluruh Provider yang diizinkan berstatus:

Inactive

atau

Disconnected

maka:

Provision Request

tidak dapat dibuat.

User harus memilih Environment lain

atau

menunggu Provider tersedia kembali.

###ARCHITECTURAL PRINCIPLE###

Environment tidak melakukan Provisioning secara langsung.

Environment hanya menentukan:

Provider mana yang boleh digunakan.

Provisioning Engine bertugas melakukan:

Provider Resolution

dan

Resource Resolution

berdasarkan Policy yang ditentukan oleh Environment.




###POLICY ENGINE###

Saat User memilih:

Environment

Backend memfilter:

Available Providers

berdasarkan:

environment_provider_rules

dan

Provider Status

###RESOURCE RESOLUTION FLOW###

Setelah User memilih:

Provider

Backend melakukan Resource Filtering untuk:

Available Catalogs

Available Networks

Available Datastores

Available Tiers

Filtering dilakukan berdasarkan:

* Provider Assignment
* Environment Policy
* Resource Status

Hanya Resource yang memenuhi seluruh Policy yang ditampilkan kepada User.

###EXAMPLE###

Environment:

Development

Allowed Providers:

* Proxmox LAB
* Proxmox DC1

Allowed Tiers:

* Bronze
* Silver

Environment:

Production

Allowed Providers:

* Proxmox DC1

Allowed Tiers:

* Gold

###PROVISIONING BEHAVIOR###

Saat User memilih:

Environment = Production

Provider = Proxmox DC1

Backend hanya menampilkan:

Catalogs:

* Status = Active
* Diizinkan untuk Production
* Tersedia pada Proxmox DC1

Networks:

* Status = Active
* Diizinkan untuk Production
* Tersedia pada Proxmox DC1

Datastores:

* Status = Active
* Diizinkan untuk Production
* Tersedia pada Proxmox DC1

Tiers:

* Gold

User tidak dapat memilih Resource di luar Policy yang telah ditentukan.

###FILTERING ORDER###

Environment
│
▼
Provider Filtering
│
▼
Provider Selection
│
▼
Resource Filtering
│
├── Catalogs
├── Networks
├── Datastores
└── Tiers
│
▼
Provision Request

###ARCHITECTURAL PRINCIPLE###

Environment bertindak sebagai:

Policy Engine

Provider bertindak sebagai:

Infrastructure Source

Provisioning Engine hanya dapat menggunakan Resource yang lolos dari:

Environment Policy

dan

Provider Availability.

Resource yang tidak memenuhi Policy tidak boleh ditampilkan dan tidak boleh digunakan untuk Provisioning.



###EXPIRY MANAGEMENT###

Saat Provision Request disetujui

dan

Provisioning berhasil dilakukan,

Backend menghitung:

Current Date

*

Expiry Policy

###EXAMPLE###

Request Date:

20 May 2026

Environment:

Development

Expiry Policy:

30 Days

Maka:

Expiry Date:

19 June 2026

Nilai hasil perhitungan disimpan pada:

Inventory

sebagai:

expiry_date

###EXPIRY SOURCE OF TRUTH###

Expiry selalu mengikuti Policy yang berlaku saat:

Provision Request

disetujui.

Jika Administrator mengubah Policy Environment di kemudian hari:

Development

30 Days

menjadi:

Development

60 Days

maka VM yang sudah dibuat sebelumnya tidak ikut berubah.

Perubahan Policy hanya berlaku untuk:

Provision Request baru

yang dibuat setelah perubahan dilakukan.

###INVENTORY INTEGRATION###

Inventory menampilkan:

Environment

Expiry

Remaining Days

###EXAMPLES###

Development

29 Days Remaining

Staging

58 Days Remaining

Production

Lifetime

###DISPLAY RULES###

Remaining Days dihitung secara realtime berdasarkan:

Expiry Date

*

Current Date

###EXAMPLES###

29 Days Remaining

14 Days Remaining

7 Days Remaining

1 Day Remaining

Expired

Untuk Environment dengan Policy:

Lifetime

Inventory menampilkan:

Lifetime

dan tidak menghitung:

Remaining Days

###STATUS INTEGRATION###

Expiry Information digunakan untuk:

Lifecycle Monitoring

Renewal Management

Expiry Warning

Auto Destroy

Expiry Information tidak mengubah:

Approval Status

###ARCHITECTURAL PRINCIPLE###

Environment menentukan:

Expiry Policy

Inventory menyimpan:

Expiry Date

Remaining Days dihitung secara realtime dan tidak disimpan pada Database.



###EXPIRY NOTIFICATION POLICY###

Environment menentukan:

Expiry Policy

yang digunakan untuk menghitung:

Expiry Date

Default Expiry Warning:

7 Days Remaining

3 Days Remaining

1 Day Remaining

Notification dapat ditampilkan pada:

Inventory

Dashboard Widget

VM Detail Page

Future:

Email Notification

Microsoft Teams Notification

Slack Notification

###NOTIFICATION SOURCE###

Expiry Notification dihitung berdasarkan:

Current Date

dan

Expiry Date

yang tersimpan pada:

Inventory

Notification tidak menggunakan:

Environment Policy

secara realtime.

Notification menggunakan:

Expiry Date

yang telah dihitung dan disimpan saat:

Provisioning

atau

Renewal

###EXPIRY WARNING BEHAVIOR###

Jika Remaining Days mencapai:

7 Days

3 Days

1 Day

maka sistem membuat:

Expiry Warning Notification

untuk User yang memiliki VM tersebut.

###EXTEND VM POLICY###

Environment menentukan batas Extension yang diperbolehkan.

Contoh:

Development

Maximum Extension:

30 Days

Staging

Maximum Extension:

60 Days

Production

Maximum Extension:

Not Applicable

atau

Unlimited

sesuai kebijakan organisasi.

###EXTENSION VALIDATION###

Saat User melakukan:

Extend VM

Backend memvalidasi:

Environment Policy

###EXAMPLE###

Current Expiry:

30 Days

Requested Extension:

60 Days

Environment Policy:

Maximum Extension = 30 Days

Result:

Rejected

karena melebihi batas Extension yang diizinkan.

###ARCHITECTURAL PRINCIPLE###

Environment menentukan:

Expiry Policy

Extension Policy

Inventory menyimpan:

Expiry Date

Notification menggunakan:

Expiry Date

sebagai Source of Truth.

Perubahan Environment Policy tidak mengubah:

Expiry Date

yang sudah tersimpan pada VM yang telah dibuat sebelumnya.



###APPROVAL POLICY###

Environment menentukan apakah:

Provision Request

memerlukan Approval sebelum dieksekusi.

###POLICY EXAMPLES###

Development

Approval Required

Lab

Approval Not Required

Production

Approval Required

###POLICY EVALUATION###

Saat User melakukan:

Provision VM

Backend membaca:

environment.approval_required

###APPROVAL REQUIRED###

Jika:

approval_required = true

maka:

Provision Request

dibuat dengan Status:

Pending

dan masuk ke:

Approval Queue

###APPROVAL NOT REQUIRED###

Jika:

approval_required = false

maka:

Provision Request

dibuat dengan Status:

Approved

dan langsung diteruskan ke:

Terraform Queue

###APPROVAL FLOW###

Approval Required

User
│
▼
Submit Request
│
▼
Approval Queue
│
▼
Manager / Approver
│
▼
Approved
│
▼
Terraform Queue

Approval Not Required

User
│
▼
Submit Request
│
▼
Terraform Queue

###APPROVAL OWNERSHIP###

Environment hanya menentukan:

Apakah Approval diperlukan.

Environment tidak menentukan:

Approver

Approval Level

Approval Workflow

Konfigurasi tersebut berasal dari:

Approval Engine

dan

Group Ownership

###AUDIT LOG INTEGRATION###

Setiap Action dicatat pada:

Audit Log

###EXAMPLES###

Provision Request Submitted

Provision Request Approved

Provision Request Rejected

Terraform Queue Created

###ARCHITECTURAL PRINCIPLE###

Environment menentukan:

Approval Policy

Approval Engine menentukan:

Workflow

Approver

Decision

Environment tidak melakukan:

Approval Processing

Environment hanya menentukan apakah suatu Request harus masuk ke:

Approval Queue

atau langsung diteruskan ke:

Terraform Queue.



###ENVIRONMENT MANAGEMENT WIDGETS###

Widgets:

Total Environments

Active

Inactive

Approval Required

Provider Assignments

###WIDGET DATA SOURCE###

Data berasal dari:

environments

dan

environment_provider_rules

###WIDGET DESCRIPTION###

###TOTAL ENVIRONMENTS###

Menampilkan jumlah seluruh Environment yang terdaftar pada sistem.

Data Source:

environments

###ACTIVE###

Menampilkan jumlah Environment dengan:

status = Active

Data Source:

environments

###INACTIVE###

Menampilkan jumlah Environment dengan:

status = Inactive

Data Source:

environments

###APPROVAL REQUIRED###

Menampilkan jumlah Environment dengan:

approval_required = true

Data Source:

environments

###PROVIDER ASSIGNMENTS###

Menampilkan total relasi Provider yang terhubung ke seluruh Environment.

Contoh:

Development
├── Proxmox LAB
└── Proxmox DC1

Production
└── Proxmox DC1

Total:

3 Provider Assignments

Data Source:

environment_provider_rules

###WIDGET BEHAVIOR###

Seluruh Widget dapat diklik.

Klik Widget akan otomatis melakukan filter pada:

Environment Table

Contoh:

Klik:

Active

maka hanya menampilkan:

Environment dengan status Active.

Klik:

Approval Required

maka hanya menampilkan:

Environment dengan approval_required = true.

###ARCHITECTURAL PRINCIPLE###

Widget digunakan untuk:

Monitoring

dan

Quick Filtering

Widget tidak menjadi:

Source of Truth

Data utama tetap berasal dari:

environments

dan

environment_provider_rules.



###ENVIRONMENT TABLE CONTENT###

Columns:

Environment

Allowed Providers

Expiry

Approval

Status

Last Updated

Actions

###EXAMPLES###

Environment:

Development

Allowed Providers:

Proxmox LAB

Proxmox DC1

Expiry:

30 Days

Approval:

Required

Status:

Active

Environment:

Production

Allowed Providers:

Proxmox DC1

Expiry:

Lifetime

Approval:

Required

Status:

Active

###TABLE BEHAVIOR###

All Columns must support:

* Column Resize
* Search
* Pagination

Sortable Columns:

* Environment
* Expiry
* Status
* Last Updated

###ACTIONS###

Edit Environment

Disable Environment

Delete Environment

###DISABLE RULE###

Saat Environment diubah menjadi:

Inactive

maka:

Environment tidak lagi ditampilkan pada:

Provision VM

User tidak dapat membuat:

Provision Request

baru menggunakan Environment tersebut.

VM yang sudah ada tetap berjalan normal.

Provision Request yang sudah disetujui tidak terpengaruh.

Inventory tetap menampilkan VM yang menggunakan Environment tersebut.

###DELETE RULE###

Environment tidak dapat dihapus jika masih digunakan oleh:

* Provision Request
* Inventory

atau masih memiliki relasi aktif pada:

* Provider Assignment
* Tier Assignment
* Network Assignment
* Datastore Assignment

###DELETE VALIDATION###

Sistem wajib melakukan validasi sebelum menghapus Environment.

Jika masih terdapat penggunaan aktif,

maka proses Delete harus ditolak.

###DELETE ERROR MESSAGE###

Popup:

Environment masih digunakan oleh deployment aktif atau policy assignment.

Pindahkan atau hapus relasi terlebih dahulu sebelum menghapus Environment.

###ARCHITECTURAL PRINCIPLE###

Disable digunakan untuk:

Menghentikan penggunaan Environment pada Provisioning baru.

Delete digunakan untuk:

Menghapus Environment dari sistem secara permanen.

Environment yang masih digunakan oleh:

Provision Request

atau

Inventory

tidak boleh dihapus.




###RESOURCE FILTERING MATRIX###

Provisioning menggunakan Filtering bertingkat.

###STEP 1###

User memilih:

Environment

Backend memfilter:

Available Providers

berdasarkan:

environment_provider_rules

dan

Provider Status

###STEP 2###

User memilih:

Provider

Backend memfilter:

Available Catalogs

Available Networks

Available Datastores

Available Tiers

berdasarkan:

Provider Assignment

*

Environment Policy

*

Resource Status

###STEP 3###

User memilih:

Catalog

Tier

Network

Datastore

###STEP 4###

Backend melakukan Validation:

Environment Policy

Provider Policy

Resource Availability

sebelum:

Provision Request

dibuat.

###FILTERING RESULT###

Contoh:

Environment:

Production

Provider:

Proxmox DC1

Backend hanya menampilkan:

Catalogs:

* Status = Active
* Tersedia pada Proxmox DC1
* Diizinkan untuk Production

Networks:

* Status = Active
* Tersedia pada Proxmox DC1
* Diizinkan untuk Production

Datastores:

* Status = Active
* Tersedia pada Proxmox DC1
* Diizinkan untuk Production

Tiers:

* Diizinkan untuk Production

User tidak dapat memilih Resource di luar Policy yang telah ditentukan.

###PROVISION VM INTEGRATION###

Saat User membuka:

Provision VM

Langkah pertama:

Step 1

Deployment Context

###FIELDS###

Environment

Provider

###UI BEHAVIOR###

Provider Dropdown hanya menampilkan:

Provider yang diizinkan oleh Environment.

Provider wajib dipilih sebelum:

Catalog

Network

Datastore

Tier

dapat ditampilkan.

###DATA SOURCE###

Environment berasal dari:

environments

dengan Status:

Active

Provider berasal dari:

environment_provider_rules

dan

providers

dengan Status:

Active

###RESOURCE LOADING###

Setelah User memilih:

Environment

Backend memuat:

Available Providers

Setelah User memilih:

Provider

Backend memuat:

Available Catalogs

Available Networks

Available Datastores

Available Tiers

Resource yang ditampilkan harus memenuhi:

* Status = Active
* Sesuai Environment Policy
* Sesuai Provider Assignment

###EMPTY STATE###

Jika tidak ada Provider yang memenuhi Policy:

Provider Dropdown menampilkan:

No Available Provider

dan User tidak dapat melanjutkan Provisioning.

Jika Provider dipilih namun tidak memiliki:

* Catalog
* Network
* Datastore
* Tier

yang memenuhi Policy,

maka sistem menampilkan:

No resources available for the selected Environment and Provider.

###ARCHITECTURAL PRINCIPLE###

Environment melakukan:

Policy Filtering

Provider melakukan:

Resource Discovery

Provisioning Engine hanya dapat menggunakan Resource yang telah lolos dari:

Environment Policy

dan

Provider Availability.



###FUTURE MULTI PROVIDER SUPPORT###

Environment tidak bergantung pada implementasi Provider tertentu.

Environment hanya menentukan:

Provider mana yang diperbolehkan digunakan

berdasarkan:

Policy

yang telah dikonfigurasi.

Provider dapat berupa:

* Proxmox
* OpenStack
* OLVM

atau Provider lain yang ditambahkan di masa depan.

Penambahan Provider baru tidak mengubah konsep:

* Development
* Staging
* Production

karena Environment tetap berfungsi sebagai:

Business Policy Layer

###ENVIRONMENT RESPONSIBILITY###

Environment menentukan:

* Approval Policy
* Expiry Policy
* Allowed Providers
* Allowed Tiers
* Allowed Networks
* Allowed Datastores

###PROVIDER RESPONSIBILITY###

Provider bertanggung jawab untuk:

* Resource Discovery
* Resource Availability
* Resource Synchronization

Provider tidak menentukan:

* Approval Policy
* Expiry Policy
* Business Rules

###ARCHITECTURAL SEPARATION###

Business Layer

Environment

│

▼

Infrastructure Layer

Provider

│

▼

Discovered Resources

Catalog

Network

Datastore

Node

│

▼

Provisioning

###MULTI PROVIDER PRINCIPLE###

Environment dapat menggunakan satu atau lebih Provider.

Contoh:

Development

Allowed Providers:

* Proxmox LAB
* Proxmox DC1

Production

Allowed Providers:

* Proxmox DC1

Jika di masa depan ditambahkan:

OpenStack

atau

OLVM

maka Environment Policy tetap dapat digunakan tanpa perubahan struktur.

###ARCHITECTURAL PRINCIPLE###

Environment menjadi:

Business Policy Layer

Provider menjadi:

Infrastructure Resource Layer

Kedua modul memiliki tanggung jawab yang berbeda dan tidak saling bergantung secara langsung.

Dengan pendekatan ini, penambahan Provider baru tidak memerlukan perubahan pada:

Environment Policy

yang sudah ada.



###UI CONSISTENCY REQUIREMENT###

Mengikuti standar seluruh halaman Settings:

* Statistics Widget
* Search
* Status Filter
* Refresh Button
* Resizable Columns
* Scrollable Table
* Pagination
* Create / Edit Modal
* Delete Confirmation Modal
* Unsaved Changes Modal
* Success Toast Notification
* Error Toast Notification

###ARCHITECTURAL PRINCIPLE###

Environment merupakan:

Policy Layer

yang mengontrol:

* Expiry Policy
* Approval Policy
* Allowed Providers
* Allowed Tiers
* Allowed Networks
* Allowed Datastores

###LAYER SEPARATION###

Provider Resources
│
▼
Published Resources
│
▼
Environment Policy
│
▼
Provision Request

Environment tidak melakukan:

Resource Discovery

Provisioning

Approval Processing

Environment hanya menentukan:

Policy

yang digunakan oleh modul lain.

###DEPENDENCIES###

Environment Management digunakan oleh:

* Tier Management
* Provider Management
* Catalog Management
* Network Management
* Datastore Management
* Provision VM
* Approval Request
* Inventory
* Renew VM
* Expiry Notification
* Terraform Deployment

karena seluruh Lifecycle VM bergantung pada Policy yang didefinisikan oleh:

Environment

###FINAL ARCHITECTURAL PRINCIPLE###

Environment menjadi:

Business Policy Layer

yang menentukan bagaimana Resource dapat digunakan.

Provider menjadi:

Infrastructure Resource Layer

yang menyediakan Resource untuk digunakan.

Provisioning Engine hanya dapat menggunakan Resource yang memenuhi:

Environment Policy

dan

Provider Availability.
