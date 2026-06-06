ARCHITECTURE-V2

MODULE 08 – INVENTORY & LIFECYCLE MANAGEMENT ARCHITECTURE

PURPOSE

Inventory Management berfungsi sebagai pusat pengelolaan seluruh Virtual Machine yang telah berhasil dibuat melalui Self-Service Portal.

Inventory menjadi Source of Truth untuk seluruh Virtual Machine yang berhasil dibuat oleh sistem.

Inventory menjadi sumber informasi utama mengenai:

VM Status

Ownership

Lifecycle

Expiry

Renewal History

Infrastructure Resource Assignment

Terraform Workspace

Inventory hanya berisi VM yang telah berhasil dibuat melalui proses provisioning.

VM yang belum berhasil dibuat tidak boleh muncul pada Inventory.

###DESIGN PRINCIPLE###

Inventory bukan:

List VM

saja.

Inventory adalah:

VM Lifecycle Engine

Inventory tidak menyimpan:

Approval Status

Approval Decision

Approval Queue

Approval Status hanya disimpan pada:

Approval Request

Inventory hanya menyimpan:

Infrastructure Lifecycle State

Inventory menjadi sumber data utama untuk:

Lifecycle Management

Expiry Management

Renewal Management

Permanent Conversion

Destroy Operation

Inventory menjadi Source of Truth untuk seluruh operasi Lifecycle VM.

###ARCHITECTURE POSITION###

Provision Request
│
▼
Approval Queue
│
▼
Approved
│
▼
Terraform Apply
│
▼
Inventory Creation
│
▼
Lifecycle Management

Inventory dibuat setelah:

Terraform Apply

berhasil dijalankan.

Request yang berstatus:

Pending

Rejected

Reverted

tidak membuat Inventory Record.

Approval Request

dan

Inventory

merupakan modul yang terpisah.

Approval Request menyimpan:

Workflow State

Inventory menyimpan:

Infrastructure State

###HIGH LEVEL FLOW###

Provision Request
│
▼
Approval Queue
│
▼
Approved
│
▼
Terraform Apply
│
▼
Terraform Success
│
▼
Inventory Record Created
│
▼
Lifecycle Monitoring
│
├── Renewal Request
│
├── Permanent Request
│
├── Expiry Warning
│
├── Grace Period Monitoring
│
├── Auto Destroy
│
└── Retry Failed Provision

###LIFECYCLE OWNERSHIP###

Renewal Request

Permanent Request

Destroy Operation

Expiry Enforcement

selalu menggunakan:

Inventory Record

sebagai referensi utama.

Lifecycle Request tidak membuat VM baru.

Lifecycle Request hanya mengubah:

Lifecycle State

atau

Lifecycle Configuration

dari VM yang sudah ada pada Inventory.

###ARCHITECTURAL PRINCIPLE###

Inventory merepresentasikan:

Infrastructure State

Approval Request merepresentasikan:

Workflow State

Lifecycle Engine bertugas:

Memonitor

Memperbarui

dan

Menegakkan

Lifecycle Policy

berdasarkan data yang tersimpan pada Inventory.


###LIFECYCLE OWNERSHIP###

Inventory menjadi pusat referensi untuk seluruh aktivitas Lifecycle VM.

Renewal Request

Permanent Request

Destroy Request

selalu mengacu pada:

Inventory VM

yang sudah ada.

Lifecycle Request tidak membuat VM baru.

Lifecycle Request hanya mengubah:

Lifecycle State

atau

Lifecycle Configuration

dari VM yang sudah tersimpan pada Inventory.

Inventory menjadi Source of Truth untuk:

VM Lifecycle

VM Ownership

VM Expiry

VM Resource Assignment

###ARCHITECTURAL PRINCIPLE###

Approval Request merepresentasikan:

Workflow State

Inventory merepresentasikan:

Infrastructure State

Kedua modul saling berelasi tetapi memiliki tanggung jawab yang berbeda.

Approval Queue menentukan:

Apakah suatu Action dapat dijalankan.

Inventory menentukan:

VM mana yang akan dikenakan Action tersebut.

Approval Request tidak menyimpan:

VM Lifecycle State

Inventory tidak menyimpan:

Approval State

Perubahan terhadap VM hanya dapat dilakukan melalui:

Inventory VM

yang menjadi referensi utama untuk seluruh Lifecycle Operation.


		
###DATABASE DESIGN###

inventory

Field	Type

id	bigint

request_id	bigint

owner_id	bigint

provider_id	bigint

provider_node_id	bigint

workspace_path	text

terraform_state_path	text

vm_name	varchar

provider_vm_id	varchar

catalog_id	bigint

environment_id	bigint

tier_id	bigint

network_id	bigint

datastore_id	bigint

ip_address	varchar

expiry_date	datetime

grace_period_until	datetime nullable

is_permanent	boolean

status	varchar

created_at	timestamp

updated_at	timestamp

###FIELD PURPOSE###

request_id

Referensi ke Provision Request yang menghasilkan VM.

owner_id

Pemilik VM saat ini.

provider_id

Provider tempat VM dijalankan.

provider_node_id

Node tempat VM dijalankan.

provider_vm_id

Identifier VM pada Provider.

workspace_path

Lokasi Workspace Terraform.

Digunakan untuk:

Retry Provisioning

Terraform Destroy

Audit

terraform_state_path

Lokasi Terraform State.

Digunakan untuk:

Terraform Destroy

Audit

Troubleshooting

catalog_id

Published Catalog yang digunakan saat provisioning.

environment_id

Environment VM.

tier_id

Tier VM.

network_id

Published Network yang digunakan saat provisioning.

datastore_id

Published Datastore yang digunakan saat provisioning.

expiry_date

Tanggal kedaluwarsa VM berdasarkan Expiry Policy.

grace_period_until

Tanggal akhir Grace Period setelah VM berstatus Expired.

Digunakan oleh:

Lifecycle Engine

untuk menentukan kapan Auto Destroy dijalankan.

is_permanent

Menentukan apakah VM bersifat Permanent.

status

Lifecycle Status VM.

###DATA OWNERSHIP###

Inventory menjadi Source of Truth untuk:

VM Ownership

VM Lifecycle

VM Expiry

VM Resource Assignment

Terraform Workspace Reference

Inventory tidak menyimpan:

Approval Status

Approval Decision

Approval Queue

Data tersebut berasal dari:

Approval Request

###WORKSPACE PRINCIPLE###

Setiap Inventory VM harus memiliki referensi ke:

workspace_path

dan

terraform_state_path

agar Lifecycle Engine dapat menjalankan:

Retry Provisioning

Terraform Destroy

Auto Destroy

tanpa melakukan pencarian Workspace secara manual.


###SOURCE OF TRUTH###

Inventory menjadi Source of Truth untuk:

VM Ownership

VM Lifecycle

VM Expiry

VM Resource Assignment

Terraform Workspace Reference

Inventory tidak menjadi Source of Truth untuk:

Approval Status

Approval Decision

Approval Queue

Data tersebut berasal dari:

approval_requests

###RESPONSIBILITY BOUNDARY###

Inventory menyimpan:

Infrastructure State

Approval Request menyimpan:

Workflow State

Contoh:

VM Status

Expiry Date

Permanent Flag

Provider Assignment

Node Assignment

disimpan pada:

Inventory

Sedangkan:

Pending

Approved

Rejected

Reverted

disimpan pada:

Approval Request

###ARCHITECTURAL PRINCIPLE###

Jika terjadi perbedaan data antara:

Inventory

dan

Approval Request

maka:

Inventory

menjadi referensi utama untuk kondisi VM yang sebenarnya.

Approval Request

menjadi referensi utama untuk status Workflow dan riwayat persetujuan.


###RESOURCE REFERENCE PRINCIPLE###

Inventory menyimpan:

Published Resource ID

bukan:

Provider Resource Name

Contoh:

network_id
│
▼
Development Network

bukan:

vmbr0

datastore_id
│
▼
Standard Storage

bukan:

local-lvm

catalog_id
│
▼
Ubuntu 22.04

bukan:

ubuntu2204-template

Nama Provider Resource diperoleh melalui proses:

Resource Resolution

berdasarkan relasi yang sudah ditentukan pada sistem.

###NODE REFERENCE PRINCIPLE###

Inventory menyimpan:

provider_node_id

bukan:

Node Name

Node Name diperoleh melalui relasi:

provider_nodes

untuk menjaga konsistensi data saat Node berubah.

###DISPLAY PRINCIPLE###

Inventory menampilkan:

Published Resource

kepada User.

Contoh:

Development Network

Standard Storage

Ubuntu 22.04

bukan:

vmbr0

local-lvm

ubuntu2204-template

Provider Resource hanya digunakan oleh:

Provisioning Engine

Terraform Engine

Provider Integration Layer

###ARCHITECTURAL PRINCIPLE###

Inventory tidak menyimpan:

Provider Resource Name

yang dapat berubah sewaktu-waktu pada Provider.

Inventory hanya menyimpan:

Resource Reference

agar hubungan antara:

Published Resource

dan

Provider Resource

tetap dapat dikelola melalui Configuration Management.


###WORKSPACE REFERENCE PRINCIPLE###

Inventory menyimpan:

workspace_path

terraform_state_path

untuk mendukung:

Audit

Troubleshooting

Retry Provisioning

Destroy Operation

Auto Destroy

Recovery Process

Workspace dan Terraform State tetap disimpan meskipun VM telah dihapus.

Tujuan:

Audit

Troubleshooting

Historical Tracking

###STATUS MODEL###

Status Inventory:

Provisioning

Running

Failed

Expired

Deleted

Unknown

###STATUS DEFINITIONS###

Provisioning

Terraform sedang berjalan.

Inventory Record sudah dibuat.

VM belum dinyatakan siap digunakan.

Running

VM aktif dan berjalan normal.

VM berhasil dibuat dan terdeteksi pada Provider.

Failed

Provisioning gagal.

Terraform Apply gagal.

VM tidak berhasil dibuat atau tidak dapat digunakan.

Workspace tetap disimpan untuk:

Troubleshooting

Retry Provisioning

Expired

Masa berlaku VM telah habis.

VM memasuki:

Grace Period

dan menunggu:

Renewal Request

Permanent Request

atau

Auto Destroy

Deleted

Terraform Destroy berhasil dijalankan.

VM sudah tidak tersedia pada Provider.

Inventory Record tetap disimpan untuk kebutuhan Audit.

Unknown

Digunakan jika:

VM tidak ditemukan pada Provider.

Terraform State tidak sinkron.

VM dihapus langsung dari Provider.

Provider mengembalikan data yang tidak valid.

###STATUS PRINCIPLE###

Inventory Status merepresentasikan:

Infrastructure State

bukan:

Approval State

Inventory tidak menggunakan Status:

Pending

Approved

Rejected

Reverted

Status tersebut hanya digunakan pada:

Approval Request


###STATUS OWNERSHIP###

Inventory Status merepresentasikan:

Infrastructure State

bukan:

Approval State

Inventory tidak menggunakan Status:

Pending

Approved

Rejected

Reverted

Status tersebut hanya digunakan pada:

approval_requests

###STATUS RESPONSIBILITY###

Inventory bertanggung jawab untuk menyimpan:

Provisioning

Running

Failed

Expired

Deleted

Unknown

Status tersebut menggambarkan:

Kondisi aktual VM

pada Infrastructure Provider.

Approval Request bertanggung jawab untuk menyimpan:

Pending

Approved

Rejected

Reverted

Status tersebut menggambarkan:

Status Workflow

dan

Status Persetujuan

bukan kondisi VM yang sebenarnya.

###ARCHITECTURAL PRINCIPLE###

Perubahan pada:

Approval Status

tidak secara otomatis mengubah:

Inventory Status

Contoh:

Renewal Request

Status:

Pending

Inventory tetap:

Running

Permanent Request

Status:

Pending

Inventory tetap:

Running

Inventory Status hanya berubah jika terjadi perubahan pada:

Infrastructure State

atau

Lifecycle State

VM tersebut.


###STATUS TRANSITION###

Provisioning
│
▼
Running

Provisioning
│
▼
Failed

Running
│
▼
Expired

Running
│
▼
Deleted

Running
│
▼
Unknown

Expired
│
▼
Deleted

###STATUS DEFINITIONS###

Provisioning

Terraform sedang berjalan.

Inventory Record sudah dibuat.

VM belum dapat digunakan oleh User.

Running

VM aktif dan berjalan normal.

VM berhasil dibuat dan terdeteksi pada Provider.

Failed

Terraform gagal dijalankan.

Provisioning tidak berhasil diselesaikan.

Workspace tetap disimpan untuk kebutuhan:

Troubleshooting

Retry Provisioning

Expired

Masa berlaku VM telah habis.

VM memasuki:

Grace Period

VM tetap tersedia pada Provider selama Grace Period berlangsung.

User masih dapat mengajukan:

Renewal Request

Permanent Request

Jika Grace Period berakhir dan tidak terdapat Renewal yang disetujui,

maka Lifecycle Engine dapat menjalankan:

Auto Destroy

Deleted

Terraform Destroy berhasil dijalankan.

VM sudah tidak tersedia pada Provider.

Inventory Record tetap disimpan untuk kebutuhan Audit.

Unknown

Digunakan jika:

VM tidak ditemukan pada Provider.

Terraform State tidak sinkron.

VM dihapus langsung dari Provider.

Provider mengembalikan informasi VM yang tidak valid.

###STATUS PRINCIPLE###

Inventory Status merepresentasikan:

Infrastructure State

bukan:

Approval State

Inventory tidak menggunakan Status:

Pending

Approved

Rejected

Reverted

Status tersebut hanya digunakan pada:

Approval Request



###EXPIRY MODEL###

Environment menentukan:

Expiry Policy

Contoh:

Development

30 Days

Staging

60 Days

Production

Lifetime

Saat Provision Request berhasil dibuat:

Current Date
+
Environment Expiry Policy

=========================

Expiry Date

Nilai hasil perhitungan disimpan pada:

expiry_date

###EXPIRY CALCULATION###

Contoh:

Environment:

Development

Expiry Policy:

30 Days

Provision Date:

01 Jan 2026

Maka:

Expiry Date:

31 Jan 2026

###LIFETIME ENVIRONMENT###

Jika Environment menggunakan:

Lifetime

maka:

expiry_date = null

is_permanent = false

karena VM bersifat Lifetime berdasarkan:

Environment Policy

bukan hasil Permanent Request.

###PERMANENT VM###

Jika:

Permanent Request

disetujui

maka:

is_permanent = true

expiry_date = null

VM tidak lagi mengikuti:

Environment Expiry Policy

###EXPIRY OWNERSHIP###

Expiry Policy berasal dari:

Environment

Inventory hanya menyimpan:

expiry_date

hasil perhitungan yang dilakukan saat:

Provisioning

atau

Renewal

###ARCHITECTURAL PRINCIPLE###

Environment menentukan:

Expiry Policy

Inventory menyimpan:

Expiry Date

Permanent Request dapat menghapus:

Expiry Date

tanpa mengubah:

Environment

Contoh:

Development VM

dapat menjadi:

Permanent Development VM

Environment

dan

Expiry Policy

merupakan konsep yang berbeda.


###RENEWAL CALCULATION###

Saat:

Renewal Request

disetujui

sistem memperpanjang:

expiry_date

berdasarkan periode yang dipilih pada Request.

Contoh:

Current Expiry Date:

31 Jan 2026

Renewal:

30 Days

Maka:

New Expiry Date:

02 Mar 2026

Perhitungan Renewal selalu menggunakan:

Current Expiry Date

bukan:

Current System Date

###RENEWAL RULE###

Renewal hanya dapat dilakukan untuk VM yang:

Tidak Permanent

dan

Belum berstatus:

Deleted

###GRACE PERIOD RENEWAL###

Jika VM berada pada:

Grace Period

dan

Renewal Request

disetujui

maka:

expiry_date

diperbarui berdasarkan:

Current Expiry Date

ditambah:

Renewal Period

grace_period_until

dikosongkan kembali.

VM keluar dari:

Grace Period

dan kembali mengikuti:

Expiry Policy

yang berlaku.

###ARCHITECTURAL PRINCIPLE###

Renewal tidak membuat VM baru.

Renewal hanya memperbarui:

expiry_date

pada Inventory VM yang sudah ada.


###PERMANENT VM###

Jika:

Permanent Request

disetujui

maka:

is_permanent = true

expiry_date = null

VM tidak lagi mengikuti:

Environment Expiry Policy

VM tidak akan diproses oleh:

Expiry Warning Engine

Grace Period Engine

Auto Destroy Engine

###LIFETIME ENVIRONMENT###

Jika Environment menggunakan:

Lifetime

maka:

expiry_date = null

is_permanent = false

karena VM bersifat Lifetime berdasarkan:

Environment Policy

bukan hasil Permanent Request.

VM tidak akan diproses oleh:

Expiry Warning Engine

Grace Period Engine

Auto Destroy Engine

###ARCHITECTURAL PRINCIPLE###

Permanent VM

dan

Lifetime Environment

menghasilkan perilaku yang sama:

Tidak memiliki Expiry Date

tetapi memiliki sumber yang berbeda.

Permanent VM berasal dari:

Permanent Request

Lifetime VM berasal dari:

Environment Policy

Environment

dan

Expiry Policy

merupakan konsep yang berbeda.


###EXPIRY SOURCE OF TRUTH###

Expiry Policy berasal dari:

Environment

Inventory hanya menyimpan:

expiry_date

hasil perhitungan yang dilakukan saat:

Provisioning

atau

Renewal

Inventory tidak menyimpan:

Expiry Policy

karena Expiry Policy tetap berasal dari:

Environment

###ARCHITECTURAL PRINCIPLE###

Environment menentukan:

Expiry Policy

Inventory menyimpan:

Expiry Date

Permanent Request dapat menghapus:

Expiry Date

tanpa mengubah:

Environment

Contoh:

Development VM

dapat menjadi:

Permanent Development VM

Environment tetap:

Development

meskipun:

expiry_date = null

dan

is_permanent = true

Environment

dan

Expiry Policy

merupakan konsep yang berbeda.

Inventory hanya menyimpan:

Hasil perhitungan Expiry

bukan:

Konfigurasi Expiry Policy.



###EXPIRY DISPLAY RULE###

Inventory menampilkan informasi Expiry berdasarkan:

expiry_date

dan

Current Date

###DISPLAY BEHAVIOR###

Jika:

is_permanent = true

atau

expiry_date = null

maka:

Lifetime

ditampilkan pada kolom Expiry.

Jika:

is_permanent = false

dan

expiry_date memiliki nilai

maka sistem menghitung:

expiry_date

*

Current Date

Contoh:

29 Days Remaining

14 Days Remaining

3 Days Remaining

Perhitungan dilakukan secara realtime saat halaman Inventory ditampilkan.

Jika:

Current Date

lebih besar dari:

expiry_date

maka:

Expired

ditampilkan pada kolom Expiry.

Jika VM berada pada:

Grace Period

maka sistem dapat menampilkan:

Expired

atau

Expired (Auto Delete In 7 Days)

berdasarkan:

grace_period_until

###DISPLAY SOURCE OF TRUTH###

Inventory hanya menyimpan:

expiry_date

is_permanent

grace_period_until

Inventory tidak menyimpan:

Remaining Days

Nilai Remaining Days dihitung secara dinamis oleh sistem.

###ARCHITECTURAL PRINCIPLE###

Kolom Expiry merupakan:

Calculated Display Value

bukan:

Stored Value

Sistem hanya menyimpan:

expiry_date

dan

is_permanent

sedangkan nilai seperti:

29 Days Remaining

14 Days Remaining

Expired

Lifetime

dihitung secara realtime saat data ditampilkan.


###EXPIRY WARNING ENGINE###

Background Job:

Daily Lifecycle Scan

Dijalankan setiap hari.

Sistem melakukan evaluasi terhadap:

expiry_date

untuk seluruh VM yang:

status = Running

dan

is_permanent = false

###WARNING THRESHOLD###

Jika sisa masa berlaku:

7 Days Remaining

3 Days Remaining

1 Day Remaining

maka sistem membuat:

Notification

dan

Expiry Warning Event

###EXPIRY ENFORCEMENT###

Jika:

Current Date

lebih besar dari:

expiry_date

maka:

Status VM berubah menjadi:

Expired

dan sistem mengisi:

grace_period_until

dengan:

Current Date + 7 Days

###GRACE PERIOD###

Selama:

Grace Period

VM tetap berada pada:

Inventory

User masih dapat mengajukan:

Renewal Request

Permanent Request

###AUTO DESTROY ENGINE###

Background Job:

Daily Lifecycle Scan

juga melakukan evaluasi terhadap:

grace_period_until

untuk seluruh VM yang berstatus:

Expired

Jika:

Current Date

lebih besar dari:

grace_period_until

maka sistem menjalankan:

Terraform Destroy

menggunakan:

workspace_path

dan

terraform_state_path

yang tersimpan pada Inventory.

Jika:

Terraform Destroy

berhasil

maka:

Status berubah menjadi:

Deleted

###PERMANENT VM EXCLUSION###

VM dengan:

is_permanent = true

tidak diproses oleh:

Expiry Warning Engine

Grace Period Engine

Auto Destroy Engine

karena tidak memiliki:

Expiry Date

###ARCHITECTURAL PRINCIPLE###

Expiry Display

Expiry Warning

Grace Period

dan

Auto Destroy

selalu menggunakan:

expiry_date

sebagai Source of Truth.

Tidak ada data Expiry yang disimpan dalam bentuk:

Remaining Days



###NOTIFICATION LOCATIONS###

Notification dapat ditampilkan pada:

Catalog Widget

Inventory Banner

Notification Center

Future:

Email

Microsoft Teams

Slack

###NOTIFICATION SOURCE###

Notification dapat berasal dari:

Approval Workflow

Provisioning Engine

Lifecycle Engine

Inventory Management

###EXAMPLES###

Approval Request Approved

Approval Request Rejected

Approval Request Reverted

Provisioning Success

Provisioning Failed

Renewal Approved

Permanent Approved

Expiry Warning

VM Expired

###DELIVERY RULE###

Satu Event dapat dikirim ke beberapa lokasi secara bersamaan.

Contoh:

Expiry Warning

ditampilkan pada:

Inventory Banner

dan

Notification Center

Future:

Email

Microsoft Teams

Slack

###ARCHITECTURAL PRINCIPLE###

Notification merupakan:

Communication Layer

bukan:

Source of Truth

Data utama tetap berasal dari:

Inventory

Approval Request

Provision Request

Notification hanya berfungsi untuk:

Memberikan informasi kepada User

dan

Mengarahkan User ke modul yang relevan.


###RENEWAL & PERMANENT REQUEST FLOW###

Inventory VM
│
▼
Renew VM
│
▼
Popup

Description

Extension Period

Request Permanent

###REQUEST RULES###

Extension Period

dan

Request Permanent

tidak dapat dipilih secara bersamaan.

Jika:

Request Permanent = true

maka:

Extension Period

otomatis menjadi:

N/A

dan Field Extension Period dinonaktifkan.

###REQUEST BEHAVIOR###

Saat User mengajukan:

Renewal Request

atau

Permanent Request

sistem membuat:

Approval Request baru

dengan:

Request ID baru

VM tetap menggunakan:

Inventory ID yang sama.

Workflow disimpan pada:

approval_requests

dengan:

request_type

RENEWAL

atau

PERMANENT

###INVENTORY BEHAVIOR###

Selama proses Approval:

VM tetap:

Running

Inventory Status tidak berubah.

VM tetap dapat digunakan secara normal.

VM tidak:

Shutdown

Destroy

Restart

selama proses Approval berlangsung.

###APPROVAL FLOW###

Approval Request
│
▼
Pending
│
▼
Approve / Reject
│
▼
Execute Action

###RENEWAL APPROVED###

Jika:

Renewal Request

disetujui

maka:

expiry_date

diperbarui berdasarkan:

Renewal Period

yang dipilih.

Jika VM sebelumnya berada pada:

Grace Period

maka:

grace_period_until = null

Inventory tetap:

Running

###PERMANENT APPROVED###

Jika:

Permanent Request

disetujui

maka:

is_permanent = true

expiry_date = null

grace_period_until = null

Inventory tetap:

Running

Kolom Expiry menampilkan:

Lifetime

###REJECTED###

Jika:

Renewal Request

atau

Permanent Request

ditolak

maka:

Tidak ada perubahan pada Inventory VM.

###PENDING REQUEST RULE###

Jika VM masih memiliki:

RENEWAL Request

dengan Status:

Pending

maka User tidak dapat membuat:

Renewal Request baru.

Jika VM masih memiliki:

PERMANENT Request

dengan Status:

Pending

maka User tidak dapat membuat:

Permanent Request baru.

###ARCHITECTURAL PRINCIPLE###

Renewal Request

dan

Permanent Request

tidak membuat VM baru.

Renewal Request

dan

Permanent Request

tidak memiliki tabel khusus.

Workflow disimpan pada:

approval_requests

dengan:

request_type

RENEWAL

atau

PERMANENT

Approval Request menjadi Source of Truth untuk:

Workflow State

Inventory menjadi Source of Truth untuk:

Infrastructure State

Inventory hanya menyimpan hasil akhir berupa:

expiry_date

is_permanent

dan

Lifecycle Status VM.


###DELETE VM FLOW###

User:

Inventory
│
▼
Delete VM
│
▼
Delete Confirmation
│
▼
Delete Execution
│
▼
Inventory Update

###DELETE CONFIRMATION###

Popup:

Delete Virtual Machine

Untuk menghapus VM ini,

ketik nama VM secara lengkap.

VM Name:

APP-WEB-01

Input:

[________________]

###CONFIRMATION RULE###

Input harus sama persis dengan:

VM Name

Jika tidak sama:

Tombol Delete dinonaktifkan.

Jika sama:

Tombol Delete aktif.

Action:

Delete

Cancel

###DELETE EXECUTION###

Saat User memilih:

Delete

sistem menjalankan proses penghapusan VM.

Metode eksekusi penghapusan ditentukan oleh:

Lifecycle Engine

berdasarkan kebijakan yang berlaku.

###DELETE SUCCESS###

Jika proses penghapusan berhasil

maka:

Status:

Deleted

Inventory Record tidak lagi ditampilkan pada:

Inventory Page

Riwayat VM tetap disimpan pada:

Audit Log

###DELETE FAILURE###

Jika proses penghapusan gagal

maka:

Inventory Status tetap menggunakan status sebelumnya.

Error dicatat pada:

Audit Log

User dapat mencoba:

Delete VM

kembali.

###ARCHITECTURAL PRINCIPLE###

Delete VM merupakan:

Lifecycle Operation

yang bekerja terhadap:

Inventory VM

yang sudah ada.

Inventory menjadi Source of Truth untuk menentukan:

VM mana yang akan dihapus.

Lifecycle Engine bertanggung jawab menjalankan proses penghapusan sesuai mekanisme yang berlaku.


###RETRY PROVISIONING###

Hanya muncul jika:

Status = Failed

Action:

Retry Provisioning

Backend:

Reuse Existing Workspace

Tidak membuat:

Workspace Baru

Tujuan:

Debugging lebih mudah

###VM DISCOVERY ENGINE###

Background Sync:

Every 15 Minutes

Provider Driver:

Discover VM Status

Update:

Power State

IP Address

VM Availability

###UNKNOWN STATUS DETECTION###

Jika:

VM tidak ditemukan di provider

Status:

Unknown

Contoh:

VM dihapus langsung dari Proxmox

tanpa melalui portal.

Inventory tetap ada.

Admin dapat melihat:

Provider Resource Missing

###RBAC RULES###

User

Melihat:

VM miliknya sendiri
Manager

Melihat:

VM seluruh user dalam Group
Administrator

Melihat:

Seluruh VM

###INVENTORY TABLE###

Columns:

VM Name

OS

Environment

Tier

Resources

IP Address

Status

Expiry

Action

Semua data:

Realtime

Database Driven

Provider Sync Driven

###VM DETAIL DRAWER###

Expand Row:

Description

Provider

Catalog

Network

Datastore

Environment

Tier

Created Date

Expiry Date

Workspace Path

Default OS Username

Node

Network Interface

Storage Interface

Contoh:

Default OS Username:

sysadm01

Network Interface:

NET-PROD-VMBR01

Storage Interface:

DS-PROD-VMDATA01

Node:

PVE1

Tidak menampilkan:

Password


###WORKSPACE TRACEABILITY###

Inventory menyimpan:

Workspace Path

Contoh:

storage/app/provisioning/user01/date_pr19062026_154501

Admin dapat melakukan:

Audit

Troubleshooting

Terraform Investigation

###LIFECYCLE ENGINE###

Inventory menjadi pusat:

Provision Lifecycle

Renewal Request

Permanent Request

Delete Operation

Retry Provisioning

Expiry Monitoring

Grace Period Monitoring

Auto Destroy

Provider Synchronization


###ARCHITECTURAL PRINCIPLE###

Inventory adalah:

Single Source of Truth

untuk seluruh VM yang berhasil maupun gagal dibuat oleh sistem.

###FINAL LIFECYCLE FLOW###

Provision Request
│
▼
Approval
│
▼
Terraform Apply
│
▼
Inventory Created
│
▼
Running
│
├── Renewal Request
│
├── Permanent Request
│
├── Expiry Warning
│
├── Delete VM
│
├── Provider Sync
│
└── Retry Provisioning
│
▼
Expired
│
▼
Grace Period
│
▼
Auto Destroy
│
▼
Deleted
