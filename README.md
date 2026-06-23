# Portal SPMB — Sistem Penerimaan & Daftar Ulang Siswa Baru

Portal digital lengkap untuk mengelola proses Seleksi Penerimaan Murid Baru (SPMB), daftar ulang online, dan manajemen data peserta didik baru. Dirancang **multi-tenant** sehingga satu codebase dapat digunakan oleh banyak sekolah dengan konfigurasi terpisah.

---

## 🌟 Arsitektur & Tech Stack

| Layer        | Teknologi                                                                 |
|--------------|---------------------------------------------------------------------------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Framer Motion, dnd-kit (Drag-and-Drop)   |
| **Backend**  | Node.js + Express (file `server.ts`) — juga mendukung Vercel Serverless   |
| **Database** | PostgreSQL (Neon / Supabase / Vercel Postgres)                            |
| **ORM**      | Drizzle ORM + Drizzle Kit                                                 |
| **Deploy**   | Vercel                                                                    |

---

## 📦 Fitur Utama

### Halaman Publik (Pengunjung / Calon Siswa)
- **Beranda Dinamis** — Konten halaman utama dikelola dari Panel Admin (blok-blok yang bisa diatur urutannya).
- **Countdown Timer** — Hitung mundur otomatis menuju batas waktu daftar ulang.
- **Verifikasi Kelulusan** — Calon siswa memasukkan NISN + tanggal lahir untuk cek status kelulusan SPMB.
- **Formulir Daftar Ulang** — Form multi-step: data pribadi, data akademik, data orang tua, dan upload berkas.
- **Cetak Bukti Daftar Ulang** — Setelah registrasi berhasil, siswa dapat mencetak lembar bukti pendaftaran.
- **Peta Lokasi & Kontak** — Embed Google Maps dan informasi kontak sekolah.

### Panel Admin (`/admin`)
- **Dashboard** — Statistik ringkasan: total pendaftar, sudah daftar ulang, menunggu verifikasi, ditolak.
- **Data Peserta** — Tabel lengkap semua pendaftar. Admin bisa memfilter, melihat detail, dan menghapus data.
- **Data Kelulusan** — Upload data kelulusan via file CSV/Excel (bulk insert). Reset data kelulusan.
- **Verifikasi Berkas** — Ubah status pendaftaran: `MENUNGGU_VERIFIKASI` → `DITERIMA` / `DITOLAK`.
- **Pengumuman** — CRUD pengumuman dengan kategori dan status publikasi.
- **Kelola Jurusan** — CRUD jurusan/program keahlian (kode, nama, kuota, urutan, aktif/nonaktif).
- **Kelola Landing Page (Baru!)** — Drag-and-drop builder untuk mengatur konten halaman Beranda:
  - **Blok Hero** — Banner utama dengan countdown.
  - **Blok Alur Pendaftaran (Steps)** — Langkah-langkah daftar ulang.
  - **Blok Peta & Kontak (Map)** — Informasi lokasi & kontak sekolah.
  - **Blok Teks Custom** — Konten HTML bebas yang bisa diedit admin.
  - **Blok Gambar** — Upload gambar via URL.
  - Admin bisa **mengaktifkan/menonaktifkan**, **mengurutkan ulang** (drag-and-drop), dan **mengedit konten** setiap blok.
- **Laporan** — Ekspor dan ringkasan data pendaftaran.
- **Log Aktivitas** — Riwayat tindakan admin (audit trail).
- **Pengaturan** — Konfigurasi: nama sekolah, tahun ajaran, alamat, kontak, batas waktu daftar ulang, password admin.

---

## 🗄 Skema Database (Drizzle ORM)

Semua tabel didefinisikan di `db/schema.ts`:

| Tabel                  | Deskripsi                                                              |
|------------------------|------------------------------------------------------------------------|
| `registrations`        | Data pendaftaran siswa (NISN, nama, jurusan pilihan, status, dsb.)     |
| `passed_students`      | Data kelulusan SPMB (diupload via CSV)                                 |
| `settings`             | Pengaturan sistem key-value (nama sekolah, password admin, dsb.)       |
| `announcements`        | Pengumuman dengan kategori dan status publikasi                        |
| `jurusan`              | Daftar jurusan/program keahlian                                        |
| `landing_page_blocks`  | Blok konten landing page (type, content JSON, sort order, is_active)   |
| `activity_logs`        | Log aktivitas admin                                                    |

---

## 🔌 API Endpoints

### Publik (Tanpa Autentikasi)

| Method | Endpoint                  | Deskripsi                                   |
|--------|---------------------------|---------------------------------------------|
| GET    | `/api/health`             | Health check                                |
| GET    | `/api/settings`           | Ambil pengaturan publik (tanpa password)     |
| GET    | `/api/jurusan`            | Daftar jurusan aktif                         |
| GET    | `/api/landing-blocks`     | Daftar blok landing page aktif (sorted)      |
| GET    | `/api/registrations/:nisn`| Cek status pendaftaran berdasarkan NISN      |
| POST   | `/api/registrations`      | Submit pendaftaran baru                      |
| POST   | `/api/verifikasi`         | Verifikasi kelulusan (NISN + tanggal lahir)  |

### Admin

| Method | Endpoint                              | Deskripsi                          |
|--------|---------------------------------------|------------------------------------|
| POST   | `/api/admin/login`                    | Login admin (password check)       |
| GET    | `/api/admin/stats`                    | Statistik dashboard                |
| GET    | `/api/admin/registrations`            | Semua data pendaftaran             |
| PUT    | `/api/admin/registrations/:id`        | Update status pendaftaran          |
| DELETE | `/api/admin/registrations/:id`        | Hapus data pendaftaran             |
| GET    | `/api/admin/settings`                 | Semua pengaturan (termasuk sensitif)|
| PUT    | `/api/admin/settings/:key`            | Upsert pengaturan                  |
| GET    | `/api/admin/jurusan`                  | Semua jurusan (termasuk nonaktif)  |
| POST   | `/api/admin/jurusan`                  | Tambah jurusan                     |
| PUT    | `/api/admin/jurusan/:id`              | Edit jurusan                       |
| DELETE | `/api/admin/jurusan/:id`              | Hapus jurusan                      |
| GET    | `/api/admin/landing-blocks`           | Semua blok landing page            |
| POST   | `/api/admin/landing-blocks`           | Tambah blok baru                   |
| PUT    | `/api/admin/landing-blocks/:id`       | Edit blok                          |
| PUT    | `/api/admin/landing-blocks/reorder`   | Reorder blok (drag-and-drop)       |
| DELETE | `/api/admin/landing-blocks/:id`       | Hapus blok                         |
| GET    | `/api/admin/passed-students`          | Semua data kelulusan               |
| POST   | `/api/admin/passed-students/bulk`     | Bulk insert data kelulusan (CSV)   |
| DELETE | `/api/admin/passed-students`          | Reset semua data kelulusan         |
| GET    | `/api/admin/announcements`            | Semua pengumuman                   |
| POST   | `/api/admin/announcements`            | Tambah pengumuman                  |
| PUT    | `/api/admin/announcements/:id`        | Edit pengumuman                    |
| DELETE | `/api/admin/announcements/:id`        | Hapus pengumuman                   |
| GET    | `/api/admin/logs`                     | 50 log aktivitas terbaru           |
| POST   | `/api/admin/logs`                     | Catat log aktivitas                |
| POST   | `/api/admin/seed`                     | Seed data default                  |

---

## 📋 Prasyarat

1. **Node.js** ≥ 18
2. **npm** ≥ 9
3. Akun **GitHub**, **Vercel**, dan penyedia **PostgreSQL** (Neon/Supabase)

---

## 🛠 Instalasi & Pengembangan Lokal

```bash
# 1. Clone repository
git clone https://github.com/[username]/daftar-ulang-spmb.git
cd daftar-ulang-spmb

# 2. Install dependencies
npm install

# 3. Buat file .env
echo "DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db_name]?sslmode=require" > .env

# 4. Push skema database
npm run push

# 5. Seed data awal (opsional — jalankan sekali setelah tabel dibuat)
# Panggil endpoint: POST http://localhost:3000/api/admin/seed

# 6. Jalankan server backend (development)
npx tsx server.ts

# 7. Jalankan frontend (di terminal terpisah)
npm run dev
```

---

## 🚀 Deployment ke Vercel

1. **Push ke GitHub** — Pastikan source code sudah di repository.
2. **Import di Vercel** — Login ke [vercel.com](https://vercel.com), klik *Add New > Project*, pilih repo.
3. **Set Environment Variable:**
   - `DATABASE_URL` = Connection String PostgreSQL Anda.
4. **Deploy** — Klik Deploy. Build otomatis dalam 1-3 menit.
5. **Domain Kustom (opsional):**
   - Di Vercel > Settings > Domains, tambahkan domain (contoh: `spmb.smkn5serang.sch.id`).
   - Ikuti instruksi DNS yang diberikan Vercel.

---

## 🔐 Operasional Panel Admin

1. **Akses:** Buka `https://[domain-anda]/admin`
2. **Login:** Password default ada di tabel `settings` (key: `admin_password`) atau di `server.ts`. **Segera ubah setelah login pertama.**
3. **Langkah Awal:**
   - Isi Pengaturan Sistem (nama sekolah, tahun ajaran, kontak, batas waktu daftar ulang).
   - Kelola Jurusan.
   - Upload Data Kelulusan (CSV).
   - Atur Landing Page sesuai kebutuhan.
   - Buat Pengumuman.

---

## 🐛 Troubleshooting

| Masalah                           | Solusi                                                                 |
|-----------------------------------|------------------------------------------------------------------------|
| Countdown timer tidak berjalan    | Isi "Batas Waktu Daftar Ulang" di Pengaturan dengan format tanggal valid |
| Data peserta tidak tersimpan      | Cek `DATABASE_URL` dan pastikan tabel terbuat di database              |
| Gagal upload berkas               | Pastikan koneksi stabil, file tidak melebihi 2MB                       |
| Landing page kosong               | Tambahkan blok di menu Kelola Landing Page atau biarkan kosong (default akan tampil) |

---

## 🤝 White-labeling & Multi-Tenant

Untuk menjual ke sekolah lain:
1. Buat **1 database terpisah** per sekolah.
2. Buat **1 Vercel project** baru, import repo yang sama, set `DATABASE_URL` berbeda.
3. Atur domain kustom per sekolah.
4. Sesuaikan pengaturan via Panel Admin (tidak perlu ubah code).

---

## 📄 Lisensi

Hak cipta dilindungi. Hubungi pengembang untuk lisensi komersial.
