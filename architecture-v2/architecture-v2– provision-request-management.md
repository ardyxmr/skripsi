ARCHITECTURE-V2

MODULE 12 – PROVISION REQUEST MANAGEMENT ARCHITECTURE

PURPOSE

Provision Request Management berfungsi sebagai Entry Point untuk seluruh proses provisioning Virtual Machine.

User tidak melakukan provisioning secara langsung.

User membuat:

Provision Request

yang berisi seluruh kebutuhan deployment.

Provision Request menjadi sumber data utama sebelum proses:

Approval

Terraform Deployment

Inventory Creation

dijalankan.

###DESIGN PRINCIPLE###

Provision Request adalah:

Requested Infrastructure

bukan:

Running Infrastructure

Provision Request hanya merepresentasikan:

Permintaan Resource

yang diajukan oleh User.

Provision Request tidak menyimpan:

Approval Decision

Terraform Execution State

Inventory Lifecycle State

Status tersebut berasal dari modul lain.

Provision Request hanya menyimpan:

Request Lifecycle

yang merepresentasikan perjalanan Request sejak dibuat hingga selesai diproses.

###ARCHITECTURE POSITION###

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
│
▼
Provision Request
│
▼
Approval Workflow
│
▼
Terraform Deployment
│
▼
Inventory

###HIGH LEVEL FLOW###

User
│
▼
Provision VM
│
▼
Create Provision Request
│
▼
Approval Required?
│
├── No
│      │
│      ▼
│   Auto Approved
│
└── Yes
       │
       ▼
     Pending Approval
▼
Execution Queue
│
▼
Terraform Deployment
│
▼
Inventory Creation

###ARCHITECTURAL PRINCIPLE###

Provision Request menjadi:

Workflow Entry Point

untuk seluruh proses provisioning.

Approval menentukan:

Apakah Request dapat dijalankan.

Terraform menentukan:

Bagaimana Resource dibuat.

Inventory menyimpan:

Hasil akhir dari Resource yang berhasil dibuat.
