# Gambar 3.8 — Sequence Diagram: Approval Request (versi high-level)

Urutan keputusan persetujuan oleh Approver (Manajer atau Administrator). Aksi
Kembalikan dibatasi pada permintaan pembuatan mesin virtual baru, sedangkan
permintaan terhadap mesin virtual aktif hanya menerima Setujui atau Tolak. Pada
persetujuan, sistem menjalankan permintaan: pembuatan dan perubahan mesin virtual
dijalankan sebagai pekerjaan asinkron, sedangkan perpanjangan dan penetapan permanen
diterapkan sebagai pembaruan data tanpa pekerjaan.

```mermaid
sequenceDiagram
    actor AP as Approver
    participant FE as Frontend SPA
    participant API as API Laravel
    participant DB as Basis Data
    participant Q as Antrian pekerjaan
    participant RV as Reverb

    AP->>FE: Buka halaman Approval Requests
    FE->>API: GET /approvals
    API->>DB: Ambil daftar menunggu (disaring per peran)
    DB-->>API: Daftar permintaan
    API-->>FE: Tampilkan daftar

    AP->>FE: Pilih permintaan, klik Setujui / Tolak / Kembalikan
    FE->>API: POST /approvals (aksi + alasan)
    API->>DB: Catat keputusan + audit
    API->>RV: siarkan event ApprovalChanged
    RV-->>FE: Push pembaruan real-time

    alt Setujui
        alt permintaan pembuatan mesin virtual
            loop satu job per instance
                API->>Q: kirim job provisioning
            end
        else permintaan perubahan mesin virtual (Edit Resources / Harden / Hapus)
            API->>Q: kirim job siklus hidup
        else perpanjangan / penetapan permanen
            API->>DB: perbarui masa berlaku (tanpa job)
        end
    else Tolak atau Kembalikan
        Note over API,DB: Tidak ada pekerjaan dijalankan. Kembalikan mengembalikan permintaan menjadi draf untuk diedit ulang
    end
    API-->>FE: Respons berhasil
```
