import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import * as schema from './db/schema.ts';
import { eq } from 'drizzle-orm';
import { v2 as cloudinary } from 'cloudinary';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

dotenv.config();

let db: any = null;
const isSyncDb = process.argv.includes('--sync-db');
if (isSyncDb) {
  cloudinary.config({
    cloud_name: process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.VITE_CLOUDINARY_API_KEY || process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

  const sqlClient = neon(process.env.DATABASE_URL!);
  db = drizzle(sqlClient, { schema });
  console.log('✅ DB and Cloudinary initialized for sync.');
}

// ============================================================
// KONFIGURASI
// ============================================================
const SPMB_DASHBOARD_URL = 'https://operator.spmb.id/banten/257/dashboard';
const USERNAME = 'afrizalfirdaus277@gmail.com';
const PASSWORD = 'Rizal1234!';
const STUDENT_LIST_URL = 'https://operator.spmb.id/banten/257/operasional/verval/akun/smp';
const AUTH_FILE = path.join(process.cwd(), 'spmb-auth.json');
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads', 'foto-siswa');
const STATUS_FILE = path.join(process.cwd(), 'spmb-sync-status.json');

// ============================================================
// HELPER: Tulis status sinkronisasi ke file (untuk polling frontend)
// ============================================================
interface SyncStatus {
  running: boolean;
  total: number;
  processed: number;
  success: number;
  failed: number;
  currentNisn: string | null;
  currentNama: string | null;
  startedAt: string | null;
  lastUpdated: string;
  finishedAt?: string;
  error?: string;
}

function writeSyncStatus(partial: Partial<SyncStatus>) {
  let current: SyncStatus = {
    running: false,
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    currentNisn: null,
    currentNama: null,
    startedAt: null,
    lastUpdated: new Date().toISOString(),
  };
  try {
    if (fs.existsSync(STATUS_FILE)) {
      current = { ...current, ...JSON.parse(fs.readFileSync(STATUS_FILE, 'utf-8')) };
    }
  } catch { /* file missing or corrupt — use defaults */ }
  const merged = { ...current, ...partial, lastUpdated: new Date().toISOString() };
  fs.writeFileSync(STATUS_FILE, JSON.stringify(merged, null, 2));
}

// ============================================================
// HELPER: Upload to Cloudinary langsung dari Buffer
// ============================================================
async function uploadToCloudinary(buffer: Buffer, registrationId: string, nisn: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: `spmb-daftar-ulang/${registrationId}`,
        public_id: `foto-spmb-${nisn}`,
        overwrite: true,
      },
      (error: any, result: any) => {
        if (error) return reject(error);
        resolve(result.secure_url);
      }
    );
    uploadStream.end(buffer);
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
}

// ============================================================
// LOGIN: Tangani redirect SSO ke sso.posgram.id
// ============================================================
async function loginToSpmb(page: any, context: any): Promise<void> {
  console.log('\n🔑 TAHAP 1: Login ke SPMB...');

  await page.goto(SPMB_DASHBOARD_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await page.waitForTimeout(3000);

  // Cek apakah diarahkan ke SSO Posgram
  if (page.url().includes('sso.posgram.id')) {
    console.log('  ⚠️ Diarahkan ke halaman SSO Posgram, mengisi form login...');
    console.log(`     URL: ${page.url()}`);

    // Tunggu form render sepenuhnya (SSO bisa pakai React/Angular)
    await page.waitForTimeout(2000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);

    // Coba berbagai selector untuk input email
    const emailSelectors = [
      'input[type="email"]',
      'input[name="email"]',
      'input[name="identifier"]',
      'input[name="username"]',
      'input[placeholder*="email" i]',
      'input[placeholder*="Email" i]',
      'input[placeholder*="surel" i]',
      'input:not([type="password"]):not([type="hidden"]):not([type="submit"])',
    ];

    let emailFilled = false;
    for (const sel of emailSelectors) {
      try {
        const el = page.locator(sel).first();
        await el.waitFor({ state: 'visible', timeout: 5000 });
        await el.fill(USERNAME);
        emailFilled = true;
        console.log(`  ✓ Email terisi (selector: ${sel})`);
        break;
      } catch {
        continue;
      }
    }

    if (!emailFilled) {
      // Debug: screenshot + dump HTML
      await page.screenshot({ path: 'debug-sso-login.png' });
      console.log('  📸 Screenshot disimpan ke debug-sso-login.png');
      const bodyText = await page.locator('body').innerText().catch(() => '');
      console.log(`  📄 Body text (200 chars): ${bodyText.substring(0, 200)}`);
      throw new Error('❌ Tidak dapat menemukan input email di halaman SSO.');
    }

    // Isi password
    const passwordSelectors = ['input[type="password"]', 'input[name="password"]'];
    let passwordFilled = false;
    for (const sel of passwordSelectors) {
      try {
        const el = page.locator(sel).first();
        await el.waitFor({ state: 'visible', timeout: 5000 });
        await el.fill(PASSWORD);
        passwordFilled = true;
        console.log('  ✓ Password terisi');
        break;
      } catch {
        continue;
      }
    }
    if (!passwordFilled) {
      throw new Error('❌ Tidak dapat menemukan input password di halaman SSO.');
    }

    // Klik tombol submit
    const submitSelectors = [
      'button[type="submit"]',
      'button:has-text("Masuk")',
      'button:has-text("Login")',
      'button:has-text("Sign in")',
      'button:has-text("Submit")',
      'input[type="submit"]',
    ];
    let submitClicked = false;
    for (const sel of submitSelectors) {
      try {
        const el = page.locator(sel).first();
        await el.waitFor({ state: 'visible', timeout: 5000 });
        await el.click();
        submitClicked = true;
        console.log('  ✓ Tombol submit diklik');
        break;
      } catch {
        continue;
      }
    }
    if (!submitClicked) {
      // Coba press Enter sebagai fallback
      await page.keyboard.press('Enter');
      console.log('  ⚠️ Fallback: menekan Enter untuk submit');
    }

    // Tunggu redirect kembali ke dashboard operator
    try {
      await page.waitForURL(/operator\.spmb\.id/, { timeout: 60000 });
    } catch {
      await page.screenshot({ path: 'debug-sso-after-submit.png' });
      throw new Error('❌ Login gagal: tidak berhasil kembali ke dashboard SPMB setelah login SSO.');
    }

    // Simpan session untuk pemakaian berikutnya
    await context.storageState({ path: AUTH_FILE });
    console.log('  ✅ Berhasil login via SSO! URL:', page.url());
  } else if (page.url().includes('operator.spmb.id')) {
    console.log('  ✅ Sudah login (sesi tersimpan atau sudah terautentikasi). URL:', page.url());
  } else {
    // Fallback: coba isi form login langsung
    console.log('  ⚠️ Tidak terdeteksi SSO, mencoba form login langsung...');

    const emailSelectors = ['input[name="identifier"]', 'input[type="email"]', 'input[name="email"]', 'input[name="username"]'];
    let filled = false;
    for (const sel of emailSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.fill(USERNAME);
        filled = true;
        break;
      }
    }
    if (!filled) {
      const inputs = page.locator('input:visible');
      if (await inputs.count() >= 1) await inputs.first().fill(USERNAME);
    }

    for (const sel of ['input[type="password"]', 'input[name="password"]']) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.fill(PASSWORD);
        break;
      }
    }

    for (const sel of ['button[type="submit"]', 'button:has-text("Masuk")', 'button:has-text("Login")', 'button:has-text("Sign in")']) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click();
        break;
      }
    }

    try {
      await page.waitForURL(/operator\.spmb\.id/, { timeout: 60000 });
    } catch {
      throw new Error('❌ Login gagal: tidak berhasil login ke SPMB.');
    }
    await context.storageState({ path: AUTH_FILE });
    console.log('  ✅ Berhasil login! URL:', page.url());
  }

  await page.waitForTimeout(3000);
}

// ============================================================
// EKSTRAKSI FOTO: Cari "Photo murid" di Dokumen Unggahan → klik
// "Lihat Berkas" → tangkap foto dari tab baru yang terbuka.
// ============================================================
async function extractStudentPhoto(page: any, context: any, _nama: string, _nisn: string): Promise<string | null> {
  // 1. Klik tab "Berkas" (jika ada) untuk memastikan Dokumen Unggahan terlihat
  console.log('    📂 Mencari tab/section Berkas...');
  const berkasTabSelectors = [
    'text="Berkas"',
    'button:has-text("Berkas")',
    'a:has-text("Berkas")',
    'div:has-text("Berkas")',
    'span:has-text("Berkas")',
    '[role="tab"]:has-text("Berkas")',
  ];

  for (const sel of berkasTabSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      await el.click();
      console.log('    ✓ Tab Berkas diklik');
      await page.waitForTimeout(2000);
      break;
    }
  }

  // 2. Cari baris "Photo murid" / "Pas Foto" di dalam section "Dokumen Unggahan"
  console.log('    🔍 Mencari "Photo murid" di daftar dokumen...');
  const photoRowSelectors = [
    'text="Photo murid"',
    'text="Pas Foto"',
    'text="photo murid"',
    'tr:has-text("Photo")',
    'tr:has-text("photo")',
    'li:has-text("Photo")',
    'li:has-text("photo")',
    'div:has-text("Photo murid")',
  ];

  let photoRow: any = null;
  for (const sel of photoRowSelectors) {
    const el = page.locator(sel).first();
    if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
      photoRow = el;
      console.log('    ✓ Baris photo murid ditemukan');
      break;
    }
  }

  if (!photoRow) {
    // Fallback: cari "Lihat Berkas" ke-3 (karena photo adalah item ke-3)
    const allLihatBerkas = page.locator('text="Lihat Berkas"');
    const count = await allLihatBerkas.count();
    if (count >= 3) {
      photoRow = allLihatBerkas.nth(2); // index ke-2 = item ke-3
      console.log('    ⚠️ Fallback: menggunakan tombol "Lihat Berkas" ke-3');
    } else {
      console.log('    ❌ Baris photo murid tidak ditemukan');
      return null;
    }
  }

  // 3. Klik tombol "Lihat Berkas" di baris photo
  console.log('    🖱️ Mengklik "Lihat Berkas" untuk photo...');
  const lihatBerkasBtn = page.locator('a:has-text("Lihat Berkas"), button:has-text("Lihat Berkas"), span:has-text("Lihat Berkas")').first();

  // Jika photoRow adalah baris berisi teks "Photo murid", cari tombol di dekatnya
  let berkasClicked = false;
  try {
    // Coba klik langsung teks "Lihat Berkas" yang terdekat dengan baris photo
    const btnCount = await page.locator('text="Lihat Berkas"').count();
    if (btnCount >= 3) {
      // Item ke-3 → indeks ke-2
      await page.locator('text="Lihat Berkas"').nth(2).click();
      berkasClicked = true;
    } else if (await lihatBerkasBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await lihatBerkasBtn.click();
      berkasClicked = true;
    }
  } catch {
    // ignore
  }

  if (!berkasClicked) {
    console.log('    ❌ Tombol "Lihat Berkas" tidak ditemukan');
    return null;
  }

  // 4. Tangkap tab baru yang terbuka
  console.log('    ⏳ Menunggu tab baru terbuka...');
  await page.waitForTimeout(2000);

  const pages = context.pages();
  const newPage = pages.length > 1 ? pages[pages.length - 1] : null;

  if (!newPage || newPage === page) {
    console.log('    ❌ Tab baru tidak terdeteksi');
    return null;
  }

  console.log(`    ✓ Tab baru terbuka: ${newPage.url().substring(0, 80)}...`);

  // 6. Ambil buffer foto dari dalam tab baru (pakai cookie browser, bukan https.get)
  let photoBuffer: Buffer | null = null;

  if (/\.(jpg|jpeg|png|webp)(\?|$)/i.test(newPage.url())) {
    // Halaman adalah gambar langsung — screenshot page
    photoBuffer = await newPage.screenshot({ type: 'jpeg', quality: 95 });
    console.log('    ✓ Gambar langsung di-screenshot dari tab');
  } else {
    // Cari <img> terbesar & convert via canvas di dalam browser
    photoBuffer = await newPage.evaluate(async () => {
      const images = Array.from(document.querySelectorAll('img'));
      const candidates = images.filter(img => {
        const w = img.naturalWidth || img.width;
        const h = img.naturalHeight || img.height;
        if (w > 0 && h > 0 && (w < 50 || h < 50)) return false;
        if (img.src.includes('logo') || img.src.includes('Logo')) return false;
        return true;
      });
      candidates.sort((a, b) => {
        const aSize = (a.naturalWidth || a.width) * (a.naturalHeight || a.height);
        const bSize = (b.naturalWidth || b.width) * (b.naturalHeight || b.height);
        return bSize - aSize;
      });

      const img = candidates[0] || document.querySelector('img');
      if (!img || !(img instanceof HTMLImageElement)) return null;

      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      ctx.drawImage(img, 0, 0);
      // Return as base64 string, converted to Buffer di Node.js side
      return canvas.toDataURL('image/jpeg', 0.92).split(',')[1];
    }).then(base64 => base64 ? Buffer.from(base64, 'base64') : null);

    if (photoBuffer) {
      console.log('    ✓ Gambar diekstrak via canvas dari tab');
    }
  }

  // 6. Tutup tab baru
  await newPage.close();
  console.log('    🚪 Tab baru ditutup');

  return photoBuffer;
}

// ============================================================
// MAIN
// ============================================================
async function run() {
  console.log('='.repeat(60));
  console.log(`  SPMB Photo Downloader ${isSyncDb ? '(SYNC MODE)' : ''}`);
  console.log('='.repeat(60));

  let dbRegistrations: any[] = [];
  if (isSyncDb) {
    dbRegistrations = await db.query.registrations.findMany();
    console.log(`📊 Found ${dbRegistrations.length} registrations in local DB`);
  } else {
    if (!fs.existsSync(DOWNLOAD_DIR)) {
      fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
      console.log(`📁 Folder dibuat: ${DOWNLOAD_DIR}`);
    }
  }

  let toProcess: any[] = [];
  let isFromPassedStudents = false;

  if (isSyncDb) {
    // Filter registrations yang belum punya fotoSpmbUrl
    const regNeedSync = dbRegistrations.filter(r => !(r.dokumen && r.dokumen.fotoSpmbUrl));
    console.log(`📋 Registrations perlu sync: ${regNeedSync.length}/${dbRegistrations.length}`);

    if (regNeedSync.length > 0) {
      toProcess = regNeedSync;
    } else {
      // Fallback: ambil dari passed_students (data kelulusan dari SPMB)
      console.log('📋 Registrations kosong, fallback ke passed_students...');
      const passedStudents = await db.query.passedStudents.findMany();
      console.log(`📊 Found ${passedStudents.length} passed students in DB`);
      toProcess = passedStudents.map((s: any) => ({
        id: s.id,
        nisn: s.nisn,
        namaLengkap: s.namaLengkap,
        registrationId: `pending-${s.nisn}`, // placeholder untuk folder Cloudinary
        dokumen: null,
      }));
      isFromPassedStudents = true;
    }

    if (toProcess.length === 0) {
      console.log('✅ Tidak ada siswa yang perlu disinkronisasi.');
      return;
    }
    console.log(`📋 Total yang akan diproses: ${toProcess.length} siswa${isFromPassedStudents ? ' (dari passed_students)' : ''}`);
  } else {
    toProcess = [{ namaLengkap: 'NADILAH', nisn: '0107055530', registrationId: 'test-123' }];
  }

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const contextOptions: any = {
    viewport: { width: 1280, height: 800 },
  };
  if (fs.existsSync(AUTH_FILE)) {
    contextOptions.storageState = AUTH_FILE;
  }
  const context = await browser.newContext(contextOptions);
  const page = await context.newPage();

  try {
    // --- TAHAP 1: LOGIN (dengan penanganan SSO) ---
    await loginToSpmb(page, context);

    // --- TAHAP 2: NAVIGASI KE DAFTAR SISWA ---
    console.log('\n📋 TAHAP 2: Navigasi ke daftar siswa...');
    await page.goto(STUDENT_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
    await page.waitForTimeout(3000);

    if (page.url().includes('sso.posgram.id')) {
      throw new Error('❌ Session expired — redirect ke SSO lagi. Hapus spmb-auth.json dan coba ulang.');
    }
    console.log(`  ✅ Daftar siswa terbuka: ${page.url()}`);

    // --- TAHAP 3: PROSES SATU PER SATU ---
    console.log('\n📸 TAHAP 3: Mulai proses data...');

    // Tunggu halaman daftar siswa selesai render (ada tabel data)
    await page.waitForTimeout(3000);
    await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
    // Coba tunggu tabel / data muncul
    try {
      await page.waitForSelector('table, [class*="table"], [class*="datatable"]', { timeout: 10000 });
      console.log('  ✓ Tabel data ditemukan');
    } catch {
      console.log('  ⚠️ Tabel data tidak terdeteksi, melanjutkan...');
    }
    let totalProcessed = 0;
    let totalFailed = 0;

    // Tulis status awal
    writeSyncStatus({
      running: true,
      total: toProcess.length,
      processed: 0,
      success: 0,
      failed: 0,
      currentNisn: null,
      currentNama: null,
      startedAt: new Date().toISOString(),
    });

    for (let i = 0; i < toProcess.length; i++) {
      const student = toProcess[i];
      const nama = student.namaLengkap;
      const nisn = student.nisn;
      const safeFilename = sanitizeFilename(`${nisn}_${nama}`);

      // Update status: siswa yang sedang diproses
      writeSyncStatus({
        processed: i,
        currentNisn: nisn,
        currentNama: nama,
      });
      const filePath = path.join(DOWNLOAD_DIR, `${safeFilename}.jpg`);

      console.log(`\n  📷 [${i + 1}/${toProcess.length}] Mencari ${nama} (${nisn})...`);

      // Cari kolom pencarian
      const searchSelectors = [
        'input[placeholder*="Pencarian"]',
        'input[placeholder*="Cari Nama"]',
        'input[placeholder*="Cari"]',
        'input[type="search"]',
        'input[placeholder*="Search"]',
        'input[placeholder*="Nama"]',
        'input[placeholder*="NISN"]',
        '.p-inputtext',
        'input.form-control',
        'input[class*="search"]',
      ];

      let searchFound = false;
      for (const sel of searchSelectors) {
        const searchBox = page.locator(sel).first();
        if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
          await searchBox.fill('');
          await searchBox.fill(nisn);
          await searchBox.press('Enter');
          await page.waitForTimeout(3000);
          searchFound = true;
          break;
        }
      }

      if (!searchFound) {
        console.log(`    ❌ Kolom pencarian tidak ditemukan!`);

        // Cek apakah session expired (redirect ke SSO)
        const currentUrl = page.url();
        if (currentUrl.includes('sso.posgram.id') || currentUrl.includes('login')) {
          console.log('    🔄 Session expired, re-login...');
          try {
            await loginToSpmb(page, context);
            await page.goto(STUDENT_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 60000 });
            await page.waitForTimeout(3000);
            await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => null);
            // Retry search once
            for (const sel of searchSelectors) {
              const searchBox = page.locator(sel).first();
              if (await searchBox.isVisible({ timeout: 2000 }).catch(() => false)) {
                await searchBox.fill('');
                await searchBox.fill(nisn);
                await searchBox.press('Enter');
                await page.waitForTimeout(3000);
                searchFound = true;
                console.log('    ✓ Pencarian dilanjutkan setelah re-login');
                break;
              }
            }
          } catch (reloginErr: any) {
            console.log(`    ❌ Gagal re-login: ${reloginErr.message}`);
          }
        }

        if (!searchFound) {
          // Debug
          await page.screenshot({ path: 'debug-search-not-found.png' });
          const allInputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).map(el => ({
              type: (el as HTMLInputElement).type,
              placeholder: (el as HTMLInputElement).placeholder,
              name: (el as HTMLInputElement).name,
              className: (el as HTMLInputElement).className,
              visible: !!(el as HTMLInputElement).offsetParent,
            }));
          });
          console.log(`    📋 Input di halaman: ${JSON.stringify(allInputs.slice(0, 10))}`);
          totalFailed++;
          writeSyncStatus({ failed: totalFailed, processed: i + 1 });
          continue;
        }
      }

      // Cari baris siswa berdasarkan NISN
      const studentLocator = page.locator(`text="${nisn}"`).first();
      const studentVisible = await studentLocator.isVisible({ timeout: 5000 }).catch(() => false);

      if (!studentVisible) {
        console.log(`    ❌ Siswa dengan NISN ${nisn} tidak ditemukan di hasil pencarian`);
        totalFailed++;
        writeSyncStatus({ failed: totalFailed, processed: i + 1 });
        continue;
      }

      // Cari tombol aksi di baris yang sama
      const actionFound = await studentLocator.evaluate((el: any) => {
        let row = el.parentElement;
        while (row && row.parentElement && row.parentElement !== document.body) {
          const buttons = row.querySelectorAll('button');
          for (let i = 0; i < buttons.length; i++) {
            const btn = buttons[i] as HTMLElement;
            const svg = btn.querySelector('svg');
            if (svg && (svg.innerHTML.includes('circle') || btn.offsetWidth < 50)) {
              btn.setAttribute('data-target-click', 'true');
              return 'found';
            }
          }
          row = row.parentElement;
        }
        return null;
      });

      if (!actionFound) {
        console.log(`    ❌ Tombol aksi tidak ditemukan untuk ${nama}`);
        totalFailed++;
        writeSyncStatus({ failed: totalFailed, processed: i + 1 });
        continue;
      }

      console.log(`    🔘 Klik menu aksi...`);
      await page.click('[data-target-click="true"]');
      await page.waitForTimeout(1000);

      // Klik "Detail Ajuan"
      console.log(`    🔘 Klik Detail Ajuan...`);
      const detailSelectors = [
        'text="Detail Ajuan"',
        'a:has-text("Detail Ajuan")',
        'button:has-text("Detail Ajuan")',
        'li:has-text("Detail Ajuan")',
      ];
      let detailClicked = false;
      for (const sel of detailSelectors) {
        const el = page.locator(sel).first();
        if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
          await el.click();
          detailClicked = true;
          break;
        }
      }

      if (!detailClicked) {
        console.log(`    ❌ Menu "Detail Ajuan" tidak ditemukan`);
        totalFailed++;
        writeSyncStatus({ failed: totalFailed, processed: i + 1 });
        await page.goto(STUDENT_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(2000);
        continue;
      }

      await page.waitForTimeout(4000);

      // --- EKSTRAKSI FOTO: klik tab Berkas + cari foto spesifik ---
      const photoBuffer = await extractStudentPhoto(page, context, nama, nisn);

      if (photoBuffer && photoBuffer.length > 0) {
        console.log(`    🖼️ Foto ditemukan (${(photoBuffer.length / 1024).toFixed(0)} KB)`);
        if (isSyncDb) {
          console.log(`    📤 Mengunggah ke Cloudinary...`);
          try {
            const cloudinaryUrl = await uploadToCloudinary(photoBuffer, student.registrationId, nisn);

            if (!isFromPassedStudents) {
              // Update tabel registrations
              const existingDoc = student.dokumen || {};
              await db.update(schema.registrations)
                .set({ dokumen: { ...existingDoc, fotoSpmbUrl: cloudinaryUrl } })
                .where(eq(schema.registrations.id, student.id));
              console.log(`    ✅ Disimpan di Cloudinary & DB`);
            } else {
              console.log(`    ✅ Disimpan di Cloudinary: ${cloudinaryUrl}`);
            }
          } catch (uploadErr: any) {
            console.log(`    ❌ Gagal upload: ${uploadErr.message}`);
            totalFailed++;
            writeSyncStatus({ failed: totalFailed, processed: i + 1 });
            await page.goto(STUDENT_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
            await page.waitForTimeout(2000);
            continue;
          }
        } else {
          fs.writeFileSync(filePath, photoBuffer);
          console.log(`    ✅ Disimpan di: ${safeFilename}.jpg`);
        }
        totalProcessed++;
        writeSyncStatus({ success: totalProcessed, failed: totalFailed, processed: i + 1 });
      } else {
        console.log(`    ❌ Foto tidak ditemukan untuk ${nama}`);
        totalFailed++;
        writeSyncStatus({ failed: totalFailed, processed: i + 1 });
      }

      // Kembali ke daftar
      console.log(`    ↩️ Kembali ke daftar...`);
      await page.goto(STUDENT_LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
    }

    // Tulis status selesai
    writeSyncStatus({
      running: false,
      processed: toProcess.length,
      success: totalProcessed,
      failed: totalFailed,
      currentNisn: null,
      currentNama: null,
      finishedAt: new Date().toISOString(),
    });

    console.log('\n' + '='.repeat(60));
    console.log(`  SELESAI!`);
    console.log(`  ✅ Total berhasil: ${totalProcessed}`);
    console.log(`  ❌ Total gagal:   ${totalFailed}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 Error fatal:', error);
    console.error('   Script dihentikan.');
    writeSyncStatus({
      running: false,
      error: String(error),
      finishedAt: new Date().toISOString(),
    });
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
}

run();
