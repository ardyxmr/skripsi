ARCHITECTURE-V2

MODULE 09 – APPROVAL & WORKFLOW ARCHITECTURE

PURPOSE

Approval & Workflow Management berfungsi sebagai pusat governance untuk seluruh aktivitas yang memerlukan persetujuan sebelum sistem melakukan tindakan terhadap infrastruktur.

Approval bukan hanya untuk Provision VM.

Approval menjadi mesin workflow terpusat untuk:

Provision Request

Renewal Request

Permanent Request

Future Change Request

Future Resize Request

Future Snapshot Request

###DESIGN PRINCIPLE###

Approval adalah:

Business Governance Layer

bukan:

Tombol Approve / Reject

semata.

Approval mendukung:

Approve

Reject

Revert

untuk memastikan Request dapat diperbaiki dan diajukan kembali tanpa membuat Request baru.

###ARCHITECTURE POSITION###

User Action
      │
      ▼
Workflow Engine
      │
      ▼
Approval Queue
      │
      ▼
Approved
      │
      ▼
Execution Engine
      │
      ▼
Terraform / Lifecycle Action

###HIGH LEVEL FLOW###

User
    │
    ▼
Submit Request
    │
    ▼
Workflow Engine
    │
    ▼
Approval Required?
    │
 ┌──┴─────────────┐
 │                │
No               Yes
 │                │
 ▼                ▼
Execute      Approval Queue
 │                │
 ▼                ▼
Create Audit Log      Approve / Reject / Revert
				  │
		   ┌──────┴──────┐
		   │             │
		   ▼             ▼
	   Execute      Need Modification
						  │
						  ▼
					User Edit Request
						  │
						  ▼
					  Resubmit
						  │
						  ▼
					Approval Queue
			               │		
                           ▼
                       Create Audit Log 
###SUPPORTED WORKFLOW TYPES###

Provision Request

Create VM

Renewal Request

Extend Expiry Date

Permanent Request

Convert VM menjadi Permanent

###CURRENT WORKFLOW TYPES###

Workflow yang saat ini didukung:

- Provision Request
- Renewal Request
- Permanent Request

###FUTURE WORKFLOW TYPES###

Resize Request

Upgrade CPU

Upgrade RAM

Upgrade Disk

###FUTURE WORKFLOW TYPES###

Snapshot Request

Create Snapshot

Restore Snapshot

###WORKFLOW BEHAVIOR###

Seluruh Workflow Type menggunakan Approval Engine yang sama.

Setiap Workflow dapat melalui:

Approve

Reject

Revert

sesuai keputusan Approver.

###ARCHITECTURAL PRINCIPLE###

Workflow Engine tidak bergantung pada jenis Request.

Workflow Engine hanya mengetahui:

Request Type

dan

Workflow Status

sehingga Workflow baru dapat ditambahkan tanpa mengubah Approval Engine.

###EXTENSIBILITY###

Penambahan Workflow baru tidak memerlukan perubahan pada:

- Approval Queue
- Approval Action
- Approval History
- Workflow Engine

cukup dengan menambahkan:

Request Type

dan

Execution Logic

yang sesuai.

###DATABASE DESIGN###

approval_requests

approval_requests

Field	Type

id	bigint

request_type	varchar

reference_id	bigint

requester_id	bigint

approver_id	bigint

group_id	bigint

status	varchar

action_type	varchar

action_reason	text

action_date	datetime

created_at	timestamp

updated_at	timestamp


###REQUEST TYPES###

PROVISION

Create VM

RENEWAL

Extend Expiry Date

PERMANENT

Convert VM menjadi Permanent

###CURRENT REQUEST TYPES###

Workflow yang saat ini didukung:

PROVISION

RENEWAL

PERMANENT

###FUTURE REQUEST TYPES###

RESIZE

Upgrade CPU

Upgrade RAM

Upgrade Disk

SNAPSHOT

Create Snapshot

Restore Snapshot

DESTROY

Delete VM

###REQUEST TYPE PRINCIPLE###

Setiap Request Type menggunakan:

Workflow Engine yang sama

Approval Engine yang sama

Approval Queue yang sama

###EXECUTION PRINCIPLE###

Request Type menentukan:

Execution Logic

Contoh:

PROVISION
        │
        ▼
Terraform Apply

RENEWAL
        │
        ▼
Update Expiry Date

PERMANENT
        │
        ▼
Remove Expiry Policy

DESTROY
        │
        ▼
Terraform Destroy
	   │		
       ▼
Create Audit Log 

###ARCHITECTURAL PRINCIPLE###

Approval Engine tidak bergantung pada:

Request Type

Approval Engine hanya mengetahui:

Request Type

Request Status

Action Type

sehingga Request Type baru dapat ditambahkan tanpa mengubah Approval Workflow.

###RENEWAL & PERMANENT WORKFLOW###

Renewal Request dan Permanent Request tidak membuat VM baru.

Renewal Request dan Permanent Request menggunakan VM yang sudah ada pada Inventory.

###RENEWAL & PERMANENT REQUEST FLOW###

Inventory VM
        │
        ▼
Request Renewal / Permanent
        │
        ▼
Description
        │
        ▼
Select Extension Period

atau

Request Permanent
        │
        ▼
Create Approval Request
        │
        ▼
Approval Queue
	   │		
       ▼
Create Audit Log 

###REQUEST RULES###

Default:

Extension Period = N/A

Request Permanent = false

tidak dapat dipilih secara bersamaan.

Jika:

Request Permanent = true

maka:

Extension Period

otomatis menjadi:

N/A

dan Field Extension Period dinonaktifkan.

###UI BEHAVIOR###

Jika:

Request Permanent = true

maka:

Extension Period

otomatis menjadi:

N/A

dan Field Extension Period dinonaktifkan.

Jika:

Request Permanent = false

maka:

Extension Period

dapat dipilih kembali.

###DESCRIPTION REQUIREMENT###

Description wajib diisi untuk:

Renewal Request

Permanent Request

Description akan ditampilkan pada:

Request Description Panel
Approval Request Detail
Approval History.


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

###APPROVAL ACTIONS###

Renewal Request hanya mendukung:

Approve

Reject

Permanent Request hanya mendukung:

Approve

Reject

Revert tidak digunakan untuk:

Renewal Request

Permanent Request

karena tidak terdapat konfigurasi yang perlu diperbaiki oleh User.

###INVENTORY BEHAVIOR###

Selama proses Approval:

VM tetap berada pada Inventory.

VM tetap dapat digunakan secara normal.

Status VM tidak berubah menjadi:

Pending Approval

###EXECUTION RESULT###

Jika:

Renewal Request

disetujui

maka:

Expiry Date diperpanjang.

Jika:

Permanent Request

disetujui

maka:

Expiry Policy dihapus.

Environment tidak berubah.

###ENVIRONMENT PRINCIPLE###

Permanent VM tidak mengubah:

Environment

Contoh:

Development VM

dapat menjadi:

Permanent Development VM

Production VM

dapat menjadi:

Permanent Production VM

Environment dan Expiry Policy merupakan konsep yang berbeda.

###ARCHITECTURAL PRINCIPLE###

Approval Request merepresentasikan:

Perubahan terhadap VM

bukan:

Status VM itu sendiri.

Karena itu:

Approval Queue

dan

Inventory

merupakan modul yang terpisah.


###APPROVAL ACTIONS###

Approve
Reject
Revert


###WORKFLOW OWNERSHIP###

Workflow selalu mengikuti Group.

Contoh:

User:

Budi

Group:

Infrastructure

Manager Group:

Andi

Maka:

Approval Request
      │
      ▼
Andi

User tidak perlu memilih Approver secara manual.

###APPROVER RESOLUTION FLOW###

Saat Request dibuat:

User
      │
      ▼
Group
      │
      ▼
Group Manager
      │
      ▼
Approver

###APPROVER ASSIGNMENT###

Approver ditentukan secara otomatis berdasarkan:

Group Ownership

yang dimiliki oleh User.

###RBAC APPROVAL RULES###

User

Dapat:

Submit Request

Edit Request yang berstatus Reverted

Melihat Request miliknya sendiri

Tidak dapat:

Approve

Reject

Revert

###MANAGER / APPROVER###

Dapat:

Approve

Reject

Revert

untuk Group yang dipimpin.

Dapat melihat seluruh Request dalam Group yang dipimpin.

###ADMINISTRATOR###

Dapat:

Approve

Reject

Revert

untuk seluruh Group.

Dapat melihat seluruh Request pada sistem.

###REVERT PERMISSION###

Action:

Revert

hanya dapat dilakukan oleh:

Manager

Administrator

User tidak dapat melakukan:

Self Revert

###REQUEST VISIBILITY###

User hanya dapat melihat:

Request yang dibuat oleh dirinya sendiri.

Manager dapat melihat:

Seluruh Request dalam Group yang dipimpin.

Administrator dapat melihat:

Seluruh Request pada sistem.

###ARCHITECTURAL PRINCIPLE###

Approval Assignment dilakukan secara otomatis melalui:

Group Ownership

Approver tidak dipilih secara manual oleh User.

Workflow Engine menentukan Approver berdasarkan:

User
      │
      ▼
Group
      │
      ▼
Group Manager

###PROVISION WORKFLOW###

User:

Provision VM

Backend:

Environment
      │
      ▼
Approval Required?

Jika:

No

langsung:

Terraform Queue

###FLOW###

Provision Request
      │
      ▼
Terraform Queue
      │
      ▼
ProvisionVmJob

Jika:

Yes

buat:

approval_requests

Status:

Pending

###APPROVAL PAGE###

Pending

###APPROVAL ACTIONS###

Manager:

Approve

Reject

Revert

###APPROVE FLOW###

Pending
      │
      ▼
Approved
      │
      ▼
Terraform Queue
      │
      ▼
ProvisionVmJob

###REJECT FLOW###

Pending
      │
      ▼
Rejected

Request ditutup.

Tidak ada proses provisioning.

###REVERT FLOW###

Pending
      │
      ▼
Reverted
      │
      ▼
Need Modification
      │
      ▼
User Edit Request
      │
      ▼
Resubmit
      │
      ▼
Pending

###REQUEST NOTES###

Saat melakukan:

Approve

Reject

Revert

Approver wajib memberikan:

Action Reason

Action Reason akan ditampilkan pada:

Approval Request Detail

Request History

Request Description Panel

###ARCHITECTURAL PRINCIPLE###

Provisioning hanya dapat dijalankan jika:

Approval Status

= Approved

Request dengan status:

Pending

Rejected

Reverted

tidak dapat masuk ke:

Terraform Queue


###RENEWAL WORKFLOW###

User:

Renew VM

Backend:

Create Renewal Request

Create Approval Request

Status:

Pending

###INVENTORY BEHAVIOR###

VM tetap berada pada Inventory.

VM tetap berjalan normal.

Inventory Status tidak berubah.

###APPROVAL FLOW###

Pending
      │
      ▼
Approve / Reject

###APPROVED###

Update:

Expiry Date

Inventory Status:

Running

###REJECTED###

Expiry Date:

Tidak berubah

Inventory Status:

Running

###ARCHITECTURAL PRINCIPLE###

Renewal Request

dan

Inventory VM

merupakan entitas yang berbeda.

Approval Status tidak mempengaruhi:

Inventory Status


###PERMANENT WORKFLOW###

User:

Request Permanent

Backend:

Create Permanent Request

Create Approval Request

Status:

Pending

###INVENTORY BEHAVIOR###

VM tetap berada pada Inventory.

VM tetap berjalan normal.

Inventory Status tidak berubah.

###APPROVAL FLOW###

Pending
      │
      ▼
Approve / Reject

###APPROVED###

Update:

is_permanent = true

expiry_date = null

###REJECTED###

Tidak ada perubahan pada VM.

Expiry Date tetap menggunakan nilai sebelumnya.

###ENVIRONMENT BEHAVIOR###

Environment tidak berubah.

Contoh:

Development VM

dapat menjadi:

Permanent Development VM

Production VM

dapat menjadi:

Permanent Production VM

###ARCHITECTURAL PRINCIPLE###

Permanent VM

tidak mengubah:

Environment

Permanent VM

hanya mengubah:

Expiry Policy


###APPROVAL PAGE WIDGETS###

Widget:

Total Requests

Pending

Approved

Rejected

Reverted

Semua Widget dapat diklik.

Klik Widget akan otomatis menerapkan Filter pada Approval Table.

###WIDGET FILTERING###

Total Requests

Menampilkan seluruh Request.

Pending

Menampilkan Request dengan Status:

Pending

Approved

Menampilkan Request dengan Status:

Approved

Rejected

Menampilkan Request dengan Status:

Rejected

Reverted

Menampilkan Request dengan Status:

Reverted

###DATA SOURCE###

Data berasal dari:

approval_requests

###ARCHITECTURAL PRINCIPLE###

Approval Widget merepresentasikan:

Workflow Status

bukan:

Infrastructure Status

Status yang ditampilkan pada Widget berasal dari:

Approval Request

dan tidak berasal dari:

Inventory

###APPROVAL TABLE###

Columns:

Request ID

Request Type

VM Name

OS

Environment

Tier

Resources

Provider

Status

Request Date

Action Date

Action

###REQUEST DATE###

Diambil dari:

created_at

Support:

Sort Asc

Sort Desc

###ACTION DATE###

Diambil dari:

action_date

Jika:

Pending

maka:

N/A

Support:

Sort Asc

Sort Desc

###EXPAND ROW###

Menampilkan:

Description

Catalog

Network

Datastore

Requested By

Group

Environment

Requested Expiry

Action Reason

###ACTION REASON###

Menampilkan alasan dari:

Approve

Reject

Revert

Jika:

Pending

maka:

N/A

###APPROVE ACTION###

Manager:

Approve

Popup:

Approve Request

Action Reason (Required)

Approve

Cancel

Jika:

Approved

Tombol:

Approve

Reject

Revert

hilang.

###REJECT ACTION###

Popup:

Reject Request

Action Reason (Required)

Reject

Cancel

Action Reason disimpan pada:

action_reason

###REVERT ACTION###

Popup:

Revert Request

Action Reason (Required)

Revert

Cancel

Action Reason disimpan pada:

action_reason

Status:

Reverted

###REVERT BEHAVIOR###

Request yang berstatus:

Reverted

dapat diedit oleh User.

Setelah diedit:

User dapat melakukan:

Resubmit

Status berubah menjadi:

Pending

###ACTION VISIBILITY###

Pending

Menampilkan:

Approve

Reject

Revert

Approved

Tidak menampilkan Action.

Rejected

Tidak menampilkan Action.

Reverted

Tidak menampilkan Action untuk Approver.

User akan melihat:

Edit

pada Request miliknya sendiri.


###INVENTORY INTEGRATION###

Approval dan Inventory merupakan modul yang terpisah.

Approval menyimpan:

Workflow Status

Inventory menyimpan:

VM Lifecycle Status

###PROVISION REQUEST###

Approval Status:

Pending

Inventory:

Tidak ada

VM belum dibuat.

###PROVISION APPROVED###

Approval Status:

Approved

Inventory Status:

Provisioning

Setelah:

Terraform Apply Success

Inventory Status:

Running

###PROVISION REJECTED###

Approval Status:

Rejected

Inventory:

Tidak ada

VM tidak dibuat.

###PROVISION REVERTED###

Approval Status:

Reverted

Inventory:

Tidak ada

VM tidak dibuat.

User dapat melakukan:

Edit Request

dan

Resubmit

###RENEWAL REQUEST###

Approval Status:

Pending

Inventory Status:

Running

VM tetap berjalan normal.

###PERMANENT REQUEST###

Approval Status:

Pending

Inventory Status:

Running

VM tetap berjalan normal.

###RENEWAL APPROVED###

Approval Status:

Approved

Inventory Status:

Running

Update:

Expiry Date

###PERMANENT APPROVED###

Approval Status:

Approved

Inventory Status:

Running

Update:

is_permanent = true

expiry_date = null

###ARCHITECTURAL PRINCIPLE###

Approval Status tidak disimpan pada:

Inventory

Approval Status hanya disimpan pada:

approval_requests

Inventory hanya menyimpan:

Provisioning

Running

Failed

Expired

Deleted

###SEPARATION OF CONCERNS###

Approval Queue merepresentasikan:

Workflow State

Inventory merepresentasikan:

Infrastructure State


###FUTURE MULTI-LEVEL APPROVAL###

Saat ini:

Single Level Approval

###CURRENT FLOW###

User
    │
    ▼
Manager

###FUTURE FLOW###

User
    │
    ▼
Manager
    │
    ▼
Director

###SCHEMA PRINCIPLE###

Approval Schema harus mudah dikembangkan untuk mendukung:

- Multi-Level Approval
- Multiple Approver
- Sequential Approval
- Future Approval Policy

tanpa perubahan besar pada Workflow Engine.

###APPROVAL COMPLETION###

Saat ini:

Approval selesai ketika:

Manager

melakukan:

Approve

Reject

atau

Revert

Pada Multi-Level Approval:

Approval selesai setelah seluruh Approval Level selesai diproses.

###ARCHITECTURAL PRINCIPLE###

Workflow Engine tidak bergantung pada jumlah Approval Level.

Workflow Engine hanya memproses:

Approval Status

dan

Approval Decision.

###APPROVAL ENGINE PRINCIPLE###

Approval Engine tidak mengetahui:

Terraform

Proxmox

OpenStack

OLVM

Approval Engine tidak mengetahui:

Provider

Catalog

Network

Datastore

Node

secara langsung.

Approval Engine hanya mengetahui:

Request

Request Type

Status

Approver

Decision

Action Reason

###APPROVAL RESPONSIBILITY###

Approval Engine bertugas untuk:

- Menentukan Approver
- Menyimpan Approval Status
- Menyimpan Decision
- Menyimpan Action Reason
- Menjalankan Workflow Governance

###EXECUTION RESPONSIBILITY###

Execution Engine bertugas untuk:

- Provision VM
- Renew Expiry
- Convert Permanent
- Destroy VM
- Future Lifecycle Actions

setelah Approval selesai.

###SEPARATION OF CONCERNS###

Approval Engine
        │
        ▼
Workflow Governance

Execution Engine
        │
        ▼
Infrastructure Action

###ARCHITECTURAL PRINCIPLE###

Approval Engine tidak menjalankan:

Terraform Apply

Terraform Destroy

Provider API

Infrastructure Operation

Approval Engine hanya menghasilkan:

Decision

yang kemudian diproses oleh:

Execution Engine.

###FINAL GOVERNANCE FLOW###

User Action
       │
       ▼
Workflow Engine
       │
       ▼
Approval Engine
       │
       ▼
Approved
       │
       ▼
Execution Engine
       │
       ├── Provision VM
       ├── Renewal
       ├── Permanent Conversion
       ├── Destroy VM
       └── Future Actions
       │
       ▼
Inventory Update
	   │		
       ▼
Create Audit Log 

###GOVERNANCE BOUNDARY###

Workflow Engine bertanggung jawab terhadap:

- Request Management
- Approval Routing
- Approval Decision
- Workflow Governance

Execution Engine bertanggung jawab terhadap:

- Infrastructure Action
- Terraform Execution
- Lifecycle Action
- Inventory Update

###INVENTORY INTEGRATION###

Inventory hanya diperbarui setelah:

Execution Engine

berhasil menjalankan Action yang diminta.

Approval Status tidak menjadi:

Inventory Status

###ARCHITECTURAL PRINCIPLE###

Approval & Workflow merupakan:

Central Governance Layer

yang mengontrol:

Provisioning

Lifecycle Management

Resource Ownership

Infrastructure Changes

###SEPARATION OF CONCERNS###

Workflow Engine
       │
       ▼
Business Governance

Execution Engine
       │
       ▼
Infrastructure Execution

Inventory
       │
       ▼
Infrastructure State

#######AUDIT LOG ACTION#############
APPROVE_VM
REJECT_VM
REVERT_VM

APPROVE_RENEWAL
REJECT_RENEWAL

APPROVE_PERMANENT
REJECT_PERMANENT

###FINAL PRINCIPLE###

Workflow Engine membuat keputusan.

Execution Engine menjalankan keputusan.

Inventory menyimpan hasil keputusan yang telah dieksekusi.