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



### 1. 🔍 Real-time Verification & Status Check
Siswa dapat mengecek status kelulusan mereka secara instan menggunakan Nomor Peserta atau NISN. Sistem akan memberikan informasi *real-time* mengenai hasil seleksi.
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
</p>

### 2. 📝 Dynamic Form Builder
Fitur unggulan di mana Admin dapat **membuat, mengedit, dan menyusun ulang (Drag & Drop)** pertanyaan formulir pendaftaran. Mendukung berbagai tipe input (Teks, Pilihan Ganda, Tanggal, hingga Upload Dokumen).
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
</p>

### 3. ☁️ Seamless Cloud Document Upload
Terintegrasi langsung dengan **Cloudinary**. Peserta dapat mengunggah berkas persyaratan (seperti Kartu Keluarga, Ijazah, dll) dengan cepat dan aman tanpa membebani server lokal.
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
</p>

### 4. 📄 Automatic PDF & QR Code Generation
Setelah berhasil mendaftar ulang, sistem secara otomatis menghasilkan **Bukti Daftar Ulang dalam format PDF** yang dilengkapi dengan **QR Code** unik untuk kemudahan verifikasi fisik oleh panitia.
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
</p>

### 5. 📊 Interactive Admin Dashboard & Analytics
Pusat komando bagi panitia. Memantau statistik pendaftar harian, kuota jurusan, dan status verifikasi melalui grafik interaktif yang memanjakan mata.
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
</p>

### 6. ✅ One-Click Verification System
Panitia dapat memverifikasi berkas yang diunggah peserta dalam satu klik. Peserta akan langsung melihat perubahan status (*Diterima/Ditolak/Menunggu*) di portal mereka.
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
</p>

### 7. 📈 Excel Reporting & Export
Butuh data untuk rekapitulasi luring? Ekspor semua data pendaftar dan status verifikasi ke dalam format Excel (.xlsx) hanya dengan satu tombol.
<p align="center">
  <p align="center">
  <i>📸 Screenshots available upon request.</i>
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

   # Security Token
   SECRET_KEY="ganti_dengan_kunci_rahasia_anda_yang_panjang_dan_aman"

   # Cloudinary Configuration
   VITE_CLOUDINARY_CLOUD_NAME="your_cloud_name"
   VITE_CLOUDINARY_API_KEY="your_api_key"
   CLOUDINARY_API_SECRET="your_api_secret"
   ```

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

## 💰 Pricing & License

This project is sold under a **Single Use License Agreement**. One purchase = one school/domain installation.

See `LICENSE` for full terms. Key points:
- ✅ Use on a single school domain
- ✅ Modify and customize freely
- ✅ Full source code included
- ❌ No redistribution or resale
- ❌ No SaaS/multi-tenant use

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

- 📧 **Email:** [Hubungi via Email](mailto:contact@example.com)
- 💬 **WhatsApp:** [Hubungi via WhatsApp](https://wa.me/62xxxxxxxx)

*Response time: 1-2 business days.*

---

## 📝 License

This project is licensed under the **Single Use License Agreement**. See `LICENSE` for details.
