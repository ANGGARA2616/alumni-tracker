# Sistem Pelacakan Alumni

Aplikasi berbasis web untuk melacak profil alumni menggunakan sumber data publik. Sistem ini dapat digunakan oleh tim administrator atau operasional kampus untuk memverifikasi pencapaian alumni.


## Live Demo
Akses Web: [https://alumni-tracker-plum.vercel.app/](https://alumni-tracker-plum.vercel.app/)

## Teknologi Utama
- **Backend:** FastAPI, Python, SQLAlchemy, APScheduler
- **Database:** SQLite
- **Frontend:** Vanilla JavaScript, HTML5, Vanilla CSS (Premium Glassmorphism Aesthetic)

## Instruksi Menjalankan (Lokal)

1. Pastikan Anda memiliki Python 3.9+.
2. Buka terminal di folder project utama (`d:\sites\daily-project3-rk`).
3. Buat virtual environment: `python -m venv venv`
4. Aktifkan environment:
   - Windows: `venv\Scripts\activate`
   - Linux/Mac: `source venv/bin/activate`
5. Install dependensi: `pip install -r requirements.txt`
6. Jalankan server: `uvicorn main:app --reload`
7. Buka browser di alamat: `http://localhost:8000`

## Tabel Pengujian / Skenario

| Fitur yang Diuji | Aspek Kualitas (ISO 25010) | Skenario Uji | Hasil yang Diharapkan | Status |
|------------------|---------------------------|--------------|-----------------------|--------|
| Fitur Opt-Out Alumni | Functional Suitability (Fungsionalitas) | Mengatur status profil alumni menjadi opt_out = TRUE. | Sistem tidak memasukkan alumni tersebut ke dalam antrean scheduler pencarian. | Pass |
| Logika Disambiguasi Nama & Afiliasi | Functional Suitability (Akurasi Data) | Memasukkan kandidat dengan nama sama tetapi afiliasi bukan "UMM" atau prodi terkait. | Sistem memberikan skor confidence rendah (<40) dan status menjadi 'Tidak Cocok'. | Pass |
| Verifikasi Silang (Cross-Validation) | Reliability (Keandalan Data) | Sistem menemukan kandidat di LinkedIn dan Google Scholar dengan jabatan/afiliasi yang cocok. | Skor confidence kandidat bertambah secara otomatis (+15). | Pass |
| Penanganan Error Scraping/API | Reliability (Toleransi Kesalahan) | Memutus koneksi internet atau menyimulasikan API limit reached saat sistem memanggil API. | Sistem tidak crash, mencatat error di log, dan melompat ke profil alumni berikutnya. | Pass |
| Antarmuka Review Admin | Usability (Kebergunaan) | Admin membuka halaman dashboard untuk melihat alumni berstatus 'Perlu Verifikasi Manual'. | Admin dapat melihat 5 kandidat teratas beserta ringkasan info untuk diverifikasi. | Pass |
| Eksekusi Scheduler Berkala | Performance Efficiency (Kinerja) | Menjalankan job pelacakan untuk antrean massal sekaligus. | Sistem memproses antrean di background tanpa membuat web menjadi lambat/berhenti merespons (waktu respons web tetap < 2 detik). | Pass |

*Catatan: Status Pass dibuktikan berdasarkan implementasi testing yang sudah dicover dan disimulasikan di dalam `services/tracking_logic.py`, di mana sistem menghasilkan skor evaluasi, filtering terhadap request yang melanggar rule rate limit "API_LIMIT_USER", dan verifikasi multiple mock data.*
