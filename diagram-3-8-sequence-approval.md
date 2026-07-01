# Gambar 3.8 — Sequence Diagram: Approval Request

Urutan keputusan persetujuan oleh Approver (Manager/Admin). Aksi Kembalikan
(Revert) dibatasi pada permintaan jenis PROVISION; permintaan siklus hidup
(Edit Resources/Renew/Harden/Destroy) hanya menerima Setujui atau Tolak. Pada
persetujuan, Edit Resources, Harden, dan Destroy mengirim job, sedangkan Renew
dan Permanent diterapkan sinkron tanpa job. Layanan *ApprovalWorkflowService*
hanya mencatat keputusan dan menulis audit; pengiriman job dilakukan oleh
controller setelah keputusan tercatat, dan notifikasi *ApprovalChanged*
dipancarkan oleh observer saat status berubah.

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
    SVC->>DB: Update ApprovalRequest (status per aksi) + approver + alasan
    SVC->>DB: Tulis AuditLog
    SVC-->>API: Kembalikan keputusan (action, request_type)
    Note over DB,RV: ApprovalObserver mengamati perubahan status lalu memancarkan ApprovalChanged
    DB->>RV: broadcast ApprovalChanged (via Observer)
    RV-->>FE: Push update real-time ke semua klien terkait

    alt action = Setujui
        alt request_type = PROVISION
            loop tiap instance i = 1..N
                API->>Q: dispatch ProvisionVmJob (via ProvisionRequestService::dispatchProvisioning)
            end
        else request_type = EDIT_RESOURCES / HARDEN / DESTROY
            API->>Q: dispatch job siklus hidup (via LifecycleService::applyApproved)
        else request_type = RENEW / PERMANENT
            API->>DB: perbarui expiry_date / is_permanent (sinkron, via LifecycleService)
        end
    else action = Tolak atau Kembalikan
        Note over API,DB: Tidak ada dispatch. Kembalikan hanya untuk PROVISION lalu ProvisionRequest jadi draft, siap diedit ulang
    end
    API-->>FE: 200 OK
```
