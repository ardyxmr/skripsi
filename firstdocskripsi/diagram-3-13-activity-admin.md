# Gambar 3.13 — Activity Diagram: Penyiapan dan Tata Kelola oleh Administrator

Dua swimlane: Administrator dan Sistem. Diagram menggambarkan urutan penyiapan
platform oleh administrator, dari pendaftaran provider, discovery, publikasi
sumber daya, penetapan tier, hingga penyusunan kebijakan environment, serta
pemantauan audit log. Aktivitas ini melengkapi Gambar 3.12 dengan menampilkan
sisi prosedural pembentukan lapisan abstraksi dan kebijakan.

```mermaid
flowchart TB
    subgraph AD [Administrator]
        S1([Mulai])
        A1[Daftarkan provider: endpoint dan kredensial]
        A2[Uji koneksi]
        A3[Jalankan discovery]
        A4[Tinjau sumber daya hasil discovery]
        A5[Publikasikan node, katalog, jaringan, dan datastore]
        A6[Tetapkan tier: CPU, RAM, penyimpanan]
        A7[Susun environment: allow-list, expiry, grace, approval, kuota disk]
        A8[Pantau audit log]
        E1([Selesai])
    end

    subgraph SY [Sistem]
        C1{Koneksi berhasil?}
        D1[Driver hanya-baca mencerminkan sumber daya ke tabel provider_*]
        P1[Simpan alias terpublikasi dengan status Active]
        R1[Simpan environment dan tiga tabel aturan]
        ENR[Environment siap dipakai pada wizard provisioning]
    end

    S1 --> A1 --> A2 --> C1
    C1 -- tidak --> A1
    C1 -- ya --> A3
    A3 --> D1 --> A4 --> A5 --> P1 --> A6 --> A7 --> R1 --> ENR
    ENR --> A8 --> E1
```
