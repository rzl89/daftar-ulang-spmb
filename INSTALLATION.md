# Panduan Instalasi Sistem Daftar Ulang SPMB

Panduan ini akan membantu Anda mengkonfigurasi dan menjalankan Sistem Daftar Ulang SPMB di komputer lokal atau server Anda.

## Prasyarat (Requirements)

Sebelum memulai, pastikan sistem Anda telah terinstall perangkat lunak berikut:
1. **Node.js** (Versi 18.x atau lebih baru) - [Unduh di sini](https://nodejs.org/)
2. **PostgreSQL** Database (Bisa menggunakan server lokal atau layanan cloud seperti [Neon.tech](https://neon.tech) atau [Supabase](https://supabase.com))
3. **Akun Cloudinary** - Untuk penyimpanan file dan gambar secara gratis. [Daftar di sini](https://cloudinary.com/)
4. Git (Opsional, untuk versioning)

---

## Langkah Instalasi

### 1. Ekstrak Kode Sumber
Jika Anda menerima file `.zip`, ekstrak folder tersebut ke lokasi yang Anda inginkan, lalu buka terminal (Command Prompt / PowerShell / VS Code Terminal) dan arahkan ke folder tersebut:
```bash
cd daftar-ulang-spmb
```

### 2. Install Dependensi
Jalankan perintah berikut untuk mengunduh semua library yang dibutuhkan:
```bash
npm install
```

### 3. Konfigurasi Environment Variables (File .env)
Aplikasi ini membutuhkan beberapa kredensial agar bisa berjalan.
1. Salin file `.env.example` dan ubah namanya menjadi `.env`.
   ```bash
   cp .env.example .env
   ```
2. Buka file `.env` dan isi nilai-nilainya:

   * **DATABASE_URL**: URL koneksi PostgreSQL Anda.
     *(Contoh: `postgresql://postgres:password@localhost:5432/spmb_db`)*
   * **VITE_CLOUDINARY_CLOUD_NAME**: Cloud Name dari dashboard Cloudinary Anda.
   * **VITE_CLOUDINARY_API_KEY**: API Key Cloudinary Anda.
   * **CLOUDINARY_API_SECRET**: API Secret Cloudinary Anda.

### 4. Setup Database & Migrasi
Setelah `DATABASE_URL` terisi, jalankan perintah berikut untuk membuat tabel-tabel di dalam database Anda:
```bash
npx drizzle-kit push
```

### 5. Jalankan Server Development
Sekarang aplikasi siap dijalankan. Gunakan perintah:
```bash
npm run dev
```

Aplikasi akan berjalan pada alamat `http://localhost:5173/`. 
API Server berjalan secara otomatis di *background* pada port `3000` dan di-*proxy* oleh Vite.

---

## Akun Admin Default

Saat pertama kali dijalankan, sistem tidak meminta login database default. Jika Anda telah mengaktifkan sistem login, pastikan untuk membaca panduan lebih lanjut terkait pembuatan akun Admin pertama, atau login menggunakan:
* **Username:** admin
* **Password:** admin
*(Harap segera ubah pengaturan ini pada sistem produksi!)*

---

## Build untuk Produksi (Deployment)

Jika Anda ingin mengunggah aplikasi ini ke server produksi (seperti Vercel, Netlify, atau VPS):

1. **Jalankan Build Frontend:**
   ```bash
   npm run build
   ```
   Folder `dist/` akan terbentuk berisi file statis HTML/CSS/JS.

2. **Menjalankan Backend (Node.js/Express):**
   Gunakan proses manager seperti `PM2` untuk menjalankan `server.ts` yang dikompilasi, atau gunakan konfigurasi *Serverless Functions* (misal jika menggunakan Vercel).

---
*Jika ada kendala saat instalasi, silakan hubungi pengembang melalui kontak yang tersedia pada saat pembelian.*
