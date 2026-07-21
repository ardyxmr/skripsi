# Daftar Kode Program — Draf untuk Ditempel ke Word

Format front matter: nomor, judul, titik-titik penuntun, nomor halaman. Letakkan setelah Daftar Gambar/Tabel, sebelum Daftar Lampiran.

---

## DAFTAR KODE PROGRAM

| Kode | Judul | Hal. |
|---|---|---|
| Kode 4.1 | Pemecahan satu permintaan menjadi satu pekerjaan per mesin virtual | ... |
| Kode 4.2 | Definisi mesin virtual pada `main.tf` yang tetap antar permintaan | ... |
| Kode 4.3 | Penulisan `terraform.tfvars` dari nilai hasil pemilihan | ... |
| Kode 4.4 | Pembatasan cakupan data menurut peran pada lapisan kueri | ... |

*(Nomor halaman diisi di Word setelah tata letak final. Di Word, pakai Caption dengan label baru "Kode" lalu Insert Table of Figures agar daftar dan nomor halaman terisi otomatis.)*

---

# Catatan penempatan dan pilihan

## Keempat cuplikan dan klaim yang dibelanya
Tiap listing dipilih karena membela satu keputusan desain yang kamu bahas di teks, bukan sekadar memajang kode.

| Kode | Letak | Membuktikan |
|---|---|---|
| 4.1 | Bab IV §4.1.2 | Isolasi kegagalan: satu permintaan N mesin virtual dipecah jadi N pekerjaan mandiri (ADR-08, RM1) |
| 4.2 | Bab IV §4.1.3 | `main.tf` tetap antar permintaan, seluruh nilai berbentuk `var.*` (abstraksi IaC, RM1) |
| 4.3 | Bab IV §4.1.3 | Portal menuliskan `terraform.tfvars` dari pilihan pengguna, jadi hanya variabel yang berubah (RM1) |
| 4.4 | Bab IV §4.1.4 | Kontrol akses berlaku di lapisan kueri basis data, bukan penyembunyian menu (RM2) |

## Kalau mau menambah, dua kandidat kuat berikutnya
- **Gerbang persetujuan** (`ProvisionRequestService::requiresApproval`): `return $env->approval_required && ! $actor->isPrivileged();` Satu baris yang menegaskan pengguna biasa selalu lewat persetujuan sedangkan admin/manager melewatinya. Cocok untuk memperkuat RM2.
- **Kata sandi acak per mesin virtual** (`ResourceResolutionService`): `Str::password(20, letters: true, numbers: true, symbols: false, ...)`, lalu disimpan terenkripsi oleh `ProvisionVmJob`. Membela klaim kredensial zero-knowledge pada RM2.

Kalau kamu tambahkan keduanya, Daftar Kode jadi enam entri dan RM2 terwakili lebih seimbang.

## Best practice
- **Cuplikan pendek, 5 sampai 15 baris.** Yang panjang dipersingkat, tandai "(dipersingkat)" seperti Kode 4.2
- **Sebut sumbernya** di judul, yaitu nama berkasnya, supaya penguji bisa menelusuri saat bedah kode
- **Rujuk tiap listing di teks** minimal sekali, misalnya "sebagaimana Kode 4.1". Sudah kutambahkan rujukannya
- **Penomoran "Kode 4.x" terpisah** dari Tabel dan Gambar, jadi menambah listing tidak menggeser nomor tabel atau gambar mana pun
- **Konsistenkan istilah halaman**, yaitu "Daftar Kode Program" atau "Daftar Listing Program", pilih satu di seluruh dokumen
