<div align="center">
  <img src="public/Logo%20SKEMA.png" alt="Logo" width="120" />
  
  # SPMB Registration Platform 🚀
  
  **Sistem Penerimaan & Daftar Ulang Siswa Baru Modern, Cepat, dan Dinamis**
  
  [![React](https://img.shields.io/badge/React-18.x-61DAFB?style=for-the-badge&logo=react&logoColor=white)](https://reactjs.org/)
  [![Vite](https://img.shields.io/badge/Vite-5.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
  [![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.x-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
  [![Neon DB](https://img.shields.io/badge/Neon_Postgres-00E599?style=for-the-badge&logo=postgresql&logoColor=white)](https://neon.tech/)

  *Platform terpadu untuk mengelola seluruh siklus penerimaan siswa baru, mulai dari pengumuman kelulusan, formulir pendaftaran ulang dinamis, hingga verifikasi berkas.*
</div>

---

## 🌟 Overview

SPMB Registration Platform adalah solusi *end-to-end* yang dirancang untuk mendigitalkan proses daftar ulang sekolah atau institusi pendidikan. Dibangun dengan *tech stack* modern, platform ini memberikan pengalaman yang sangat responsif bagi pendaftar dan kontrol penuh bagi administrator melalui *dashboard* interaktif.

Mengucapkan selamat tinggal pada formulir kertas dan proses manual yang memakan waktu.

---

## ✨ Features Showcase

### 1. 🏠 Modern Landing Page
Halaman beranda informatif dengan countdown batas waktu, alur pendaftaran, dan pusat informasi.
<p align="center">
  <img src="docs/screenshots/01-beranda.png" alt="Beranda" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 2. 🔍 Real-time Verification & Status Check
Siswa mengecek status kelulusan secara instan menggunakan NISN dan tanggal lahir.
<p align="center">
  <img src="docs/screenshots/02-verifikasi-kelulusan.png" alt="Verifikasi Kelulusan" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 3. 📊 Interactive Admin Dashboard
Pusat komando dengan statistik pendaftar, grafik, dan log aktivitas terkini.
<p align="center">
  <img src="docs/screenshots/03-admin-dashboard.png" alt="Admin Dashboard" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 4. 📋 Data Peserta Management
Kelola seluruh data pendaftar — filter, cari, dan pantau status setiap peserta.
<p align="center">
  <img src="docs/screenshots/04-admin-data-peserta.png" alt="Data Peserta" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 5. 📈 Excel Import & Export
Upload data kelulusan via Excel dan ekspor laporan dalam format .xlsx.
<p align="center">
  <img src="docs/screenshots/05-admin-data-kelulusan.png" alt="Data Kelulusan" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 6. ✅ One-Click Document Verification
Verifikasi berkas peserta dalam satu klik. Status otomatis berubah (*Diterima/Ditolak*).
<p align="center">
  <img src="docs/screenshots/06-admin-verifikasi-berkas.png" alt="Verifikasi Berkas" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 7. 🎓 Jurusan Management
Kelola jurusan, kuota, dan urutan tampilan untuk formulir pendaftaran.
<p align="center">
  <img src="docs/screenshots/07-admin-kelola-jurusan.png" alt="Kelola Jurusan" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 8. 📝 Dynamic Form Builder
Buat, edit, dan susun ulang (Drag & Drop) pertanyaan formulir pendaftaran. Dukungan berbagai tipe input.
<p align="center">
  <img src="docs/screenshots/08-admin-kelola-pertanyaan.png" alt="Kelola Pertanyaan" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 9. 📄 Laporan & Reporting
Rekapitulasi data pendaftar dan status verifikasi siap ekspor.
<p align="center">
  <img src="docs/screenshots/09-admin-laporan.png" alt="Laporan" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 10. 📜 Activity Log
Pantau semua aktivitas admin secara real-time untuk audit dan keamanan.
<p align="center">
  <img src="docs/screenshots/10-admin-log-aktivitas.png" alt="Log Aktivitas" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

### 11. ⚙️ System Settings
Konfigurasi penuh aplikasi — nama sekolah, logo, warna tema, batas waktu, dan lainnya.
<p align="center">
  <img src="docs/screenshots/11-admin-pengaturan.png" alt="Pengaturan" width="800" style="border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
</p>

---

## 🛠️ Tech Stack

Platform ini mengadopsi tumpukan teknologi paling modern untuk menjamin performa, keamanan, dan skalabilitas.

- **Frontend:** React 18, Vite, TypeScript
- **Styling:** Tailwind CSS, Radix UI, Framer Motion (untuk animasi halus)
- **Backend / API:** Express.js (Deployed as Serverless Functions di Vercel)
- **Database:** PostgreSQL (Hosted on Neon.tech)
- **ORM:** Drizzle ORM
- **State Management:** Zustand
- **Media Storage:** Cloudinary
- **PDF/Print:** html2canvas, jspdf

---

## 🚀 Quick Start (Local Setup)

Ingin mencoba atau mengembangkan platform ini secara lokal? Ikuti langkah-langkah berikut:

### Prerequisites
- Node.js (v18 atau lebih baru)
- Git
- Akun Neon Database (PostgreSQL)
- Akun Cloudinary (untuk penyimpanan berkas)

### Installation

1. **Clone repositori ini**
   ```bash
   git clone https://github.com/rzl89/daftar-ulang-spmb.git
   cd daftar-ulang-spmb
   ```

2. **Install dependensi**
   ```bash
   npm install
   ```

3. **Atur Environment Variables**
   Buat file `.env` di *root directory* dan isi dengan kredensial Anda:
   ```env
   # Database Configuration (Neon)
   DATABASE_URL="postgresql://user:password@ep-xxx.neon.tech/dbname?sslmode=require"

   # Security Token — generate dengan perintah di bawah
   SECRET_KEY=""

   # Cloudinary Configuration
   VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
   VITE_CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

   **🔐 Cara generate SECRET_KEY:**
   
   Jangan mengisi SECRET_KEY dengan teks sembarangan. Gunakan perintah berikut:
   
   | Sistem Operasi | Perintah |
   |---------------|----------|
   | **Linux / macOS** | `openssl rand -hex 64` |
   | **Windows (PowerShell)** | `-join ((48..57)+(65..90)+(97..122) \| Get-Random -Count 128 \| % {[char]$_})` |
   | **Windows (Git Bash)** | `openssl rand -hex 64` |
   
   Hasilnya berupa string hex 128 karakter, contoh:
   ```
   9eb136d5ae1c6e1a92bef7f3bc06e976642ac9030a0be30ff5db2a9020242080f3234d6c8564e34abfcd2a530a99e3441e5bc13e225f0f9045974068248491d6
   ```
   
   Copy hasil generate ke kolom `SECRET_KEY=` di file `.env`. 
   ⚠️ **PENTING:** Jangan gunakan contoh di atas — generate sendiri!

4. **Jalankan Database Migrations (Opsional jika DB baru)**
   *(Pastikan Anda telah mengonfigurasi skema Drizzle di folder `db/`)*

5. **Jalankan Development Server**
   ```bash
   # Jalankan Frontend & Backend secara bersamaan
   npm run dev
   ```

6. **Akses Aplikasi**
   - Publik: `http://localhost:5173`
   - Admin: `http://localhost:5173/admin` (Kredensial bawaan tergantung konfigurasi DB Anda)

---

## 📦 What's Included

| Item | Description |
|------|-------------|
| Full Source Code | React frontend + Express backend |
| Admin Dashboard | Data management, verification, reports |
| Dynamic Form Builder | Drag-and-drop question configuration |
| PDF Generation | Auto-generate registration proof with QR |
| Excel Import/Export | Bulk data management |
| Installation Guide | Step-by-step setup documentation |
| Vercel Deploy Config | Ready for serverless deployment |

---

## 📞 Contact & Support

For purchase inquiries, customization requests, or support:

- 📧 **Email:** [Hubungi via Email](mailto:afrizalfirdaus277@gmail.com)
- 💬 **WhatsApp:** [Hubungi via WhatsApp](https://wa.me/6285217975733)

*Response time: 1-2 business days.*

## ☕ Dukung Proyek Ini

Jika proyek ini membantu Anda menghemat waktu, mempermudah pekerjaan, atau sekadar membuat Anda tersenyum, pertimbangkan untuk memberikan sedikit dukungan! Uang kopi Anda sangat berarti untuk menjaga proyek ini tetap aktif dan diperbarui.

👉 **[Sawer saya di Saweria](https://saweria.co/afrizalfirdaus)**

Terima kasih banyak atas apresiasi dan dukungan Anda! 🙌

## 📝 License

This project is licensed under the **Single Use License Agreement**. See `LICENSE` for details.
