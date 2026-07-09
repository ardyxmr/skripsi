# Kuesioner SUS (*System Usability Scale*) — siap isi

Instrumen pengukuran kebergunaan portal ExoVirt. **Responden ≥ 5** orang. Tiap responden menyelesaikan **satu tugas nyata** (mis. mengajukan *provisioning* 1 VM lewat portal) lalu mengisi 10 pernyataan berikut. Skala **1 = Sangat Tidak Setuju … 5 = Sangat Setuju**.

## Butir Pernyataan (10 butir baku)

| No | Pernyataan | 1 | 2 | 3 | 4 | 5 |
|---:|-----------|:-:|:-:|:-:|:-:|:-:|
| 1 | Saya rasa akan sering menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 2 | Saya merasa sistem ini terlalu rumit. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 3 | Saya rasa sistem ini mudah digunakan. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 4 | Saya membutuhkan bantuan orang teknis untuk dapat menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 5 | Saya merasa fitur-fitur sistem ini terintegrasi dengan baik. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 6 | Saya merasa terlalu banyak ketidakkonsistenan pada sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 7 | Saya rasa kebanyakan orang akan cepat memahami cara menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 8 | Saya merasa sistem ini membingungkan untuk digunakan. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 9 | Saya merasa percaya diri saat menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |
| 10 | Saya perlu belajar banyak hal terlebih dahulu sebelum dapat menggunakan sistem ini. | ☐ | ☐ | ☐ | ☐ | ☐ |

*(Butir ganjil bernada positif, butir genap bernada negatif — ini disengaja.)*

---

## Cara menghitung skor (rumus baku SUS)

Untuk **tiap responden**:
1. **Butir ganjil (1,3,5,7,9):** kontribusi = **(nilai − 1)**.
2. **Butir genap (2,4,6,8,10):** kontribusi = **(5 − nilai)**.
3. Jumlahkan 10 kontribusi (rentang 0–40), lalu **× 2,5** → **Skor SUS (0–100)**.

**Contoh** satu responden menjawab semua = 4 (butir positif) & 2 (butir negatif):
ganjil (4−1)=3 ×5 = 15; genap (5−2)=3 ×5 = 15; total 30 × 2,5 = **75**.

---

## Lembar rekap jawaban (isi nilai 1–5)

| Responden | Q1 | Q2 | Q3 | Q4 | Q5 | Q6 | Q7 | Q8 | Q9 | Q10 | **Skor SUS** |
|-----------|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:---:|:------------:|
| R1 | | | | | | | | | | | |
| R2 | | | | | | | | | | | |
| R3 | | | | | | | | | | | |
| R4 | | | | | | | | | | | |
| R5 | | | | | | | | | | | |
| … | | | | | | | | | | | |
| **Rata-rata** | | | | | | | | | | | **____** |

---

## Interpretasi skor (rujukan Bangor et al.; Brooke, 1996)

| Rentang Skor SUS | Kategori | Grade |
|------------------|----------|:-----:|
| ≥ 80,3 | Excellent | A |
| 68 – 80,2 | Good / **Acceptable** | B–C |
| **68** | Ambang batas dapat diterima (*acceptable*) | — |
| 51 – 67 | OK / marginal | D |
| < 51 | Poor (tidak dapat diterima) | F |

**Indikator keberhasilan (bab3 §3.3.5):** skor SUS rata-rata **≥ 68** → kebergunaan *acceptable* → **Hipotesis 3 diterima**.

**Bukti yang disimpan** (`presentation/bukti/sus/`): screenshot formulir (mis. Google Form), rekap jawaban mentah, dan perhitungan skor.
