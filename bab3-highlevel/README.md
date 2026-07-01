# Bab 3 — Versi High-Level (Perancangan)

Folder ini berisi versi HIGH-LEVEL dari diagram dan narasi Bab 3, untuk tahap
perancangan (produk belum dinyatakan jadi). Diagram detail di root repositori
dibiarkan utuh dan dipakai nanti untuk Bab 4 (Implementasi dan Pengujian).

## Aturan penurunan level
- BUANG: angka hasil ukur atau tuning (jumlah worker, batas paralel, jeda detik),
  konfigurasi operasional (port Redis, kebijakan LRU/noeviction/AOF), nama teknis
  implementasi (queue:work, ShouldBroadcast, Laravel Echo).
- PERTAHANKAN: arsitektur berlapis, model UML, prinsip desain, alur konseptual.
- GANTI NADA: dari "melayani/memproses/terukur" menjadi "dirancang untuk/direncanakan".

## Progres
| # | Diagram | File di folder ini | Status |
|---|---|---|---|
| 1 | 3.2 Arsitektur Sistem | flowchart-system-architecture.md | SELESAI |
| 2 | 3.7 Sequence Provisioning | diagram-3-7-sequence-provisioning.md | SELESAI |
| 3 | 3.8 Sequence Approval | diagram-3-8-sequence-approval.md | SELESAI |
| 4 | 3.9 Sequence Terraform | diagram-3-9-sequence-terraform.md | SELESAI |
| - | Narasi high-level | narasi-bab3-highlevel.md | 3.5.1, 3.7, 3.8, 3.9 selesai |

## Tidak diduplikat (sudah level rancangan, dipakai apa adanya untuk Bab 3 dan Bab 4)
3.3 Use Case, 3.4/3.5/3.6/3.13 Activity, 3.10 Class, 3.11 ERD, 3.12 DFD.
