# Rangkuman Proyek: Web Daftar Ulang SPMB

Berikut adalah rangkuman lengkap mengenai proyek **Web Daftar Ulang SPMB (Sistem Penerimaan Mahasiswa/Siswa Baru)** untuk SMKN 5 Kota Serang berdasarkan *source code* dan konfigurasi yang ada.

## 1. Spesifikasi & Tujuan Proyek
Proyek ini adalah website Daftar Ulang SPMB yang dirancang secara spesifik agar terlihat profesional, rapi, dapat dipercaya, dan mudah digunakan (baik untuk admin sekolah maupun siswa/orang tua). 
- **Fokus Utama:** Alur registrasi yang jelas, antarmuka *mobile-first*, pengelolaan data kelulusan, dan administrasi sekolah.
- **Fitur Utama:** Pendaftaran ulang, pengecekan kelulusan/status (dengan verifikasi NISN & Tanggal Lahir), panel admin untuk mengelola jurusan, pendaftar, dan data kelulusan.

## 2. Tech Stack (Teknologi yang Digunakan)
- **Frontend:**
  - React + Vite
  - Tailwind CSS v4 (untuk styling)
  - Framer Motion (animasi UI)
  - Zustand (State Management)
  - React Hook Form + Zod (Validasi form)
  - Lucide React (Ikon) & Sonner (Notifikasi Toast)
- **Backend / API:**
  - Node.js + Express (Bisa berjalan juga di lingkungan Vercel Serverless)
- **Database & ORM:**
  - PostgreSQL (Dihosting di Neon Database)
  - Drizzle ORM (Untuk *query* & *schema*)
- **Deployment:** Disiapkan untuk *deploy* langsung ke **Vercel** (`vercel.json` sudah tersedia).
- **Utilitas Tambahan:** `xlsx` (Pemrosesan file excel kelulusan) dan `jspdf` (Pembuatan PDF).

## 3. Database & Credential
Proyek ini terhubung ke *Neon PostgreSQL Database* dengan *connection string* yang tersimpan di file `.env`. Berikut detailnya:
- **Provider:** Neon Database (AWS AP-Southeast-1)
- **Host:** `ep-holy-grass-aodkhmfe-pooler.c-2.ap-southeast-1.aws.neon.tech`
- **Database Name:** `neondb`
- **Username:** `neondb_owner`
- **Password:** `npg_XxLeHOilB74z`
- **Connection URL:** 
  ```env
  DATABASE_URL="postgresql://neondb_owner:npg_XxLeHOilB74z@ep-holy-grass-aodkhmfe-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
  ```

## 4. Kredensial Admin Aplikasi
Untuk mengakses panel admin pada *endpoint* `/admin`, sistem memiliki password *default* (terdapat pada *seed* sistem dan *fallback authentication*):
- **Password Admin:** `admin2025`

> **Catatan:** Disarankan untuk segera mengganti password default ini melalui database (tabel `settings`) setelah deploy ke production.

## 5. Repository GitHub
Sesuai *environment* lokal, repository ini dipetakan ke:
- **Nama Repository:** `rzl89/daftar-ulang-spmb`
- **Lokasi Lokal:** `C:\Users\Acer\daftar-ulang-spmb`

## 6. Endpoint API yang Tersedia
API dibangun dalam file `server.ts`. Berikut adalah rincian API-nya:

### A. Publik (Tanpa Autentikasi Admin)
- `GET /api/health` — Cek status server.
- `GET /api/settings` — Mengambil pengaturan publik web (menyembunyikan *admin_password*).
- `GET /api/registrations/:nisn` — Mengecek status daftar ulang berdasarkan NISN.
- `POST /api/registrations` — *Submit* data pendaftaran daftar ulang baru.
- `GET /api/jurusan` — Mengambil list jurusan yang aktif.
- `POST /api/verifikasi` — Verifikasi kelulusan siswa (mencocokkan NISN dan Tanggal Lahir).

### B. Admin (Khusus Pengelolaan Data)
- `POST /api/admin/login` — Login admin.
- `GET /api/admin/stats` — Data statistik *dashboard* (total pendaftar, diterima, ditolak, dll).
- `POST /api/admin/seed` — *Endpoint* untuk mengisi data awal (jurusan dan pengaturan awal sekolah).
- **Pengaturan (Settings):**
  - `GET /api/admin/settings` & `PUT /api/admin/settings/:key`
- **Jurusan:**
  - `GET /api/admin/jurusan`
  - `POST /api/admin/jurusan`
  - `PUT /api/admin/jurusan/:id`
  - `DELETE /api/admin/jurusan/:id`
- **Pendaftaran:**
  - `GET /api/admin/registrations`
  - `PUT /api/admin/registrations/:id` (Ubah status verifikasi/diterima/ditolak)
  - `DELETE /api/admin/registrations/:id`
- **Siswa Lulus (Passed Students):**
  - `GET /api/admin/passed-students`
  - `POST /api/admin/passed-students/bulk` (Upload data kelulusan massal/CSV-Excel)
  - `DELETE /api/admin/passed-students` (Hapus/Reset semua data kelulusan)

- **Log Aktivitas:**
  - `GET /api/admin/logs` & `POST /api/admin/logs`

## 7. Skema Tabel Database (Drizzle ORM)
Sistem memiliki 6 tabel utama di database PostgreSQL:
1. **`registrations`**: Menyimpan data pendaftaran siswa (NISN, Data Pribadi, Data Orang Tua, Pilihan Jurusan, URL Dokumen, dan Status Verifikasi).
2. **`jurusan`**: Menyimpan data master jurusan sekolah (Kode, Nama, Kuota, Status Aktif).
3. **`settings`**: Menyimpan konfigurasi dinamis aplikasi dengan format *key-value* (Nama Sekolah, Kontak, Durasi Pendaftaran, Password Admin, dll).
4. **(Dihapus)**: Tabel announcements sebelumnya.
5. **`passed_students`**: Menyimpan data peserta yang dinyatakan lulus (digunakan pada fitur verifikasi kelulusan).
6. **`activity_logs`**: Menyimpan log aktivitas admin (Audit Trail) seperti siapa yang melakukan apa.

## 8. Struktur Halaman Frontend (Routing Aplikasi)
Aplikasi ini di-routing menggunakan `react-router-dom` dengan pembagian halaman sebagai berikut:

### Halaman Publik
- `/` — Beranda (Informasi, Countdown)
- `/verifikasi` — Pengecekan kelulusan (input NISN & Tanggal Lahir)
- `/daftar-ulang` — Form pengisian data diri dan upload berkas daftar ulang
- `/bukti-daftar-ulang` — Menampilkan ringkasan/cetak bukti pendaftaran

### Halaman Admin (Panel Kontrol)
- `/admin/login` — Halaman Login Admin
- `/admin/dashboard` — Menampilkan statistik ringkas (pendaftar, diterima, dll)
- `/admin/peserta` — Pengelolaan data peserta daftar ulang
- `/admin/kelulusan` — Pengelolaan data kelulusan (Upload massal & reset)
- `/admin/verifikasi` — Proses verifikasi berkas pendaftar

- `/admin/jurusan` — Mengelola master data jurusan
- `/admin/laporan` — Cetak laporan (eksport ke PDF/Excel)
- `/admin/pengaturan` — Mengelola *Settings* aplikasi (termasuk ganti password admin)
- `/admin/aktivitas` — Melihat log aktivitas admin

