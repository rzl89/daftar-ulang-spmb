# Panduan Deployment & Komersialisasi Web SPMB (Daftar Ulang)

Panduan ini berisi langkah-langkah komprehensif, detail, dan terstruktur untuk mengonfigurasi, mengunggah database, hingga menjalankan aplikasi secara *live* agar siap digunakan untuk kebutuhan komersial di berbagai instansi atau sekolah.

## 🌟 Arsitektur Sistem
- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend API**: Node.js + Express (di file `server.ts` atau Vercel Serverless Functions)
- **Database**: PostgreSQL (menggunakan Supabase/Neon/Vercel Postgres)
- **ORM**: Drizzle ORM
- **Deployment**: Vercel

---

## 📋 Prasyarat Sebelum Mulai
Pastikan Anda sudah memiliki akun di layanan berikut:
1. **GitHub** (untuk menyimpan source code)
2. **Vercel** (untuk hosting website)
3. **Penyedia Database PostgreSQL** (rekomendasi: [Supabase](https://supabase.com), [Neon](https://neon.tech), atau [Vercel Postgres](https://vercel.com/docs/storage/vercel-postgres))

---

## 🛠 Langkah 1: Persiapan Database (PostgreSQL)

Karena aplikasi ini menggunakan Drizzle ORM untuk mengelola data, Anda memerlukan URL Koneksi PostgreSQL (`DATABASE_URL`).

### Cara Membuat Database di Neon/Supabase:
1. Daftar dan buat projek/database baru di Neon.tech atau Supabase.
2. Cari menu **Connection String** atau **Database URL**.
3. Format URL koneksinya akan terlihat seperti ini:
   `postgresql://[user]:[password]@[host]:[port]/[db_name]?sslmode=require`
4. **Simpan URL ini**, kita akan menggunakannya di langkah selanjutnya.

### Migrasi & Upload Skema Database:
1. Buka terminal di VSCode pada folder proyek ini.
2. Buat file `.env` (jika belum ada) dan isi dengan:
   ```env
   DATABASE_URL=postgresql://[user]:[password]@[host]:[port]/[db_name]?sslmode=require
   ```
3. Jalankan perintah berikut untuk meng-generate skema database:
   ```bash
   npm run generate
   ```
4. Jalankan perintah ini untuk mem-push/mengupload skema (membuat tabel-tabel) langsung ke database online Anda:
   ```bash
   npm run push
   ```
   *Catatan: Jika terjadi error saat push, pastikan perintah pada `package.json` Anda sudah dikonfigurasi untuk menjalankan `drizzle-kit push`.*

---

## 🚀 Langkah 2: Konfigurasi Deployment di Vercel

Untuk mengkomersilkan web ini, web harus online dan dapat diakses publik dengan cepat dan aman.

1. **Upload ke GitHub:**
   - Pastikan source code ini sudah Anda push ke repository GitHub pribadi (*private/public*).
2. **Buat Projek di Vercel:**
   - Login ke [Vercel.com](https://vercel.com)
   - Klik **"Add New..."** -> **"Project"**
   - Pilih repository GitHub tempat Anda menyimpan web ini, lalu klik **"Import"**.
3. **Konfigurasi Environment Variables di Vercel:**
   - Pada halaman *Configure Project*, gulir ke bagian **Environment Variables**.
   - Tambahkan variabel berikut:
     - **Name**: `DATABASE_URL`
     - **Value**: Masukkan *Connection String Database* Anda (yang didapat dari langkah 1).
   - Klik **Add**.
4. **Deploy:**
   - Klik tombol **Deploy**.
   - Vercel akan otomatis melakukan build (`npm run build`). Proses ini membutuhkan waktu sekitar 1-3 menit.
   - Jika sukses, Anda akan mendapatkan URL publik website Anda (contoh: `nama-sekolah-spmb.vercel.app`).

---

## ⚙️ Langkah 3: Pengaturan Domain Kustom (Opsional Tapi Direkomendasikan)

Untuk komersialisasi, Anda pasti ingin menggunakan domain sekolah asli seperti `spmb.smkn5serang.sch.id`.

1. Di Dashboard Vercel, masuk ke project Anda.
2. Klik tab **Settings** -> **Domains**.
3. Masukkan nama domain kustom yang diinginkan, lalu klik **Add**.
4. Vercel akan memberikan konfigurasi DNS (seperti CNAME atau A Record).
5. Buka panel kontrol penyedia domain Anda (contoh: Niagahoster, Rumahweb) dan tambahkan DNS record sesuai instruksi Vercel.
6. Tunggu proses propagasi DNS (biasanya beberapa menit hingga 24 jam).

---

## 🔐 Langkah 4: Operasional & Pengaturan Aplikasi (Panel Admin)

Web ini dirancang agar dinamis dan bisa digunakan oleh banyak sekolah tanpa harus mengubah source code.

1. **Akses Panel Admin**
   Buka URL: `https://[domain-anda.com]/admin`
2. **Login Admin**
   Demi alasan keamanan, **password default tidak dicantumkan di publik**. Untuk mengetahui password login pertama kali:
   - Silakan buka file `server.ts` di *source code* proyek ini dan cari baris terkait `admin_password`.
   - Atau, cek langsung tabel `settings` di database PostgreSQL Anda setelah menjalankan migrasi.
   - **Sangat Penting:** Segera ubah password admin default Anda melalui database (`tabel settings`) sesaat setelah login pertama kali untuk mencegah akses tidak sah.
3. **Konfigurasi Pengaturan Sistem**
   Masuk ke menu **Pengaturan** dan isi data berikut:
   - Nama Sekolah (contoh: SMKN 5)
   - Nama Lengkap Sekolah (contoh: SMK Negeri 5 Kota Serang)
   - Tahun Ajaran
   - Kuota Penerimaan
   - **Batas Waktu Daftar Ulang** (Countdown timer otomatis di beranda akan membaca tanggal ini).
4. **Konfigurasi Jurusan**
   Masuk ke menu **Manajemen Jurusan** untuk menambah, mengedit, atau menghapus jurusan yang tersedia di sekolah klien.

---

## 🐛 Troubleshooting & Error Handling

- **Countdown Timer Tidak Berjalan/Acak:**
  Pastikan Anda telah mengisi "Batas Waktu Daftar Ulang" di Panel Admin dengan format tanggal dan waktu yang valid.
- **Data Peserta Tidak Tersimpan (Fetch Error):**
  Pastikan `DATABASE_URL` di Vercel sudah benar dan tabel di database telah terbuat sempurna dengan mengecek langsung di dashboard database (Supabase/Neon).
- **Gagal Upload Berkas:**
  Pastikan koneksi stabil. Fitur upload file akan memvalidasi apakah file melebihi 2MB.

---

## 🤝 Layanan Komersial & White-labeling

Jika Anda menjual sistem ini ke pihak sekolah lain:
1. Buatkan **1 Database terpisah** per sekolah klien agar data tidak bercampur.
2. Buatkan **1 Vercel Project** baru dengan melakukan import repository yang sama, namun isi `DATABASE_URL` dengan database spesifik sekolah tersebut.
3. Atur Custom Domain sesuai sekolah tersebut.
4. Sesuaikan logo dan warna aksen di Panel Pengaturan jika tersedia.

Selamat mengembangkan dan mengkomersialisasikan aplikasi ini! 🚀
