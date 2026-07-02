# Poin-Poin Slide — Sidang Proposal

Judul: **Rancang Bangun ProvIO: Aplikasi Web Self-Service Provisioning Mesin Virtual Berbasis Infrastructure as Code pada Proxmox Virtual Environment**

Cara pakai: tiap "## Slide" = satu slide. Tempel judul + bullet ke PPT. Baris *(Catatan pembicara)* tidak usah ditempel, itu bahan ngomongmu. Target: 16 slide, durasi ~12–15 menit.

---

## Slide 1 — Cover
- Judul lengkap penelitian
- Nama dan NIM
- Dosen Pembimbing
- Program Studi / Fakultas / Universitas / Tahun

---

## Slide 2 — Latar Belakang
- Virtualisasi menghemat sumber daya, tetapi provisioning mesin virtual di banyak organisasi masih manual
- Proses manual lambat, berulang, dan rawan kesalahan konfigurasi (human error), terutama saat jumlah VM banyak
- Infrastructure as Code (Terraform + Ansible) menjawab masalah itu, tetapi penggunaannya kompleks: sintaks, CLI, state Terraform, inventori Ansible, parameter Proxmox
- Akibatnya IaC dikuasai admin; pengguna non-pakar tetap bergantung pada admin
- Tata kelola dan keamanan sering terabaikan: tanpa kontrol akses, persetujuan, dan audit, pemakaian sumber daya sulit dikendalikan

*(Catatan pembicara: tekankan dua sisi masalah: kompleksitas teknis IaC + lemahnya tata kelola.)*

---

## Slide 3 — Research Gap
- Penelitian terdahulu fokus pada potongan terpisah: konfigurasi server, jaringan virtual, atau hardening
- Belum ada yang menyatukan self-service request, approval workflow, RBAC, audit trail, provisioning Terraform, dan hardening Ansible dalam satu aplikasi web
- Solusi sejenis yang lengkap umumnya enterprise, proprietary, dan mahal
- Belum banyak solusi sumber terbuka yang menggabungkan semuanya dalam satu platform
- **Kesimpulan: ada celah untuk membangun platform web self-service open-source yang terintegrasi**

---

## Slide 4 — Rumusan Masalah
1. Bagaimana merancang aplikasi web self-service yang mengabstraksikan kompleksitas IaC (Terraform & Ansible) menjadi proses penyediaan VM yang mudah bagi pengguna non-pakar di Proxmox VE?
2. Bagaimana menerapkan tata kelola infrastruktur (RBAC, approval workflow, pengelolaan siklus hidup VM, audit trail) agar penyediaan layanan aman, terkontrol, dan dapat diaudit?
3. Sejauh mana aplikasi meningkatkan efisiensi operasional, menjaga konsistensi konfigurasi, dan mengurangi human error dibanding proses manual?
4. Bagaimana tingkat kebergunaan (usability) aplikasi bagi pengguna?

---

## Slide 5 — Batasan Masalah
- Platform virtualisasi: Proxmox VE versi 9.1
- Provisioning dengan Terraform; konfigurasi dan hardening dengan Ansible
- Tiga hak akses (RBAC): User (Requestor), Approver (Manager), Admin
- Ruang lingkup: request, approval, provisioning, inventarisasi, siklus hidup (perpanjangan, resize, hapus), hardening otomatis
- Mendukung lebih dari satu cluster Proxmox
- Di luar lingkup: hypervisor lain (OpenStack/oVirt/VMware), multi-tenancy penuh, backup, disaster recovery, migrasi, analisis biaya

---

## Slide 6 — Tujuan Penelitian
- **Umum:** merancang dan mengembangkan aplikasi web self-service untuk orkestrasi dan otomatisasi provisioning VM berbasis sumber terbuka, yang aman, ter-tata-kelola, dan mudah dipakai pengguna non-pakar
- **Khusus:**
  1. Membangun abstraksi IaC menjadi antarmuka web yang mudah dipakai
  2. Menerapkan tata kelola (RBAC, approval, siklus hidup, audit trail)
  3. Mengevaluasi efisiensi, konsistensi, dan pengurangan human error
  4. Mengevaluasi tingkat kebergunaan (usability)

---

## Slide 7 — Manfaat Penelitian
- **Teoritis:** kontribusi pada penerapan IaC, abstraksi layanan infrastruktur, dan penerapan DSRM dalam pengembangan artefak TI
- **Praktis:**
  - Organisasi: layanan VM lebih cepat, terstandarisasi, terkontrol
  - Administrator: provisioning, konfigurasi, dan hardening otomatis
  - Pengguna: ajukan dan kelola VM secara mandiri tanpa paham teknis
  - Peneliti selanjutnya: referensi pengembangan platform self-service

---

## Slide 8 — Penelitian Terdahulu
| Peneliti | Fokus | Perbedaan |
|---|---|---|
| Hariyadi & Marzuki (2020) | Ansible untuk konfigurasi VPS | Belum ada portal self-service |
| Khumaidi (2021) | Ansible untuk otomatisasi server | Tanpa provisioning VM mandiri & approval |
| Marzuki dkk. (2023) | Otomatisasi jaringan virtual di Proxmox | Fokus jaringan, bukan provisioning VM |
| Padur (2021) | Konsep Terraform + Ansible (IaC) | Konseptual, tanpa aplikasi web |
| Nelmiawati dkk. (2025) | Provisioning + hardening (Terraform+Ansible) | Berbasis skrip, tanpa portal & approval |
| Nabila & Indrawati (2025) | Perbandingan Terraform vs Ansible | Analisis teknologi, bukan sistem aplikasi |

*(Catatan pembicara: arahkan ke gap di Slide 3 — tidak ada yang mengintegrasikan semuanya.)*

---

## Slide 9 — Landasan Teori (konsep kunci)
- Infrastructure as Code (IaC): kelola infrastruktur lewat kode, konsisten dan berulang
- Terraform: provisioning deklaratif
- Ansible: konfigurasi dan hardening (agentless, via SSH)
- Proxmox VE: platform virtualisasi sumber terbuka + API
- RBAC, Approval Workflow, Audit Trail: tata kelola layanan
- Server Hardening: penguatan keamanan sistem
- System Usability Scale (SUS): pengukuran kebergunaan
- DSRM: metode penelitian (pengembangan artefak)

---

## Slide 10 — Perbandingan Perangkat Sejenis
- Ansible CLI dan Terraform CLI: kuat untuk otomatisasi, tetapi berbasis command line dan butuh keahlian teknis
- Fitur yang **hanya** dimiliki sistem yang dikembangkan:
  - Antarmuka berbasis web dan self-service provisioning
  - Manajemen pengguna berbasis peran (RBAC) dan approval workflow
  - Integrasi Terraform + Ansible dalam satu alur
  - Inventory VM, monitoring status, dan pengelolaan masa aktif

---

## Slide 11 — Hipotesis Penelitian
Membandingkan **aplikasi yang dikembangkan** dengan **antarmuka Proxmox VE bawaan** pada tiga aspek.

- **Hipotesis 1 — Efisiensi Provisioning**
  - H0: Tidak terdapat perbedaan efisiensi yang signifikan antara aplikasi dan Proxmox VE bawaan
  - H1: Terdapat perbedaan efisiensi yang signifikan antara aplikasi dan Proxmox VE bawaan
- **Hipotesis 2 — Konsistensi Konfigurasi**
  - H0: Tidak terdapat perbedaan konsistensi konfigurasi yang signifikan
  - H1: Terdapat perbedaan konsistensi konfigurasi yang signifikan
- **Hipotesis 3 — Kebergunaan**
  - H0: Tidak terdapat perbedaan kebergunaan yang signifikan
  - H1: Terdapat perbedaan kebergunaan yang signifikan berdasarkan skor SUS

*(Catatan pembicara: H0 = tidak ada beda, H1 = ada beda. Diuji dengan membandingkan hasil pengukuran aplikasi vs Proxmox bawaan.)*

---

## Slide 12 — Metode Penelitian (DSRM)
Enam tahapan:
1. Identifikasi Masalah dan Motivasi
2. Penetapan Tujuan Solusi
3. Perancangan dan Pengembangan Artefak
4. Demonstrasi
5. Evaluasi
6. Komunikasi

- Pengumpulan data: observasi, wawancara, studi literatur

*(Catatan pembicara: tampilkan sebagai diagram alur 6 kotak kalau ada gambar DSRM.)*

---

## Slide 13 — Alat dan Bahan
- **Frontend:** React.js
- **Backend / API:** Laravel
- **Basis data:** PostgreSQL
- **Cache & antrean job:** Redis
- **Real-time status:** Laravel Reverb (WebSocket)
- **Provisioning:** Terraform
- **Konfigurasi & hardening:** Ansible
- **Virtualisasi:** Proxmox VE
- **Pendukung:** VS Code, Git/GitHub, Web Browser

---

## Slide 14 — Arsitektur Sistem
*(Tempel Gambar 3.1 Arsitektur Sistem di sini)*
- Pengguna mengakses portal web (React.js)
- Backend Laravel menangani autentikasi, otorisasi, approval workflow, inventaris, dan integrasi Terraform/Ansible
- Data tersimpan di PostgreSQL; Redis untuk cache dan antrean; Reverb untuk status real-time
- Terraform memanggil API Proxmox VE untuk membuat VM
- Setelah VM jadi, Ansible menjalankan konfigurasi dan hardening

---

## Slide 15 — Perancangan Sistem (UML & Basis Data)
*(Tempel diagram yang sesuai di tiap poin)*
- Use Case Diagram: tiga aktor (User, Approver, Administrator)
- Activity Diagram: provisioning, approval, pengelolaan inventaris
- Sequence Diagram: provisioning, approval, Terraform–Proxmox VE
- Class Diagram dan Entity Relationship Diagram (ERD)
- Lapisan Abstraksi dan Kebijakan: discovery → publikasi katalog → environment, tier, approval

---

## Slide 16 — Rancangan Pengujian (Evaluasi)
- **Pengujian fungsional:** black box pada seluruh fitur (request, approval, provisioning, hardening, inventaris)
- **Efisiensi (Hipotesis 1):** bandingkan waktu dan jumlah langkah aplikasi vs Proxmox manual untuk beberapa jumlah VM; uji beda Mann-Whitney/Wilcoxon
- **Konsistensi (Hipotesis 2):** bandingkan keseragaman konfigurasi VM hasil aplikasi vs manual
- **Kebergunaan (Hipotesis 3):** kuesioner SUS, responden mencoba aplikasi dan Proxmox bawaan, bandingkan skor (ambang 68)
- **Keamanan:** analisis terhadap mekanisme pengelolaan dan hardening

---

## Slide 17 — Jadwal Penelitian
- Maret – Juni
  1. Studi literatur dan analisis kebutuhan
  2. Perancangan sistem dan pengembangan aplikasi web
  3. Implementasi Terraform, Ansible, dan integrasi Proxmox
  4. Pengujian sistem, evaluasi, dan analisis hasil
  5. Penyusunan laporan dan revisi

---

## Slide 18 — Penutup
- Ringkasan: platform web self-service yang menyatukan abstraksi IaC, tata kelola, dan otomatisasi keamanan
- Kontribusi: menyederhanakan provisioning VM untuk pengguna non-pakar sekaligus menjaga tata kelola dan keamanan
- Terima kasih
