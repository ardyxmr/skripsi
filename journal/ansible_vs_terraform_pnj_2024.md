---
title: "Analisis Perbandingan Kinerja Manajemen Konfigurasi Ansible dan Terraform Pada Sistem Operasi Server"
author: "Muhammad Akbar Hidayatulloh"
nim: "2007422015"
institution: "Politeknik Negeri Jakarta"
department: "Program Studi Teknik Multimedia dan Jaringan, Jurusan Teknik Informatika dan Komputer"
degree: "Skripsi (Diploma Empat)"
year: 2024
keywords:
  - Manajemen Konfigurasi
  - Ansible
  - Terraform
  - Quality of Service
  - Throughput
  - Packet Loss
  - CPU Usage
  - Execution Time
---

# Analisis Perbandingan Kinerja Manajemen Konfigurasi Ansible dan Terraform Pada Sistem Operasi Server

## Abstrak
Pengelolaan konfigurasi pada server yang sudah ada dapat menjadi tantangan tersendiri, terutama jika jumlah perangkat yang dikelola cukup besar. Proses instalasi dan konfigurasi manual satu per satu pada server tersebut memerlukan waktu yang cukup lama. Untuk itu diperlukan Ansible dan Terraform dalam Manajemen Konfigurasi secara otomatis. Tujuan dari penelitian ini adalah menganalisis kinerja dari aplikasi Ansible dan Terraform sebagai aplikasi manajemen konfigurasi dalam *deployment* beberapa aplikasi kebutuhan server seperti aplikasi Prometheus, Fail2ban dan Uncomplicated Firewall (UFW) yang berada di ruang server Jurusan Teknik Informatika dan Komputer. Metode yang digunakan pada penelitian ini adalah menggunakan metode NDLC (*Network Development Life Cycle*). Parameter yang diujikan dalam penelitian ini adalah beberapa parameter *Quality of Service* yaitu Throughput dan Packet loss serta menggunakan pengujian parameter waktu implementasi dan penggunaan CPU. Berdasarkan pengujian yang telah dilakukan Terraform mengungguli Ansible pada waktu proses eksekusi dengan perbedaan waktu 0.41 menit, throughput yang dihasilkan ansible lebih baik dengan rata-rata 202,72 Kb/s dan 15,55 Kb/s untuk terraform, packet loss yang dihasilkan ansible lebih baik dengan rata-rata 1,01% dan 1,10% untuk terraform. Penggunaan Ansible lebih efisien terhadap CPU dibandingkan dengan Terraform karena tidak membebani server secara berlebihan.

**Kata Kunci:** Manajemen Konfigurasi, Ansible, Terraform

---

## Abstract
Configuration management on existing servers can be challenging, especially if the number of devices being managed is large. The process of manual installation and configuration one by one on these servers takes a long time. For this reason, Ansible and Terraform are needed in Configuration Management automatically. The purpose of this research is to analyze the performance of the Ansible and Terraform applications as configuration management applications in the deployment of several server application needs such as the Prometheus, Fail2ban and Uncomplicated Firewall (Ufw) applications located in the server room of the Informatics and Computer Engineering Department. The method used in this research is using the NDLC (Network Development Life Cycle) method. The parameters tested in this study are several Quality Of Service parameters, namely Throughput and Packet loss and using parameter testing of implementation time and CPU usage. Based on the tests that have been carried out Terraform outperforms Ansible in the execution process time with a time difference of 0.41 minutes, the throughput produced by Ansible is better with an average of 202.72 KB/s and 15.55 KB/s for Terraform, the packet loss produced by Ansible is better with an average of 1,01% and 1.10% for Terraform. The use of Ansible is more efficient on CPU compared to Terraform because it does not overload the server.

**Keywords:** Configuration Management, Ansible, Terraform

---

## 1. Pendahuluan

### 1.1 Latar Belakang
Dalam perkembangan era digital yang semakin terdistribusi, manajemen konfigurasi menjadi elemen penting dalam pengelolaan infrastruktur teknologi informasi. Banyaknya jumlah perangkat yang ingin dikonfigurasi akan menjadi hambatan untuk administrator dalam melakukan instalasi, konfigurasi, dan pemeliharaan secara manual.

Manajemen konfigurasi merupakan suatu proses untuk membangun, mengubah, dan mengelola sistem yang mencakup perangkat keras, perangkat lunak, serta perangkat lainnya. Beberapa alat untuk manajemen konfigurasi adalah Ansible dan Terraform. Manajemen konfigurasi membantu dalam pengelolaan dan instalasi serta *deployment* aplikasi monitoring server dengan cepat dan efisien, menghemat waktu, dan mengurangi kemungkinan terjadinya kesalahan manusia.

Ansible dan Terraform memiliki kelebihan dan kekurangan yang berbeda, tergantung pada kebutuhan dan lingkungan penggunaannya. Ansible dikenal karena kemudahan penggunaannya dan kemampuannya untuk menginstal, menyebarkan, dan mengelola konfigurasi terhadap server dengan cepat melalui skrip YAML. Di sisi lain, Terraform yang berbasis deklaratif menawarkan kemampuan untuk mengelola infrastruktur sebagai kode (*Infrastructure as Code*) dengan lebih baik, memungkinkan pengguna untuk mendefinisikan seluruh arsitektur infrastruktur dalam berkas konfigurasi yang mudah dipelihara. Namun, kinerja dan efisiensi dalam penerapan di lingkungan yang berbeda perlu dianalisis lebih mendalam.

### 1.2 Rumusan Masalah
* Bagaimana mengimplementasikan Ansible dan Terraform sebagai manajemen konfigurasi pada server?
* Bagaimana perbandingan *throughput*, *packet loss*, waktu, dan penggunaan CPU antara Ansible dan Terraform?
* Bagaimana menganalisis kinerja penggunaan Ansible dan Terraform dalam melakukan manajemen konfigurasi?

### 1.3 Batasan Masalah
* Tools yang digunakan untuk manajemen konfigurasi dibatasi pada Ansible dan Terraform.
* Penelitian membandingkan kinerja aplikasi Ansible dan Terraform.
* Otomatisasi konfigurasi difokuskan pada Prometheus, Node-Exporter, Fail2ban, dan Ufw (*Uncomplicated Firewall*).

### 1.4 Tujuan dan Manfaat

#### 1.4.1 Tujuan
* Mengimplementasikan Ansible dan Terraform sebagai manajemen konfigurasi pada server.
* Mengetahui hasil perbandingan *Throughput*, *packet loss*, waktu eksekusi, dan penggunaan CPU antara Ansible dan Terraform.
* Menganalisis kinerja penggunaan Ansible dan Terraform dalam manajemen konfigurasi.

#### 1.4.2 Manfaat
* **Efisiensi Waktu:** Mempercepat tugas dan konfigurasi aplikasi Prometheus, Fail2ban, dan Ufw.
* **Reduksi Human Error:** Mengurangi potensi kesalahan manual dalam melakukan konfigurasi yang berulang pada server.

---

## 2. Metodologi Penelitian
Metodologi penelitian ini menggunakan pendekatan **Network Development Life Cycle (NDLC)** yang mencakup tahapan analisis, perancangan, simulasi prototyping, implementasi, monitoring, dan manajemen.

### 2.1 Alur Pengujian Parameter
Pengujian dilakukan terhadap parameter berikut:
* **Throughput:** Jumlah data transfer yang dikirim/diterima melalui jaringan, dianalisis menggunakan Wireshark pada workstation.
* **Penggunaan CPU & Memori:** Mengamati tingkat utilisasi beban kerja server menggunakan Netdata.
* **Packet Loss:** Menghitung jumlah paket data yang hilang selama pengiriman menggunakan Wireshark.
* **Waktu Proses Deployment:** Menghitung total durasi eksekusi dari instalasi paket-paket aplikasi.

---

## 3. Hasil Pengujian dan Analisis

### 3.1 Ringkasan Hasil Pengujian
Sistem diuji dengan melakukan otomatisasi instalasi Prometheus, Node-Exporter, Fail2ban, dan UFW di server. Perbandingan data rata-rata dari seluruh eksperimen dirangkum sebagai berikut:

| Parameter | Ansible (Rata-rata) | Terraform (Rata-rata) | Pemenang Performa |
| :--- | :---: | :---: | :--- |
| **Waktu Eksekusi** | 4,22 menit | 3,81 menit | **Terraform** (Lebih Cepat 0.41 menit) |
| **Throughput Jaringan** | 202,72 Kb/s | 15,55 Kb/s | **Ansible** (Lebih Besar) |
| **Packet Loss** | 1,01% | 1,10% | **Ansible** (Lebih Rendah) |
| **Penggunaan CPU** | 91,02% | 99,85% | **Ansible** (Lebih Efisien) |

---

## 4. Kesimpulan dan Saran

### 4.1 Kesimpulan
Berdasarkan hasil pengujian yang telah dilakukan menggunakan Ansible dan Terraform, didapatkan poin kesimpulan sebagai berikut:
1. **Keberhasilan Implementasi:** Baik Ansible maupun Terraform dapat diimplementasikan dengan sangat baik sebagai alat otomatisasi manajemen konfigurasi pada sistem operasi server.
2. **Kualitas Layanan Jaringan (QoS):** 
   * **Throughput:** Ansible lebih unggul dengan nilai rata-rata **202,72 Kb/s** dibandingkan Terraform yang hanya memperoleh **15,55 Kb/s**.
   * **Packet Loss:** Ansible lebih baik dengan tingkat kegagalan paket rata-rata **1,01%** dibandingkan Terraform sebesar **1,10%**.
3. **Efisiensi Waktu & Utilisasi CPU:**
   * **Waktu Eksekusi:** Terraform lebih unggul dengan waktu rata-rata **3,81 menit** dibandingkan Ansible sebesar **4,22 menit** (selisih 0,41 menit).
   * **CPU Usage:** Ansible jauh lebih efisien dalam penggunaan CPU dengan rata-rata **91,02%** dibandingkan Terraform yang membebani CPU hingga rata-rata **99,85%**. Terraform cenderung memakan sumber daya CPU secara penuh saat melakukan pembuatan *state* dan sinkronisasi dependensi secara remote.

### 4.2 Saran
Untuk penelitian selanjutnya, disarankan untuk:
* Menambahkan beberapa parameter pengujian baru (seperti penggunaan RAM, I/O disk storage, dan skalabilitas jumlah server).
* Menggunakan sistem pengujian atau lingkungan jaringan terdistribusi yang berbeda untuk menguji reliabilitas sistem dalam kondisi beban puncak.

---

## Daftar Pustaka
[1] M. R. Afandi, P. Hatta, and A. Efendi, "Otomatisasi Perangkat Jaringan Komputer Menggunakan Ansible Pada Laboratorium Komputer," *SMARTICS Journal*, vol. 6, no. 2, pp. 48-53, 2020.

[2] T. Alfiandi, T. Diansyah, and R. Liza, "ANALISIS PERBANDINGAN MANAJEMEN KONFIGURASI MENGGUNAKAN ANSIBLE DAN SHELL SCRIPT PADA CLOUD SERVER DEPLOYMENT AWS," *JITEKH*, vol. 8, no. 2, 2020.

[3] N. Evianti, A. M. Wihandar, and A. Kurniawan, "AUTOMATION PROVISIONING DEV-OPS WEBSITE SERVER MENGGUNAKAN ANSIBLE DAN VAGRANT," *Jurnal Nasional Informatika*, vol. 2, no. 2, pp. 72-91, Oktober 2021.

[4] O. A. Farayola et al., "CONFIGURATION MANAGEMENT IN THE MODERN ERA: BEST PRACTICES, INNOVATIONS, AND CHALLENGES," *Computer Science & IT Research Journal*, vol. 4, no. 2, pp. 140-157, November 2023.

[5] M. Faris, K. Abdullah, I. H. A. Halim, and R. Ruslan, "Network Automation using Ansible for EIGRP Network," *Journal of Computing Research and Innovation (JCRINN)*, vol. 6, no. 4, pp. 59-69, 2021.

[6] N. M. D. Febriyanti, A. K. O. Sudana, and I. N. Piarsa, "Implementasi Black Box Testing pada Sistem Informasi Manajemen Dosen," *Jurnal Ilmiah Teknologi dan Komputer*, vol. 2, no. 3, Desember 2021.

[7] Y. C. Firmansyah, W. W. Winarno, and E. Pramono, "Analisis Teknologi Virtual Mesin Proxmox Dalam Rangka Persiapan Infrastruktur Server (Studi Kasus: Universitas Nahdlatul Ulama Yogyakarta)," *Jurnal INFORMA Politeknik Indonusa Surakarta*, vol. 5, no. 3, 2019.

[8] G. Gurbatov, "A comparison between Terraform and Ansible on their impact upon the lifecycle and security management for modifiable cloud infrastructures in OpenStack," 2022.

[9] I. P. Hariyadi and K. Marzuki, "Implementation Of Configuration Management Virtual Private Server Using Ansible," *Jurnal MATRIK*, vol. 19, no. 2, Mei 2020.

[10] M. Hasbi and N. R. Saputra, "ANALISIS QUALITY OF SERVICE (QOS) JARINGAN INTERNET KANTOR PUSAT KING BUKOPIN DENGAN MENGGUNAKAN WIRESHARK," *jurnal.umj.ac.id*, vol. 12, 2021.

[11] M. F. Islami, P. Musa, and M. Lamsani, *Jurnal Ilmiah KOMPUTASI*, vol. 19, no. 2, Juni 2020.

[12] A. Khumaidi, "IMPLEMENTATION OF DEVOPS METHOD FOR AUTOMATION OF SERVER MANAGEMENT USING ANSIBLE," *TRANSFORMTIKA*, vol. 18, no. 2, pp. 199-209, January 2021.

[13] A. Michael, H. Hermawan, and H. I. Pratiwi, "Sistem Monitoring Server Dengan Menggunakan SNMP," *Widyakala Journal*, vol. 6, no. 2, September 2019.

[14] R. T. Novita et al., "Analisis Keamanan Wifi Menggunakan Wireshark," *JES (Jurnal Elektro Smart)*, vol. 1, no. 1, Agustus 2021.

[15] O. Pramadika and D. W. Chandra, "PROVISIONING GOOGLE KUBERNETES ENGINE CLUSTER DENGAN MENGGUNAKAN TERRAFORM DAN JENKINS PADA DUA ENVIRONMENT," *JIPI (Jurnal Ilmiah Penelitian dan Pembelajaran Informatika)*, vol. 8, no. 2, pp. 597-606, Juni 2023.

[16] N. Y. Pratama, "ANALISA QoS TRANSFER DATA PLC DENGAN VOLTASE LISTRIK YANG BERUBAH," 2019.

[17] G. H. Prathama, D. Andaresta, and K. Darmaastawan, "Instalasi Framework IoT Berbasis Platform Thingsboard di Ubuntu Server," *TIERS Information Technology Journal*, vol. 2, no. 2, Desember 2021.

[18] D. Pratmanto, F. Fandhilah, and S. A. Saputra, "RANCANG BANGUN RUMAH PINTAR DENGAN PLATFORM HOME ASSISTANT BERBASIS RASPBERRY PI 3," *Jurnal Sains dan Manajemen*, vol. 7, no. 2, September 2019.

[19] A. I. Ramdhani, Z. M. Subekti, E. M. Putro, and I. Jaya, "AUTOMASI KONFIGURASI WEB SERVICE PADA UBUNTU SERVER MENGGUNAKAN ANSIBLE BERBASIS PYTHON," *JURNAL DEVICE*, vol. 13, no. 1, Mei 2023.

[20] P. Risnaldy and I. Neforawati, "Analisa QoS (Quality of Service) Zeroshell pada Mekanisme Load Balancing dan Failover," *JURNAL MULTINETICS*, vol. 6, 2020.

[21] N. Sadikin and M. Sari, "Implementasi Password Policy pada Domain Security Policy Group Policy Object (GPO) Active Directory Domain Services untuk Keamanan Jaringan di Windows Server," *Jurnal Maklumatika*, vol. 10, no. 1, 2023.

[22] Tohirin, "PENERAPAN KEAMANAN REMOTE SERVER MELALUI SSH DENGAN KOMBINASI KRIPTOGRAFI ASIMETRIS DAN AUTENTIKASI DUA LANGKAH," *Jurnal Teknologi Informasi*, vol. 4, no. 1, Juni 2020.

[23] S. Turangga, Martanto, and Y. A. W, "ANALISIS INTERNET MENGGUNAKAN PARAMETER QUALITY OF SERVICE PADA ALFAMART TUPAREV 70," *JATI (Jurnal Mahasiswa Teknik Informatika)*, vol. 6, 2022.

[24] M. Wahyun, I. Zulfa, and I. Amna, "ANALISIS T TEST PERBANDINGAN KOMPUTER SERVER LINUX DEBIAN 9 DAN WINDOWS SERVER 19 DENGAN VMWARE (Studi Kasus: Laboratorium Fakultas Teknik Informatika Universitas Gajah Putih Takengon)," *Jurnal JUTEI*, vol. 5, no. 1, pp. 31-42, Januari 2023.

[25] G. H. Wibowo and I. R. Widiasari, "Automation of two Ubuntu servers with Ansible and Telegram as notifications," *Jurnal dan Penelitian Teknik Informatika*, vol. 8, no. 1, January 2023.
