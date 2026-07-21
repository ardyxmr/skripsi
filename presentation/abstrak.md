# Abstrak — Draf untuk Ditempel ke Word

⚠️ **Nama sistem.** Draf ini memakai **ExoVirt**. Kalau judul yang terdaftar di prodi masih **ProvIO** dan rebrand belum di-ACC pembimbing, ganti semua "ExoVirt" menjadi nama yang resmi terdaftar sebelum menempel. Abstrak dan judul harus sama persis.

---

## ABSTRAK (Bahasa Indonesia)

Penyediaan mesin virtual di banyak organisasi masih dikerjakan manual melalui antarmuka hypervisor, sehingga lambat, berulang, dan rawan salah konfigurasi, sedangkan *Infrastructure as Code* yang menjawabnya menuntut penguasaan teknis sehingga berhenti di tangan administrator dan menyisihkan pengguna non-pakar, serta tata kelola berupa kontrol akses, persetujuan, dan jejak audit kerap terabaikan. Penelitian terdahulu menggarap potongan terpisah, dan belum ada platform web sumber terbuka yang menyatukan layanan mandiri, alur persetujuan, kontrol akses berbasis peran, jejak audit, *provisioning* Terraform, serta *hardening* Ansible dalam satu sistem pada Proxmox VE. Penelitian ini merancang dan membangun ExoVirt dengan metodologi *Design Science Research*, lalu mengujinya melalui pengujian *black box*, efisiensi, konsistensi konfigurasi, kesalahan manusia, dan kebergunaan. Hasil pengujian menunjukkan jumlah langkah turun dari 23 menjadi 10 atau 56,52 %, waktu *provisioning* turun 27,83 % dengan uji Mann-Whitney U = 0 dan p = 1,08 × 10⁻⁵, konsistensi konfigurasi mencapai 100 % tanpa *configuration drift*, tanpa satu pun kesalahan konfigurasi, keberhasilan fungsional 40 skenario mencapai 100 %, serta skor *System Usability Scale* 92,19 berbanding 37,81 yang dikuatkan *paired sample t-test* dan uji Wilcoxon *signed-rank*, sehingga lima dari enam indikator keberhasilan tercapai. Penelitian ini menyimpulkan bahwa antarmuka layanan mandiri yang mengabstraksikan *Infrastructure as Code* memindahkan penyediaan mesin virtual dari kewenangan administrator ke tangan pengguna non-pakar tanpa mengorbankan tata kelola. Penelitian selanjutnya disarankan menambahkan pengelolaan disk mandiri, integrasi SSO dan MFA, serta dukungan multi-*hypervisor*.

**Kata kunci:** *provisioning* mandiri; *Infrastructure as Code*; Proxmox VE; tata kelola infrastruktur; *System Usability Scale*

---

## ABSTRACT (English)

*In many organizations, virtual machine provisioning is still performed manually through the hypervisor interface, which is slow, repetitive, and prone to misconfiguration, while Infrastructure as Code that addresses this problem demands technical mastery that keeps it in the hands of administrators and excludes non-expert users, and governance such as access control, approval, and audit trail is often neglected. Prior studies addressed only separate parts, and no open-source web platform unites self-service, approval workflow, role-based access control, audit trail, Terraform provisioning, and Ansible hardening in a single system on Proxmox VE. This study designed and built ExoVirt using the Design Science Research methodology, then evaluated it through black box, efficiency, configuration consistency, human error, and usability testing. The results show that the number of steps dropped from 23 to 10 or 56.52%, provisioning time dropped by 27.83% with a Mann-Whitney test of U = 0 and p = 1.08 × 10⁻⁵, configuration consistency reached 100% without configuration drift, no configuration errors occurred, functional success across 40 scenarios reached 100%, and the System Usability Scale score was 92.19 against 37.81, confirmed by a paired sample t-test and a Wilcoxon signed-rank test, so that five of six success indicators were achieved. This study concludes that a self-service interface abstracting Infrastructure as Code shifts virtual machine provisioning from administrator authority to non-expert users without sacrificing governance. Future work is advised to add self-service disk management, SSO and MFA integration, and multi-hypervisor support.*

**Keywords:** *self-service provisioning; Infrastructure as Code; Proxmox VE; infrastructure governance; System Usability Scale*

---

# BEST PRACTICE ABSTRAK (acuan, bukan untuk ditempel)

## Struktur enam unsur, satu paragraf
Abstrak yang kuat memuat enam unsur berurutan, masing-masing sekitar satu kalimat, dalam satu paragraf padat:

| Urutan | Unsur | Isi |
|---:|---|---|
| 1 | Latar belakang dan masalah | Kondisi yang bermasalah, diringkas tajam |
| 2 | Gap dan kebaruan | Yang belum dikerjakan penelitian lain, lalu posisi karyamu |
| 3 | Metode | Metodologi, alat, dan jenis pengujian |
| 4 | Hasil | Angka, bukan kata sifat |
| 5 | Kesimpulan | Jawaban atas masalah |
| 6 | Saran | Arah penelitian lanjutan |

## Aturan yang lazim dipakai penguji
- **Panjang 150 sampai 250 kata**, satu paragraf. Sebagian kampus mengizinkan dua paragraf, cek pedoman prodimu
- **Angka mengalahkan kata sifat.** Tulis "turun 56,52 %", bukan "turun secara signifikan" tanpa angka
- **Tanpa sitasi, tanpa tabel, tanpa gambar, tanpa singkatan yang belum dijelaskan**
- **Kata kunci 3 sampai 5**, dipisah titik koma, urut menurut kepentingan atau abjad
- **Dua bahasa.** Versi Inggris biasanya dicetak miring seluruhnya
- **Tulis paling akhir**, setelah semua bab final, karena abstrak mengutip angka final. Bab IV dan V-mu sudah final, jadi waktunya tepat
- **Kata kerja lampau** untuk yang sudah kamu kerjakan dan temukan

## Yang perlu dihindari
- Kalimat pembuka berbunga tentang pentingnya teknologi secara umum. Langsung ke masalah
- Mengulang judul kata per kata
- Klaim tanpa angka pendukung
- Menyebut nama bab atau nomor subbab
