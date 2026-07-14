# Runbook Pengukuran Data — Web Portal (untuk Bab IV)

Panduan langkah demi langkah untuk **mengukur data nyata** portal ExoVirt + **screenshot bukti** yang harus diambil. Mengikuti rancangan pengujian `bab3.md §3.3.5` (efisiensi, konsistensi, kebergunaan/SUS, fungsional black box).

**Tiga sumber data perbandingan:**
| Metode | Status data | Peran di Bab IV |
|---|---|---|
| **Web Portal (ExoVirt)** | 🔴 diukur di runbook INI | kelompok utama |
| **Manual (Proxmox VE GUI)** | 🟢 kamu sudah punya (data lapangan) | pembanding uji statistik |
| **Terraform CLI** | 🟢 dari jurnal | rujukan **pembahasan** (bukan uji statistik — beda lingkungan/hardware) |

> ⚠️ **Catatan integritas (penting):** uji beda statistik (T-Test/Wilcoxon) hanya sah antara **dua kelompok yang kamu ukur sendiri dengan protokol sama** → **Portal vs Manual**. Angka Terraform CLI dari jurnal dipakai sebagai **konteks/pembanding deskriptif** di pembahasan, bukan dimasukkan ke uji beda. Kalau data manual lamamu berupa *estimasi lapangan* (5–20 mnt), sebaiknya ukur ulang manual dengan protokol identik di bawah supaya benar-benar apple-to-apple; data tiket lapangan tetap dipakai di Bab I (besaran masalah), bukan di sini.

---

## 0. Persiapan (sekali di awal)

- **Dokumentasikan lingkungan uji** (untuk reproducibility di Bab IV): provider Proxmox (Jakarta/Lampung), node, spek host (CPU/RAM), template katalog yang dipakai, versi Proxmox VE.
- **Kunci variabel kontrol** (WAJIB sama di semua percobaan & di kedua metode):
  - **Template/katalog sama → `RHEL`** (2026-07-14). Rocky dibuang: template Jakarta-nya ter-resize permanen ke 40 GB karena salah sasaran → Insiden #2 §2b. Ubuntu dibuang: *base image* **3584M = 3,5 GiB** → increment jadi **36,5** (pecahan, di kolom yang sudah terbukti menjebak). **RHEL bawaan 10 GB → increment +30 → 40 GB, bulat.**
  - **Tier sama → CPU/RAM/Disk identik.** Dipakai: **Bronze** (`disk_gb` = 40).
  - ✅ **CPU/RAM template RHEL = identik dengan Rocky = spek Bronze** (diverifikasi 2026-07-14) → **tidak ada langkah setel CPU/RAM**. Tulis alasannya di Bab IV: template disamakan dengan spesifikasi tier Bronze, bukan kelalaian pengukuran.
  - ✅ **Cloud-init RHEL identik dengan Rocky** (diverifikasi 2026-07-14) → Upgrade packages diperlakukan sama (uncheck, langkah 12–14). ⚠️ **Khusus RHEL:** kalau ternyata boot pertama menggantung, curigai `dnf upgrade` tanpa langganan aktif — hentikan dan kabari, jangan dipaksa masuk tabel.
  - ➡️ **Konsekuensi: alur manual = 23 langkah, persis lembar hitung §1.d.** Hanya nama template yang berubah.
  - ✅ Kunci `exovirt-ansible` + katalog: keempat template Linux Jakarta sudah di-bake 2026-07-13 [[hardening-key-rollout-templates]], RHEL termasuk.
  - **Clone mode = Full Clone** di manual. Portal memaku `full_clone = true` (`backend/storage/app/master-provisioning/terraform/main.tf:9`). ⚠️ Link Clone nyaris instan (cuma lapisan diff) — memakainya di manual = mengadu jalan pintas lawan salinan penuh, hasil uji jadi tidak sah.
  - **IP = DHCP** di kedua metode (sudah diverifikasi pada cloud-init VM buatan portal, 2026-07-14).
  - Environment, network, datastore sama
  - Pola nama VM konsisten (mis. `UJI-01`, `UJI-02`, …)
- **Alat:** timer HP/stopwatch **atau** (lebih objektif) pakai timestamp sistem sendiri (Inventory/Audit `created_at` → status `Active`). Tool screenshot.
- **Satuan waktu: DETIK saja** untuk semua trial. Uji statistik butuh satu satuan; konversi menit-detik di 10 baris tabel = sumber salah hitung.

> ⚠️ **JEBAKAN PROXMOX #1 — Resize itu INCREMENT (kena 2026-07-14):** dialog Disk Action → Resize isinya **Size Increment (GiB)**, BUKAN ukuran akhir. Template 10 GB + isi `40` → hasilnya **50 GB**, bukan 40. Cek tab Hardware setelah clone untuk memastikan angkanya benar. Portal tidak punya jebakan ini: pengguna memilih tier, Terraform menulis 40 GB langsung.
>
> ⚠️ **JEBAKAN PROXMOX #2 — salah sasaran resize (kena 2026-07-14):** **PASTIKAN kamu berdiri di VM CLONE, bukan di TEMPLATE**, sebelum menyentuh tab Hardware. Cek nama + VMID di panel kiri. Proxmox tidak memperingatkan, tidak bertanya, tidak ada undo — **disk TIDAK BISA dikecilkan** (GUI tak punya opsi, `qm resize` menolak, dan shrink di lapisan storage `lvreduce`/`zfs set volsize`/`qemu-img --shrink` memotong blok data → template rusak). Satu klik di baris yang salah = template hangus permanen dan **setiap VM turunannya ikut kena**.

> ℹ️ **Kenapa template rusak tidak bisa "diperbaiki" begitu saja:** akun `sysuser` + `sysadmin` + kunci `exovirt-ansible` semuanya **di dalam disk** (hasil virt-customize), bukan di config VM. Hapus disk + import cloud image baru = ketiganya lenyap → portal tak bisa deploy + hardening patah → wajib bake ulang. Detach lalu re-attach **tidak menolong**: itu operasi config, volume-nya tetap seukuran semula.
- **Folder bukti:** `presentation/bukti/{efisiensi,konsistensi,sus,blackbox}/` — simpan screenshot ber-nomor rapi (mis. `efisiensi-portal-trial01-wizard.png`).

---

## 1. EFISIENSI — waktu & jumlah langkah  ·  (Hipotesis 1)

**Yang diukur:** (a) waktu proses *provisioning*, (b) jumlah langkah/klik pengguna.
**Indikator target (bab3):** penurunan waktu ≥ 50% + langkah berkurang vs manual.

### 1.a Ruang lingkup waktu (BACA DULU sebelum mengukur)

H1 di `bab2.md` membandingkan **antarmuka aplikasi vs antarmuka Proxmox VE bawaan**, bukan membandingkan jabatan. Karena itu yang masuk uji beda hanya **waktu yang disebabkan oleh alat**, bukan waktu keputusan manusia. Waktu *provisioning* dipecah tiga segmen:

| Segmen | Portal (ExoVirt) | Manual (Proxmox GUI) | Masuk uji H1? |
|---|---|---|:---:|
| **t1** interaksi pengguna | mulai wizard → klik **Submit** | tercakup di `t_manual` | ✅ |
| **t2** tunggu keputusan approval | **Submit → Approve** | tiket/email mengendap di admin | ❌ **dikeluarkan** |
| **t3** eksekusi otomatis | **Approve → status Active** | tercakup di `t_manual` | ✅ |

- **Waktu provisioning portal (angka H1) = t1 + t3.** t2 **tidak** dijumlahkan.
- **Waktu provisioning manual (angka H1) = `t_manual`** = login Proxmox → VM benar-benar jalan, satu blok tanpa jeda.

**Kenapa t2 dikeluarkan (siapkan jawaban ini untuk penguji):**

1. **Approval ada di kedua alur.** Pada proses manual approval tetap terjadi lewat tiket/email ke administrator (lihat `bab1.md` latar belakang + PIECES *Service* di `bab3.md`), hanya saja informal dan tidak terekam. Portal tidak menambah langkah. Portal **memformalkan** approval yang tadinya tak tercatat menjadi tercatat di audit trail.
2. **Approval variabel tata kelola (RM2), bukan efisiensi (RM1).** Lamanya bergantung pada kapan *approver* membuka portal, bukan pada kualitas sistem. Memasukkannya ke uji beda sama saja mengukur ketersediaan manusia.
3. **Mengeluarkan t2 bersifat konservatif, justru menguntungkan manual.** Waktu tunggu nyata alur manual berjam-jam sampai berhari-hari (120 tiket / 2 bulan / 2 admin pembuat VM, lihat `bab1.md` Tabel 1.1). Angka 5–20 menit itu **waktu kerja admin**, bukan waktu tunggu pengguna. Dengan mengeluarkan waktu tunggu dari **kedua** sisi, manual diberi skenario terbaiknya dan portal tetap menang.

> **t2 tetap dicatat**, tapi dilaporkan **deskriptif** di Bab IV bagian tata kelola (RM2), bukan di uji beda §4.3.

### 1.b Penugasan aktor (asimetris dengan sengaja: ini temuan, bukan cacat)

| Arm | Aktor | Alasan |
|---|---|---|
| **Portal** | **User (Requestor)** biasa, admin hanya meng-*approve* | sesuai klaim *self-service*; ini pengguna paling awam |
| **Manual** | **Admin** ber-hak-akses penuh di Proxmox GUI | di alur manual **hanya** admin yang bisa; ini skenario **terbaik** manual |

Catat di Bab IV: pengguna biasa **tidak dapat sama sekali** melakukan *provisioning* manual karena tidak punya hak akses Proxmox, sehingga waktunya bukan lambat melainkan **tak terhingga**. Portal membuat tugas itu menjadi mungkin. Mengadu portal-pengguna-awam melawan manual-admin-ahli berarti pengujian sudah dicondongkan ke pihak manual, dan itu memperkuat kesimpulan.

**Ukuran sampel:** ulang **≥ 10 percobaan** untuk kondisi yang sama (1 VM) di portal, dan **≥ 10** untuk manual. Sepuluh angka per kelompok cukup untuk uji Shapiro-Wilk → T-Test/Wilcoxon.
**(Opsional, memperkuat H1 "O(1) vs O(N)"):** ukur juga batch **N = 1, 5, 10** → tunjukkan jumlah langkah pengguna portal ~tetap saat N naik, sedangkan manual naik linear.
**(Opsional, robustness):** arm tambahan **admin portal yang self-approve vs admin Proxmox GUI**. Aktor dan hak akses identik, approval hilang dari dua sisi, jadi murni mengukur gain otomatisasi. Pakai kalau waktu cukup; desain utama sudah sah tanpa ini.

### 1.c Langkah per percobaan — PORTAL

1. *Login* ke portal sebagai **User (Requestor)**. **TIDAK dihitung** (waktu maupun langkah) — sama seperti manual, lihat §1.e.
2. Buka wizard **Request VM** → isi: Environment → Provider → Node → Catalog → Nama VM → Jumlah → Tier → Network → Datastore → halaman **Review** (lihat Total CPU/RAM/Disk) → **Submit**.
   - **Hitung jumlah langkah/klik pengguna** dari wizard terbuka sampai Submit.
   - **Catat t1**: stopwatch mulai saat wizard terbuka, stop saat klik Submit.
3. Admin lakukan **Approve** di menu Approvals. **Hitung langkah admin terpisah**, jangan dicampur ke langkah pengguna.
4. Tunggu sampai VM berstatus **Active** di **Inventory**.
5. Ambil **t2** dan **t3** dari **timestamp Audit Trail** (lebih objektif daripada stopwatch):
   - `t2` = waktu baris `approved` − waktu baris `created/submitted`
   - `t3` = waktu status `Active` − waktu baris `approved`
6. Hitung **t1 + t3**. Angka inilah yang masuk uji beda.

### 1.d Langkah per percobaan — MANUAL (Proxmox VE GUI)

Protokol identik, variabel kontrol sama (§0). Aktor = **admin**.

**Lembar hitung (alur terverifikasi 2026-07-14, Rocky Linux + Bronze + DHCP).** Contreng per trial; koreksi kalau layarmu beda.

| # | Aksi | Langkah |
|---|---|:---:|
| — | *Login Proxmox VE GUI* | **0** (tidak dihitung) |
| 1 | Klik kanan template → **Clone** ⏱️ **stopwatch MULAI** | 1 |
| 2 | Isi **Name** | 1 |
| 3 | Pilih Mode = **Full Clone** | 1 |
| 4 | Klik tombol **Clone** | 1 |
| 5 | Klik tab **Cloud-Init** | 1 |
| 6 | Klik **Edit** pada User | 1 |
| 7 | Isi username | 1 |
| 8 | Klik **OK** | 1 |
| 9 | Klik **Edit** pada Password | 1 |
| 10 | Isi password | 1 |
| 11 | Klik **OK** | 1 |
| 12 | Klik **Edit** pada **Upgrade packages** | 1 |
| 13 | **Uncheck** Upgrade packages | 1 |
| 14 | Klik **OK** | 1 |
| 15 | Klik **Edit** pada IP Config | 1 |
| 16 | Pilih **DHCP** | 1 |
| 17 | Klik **OK** | 1 |
| 18 | Klik tab **Hardware** | 1 |
| 19 | Klik **Hard Disk** → **Disk Action** | 1 |
| 20 | Klik **Resize** | 1 |
| 21 | Isi increment = **30** (10 GB → 40 GB, lihat jebakan §0) | 1 |
| 22 | Klik **Resize disk** | 1 |
| 23 | Klik **Start** VM | 1 |
| — | Tunggu sampai **IP muncul** ⏱️ **stopwatch STOP** | 0 |
| — | *Putty + tes login* (verifikasi §4, DI LUAR jendela ukur) | 0 |
| | | **= 23** |

**Kenapa Upgrade packages di-uncheck (langkah 12–14):** VM buatan portal keluar dalam keadaan **unchecked** (diverifikasi 2026-07-14), sedangkan clone manual datang **checked** → manual butuh 3 klik untuk menyamai. Stub Terraform tidak menyetel `ciupgrade`/`package_upgrade` sama sekali, jadi cocokkan selalu ke VM portal, jangan ke asumsi. Kalau dibiarkan checked di manual, `dnf upgrade` jalan saat boot pertama → waktunya melar dan bergantung jaringan (tidak deterministik) **dan** isi paketnya beda dari VM portal.

**Aturan titik ukur:**
- ⏱️ **MULAI** saat klik kanan template. **Login TIDAK dihitung** (waktu maupun langkah) — login itu autentikasi, bukan *provisioning*, dan bentuknya sama di kedua metode. Portal juga mulai setelah login (saat wizard terbuka), jadi ini menjaga kesetaraan.
- ⏱️ **STOP** saat **IP muncul**, bukan saat tombol Start diklik dan **bukan** setelah putty/ganti password. "IP muncul" = padanan persis status `Active` di portal (Terraform selesai, IP diketahui).
- **Putty + tes login + ganti password ADA DI LUAR jendela ukur.** Force-change itu bawaan template `sysuser` [[template-account-model]] dan **terjadi di kedua metode** — pengguna portal juga harus reveal password → putty → ganti password. Memasukkannya hanya ke manual = membebani manual dengan pekerjaan yang portal tidak dibebani. Terukur **±45 dtk** (2026-07-14); laporkan **deskriptif** saja, jangan masuk uji beda.
- Angka ini = **`t_manual`**, langsung masuk uji beda.

> ⚠️ **Titik stop wajib sama makna di kedua kelompok: "VM siap dipakai".** Portal = status `Active` di Inventory. Manual = **IP muncul**.

**📊 Trial #1 (2026-07-14, SAH):** `t_manual` = **191 dtk** (3:11) · **23 langkah** · disk 40 GB terverifikasi · 236 dtk (3:56) bila putty+ganti-password ikut dihitung → selisih **45 dtk** = beban *onboarding*, di luar uji.

**Catatan hasil untuk Bab IV (bukan langkah, tapi temuan):** hostname otomatis mengikuti nama VM dan filesystem auto-extend setelah resize. Keduanya kerja **template + cloud-init**, identik di manual maupun portal → **BUKAN keunggulan portal**. Tempatnya di **pengujian fungsional §4** (Tabel 3.3 baris cloud-init hostname/auto-resize), jangan diklaim di efisiensi.

### 1.e Aturan menghitung langkah (kunci SEBELUM trial pertama)

`bab3.md` Tabel 3.4 hanya menulis indikator "jumlah langkah yang dilakukan" tanpa mendefinisikannya. Definisi operasional yang dipakai penelitian ini:

> **1 langkah = 1 aksi wajib pengguna yang memberi masukan, membuat keputusan, atau memajukan proses.**

**DIHITUNG (@ 1 langkah):**
- Mengisi satu field. Mengetik `UJI-01` = **1**, bukan 6 ketukan.
- Memilih satu opsi dropdown/radio/checkbox. **Buka + pilih = 1** (satu keputusan), bukan 2.
- Klik kanan → pilih menu = **1** (pola sama dengan dropdown).
- Klik tombol yang mengeksekusi: OK, Clone, Resize disk, Start, Next, Submit.
- Klik navigasi wajib: tab Cloud-Init, tab Hardware, tombol Edit (setara "Next" di wizard portal).

**TIDAK DIHITUNG (0):**
- *Login*.
- Scroll, hover, klik sekadar memfokuskan field, menutup popup.
- Menunggu *loading*.
- Membaca/verifikasi (mis. halaman Review).

> **ATURAN EMAS:** kelonggaran apa pun yang dipakai, pakai **persis sama** di kedua kelompok, dan tulis aturan ini di Bab IV **sebelum** tabel angkanya. Penguji tidak mempersoalkan 4 atau 5; yang dipersoalkan kalau manual dihitung longgar tapi portal dihitung ketat. Aturan yang konsisten + diumumkan selalu lebih kuat daripada aturan "benar" yang tidak pernah dijelaskan.

**Tabel pencatatan (portal):**

| Trial | Langkah user | Langkah admin (approve) | t1 interaksi (dtk) | t3 eksekusi (dtk) | **t1+t3 → uji H1** (dtk) | t2 tunggu approval (dtk, deskriptif) |
|------:|-------------:|------------------------:|-------------------:|------------------:|-------------------------:|-------------------------------------:|
| 1 | | | | | | |
| … | | | | | | |
| 10 | | | | | | |
| **Rata-rata** | | | | | | |

**Tabel pencatatan (manual):**

**Template: RHEL** (10 GB → +30 → 40 GB) · reset 2026-07-14 (data Rocky VOID — baseline template berubah, lihat §0)

| Trial | Jumlah langkah | **`t_manual` → uji H1** (dtk)<br>klik-kanan → IP muncul | Disk aktual (verifikasi) | +putty/ganti-pwd (dtk, deskriptif) |
|------:|---------------:|--------------------------------------:|:---:|---------------------------------:|
| 1 | | | | |
| 2 | | | | |
| … | | | | |
| 10 | | | | |
| **Rata-rata** | | | | |

> ⚠️ **SEPULUH trial WAJIB memakai template yang SAMA.** Baseline berubah di tengah jalan = sepuluh-sepuluhnya hangus. Ini yang membunuh seri Rocky.
> Trial yang **dibatalkan** (mis. salah *increment* → disk 50 GB) jangan dihapus — pindahkan ke lembar observasi **§2b** sebagai data kesalahan manusia.

**🗑️ Seri Rocky (VOID, disimpan sebagai jejak):** Trial #1 = 191 dtk / 23 langkah / disk 40 GB / Δ45 dtk putty. Angkanya **tidak dipakai** (template Rocky ter-resize permanen di tengah seri → baseline berubah). **Insidennya tetap dipakai** di §2b.

> Kolom **`t1+t3`** (portal) vs kolom **`t_manual`** (manual) adalah dua kelompok yang masuk **Shapiro-Wilk → T-Test/Wilcoxon**. Kolom **t2 tidak ikut**.

**Screenshot bukti yang HARUS diambil:**
- [ ] Tiap langkah wizard (minimal: halaman Review dengan Total CPU/RAM/Disk)
- [ ] Menu Approvals saat Approve
- [ ] Inventory menampilkan VM **Active** + kolom waktu
- [ ] Audit Trail baris `created` → `approved` → `provisioned/Active` (bukti timestamp objektif untuk t2 & t3)
- [ ] **Manual:** tiap dialog Proxmox (clone, hardware, cloud-init, start) + VM status running

---

## 2. KONSISTENSI KONFIGURASI  ·  (Hipotesis 2)

**Yang diukur:** % VM yang konfigurasinya **sesuai spec (tanpa *configuration drift*)**.
**Indikator target (bab3):** kesesuaian 100%.

**Langkah:**
1. *Provision* **K VM** (mis. 10) via portal dengan **spec identik**.
2. Untuk tiap VM, periksa konfigurasi **aktual** (CPU, RAM, Disk, Network, status *hardening*) di **Proxmox** (tab Hardware) atau **detail Inventory**.
3. Cocokkan ke **checklist spec**. Tandai Sesuai / Tidak per parameter.

**Tabel checklist:**

| VM | CPU | RAM | Disk | Network | Hardening | Sesuai spec? |
|----|:---:|:---:|:----:|:-------:|:---------:|:------------:|
| UJI-01 | ✓ | ✓ | ✓ | ✓ | ✓ | ✅ |
| … | | | | | | |
| **% Sesuai** | | | | | | |

**Screenshot bukti:**
- [ ] Konfigurasi aktual tiap VM (Proxmox Hardware / detail Inventory)
- [ ] Tabel checklist terisi
- [ ] (Pembanding) contoh VM manual yang *drift* bila ada

---

## 2b. KESALAHAN MANUSIA (*human error*)  ·  Variabel 3, TANPA hipotesis

**Kenapa ada:** `bab3.md` Tabel 3.4 mendeklarasikan **4 variabel**, tapi §1–§4 runbook ini semula hanya mengukur 3. Variabel 3 = *"kesalahan konfigurasi yang terjadi selama proses provisioning"*, indikator *"jumlah kesalahan konfigurasi per proses provisioning"*, instrumen *"lembar observasi dan log sistem"*. Ini menutup celah itu. Variabel ini **tidak punya hipotesis** (H1–H3 hanya efisiensi/konsistensi/SUS) → dilaporkan **deskriptif**, memperkuat **Rumusan Masalah 3**.

**Definisi 1 kesalahan:** satu parameter hasil yang **menyimpang dari spec**, meski prosesnya berhasil. Bedakan tegas:
- **Failed operation** = proses GAGAL (clone error, VM tidak mau boot). **Bukan** yang diukur di sini.
- **Human error / drift** = proses **BERHASIL**, VM jalan normal, **tapi hasilnya salah**. **Ini** yang dihitung.

Parameter yang dicek per trial: **CPU · RAM · Disk · Network/IP · Hostname · Nama VM**.

**Lembar observasi (isi per trial, kedua kelompok):**

| Trial | Metode | Parameter menyimpang | Jml kesalahan | Terdeteksi otomatis? | Ketahuan lewat | Radius |
|------:|--------|----------------------|--------------:|:--------------------:|----------------|--------|
| Rocky #1 | Manual | Disk 50 GB (spec 40 GB) | 1 | ❌ tidak | pemeriksaan tab Hardware | 1 VM |
| Rocky #2 | Manual | **Disk TEMPLATE** 10→40 GB (salah sasaran) | 1 | ❌ tidak | disadari sendiri | **semua VM turunan, permanen** |
| … | | | | | | |
| | | **Total / rata-rata** | | | | |

### Tiga lapis pelaporan (JANGAN dilanggar)

> ⚠️ **Godaan terbesar di bagian ini = mengarang statistik.** Insiden n=1 yang dialami peneliti sendiri BUKAN bukti "manual rawan error". Penguji akan bertanya "berapa sampelnya?" dan "siapa operatornya?" — dua pertanyaan itu menjatuhkan klaimnya. **Dan jangan pernah sengaja berbuat salah di manual supaya angkanya bagus.** Itu pemalsuan data.

**Lapis 1 — laporkan insiden sebagai OBSERVASI, bukan statistik.** Satu paragraf jujur, tanpa persentase. Justru meyakinkan karena mengakui kesalahan sendiri.

**Lapis 2 — hitung yang benar-benar terjadi.** Selama 10 trial, isi lembar observasi apa adanya. **Kalau hasilnya 0 kesalahan, tulis 0.** Itu tetap temuan. Catatan kejujuran wajib: setelah insiden pertama, peneliti sudah tahu jebakannya, sehingga error rate trial berikutnya cenderung 0 — **sebutkan bias ini** sebagai keterbatasan.

**Lapis 3 — argumen PERMUKAAN KESALAHAN (paling kuat, tidak butuh sampel).** Arsitektural, bukan empiris:

> Di manual terdapat **field yang bisa salah isi**: nilai *increment* disk dihitung sendiri oleh operator (40 − 10 = 30), dan Proxmox tidak memvalidasinya terhadap standar apa pun karena Proxmox tidak mengetahui standar organisasi. Di portal **field itu tidak ada**: pengguna memilih tier, lalu Terraform menuliskan 40 GB. Kolom yang tidak ada tidak dapat diisi salah.

Klaim ini berdiri di atas **kode**, bukan di atas sampel, sehingga tidak dapat dipatahkan dengan "n-nya berapa?". **Tetap jujur pada batasnya:** portal **mengecilkan** permukaan kesalahan, tidak menghapusnya — pengguna portal masih bisa salah pilih tier atau template. Bedanya, salah pilih tier **terlihat di halaman Review sebelum Submit**, sedangkan salah *increment* di Proxmox **tidak terlihat di mana pun**.

**Sifat drift yang layak ditonjolkan: SENYAP.** VM tidak protes, tidak ada error di layar, tidak ada log merah. Ketahuan hanya bila seseorang sengaja membuka tab Hardware dan mencocokkan angkanya. Di organisasi dengan **120 tiket / 2 bulan / 2 admin** (`bab1.md` Tabel 1.1), pemeriksaan itu tidak terjadi.

### 📌 INSIDEN TERCATAT — 2026-07-14, trial manual #1 (bahan Lapis 1)

Peneliti — yang merupakan **pengembang sistem** dan sudah familier dengan Proxmox — tetap salah pada percobaan manual pertama. Dialog Disk Action → Resize meminta **Size Increment (GiB)**, bukan ukuran akhir. Nilai `40` dimasukkan dengan maksud "jadikan 40 GB", padahal template Rocky bawaan **10 GB**, sehingga hasilnya **50 GB** — menyimpang 10 GB dari spec tier Bronze (40 GB).

Yang menentukan: **tidak ada satu pun indikasi kesalahan.** Clone berhasil, VM boot normal, filesystem auto-extend bekerja, hostname terisi benar, VM dapat di-login. Penyimpangan baru ketahuan setelah tab Hardware dibuka dan angkanya dicocokkan manual. Trial dibatalkan dan diulang dengan increment 30.

### 📌 INSIDEN TERCATAT #2 — 2026-07-14, salah sasaran resize (bahan Lapis 1 & 3)

Masih pada hari yang sama, peneliti bermaksud memperbesar disk **VM hasil clone**, namun yang terpilih adalah **template**-nya. Nilai increment 30 GB masuk ke template, sehingga disk template Rocky berubah permanen dari 10 GB menjadi 40 GB. Proxmox tidak menampilkan konfirmasi, peringatan, maupun pembeda yang menonjol antara template dan mesin virtual biasa pada operasi tersebut.

**Radiusnya jauh lebih luas daripada Insiden #1.** Insiden #1 merusak satu mesin virtual; Insiden #2 merusak **artefak bersama**, sehingga setiap mesin virtual yang lahir dari template itu ikut membawa penyimpangannya, tanpa batas waktu. Kesalahan juga **tidak dapat dibatalkan**: Proxmox tidak menyediakan operasi pengecilan disk, `qm resize` menolaknya, dan pengecilan pada lapisan penyimpanan memotong blok data sehingga merusak citra template. Pemulihan menuntut pembangunan ulang template beserta proses *virt-customize* untuk akun `sysuser`, `sysadmin`, dan kunci otomasi di dalamnya.

Akibatnya seri pengukuran Rocky dibatalkan dan pengukuran diulang memakai template Ubuntu Server.

**Nilai insiden ini untuk Lapis 3 (permukaan kesalahan):** kesalahan seperti ini **tidak mungkin dilakukan pengguna portal** — bukan karena ia lebih berhati-hati, melainkan karena portal tidak menyediakan jalan menuju template. Antarmuka *self-service* hanya memaparkan pilihan tier; template dikelola administrator dan tidak pernah tersentuh alur permintaan. Permukaan kesalahan di sini bukan sekadar "kolom yang tidak ada", melainkan **artefak bersama yang tidak dapat dijangkau**.

**Screenshot bukti:**
- [ ] Dialog Resize Proxmox (memperlihatkan label "Size Increment")
- [ ] Tab Hardware VM manual (disk aktual) + VM portal (disk aktual) sebagai pembanding
- [ ] Tab Hardware template Rocky (disk 40 GB — bukti Insiden #2)
- [ ] Wizard portal: tidak ada jalan menuju template (bukti Lapis 3)
- [ ] Lembar observasi terisi

---

## 3. KEBERGUNAAN — SUS  ·  (Hipotesis 3)

**Yang diukur:** skor **System Usability Scale** 0–100.
**Indikator target (bab3):** SUS ≥ 68 (kategori *acceptable*). **n ≥ 5 responden** (idealnya pengguna non-teknis, sesuai klaim *self-service*).

**Langkah:**
1. Tiap responden diminta menyelesaikan **satu tugas nyata** (mis. *provision* 1 VM lewat portal).
2. Isi **kuesioner SUS** 10 butir, skala Likert 1–5.
3. Hitung skor per responden dengan **rumus baku**: butir **ganjil** → (nilai − 1); butir **genap** → (5 − nilai); jumlahkan lalu **× 2,5** → skor 0–100.
4. Rata-ratakan seluruh responden → skor SUS akhir + kategori.
5. *(Opsional H3 pembanding)*: minta responden juga coba **Proxmox GUI** + isi SUS-nya → bandingkan.

**Tabel jawaban & skor:**

| Responden | Q1 | Q2 | … | Q10 | Skor SUS |
|-----------|:--:|:--:|:-:|:---:|---------:|
| R1 | | | | | |
| … | | | | | |
| **Rata-rata** | | | | | |

**Screenshot bukti:**
- [ ] Formulir kuesioner (mis. Google Form)
- [ ] Rekap jawaban mentah tiap responden
- [ ] Perhitungan skor SUS

---

## 4. FUNGSIONAL — Black Box

**Yang diukur:** **% skenario lolos** (kesesuaian input↔output).

**Langkah:** untuk tiap fitur, definisikan skenario → jalankan → catat output aktual → Lolos/Gagal. Cakup: Request, Approval, Provisioning (Terraform), Hardening (Ansible), Inventory & lifecycle (renew/resize/add-disk/delete), IAM (user/role/group), Discovery, Policy/Environment, Catalog/Network/Datastore/Tier.

**Tabel:**

| No | Fitur | Skenario | Input | Output diharapkan | Output aktual | Status |
|---:|-------|----------|-------|-------------------|---------------|:------:|
| 1 | Request VM | Ajukan VM valid | … | Tersimpan, status Pending | | ✅/❌ |
| … | | | | | | |
| | | | | | **% Lolos** | |

**Screenshot bukti:** input + hasil/kondisi akhir tiap skenario.

---

## 5. Alur data → Bab IV

- **4.2 Fungsional:** tabel black box + **% keberhasilan**.
- **4.3 Efisiensi (H1):** dua kelompok = **`t1+t3` (portal)** vs **`t_manual`** → **Shapiro-Wilk** → **Independent T-Test** (normal) / **Wilcoxon** (tidak normal). Sertakan tabel jumlah langkah (user vs admin). **`t2` tidak masuk uji.** Terraform CLI (jurnal) di pembahasan.
- **4.4 Konsistensi (H2):** % kesesuaian Portal vs Manual → uji beda bila datanya numerik cukup, atau paparan deskriptif + tabel.
- **4.4b Kesalahan manusia (Variabel 3, RM3, deskriptif — TANPA hipotesis):** lembar observasi §2b + insiden tercatat (Lapis 1) + argumen permukaan kesalahan (Lapis 3). **Tanpa uji statistik** — n kecil dan operator = peneliti sendiri; sebutkan bias ini sebagai keterbatasan. Kalau error rate terukur 0, **tulis 0**.
- **4.5 Kebergunaan (H3):** skor SUS + kategori.
- **4.6 Tata kelola (RM2, deskriptif):** laporkan **`t2` (waktu tunggu approval)** di sini sebagai karakteristik *approval workflow* + bukti audit trail. Tegaskan approval juga ada di alur manual namun informal dan tak terekam, sehingga portal memformalkan, bukan menambah, langkah tersebut.
- **4.7 Pembahasan:** kaitkan tiap hasil ke Rumusan Masalah 1–4 + keputusan H0/H1. Cantumkan **batasan ruang lingkup waktu** (§1.a): waktu tunggu keputusan manusia dikeluarkan dari kedua kelompok, dan pengeluaran itu konservatif karena menguntungkan alur manual.

> Alat bantu uji statistik: SPSS / Jamovi / Python (scipy `shapiro`, `ttest_ind`, `wilcoxon`) — **screenshot output ujinya juga** sebagai bukti.
