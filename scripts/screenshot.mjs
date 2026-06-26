import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';

const BASE = 'https://spmb-smkn5.vercel.app';
const OUT = 'docs/screenshots';
mkdirSync(OUT, { recursive: true });

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1280, height: 800 },
  deviceScaleFactor: 2,
});

async function shot(page, name) {
  await page.waitForTimeout(500);
  await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: false });
  console.log(`  ✅ ${name}.png`);
}

// ── 1. Public pages ──────────────────────────────
console.log('\n📸 Public pages...');
const pub = await context.newPage();

await pub.goto(BASE, { waitUntil: 'networkidle' });
await shot(pub, '01-beranda');

await pub.goto(`${BASE}/verifikasi`, { waitUntil: 'networkidle' });
await shot(pub, '02-verifikasi-kelulusan');

await pub.close();

// ── 2. Admin login ───────────────────────────────
console.log('\n🔐 Logging into admin...');
const admin = await context.newPage();
await admin.goto(`${BASE}/admin/login`, { waitUntil: 'networkidle' });
await admin.fill('input[type="password"]', 'admin2025');
await admin.click('button[type="submit"]');
await admin.waitForURL('**/admin/dashboard', { timeout: 10000 });
console.log('  ✅ Logged in');

// ── 3. Admin pages ───────────────────────────────
console.log('\n📸 Admin pages...');

await shot(admin, '03-admin-dashboard');

await admin.goto(`${BASE}/admin/peserta`, { waitUntil: 'networkidle' });
await shot(admin, '04-admin-data-peserta');

await admin.goto(`${BASE}/admin/kelulusan`, { waitUntil: 'networkidle' });
await shot(admin, '05-admin-data-kelulusan');

await admin.goto(`${BASE}/admin/verifikasi`, { waitUntil: 'networkidle' });
await shot(admin, '06-admin-verifikasi-berkas');

await admin.goto(`${BASE}/admin/jurusan`, { waitUntil: 'networkidle' });
await shot(admin, '07-admin-kelola-jurusan');

await admin.goto(`${BASE}/admin/pertanyaan`, { waitUntil: 'networkidle' });
await shot(admin, '08-admin-kelola-pertanyaan');

await admin.goto(`${BASE}/admin/laporan`, { waitUntil: 'networkidle' });
await shot(admin, '09-admin-laporan');

await admin.goto(`${BASE}/admin/aktivitas`, { waitUntil: 'networkidle' });
await shot(admin, '10-admin-log-aktivitas');

await admin.goto(`${BASE}/admin/pengaturan`, { waitUntil: 'networkidle' });
await shot(admin, '11-admin-pengaturan');

await admin.close();
await browser.close();
console.log('\n🎉 Done — docs/screenshots/');
