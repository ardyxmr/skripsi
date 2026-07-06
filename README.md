# skripsi — Pemetaan Diagram ke Bab III

Tiga berkas flowchart di root repo, beserta status UML dan penempatannya di tesis.

## File 1 — flowchart-system-architecture.md
- Isi: Diagram Arsitektur Sistem (React SPA → nginx → Laravel → Redis/PostgreSQL → Proxmox).
- Status UML: BUKAN UML.
- Penempatan: §3.5.1 Arsitektur Sistem, Gambar 3.2. Jangan dimasukkan ke §3.5.2.

## File 2 — flowchart-provider-discovery.md
- Isi: Diagram Aliran Data lapisan abstraksi (Proxmox mentah → provider_* → publikasi alias → environment → wizard).
- Status UML: BUKAN UML.
- Penempatan: §3.5.4 Lapisan Abstraksi dan Kebijakan, Gambar 3.12.

## File 3 — flowchart-provisioning-approval-sequence.md
- Isi: Sequence Diagram ringkas provisioning + approval.
- Status UML: IYA (Sequence).
- Penempatan: DIGANTIKAN untuk §3.5.2 oleh tiga sequence diagram terpisah
  diagram-3-7/3-8/3-9 (Gambar 3.7/3.8/3.9). Berkas ini disimpan sebagai cadangan /
  ikhtisar tingkat tinggi; jangan dobel-hitung di §3.5.2.

## Daftar Gambar Bab III (final)
- Gambar 3.2  Arsitektur Sistem              → flowchart-system-architecture.md (§3.5.1)
- Gambar 3.3  Use Case Diagram               → diagram-3-3-use-case.md (§3.5.2)
- Gambar 3.4  Activity Provisioning          → diagram-3-4-activity-provisioning.md (§3.5.2)
- Gambar 3.5  Activity Approval              → diagram-3-5-activity-approval.md (§3.5.2)
- Gambar 3.6  Activity Inventory             → diagram-3-6-activity-inventory.md (§3.5.2)
- Gambar 3.7  Sequence Provisioning          → diagram-3-7-sequence-provisioning.md (§3.5.2)
- Gambar 3.8  Sequence Approval              → diagram-3-8-sequence-approval.md (§3.5.2)
- Gambar 3.9  Sequence Terraform–Proxmox     → diagram-3-9-sequence-terraform-proxmox.md (§3.5.2)
- Gambar 3.10 Class Diagram                  → diagram-3-10-class.md (§3.5.2)
- Gambar 3.11 ERD                            → Database-relation.md (§3.5.3)
- Gambar 3.12 Aliran Data Lapisan Abstraksi  → flowchart-provider-discovery.md (§3.5.4)
- Gambar 3.13 Penyiapan dan Tata Kelola oleh Administrator → diagram-3-13-activity-admin.md (§3.5.4)
```
