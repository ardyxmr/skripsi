ARCHITECTURE-V2

MODULE 11 – AUDIT TRAIL ARCHITECTURE

###PURPOSE###

Audit Trail berfungsi sebagai pusat pencatatan seluruh aktivitas yang terjadi di dalam aplikasi Web Self-Service.

Audit Trail digunakan untuk:

Governance

Traceability

Troubleshooting

Compliance

Activity History

Audit Trail menjadi sumber informasi utama untuk mengetahui:

Siapa yang melakukan aktivitas

Apa yang dilakukan

Kapan aktivitas dilakukan

###DESIGN PRINCIPLE###

Audit Trail hanya mencatat:

WHO

DO WHAT

WHEN

Audit Trail mencatat aktivitas yang berasal dari:

User Action

Business Module

Workflow Execution

Audit Trail tidak mencatat:

Terraform Output

System Logs

Provider Logs

Server Logs

Application Debug Logs

Karena aktivitas tersebut bukan merupakan fungsi Audit Trail.

###ARCHITECTURE POSITION###

User Action
│
▼
Business Module
│
▼
Audit Engine
│
▼
audit_logs
│
▼
Audit Page

###HIGH LEVEL FLOW###

User Action
│
▼
Business Module
│
▼
Success Action
│
▼
Create Audit Record
│
▼
Audit Engine
│
▼
audit_logs
│
▼
Audit Page

###AUDIT SCOPE###

Audit Trail mencatat aktivitas dari:

Authentication

Provision Request

Approval Workflow

Terraform Deployment

Inventory Lifecycle

User Management

Role Management

Group Management

Provider Management

Catalog Management

Network Management

Datastore Management

Environment Management

Tier Management

###ARCHITECTURAL PRINCIPLE###

Audit Trail merupakan:

Read-Only Governance Layer

yang bertugas:

Record

Search

Filter

Export

Audit Trail bukan:

Notification System

Infrastructure Monitoring

Provider Logging

Terraform Logging

System Logging

###DATABASE DESIGN###

audit_logs

| Field       | Type      |
| ----------- | --------- |
| id          | bigint    |
| user_id     | bigint    |
| user_name   | varchar   |
| action_type | varchar   |
| description | text      |
| ip_address  | varchar   |
| created_at  | timestamp |

###FIELD DESCRIPTION###

user_id

Referensi ke User yang melakukan aktivitas.

user_name

Snapshot Username saat aktivitas terjadi.

Digunakan agar Audit tetap dapat menampilkan nama User meskipun User telah dihapus dari sistem.

action_type

Jenis aktivitas yang dilakukan.

description

Deskripsi aktivitas dalam format Human Readable.

ip_address

IP Address saat aktivitas dilakukan.

created_at

Tanggal dan waktu aktivitas dicatat.

###WHY STORE USERNAME###

Jika User dihapus:

user_id

mungkin sudah tidak valid.

Audit tetap dapat menampilkan:

John Doe

sebagai pelaku aktivitas pada saat Audit dibuat.

###ACTION TYPES###

###PROVISION REQUEST###

CREATE_VM

DELETE_VM

RETRY_PROVISIONING

###LIFECYCLE MANAGEMENT###

REQUEST_RENEWAL

APPROVE_RENEWAL

REJECT_RENEWAL

REQUEST_PERMANENT

APPROVE_PERMANENT

REJECT_PERMANENT

###APPROVAL WORKFLOW###

APPROVE_VM

REJECT_VM

REVERT_VM

###USER MANAGEMENT###

CREATE_USER

EDIT_USER

DELETE_USER

###ROLE MANAGEMENT###

CREATE_ROLE

EDIT_ROLE

DELETE_ROLE

###GROUP MANAGEMENT###

CREATE_GROUP

EDIT_GROUP

DELETE_GROUP

###PROVIDER MANAGEMENT###

CREATE_PROVIDER

EDIT_PROVIDER

DELETE_PROVIDER

SYNC_PROVIDER

###CATALOG MANAGEMENT###

CREATE_CATALOG

EDIT_CATALOG

DELETE_CATALOG

###NETWORK MANAGEMENT###

CREATE_NETWORK

EDIT_NETWORK

DELETE_NETWORK

###DATASTORE MANAGEMENT###

CREATE_DATASTORE

EDIT_DATASTORE

DELETE_DATASTORE

###ENVIRONMENT MANAGEMENT###

CREATE_ENVIRONMENT

EDIT_ENVIRONMENT

DELETE_ENVIRONMENT

###TIER MANAGEMENT###

CREATE_TIER

EDIT_TIER

DELETE_TIER

###AUTHENTICATION###

LOGIN

LOGOUT

RESET_PASSWORD

###DESCRIPTION FORMAT###

Description harus dibuat dalam format:

Human Readable

agar mudah dipahami oleh User maupun Administrator.

###EXAMPLES###

User "Budi" created VM Request "APP-DEV-01"

Manager "Andi" approved VM Request "APP-DEV-01"

Manager "Andi" reverted VM Request "APP-DEV-01"

Administrator "Admin" created Provider "Proxmox Cluster 1"

Administrator "Admin" updated Datastore "Production Storage"

###AUDIT RECORD PRINCIPLE###

Satu aktivitas menghasilkan:

Satu Audit Record

Audit Record bersifat:

Immutable

dan tidak dapat diubah setelah dibuat.

Perubahan aktivitas harus menghasilkan:

Audit Record baru

bukan memperbarui Audit Record yang sudah ada.


###DESCRIPTION FORMAT###

Description harus dibuat dalam format:

Human Readable

agar mudah dipahami oleh User, Manager, dan Administrator.

###EXAMPLES###

User "Budi" created VM Request "APP-DEV-01"

Manager "Andi" approved VM Request "APP-DEV-01"

Manager "Andi" reverted VM Request "APP-DEV-01"

Administrator "Admin" created Provider "Proxmox Cluster 1"

Administrator "Admin" updated Datastore "Production Storage"

###SCREEN SPECIFICATION – AUDIT PAGE###

###AUDIT VISIBILITY###

Audit Trail mengikuti Role Based Access Control (RBAC).

###USER###

Dapat melihat:

Audit Log miliknya sendiri.

###MANAGER / APPROVER###

Dapat melihat:

Audit Log miliknya sendiri

dan

Audit Log seluruh User dalam Group yang dikelolanya.

###ADMINISTRATOR###

Dapat melihat:

Seluruh Audit Log pada sistem.

###STATISTICS WIDGETS###

Widget:

Total Logs

Today Activities

This Week Activities

This Month Activities

Widget hanya digunakan untuk:

Monitoring

Widget tidak berfungsi sebagai Filter.

###SEARCH & FILTER SECTION###

Komponen:

Search

User Filter

Action Type Filter

Date Range Filter

Refresh

###SEARCH BEHAVIOR###

Search dapat mencari informasi yang terdapat pada:

Description

Contoh:

VM Name

Provider Name

Catalog Name

Datastore Name

Environment Name

Tier Name

Username

###AUDIT TABLE###

Columns:

Action

Description

User

Date

###EXAMPLE###

| Action          | Description                        | User  | Date             |
| --------------- | ---------------------------------- | ----- | ---------------- |
| CREATE_VM       | Created VM Request APP-DEV-01      | budi  | 2026-06-20 09:00 |
| APPROVE_VM      | Approved VM Request APP-DEV-01     | andi  | 2026-06-20 09:03 |
| CREATE_PROVIDER | Created Provider Proxmox Cluster 1 | admin | 2026-06-20 10:00 |

###TABLE FEATURES###

Mengikuti standar seluruh aplikasi:

Resizable Columns

Scrollable Table

Pagination

Search

Filter

Refresh

Sorting

###PAGE SIZE SELECTOR###

Pilihan:

10

25

50

100

200

Default:

25

###SORTING###

Kolom:

Date

Options:

Newest First

Oldest First

Default:

Newest First

###CSV EXPORT###

Button:

Export CSV

Export mengikuti Filter yang sedang aktif.

###EXPORT VISIBILITY RULE###

User

Hanya dapat meng-export Audit Log miliknya sendiri.

Manager / Approver

Hanya dapat meng-export Audit Log miliknya sendiri

dan

Audit Log seluruh User dalam Group yang dikelolanya.

Administrator

Dapat meng-export seluruh Audit Log.

###CSV FORMAT###

File:

audit_logs_YYYYMMDD_HHMMSS.csv

Columns:

Action,Description,User,Date

###EXAMPLE###

CREATE_VM,Created VM Request APP-DEV-01,budi,2026-06-20 09:00:00

APPROVE_VM,Approved VM Request APP-DEV-01,andi,2026-06-20 09:03:00

CREATE_PROVIDER,Created Provider Proxmox Cluster 1,admin,2026-06-20 10:00:00


###CSV FORMAT###

File:

audit_logs_YYYYMMDD_HHMMSS.csv

Columns:

Action,Description,User,Date

###EXAMPLE###

CREATE_VM,Created VM Request APP-DEV-01,budi,2026-06-20 09:00:00

APPROVE_VM,Approved VM Request APP-DEV-01,andi,2026-06-20 09:03:00

CREATE_PROVIDER,Created Provider Proxmox Cluster 1,admin,2026-06-20 10:00:00

###RETENTION POLICY###

Untuk versi skripsi:

Never Delete

Audit Log tidak dihapus secara otomatis.

Karena volume Audit masih relatif kecil dan seluruh aktivitas perlu tersedia untuk kebutuhan:

Governance

Traceability

Audit History

###FUTURE ENHANCEMENT###

Archive Audit Log lebih dari:

1 Year

ke Storage Archive terpisah.

###AUDIT ENGINE IMPLEMENTATION###

Rekomendasi Laravel:

Buat Service terpusat:

AuditService

Contoh:

AuditService::log(
user: auth()->user(),
action: 'CREATE_VM',
description: 'Created VM Request APP-DEV-01'
);

Seluruh Module menggunakan:

AuditService::log(...)

untuk mencatat aktivitas.

Business Module tidak diperbolehkan menulis Audit Log secara langsung ke Database.

###AUDIT FILE STORAGE###

Selain disimpan pada:

audit_logs

Audit Event juga ditulis ke File Log.

Contoh Directory:

storage/logs/audit/budi/

storage/logs/audit/andi/

storage/logs/audit/admin/

Contoh File:

storage/logs/audit/budi/audit_20260620.log

###AUDIT STORAGE PRINCIPLE###

Database menjadi:

Source of Truth

untuk:

Audit Page

Search

Filter

Sorting

Pagination

CSV Export

File Log menjadi:

Archive Layer

untuk:

Backup

Troubleshooting

Forensic Investigation

###ARCHITECTURAL PRINCIPLE###

Audit Trail adalah:

Read-Only Governance Layer

yang bertugas:

Record

Search

Filter

Export

Audit Trail mencatat:

Who

Did What

When

Audit Trail tidak berfungsi sebagai:

Notification Center

Infrastructure Monitoring

Observability Platform

Terraform Logging

Provider Logging

System Logging

###FINAL AUDIT FLOW###

User Action
│
▼
Business Module
│
▼
Audit Service
│
├── audit_logs
│
└── Audit File Storage
│
▼
Audit Page
│
├── Search
├── Filter
├── Sort
├── Pagination
└── Export CSV

###MODULE RESPONSIBILITY###

Audit Trail bertanggung jawab untuk:

Mencatat Aktivitas

Menyimpan Riwayat Aktivitas

Menyediakan Pencarian Aktivitas

Menyediakan Export Aktivitas

Audit Trail tidak bertanggung jawab untuk:

Mengirim Notifikasi

Menjalankan Workflow

Monitoring Infrastruktur

Eksekusi Terraform
