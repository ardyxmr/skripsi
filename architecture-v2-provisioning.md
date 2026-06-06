ARCHITECTURE-V2

MODULE 07 – PROVISIONING & TERRAFORM DEPLOYMENT ARCHITECTURE

PURPOSE

Provisioning Engine merupakan inti dari sistem Self-Service Portal.

Tujuan utama:

Mengubah Request User
menjadi
Virtual Machine yang berjalan pada Provider.

###DESIGN PRINCIPLE###

Provisioning tidak boleh berkomunikasi langsung dengan Provider.

Seluruh provisioning wajib melalui:

Provision Request
        │
        ▼
Approval Process
        │
        ▼
Resource Resolution
        │
        ▼
Workspace Generation
        │
        ▼
Terraform Execution
        │
        ▼
Provider

###RESOURCE RESOLUTION###

Sebelum Workspace Generation dilakukan,

Backend wajib melakukan resolve terhadap:

Environment

Provider

Node

Catalog

Network

Datastore

Tier

menjadi resource Provider yang sebenarnya digunakan untuk deployment.

Contoh:

Catalog
        │
        ▼
Provider Template

Network
        │
        ▼
Provider Network

Datastore
        │
        ▼
Provider Datastore

###PROVIDER ABSTRACTION###

User tidak pernah berinteraksi langsung dengan:

Provider Template

Provider Network

Provider Datastore

Provider Node

User hanya memilih:

Published Catalog

Published Network

Published Datastore

Tier

Environment

Provider

###ARCHITECTURAL PRINCIPLE###

Provisioning Engine menggunakan:

Published Resource Layer

bukan:

Provider Discovery Layer

Seluruh resource Provider di-resolve oleh Backend sebelum Terraform dijalankan.


###PROVISIONING CONTEXT MODEL###

Provisioning wajib dimulai dari:

Environment
        │
        ▼
Provider
        │
        ▼
Node
        │
        ▼
Resource Resolution

Provider menentukan resource yang tersedia untuk User.

Node menentukan resource Provider yang tersedia untuk deployment.

Resource yang difilter:

Catalog

Network

Datastore

Tier

Environment menentukan:

Approval Policy

Expiry Policy

Allowed Provider

Flow:

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


###HIGH LEVEL FLOW###

User
    │
    ▼
Provision VM
    │
    ▼
Select Environment
    │
    ▼
Select Provider
    │
    ▼
Select Node
    │
    ▼
Load Available Resources
    │
    ├── Catalogs
    │
    ├── Networks
    │
    ├── Datastores
    │
    └── Tiers
    │
    ▼
Create Request
    │
    ▼
Approval Required?
    │
 ┌──┴──┐
 │     │
No    Yes
 │     │
 ▼     ▼
Terraform Queue
      Approval Queue
           │
           ▼
      Approved
           │
           ▼
Terraform Queue
           │
           ▼
Workspace Generation
           │
           ▼
terraform init
           │
           ▼
terraform apply
           │
           ▼
Inventory Update


###RESOURCE FILTERING RULE###

Saat User memilih:

Environment:

Development

Provider:

Proxmox LAB

Node:

pve01

Backend hanya menampilkan:

Catalog

Network

Datastore

Tier

yang memenuhi:

- Status = Active
- Assigned ke Environment Development
- Assigned ke Provider Proxmox LAB
- Assigned ke Node pve01

Resource lain tidak ditampilkan.

###FILTERING FLOW###

Environment
        │
        ▼
Provider
        │
        ▼
Node
        │
        ▼
Available Catalogs

Available Networks

Available Datastores

Available Tiers

###PURPOSE###

Mencegah User menggunakan resource yang:

- Tidak sesuai Environment
- Tidak sesuai Provider
- Tidak tersedia pada Node yang dipilih
- Tidak aktif untuk provisioning

###PROVISIONING UI FLOW###

Step 1

Deployment Context

Fields:

Environment

Provider

Node

Step 2

VM Configuration

Fields:

Catalog

Tier

Network

Datastore

VM Name Prefix

Instance Count

Description

Security Hardening

Step 3

Review & Submit

Display:

Environment

Provider

Node

Catalog

Tier

Network

Datastore

Generated VM Names

Expiry Policy

Approval Requirement

###REVERTED REQUEST EDIT FLOW###

Request dengan status:

Reverted

dapat diedit kembali oleh Requester.

Flow:

Approval Request
        │
        ▼
Status: Reverted
        │
        ▼
Edit Request
        │
        ▼
Provision VM Form
        │
        ▼
Submit Again
        │
        ▼
Approval Queue

Status:

Pending

Seluruh field otomatis terisi berdasarkan
Provision Request yang direvert.

###FORM PREFILL BEHAVIOR###

Saat Request direvert,

Backend mengambil data dari:

provision_requests

dan melakukan prefill terhadap:

Environment

Provider

Node

Catalog

Network

Datastore

Tier

VM Name Prefix

Instance Count

Description

Security Hardening

Requester hanya memperbaiki field yang diperlukan.

Data lain tetap dipertahankan.

###RESUBMIT REVERTED REQUEST###

Requester
      │
      ▼
Edit Request
      │
      ▼
Submit Again
      │
      ▼
Approval Queue

Status:

Pending

Approver melakukan review ulang
terhadap request yang telah diperbaiki.

###REQUEST REUSE PRINCIPLE###

Reverted Request tidak membuat:

Provision Request baru

Workspace baru

Approval Request baru

Sistem tetap menggunakan:

request_id yang sama

Riwayat status:

Pending
Reverted
Pending
Approved

Tujuan:

- Audit Trail tetap utuh
- Tidak terjadi duplikasi request
- Riwayat approval tetap dapat ditelusuri


###WORKSPACE ISOLATION ARCHITECTURE###

PURPOSE

Setiap Provision Request wajib memiliki Workspace yang terisolasi.

Tujuan:

Terraform State terpisah

Audit lebih mudah

Delete lebih aman

Future Multi Provider lebih aman

Future Multi Node lebih aman

Tidak ada konflik antar User

Workspace menjadi unit isolasi untuk seluruh proses deployment.

Satu Workspace hanya boleh digunakan oleh satu Provision Request.

###ROOT DIRECTORY###

Rekomendasi:

storage/app/provisioning/

###USER DIRECTORY###

Setiap User memiliki folder sendiri.

storage/app/provisioning/
│
├── user01/
├── user02/
├── user03/

###PURPOSE###

User Directory digunakan untuk:

- Workspace Isolation
- Audit
- Request Tracking
- Terraform State Management

Folder User tidak digunakan sebagai unit deployment.

Unit deployment tetap menggunakan:

Provision Request

yang memiliki Workspace masing-masing.

###REQUEST DIRECTORY###

Setiap Provision Request memiliki folder unik.

Format:

date_pr{DDMMYYYY_His}

Contoh:

date_pr19062026_154501

###FINAL DIRECTORY STRUCTURE###

storage/app/provisioning/
│
└── user01/
     │
     ├── date_pr19062026_154501/
     │
     ├── date_pr19062026_161100/
     │
     └── date_pr20062026_090010/

###WORKSPACE CONTENT###

Contoh:

storage/app/provisioning/user01/date_pr19062026_154501/
│
├── provider.tf
├── main.tf
├── variables.tf
├── terraform.tfvars
├── terraform.tfstate
├── terraform.tfstate.backup
└── deployment.json

###PURPOSE###

Setiap Workspace menyimpan:

- Terraform Configuration
- Terraform State
- Deployment Metadata
- Deployment Result

Workspace hanya digunakan oleh satu Provision Request.

Workspace tidak boleh digunakan bersama oleh beberapa Request.

###ISOLATION PRINCIPLE###

Setiap Provision Request memiliki:

- Workspace sendiri
- Terraform State sendiri
- Deployment Metadata sendiri

sehingga perubahan pada satu Request tidak mempengaruhi Request lain.

###MULTI PROVIDER SUPPORT###

Workspace dapat digunakan untuk:

- Proxmox
- OpenStack
- OLVM

tanpa mengubah struktur direktori.

###MULTI NODE SUPPORT###

Informasi Provider dan Node disimpan pada:

deployment.json

dan terraform.tfvars

sehingga Workspace dapat melakukan deployment ke Node yang berbeda tanpa mengubah struktur direktori.

###IMPORTANT REVISION###

Berdasarkan Architecture V2:

JANGAN

Copy:

provider.tf

dari source folder.

JANGAN

Menyimpan provider.tf statis untuk seluruh Provider.

HARUS

Generate:

provider.tf

secara dinamis berdasarkan:

Provider yang dipilih pada Provision Request.

###WHY###

Setiap Provider dapat menggunakan:

- Terraform Provider berbeda
- Authentication berbeda
- Endpoint berbeda
- Version berbeda

Contoh:

Proxmox

OpenStack

OLVM

memiliki konfigurasi Provider Terraform yang berbeda.

###RENDER FLOW###

Provision Request
        │
        ▼
Selected Provider
        │
        ▼
Provider Configuration
        │
        ▼
Render provider.tf
        │
        ▼
Workspace

###PROVIDER CONFIGURATION SOURCE###

Provider Configuration diambil dari:

providers

Field:

provider_type

endpoint

authentication_method

terraform_provider_source

terraform_provider_version

###ARCHITECTURAL PRINCIPLE###

provider.tf

merupakan generated file.

provider.tf

bukan template statis yang dicopy ke Workspace.

Setiap Workspace menghasilkan:

provider.tf

sesuai Provider yang digunakan oleh Provision Request.

###FUTURE PROVIDER SUPPORT###

Penambahan Provider baru tidak memerlukan perubahan pada:

Provisioning Engine

Workspace Structure

Terraform Execution Flow

cukup dengan menambahkan:

Provider Driver dan Provider Terraform Configuration yang sesuai.

###NEW TERRAFORM ENGINE FLOW###

Request Approved
        │
        ▼
Resolve Environment
        │
        ▼
Resolve Provider
        │
        ▼
Resolve Node
        │
        ▼
Resolve Catalog
        │
        ▼
Resolve Network
        │
        ▼
Resolve Datastore
        │
        ▼
Load Provider Configuration
        │
        ▼
Render provider.tf
        │
        ▼
Render terraform.tfvars
        │
        ▼
Copy main.tf template
        │
        ▼
Create Workspace
        │
        ▼
terraform init
        │
        ▼
terraform apply

###PROVIDER CONFIGURATION SOURCE###

Provider Configuration berasal dari:

providers

###PROVIDER CONFIGURATION###

Contoh:

Provider:

Proxmox Cluster 1

Database:

provider_name

provider_type

endpoint

token_id

token_secret

terraform_provider_source

terraform_provider_version

###EXAMPLE###

terraform_provider_source

Telmate/proxmox

terraform_provider_version

3.0.2-rc04

###PURPOSE###

Provider Configuration digunakan untuk:

- Generate provider.tf
- Generate Provider Authentication
- Generate Provider Endpoint Configuration
- Terraform Initialization

###PROVIDER RESOLUTION###

Saat Request diproses,

Backend melakukan resolve:

provider_id
        │
        ▼
providers
        │
        ▼
Provider Configuration
        │
        ▼
Render provider.tf

###FUTURE PROVIDER SUPPORT###

Provider Configuration dapat digunakan untuk:

- Proxmox
- OpenStack
- OLVM

tanpa mengubah Terraform Engine.

Provider baru hanya perlu menambahkan:

provider_type

terraform_provider_source

terraform_provider_version

pada konfigurasi Provider.

###ARCHITECTURAL PRINCIPLE###

Provider Configuration menjadi:

Source of Truth

untuk proses render:

provider.tf

Terraform Engine tidak menggunakan konfigurasi yang di-hardcode pada source code.

###GENERATED PROVIDER.TF###

provider.tf

dibuat secara dinamis berdasarkan:

Provider Configuration

yang berasal dari:

providers

###EXAMPLE###

terraform {

  required_providers {

    proxmox = {

      source  = "Telmate/proxmox"

      version = "3.0.2-rc04"

    }

  }

}

###NOT ALLOWED###

JANGAN:

Hardcode:

- Provider Source
- Provider Version

pada source code.

###WHY###

Jika suatu hari:

Telmate/proxmox

3.0.3

atau

4.x

Admin cukup mengubah:

terraform_provider_source

atau

terraform_provider_version

pada Provider Configuration.

Tidak perlu mengubah source code.

###RENDER SOURCE###

provider.tf

harus di-render menggunakan:

terraform_provider_source

terraform_provider_version

yang berasal dari:

providers

###ARCHITECTURAL PRINCIPLE###

provider.tf

merupakan generated file.

provider.tf

tidak boleh menjadi file statis yang digunakan oleh seluruh Provider.

Setiap Workspace menghasilkan:

provider.tf

sesuai Provider yang digunakan oleh Provision Request.

###FUTURE PROVIDER SUPPORT###

Provider baru dapat menggunakan:

- Terraform Provider berbeda
- Terraform Provider Version berbeda

tanpa mengubah:

- Provisioning Engine
- Workspace Structure
- Terraform Execution Flow

###MAIN.TF STRATEGY###

Main Terraform Logic tetap menggunakan template.

Lokasi:

storage/app/master-provisioning/terraform/

Contoh:

main.tf.stub

variables.tf.stub

Saat deployment:

Copy

ke Workspace Provision Request.

###PURPOSE###

Template Terraform digunakan untuk:

- Menjaga konsistensi deployment
- Mengurangi duplikasi file
- Mempermudah maintenance
- Mendukung Multi Provider di masa depan

###TERRAFORM.TFVARS GENERATION###

terraform.tfvars

dibuat secara dinamis berdasarkan:

Provision Request

dan hasil Resource Resolution.

###EXAMPLE###

vm_name = "APP01"

cpu = 2

memory = 4096

disk_size = 40

target_node = "pve01"

network = "vmbr0"

storage = "local-lvm"

template = "ubuntu2204-template"

###RESOURCE RESOLUTION###

Backend melakukan resolve:

Catalog
        │
        ▼
Provider Template

Network
        │
        ▼
Provider Network

Datastore
        │
        ▼
Provider Datastore

Node
        │
        ▼
Provider Node

hasil resolve digunakan untuk menghasilkan:

terraform.tfvars

###ARCHITECTURAL PRINCIPLE###

main.tf

tetap menggunakan template standar.

terraform.tfvars

berisi seluruh nilai deployment yang dihasilkan dari:

Provision Request

dan

Resource Resolution.

###RESOLVE FLOW###

Request menyimpan:

environment_id

provider_id

provider_node_id

catalog_id

tier_id

network_id

datastore_id

Terraform tidak memahami ID.

Backend harus melakukan resolve berdasarkan:

Provider

Node

dan Resource yang dipilih.

###EXAMPLE###

provider_id
        │
        ▼
Proxmox LAB

provider_node_id
        │
        ▼
pve01

tier_id
        │
        ▼
Bronze
        │
        ▼
2 CPU
4 GB RAM
40 GB Disk

network_id
        │
        ▼
Development Network
        │
        ▼
vmbr0

datastore_id
        │
        ▼
Standard Storage
        │
        ▼
local-lvm

catalog_id
        │
        ▼
Ubuntu 22.04
        │
        ▼
ubuntu2204-template

###RESOLVE RESULT###

Backend menghasilkan:

target_node

template

network

storage

cpu

memory

disk_size

yang digunakan untuk membangun:

terraform.tfvars

###ARCHITECTURAL PRINCIPLE###

Request hanya menyimpan:

ID

Terraform hanya menerima:

Resolved Values

Seluruh proses resolve dilakukan oleh Backend sebelum:

terraform init

dan

terraform apply

###APPROVAL FLOW###

Environment menentukan:

approval_required

###APPROVAL BEHAVIOR###

Jika:

approval_required = false

Request langsung masuk ke:

Terraform Queue

###FLOW###

Provision Request
        │
        ▼
Terraform Queue
        │
        ▼
Workspace Generation
        │
        ▼
Terraform Execution

###APPROVAL REQUIRED###

Jika:

approval_required = true

Request masuk ke:

Approval Queue

###FLOW###

Provision Request
        │
        ▼
Approval Queue
        │
        ▼
Approved
        │
        ▼
Terraform Queue
        │
        ▼
Workspace Generation
        │
        ▼
Terraform Execution

###ARCHITECTURAL PRINCIPLE###

Approval Policy berasal dari:

Environment

Provisioning Engine tidak menentukan kebutuhan Approval secara langsung.

Seluruh keputusan Approval mengikuti:

Environment Policy.


###TERRAFORM EXECUTION###

Laravel Job:

ProvisionVmJob

###FLOW###

Create Workspace

Resolve Resources

Load Provider Configuration

Generate provider.tf

Generate terraform.tfvars

Copy main.tf template

Copy variables.tf template

terraform init

terraform validate

terraform plan

terraform apply

###RESOURCE RESOLUTION###

Sebelum Terraform dijalankan,

Backend melakukan resolve terhadap:

Provider

Node

Catalog

Network

Datastore

Tier

menjadi nilai yang dapat dipahami Terraform.

###EXECUTION RESULT###

Jika:

terraform apply

berhasil

maka:

Inventory Update

Deployment Status = Success

Jika:

terraform apply

gagal

maka:

Deployment Status = Failed

Error Message disimpan untuk kebutuhan Audit dan Troubleshooting.

###ARCHITECTURAL PRINCIPLE###

Terraform hanya menerima:

Resolved Values

Terraform tidak pernah menerima:

provider_id

catalog_id

network_id

datastore_id

tier_id

secara langsung.

Seluruh proses resolve dilakukan oleh Backend sebelum Terraform Execution dimulai.

###TERRAFORM STATE MANAGEMENT###

Terraform State tidak disimpan di database.

Terraform State tetap disimpan pada Workspace masing-masing.

###EXAMPLE###

storage/app/provisioning/user01/date_pr19062026_154501/

terraform.tfstate

terraform.tfstate.backup

###STATE OWNERSHIP###

Setiap Provision Request memiliki:

Terraform State sendiri

Terraform State tidak boleh digunakan bersama oleh beberapa Request.

###PURPOSE###

Terraform Native

Mudah Destroy

Mudah Audit

Mudah Debugging

Mudah Recovery

Tidak terjadi konflik antar Deployment

###DESTROY SUPPORT###

Saat VM dihapus,

Backend menggunakan:

terraform.tfstate

yang berada pada Workspace terkait.

Sehingga proses:

terraform destroy

dapat dilakukan pada resource yang benar.

###AUDIT SUPPORT###

Terraform State tetap tersedia untuk:

- Audit
- Troubleshooting
- Deployment Investigation
- Recovery Process

setelah deployment selesai.

###ARCHITECTURAL PRINCIPLE###

Database menyimpan:

Deployment Metadata

Inventory Data

Request Data

Terraform State tidak disimpan pada database.

Terraform State menjadi bagian dari:

Workspace Isolation Architecture

dan tetap berada pada Workspace yang dimiliki oleh Provision Request.

###DEPLOYMENT METADATA###

Tambahkan:

deployment.json

###PURPOSE###

Deployment Metadata digunakan untuk:

- Audit
- Troubleshooting
- Deployment Investigation
- Inventory Reconciliation
- Future Lifecycle Operations

###EXAMPLE###

{
  "request_id": 101,
  "user": "user01",
  "environment": "Development",
  "provider": "Proxmox Cluster 1",
  "node": "pve01",
  "catalog": "Ubuntu 22.04",
  "network": "Development Network",
  "datastore": "Standard Storage",
  "tier": "Bronze",
  "created_at": "2026-06-19 15:45:01"
}

###METADATA SOURCE###

Deployment Metadata berasal dari:

Provision Request

dan

Resource Resolution

yang dilakukan sebelum Terraform Execution.

###ARCHITECTURAL PRINCIPLE###

deployment.json

bukan Source of Truth.

Source of Truth tetap berada pada:

Database

deployment.json

digunakan sebagai metadata lokal pada Workspace untuk kebutuhan:

- Audit
- Debugging
- Recovery
- Investigation

###WORKSPACE RELATION###

Setiap Workspace memiliki:

satu deployment.json

yang merepresentasikan:

satu Provision Request.

###INVENTORY UPDATE###

Jika:

Terraform Success

Status:

Running

Inventory dibuat.

###DATA###

VM Name

Provider

Node

Catalog

Environment

Tier

Network

Datastore

IP Address

Expiry Date

Workspace Path

Terraform State Path

###DATA SOURCE###

Inventory berasal dari:

Provision Request

dan

Terraform Deployment Result.

###NODE TRACKING###

Node disimpan pada Inventory berdasarkan:

Target Node Resolution

yang digunakan saat deployment.

###PURPOSE###

Inventory menjadi Source of Truth untuk:

- Active VM
- VM Lifecycle
- Expiry Management
- Approval Tracking
- Capacity Tracking
- Future VM Migration Tracking

###ARCHITECTURAL PRINCIPLE###

Inventory menyimpan:

Published Resource Name

bukan:

Provider Resource Name

Contoh:

Catalog:

Ubuntu 22.04

bukan:

ubuntu2204-template

Network:

Development Network

bukan:

vmbr0

Datastore:

Standard Storage

bukan:

local-lvm

###WORKSPACE REFERENCE###

Inventory menyimpan:

Workspace Path

Terraform State Path

untuk mendukung:

- Audit
- Debugging
- Destroy Operation
- Recovery Process

###IP ADDRESS DISCOVERY###

Setelah provisioning berhasil,

Backend melakukan:

Provider API Discovery

untuk mendapatkan informasi VM terbaru.

###EXAMPLE###

Proxmox:

GET VM Information

###IP DISCOVERY PRINCIPLE###

IP Address tidak boleh:

- Hardcoded
- Diinput manual
- Disimpan pada Terraform Configuration

IP Address harus diperoleh dari:

Provider

setelah VM berhasil dibuat.

###DISCOVERY FLOW###

Terraform Apply
        │
        ▼
Deployment Success
        │
        ▼
Provider API Discovery
        │
        ▼
Get VM Information
        │
        ▼
Update Inventory

###INVENTORY UPDATE###

Jika IP Address ditemukan:

Inventory diperbarui:

IP Address

Last Sync Time

###RETRY BEHAVIOR###

Jika IP Address belum tersedia:

Backend dapat melakukan:

Retry Discovery

hingga VM selesai melakukan booting dan memperoleh IP Address.

###ARCHITECTURAL PRINCIPLE###

Provider menjadi:

Source of Truth

untuk informasi runtime VM.

Inventory menyimpan hasil discovery.

Inventory tidak menjadi sumber data utama untuk:

IP Address

Host Information

Runtime Status

###PURPOSE###

Menjamin bahwa:

Inventory selalu menampilkan IP Address aktual yang digunakan oleh VM.

###FAILED DEPLOYMENT###

Jika:

terraform apply

gagal.

Status:

Failed

Workspace tetap disimpan.

###PURPOSE###

Debugging

Retry Provisioning

Audit

Troubleshooting

###WORKSPACE BEHAVIOR###

Workspace tidak boleh dihapus secara otomatis.

File yang tetap disimpan:

provider.tf

main.tf

variables.tf

terraform.tfvars

terraform.tfstate

terraform.tfstate.backup

deployment.json

Terraform Log

###INVESTIGATION SUPPORT###

Administrator dapat menggunakan Workspace untuk:

- Melihat konfigurasi deployment
- Melihat Terraform State
- Melihat Terraform Error
- Melakukan Root Cause Analysis

###RETRY SUPPORT###

Provision Request dapat dilakukan ulang setelah:

- Konfigurasi diperbaiki
- Provider kembali normal
- Resource tersedia kembali

###ARCHITECTURAL PRINCIPLE###

Deployment Failure tidak menghapus:

- Workspace
- Terraform State
- Deployment Metadata

seluruh artefak deployment tetap disimpan untuk kebutuhan:

- Audit
- Debugging
- Recovery
- Investigation

###INVENTORY BEHAVIOR###

Jika deployment gagal:

Inventory tidak dibuat.

Deployment Status disimpan sebagai:

Failed

beserta Error Message yang dihasilkan oleh Terraform.

###RETRY PROVISIONING###

Request Action:

Retry Provisioning

Flow:

Reuse Existing Workspace

Tidak membuat Workspace baru.

###RETRY BEHAVIOR###

Provision Request tetap menggunakan:

- Workspace yang sama
- Terraform State yang sama
- Deployment Metadata yang sama

Tujuan:

- Mempermudah Troubleshooting
- Menghindari duplikasi Workspace
- Mempertahankan Audit Trail

###ARCHITECTURAL PRINCIPLE###

Retry Provisioning hanya dapat dilakukan untuk Request dengan status:

Failed

Retry Provisioning tidak membuat Provision Request baru.

###DESTROY FLOW###

Delete VM:

Inventory
    │
    ▼
Delete VM
    │
    ▼
Load Workspace
    │
    ▼
terraform destroy
    │
    ▼
Update Inventory

Status:

Deleted

Workspace:

Tetap disimpan

untuk Audit.

###INVENTORY DATA###

Inventory tetap menyimpan:

VM Name

Provider

Node

Catalog

Environment

Tier

Network

Datastore

Status

Deleted

###PURPOSE###

Audit

Troubleshooting

Deployment History

Recovery Investigation

###ARCHITECTURAL PRINCIPLE###

Destroy Operation menggunakan:

Terraform State

yang berada pada Workspace terkait.

Backend tidak melakukan Delete VM secara langsung ke Provider.

Seluruh proses penghapusan VM wajib melalui:

terraform destroy

###FUTURE MULTI PROVIDER SUPPORT###

Provisioning Engine tidak mengetahui:

- Proxmox
- OpenStack
- OLVM

secara langsung.

Provisioning Engine hanya mengetahui:

Provider ID

###FLOW###

Provider ID
      │
      ▼
Provider Factory
      │
      ▼
Provider Driver
      │
      ▼
Provider Configuration
      │
      ▼
Terraform Renderer

###PROVIDER FACTORY###

Provider Factory bertugas menentukan:

Provider Driver

yang digunakan berdasarkan:

provider_type

###EXAMPLE###

provider_type

=

proxmox

      │
      ▼

ProxmoxProvider

---

provider_type

=

openstack

      │
      ▼

OpenStackProvider

---

provider_type

=

olvm

      │
      ▼

OLVMProvider

###TERRAFORM RENDERING###

Provider Driver menyediakan:

- Provider Configuration
- Authentication Configuration
- Terraform Provider Information

yang digunakan untuk menghasilkan:

provider.tf

dan

terraform.tfvars

###ARCHITECTURAL PRINCIPLE###

Provisioning Engine tidak memiliki logic khusus untuk:

- Proxmox
- OpenStack
- OLVM

seluruh perbedaan Provider diisolasi pada:

Provider Driver

###EXTENSIBILITY###

Ketika menambahkan Provider baru,

yang perlu dibuat hanya:

New Provider Driver

Contoh:

VMwareProvider

NutanixProvider

tanpa perubahan pada:

- Provisioning Engine
- Approval Flow
- Workspace Structure
- Terraform Execution Flow
- Inventory Update

###UI INTEGRATION###

Modul yang menggunakan Provisioning Engine:

Catalog Management

Provision VM

Approval Request

Inventory

Provider Management

Environment Management

Tier Management

Network Management

Datastore Management

###USAGE PURPOSE###

Catalog Management

menyediakan Published Template yang digunakan saat provisioning.

Provider Management

menyediakan Provider dan Node yang digunakan saat deployment.

Network Management

menyediakan Published Network yang digunakan saat provisioning.

Datastore Management

menyediakan Published Datastore yang digunakan saat provisioning.

Tier Management

menyediakan Resource Profile yang digunakan saat provisioning.

Environment Management

menyediakan Approval Policy dan Expiry Policy.

Approval Request

mengontrol proses persetujuan sebelum deployment dijalankan.

Inventory

menyimpan hasil deployment yang berhasil dibuat.

###ARCHITECTURAL PRINCIPLE###

Provisioning Engine adalah:

Orchestration Layer

yang menghubungkan:

Business Layer
      │
      ▼
Provisioning Layer
      │
      ▼
Terraform Layer
      │
      ▼
Infrastructure Layer

###BUSINESS LAYER###

- Environment Management
- Tier Management
- Approval Request

###PROVISIONING LAYER###

- Provision VM
- Resource Resolution
- Workspace Management

###TERRAFORM LAYER###

- Terraform Renderer
- Terraform Execution
- Terraform State Management

###INFRASTRUCTURE LAYER###

- Provider
- Node
- Template
- Network
- Datastore

###ARCHITECTURAL BENEFIT###

Setiap layer memiliki tanggung jawab yang terpisah.

Perubahan pada:

Infrastructure Layer

tidak memerlukan perubahan pada:

Business Layer

dan

Perubahan pada:

Business Layer

tidak memerlukan perubahan pada:

Terraform Layer.

###FINAL END-TO-END FLOW###

Provider Discovery
      │
      ▼
Published Resources
      │
      ├── Catalog
      ├── Network
      └── Datastore
      │
      ▼
Environment Selection
      │
      ▼
Provider Selection
      │
      ▼
Node Selection
      │
      ▼
Resource Filtering
      │
      ▼
Provision Request
      │
      ▼
Approval
      │
      ▼
Workspace Creation
      │
      ▼
Terraform Apply
      │
      ▼
Inventory
      │
      ▼
Lifecycle Management