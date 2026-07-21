# Lampiran — Kode Perhitungan Statistik (Google Colab / Python)

Lampiran ini memuat kode perhitungan uji statistik sebagai bukti bahwa hasilnya dapat dihitung ulang. Hasil ujinya sendiri sudah tersaji di badan, sehingga tidak diulang di sini:

| Uji | Hasil di badan |
|---|---|
| Shapiro-Wilk waktu (H1) | Tabel 4.15, Gambar 4.52 |
| Mann-Whitney U (H1) | Tabel 4.16, Gambar 4.53 |
| Shapiro-Wilk selisih SUS (H3) | Tabel 4.27 |
| Paired t-test dan Wilcoxon (H3) | Tabel 4.28, Gambar 4.60 |

Tempel kode di bawah dengan style Courier New 10, spasi 1. Perhitungan dijalankan pada Google Colab (Python, pustaka SciPy).

---

## Kode

```python
import warnings
import numpy as np
from scipy import stats

# --- Data H1: waktu provisioning (detik) ---
portal = [110, 97, 94, 97, 95, 95, 110, 97, 95, 98]         # t1+t3 (Tabel 4.12)
manual = [175, 146, 138, 150, 130, 129, 128, 121, 123, 129] # t_manual (Tabel 4.11)

# Uji normalitas Shapiro-Wilk (Tabel 4.15)
for nama, x in [('Portal', portal), ('Manual', manual)]:
    W, p = stats.shapiro(x)
    print(nama, 'W =', round(W, 4), 'p =', round(p, 4))

# Uji beda Mann-Whitney U (Tabel 4.16)
with warnings.catch_warnings():
    warnings.simplefilter('ignore')
    U, p = stats.mannwhitneyu(portal, manual, alternative='two-sided', method='exact')
print('Mann-Whitney U =', U, 'p =', p)

# --- Data H3: skor SUS berpasangan (8 responden) ---
sus_portal  = [77.5, 87.5, 85.0, 92.5, 97.5, 100.0, 97.5, 100.0]
sus_proxmox = [17.5, 25.0, 17.5, 15.0, 17.5,  67.5,  72.5,  70.0]
diff = np.array(sus_portal) - np.array(sus_proxmox)

# Normalitas selisih (Tabel 4.27), paired t-test dan Wilcoxon (Tabel 4.28)
Wd, pd_diff = stats.shapiro(diff)
t, pt = stats.ttest_rel(sus_portal, sus_proxmox)
Wsr, pw = stats.wilcoxon(sus_portal, sus_proxmox)
cohen_d = diff.mean() / diff.std(ddof=1)
print('Shapiro selisih  W =', round(Wd, 4), 'p =', round(pd_diff, 4))
print('paired-t  t =', round(t, 3), 'p =', round(pt, 6))
print('Wilcoxon  W =', Wsr, 'p =', round(pw, 4))
print("Cohen's d =", round(cohen_d, 3))
```

---

## Catatan
- Kode ini bagian perhitungan dari notebook `bab4-statistik-colab.ipynb`. Bagian pembuatan grafik dihilangkan karena grafiknya sudah menjadi Gambar 4.52, 4.53, dan 4.60 di badan
- Angka keluaran kode ini sama dengan Tabel 4.15, 4.16, 4.27, dan 4.28. Kalau ada beda, angka badan yang mengikat
- Kalau prodi mensyaratkan notebook utuh, lampirkan juga `bab4-statistik-colab.ipynb` yang diekspor menjadi PDF
