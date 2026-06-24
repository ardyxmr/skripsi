# Gambar 3.3 — Use Case Diagram

Interaksi tiga aktor terhadap sistem portal provisioning VM. Generalisasi
aktor: Admin mewarisi Approver, Approver mewarisi User. Pada implementasi,
aktor User memetakan peran User, Approver memetakan peran Manager (peran yang
berwenang menyetujui), dan Admin memetakan peran Administrator.

```mermaid
graph LR
    User((User))
    Approver((Approver))
    Admin((Admin))
    Approver -.->|generalisasi| User
    Admin -.->|generalisasi| Approver

    subgraph SYS [Sistem Portal Provisioning VM]
        UC_login(["Login"])
        UC_katalog(["Lihat Katalog"])
        UC_request(["Ajukan Provisioning VM"])
        UC_status(["Lihat Status Permintaan"])
        UC_inv(["Kelola Inventaris Miliknya"])
        UC_resize(["Resize CPU / RAM"])
        UC_disk(["Tambah Data Disk"])
        UC_renew(["Perpanjang Masa Berlaku"])
        UC_harden(["Jalankan Hardening / Patch"])
        UC_delete(["Hapus VM"])

        UC_review(["Tinjau Daftar Permintaan"])
        UC_decide(["Setujui / Tolak / Kembalikan Permintaan"])

        UC_users(["Kelola Pengguna, Peran, Grup"])
        UC_provider(["Kelola Provider & Jalankan Discovery"])
        UC_publish(["Kelola Katalog, Jaringan, Datastore, Node"])
        UC_envtier(["Kelola Environment & Tier"])
        UC_audit(["Pantau Audit Log"])
    end

    User --- UC_login
    User --- UC_katalog
    User --- UC_request
    User --- UC_status
    User --- UC_inv
    UC_inv -.->|include| UC_resize
    UC_inv -.->|include| UC_disk
    UC_inv -.->|include| UC_renew
    UC_inv -.->|include| UC_harden
    UC_inv -.->|include| UC_delete
    UC_request -.->|include| UC_login

    Approver --- UC_review
    Approver --- UC_decide
    UC_decide -.->|include| UC_review

    Admin --- UC_users
    Admin --- UC_provider
    Admin --- UC_publish
    Admin --- UC_envtier
    Admin --- UC_audit
```
