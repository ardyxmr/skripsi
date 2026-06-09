ARCHITECTURE-V2

MODULE 10 – USER, ROLE & GROUP POLICY ARCHITECTURE

PURPOSE

User, Role & Group Management berfungsi sebagai Identity and Access Management (IAM) Layer yang mengatur:

Authentication

Authorization

Approval Ownership

Resource Visibility

Governance

DESIGN PRINCIPLE

Role menentukan:

APA yang boleh dilakukan

Group menentukan:

SIAPA yang dikelola

User menentukan:

SIAPA yang melakukan aktivitas

ARCHITECTURE POSITION

User
│
▼
Role
│
▼
Permission
│
▼
System Access

dan

User
│
▼
Group
│
▼
Manager
│
▼
Approval Ownership

HIGH LEVEL FLOW

User Login
│
▼
Authentication
│
▼
Role Validation
│
▼
Group Validation
│
▼
System Access

DATABASE DESIGN

users

users

Field	Type

id	bigint

name	varchar

email	varchar

password	varchar

role_id	bigint

group_id	bigint

status	varchar

created_at	timestamp

updated_at	timestamp

roles

roles

Field	Type

id	bigint

role_name	varchar

description	text

created_at	timestamp

groups

groups

Field	Type

id	bigint

group_name	varchar

room_floor	varchar

description	text

manager_user_id	bigint NULL

created_at	timestamp

DEFAULT ROLES

Saat instalasi awal:

Administrator

Manager

User

SYSTEM BOOTSTRAP POLICY

Saat instalasi pertama sistem wajib membuat data awal (Seed Data) untuk menghindari circular dependency antara User dan Group.

Bootstrap Data:

Role:

Administrator

Manager

User

Group:

System Administrators

User:

admin

Relationship:

User:
admin

Role:
Administrator

Group:
System Administrators

Manager:
admin

Tujuan:

Menghindari deadlock saat implementasi pertama.

Administrator pertama digunakan untuk membuat User, Group, dan Manager berikutnya.

ROLE DEFINITIONS

Administrator

Akses penuh.

Dapat:

Provider Management

Catalog Management

Network Management

Datastore Management

Environment Management

Tier Management

User Management

Approval

Inventory

Provision VM

Dapat approve:

Semua Group

Tidak memerlukan approval untuk:

Renew VM

Permanent VM

Delete VM

Manager

Manager Group.

Dapat:

Catalog

Provision VM

Inventory

Approval Request

Approval Scope:

Group yang dipimpin

Dapat:

Approve Provision

Approve Renewal

Approve Permanent Request

User

Dapat:

Catalog

Provision VM

Inventory

Tidak dapat:

Provider Management

Settings

Approval Management

MENU VISIBILITY POLICY

Administrator

Catalog

* Provision VM

Approval Request

Inventory

Settings

Manager

Catalog

* Provision VM

Approval Request

Inventory

User

Catalog

* Provision VM

Inventory

Approval menu tidak muncul.

GROUP POLICY

Group digunakan untuk:

Ownership

Approval Routing

Inventory Scope

Contoh:

Group:

Infrastructure

Manager:

Andi

Member:

Budi

Joko

Rina

Approval otomatis:

Budi
│
▼
Andi

Joko
│
▼
Andi

Rina
│
▼
Andi

GROUP CREATION POLICY

Manager bersifat Optional saat Group dibuat.

Field:

groups.manager_user_id

dapat bernilai:

NULL

Tujuan:

Menghindari deadlock saat Group dibuat sebelum Manager tersedia.

Contoh:

Create Group
→ Manager belum dipilih
→ Group tetap dapat disimpan

Manager dapat ditentukan kemudian melalui Edit Group.

GROUP ACTIVATION POLICY

Group dianggap Fully Configured apabila:

* Memiliki Manager
* Memiliki minimal 1 User

Group tanpa Manager tetap dapat digunakan untuk assignment User.

Namun tidak dapat digunakan sebagai Approval Ownership.

RESOURCE VISIBILITY POLICY

User

Inventory:

Melihat VM miliknya sendiri

Approval:

Tidak dapat melihat request user lain

Manager

Inventory:

Melihat seluruh VM dalam Group

Approval:

Melihat seluruh request dalam Group

Administrator

Inventory:

Melihat seluruh VM

Approval:

Melihat seluruh request

APPROVAL OWNERSHIP POLICY

Group wajib memiliki:

Manager

Field:

groups.manager_user_id

Saat request dibuat:

User
│
▼
Group
│
▼
Manager
│
▼
Approver

Tidak ada pemilihan approver manual.

APPROVAL VALIDATION POLICY

Sebelum request dikirim:

System wajib memvalidasi:

* User memiliki Group
* Group memiliki Manager

Jika Group belum memiliki Manager:

Tolak Request.

Tampilkan pesan:

Group belum memiliki Manager.

Silakan tetapkan Manager terlebih dahulu sebelum membuat request yang memerlukan approval.

MANAGER ASSIGNMENT POLICY

Manager harus berasal dari:

users.id

Manager direferensikan melalui:

groups.manager_user_id

Manager dapat ditentukan:

* Saat Create Group
* Saat Edit Group

Manager tidak wajib tersedia saat Group pertama kali dibuat.

DELETE POLICY

Delete User

Diperbolehkan.

Popup:

Apakah Anda yakin ingin menghapus User ini?

Delete

Cancel

Delete User Manager

Jika User masih digunakan sebagai:

groups.manager_user_id

Maka penghapusan ditolak.

Tampilkan pesan:

User masih digunakan sebagai Manager Group.

Pindahkan Manager Group terlebih dahulu sebelum menghapus User.

Delete Role

Validasi:

Jumlah User = 0

Jika masih digunakan:

Role ini masih digunakan oleh user.

Pindahkan user ke role lain atau hapus user terlebih dahulu.

Delete Group

Validasi:

Jumlah User = 0

Jika masih digunakan:

Group ini masih digunakan oleh user.

Pindahkan user ke group lain atau hapus user terlebih dahulu.

USER STATUS

Possible values:

Active

Inactive

Inactive User:

Tidak dapat login

PASSWORD MANAGEMENT

User Menu:

Profile

Reset Password

Logout

Reset Password Popup:

Old Password

New Password

Verify New Password

Reset

Cancel

AUDIT POLICY

Semua aktivitas penting dicatat.

Future table:

audit_logs

Contoh:

Create Provider

Delete Provider

Approve VM

Reject VM

Delete VM

Renew VM

Permanent Request

USER MANAGEMENT WIDGETS

Widget:

Total Users

Active Users

Roles

Groups

ROLE MANAGEMENT WIDGETS

Widget:

Total Roles

Assigned Roles

Unused Roles

Most Used Role

GROUP MANAGEMENT WIDGETS

Widget:

Total Groups

Groups With Manager

Groups Without Manager

Most Active Group

FUTURE SSO INTEGRATION

Arsitektur harus siap untuk:

LDAP

Active Directory

Azure AD

Google Workspace

Tambahan field:

auth_provider

Value:

local

ldap

ad

azure

Implementasi saat ini:

local

saja.

ARCHITECTURAL PRINCIPLE

User Layer:

WHO

Role Layer:

WHAT

Group Layer:

WHICH SCOPE

Approval Layer:

WHO APPROVES

FINAL GOVERNANCE MODEL

User
│
▼
Role
│
▼
Permission
│
▼
System Access

User
│
▼
Group
│
▼
Manager
│
▼
Approval Ownership

User
│
▼
Inventory Scope

User
│
▼
Provision Scope
