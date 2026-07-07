import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import dotenv from 'dotenv';

dotenv.config();

// Try to import DB and Cloudinary if running in sync mode
let db: any;
let schema: any;
let cloudinary: any;
let eq: any;

const isSyncDb = process.argv.includes('--sync-db');
if (isSyncDb) {
  try {
    const dbModule = require('./db/index.js');
    const schemaModule = require('./db/schema.js');
    const drizzleOrm = require('drizzle-orm');
    cloudinary = require('cloudinary').v2;
    
    // Cloudinary config
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    db = dbModule.db;
    schema = schemaModule;
    eq = drizzleOrm.eq;
    console.log('✅ DB and Cloudinary initialized for sync.');
  } catch (err) {
    console.error('❌ Failed to load DB/Cloudinary modules. Run with tsx.', err);
    process.exit(1);
  }
}

// ============================================================
// KONFIGURASI
// ============================================================
const SPMB_URL = 'https://operator.spmb.id/login';
const USERNAME = 'afrizalfirdaus277@gmail.com';
const PASSWORD = 'Rizal1234!';
const STUDENT_LIST_URL = 'https://operator.spmb.id/banten/257/operasional/verval/akun/smp';
const DOWNLOAD_DIR = path.join(process.cwd(), 'downloads', 'foto-siswa');
const MAX_PAGES = 10; // We increase this to make sure we cover all 457 students

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

  const browser = await chromium.launch({ headless: true, slowMo: 100 });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  try {
    console.log('\n🔑 TAHAP 1: Login ke SPMB...');
    await page.goto(SPMB_URL, { waitUntil: 'networkidle', timeout: 60000 });
    await page.waitForTimeout(3000);

    const emailSelectors = ['input[type="email"]', 'input[name="email"]', 'input[name="username"]', 'input[placeholder*="email" i]', 'input[placeholder*="username" i]'];
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

    for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
      console.log(`\n--- Halaman ${pageNum} dari ${MAX_PAGES} ---`);
      await page.waitForTimeout(2000);

      const rows = page.locator('table tbody tr, [class*="datatable"] tbody tr, .p-datatable-tbody tr');
      const rowCount = await rows.count();
      if (rowCount === 0) await page.waitForTimeout(5000);

      for (let i = 0; i < rowCount; i++) {
        try {
          const currentRows = page.locator('table tbody tr, [class*="datatable"] tbody tr, .p-datatable-tbody tr');
          const row = currentRows.nth(i);
          const cells = row.locator('td');
          if (await cells.count() < 3) continue;

          let nama = (await cells.nth(1).innerText()).trim().replace(/[🟢🔴🟡⚫⬤●○◉]/g, '').trim();
          let nisn = (await cells.nth(2).innerText()).trim();

          let matchingDbRecord = null;
          if (isSyncDb) {
            matchingDbRecord = dbRegistrations.find(r => r.nisn === nisn);
            if (!matchingDbRecord) {
              console.log(`  ⏭️ [${i + 1}/${rowCount}] ${nama} (${nisn}) - Tidak ada di DB kita, skip.`);
              continue;
            }
            if (matchingDbRecord.dokumen && matchingDbRecord.dokumen.fotoSpmbUrl) {
              console.log(`  ⏭️ [${i + 1}/${rowCount}] ${nama} (${nisn}) - Foto sudah tersinkronisasi, skip.`);
              continue;
            }
          }

          const safeFilename = sanitizeFilename(`${nisn}_${nama}`);
          const filePath = path.join(DOWNLOAD_DIR, `${safeFilename}.jpg`);

          if (!isSyncDb && fs.existsSync(filePath)) {
            console.log(`  ⏭️ [${i + 1}/${rowCount}] ${nama} - sudah ada, skip.`);
            continue;
          }

          console.log(`  📷 [${i + 1}/${rowCount}] Memproses ${nama} (${nisn})...`);
          const detailBtn = row.getByText(/Detail/i).first();
          if (await detailBtn.isVisible({ timeout: 2000 }).catch(() => false)) await detailBtn.click();
          else await row.locator('a, button').last().click();

          await page.waitForTimeout(3000);
          const berkasTab = page.getByText('Berkas', { exact: true }).first();
          if (await berkasTab.isVisible({ timeout: 5000 }).catch(() => false)) {
            await berkasTab.click();
            await page.waitForTimeout(2000);
          } else {
            throw new Error('Tab Berkas tidak ditemukan');
          }

          let downloadedUrl = '';
          let imageBuffer: Buffer | null = null;
          const allLihatBerkas = page.getByText(/Lihat Berkas/i);
          if (await allLihatBerkas.count() >= 3) {
            const photoLihatBerkas = allLihatBerkas.nth(2);
            const href = await photoLihatBerkas.getAttribute('href');
            if (href && href.startsWith('http')) {
              downloadedUrl = href;
            } else {
              const [newPage] = await Promise.all([
                context.waitForEvent('page', { timeout: 5000 }).catch(() => null),
                photoLihatBerkas.click(),
              ]);
              if (newPage) {
                await newPage.waitForLoadState('networkidle').catch(() => null);
                const imgEl = newPage.locator('img').first();
                if (await imgEl.isVisible({ timeout: 5000 }).catch(() => false)) {
                  let src = await imgEl.getAttribute('src');
                  if (src) downloadedUrl = src.startsWith('http') ? src : new URL(src, newPage.url()).href;
                }
                if (!downloadedUrl) {
                  const pageUrl = newPage.url();
                  if (pageUrl.match(/\.(jpg|jpeg|png|webp|gif)/i)) {
                    downloadedUrl = pageUrl;
                    imageBuffer = await (await newPage.request.get(pageUrl)).body();
                  }
                }
                await newPage.close();
              }
            }
          }

          if (downloadedUrl || imageBuffer) {
            if (isSyncDb && matchingDbRecord) {
               console.log(`    📤 Mengunggah ke Cloudinary...`);
               const buffer = imageBuffer || await getBufferFromUrl(downloadedUrl);
               const cloudinaryUrl = await uploadToCloudinary(buffer, matchingDbRecord.registrationId, nisn);
               
               // Update DB
               const existingDoc = matchingDbRecord.dokumen || {};
               await db.update(schema.registrations)
                 .set({ dokumen: { ...existingDoc, fotoSpmbUrl: cloudinaryUrl } })
                 .where(eq(schema.registrations.id, matchingDbRecord.id));
               
               console.log(`    ✅ Disimpan di Cloudinary & DB`);
            } else if (!isSyncDb && downloadedUrl) {
               await downloadFile(downloadedUrl, filePath);
               console.log(`    ✅ Disimpan di: ${safeFilename}.jpg`);
            }
            totalProcessed++;
          } else {
            console.log(`    ❌ Gagal mengambil foto untuk ${nama}`);
            totalFailed++;
          }

          await page.goto(STUDENT_LIST_URL, { waitUntil: 'networkidle', timeout: 30000 });
          await page.waitForTimeout(2000);
          if (pageNum > 1) {
            const pgBtn = page.locator(`.p-paginator button:has-text("${pageNum}"), [class*="paginator"] button:has-text("${pageNum}")`).first();
            if (await pgBtn.isVisible({ timeout: 3000 }).catch(() => false)) {
              await pgBtn.click();
              await page.waitForTimeout(2000);
            }
          }

        } catch (err) {
          console.log(`    ❌ Error: ${(err as Error).message}`);
          totalFailed++;
          await page.goto(STUDENT_LIST_URL, { waitUntil: 'networkidle', timeout: 30000 }).catch(() => null);
          await page.waitForTimeout(2000);
          if (pageNum > 1) {
            const pgBtn = page.locator(`.p-paginator button:has-text("${pageNum}")`).first();
            if (await pgBtn.isVisible({ timeout: 3000 }).catch(() => false)) await pgBtn.click();
          }
        }
      }

      if (pageNum < MAX_PAGES) {
        const nextBtn = page.getByText(`${pageNum + 1}`, { exact: true }).first();
        if (await nextBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
          await nextBtn.click();
          await page.waitForTimeout(3000);
        } else {
          const arrowNext = page.locator('[class*="paginator"] [class*="next"], .p-paginator-next').first();
          if (await arrowNext.isVisible({ timeout: 3000 }).catch(() => false)) {
            await arrowNext.click();
            await page.waitForTimeout(3000);
          } else {
            break; // No more pages
          }
        }
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
