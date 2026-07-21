# BAB IV HASIL DAN PEMBAHASAN

Bab ini memuat hasil tahap Demonstrasi dan tahap Evaluasi sebagaimana dirancang pada subbab 3.3.4 dan 3.3.5. Subbab 4.1 memaparkan sistem yang berhasil dibangun dan dijalankan. Subbab 4.2 sampai 4.6 memuat hasil pengujian terhadap empat variabel penelitian pada Tabel 3.4, mengikuti urutan rancangan pengujian pada subbab 3.3.5c. Subbab 4.7 memaparkan bukti mekanisme tata kelola. Subbab 4.8 mengaitkan seluruh hasil dengan rumusan masalah dan keputusan hipotesis.

Seluruh angka pada bab ini berasal dari pengukuran langsung pada lingkungan penelitian. Data yang bersumber dari luar lingkungan tersebut dipakai sebagai pembanding deskriptif dan tidak pernah masuk ke dalam uji statistik.

Bab ini memakai sejumlah notasi dan singkatan yang berulang pada seluruh pengujian. Tabel berikut merangkumnya agar pembaca dapat merujuk sewaktu-waktu.

**Notasi dan Simbol**

| Simbol | Arti |
|---|---|
| `t1` | Waktu interaksi pengguna, dari katalog dibuka sampai Submit |
| `t2` | Waktu tunggu persetujuan, dari Submit sampai Approve; **dikeluarkan** dari uji Hipotesis 1 |
| `t3` | Waktu eksekusi otomatis, dari Approve sampai alamat IP muncul |
| `t1 + t3` | Total waktu *provisioning* portal yang diuji pada Hipotesis 1 |
| `t_manual` | Total waktu *provisioning* manual melalui Proxmox VE GUI |
| `N` | Jumlah mesin virtual dalam satu permintaan *batch* |
| `n` | Ukuran sampel, yaitu jumlah percobaan atau responden |
| `W` | Statistik uji Shapiro-Wilk pada uji normalitas; simbol yang sama juga menandai statistik uji Wilcoxon *signed-rank*, dibedakan oleh konteks subbab |
| `U` | Statistik uji Mann-Whitney U |
| `t` | Statistik uji t berpasangan; `t(df)` menyertakan derajat bebas, misalnya `t(7)` |
| `p` | Nilai signifikansi, dibandingkan dengan taraf 0,05 |
| `d` | Cohen's d, ukuran efek |
| `SD` | Simpangan baku |
| `CV` | Koefisien variasi |
| `SUS` | *System Usability Scale*, skor 0 sampai 100 |

---

## 4.1 Hasil Implementasi Sistem

Subbab ini menjawab tahap Demonstrasi pada subbab 3.3.4, yaitu memperlihatkan bahwa seluruh komponen sistem bekerja terintegrasi pada lingkungan nyata.

### 4.1.1 Lingkungan Operasional

Aplikasi ExoVirt berjalan pada lingkungan produksi dan melayani dua pusat data Proxmox VE. Pengguna mengakses portal melalui peramban, mengajukan permintaan mesin virtual, dan menerima mesin virtual yang siap dipakai tanpa menyentuh Terraform, Ansible, maupun antarmuka Proxmox VE.

**Tabel 4.1 Lingkungan operasional sistem**

| Komponen | Keterangan |
|---|---|
| Antarmuka pengguna | Aplikasi web *single page application* |
| Layanan backend | Kerangka kerja web dengan autentikasi berbasis *cookie* |
| Mesin orkestrasi | Terraform dengan penyedia Proxmox |
| Konfigurasi dalam *guest* | Ansible melalui koneksi SSH berbasis kunci |
| Platform virtualisasi | Proxmox VE 9.1.11 |
| Jumlah pusat data | 2 |
| Jumlah *golden image* | 5 per pusat data (4 Linux, 1 Windows) |

> **[TEMPEL GAMBAR]** Tangkapan layar halaman utama portal.
> Caption: **Gambar 4.1** Antarmuka utama aplikasi ExoVirt

### 4.1.2 Alur Provisioning

Pengguna memilih layanan pada katalog, mengisi formulir permintaan, lalu mengirimkannya. Sistem menahan permintaan tersebut pada status menunggu persetujuan. Setelah penyetuju menyetujui permintaan, sistem menjalankan Terraform untuk mengkloning template dan menyerahkan konfigurasi awal kepada cloud-init. Mesin virtual yang selesai dibangun masuk ke Inventory beserta alamat IP dan spesifikasinya.

**Tabel 4.2 Tahapan alur provisioning pada portal**

| Tahap | Pelaku | Keluaran |
|---|---|---|
| Pemilihan layanan dan pengisian formulir | Pengguna | Permintaan berstatus *Pending Approval* |
| Pemeriksaan kebijakan lingkungan | Sistem | Permintaan lolos atau ditolak |
| Persetujuan | Penyetuju | Permintaan berstatus *Approved* |
| Eksekusi Terraform | Sistem | Mesin virtual pada Proxmox VE |
| Konfigurasi awal cloud-init | Sistem | Nama host, akun, jaringan, perluasan disk |
| Pencatatan Inventory | Sistem | Baris inventaris beserta alamat IP |

> **[TEMPEL GAMBAR]** Tangkapan layar wizard permintaan (3 tahap).
> Caption: **Gambar 4.2** Formulir permintaan mesin virtual

> **[TEMPEL GAMBAR]** Tangkapan layar halaman Inventory.
> Caption: **Gambar 4.3** Daftar inventaris mesin virtual

Satu permintaan dapat menghasilkan beberapa mesin virtual sekaligus. Sistem memecah permintaan itu menjadi satu pekerjaan `ProvisionVmJob` per mesin virtual, dan setiap pekerjaan berjalan mandiri pada antrean, sebagaimana Kode 4.1. Kegagalan satu mesin virtual karena itu tidak menyeret mesin virtual lain dalam permintaan yang sama.

**Kode 4.1 Pemecahan satu permintaan menjadi satu pekerjaan per mesin virtual (`ProvisionRequestService.php`)**

```php
public function dispatchProvisioning(ProvisionRequest $pr): void
{
    foreach ($this->targetNames($pr->vm_name, (int) $pr->instance_count) as $name) {
        ProvisionVmJob::dispatch($pr->id, $name);
    }
}
```

### 4.1.3 Abstraksi Infrastructure as Code

Portal menyembunyikan seluruh sintaks Terraform dari pengguna. Pengguna memilih tier, dan sistem menuliskan nilai tersebut ke berkas `terraform.tfvars`. Berkas `main.tf` tidak berubah antar permintaan.

Kode 4.2 memperlihatkan seluruh nilai pada `main.tf` mengambil bentuk `var.*`, sehingga berkas ini tetap sama untuk setiap permintaan.

**Kode 4.2 Definisi mesin virtual pada `main.tf` yang tetap antar permintaan (dipersingkat)**

```hcl
resource "proxmox_vm_qemu" "vm" {
  name        = var.vm_name
  target_node = var.proxmox_node
  vmid        = var.vmid
  clone       = var.template_name

  cpu {
    cores   = var.cpu_cores
    sockets = 1
  }
  memory = var.ram_mb

  disk {
    slot    = "scsi0"
    size    = var.disk_size
    type    = "disk"
    storage = var.storage_id
  }

  network {
    id     = 0
    model  = "virtio"
    bridge = var.network_bridge
  }

  ipconfig0 = "ip=dhcp"
}
```

Yang berubah hanya berkas `terraform.tfvars`. Sistem menuliskan nilai hasil pemilihan pengguna menjadi pasangan kunci dan nilai HCL, sebagaimana Kode 4.3.

**Kode 4.3 Penulisan `terraform.tfvars` dari nilai hasil pemilihan (`TerraformRenderer.php`)**

```php
public function tfvars(array $values): string
{
    $lines = [];
    foreach ($values as $key => $value) {
        if ($value === null) {
            continue;
        }
        $lines[] = "{$key} = ".$this->hcl($value);
    }

    return implode("\n", $lines)."\n";
}
```

Setiap mesin virtual menempati satu *workspace* Terraform tersendiri sehingga satu kegagalan tidak menyandera permintaan lain. Ansible mengambil alih setelah Terraform selesai, terhubung memakai kunci SSH, lalu menjalankan tugas *hardening* yang bersifat idempoten.

Pembagian peran kedua alat tersebut menjawab bagian pertama Rumusan Masalah 1: Terraform memegang daur hidup mesin virtual, Ansible memegang konfigurasi di dalam sistem operasi tamu, dan pengguna tidak berhadapan dengan keduanya.

### 4.1.4 Mekanisme Tata Kelola

Sistem menerapkan kontrol akses berbasis peran, alur persetujuan, pengelolaan siklus hidup, dan pencatatan audit. Bukti pengujian keempat mekanisme tersebut dipaparkan pada subbab 4.7.

Cakupan data pada kontrol akses berlaku di lapisan kueri basis data, bukan sekadar penyembunyian menu. Kode 4.4 memperlihatkan penentuan pemilik data yang boleh dilihat: Administrator melihat seluruh data, Manager melihat anggota grup yang dikelolanya beserta dirinya, dan User hanya melihat miliknya sendiri.

**Kode 4.4 Pembatasan cakupan data menurut peran pada lapisan kueri (`User.php`)**

```php
public function visibleOwnerIds(): ?array
{
    $role = $this->role?->role_name;
    if ($role === 'Administrator') {
        return null;
    }
    if ($role === 'Manager') {
        $managedGroupIds = Group::where('manager_user_id', $this->id)->pluck('id');
        $memberIds = self::whereIn('group_id', $managedGroupIds)->pluck('id')->all();

        return array_values(array_unique([...$memberIds, $this->id]));
    }

    return [$this->id];
}
```

---

## 4.2 Pengujian Fungsional (*Black Box*)

### 4.2.1 Rancangan Pengujian

Pengujian fungsional memakai metode *black box* sebagaimana ditetapkan pada subbab 3.3.5c. Pengujian memeriksa kesesuaian antara masukan dan keluaran setiap fitur tanpa melihat struktur kode internal. Peneliti menyusun skenario berdasarkan fungsi dan *endpoint* nyata sistem, berjumlah 40 skenario yang terbagi ke dalam tujuh area.

**Tabel 4.3 Sebaran skenario pengujian *black box***

| Area | Cakupan | Jumlah skenario |
|---|---|---:|
| A | Autentikasi dan instalasi awal | 5 |
| B | Permintaan dan persetujuan | 9 |
| C | *Provisioning* dan inventaris | 6 |
| D | Siklus hidup mesin virtual | 8 |
| E | *Discovery* dan penyedia | 4 |
| F | Manajemen akses | 5 |
| G | Audit | 3 |
| **Total** | | **40** |

Skenario mencakup jalur berhasil maupun jalur ditolak. Jalur ditolak, seperti penolakan nama mesin virtual yang sudah dipakai dan penolakan penghapusan pengguna yang masih menjabat manajer grup, menguji apakah sistem menahan masukan yang tidak sah. Fungsi validasi hanya terbukti bekerja apabila sistem menolak masukan yang seharusnya ditolak.

### 4.2.2 Hasil Pengujian

Peneliti menjalankan seluruh 40 skenario pada lingkungan produksi. Hasil lengkap disajikan pada Tabel 4.4, disusun per area.

**Tabel 4.4 Hasil pengujian *black box***

*(Salin isi tabel dari lembar `bab4-blackbox-skenario.md` beserta kolom Hasil Aktual dan Status.)*

**Area A. Autentikasi dan Instalasi Awal**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| A1 | Instalasi awal (buat admin) | Akun admin terbuat, wizard mengunci diri | *(isi)* | *(isi)* |
| A2 | Login valid | Berhasil masuk, diarahkan ke dashboard | *(isi)* | *(isi)* |
| A3 | Login salah | Ditolak; percobaan berlebihan dibatasi | *(isi)* | *(isi)* |
| A4 | Logout | Sesi berakhir, kembali ke halaman login | *(isi)* | *(isi)* |
| A5 | Ganti password | Password berubah, bisa login dengan yang baru | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.4]**
> **Ambil dari:** halaman "Create Administrator" saat instalasi awal (skenario A1), atau halaman login yang menolak password salah (skenario A3).
> **Harus memperlihatkan:** formulir pembuatan akun administrator pertama. Fitur ini mengunci dirinya sendiri setelah satu pengguna terbentuk, sehingga tangkapan layarnya membuktikan sistem tidak dapat dipasang dua kali.
> **Caption:** **Gambar 4.4** Halaman instalasi awal pembuatan akun administrator

**Area B. Permintaan dan Persetujuan**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| B1 | Ajukan mesin virtual tunggal | Tersimpan, status *Pending Approval* | *(isi)* | *(isi)* |
| B2 | Ajukan mesin virtual batch | N mesin virtual terjadwal dengan sufiks `-01` sampai `-0N` | *(isi)* | *(isi)* |
| B3 | Nama mesin virtual duplikat | Ditolak dengan pesan nama sudah dipakai | *(isi)* | *(isi)* |
| B4 | Boot disk di bawah ukuran tier | Tombol Next terkunci disertai peringatan minimum | *(isi)* | *(isi)* |
| B5 | Edit permintaan | Perubahan tersimpan | *(isi)* | *(isi)* |
| B6 | Setujui permintaan | *Provisioning* berjalan | *(isi)* | *(isi)* |
| B7 | Tolak permintaan | Status menjadi *Rejected*, tidak diprovision | *(isi)* | *(isi)* |
| B8 | Kembalikan permintaan | Permintaan kembali ke pemohon | *(isi)* | *(isi)* |
| B9 | Node kapasitas kritis | Node diblokir pada wizard dan halaman persetujuan | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.5]**
> **Ambil dari:** wizard permintaan saat menolak nama mesin virtual yang sudah dipakai (skenario B3).
> **Harus memperlihatkan:** pesan penolakan beserta nama yang bentrok. Ini salah satu dari dua gambar jalur-ditolak pada subbab ini, dan membuktikan sistem menahan masukan yang tidak sah alih-alih membuat mesin virtual bernama ganda.
> **Caption:** **Gambar 4.5** Penolakan permintaan dengan nama mesin virtual yang sudah dipakai

**Area C. *Provisioning* dan Inventaris**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| C1 | *Provisioning* sukses | Mesin virtual terbuat di Proxmox, status *Active* di Inventory | *(isi)* | *(isi)* |
| C2 | Lihat daftar inventaris | Daftar mesin virtual beserta statusnya tampil | *(isi)* | *(isi)* |
| C3 | Lihat detail mesin virtual | Detail konfigurasi, IP, dan deskripsi tampil | *(isi)* | *(isi)* |
| C4 | Ungkap kredensial | Password acak tampil dan tercatat di audit | *(isi)* | *(isi)* |
| C5 | Ulangi mesin virtual gagal | *Provisioning* diulang | *(isi)* | *(isi)* |
| C6 | Sinkronisasi inventaris | Status disegarkan dari Proxmox | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.6]**
> **Ambil dari:** halaman detail satu mesin virtual pada Inventory (skenario C3).
> **Harus memperlihatkan:** status *Active*, alamat IP, dan spesifikasi konfigurasinya dalam satu layar. Gambar ini menjadi bukti bahwa Terraform selesai dan hasilnya tercatat di portal.
> **Caption:** **Gambar 4.6** Detail mesin virtual hasil *provisioning* pada Inventory

**Area D. Siklus Hidup Mesin Virtual**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| D1 | Perpanjang masa berlaku | Tanggal kedaluwarsa mundur dan tercatat | *(isi)* | *(isi)* |
| D2 | Jadikan permanen | Mesin virtual tanpa kedaluwarsa | *(isi)* | *(isi)* |
| D3 | Resize CPU dan RAM | Sumber daya berubah di Proxmox | *(isi)* | *(isi)* |
| D4 | Edit resources | Perubahan diterapkan | *(isi)* | *(isi)* |
| D5 | Tambah disk | Disk baru muncul pada mesin virtual | *(isi)* | *(isi)* |
| D6 | *Hardening* mesin virtual | *Playbook* Ansible berjalan, versi *hardening* tercatat | *(isi)* | *(isi)* |
| D7 | Hapus mesin virtual | Mesin virtual dihancurkan di Proxmox, status *Deleted* | *(isi)* | *(isi)* |
| D8 | Kedaluwarsa otomatis | Masuk masa tenggang, lalu dihancurkan otomatis dan tercatat | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.7]**
> **Ambil dari:** halaman Inventory setelah *hardening* selesai (skenario D6).
> **Harus memperlihatkan:** status *hardening* beserta versi *playbook* yang dipakai. Gambar ini membuktikan Ansible mengambil alih setelah Terraform, sesuai pembagian peran pada subbab 4.1.3, dan menutup bagian "Ansible" pada Rumusan Masalah 1.
> **Caption:** **Gambar 4.7** Status *hardening* mesin virtual setelah eksekusi *playbook* Ansible

**Area E. *Discovery* dan Penyedia**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| E1 | Tambah penyedia dan uji koneksi | Status *Connected* | *(isi)* | *(isi)* |
| E2 | Jalankan *discovery* | Node, template, jaringan, dan datastore terdeteksi | *(isi)* | *(isi)* |
| E3 | Penyedia terputus | Katalog dan jaringannya menjadi abu dan hilang dari wizard | *(isi)* | *(isi)* |
| E4 | Publikasi sumber daya | Tersimpan dan muncul di wizard | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.8]**
> **Ambil dari:** hasil Run Discovery pada satu penyedia (skenario E2).
> **Harus memperlihatkan:** daftar node, template, jaringan, dan datastore yang sistem temukan sendiri dari Proxmox. Gambar ini membuktikan administrator tidak mengetik ulang inventaris infrastruktur secara manual.
> **Caption:** **Gambar 4.8** Hasil *discovery* sumber daya dari penyedia Proxmox VE

**Area F. Manajemen Akses**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| F1 | CRUD pengguna | Perubahan tersimpan | *(isi)* | *(isi)* |
| F2 | CRUD peran | Hak akses sesuai peran | *(isi)* | *(isi)* |
| F3 | CRUD grup | Perubahan tersimpan | *(isi)* | *(isi)* |
| F4 | Proteksi penghapusan | Ditolak disertai alasan | *(isi)* | *(isi)* |
| F5 | Batasan environment | Hanya sumber daya yang diizinkan muncul | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.9]**
> **Ambil dari:** penolakan penghapusan pengguna yang masih menjabat manajer grup (skenario F4).
> **Harus memperlihatkan:** pesan penolakan beserta alasannya. Ini gambar jalur-ditolak kedua, dan membuktikan sistem menjaga keutuhan relasi data alih-alih menghapus pengguna yang masih dirujuk grup.
> **Caption:** **Gambar 4.9** Penolakan penghapusan pengguna yang masih menjabat manajer grup

**Area G. Audit**

| No | Skenario | Hasil Diharapkan | Hasil Aktual | Status |
|---|---|---|---|:---:|
| G1 | Lihat jejak audit | Aktivitas tercatat beserta pelaku, aksi, dan waktunya | *(isi)* | *(isi)* |
| G2 | Filter audit | Hasil sesuai filter | *(isi)* | *(isi)* |
| G3 | Ekspor CSV | Berkas CSV terunduh beserta kolom metadata | *(isi)* | *(isi)* |

> **[TEMPEL GAMBAR 4.10]**
> **Ambil dari:** menu Audit dengan filter aktif pada satu `vmid` atau satu environment (skenario G2).
> **Harus memperlihatkan:** kolom pelaku, aksi, dan waktu, dengan hasil yang menyempit sesuai filter. Filter yang bekerja membuktikan jejak audit dapat ditelusuri, bukan sekadar tertimbun. Gambar ini menopang Rumusan Masalah 2 dan berbeda dari Gambar 4.30 yang menampilkan tiga baris audit satu proses *provisioning* secara utuh.
> **Caption:** **Gambar 4.10** Penelusuran jejak audit menggunakan filter

### 4.2.3 Rekapitulasi

Persentase keberhasilan dihitung dengan membagi jumlah skenario yang lolos dengan total skenario yang diuji, lalu dikali 100.

**Tabel 4.5 Rekapitulasi hasil pengujian *black box***

| Area | Cakupan | Skenario | Lolos | Gagal | Persentase |
|---|---|---:|---:|---:|---:|
| A | Autentikasi dan instalasi awal | 5 | *(isi)* | *(isi)* | *(isi)* |
| B | Permintaan dan persetujuan | 9 | *(isi)* | *(isi)* | *(isi)* |
| C | *Provisioning* dan inventaris | 6 | *(isi)* | *(isi)* | *(isi)* |
| D | Siklus hidup mesin virtual | 8 | *(isi)* | *(isi)* | *(isi)* |
| E | *Discovery* dan penyedia | 4 | *(isi)* | *(isi)* | *(isi)* |
| F | Manajemen akses | 5 | *(isi)* | *(isi)* | *(isi)* |
| G | Audit | 3 | *(isi)* | *(isi)* | *(isi)* |
| **Total** | | **40** | *(isi)* | *(isi)* | *(isi)* |

*(Narasi setelah tabel terisi: sebutkan persentase keberhasilan total, lalu bahas skenario yang gagal apabila ada. Skenario gagal ditulis apa adanya beserta sebabnya, dan tidak dihapus dari tabel.)*

---

## 4.3 Pengujian Efisiensi *Provisioning* (Hipotesis 1)

### 4.3.1 Lingkungan Pengujian

Pengujian efisiensi berjalan pada satu node Proxmox VE bernama `pve` versi 9.1.11. Mesin virtual uji lahir dari template `rhel10-cloud` (VMID 9003), salah satu dari lima *golden image* pada lingkungan penelitian.

**Tabel 4.6 Lingkungan pengujian efisiensi**

| Komponen | Spesifikasi |
|---|---|
| Platform virtualisasi | Proxmox VE 9.1.11 |
| Node | `pve` |
| Template | `rhel10-cloud` (VMID 9003), disk 10 GB |
| Datastore | `local`, `local-lvm`, `vmdata` |
| Tier | Bronze (1 vCPU, 2 GB RAM, 40 GB disk) |
| Mesin virtual kelompok manual | `manual-1` sampai `manual-10` (VMID 101–110) |
| Mesin virtual kelompok portal | `PROVE-1` sampai `PROVE-10` (VMID 100–109) |
| Spesifikasi host | *(isi dari pve → Summary)* |

### 4.3.2 Variabel Kontrol

Kedua kelompok memakai template, tier, mode kloning, dan konfigurasi jaringan yang sama. Penyamaan ini menutup kemungkinan perbedaan waktu berasal dari sumber lain di luar antarmuka yang dibandingkan.

Template `rhel10-cloud` sudah disetel ke spesifikasi tier Bronze sejak awal, sehingga prosedur manual tidak memerlukan langkah pengaturan CPU maupun RAM. Kondisi ini merupakan keputusan desain eksperimen, dan konsekuensinya dibahas pada subbab 4.4.5.

Mode kloning terkunci pada Full Clone karena portal menetapkan `full_clone = true` pada berkas `main.tf`. Link Clone hanya membuat lapisan pembeda sehingga selesai nyaris seketika, dan memakainya pada kelompok manual berarti mengadu jalan pintas melawan salinan penuh.

**Tabel 4.7 Variabel kontrol pengujian**

| Variabel | Nilai | Alasan penguncian |
|---|---|---|
| Template | `rhel10-cloud` (10 GB) | Sama di kedua kelompok |
| Tier | Bronze (1 vCPU / 2 GB / 40 GB) | Spesifikasi keluaran identik |
| Mode kloning | Full Clone | Portal memakai `full_clone = true` |
| Alamat IP | DHCP | Sesuai cloud-init mesin virtual buatan portal |
| *Upgrade packages* | Nonaktif | Mesin virtual buatan portal keluar dalam keadaan nonaktif |
| Node, jaringan, datastore | Sama | Menghilangkan variasi infrastruktur |
| Operator | Sama | Menghilangkan variasi keterampilan |

> **[TEMPEL GAMBAR]** Settings → Tier pada portal (Bronze = 1 vCPU / 2 GB / 40 GB).
> Caption: **Gambar 4.11** Spesifikasi tier Bronze pada portal ExoVirt

> **[TEMPEL GAMBAR]** Tab Hardware template `rhel10-cloud` (VMID 9003).
> Caption: **Gambar 4.12** Konfigurasi template `rhel10-cloud` sebagai *baseline* pengujian

### 4.3.3 Ruang Lingkup Waktu yang Diuji

Hipotesis 1 membandingkan antarmuka aplikasi dengan antarmuka Proxmox VE bawaan. Yang masuk uji beda karena itu hanya waktu yang ditimbulkan alat, bukan waktu keputusan manusia. Penelitian ini memecah waktu *provisioning* pada portal menjadi tiga segmen.

**Tabel 4.8 Segmen waktu *provisioning***

| Segmen | Portal | Manual | Masuk uji H1 |
|---|---|---|:---:|
| `t1` interaksi pengguna | Katalog terbuka sampai Submit | Tercakup dalam `t_manual` | Ya |
| `t2` tunggu persetujuan | Submit sampai Approve | Mengendap di administrator | **Tidak** |
| `t3` eksekusi otomatis | Approve sampai alamat IP muncul | Tercakup dalam `t_manual` | Ya |

Angka yang diuji pada kelompok portal adalah `t1 + t3`. Segmen `t2` keluar dari uji beda dan dilaporkan pada subbab 4.7.2 sebagai karakteristik tata kelola.

Tiga alasan mendasari pengeluaran `t2`. Pertama, persetujuan sudah ada pada alur manual dalam bentuk tiket atau surat elektronik kepada administrator, hanya saja informal dan tidak terekam. Portal memformalkan langkah itu, tidak menambahkannya. Kedua, lama persetujuan bergantung pada kapan penyetuju membuka portal, sehingga mengukur kesigapan orang dan bukan mutu sistem. Ketiga, pengeluaran ini menguntungkan kelompok manual. Waktu tunggu manual yang sesungguhnya berjalan dalam hitungan jam sampai hari, sebagaimana terlihat pada beban 120 tiket dalam dua bulan yang ditangani dua administrator, sedangkan rentang 5 sampai 20 menit pada Bab I merupakan waktu kerja administrator dan bukan waktu tunggu pengguna.

Penugasan aktor pada kedua kelompok tidak simetris. Pengguna biasa menjalankan kelompok portal, administrator berhak penuh menjalankan kelompok manual. Asimetri ini disengaja dan menempatkan kelompok manual pada kondisi terbaiknya. Organisasi tidak memberikan hak Proxmox VE kepada pengguna biasa, dan keputusan tersebut bersifat kebijakan, bukan keterbatasan teknis. Subbab 4.6.1 memperlihatkan bahwa pengguna biasa yang diberi hak tersebut memang mampu menjalankan *provisioning* manual, sehingga alasan ketiadaan haknya terletak pada tata kelola: Proxmox VE tidak menyediakan jalan tengah antara tidak memiliki akses sama sekali dan memiliki hak membuat serta menghapus mesin virtual tanpa persetujuan, kuota, maupun jejak audit.

### 4.3.4 Definisi Operasional Jumlah Langkah

Tabel 3.4 menyebut indikator jumlah langkah tanpa mendefinisikannya. Penelitian ini memakai definisi berikut: satu langkah adalah satu aksi wajib pengguna yang memberi masukan, membuat keputusan, atau memajukan proses.

Yang dihitung sebagai satu langkah: mengisi satu *field* (mengetik `manual-01` dihitung 1, bukan 9 ketukan), memilih satu opsi *dropdown* atau *checkbox*, klik kanan lalu memilih menu, menekan tombol eksekusi seperti OK, Clone, atau Start, dan klik navigasi wajib seperti pindah tab atau menekan tombol Edit.

Yang tidak dihitung: proses masuk, menggulir layar, menempatkan kursor, menutup *popup*, menunggu pemuatan, dan membaca halaman verifikasi.

Definisi ini berlaku sama pada kedua kelompok.

### 4.3.5 Prosedur Kelompok Manual

Prosedur manual terdiri atas 23 langkah, dihitung sejak klik kanan pada template sampai penekanan tombol Start.

**Tabel 4.9 Rincian langkah *provisioning* manual melalui Proxmox VE GUI**

| No | Aksi |
|---:|---|
| 1 | Klik kanan template, pilih Clone (**stopwatch mulai**) |
| 2 | Mengisi Name |
| 3 | Memilih Mode = Full Clone |
| 4 | Menekan tombol Clone |
| 5 | Membuka tab Cloud-Init |
| 6 | Menekan Edit pada User |
| 7 | Mengisi username |
| 8 | Menekan OK |
| 9 | Menekan Edit pada Password |
| 10 | Mengisi password |
| 11 | Menekan OK |
| 12 | Menekan Edit pada Upgrade packages |
| 13 | Menonaktifkan Upgrade packages |
| 14 | Menekan OK |
| 15 | Menekan Edit pada IP Config |
| 16 | Memilih DHCP |
| 17 | Menekan OK |
| 18 | Membuka tab Hardware |
| 19 | Memilih Hard Disk, membuka Disk Action |
| 20 | Menekan Resize |
| 21 | Mengisi *increment* = 30 |
| 22 | Menekan Resize disk |
| 23 | Menekan Start (**stopwatch berhenti saat alamat IP muncul**) |

Proses masuk ke Proxmox VE tidak dihitung, baik waktunya maupun langkahnya, karena merupakan autentikasi yang bentuknya sama pada kedua kelompok. Kelompok portal juga dimulai setelah proses masuk, yaitu saat katalog terbuka.

Penggantian kata sandi paksa, uji masuk melalui Putty, dan pengungkapan kata sandi berada di luar jendela pengukuran. Ketiganya merupakan perilaku template `sysuser` yang terjadi identik pada kedua kelompok. Memasukkannya hanya ke satu kelompok akan membebani kelompok tersebut dengan pekerjaan yang tidak dibebankan kepada kelompok pembanding.

Nonaktifnya *Upgrade packages* pada langkah 12 sampai 14 mengikuti keluaran portal. Mesin virtual buatan portal keluar dengan opsi tersebut nonaktif, sedangkan hasil kloning manual datang dengan opsi aktif, sehingga kelompok manual memerlukan tiga klik tambahan untuk menyamainya. Membiarkannya aktif akan menjalankan `dnf upgrade` pada boot pertama, membuat waktu bergantung pada kondisi jaringan dan menghasilkan susunan paket yang berbeda.

> **[TEMPEL GAMBAR]** Dialog Clone (memperlihatkan Name dan Mode = Full Clone).
> Caption: **Gambar 4.13** Dialog Clone pada Proxmox VE

> **[TEMPEL GAMBAR]** Tab Cloud-Init `manual-10`.
> Caption: **Gambar 4.14** Konfigurasi Cloud-Init pada mesin virtual kelompok manual

> **[TEMPEL GAMBAR]** Dialog Resize dengan label **Size Increment (GiB)** terbaca jelas.
> Caption: **Gambar 4.15** Dialog Resize pada Proxmox VE dengan label Size Increment (GiB)

### 4.3.6 Prosedur Kelompok Portal

Prosedur portal terdiri atas 10 langkah bagi pengguna, dihitung sejak pemilihan tier pada kartu katalog sampai penekanan tombol kirim pada modal konfirmasi.

**Tabel 4.10 Rincian langkah *provisioning* melalui portal ExoVirt**

| No | Aksi | Tahap |
|---:|---|---|
| 1 | Memilih tier pada *dropdown* kartu katalog (**stopwatch mulai**) | Katalog |
| 2 | Memilih Environment | 1 |
| 3 | Menekan Next | 1 |
| 4 | Mengisi nama mesin virtual | 2 |
| 5 | Mengisi kolom Jumlah | 2 |
| 6 | Memilih Network | 2 |
| 7 | Memilih Datastore | 2 |
| 8 | Menekan Next | 2 |
| 9 | Menekan Submit | 3 |
| 10 | Menekan Submit pada modal konfirmasi (**stopwatch berhenti**) | 3 |

Pemilihan tier pada kartu katalog membawa pengguna langsung ke formulir permintaan dan mengisi otomatis empat pilihan, yaitu penyedia, node, katalog, dan tier, sepanjang kebijakan lingkungan mengizinkannya. Environment, Network, dan Datastore tetap dipilih pengguna.

Langkah penyetuju dicatat terpisah dan berjumlah 4, yaitu membuka menu Approvals, menekan Approve, mengisi deskripsi, dan menekan Approve pada dialog. Kedua angka tersebut tidak dijumlahkan. Prosedur manual mengerjakan seluruh langkah dengan satu orang, sedangkan portal membagi pekerjaan kepada dua peran, sehingga penjumlahan akan mengarang beban kerja yang tidak dialami siapa pun.

Titik berhenti pengukuran `t3` ditetapkan pada saat alamat IP terbaca di halaman Summary Proxmox VE, bukan pada saat status Inventory berubah menjadi *Active*. Berkas `ProvisionVmJob.php` menetapkan status *Active* tepat setelah `terraform apply` selesai, dan pada saat itu sistem operasi tamu masih melakukan boot sehingga alamat IP belum tentu tersedia. Berhenti pada status *Active* akan menghentikan pengukuran portal lebih awal daripada pengukuran manual, dan bias tersebut searah dengan hipotesis. Alamat IP yang tampil pada Inventory portal juga ditolak sebagai titik berhenti karena memuat tunda sinkronisasi dan interval *polling* antarmuka, yang justru membebani portal dengan latensi pembukuan. Halaman Summary Proxmox VE mengamati peristiwa fisik yang sama dengan alat yang sama pada kedua kelompok.

> **[TEMPEL GAMBAR]** Kartu katalog dengan *dropdown* tier.
> Caption: **Gambar 4.16** Titik masuk *provisioning* melalui katalog layanan

> **[TEMPEL GAMBAR]** Wizard permintaan, memperlihatkan pengguna hanya memilih tier tanpa akses ke template.
> Caption: **Gambar 4.17** Formulir permintaan tanpa jalur menuju template

### 4.3.7 Hasil Pengukuran

Sepuluh percobaan berjalan berurutan pada tiap kelompok dengan operator yang sama dan variabel kontrol pada Tabel 4.7.

**Tabel 4.11 Hasil pengukuran kelompok manual**

| Percobaan | Mesin virtual (VMID) | Jumlah langkah | `t_manual` (detik) | Disk hasil verifikasi |
|---:|---|---:|---:|:---:|
| 1 | manual-1 (101) | 23 | 175 | 40 GB |
| 2 | manual-2 (102) | 23 | 146 | 40 GB |
| 3 | manual-3 (103) | 23 | 138 | 40 GB |
| 4 | manual-4 (104) | 23 | 150 | 40 GB |
| 5 | manual-5 (105) | 23 | 130 | 40 GB |
| 6 | manual-6 (106) | 23 | 129 | 40 GB |
| 7 | manual-7 (107) | 23 | 128 | 40 GB |
| 8 | manual-8 (108) | 23 | 121 | 40 GB |
| 9 | manual-9 (109) | 23 | 123 | 40 GB |
| 10 | manual-10 (110) | 23 | 129 | 40 GB |
| **Rata-rata** | | **23** | **136,90** | **10/10 sesuai** |

**Tabel 4.12 Hasil pengukuran kelompok portal**

| Percobaan | Mesin virtual (VMID) | Langkah pengguna | `t1` (detik) | `t3` (detik) | `t1+t3` (detik) |
|---:|---|---:|---:|---:|---:|
| 1 | PROVE-1 (100) | 10 | 13 | 97 | **110** |
| 2 | PROVE-2 (101) | 10 | 12 | 85 | **97** |
| 3 | PROVE-3 (102) | 10 | 11 | 83 | **94** |
| 4 | PROVE-4 (103) | 10 | 10 | 87 | **97** |
| 5 | PROVE-5 (104) | 10 | 12 | 83 | **95** |
| 6 | PROVE-6 (105) | 10 | 11 | 84 | **95** |
| 7 | PROVE-7 (106) | 10 | 11 | 99 | **110** |
| 8 | PROVE-8 (107) | 10 | 10 | 87 | **97** |
| 9 | PROVE-9 (108) | 10 | 11 | 84 | **95** |
| 10 | PROVE-10 (109) | 10 | 11 | 87 | **98** |
| **Rata-rata** | | **10** | **11,20** | **87,60** | **98,80** |

Segmen `t1` menyumbang 11,20 detik dari total 98,80 detik, atau 11,3 %. Sisanya sebesar 88,7 % merupakan `t3`, yaitu waktu Terraform bekerja dan sistem operasi tamu melakukan boot. Pembagian ini dibahas kembali pada subbab 4.8.6.

**Tabel 4.13 Bukti silang stopwatch terhadap Audit Trail**

| Percobaan | `t3` stopwatch (detik) | Durasi Terraform dari audit (detik) | Selisih Δ `Active` → IP (detik) |
|---:|---:|---:|---:|
| 1 | 97 | 90 | +7 |
| 2 | 85 | 75 | +10 |
| 3 | 83 | 79 | +4 |
| 4 | 87 | 81 | +6 |
| 5 | 83 | 77 | +6 |
| 6 | 84 | 79 | +5 |
| 7 | 99 | 92 | +7 |
| 8 | 87 | 85 | +2 |
| 9 | 84 | 80 | +4 |
| 10 | 87 | 80 | +7 |
| **Rata-rata** | **87,60** | **81,80** | **+5,80** |

*Durasi Terraform dihitung dari selisih timestamp `CREATE_VM` dan `APPROVE_REQUEST` pada Audit Trail.*

Tabel 4.14 membuktikan bahwa titik berhenti pengukuran memang berada setelah status *Active*, bukan pada status *Active*. Pada kesepuluh percobaan, nilai `t3` selalu melampaui durasi Terraform dengan selisih 2 sampai 10 detik. Baris audit `CREATE_VM` terbit tepat saat `terraform apply` kembali, yaitu momen yang sama dengan penetapan status *Active*. Seandainya peneliti menghentikan stopwatch pada status *Active*, nilai `t3` akan setara atau berada di bawah durasi Terraform. Dua alat yang tidak saling mengetahui, yaitu stopwatch di tangan peneliti dan `created_at` di basis data server, saling mengunci.

Selisih rata-rata 5,80 detik antara status *Active* dan kemunculan alamat IP merupakan temuan tersendiri. Portal menyalakan status *Active* rata-rata 5,80 detik sebelum mesin virtual benar-benar dapat dimasuki, sehingga pengguna yang langsung melakukan SSH setelah melihat status tersebut akan gagal. Bab V membahas penyempurnaannya.

Durasi Terraform bernilai rata-rata 81,80 detik dengan simpangan baku 5,51 detik dan rentang 75 sampai 92 detik. Kestabilan ini menunjukkan tidak ada dua *apply* yang berjalan bersamaan sepanjang seri.

**Tabel 4.14 Statistik deskriptif waktu *provisioning***

| Statistik | Kelompok portal (`t1+t3`) | Kelompok manual (`t_manual`) |
|---|---:|---:|
| n | 10 | 10 |
| Rata-rata | 98,80 detik | 136,90 detik |
| Median | 97,00 detik | 129,50 detik |
| Simpangan baku | 6,03 detik | 16,35 detik |
| Koefisien variasi | 6,11 % | 11,94 % |
| Minimum | 94 detik | 121 detik |
| Maksimum | 110 detik | 175 detik |

Rata-rata waktu kelompok portal lebih rendah 38,10 detik atau 27,83 % dibanding kelompok manual. Berdasarkan median, selisihnya 32,50 detik atau 25,10 %. Kedua kelompok tidak beririsan sama sekali: nilai maksimum kelompok portal, yaitu 110 detik, masih berada di bawah nilai minimum kelompok manual, yaitu 121 detik.

Koefisien variasi kelompok portal sebesar 6,11 % berbanding 11,94 % pada kelompok manual menunjukkan sebaran waktu portal yang lebih rapat.

> **[TEMPEL GAMBAR]** Summary salah satu VM portal memperlihatkan alamat IP.
> Caption: **Gambar 4.18** Titik berhenti pengukuran pada halaman Summary Proxmox VE

### 4.3.8 Uji Normalitas

**Tabel 4.15 Hasil uji normalitas Shapiro-Wilk**

| Kelompok | W | p | Kesimpulan |
|---|---:|---:|---|
| Portal (`t1+t3`) | 0,6871 | 0,0006 | Tidak normal |
| Manual (`t_manual`) | 0,8370 | 0,0407 | Tidak normal |

Kedua kelompok menghasilkan p di bawah 0,05 sehingga sebarannya menyimpang dari normal. Uji beda Hipotesis 1 karena itu memakai jalur non-parametrik sebagaimana disiapkan pada subbab 3.3.5d.

Uji non-parametrik yang berlaku di sini adalah **uji Mann-Whitney U**, yang juga dikenal sebagai *Wilcoxon rank-sum test*. Kelompok portal dan kelompok manual merupakan dua kelompok yang saling bebas, sehingga uji *Wilcoxon signed-rank* yang diperuntukkan bagi data berpasangan tidak berlaku.

> **[TEMPEL GAMBAR]** Output SPSS atau Jamovi uji Shapiro-Wilk kedua kelompok.
> Caption: **Gambar 4.19** Hasil uji normalitas Shapiro-Wilk
> *(Angka W dan p di atas berasal dari perhitungan pendahuluan. Jalankan ulang di SPSS atau Jamovi dan pakai angka dari sana.)*

### 4.3.9 Uji Beda Mann-Whitney U

**Tabel 4.16 Hasil uji Mann-Whitney U**

| Ukuran | Nilai |
|---|---:|
| n kelompok portal | 10 |
| n kelompok manual | 10 |
| U | 0 |
| p (eksak, dua sisi) | 1,08 × 10⁻⁵ |
| Taraf signifikansi | 0,05 |

Nilai p berada jauh di bawah 0,05 sehingga **H0 ditolak dan H1 diterima**. Terdapat perbedaan efisiensi yang signifikan antara aplikasi yang dikembangkan dan antarmuka Proxmox VE bawaan dalam proses *provisioning* mesin virtual.

Nilai U sebesar 0 muncul karena kedua kelompok tidak memiliki satu pun nilai yang beririsan. Seluruh pengukuran portal menempati peringkat lebih rendah daripada seluruh pengukuran manual.

> **[TEMPEL GAMBAR]** Output SPSS atau Jamovi uji Mann-Whitney U.
> Caption: **Gambar 4.20** Hasil uji beda Mann-Whitney U pada variabel waktu *provisioning*

### 4.3.10 Perbandingan Jumlah Langkah

Jumlah langkah bernilai tetap pada seluruh percobaan di kedua kelompok, yaitu 23 pada kelompok manual dan 10 pada kelompok portal. Simpangan bakunya nol pada kedua kelompok. Angka ini merupakan hitungan prosedur yang bersifat deterministik, sehingga penelitian ini melaporkannya sebagai tabel perbandingan dan tidak menguji bedanya secara statistik.

**Tabel 4.17 Perbandingan jumlah langkah**

| Kelompok | Langkah pengguna | Langkah penyetuju | Simpangan baku | Penurunan |
|---|---:|---:|---:|---:|
| Manual (Proxmox VE GUI) | 23 | 0 | 0 | |
| Portal (ExoVirt) | 10 | 4 | 0 | **56,52 %** |

Penurunan jumlah langkah sebesar 56,52 % memenuhi indikator keberhasilan pada subbab 3.3.5c.

### 4.3.11 *Provisioning* Batch

Portal menyediakan kolom Jumlah yang memungkinkan satu permintaan menghasilkan beberapa mesin virtual sekaligus. Proxmox VE tidak menyediakan fungsi setara. Penelitian ini menjalankan satu percobaan batch dengan N = 10 setelah sepuluh percobaan pokok selesai.

**Tabel 4.18 Hasil percobaan *provisioning* batch**

| Ukuran | Portal | Manual |
|---|---:|---:|
| Jumlah mesin virtual | 10 | 10 |
| Keberhasilan | 10/10 | |
| Jumlah langkah pengguna | 10 | 230 |
| `t1` | 12 detik | |
| Waktu total | 333 detik | 1.369 detik (ekstrapolasi) |

Angka 1.369 detik pada kolom manual merupakan **ekstrapolasi** dari 136,90 detik dikali 10, bukan hasil pengukuran. Penelitian ini tidak menjalankan sepuluh percobaan manual berturut-turut sebagai satu blok.

Temuan pokok percobaan ini terletak pada jumlah langkah. Langkah portal bernilai **tetap 10** baik untuk satu mesin virtual maupun sepuluh, karena yang berubah hanya angka pada kolom Jumlah. Langkah manual tumbuh linear menjadi 230. Selisihnya 56,52 % pada satu mesin virtual dan 95,65 % pada sepuluh mesin virtual.

Hasil batch merupakan **perbedaan kemampuan, bukan perbedaan efisiensi**, dan penelitian ini melaporkannya berdampingan dengan hasil per unit tanpa menggantikannya. Indikator penurunan waktu pada subbab 3.3.5c menilai satuan per mesin virtual, sehingga angka batch tidak dipakai untuk mengklaim pencapaian indikator tersebut.

Terraform menyelesaikan sepuluh *apply* dalam tiga gelombang berpola 4, 4, dan 2 dengan durasi 114, 107, dan 94 detik. Pola tersebut memperlihatkan empat *worker* antrean bekerja bersamaan. Durasi per *apply* memang melambat saat berbarengan, dari 81,80 detik sendirian menjadi sekitar 110 detik, namun keluarannya berlipat empat sehingga *throughput* tetap menang.

> **[TEMPEL GAMBAR]** Wizard dengan kolom Jumlah = 10.
> Caption: **Gambar 4.21** Formulir permintaan batch pada portal

> **[TEMPEL GAMBAR]** Sidebar Inventory memperlihatkan 10 mesin virtual `BULK-01` sampai `BULK-10`.
> Caption: **Gambar 4.22** Hasil *provisioning* batch pada Inventory

### 4.3.12 Efek Belajar

Waktu percobaan pada kelompok manual menurun seiring pengulangan, sedangkan waktu kelompok portal mendatar.

**Tabel 4.19 Perbandingan efek belajar antar kelompok**

| Ukuran | Kelompok manual | Kelompok portal |
|---|---:|---:|
| Korelasi Spearman (urutan terhadap waktu) | −0,857 (p = 0,0015) | +0,0062 (p = 0,8405) |
| Kemiringan regresi | −4,41 detik per percobaan | mendatar |
| Rata-rata percobaan 1–5 | 147,80 detik | 98,60 detik |
| Rata-rata percobaan 6–10 | 126,00 detik | 99,00 detik |
| Percobaan 1 dibanding percobaan 10 | 175 → 129 detik (−26,3 %) | 110 → 98 detik |

Kelompok manual mencapai kondisi mantap pada kisaran 121 sampai 130 detik sejak percobaan kelima. Sepuluh data tetap dipakai seluruhnya. Percobaan pertama memang terhitung *outlier* ringan menurut pagar Tukey pada 167,6 detik, dan membuangnya akan membuat sebaran menjadi normal. Percobaan tersebut merupakan pengukuran yang sah: prosedurnya benar dan hasil disknya benar. Membuang data setelah mengetahui hasilnya, demi memenuhi syarat uji parametrik, akan mencederai keabsahan pengujian.

Portal tidak memperlihatkan kurva belajar karena 88,7 % waktunya merupakan waktu mesin, yaitu 87,60 detik dari 98,80 detik. Mesin tidak bertambah mahir. Temuan ini memberi makna pada kedua angka: 136,90 detik merupakan capaian administrator berhak penuh yang sekaligus pengembang sistem setelah sepuluh kali pengulangan, sedangkan 98,80 detik merupakan capaian siapa pun sejak percobaan pertama. Operator manual yang baru pertama kali menjalankan prosedur membutuhkan 175 detik.

---

## 4.4 Pengujian Konsistensi Konfigurasi (Hipotesis 2)

### 4.4.1 Spesifikasi Acuan

Penelitian ini menilai kesesuaian konfigurasi terhadap spesifikasi tier Bronze yang berlaku pada portal, yaitu 1 vCPU, 2 GB memori, dan 40 GB disk, ditambah alamat IP dari DHCP dan nama host yang mengikuti nama mesin virtual. Lima parameter tersebut diperiksa pada setiap mesin virtual, sehingga tiap kelompok menyumbang 50 parameter.

Status *hardening* tidak masuk sebagai parameter. Berkas `ProvisionVmJob.php` menetapkan bahwa *hardening* bukan pilihan saat *provisioning* melainkan aksi Inventory tersendiri, sehingga mesin virtual baru lahir dengan status `Not Hardened`. Pada titik pengukuran, mesin virtual dari kedua kelompok sama-sama belum melalui proses *hardening*.

### 4.4.2 Hasil Kelompok Manual

**Tabel 4.20 Kesesuaian konfigurasi mesin virtual kelompok manual**

| Mesin virtual (VMID) | CPU | RAM | Disk | IP | Hostname | Sesuai |
|---|:---:|:---:|:---:|---|:---:|:---:|
| manual-1 (101) | ✓ | ✓ | ✓ | 192.168.200.82 | ✓ | Ya |
| manual-2 (102) | ✓ | ✓ | ✓ | 192.168.200.84 | ✓ | Ya |
| manual-3 (103) | ✓ | ✓ | ✓ | 192.168.200.85 | ✓ | Ya |
| manual-4 (104) | ✓ | ✓ | ✓ | 192.168.200.86 | ✓ | Ya |
| manual-5 (105) | ✓ | ✓ | ✓ | 192.168.200.87 | ✓ | Ya |
| manual-6 (106) | ✓ | ✓ | ✓ | 192.168.200.88 | ✓ | Ya |
| manual-7 (107) | ✓ | ✓ | ✓ | 192.168.200.89 | ✓ | Ya |
| manual-8 (108) | ✓ | ✓ | ✓ | 192.168.200.90 | ✓ | Ya |
| manual-9 (109) | ✓ | ✓ | ✓ | 192.168.200.91 | ✓ | Ya |
| manual-10 (110) | ✓ | ✓ | ✓ | 192.168.200.92 | ✓ | Ya |
| **Kesesuaian** | 100% | 100% | 100% | 100% | 100% | **100%** |

Seluruh 50 parameter pada 10 mesin virtual sesuai spesifikasi.

Pemeriksaan meluas sampai ke dalam sistem operasi tamu untuk memastikan disk 40 GB benar-benar terpakai. Perintah `df -h` pada `manual-9` menunjukkan `/dev/sda3` berukuran 40 GB terpasang pada `/`, dan `lsblk` menegaskan `sda` 40 GB dengan partisi `sda3` sebesar 39,8 GB. Perintah `hostname` mengembalikan `manual-9`.

Pemeriksaan ini perlu karena tab Hardware hanya membuktikan ukuran disk virtual. Seandainya perluasan partisi oleh cloud-init gagal, disk akan tercatat 40 GB sementara partisi akar tetap 10 GB, dan mesin virtual tetap menyala tanpa menampilkan pesan kesalahan apa pun.

> **[TEMPEL GAMBAR]** Tab Hardware salah satu VM manual.
> Caption: **Gambar 4.23** Konfigurasi perangkat keras mesin virtual kelompok manual
> *(Sembilan tangkapan layar Hardware lainnya diletakkan pada Lampiran.)*

> **[TEMPEL GAMBAR]** Console `manual-9` berisi `df -h`, `lsblk`, dan `hostname`.
> Caption: **Gambar 4.24** Verifikasi perluasan partisi dan nama host dari dalam sistem operasi tamu

### 4.4.3 Hasil Kelompok Portal

Sumber data kelompok portal adalah keluaran perintah `qm config` pada node `pve`, bukan tampilan Inventory portal. Inventory merupakan laporan sistem tentang dirinya sendiri, sedangkan `qm config` membaca konfigurasi dari hypervisor. Pemilihan sumber ini menyetarakan bukti kelompok portal dengan tab Hardware pada kelompok manual.

**Tabel 4.21 Kesesuaian konfigurasi mesin virtual kelompok portal**

| Mesin virtual (VMID) | `vcpus` | `memory` | `scsi0` | `ipconfig0` | Hostname | Sesuai |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| PROVE-1 (100) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-2 (101) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-3 (102) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-4 (103) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-5 (104) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-6 (105) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-7 (106) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-8 (107) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-9 (108) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| PROVE-10 (109) | 1 | 2048 | 40G | dhcp | ✓ | Ya |
| **Kesesuaian** | 100% | 100% | 100% | 100% | 100% | **100%** |

Seluruh 50 parameter pada 10 mesin virtual sesuai spesifikasi. Kesepuluh mesin virtual memperoleh alamat IP, dan sepuluh angka `t3` pada Tabel 4.12 merupakan buktinya, karena pengukuran `t3` berhenti tepat saat alamat IP muncul.

Keluaran `qm config` menampilkan `cores: 8` pada mesin virtual buatan portal. Angka tersebut bukan penyimpangan. Berkas `ResourceResolutionService.php` menetapkan `cores` sebagai plafon topologi CPU, yaitu nilai terbesar antara konfigurasi `VM_MAX_CPU_CORES` dan CPU tier, sedangkan `vcpus` menetapkan jumlah CPU yang aktif. Plafon tersebut merupakan syarat *hotplug* CPU tanpa reboot. Parameter yang mengikat Hipotesis 2 adalah `vcpus`, dan perintah `lscpu` di dalam sistem operasi tamu mengembalikan `CPU(s): 1`.

> **[TEMPEL GAMBAR]** Keluaran `qm config` salah satu VM portal.
> Caption: **Gambar 4.25** Konfigurasi mesin virtual kelompok portal pada hypervisor

### 4.4.4 Keputusan Hipotesis

**Tabel 4.22 Perbandingan konsistensi konfigurasi**

| Kelompok | Parameter diperiksa | Sesuai | Kesesuaian | Simpangan baku |
|---|---:|---:|---:|---:|
| Manual (Proxmox VE GUI) | 50 | 50 | 100 % | 0 |
| Portal (ExoVirt) | 50 | 50 | 100 % | 0 |

Kedua kelompok mencapai kesesuaian 100 % tanpa satu pun *configuration drift*. **H0 tidak ditolak.** Penelitian ini tidak menemukan perbedaan konsistensi konfigurasi yang signifikan antara aplikasi yang dikembangkan dan antarmuka Proxmox VE bawaan.

Uji beda tidak dijalankan pada variabel ini. Kedua kelompok menghasilkan nilai konstan dengan simpangan baku nol, sehingga tidak ada variansi yang dapat diuji. Menjalankan uji beda terhadap dua konstanta yang identik merupakan kekeliruan penerapan statistik.

Indikator keberhasilan pada subbab 3.3.5c, yaitu tingkat kesesuaian konfigurasi sebesar 100 % tanpa *configuration drift*, tercapai pada kelompok portal.

### 4.4.5 Catatan Ruang Lingkup

Hasil null pada Hipotesis 2 bersumber dari rancangan pengujian, dan penelitian ini menyatakannya secara terbuka.

Variabel kontrol pada subbab 4.3.2 mengharuskan template `rhel10-cloud` sudah disetel ke spesifikasi Bronze. Kelompok manual karena itu mewarisi CPU, RAM, dan jaringan tanpa satu pun langkah pengisian tangan. Satu-satunya parameter yang masih terbuka terhadap kesalahan pengisian pada kelompok manual adalah disk, karena hanya di situ operator memasukkan angka. Rancangan ini mempersempit ruang munculnya perbedaan konsistensi sampai ke satu parameter.

Nama host yang mengikuti nama mesin virtual dan perluasan partisi otomatis merupakan pekerjaan template dan cloud-init. Keduanya terjadi identik pada kedua kelompok, sehingga penelitian ini tidak menghitungnya sebagai keunggulan portal.

Argumen sesungguhnya mengenai konsistensi tidak terletak pada angka kesesuaian, melainkan pada permukaan kesalahan yang dipaparkan subbab 4.5.6. Angka 100 % pada kelompok manual diperoleh operator yang sudah mengalami dua insiden dan hafal letak jebakannya.

---

## 4.5 Kesalahan Manusia

Tabel 3.4 mencantumkan kesalahan konfigurasi selama proses *provisioning* sebagai variabel ketiga dengan indikator jumlah kesalahan per proses dan instrumen berupa lembar observasi. Variabel ini tidak memiliki hipotesis. Penelitian ini melaporkannya secara deskriptif untuk menjawab Rumusan Masalah 3.

### 4.5.1 Definisi Operasional

Satu kesalahan adalah satu parameter hasil yang menyimpang dari spesifikasi meskipun prosesnya berhasil.

Definisi ini memisahkan dua hal yang kerap tertukar. Operasi gagal berarti prosesnya berhenti: kloning *error*, atau mesin virtual menolak menyala. Kesalahan manusia berarti prosesnya berhasil, mesin virtual menyala normal, tetapi hasilnya salah. Yang dihitung di sini hanya jenis kedua.

### 4.5.2 Hasil Pengukuran

**Tabel 4.23 Jumlah kesalahan konfigurasi**

| Kelompok | Percobaan | Kesalahan | Tingkat kesalahan |
|---|---:|---:|---:|
| Manual (Proxmox VE GUI) | 10 | 0 | 0 % |
| Portal (ExoVirt) | 10 | 0 | 0 % |

Kedua kelompok tidak menghasilkan penyimpangan. Seluruh 50 parameter pada tiap kelompok sesuai spesifikasi, sebagaimana Tabel 4.20 dan Tabel 4.21.

Angka nol pada kelompok manual menuntut satu catatan keterbatasan. Kesepuluh percobaan berjalan setelah peneliti mengalami dua insiden yang diuraikan di bawah, sehingga peneliti sudah mengetahui persis letak jebakannya. Operator yang belum pernah mengalami kesalahan serupa tidak berada pada kondisi yang sama. Angka nol karena itu tidak membuktikan bahwa prosedur manual aman, melainkan menunjukkan bahwa prosedur manual dapat berjalan aman apabila operatornya sudah pernah gagal dan mengingat pelajarannya. Kondisi tersebut tidak dapat diasumsikan berlaku pada organisasi dengan beban 120 tiket dalam dua bulan yang ditangani dua administrator.

### 4.5.3 Insiden Pertama: Salah Membaca Satuan Kolom

Peneliti, yang merupakan pengembang sistem dan sudah terbiasa dengan Proxmox VE, tetap melakukan kesalahan pada percobaan manual pertama. Dialog Disk Action → Resize meminta *Size Increment* dalam GiB, bukan ukuran akhir. Nilai 40 masuk dengan maksud menjadikan disk berukuran 40 GB, padahal template berukuran 10 GB, sehingga hasilnya menjadi 50 GB dan menyimpang 10 GB dari spesifikasi tier Bronze.

Tidak ada satu pun tanda kesalahan. Kloning berhasil, mesin virtual menyala normal, partisi meluas otomatis, nama host terisi benar, dan mesin virtual dapat dimasuki. Peneliti baru mengetahui penyimpangan tersebut setelah membuka tab Hardware dan mencocokkan angkanya secara manual. Percobaan dibatalkan lalu diulang dengan *increment* 30.

### 4.5.4 Insiden Kedua: Salah Sasaran

Pada hari yang sama, peneliti bermaksud memperbesar disk mesin virtual hasil kloning, namun yang terpilih adalah templatenya. Nilai *increment* 30 GB masuk ke template, sehingga disk template Rocky berubah permanen dari 10 GB menjadi 40 GB. Proxmox VE tidak menampilkan konfirmasi, peringatan, maupun pembeda yang menonjol antara template dan mesin virtual biasa pada operasi tersebut.

Radius kerusakan insiden kedua jauh lebih luas. Insiden pertama merusak satu mesin virtual, sedangkan insiden kedua merusak artefak bersama, sehingga setiap mesin virtual yang lahir dari template itu ikut membawa penyimpangannya tanpa batas waktu. Kesalahan tersebut juga tidak dapat dibatalkan. Proxmox VE tidak menyediakan operasi pengecilan disk, perintah `qm resize` menolaknya, dan pengecilan pada lapisan penyimpanan memotong blok data sehingga merusak citra template. Pemulihan menuntut pembangunan ulang template beserta proses `virt-customize` untuk akun `sysuser`, akun `sysadmin`, dan kunci otomasi yang tertanam di dalam disknya.

Peneliti membatalkan seluruh seri pengukuran yang memakai template Rocky, lalu mengulang pengukuran dari awal memakai template RHEL. Kedua insiden ini tidak dijumlahkan ke dalam angka kesalahan seri RHEL, karena seri Rocky bukan bagian dari sepuluh percobaan yang dilaporkan.

> **[TEMPEL GAMBAR]** Tab Hardware template Rocky memperlihatkan disk 40 GB.
> Caption: **Gambar 4.26** Disk template Rocky setelah perubahan permanen akibat salah sasaran

### 4.5.5 Sifat Penyimpangan yang Senyap

Kedua insiden memiliki pola yang sama. Mesin virtual tidak memprotes, layar tidak menampilkan kesalahan, dan berkas log tidak mencatat apa pun. Seseorang hanya dapat menemukan penyimpangan tersebut dengan membuka tab Hardware lalu mencocokkan angkanya satu per satu. Pada organisasi yang menangani 120 tiket dalam dua bulan dengan dua administrator, pemeriksaan semacam itu tidak terjadi.

### 4.5.6 Perbandingan Permukaan Kesalahan

Argumen terkuat pada bagian ini bersandar pada rancangan antarmuka, bukan pada jumlah sampel.

Prosedur manual menyediakan kolom yang dapat terisi salah. Operator menghitung sendiri nilai *increment* disk melalui pengurangan 40 dikurangi 10, dan Proxmox VE tidak memvalidasi hasilnya terhadap standar apa pun karena Proxmox VE tidak mengetahui standar organisasi. Portal tidak menyediakan kolom tersebut. Pengguna memilih tier, lalu Terraform menuliskan angka 40 GB. Kolom yang tidak ada tidak dapat diisi salah.

Insiden kedua memperlihatkan lapisan berikutnya. Pengguna portal tidak mungkin melakukan kesalahan tersebut, bukan karena lebih berhati-hati, melainkan karena portal tidak menyediakan jalan menuju template. Antarmuka layanan mandiri hanya memaparkan pilihan tier, sedangkan template dikelola administrator dan tidak pernah tersentuh alur permintaan.

**Tabel 4.24 Perbandingan permukaan kesalahan**

| Aspek | Manual (Proxmox VE GUI) | Portal (ExoVirt) |
|---|---|---|
| Nilai disk | Operator menghitung *increment* | Terraform menulis dari tier |
| Validasi terhadap standar organisasi | Tidak ada | Terikat definisi tier |
| Akses ke template | Terbuka | Tertutup bagi pemohon |
| Visibilitas kekeliruan sebelum eksekusi | Tidak ada | Halaman Review sebelum Submit |

Batas kejujuran argumen ini perlu dinyatakan. Portal mempersempit permukaan kesalahan, tidak menghapusnya. Pengguna portal masih dapat memilih tier atau template yang keliru. Perbedaannya terletak pada visibilitas: pilihan tier yang keliru tampak pada halaman Review sebelum Submit, sedangkan nilai *increment* yang keliru tidak tampak di mana pun.

---

## 4.6 Pengujian Kebergunaan (Hipotesis 3)

### 4.6.1 Responden

Penelitian ini melibatkan 8 responden yang terdiri atas 5 pengguna biasa dan 3 administrator TI. Setiap responden menilai kedua sistem, yaitu portal ExoVirt dan antarmuka Proxmox VE bawaan, sehingga datanya berpasangan.

Peneliti menetapkan jumlah dan komposisi responden sebelum menghitung satu pun skor SUS. Uji *Wilcoxon signed-rank* dua sisi pada n = 5 tidak dapat mencapai p di bawah 0,05, karena hasil paling ekstrem sekalipun hanya menghasilkan p sebesar 0,0625. Penetapan n = 8 memberi ruang toleransi sampai tiga pembalikan arah.

Ketiga administrator TI justru merupakan responden yang paling fasih memakai Proxmox VE, sehingga penambahan mereka memasukkan penilai yang paling tidak menguntungkan portal. Komposisi 5 berbanding 3 karena itu bersifat konservatif.

Kelima pengguna biasa memperoleh akun Proxmox VE berhak membuat, mengubah, dan melihat mesin virtual agar dapat menilai antarmuka tersebut. Mereka berhasil menjalankan *provisioning* manual. Temuan ini menegaskan bahwa ketiadaan hak Proxmox VE pada pengguna biasa dalam praktik sehari-hari bersumber dari kebijakan organisasi, bukan dari keterbatasan teknis.

### 4.6.2 Hasil Skor SUS

**Tabel 4.25 Skor SUS per responden**

| Responden | Peran | Portal ExoVirt | Proxmox VE | Selisih |
|---|---|---:|---:|---:|
| R1 | Pengguna biasa | 77,5 | 17,5 | **+60,0** |
| R2 | Pengguna biasa | 87,5 | 25,0 | **+62,5** |
| R3 | Pengguna biasa | 85,0 | 17,5 | **+67,5** |
| R4 | Pengguna biasa | 92,5 | 15,0 | **+77,5** |
| R5 | Pengguna biasa | 97,5 | 17,5 | **+80,0** |
| R6 | Administrator TI | 100,0 | 67,5 | **+32,5** |
| R7 | Administrator TI | 97,5 | 72,5 | **+25,0** |
| R8 | Administrator TI | 100,0 | 70,0 | **+30,0** |
| **Rata-rata** | | **92,19** | **37,81** | **+54,38** |

Skoring mengikuti prosedur baku SUS: butir ganjil bernilai jawaban dikurangi 1, butir genap bernilai 5 dikurangi jawaban, lalu jumlah seluruh butir dikali 2,5 sehingga menghasilkan rentang 0 sampai 100. Responden yang sama menilai kedua sistem, sehingga R1 pada kolom portal dan R1 pada kolom Proxmox VE merupakan orang yang sama. Pemasangan inilah yang menjadi dasar uji berpasangan pada subbab 4.6.4.

**Tabel 4.26 Statistik deskriptif skor SUS**

| Statistik | Portal ExoVirt | Proxmox VE |
|---|---:|---:|
| n | 8 | 8 |
| Rata-rata | 92,19 | 37,81 |
| Median | 95,00 | 21,25 |
| Simpangan baku | 8,18 | 26,84 |
| Minimum | 77,50 | 15,00 |
| Maksimum | 100,00 | 72,50 |
| Kategori | Excellent (A) | Poor (F) |

Kedelapan responden memberi skor lebih tinggi kepada portal. Tidak ada satu pun pembalikan arah.

Skor rata-rata portal sebesar 92,19 melampaui ambang 68 pada subbab 3.3.5c, dan kedelapan responden secara individual juga memberi skor di atas ambang tersebut.

### 4.6.3 Uji Normalitas

**Tabel 4.27 Uji normalitas Shapiro-Wilk pada selisih skor**

| Data | W | p | Kesimpulan |
|---|---:|---:|---|
| Selisih skor SUS (portal − Proxmox) | 0,8767 | 0,1753 | Normalitas tidak ditolak |

Uji Shapiro-Wilk berjalan pada selisih skor, bukan pada masing-masing kelompok, karena datanya berpasangan. Nilai p sebesar 0,1753 berada di atas 0,05, sehingga alur pada subbab 3.3.5d mengarah ke uji parametrik berpasangan.

### 4.6.4 Uji Beda

Penelitian ini melaporkan dua uji sekaligus.

**Tabel 4.28 Hasil uji beda skor SUS**

| Uji | Statistik | p | Keterangan |
|---|---:|---:|---|
| *Paired sample t-test* | t(7) = 6,982 | 0,000215 | Uji utama sesuai alur 3.3.5d |
| Cohen's d | 2,468 | | Ukuran efek sangat besar |
| *Wilcoxon signed-rank* | W = 0 | 0,0078 | Uji konfirmasi non-parametrik |

Kedua uji menghasilkan p di bawah 0,01 sehingga **H0 ditolak dan H1 diterima**. Terdapat perbedaan kebergunaan yang signifikan antara aplikasi yang dikembangkan dan antarmuka Proxmox VE bawaan berdasarkan skor SUS.

Penelitian ini melaporkan kedua uji karena sebaran selisih bersifat bimodal, mengikuti dua kelompok peran responden. Uji Shapiro-Wilk pada n = 8 memiliki daya yang rendah, sehingga hasil yang tidak menolak normalitas lebih tepat dibaca sebagai kegagalan menolak akibat data yang sedikit, bukan sebagai bukti bahwa datanya normal. Uji *Wilcoxon signed-rank* menutup celah tersebut, dan kesimpulannya tidak berubah.

> **[TEMPEL GAMBAR]** Output SPSS atau Jamovi uji Shapiro-Wilk dan uji beda SUS.
> Caption: **Gambar 4.27** Hasil uji statistik skor SUS

### 4.6.5 Temuan Antar-Peran

Pemecahan skor menurut peran responden menghasilkan temuan yang lebih tajam daripada skor totalnya.

**Tabel 4.29 Skor SUS menurut peran responden**

| Peran | n | Portal ExoVirt | Proxmox VE | Jurang |
|---|---:|---:|---:|---:|
| Pengguna biasa | 5 | 88,00 (A) | 18,50 (F) | 69,50 |
| Administrator TI | 3 | 99,17 (A) | 70,00 (C) | 29,17 |
| **Jurang antar-peran** | | **11,17** | **51,50** | |

Proxmox VE tidak buruk secara umum. Proxmox VE buruk bagi pengguna non-pakar. Administrator TI memberi Proxmox VE skor 70,00 yang melampaui ambang 68, sedangkan pengguna biasa memberi 18,50 pada sistem yang sama. Selisih 51,50 poin tersebut muncul hanya karena siapa yang memakainya.

Portal menutup jurang itu. Selisih skor portal antara kedua peran tinggal 11,17 poin, dan kedua kelompok sama-sama menempatkannya pada kategori Excellent.

Temuan ini menjawab Rumusan Masalah 1 pada bagian "mudah digunakan oleh pengguna non pakar" dengan bukti empiris.

Penelitian ini melaporkan pemecahan ini secara deskriptif dan tidak mengujinya secara statistik. Jumlah 5 berbanding 3 terlalu kecil untuk uji beda antar-subkelompok. Kekuatan temuan terletak pada besar selisih dan arahnya yang konsisten.

---

## 4.7 Tata Kelola dan Auditabilitas

Subbab ini menjawab Rumusan Masalah 2 dan bersifat deskriptif tanpa hipotesis.

### 4.7.1 Kontrol Akses Berbasis Peran

Sistem menyediakan tiga peran, yaitu Administrator, Manager, dan User. Pembagian ini terpasang sejak instalasi awal.

**Tabel 4.30 Peran dan kewenangan pada portal ExoVirt**

| Peran | Kewenangan | Cakupan data |
|---|---|---|
| Administrator | Akses penuh, termasuk penyedia, katalog, tier, environment, dan manajemen pengguna | Seluruh mesin virtual |
| Manager | Menyetujui, menolak, dan mengembalikan permintaan | Mesin virtual grup yang dikelolanya |
| User | Mengajukan dan mengelola mesin virtual miliknya | Mesin virtual miliknya sendiri |

Cakupan data pada Tabel 4.30 berlaku di lapisan kueri basis data, bukan sekadar penyembunyian menu. Manager melihat mesin virtual grup yang dikelolanya, sedangkan User melihat miliknya sendiri.

Administrator melewati alur persetujuan. Perilaku ini terbukti pada percobaan pendahuluan `AUTO-1`, yang ter-*provisioning* tanpa satu pun baris `APPROVE_REQUEST` pada Audit Trail.

Pembatasan environment melengkapi pembagian peran tersebut. Wizard hanya menampilkan penyedia, node, jaringan, dan datastore yang kebijakan environment izinkan, sehingga pengguna tidak dapat mengajukan permintaan ke sumber daya di luar haknya. Skenario F5 pada subbab 4.2 menguji perilaku ini.

> **[TEMPEL GAMBAR 4.28]**
> **Ambil dari:** menu pengaturan peran atau User Management yang menampilkan ketiga peran beserta hak aksesnya.
> **Harus memperlihatkan:** daftar peran Administrator, Manager, dan User. Bila memungkinkan, sandingkan dengan tangkapan layar sidebar milik akun User yang menunya lebih sedikit daripada sidebar akun Administrator. Perbandingan dua sidebar membuktikan pembatasan itu terasa oleh pengguna, sedangkan satu daftar peran hanya membuktikan pengaturannya ada.
> **Caption:** **Gambar 4.28** Peran dan kewenangan pada portal ExoVirt

### 4.7.2 Mekanisme Persetujuan

Setiap permintaan *provisioning* dari pengguna biasa menunggu persetujuan sebelum sistem menjalankan Terraform. Administrator melewati alur ini karena memiliki hak *bypass*, dan perilaku tersebut terekam pada pengujian *black box* area C.

Segmen `t2` pada sepuluh percobaan pokok tidak dilaporkan sebagai metrik tata kelola. Peneliti mengirim kesepuluh permintaan terlebih dahulu, lalu menyetujuinya satu per satu, sehingga angka yang terukur mencerminkan kapan peneliti sempat membuka menu Approvals dan bukan latensi persetujuan sistem. Urutan tersebut tidak memengaruhi `t1` maupun `t3`, karena jarak antar persetujuan melebihi durasi satu *apply*, sehingga tidak pernah ada dua *apply* berjalan bersamaan.

Percobaan batch menghasilkan `t2` yang sah sebesar **26 detik**, terukur dari satu permintaan yang langsung disetujui. Satu persetujuan tersebut menanggung sepuluh mesin virtual, dan sistem merekam seluruhnya pada audit. Tata kelola ikut menskala. Prosedur manual membuat sepuluh mesin virtual tanpa satu pun catatan persetujuan.

> **[TEMPEL GAMBAR]** Halaman Approvals memperlihatkan permintaan menunggu persetujuan.
> Caption: **Gambar 4.29** Alur persetujuan permintaan mesin virtual

### 4.7.3 Audit Trail

Sistem mencatat pembuatan permintaan, persetujuan, dan pembuatan mesin virtual sebagai baris audit yang bersifat *append-only*.

**Tabel 4.31 Baris audit satu permintaan *provisioning***

| Urutan | Aksi | Pelaku |
|---:|---|---|
| 1 | `CREATE_PROVISION_REQUEST` | Pengguna |
| 2 | `APPROVE_REQUEST` | Penyetuju |
| 3 | `CREATE_VM` | Sistem |

> **[TEMPEL GAMBAR]** Audit Trail satu percobaan bersih (pakai `PROVE-3` atau `PROVE-5`, tepat 3 baris).
> Caption: **Gambar 4.30** Jejak audit satu proses *provisioning*

*(Catatan penulisan: tangkapan layar ini memperlihatkan jeda antara permintaan dan persetujuan. Dampingi dengan satu kalimat yang menjelaskan prosedur kirim-lalu-setujui pada subbab 4.7.2, dan satu kalimat yang menyebut bahwa seri percobaan bersih dimulai pukul 10:42:45 setelah percobaan pendahuluan.)*

### 4.7.4 Pengelolaan Siklus Hidup

Mesin virtual yang sudah berjalan tetap berada di bawah alur persetujuan yang sama. Portal menyediakan enam jenis permintaan, dan kelimanya di luar `PROVISION` menyasar aset yang hidup.

**Tabel 4.32 Jenis permintaan bergerbang persetujuan**

| Jenis permintaan | Sasaran | Keluaran setelah disetujui |
|---|---|---|
| `PROVISION` | Mesin virtual baru | Mesin virtual terbangun dan masuk Inventory |
| `RENEWAL` | Mesin virtual hidup | Tanggal kedaluwarsa mundur |
| `PERMANENT` | Mesin virtual hidup | Kedaluwarsa dicabut |
| `RESIZE` | Mesin virtual hidup | CPU atau RAM berubah |
| `ADD_DISK` | Mesin virtual hidup | Disk tambahan terpasang |
| `DESTROY` | Mesin virtual hidup | Mesin virtual dihancurkan |

Satu perbedaan perlakuan berlaku di antara keenamnya. Aksi Revert hanya berlaku bagi `PROVISION`, karena permintaan mesin virtual baru masih berupa rancangan yang dapat dikembalikan kepada pemohon untuk diperbaiki. Perubahan terhadap mesin virtual yang sudah hidup tidak memiliki rancangan untuk dikembalikan, sehingga penyetuju memakai Reject.

Mesin virtual yang melewati masa berlaku masuk ke masa tenggang, lalu sistem menghancurkannya secara otomatis dan mencatatnya pada audit. Skenario D1 sampai D8 pada subbab 4.2 menguji kedelapan perilaku tersebut.

Tidak satu pun perilaku ini tersedia pada antarmuka Proxmox VE bawaan. Administrator dengan hak penuh dapat memperbesar disk, mengubah CPU, atau menghapus mesin virtual kapan saja tanpa permintaan, tanpa persetujuan, dan tanpa jejak yang mengaitkan tindakan itu dengan alasannya.

---

## 4.8 Pembahasan

### 4.8.1 Jawaban Rumusan Masalah 1

Rumusan Masalah 1 menanyakan cara merancang aplikasi web *self-service* yang mengabstraksikan kompleksitas Terraform dan Ansible menjadi proses penyediaan mesin virtual yang mudah dipakai pengguna non-pakar.

Sistem terbangun dan berjalan pada lingkungan produksi, melayani dua pusat data dengan lima *golden image* per pusat data, sebagaimana subbab 4.1. Pengujian *black box* pada subbab 4.2 memperlihatkan tingkat keberhasilan fungsional sebesar *(isi persentase dari Tabel 4.5)*.

Abstraksi bekerja pada tiga lapis. Pengguna tidak pernah menulis sintaks Terraform, karena portal menerjemahkan pilihan tier menjadi berkas `terraform.tfvars` sementara `main.tf` tidak berubah antar permintaan. Pengguna tidak pernah menyusun *playbook*, karena Ansible berjalan sebagai aksi Inventory tersendiri memakai kunci SSH yang Terraform suntikkan. Pengguna juga tidak pernah membuka antarmuka Proxmox VE.

Ukuran keberhasilan abstraksi terbaca pada jumlah langkah. Prosedur manual menuntut 23 langkah, portal menuntut 10, sehingga turun 56,52 %. Pada permintaan sepuluh mesin virtual sekaligus, langkah portal tetap 10 sementara langkah manual tumbuh menjadi 230. Portal memangkas beban sampai 95,65 % pada titik tersebut.

Frasa "mudah digunakan oleh pengguna non pakar" memperoleh bukti empirisnya pada Tabel 4.29. Lima pengguna biasa memberi portal skor SUS 88,00 yang masuk kategori Excellent, sedangkan sistem yang sama mereka bandingkan, yaitu Proxmox VE, hanya memperoleh 18,50 dan masuk kategori Poor. Selisih 69,50 poin tersebut berasal dari orang-orang yang justru menjadi sasaran perancangan sistem ini.

### 4.8.2 Jawaban Rumusan Masalah 2

Rumusan Masalah 2 menanyakan cara menerapkan tata kelola yang meliputi kontrol akses berbasis peran, mekanisme persetujuan, pengelolaan siklus hidup, dan audit trail.

Subbab 4.7 memaparkan keempatnya sebagai satu kesatuan. Tiga peran membatasi kewenangan sekaligus cakupan data. Setiap permintaan dari pengguna biasa menunggu persetujuan sebelum Terraform berjalan. Enam jenis permintaan menempatkan perubahan terhadap mesin virtual hidup di bawah gerbang yang sama dengan pembuatan mesin virtual baru. Setiap peristiwa masuk ke jejak audit yang bersifat *append-only*.

Nilai sesungguhnya terletak pada celah yang portal isi. Proxmox VE tidak menyediakan jalan tengah. Organisasi hanya punya dua pilihan: tidak memberi akses sama sekali, atau memberi hak membuat, mengubah, dan menghapus mesin virtual tanpa persetujuan, tanpa kuota, dan tanpa jejak yang mengaitkan tindakan dengan alasannya. Subbab 4.6.1 memperlihatkan kedua pilihan itu bekerja: pengguna biasa yang diberi hak Proxmox VE memang berhasil melakukan *provisioning*, dan justru itulah masalahnya. Mereka berhasil tanpa satu pun pagar.

Percobaan batch memperlihatkan tata kelola ikut menskala. Satu persetujuan berdurasi 26 detik menanggung sepuluh mesin virtual, dan sistem merekam kesepuluhnya. Prosedur manual membangun sepuluh mesin virtual tanpa satu pun catatan persetujuan.

### 4.8.3 Jawaban Rumusan Masalah 3

Rumusan Masalah 3 menanyakan hasil evaluasi efisiensi operasional, konsistensi konfigurasi, dan tingkat kesalahan manusia dibanding proses manual.

**Efisiensi.** Uji Mann-Whitney U menghasilkan U = 0 dengan p = 1,08 × 10⁻⁵, sehingga Hipotesis 1 diterima. Waktu portal 98,80 detik berbanding manual 136,90 detik, turun 27,83 %. Jumlah langkah 10 berbanding 23, turun 56,52 %. Kedua kelompok tidak beririsan sama sekali.

Indikator penurunan waktu sebesar 50 % tidak tercapai, dan subbab 4.8.6 memaparkan sebabnya beserta pembedaan antara hipotesis dan indikator.

**Konsistensi.** Kedua kelompok mencapai 100 % tanpa *configuration drift*, sehingga H0 tidak ditolak dan Hipotesis 2 menghasilkan temuan null. Hasil ini bersumber dari rancangan pengujian, bukan dari kebetulan. Penyamaan template ke spesifikasi Bronze membuat kelompok manual mewarisi CPU, RAM, dan jaringan tanpa langkah pengisian tangan, sehingga hanya parameter disk yang tersisa terbuka terhadap kesalahan. Peneliti meramalkan hasil null ini sebelum mengukur kelompok portal, dan mencatat ramalannya pada rencana pengukuran.

**Kesalahan manusia.** Kedua kelompok mencatat nol kesalahan dari sepuluh percobaan. Angka nol pada kelompok manual muncul setelah peneliti mengalami dua insiden dan hafal letak jebakannya, sehingga angka tersebut tidak membuktikan prosedur manual aman.

Jawaban yang sesungguhnya atas ketiga variabel ini terletak pada subbab 4.5.6. Prosedur manual menyediakan kolom *increment* disk yang operator hitung sendiri dan Proxmox VE tidak validasi terhadap standar organisasi mana pun. Portal tidak menyediakan kolom tersebut. Argumen ini berdiri di atas rancangan antarmuka, sehingga tidak bergantung pada jumlah sampel maupun keberuntungan operator.

### 4.8.4 Jawaban Rumusan Masalah 4

Rumusan Masalah 4 menanyakan hasil evaluasi kebergunaan berdasarkan System Usability Scale.

Portal memperoleh skor 92,19 yang masuk kategori Excellent, sedangkan Proxmox VE memperoleh 37,81 yang masuk kategori Poor. *Paired sample t-test* menghasilkan t(7) = 6,982 dengan p = 0,000215, dan uji konfirmasi *Wilcoxon signed-rank* menghasilkan W = 0 dengan p = 0,0078. Kedelapan responden memberi skor lebih tinggi kepada portal tanpa satu pun pembalikan arah. Hipotesis 3 diterima. Skor 92,19 juga melampaui ambang 68 pada subbab 3.3.5c, dan kedelapan responden secara individual berada di atas ambang tersebut.

Jawaban yang lebih tajam muncul saat skor dipecah menurut peran responden. Proxmox VE tidak buruk secara umum. Administrator TI memberinya 70,00, angka yang melampaui ambang 68. Pengguna biasa memberi sistem yang sama 18,50. Jurang 51,50 poin itu muncul hanya karena siapa yang memakainya.

Portal menutup jurang tersebut sampai tersisa 11,17 poin, dan kedua kelompok peran sama-sama menempatkannya pada kategori Excellent. Temuan ini menjawab Rumusan Masalah 4 sekaligus menutup bagian "mudah digunakan oleh pengguna non pakar" pada Rumusan Masalah 1. Masalah yang penelitian ini angkat memang bukan kelemahan Proxmox VE sebagai hypervisor, melainkan ketidakcocokannya sebagai antarmuka layanan mandiri bagi pengguna non-pakar.

### 4.8.5 Konteks Lapangan dan Peran Standarisasi Template

Penelitian ini mengunci template `rhel10-cloud` berspesifikasi Bronze sebagai variabel kontrol pada kedua kelompok, sebagaimana subbab 4.3.2. Kelompok manual dan kelompok portal sama-sama berangkat dari *golden image* yang identik. Keputusan ini menyingkirkan satu pembaur, yaitu perbedaan antara membangun mesin virtual dari template dan membangunnya dari awal, sehingga perbandingan waktu murni mengukur lapisan antarmuka. Akibatnya angka yang penelitian ini laporkan berdiri di atas kondisi yang paling menguntungkan prosedur manual.

Praktik di lapangan jarang seragam demikian. Banyak organisasi belum menstandarkan template, dan setiap permintaan mesin virtual baru berangkat dari *base image* yang dikonfigurasi dari awal. Gambaran pembandingnya datang dari pengalaman kerja seorang praktisi yang menangani penyediaan mesin virtual pada lingkungan VMware di sebuah perusahaan. Praktisi tersebut mencatat sepuluh percobaan pembuatan mesin virtual tanpa template dari pekerjaannya sehari-hari, dan hasilnya terangkum di bawah. Data ini berasal dari pengalaman kerja praktisi, bukan dari pengukuran yang penelitian ini rancang di lingkungan tersebut, sehingga penelitian ini memperlakukannya sebagai pembanding deskriptif semata dan tidak menyebut identitas perusahaannya.

**Waktu pembuatan mesin virtual tanpa template pada lingkungan VMware berdasarkan pengalaman kerja praktisi (pembanding deskriptif)**

| Operasi | Jumlah percobaan | Rata-rata (detik) | Rentang (detik) |
|---|---:|---:|---:|
| Pembangunan *image* awal (instalasi *native*) | 1 | 1.110 | - |
| Kloning per mesin virtual | 9 | 282,56 | 241–403 |

Pembangunan *image* awal menempuh 1.110 detik atau 18,5 menit, karena praktisi tersebut memasang sistem operasi dari awal sebelum menjadikannya acuan kloning. Kloning berikutnya menempuh rata-rata 282,56 detik dengan median 278 detik, dan tiap kloning masih menuntut pengisian nama host serta penyetelan ulang *machine-ID* secara manual. Kedua angka berdekatan dengan rentang lima sampai dua puluh menit yang subbab 1.1 catat dari observasi tiket lapangan, sehingga catatan pengalaman ini menopang klaim beban pada Bab I. Pembaruan sistem operasi memperpanjang pembangunan *image* awal lebih jauh lagi, meski penelitian ini tidak mengukur besarannya.

Data ini tidak pernah masuk uji statistik Hipotesis 1, dan penelitian ini menegaskannya. Enam variabel membedakannya dari pengukuran utama: hypervisor VMware berbeda dari Proxmox VE, pembuatan tanpa template berbeda dari *golden image* RHEL, operatornya berbeda, perangkat kerasnya tidak diketahui, prosedurnya menuntut pengisian tangan yang cloud-init tiadakan, serta sistem operasi dan jaringannya tidak terkontrol. Hipotesis pada subbab 2.4 mengunci pembandingnya pada antarmuka Proxmox VE bawaan. Menukar pembanding yang sah dengan data yang lebih menguntungkan setelah hasil diketahui merupakan cacat metodologi, dan penelitian ini menolaknya.

Perbandingan lapangan ini menempatkan angka penelitian pada perspektifnya. Rata-rata kelompok manual penelitian sebesar 136,90 detik berada jauh di bawah rata-rata kloning lapangan sebesar 282,56 detik, meski keduanya sama-sama prosedur manual. Penelitian ini tidak membebankan selisih tersebut pada satu penyebab tunggal, karena hypervisor dan operatornya berbeda. Yang dapat penelitian ini nyatakan hanya arahnya, bahwa standarisasi template memangkas pekerjaan tangan yang di lapangan masih dikerjakan berulang. Penyeragaman itu berlaku setara pada kedua kelompok penelitian, sehingga keunggulannya tidak muncul sebagai efisiensi portal, melainkan menaikkan garis dasar prosedur manual. Penurunan waktu sebesar 27,83 % pada subbab 4.8.6 karena itu terukur terhadap kondisi manual yang paling cepat, bukan terhadap kondisi manual lapangan yang jauh lebih lambat. Perbandingan ini memperjelas makna angka, dan tidak mengubah capaian indikator.

Standarisasi template menyentuh pula konsistensi dan kesalahan manusia. Pembuatan dari *base image* membuka kembali setiap parameter terhadap pengisian tangan, yaitu ruang yang subbab 4.4.5 tutup pada rancangan penelitian ini. Hasil null pada Hipotesis 2 dan angka nol kesalahan pada subbab 4.5 karena itu juga terukur pada kondisi paling ringan bagi prosedur manual. Pada lingkungan yang membangun dari awal, permukaan kesalahan yang subbab 4.5.6 uraikan melebar alih-alih menyempit.

### 4.8.6 Capaian Indikator Keberhasilan

**Tabel 4.33 Capaian indikator keberhasilan**

| No | Indikator | Target | Capaian | Status |
|---:|---|---|---|:---:|
| 1 | Penurunan waktu *provisioning* | ≥ 50 % | 27,83 % | ❌ |
| 2 | Berkurangnya jumlah langkah | Berkurang | 56,52 % | ✅ |
| 3 | Kesesuaian konfigurasi | 100 % | 100 % | ✅ |
| 4 | Keberhasilan *deployment* | 100 % | 100 % | ✅ |
| 5 | Kesalahan konfigurasi | Mendekati 0 | 0 | ✅ |
| 6 | Skor SUS | ≥ 68 | 92,19 | ✅ |

Lima dari enam indikator tercapai. Indikator penurunan waktu meleset, dan penelitian ini memaparkan sebabnya secara terbuka.

Perlu dibedakan antara hipotesis dan indikator. Hipotesis 1 pada subbab 2.4 berbunyi "terdapat perbedaan efisiensi yang signifikan" tanpa menyebut besaran, dan uji Mann-Whitney U menerimanya dengan p = 1,08 × 10⁻⁵. Indikator penurunan waktu sebesar 50 % merupakan kriteria perancangan yang peneliti tetapkan sendiri pada subbab 3.3.5c. Keduanya dinilai terpisah.

Melesetnya indikator waktu merupakan temuan, dan penyebabnya terbaca dari data. Sebanyak 88,7 % waktu portal merupakan waktu mesin, yaitu Terraform menjalankan *init*, *plan*, *apply*, kloning penuh, lalu menunggu boot. Portal memakai hypervisor yang sama dengan prosedur manual, sehingga kloning penuh 40 GB memakan waktu yang sama pada kedua jalur. Yang portal pangkas adalah waktu perhatian manusia, dari 136,90 detik menjadi 11,20 detik.

Penelitian ini tidak mengganti definisi `t1+t3` menjadi `t1` saja setelah mengetahui hasilnya. Definisi tersebut terkunci sebelum pengukuran kelompok portal berjalan, dan mengubahnya sekarang merupakan perancangan ulang pasca-fakta.

Portal menukar puluhan detik orkestrasi dengan persetujuan, jejak audit, dan permukaan kesalahan yang lebih sempit. Perbandingannya bukan cepat melawan lambat, melainkan cepat melawan jaminan.

### 4.8.7 Keterbatasan Penelitian

Penelitian ini memiliki sejumlah keterbatasan yang perlu dinyatakan agar pembaca dapat menimbang hasilnya secara adil.

Peneliti sendiri menjalankan kedua kelompok pengukuran, dan peneliti juga merupakan pengembang sistem yang diuji. Kondisi ini menguntungkan kelompok manual pada variabel waktu, karena operatornya menguasai Proxmox VE, namun sekaligus membuat angka kesalahan nol pada kelompok manual sulit digeneralisasi. Angka tersebut lahir setelah peneliti mengalami dua insiden dan hafal letak jebakannya, sehingga tidak mewakili operator yang belum pernah gagal.

Rancangan pengujian konsistensi mempersempit ruang munculnya perbedaan sampai ke satu parameter, yaitu disk. Hasil null pada Hipotesis 2 karena itu berlaku untuk rancangan ini dan tidak dapat digeneralisasi menjadi pernyataan bahwa prosedur manual sama konsistennya dengan portal pada kondisi lapangan.

Jumlah responden SUS sebanyak 8 memadai untuk uji berpasangan, namun pemecahan menurut peran dengan komposisi 5 berbanding 3 terlalu kecil untuk diuji beda. Temuan antar-peran pada subbab 4.6.5 karena itu bersifat deskriptif, dan kekuatannya bersandar pada besar selisih beserta arahnya yang konsisten.

Percobaan batch berjumlah satu, sehingga angkanya deskriptif. Waktu manual pada perbandingan batch merupakan ekstrapolasi dari 136,90 detik dikali sepuluh, bukan hasil pengukuran sepuluh percobaan berturut-turut.

Dua mesin virtual, yaitu `PROVE-1` dan `PROVE-6`, memiliki dua sesi wizard akibat percobaan pendahuluan, sehingga peneliti tidak dapat memastikan sesi mana yang menghasilkan `t1` keduanya. Dampaknya terhadap Hipotesis 1 dapat diabaikan, karena `t1` hanya menyumbang 11,3 % dari total dan jarak antar kelompok mencapai 11 detik penuh.

Data pembanding dari lingkungan VMware pada sebuah institusi perbankan dan dari jurnal mengenai Terraform CLI hanya masuk sebagai pembanding deskriptif. Hypervisor, operator, dan perangkat kerasnya berbeda, sehingga keduanya tidak pernah masuk ke dalam uji statistik. Hipotesis pada subbab 2.4 mengunci pembandingnya pada antarmuka Proxmox VE bawaan.

---

## Catatan Penulisan

**Yang masih perlu diisi:**

| Bagian | Kebutuhan |
|---|---|
| 4.1 | Tangkapan layar portal, alur, Inventory |
| 4.2 | **Seluruh hasil black box** dari lembar `bab4-blackbox-skenario.md` |
| 4.3.1 | Spesifikasi host `pve` dari menu Summary |
| 4.3.7 | Kolom `t1` dan `t3` per percobaan portal |
| 4.6.2 | Skor SUS per responden untuk kedua sistem |
| 4.7.1, 4.7.4 | Narasi RBAC dan siklus hidup |
| 4.8.1–4.8.4 | Narasi jawaban RM |
| Semua | Tangkapan layar SPSS atau Jamovi menggantikan angka pratinjau Python |

**Penomoran:** gambar 4.1 sampai 4.23 dan tabel 4.1 sampai 4.29 mengikuti urutan kemunculan. Sesuaikan kembali di Word setelah bagian yang kosong terisi.
