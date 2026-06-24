# Gambar 3.8 — Sequence Diagram: Approval Request

Urutan keputusan persetujuan oleh Approver (Manager/Admin). Aksi Kembalikan
(Revert) dibatasi pada permintaan jenis PROVISION; permintaan siklus hidup
(Resize/AddDisk/Renew/Harden/Destroy) hanya menerima Setujui atau Tolak.

```mermaid
sequenceDiagram
    actor AP as Approver
    participant FE as Frontend SPA
    participant API as API Laravel
    participant SVC as ApprovalWorkflowService
    participant DB as Database
    participant Q as Redis Queue
    participant RV as Reverb WebSocket

    AP->>FE: Buka halaman Approval Requests
    FE->>API: GET /approvals
    API->>DB: Ambil daftar Pending (scoped per peran)
    DB-->>API: Daftar permintaan
    API-->>FE: Render daftar

    AP->>FE: Pilih permintaan, klik Setujui / Tolak / Kembalikan
    FE->>API: POST /approvals/{id}/{action} (alasan jika perlu)
    API->>SVC: act(action, alasan)

    alt action = Setujui
        SVC->>DB: ApprovalRequest status=Approved
        alt request_type = PROVISION
            loop tiap instance i = 1..N
                SVC->>Q: dispatch ProvisionVmJob
            end
        else request_type = RESIZE / ADD_DISK / RENEW / HARDEN / DESTROY
            SVC->>Q: dispatch job siklus hidup yang sesuai
        end
    else action = Tolak
        SVC->>DB: ApprovalRequest status=Rejected + alasan
    else action = Kembalikan (PROVISION saja)
        SVC->>DB: ApprovalRequest status=Reverted
        Note over SVC, DB: ProvisionRequest kembali jadi draft, siap diedit ulang
    end

    SVC->>DB: Tulis AuditLog
    SVC->>RV: broadcast ApprovalChanged
    SVC-->>API: Hasil keputusan
    API-->>FE: 200 OK
    RV-->>FE: Push update real-time ke semua klien terkait
```
