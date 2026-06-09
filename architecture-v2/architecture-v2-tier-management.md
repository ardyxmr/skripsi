ARCHITECTURE-V2

MODULE 06 – TIER MANAGEMENT ARCHITECTURE

PURPOSE

Tier Management berfungsi sebagai lapisan standar Resource yang digunakan saat Provisioning Virtual Machine.

Tujuan utama:

User tidak dapat memilih CPU, RAM, dan Disk secara bebas.

Administrator menentukan standar spesifikasi VM melalui:

Tier

Contoh:

User tidak memilih:

CPU = 7

RAM = 13 GB

Disk = 47 GB

User hanya memilih:

Bronze

Silver

Gold

Platinum

Karena tujuan aplikasi adalah:

* Governance
* Standardization
* Capacity Control
* Cost Control

###ARCHITECTURE POSITION###

Provider
│
▼
Catalog
│
▼
Environment
│
▼
Tier
│
▼
Provision Request
│
▼
Terraform Deployment

###DESIGN PRINCIPLE###

Tier adalah:

Resource Blueprint

bukan:

CPU

RAM

Disk

yang dipilih manual oleh User.

Tier mendefinisikan standar Resource yang dapat digunakan saat Provisioning.

###TIER EXAMPLES###

Bronze

CPU  : 2

RAM  : 4 GB

Disk : 40 GB

Silver

CPU  : 4

RAM  : 8 GB

Disk : 80 GB

Gold

CPU  : 8

RAM  : 16 GB

Disk : 160 GB

Platinum

CPU  : 16

RAM  : 32 GB

Disk : 320 GB

###HIGH LEVEL FLOW###

Admin
│
▼
Create Tier
│
▼
Tier Database
│
▼
Environment Policy
│
▼
Provision VM
│
▼
Terraform Variables

###ARCHITECTURAL PRINCIPLE###

Tier menentukan:

Resource Specification

Provision Request hanya memilih:

Tier

Provisioning Engine bertanggung jawab menerjemahkan:

Tier

menjadi:

CPU

RAM

Disk

yang digunakan oleh Terraform Deployment.

###DATABASE DESIGN###

tiers

Field	Type

id	bigint

tier_name	varchar

description	text

cpu	integer

ram_mb	integer

disk_gb	integer

status	varchar

created_by	bigint

created_at	timestamp

updated_at	timestamp

###FIELD DESCRIPTION###

tier_name

Nama Tier.

Contoh:

Bronze

Silver

Gold

Platinum

description

Deskripsi penggunaan Tier.

cpu

Jumlah vCPU yang akan digunakan saat Provisioning.

ram_mb

Jumlah Memory dalam MB yang akan digunakan saat Provisioning.

disk_gb

Ukuran Disk dalam GB yang akan digunakan saat Provisioning.

status

Status Tier.

###TIER STATUS###

Possible values:

Active

Inactive

###ACTIVE###

Tier dapat digunakan untuk:

Provisioning

dan

Environment Assignment

###INACTIVE###

Tier tidak ditampilkan pada:

Provision VM

Tier tidak dapat digunakan untuk:

Environment Assignment baru

VM yang sudah menggunakan Tier tersebut tetap berjalan normal.

###DEFAULT TIERS###

Saat instalasi awal sistem, Tier berikut otomatis dibuat:

Bronze

Silver

Gold

Administrator dapat:

Create

Edit

Disable

Delete

Tier.

###CREATE TIER FLOW###

Admin
│
▼
Settings
│
▼
Tier Management
│
▼
Create Tier

###FORM FIELDS###

Tier Name

Description

CPU

RAM (GB)

Disk (GB)

Status

###EXAMPLE###

Tier Name:

Bronze

Description:

Small Development Workload

CPU:

2

RAM:

4

Disk:

40

Status:

Active

###ARCHITECTURAL PRINCIPLE###

Tier menyimpan:

Resource Specification

Tier tidak menyimpan:

Environment Policy

Approval Policy

Expiry Policy

Provider Assignment

Konfigurasi tersebut dikelola oleh modul lain.

Tier hanya menjadi sumber spesifikasi Resource yang digunakan saat:

Provisioning

dan

Terraform Deployment.


###TIER DISPLAY FORMAT###

Tier ditampilkan secara konsisten di seluruh aplikasi.

###EXAMPLES###

Bronze

2 vCPU

4 GB RAM

40 GB Disk

Silver

4 vCPU

8 GB RAM

80 GB Disk

Gold

8 vCPU

16 GB RAM

160 GB Disk

###DISPLAY PURPOSE###

User memilih:

Tier

bukan:

CPU

RAM

Disk

secara langsung.

Detail Resource ditampilkan sebagai informasi dari Tier yang dipilih.

###ENVIRONMENT RELATIONSHIP###

Environment menentukan Tier mana yang dapat digunakan untuk Provisioning.

###DATABASE RELATION###

environment_tier_rules

environment_id

tier_id

###POLICY EXAMPLES###

Development

Allowed Tiers:

Bronze

Silver

Staging

Allowed Tiers:

Bronze

Silver

Gold

Production

Allowed Tiers:

Gold

Platinum

###PROVISIONING BEHAVIOR###

Saat User memilih:

Environment = Development

Tier Dropdown hanya menampilkan:

Bronze

Silver

Saat User memilih:

Environment = Production

Tier Dropdown hanya menampilkan:

Gold

Platinum

Tier lain tidak ditampilkan dan tidak dapat digunakan untuk Provisioning.

###TIER FILTERING###

Tier Filtering dilakukan berdasarkan:

environment_tier_rules

dan

Tier Status

Hanya Tier dengan Status:

Active

yang dapat digunakan untuk Provisioning.

###FUTURE CAPACITY POLICY###

Future Enhancement:

max_instances

Field:

max_instances

Contoh:

Bronze

Maximum:

50 VM

Gold

Maximum:

10 VM

Jika jumlah VM aktif telah mencapai batas:

max_instances

maka sistem dapat memberikan status:

Tier Full

atau

Pending Capacity

###FUTURE IMPLEMENTATION NOTE###

Fitur Capacity Control tidak termasuk dalam implementasi awal.

Field:

max_instances

dapat ditambahkan pada versi berikutnya tanpa mengubah struktur Tier yang sudah ada.

###ARCHITECTURAL PRINCIPLE###

Tier menentukan:

Resource Specification

Environment menentukan:

Tier Availability

Provisioning hanya dapat menggunakan Tier yang memenuhi:

Environment Policy

dan

Tier Status.


###TIER MANAGEMENT WIDGETS###

Widgets:

Total Tiers

Active

Inactive

Most Used Tier

###WIDGET DATA SOURCE###

Data berasal dari:

tiers

inventory

###WIDGET DESCRIPTION###

###TOTAL TIERS###

Menampilkan jumlah seluruh Tier yang terdaftar pada sistem.

Data Source:

tiers

###ACTIVE###

Menampilkan jumlah Tier dengan:

status = Active

Data Source:

tiers

###INACTIVE###

Menampilkan jumlah Tier dengan:

status = Inactive

Data Source:

tiers

###MOST USED TIER###

Menampilkan Tier yang paling banyak digunakan oleh VM pada:

Inventory

Contoh:

Bronze

Digunakan oleh:

125 VM

Data Source:

inventory

###WIDGET BEHAVIOR###

Seluruh Widget dapat diklik.

Klik Widget akan otomatis melakukan filter pada:

Tier Table

###TIER TABLE###

Columns:

Tier

CPU

RAM

Disk

Status

###EXAMPLE###

Tier:

Bronze

CPU:

2 vCPU

RAM:

4 GB

Disk:

40 GB

Status:

Active

###TABLE BEHAVIOR###

All Columns must support:

* Column Resize
* Search
* Pagination

Sortable Columns:

* Tier
* CPU
* RAM
* Disk
* Status

###ACTIONS###

Edit Tier

Disable Tier

Delete Tier

###DISABLE RULE###

Saat Tier diubah menjadi:

Inactive

Tier tidak lagi ditampilkan pada:

Provision VM

Tier tidak dapat digunakan untuk:

Environment Assignment baru

VM yang sudah menggunakan Tier tersebut tetap berjalan normal.

Provision Request yang sudah disetujui tidak terpengaruh.

###DELETE RULE###

Tier tidak dapat dihapus jika masih digunakan oleh:

* Environment
* Inventory
* Provision Request

###DELETE VALIDATION###

Sistem wajib melakukan validasi sebelum menghapus Tier.

Jika masih terdapat penggunaan aktif,

maka proses Delete harus ditolak.

###DELETE ERROR MESSAGE###

Popup:

Tier masih digunakan oleh VM aktif atau Environment Policy.

Pindahkan atau nonaktifkan Tier terlebih dahulu sebelum menghapus Tier.

###ARCHITECTURAL PRINCIPLE###

Tier merupakan:

Resource Blueprint

yang digunakan saat Provisioning.

Tier tidak menyimpan:

VM

Environment

Provision Request

Tier hanya menyimpan:

CPU

RAM

Disk

yang menjadi standar Resource untuk Provisioning.


###PROVISION VM INTEGRATION###

Saat User memilih:

Environment

Backend memfilter:

Available Tiers

berdasarkan:

environment_tier_rules

dan

Tier Status

###TIER SELECTION###

Dropdown:

Select Compute Tier

menampilkan:

Bronze

2 vCPU

4 GB RAM

40 GB Disk

Silver

4 vCPU

8 GB RAM

80 GB Disk

Gold

8 vCPU

16 GB RAM

160 GB Disk

###REQUEST STORAGE RULE###

Saat User memilih:

Bronze

Backend hanya menyimpan:

tier_id

Contoh:

tier_id = 1

Backend tidak menyimpan:

cpu = 2

ram = 4096

disk = 40

pada:

Provision Request

karena spesifikasi Resource berasal dari:

Tier

###SOURCE OF TRUTH###

Tier menjadi Source of Truth untuk:

CPU

RAM

Disk

Provision Request hanya menyimpan:

tier_id

###TERRAFORM INTEGRATION###

Saat Request disetujui

dan

Terraform Deployment akan dijalankan,

Backend melakukan Resource Resolution:

tier_id
│
▼
tier
│
▼
cpu
ram
disk

###EXAMPLE###

Bronze

di-resolve menjadi:

cpu  = 2

ram  = 4096

disk = 40

Kemudian diteruskan ke:

vm_cpu

vm_memory

vm_disk_size

yang digunakan oleh:

Terraform Variables

###TERRAFORM INPUT RULE###

Terraform tidak pernah menerima:

Bronze

Silver

Gold

Platinum

Terraform hanya menerima nilai Resource aktual:

CPU

RAM

Disk

Contoh:

vm_cpu = 2

vm_memory = 4096

vm_disk_size = 40

###ARCHITECTURAL PRINCIPLE###

Tier merupakan:

Business Resource Template

Terraform menggunakan:

Resolved Resource Values

Perubahan spesifikasi Tier hanya mempengaruhi:

Provision Request baru

dan tidak mengubah VM yang sudah berhasil dibuat sebelumnya.


###INVENTORY INTEGRATION###

Inventory menampilkan:

Tier

Resources

###EXAMPLE###

Tier:

Bronze

Resources:

2 vCPU

4 GB RAM

40 GB Disk

###DISPLAY PURPOSE###

Tier menunjukkan:

Resource Blueprint

yang digunakan saat Provisioning.

Resources menunjukkan:

Spesifikasi Resource yang digunakan oleh VM.

###APPROVAL INTEGRATION###

Approval Request menampilkan:

Tier:

Bronze

dan

Resources:

2 vCPU

4 GB RAM

40 GB Disk

agar Approver memahami kapasitas Resource yang diminta.

###CATALOG INTEGRATION###

Catalog tidak terikat langsung dengan Tier.

Contoh:

Ubuntu 22.04

dapat digunakan pada:

Bronze

Silver

Gold

Relasi tetap dilakukan melalui:

Environment Policy

###FUTURE QUOTA MANAGEMENT###

Tier dapat digunakan sebagai dasar Capacity Control dan Quota Management.

Contoh:

User

Maximum:

10 Bronze VM

atau

Maximum:

3 Gold VM

Fitur ini tidak termasuk dalam implementasi awal.

Namun struktur Tier harus dapat mendukung pengembangan tersebut di masa depan.

###UI CONSISTENCY REQUIREMENT###

Mengikuti standar seluruh halaman Settings:

* Statistics Widget
* Search
* Status Filter
* Resizable Columns
* Scrollable Table
* Pagination
* Create / Edit Modal
* Delete Confirmation Modal
* Unsaved Changes Modal

###SCREEN SPECIFICATION – TIER MANAGEMENT###

###STATISTICS WIDGET###

Total Tiers

Active Tiers

Inactive Tiers

Most Used Tier

###TABLE COLUMNS###

Tier Name

CPU

RAM

Disk

Status

Created Date

Action

###SORTABLE COLUMNS###

Created Date

* Sort Ascending
* Sort Descending

###ACTION MENU###

Edit

Delete

###CREATE / EDIT MODAL###

Tier Name

Description

CPU

RAM (GB)

Disk (GB)

Status

Save

Cancel

###DELETE VALIDATION###

Jika Tier masih digunakan oleh:

Environment

Inventory

atau

Provision Request

maka proses Delete harus ditolak.

###DELETE ERROR MESSAGE###

Tier ini masih digunakan oleh Environment atau VM aktif.

Pindahkan atau nonaktifkan Tier terlebih dahulu sebelum menghapus Tier.

###ARCHITECTURAL PRINCIPLE###

Tier merupakan:

Resource Blueprint Layer

yang mendefinisikan:

CPU

RAM

Disk

###LAYER SEPARATION###

Provider Resources
│
▼
Environment Policy
│
▼
Tier Blueprint
│
▼
Provision Request
│
▼
Terraform Variables

Tier tidak melakukan:

Provisioning

Approval

Lifecycle Management

Tier hanya menyediakan:

Resource Specification

yang digunakan oleh Provisioning Engine.


###FUTURE RESOURCE RESIZE SUPPORT###

Tier digunakan sebagai:

Provisioning Blueprint

saat VM pertama kali dibuat.

Setelah VM berhasil dibuat,

Resource VM dapat berubah melalui proses:

Resource Resize

yang memerlukan:

Approval Request

dan

Terraform Reconfiguration.

###RESOURCE OWNERSHIP###

Tier tetap menyimpan:

Original Provisioning Specification

Contoh:

Tier:

Bronze

CPU:

2

RAM:

4 GB

Disk:

40 GB

Namun Inventory dapat menampilkan:

Current Resources

yang berbeda dari spesifikasi Tier.

Contoh:

Tier:

Bronze

Current Resources:

4 vCPU

8 GB RAM

80 GB Disk

karena VM telah melalui proses:

Resource Resize

###ARCHITECTURAL PRINCIPLE###

Tier merepresentasikan:

Provisioning Blueprint

Inventory merepresentasikan:

Current Infrastructure State

Perubahan Resource tidak mengubah:

Tier

yang digunakan saat Provisioning awal.


###DEPENDENCIES###

Tier Management digunakan oleh:

Environment Management

Provision VM

Approval Request

Inventory

Terraform Deployment

Future Quota Management
