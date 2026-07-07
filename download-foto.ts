import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
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
  // Cloudinary config
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  
  const sqlClient = neon(process.env.DATABASE_URL!);
  db = drizzle(sqlClient, { schema });
  console.log('✅ DB and Cloudinary initialized for sync.');
}

// ============================================================
// KONFIGURASI
// ============================================================
const SPMB_URL = 'https://operator.spmb.id/login';
const USERNAME = 'afrizalfirdaus277@gmail.com';
const PASSWORD = 'Rizal1234!';
const STUDENT_LIST_URL = 'https://operator.spmb.id/banten/257/operasional/verval/akun/smp';
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads', 'foto-siswa');

// ============================================================
// HELPER: Upload to Cloudinary directly from Buffer
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

function getBufferFromUrl(url: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        getBufferFromUrl(response.headers.location).then(resolve).catch(reject);
        return;
      }
      const data: Buffer[] = [];
      response.on('data', (chunk) => data.push(chunk));
      response.on('end', () => resolve(Buffer.concat(data)));
    }).on('error', reject);
  });
}

function downloadFile(url: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (response) => {
      if (response.statusCode && [301, 302, 303, 307, 308].includes(response.statusCode) && response.headers.location) {
        file.close();
        fs.unlinkSync(dest);
        downloadFile(response.headers.location, dest).then(resolve).catch(reject);
        return;
      }
      response.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

function sanitizeFilename(name: string): string {
  return name.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').trim();
}

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

  // Filter who to process
  let toProcess = dbRegistrations;
  if (isSyncDb) {
    toProcess = dbRegistrations.filter(r => !(r.dokumen && r.dokumen.fotoSpmbUrl));
    console.log(`📋 Ada ${toProcess.length} siswa yang perlu disinkronisasi fotonya.`);
    if (toProcess.length === 0) {
       console.log('✅ Semua sudah tersinkronisasi.');
       return;
    }
  } else {
    // If not sync db, just for testing
    toProcess = [{ namaLengkap: 'NADILAH', nisn: '0107055530', registrationId: 'test-123' }];
  }

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('\n🔑 TAHAP 1: Login ke SPMB...');
    await page.goto(SPMB_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailSelectors = ['input[name="identifier"]', 'input[type="email"]', 'input[name="email"]', 'input[name="username"]', 'input[placeholder*="email" i]', 'input[placeholder*="username" i]'];
    let emailFilled = false;
    for (const sel of emailSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.fill(USERNAME);
        emailFilled = true;
        break;
      }
    }
    if (!emailFilled) {
      const inputs = page.locator('input:visible');
      if (await inputs.count() >= 1) await inputs.first().fill(USERNAME);
    }

    const passwordSelectors = ['input[type="password"]', 'input[name="password"]', 'input[placeholder*="password" i]'];
    for (const sel of passwordSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.fill(PASSWORD);
        break;
      }
    }

    const loginBtnSelectors = ['button[type="submit"]', 'button:has-text("Masuk")', 'button:has-text("Login")', 'button:has-text("Sign in")'];
    for (const sel of loginBtnSelectors) {
      const el = page.locator(sel).first();
      if (await el.isVisible({ timeout: 2000 }).catch(() => false)) {
        await el.click();
        break;
      }
    }

    console.log('  ⏳ Menunggu redirect...');
    await page.waitForURL(/operator\.spmb\.id/, { timeout: 60000 }).catch(() => null);
    await page.waitForTimeout(5000);
    console.log(`  ✅ Berhasil login! URL: ${page.url()}`);

    console.log('\n📋 TAHAP 2: Navigasi ke daftar siswa...');
    await page.goto(STUDENT_LIST_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);
    console.log(`  ✅ Daftar siswa terbuka`);

    console.log('\n📸 TAHAP 3: Mulai proses data...');
    let totalProcessed = 0;
    let totalFailed = 0;

    for (let i = 0; i < toProcess.length; i++) {
       const student = toProcess[i];
       const nama = student.namaLengkap;
       const nisn = student.nisn;
       const safeFilename = sanitizeFilename(`${nisn}_${nama}`);
       const filePath = path.join(DOWNLOAD_DIR, `${safeFilename}.jpg`);
       
       console.log(`\n  📷 [${i + 1}/${toProcess.length}] Mencari ${nama} (${nisn})...`);
       
       // Search student
       const searchBox = page.locator('input[type="search"], input[placeholder*="Cari" i], input[placeholder*="Search" i], .p-inputtext').first();
       if (await searchBox.isVisible({ timeout: 3000 }).catch(() => false)) {
         await searchBox.fill('');
         await searchBox.fill(nisn);
         await searchBox.press('Enter');
         await page.waitForTimeout(3000);
       } else {
         console.log(`    ❌ Kolom pencarian tidak ditemukan!`);
         totalFailed++;
         continue;
       }
       
       // Find student row using NISN
       const studentLocator = page.locator(`text="${nisn}"`).first();
       if (await studentLocator.isVisible({ timeout: 5000 }).catch(() => false)) {
          // Find the three-dots menu in the same row
          const buttonSelector = await studentLocator.evaluate((el) => {
             let row = el.parentElement;
             while (row && (!row.className || !row.className.includes('border'))) {
                if (row.parentElement === document.body) break;
                row = row.parentElement;
             }
             if (row) {
                const svgs = row.querySelectorAll('svg');
                for (let i = 0; i < svgs.length; i++) {
                   if (svgs[i].innerHTML.includes('circle') || (svgs[i].parentElement && svgs[i].parentElement.tagName === 'BUTTON')) {
                      const btn = svgs[i].closest('button') || svgs[i].parentElement;
                      if (btn) {
                        btn.setAttribute('data-target-click', 'true');
                        return 'data-target-click';
                      }
                   }
                }
             }
             return null;
          });
          
          if (buttonSelector === 'data-target-click') {
             console.log(`    🔘 Klik menu aksi...`);
             await page.click('[data-target-click="true"]');
             await page.waitForTimeout(1000);
             
             console.log(`    🔘 Klik Detail Ajuan...`);
             await page.click('text="Detail Ajuan"');
             await page.waitForTimeout(4000); // Wait for modal/page
             
             // Extract photo
             const images = await page.evaluate(() => {
                return Array.from(document.querySelectorAll('img')).map(img => img.src);
             });
             
             let downloadedUrl = '';
             // Usually the profile image is the last one or not a logo
             const possiblePhotos = images.filter(img => !img.includes('Logo') && !img.includes('logo'));
             if (possiblePhotos.length > 0) {
                // Get the last one or the one matching "Avatar" / "file.spmb.id"
                downloadedUrl = possiblePhotos[possiblePhotos.length - 1];
             }
             
             if (downloadedUrl) {
                console.log(`    🖼️ Foto ditemukan: ${downloadedUrl}`);
                if (isSyncDb) {
                   console.log(`    📤 Mengunggah ke Cloudinary...`);
                   const buffer = await getBufferFromUrl(downloadedUrl);
                   const cloudinaryUrl = await uploadToCloudinary(buffer, student.id, nisn);
                   
                   const existingDoc = student.dokumen || {};
                   await db.update(schema.registrations)
                     .set({ dokumen: { ...existingDoc, fotoSpmbUrl: cloudinaryUrl } })
                     .where(eq(schema.registrations.id, student.id));
                   
                   console.log(`    ✅ Disimpan di Cloudinary & DB`);
                } else {
                   await downloadFile(downloadedUrl, filePath);
                   console.log(`    ✅ Disimpan di: ${safeFilename}.jpg`);
                }
                totalProcessed++;
             } else {
                console.log(`    ❌ Foto tidak ditemukan untuk ${nama}`);
                totalFailed++;
             }
             
             // Go back to list
             console.log(`    ↩️ Kembali ke daftar...`);
             await page.goto(STUDENT_LIST_URL, { waitUntil: 'networkidle', timeout: 30000 });
             await page.waitForTimeout(2000);
             
          } else {
             console.log(`    ❌ Tombol aksi tidak ditemukan untuk ${nama}`);
             totalFailed++;
          }
       } else {
          console.log(`    ❌ Siswa dengan NISN ${nisn} tidak ditemukan di pencarian SPMB`);
          totalFailed++;
       }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`  SELESAI!`);
    console.log(`  ✅ Total berhasil: ${totalProcessed}`);
    console.log(`  ❌ Total gagal: ${totalFailed}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n💥 Error fatal:', error);
  } finally {
    await browser.close();
  }
}

run();
