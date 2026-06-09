ARCHITECTURE-V2

MODULE 13 – NOTIFICATION CENTER ARCHITECTURE

###PURPOSE###

Notification Center berfungsi sebagai pusat penyampaian informasi kepada User mengenai aktivitas penting yang terjadi di dalam aplikasi Web Self-Service.

Notification digunakan untuk:

Awareness

Action Reminder

Workflow Update

Lifecycle Alert

Notification membantu User mengetahui perubahan status tanpa harus membuka setiap modul secara manual.

###DESIGN PRINCIPLE###

Notification merupakan:

Communication Layer

bukan:

Source of Truth

Data utama tetap berasal dari:

Provision Request

Approval Request

Inventory

Lifecycle Engine

Notification hanya berfungsi untuk:

Memberikan Informasi

dan

Mengarahkan User ke modul yang relevan.

###ARCHITECTURE POSITION###

Business Event
│
▼
Notification Engine
│
▼
notifications
│
▼
Notification Center

###HIGH LEVEL FLOW###

Business Event
│
▼
Create Notification
│
▼
Notification Database
│
▼
Notification Center
│
▼
User Action

###INITIAL NOTIFICATION SCOPE###

Versi awal sistem hanya menghasilkan Notification untuk:

Provision Request

Approval Decision

Renewal Request

Permanent Request

Expiry Warning

Notification lain dapat ditambahkan di masa depan tanpa mengubah arsitektur dasar Notification Center.

###ARCHITECTURAL PRINCIPLE###

Business Module menghasilkan:

Event

Notification Engine menghasilkan:

Notification

Notification tidak membuat keputusan bisnis.

Notification hanya menyampaikan informasi yang berasal dari Event yang telah terjadi.
