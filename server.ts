import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema.js';
import { eq, desc, asc, count, sql, like } from 'drizzle-orm';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client, { schema });

// ================================================================
//  CLOUDINARY UPLOAD SIGNATURE
// ================================================================
app.get('/api/cloudinary/sign', (req, res) => {
  try {
    const timestamp = Math.round(new Date().getTime() / 1000);
    // API Secret dari User
    const apiSecret = process.env.CLOUDINARY_API_SECRET || '';
    
    // Cloudinary signature = sha1("timestamp=" + timestamp + apiSecret)
    const signature = crypto.createHash('sha1').update(`timestamp=${timestamp}${apiSecret}`).digest('hex');
    
    res.json({ timestamp, signature });
  } catch (error) {
    console.error('Error generating signature', error);
    res.status(500).json({ message: 'Error generating signature' });
  }
});

// ================================================================
//  HEALTH CHECK
// ================================================================
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ================================================================
//  SETTINGS — PUBLIC (non-sensitive only)
// ================================================================
app.get('/api/settings', async (_req, res) => {
  try {
    const rows = await db.query.settings.findMany();
    const sensitiveKeys = ['admin_password'];
    const publicSettings = rows.filter(r => !sensitiveKeys.includes(r.key as string));
    res.json(publicSettings);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  REGISTRATIONS — PUBLIC
// ================================================================

// GET — Cek status by NISN
app.get('/api/registrations/:nisn', async (req, res) => {
  try {
    const result = await db.query.registrations.findFirst({
      where: eq(schema.registrations.nisn, req.params.nisn),
    });
    if (!result) return res.status(404).json({ message: 'Data tidak ditemukan' });
    res.json(result);
  } catch (e: any) {
    console.error('GET /api/registrations/:nisn', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Submit new registration
app.post('/api/registrations', async (req, res) => {
  try {
    const data = req.body;
    if (!data.dataPribadi?.nisn || !data.dataPribadi?.namaLengkap) {
      return res.status(400).json({ message: 'NISN dan Nama Lengkap wajib diisi' });
    }

    const existing = await db.query.registrations.findFirst({
      where: eq(schema.registrations.nisn, data.dataPribadi.nisn),
    });
    if (existing) return res.status(400).json({ message: 'NISN sudah terdaftar sebelumnya' });

    const suffix = Math.random().toString(36).substring(2, 8).toUpperCase();
    const registrationId = `SPMB-${new Date().getFullYear()}-${suffix}`;

    const [row] = await db.insert(schema.registrations).values({
      registrationId,
      nisn: data.dataPribadi.nisn,
      namaLengkap: data.dataPribadi.namaLengkap,
      tempatLahir: data.dataPribadi.tempatLahir || '',
      tanggalLahir: data.dataPribadi.tanggalLahir || '2009-01-01',
      jenisKelamin: data.dataPribadi.jenisKelamin || 'L',
      agama: data.dataPribadi.agama || 'Islam',
      alamatLengkap: data.dataPribadi.alamat || '',
      asalSekolah: data.dataAkademik?.asalSekolah || '',
      namaOrangTua: data.dataOrtu?.namaAyah || data.dataOrtu?.namaIbu || '',
      pekerjaanOrangTua: data.dataOrtu?.pekerjaanAyah || data.dataOrtu?.pekerjaanIbu || '',
      noTelpOrangTua: data.dataOrtu?.noTelpOrtu || '',
      pilihanJurusan1: data.dataAkademik?.jurusanPilihan1 || '',
      pilihanJurusan2: data.dataAkademik?.jurusanPilihan2 || '',
      status: 'MENUNGGU_VERIFIKASI',
      dokumen: data.dokumen || null,
    }).returning();

    console.log(`✅ Pendaftaran: ${registrationId} — ${data.dataPribadi.namaLengkap}`);
    res.status(201).json(row);
  } catch (e: any) {
    console.error('POST /api/registrations', e.message);
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// ================================================================
//  JURUSAN — PUBLIC (read) + ADMIN (write)
// ================================================================

// GET — Public: list active jurusan
app.get('/api/jurusan', async (_req, res) => {
  try {
    const rows = await db.query.jurusan.findMany({
      where: eq(schema.jurusan.isActive, true),
      orderBy: [asc(schema.jurusan.sortOrder)],
    });
    res.json(rows);
  } catch (e: any) {
    console.error('GET /api/jurusan', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// GET — All jurusan (admin)
app.get('/api/admin/jurusan', async (_req, res) => {
  try {
    const rows = await db.query.jurusan.findMany({
      orderBy: [asc(schema.jurusan.sortOrder)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Create jurusan
app.post('/api/admin/jurusan', async (req, res) => {
  try {
    const { code, name, description, quota, sortOrder } = req.body;
    if (!code || !name) return res.status(400).json({ message: 'Code dan nama wajib diisi' });

    const [row] = await db.insert(schema.jurusan).values({
      code, name,
      description: description || null,
      quota: quota || 36,
      sortOrder: sortOrder || 0,
    }).returning();
    res.status(201).json(row);
  } catch (e: any) {
    console.error('POST /api/admin/jurusan', e.message);
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// PUT — Update jurusan
app.put('/api/admin/jurusan/:id', async (req, res) => {
  try {
    const { code, name, description, quota, isActive, sortOrder } = req.body;
    const [row] = await db.update(schema.jurusan)
      .set({
        ...(code !== undefined && { code }),
        ...(name !== undefined && { name }),
        ...(description !== undefined && { description }),
        ...(quota !== undefined && { quota }),
        ...(isActive !== undefined && { isActive }),
        ...(sortOrder !== undefined && { sortOrder }),
        updatedAt: new Date(),
      })
      .where(eq(schema.jurusan.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Jurusan tidak ditemukan' });
    res.json(row);
  } catch (e: any) {
    console.error('PUT /api/admin/jurusan/:id', e.message);
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// DELETE — Delete jurusan
app.delete('/api/admin/jurusan/:id', async (req, res) => {
  try {
    const [row] = await db.delete(schema.jurusan)
      .where(eq(schema.jurusan.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Jurusan tidak ditemukan' });
    res.json({ message: 'Jurusan berhasil dihapus' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  REGISTRATIONS — ADMIN
// ================================================================

// GET — List all registrations
app.get('/api/admin/registrations', async (_req, res) => {
  try {
    const rows = await db.query.registrations.findMany({
      orderBy: [desc(schema.registrations.createdAt)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT — Update registration status
app.put('/api/admin/registrations/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!['MENUNGGU_VERIFIKASI', 'DITERIMA', 'DITOLAK'].includes(status)) {
      return res.status(400).json({ message: 'Status tidak valid' });
    }
    const [row] = await db.update(schema.registrations)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.registrations.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Data tidak ditemukan' });
    console.log(`📋 Status updated: ${row.registrationId} → ${status}`);
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE — Delete registration
app.delete('/api/admin/registrations/:id', async (req, res) => {
  try {
    const [row] = await db.delete(schema.registrations)
      .where(eq(schema.registrations.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Data tidak ditemukan' });
    console.log(`🗑️ Deleted: ${row.registrationId}`);
    res.json({ message: 'Data berhasil dihapus' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  SETTINGS — ADMIN
// ================================================================

// GET — All settings
app.get('/api/admin/settings', async (_req, res) => {
  try {
    const rows = await db.query.settings.findMany();
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT — Upsert a setting
app.put('/api/admin/settings/:key', async (req, res) => {
  try {
    const { value, label, category } = req.body;
    const existing = await db.query.settings.findFirst({
      where: eq(schema.settings.key, req.params.key),
    });

    if (existing) {
      const [row] = await db.update(schema.settings)
        .set({ value, updatedAt: new Date(), ...(label && { label }), ...(category && { category }) })
        .where(eq(schema.settings.key, req.params.key))
        .returning();
      res.json(row);
    } else {
      const [row] = await db.insert(schema.settings).values({
        key: req.params.key,
        value,
        label: label || req.params.key,
        category: category || 'general',
      }).returning();
      res.status(201).json(row);
    }
  } catch (e: any) {
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// ================================================================
//  LANDING PAGE BLOCKS — PUBLIC & ADMIN
// ================================================================

// GET — Public: list active blocks
app.get('/api/landing-blocks', async (_req, res) => {
  try {
    const rows = await db.query.landingPageBlocks.findMany({
      where: eq(schema.landingPageBlocks.isActive, true),
      orderBy: [asc(schema.landingPageBlocks.sortOrder)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET — Admin: list all blocks
app.get('/api/admin/landing-blocks', async (_req, res) => {
  try {
    const rows = await db.query.landingPageBlocks.findMany({
      orderBy: [asc(schema.landingPageBlocks.sortOrder)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Create block
app.post('/api/admin/landing-blocks', async (req, res) => {
  try {
    const { type, content, sortOrder, isActive } = req.body;
    const [row] = await db.insert(schema.landingPageBlocks).values({
      type,
      content: content || {},
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();
    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// PUT — Reorder blocks (MUST be before /:id route)
app.put('/api/admin/landing-blocks/reorder', async (req, res) => {
  try {
    const { items } = req.body; // Array of { id, sortOrder }
    if (!Array.isArray(items)) return res.status(400).json({ message: 'Invalid data format' });

    for (const item of items) {
      await db.update(schema.landingPageBlocks)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(schema.landingPageBlocks.id, item.id));
    }
    res.json({ message: 'Reordered successfully' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// PUT — Update block
app.put('/api/admin/landing-blocks/:id', async (req, res) => {
  try {
    const { type, content, sortOrder, isActive } = req.body;
    const [row] = await db.update(schema.landingPageBlocks)
      .set({
        ...(type !== undefined && { type }),
        ...(content !== undefined && { content }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(schema.landingPageBlocks.id, Number(req.params.id)))
      .returning();
    
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// DELETE — Delete block
app.delete('/api/admin/landing-blocks/:id', async (req, res) => {
  try {
    const [row] = await db.delete(schema.landingPageBlocks)
      .where(eq(schema.landingPageBlocks.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  SEED — Initialize default jurusan data
// ================================================================
app.post('/api/admin/seed', async (_req, res) => {
  try {
    const defaultJurusan = [
      { code: 'TJKT', name: 'Teknik Jaringan Komputer dan Telekomunikasi', quota: 36, sortOrder: 1 },
      { code: 'PPLG', name: 'Pengembangan Perangkat Lunak dan Gim', quota: 36, sortOrder: 2 },
      { code: 'DKV', name: 'Desain Komunikasi Visual', quota: 36, sortOrder: 3 },
      { code: 'AKL', name: 'Akuntansi dan Keuangan Lembaga', quota: 36, sortOrder: 4 },
      { code: 'MP', name: 'Manajemen Perkantoran', quota: 36, sortOrder: 5 },
      { code: 'BDP', name: 'Bisnis Daring dan Pemasaran', quota: 36, sortOrder: 6 },
    ];

    for (const j of defaultJurusan) {
      const existing = await db.query.jurusan.findFirst({ where: eq(schema.jurusan.code, j.code) });
      if (!existing) {
        await db.insert(schema.jurusan).values(j);
      }
    }

    const defaultSettings = [
      { key: 'school_name', value: 'SMKN 5 KOTA SERANG', label: 'Nama Sekolah', category: 'general' },
      { key: 'school_full_name', value: 'SMK Negeri 5 Kota Serang', label: 'Nama Lengkap Sekolah', category: 'general' },
      { key: 'school_year', value: '2025/2026', label: 'Tahun Ajaran', category: 'general' },
      { key: 'school_address', value: 'Jl. Raya Gunungsari, Cilowong, Kec. Taktakan, Kota Serang, Banten', label: 'Alamat Sekolah', category: 'general' },
      { key: 'school_phone', value: '0254 7919331', label: 'No. Telepon', category: 'contact' },
      { key: 'school_email', value: 'infosmkn5@gmail.com', label: 'Email Sekolah', category: 'contact' },
      { key: 'registration_deadline_days', value: '7', label: 'Durasi Pendaftaran (hari)', category: 'registration' },
      { key: 'admin_password', value: 'admin2025', label: 'Password Admin', category: 'security' },
    ];

    for (const s of defaultSettings) {
      const existing = await db.query.settings.findFirst({ where: eq(schema.settings.key, s.key) });
      if (!existing) {
        await db.insert(schema.settings).values(s);
      }
    }

    const defaultAnnouncements = [
      { title: 'Pendaftaran Telah Dibuka', content: 'Pendaftaran siswa baru tahun ajaran 2025/2026 telah dibuka. Silakan lengkapi berkas Anda.', category: 'Pendaftaran', isPublished: true, publishedAt: new Date() },
    ];
    for (const a of defaultAnnouncements) {
      await db.insert(schema.announcements).values(a);
    }

    await db.insert(schema.activityLogs).values({
      action: 'SYSTEM_SEED',
      description: 'System seeded with default data',
      performedBy: 'system'
    });

    console.log('🌱 Seed completed');
    res.json({ message: 'Seed berhasil' });
  } catch (e: any) {
    console.error('Seed error:', e.message);
    res.status(500).json({ message: 'Seed error: ' + e.message });
  }
});

// ================================================================
//  AUTH — Simple admin login
// ================================================================
app.post('/api/admin/login', async (req, res) => {
  try {
    const { password } = req.body;
    const setting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'admin_password'),
    });
    const adminPw = setting?.value || 'admin2025';
    if (password === adminPw) {
      res.json({ success: true, token: 'admin-' + Date.now() });
    } else {
      res.status(401).json({ message: 'Password salah' });
    }
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  DASHBOARD STATS
// ================================================================
app.get('/api/admin/stats', async (_req, res) => {
  try {
    const [{ count: totalPendaftar }] = await db.select({ count: count() }).from(schema.registrations);
    const [{ count: sudahDaftarUlang }] = await db.select({ count: count() }).from(schema.registrations).where(eq(schema.registrations.status, 'DITERIMA'));
    const [{ count: belumDaftarUlang }] = await db.select({ count: count() }).from(schema.registrations).where(eq(schema.registrations.status, 'MENUNGGU_VERIFIKASI'));
    const [{ count: ditolak }] = await db.select({ count: count() }).from(schema.registrations).where(eq(schema.registrations.status, 'DITOLAK'));
    res.json({ totalPendaftar, sudahDaftarUlang, belumDaftarUlang, ditolak });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  ANNOUNCEMENTS
// ================================================================
app.get('/api/admin/announcements', async (_req, res) => {
  try {
    const rows = await db.query.announcements.findMany({
      orderBy: [desc(schema.announcements.createdAt)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/announcements', async (req, res) => {
  try {
    const { title, content, category, isPublished } = req.body;
    const [row] = await db.insert(schema.announcements).values({
      title, content, category: category || 'umum', isPublished: isPublished || false,
      publishedAt: isPublished ? new Date() : null,
    }).returning();
    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

app.put('/api/admin/announcements/:id', async (req, res) => {
  try {
    const { title, content, category, isPublished } = req.body;
    const [row] = await db.update(schema.announcements)
      .set({
        ...(title && { title }),
        ...(content && { content }),
        ...(category && { category }),
        ...(isPublished !== undefined && { isPublished }),
        ...(isPublished ? { publishedAt: new Date() } : { publishedAt: null }),
        updatedAt: new Date(),
      })
      .where(eq(schema.announcements.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.delete('/api/admin/announcements/:id', async (req, res) => {
  try {
    const [row] = await db.delete(schema.announcements)
      .where(eq(schema.announcements.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted successfully' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  PASSED STUDENTS (KELULUSAN) — ADMIN & PUBLIC
// ================================================================

// GET — All passed students (admin)
app.get('/api/admin/passed-students', async (_req, res) => {
  try {
    const rows = await db.query.passedStudents.findMany({
      orderBy: [desc(schema.passedStudents.createdAt)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Bulk insert passed students
app.post('/api/admin/passed-students/bulk', async (req, res) => {
  try {
    const { students } = req.body;
    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({ message: 'Data CSV tidak valid atau kosong' });
    }

    // Insert or update on conflict isn't natively trivial in raw bulk insert for Neon without custom SQL
    // so we'll just insert ignoring errors or filter out existing.
    // Drizzle currently has `.onConflictDoNothing()` for pg
    await db.insert(schema.passedStudents)
      .values(students)
      .onConflictDoNothing({ target: schema.passedStudents.nisn });

    res.status(201).json({ message: `${students.length} data kelulusan berhasil diunggah` });
  } catch (e: any) {
    console.error('Bulk Insert Error:', e.message);
    res.status(500).json({ message: 'Server error: ' + e.message });
  }
});

// DELETE — Reset all passed students
app.delete('/api/admin/passed-students', async (_req, res) => {
  try {
    await db.delete(schema.passedStudents);
    res.json({ message: 'Data kelulusan berhasil di-reset' });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Helper: convert Excel serial date to YYYY-MM-DD
function excelSerialToDate(serial: number): string {
  const utcDays = Math.floor(serial - 25569);
  const d = new Date(utcDays * 86400 * 1000);
  const yyyy = d.getUTCFullYear();
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(d.getUTCDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

// POST — Verifikasi kelulusan (Public)
app.post('/api/verifikasi', async (req, res) => {
  try {
    const { nisn, tanggalLahir } = req.body;
    if (!nisn || !tanggalLahir) {
      return res.status(400).json({ message: 'NISN dan Tanggal Lahir wajib diisi' });
    }

    // First, find student by NISN only
    const student = await db.query.passedStudents.findFirst({
      where: (ps, { eq }) => eq(ps.nisn, nisn),
    });

    if (!student) {
      return res.status(404).json({ message: 'Data tidak ditemukan atau Anda tidak terdaftar sebagai peserta yang lulus.' });
    }

    // Compare tanggal lahir — handle Excel serial date format
    let storedDate = student.tanggalLahir || '';
    if (/^\d{4,5}$/.test(storedDate)) {
      // It's an Excel serial number, convert it
      storedDate = excelSerialToDate(Number(storedDate));
    }

    if (storedDate !== tanggalLahir) {
      return res.status(404).json({ message: 'Tanggal lahir tidak sesuai dengan data kelulusan.' });
    }

    res.json({ success: true, data: student });
  } catch (e: any) {
    console.error('Verifikasi Error:', e.message);
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  ACTIVITY LOGS
// ================================================================
app.get('/api/admin/logs', async (_req, res) => {
  try {
    const rows = await db.query.activityLogs.findMany({
      orderBy: [desc(schema.activityLogs.createdAt)],
      limit: 50,
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/api/admin/logs', async (req, res) => {
  try {
    const { action, description, entityType, entityId, performedBy } = req.body;
    const [row] = await db.insert(schema.activityLogs).values({
      action, description, entityType, entityId, performedBy: performedBy || 'admin'
    }).returning();
    res.status(201).json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ================================================================
//  PAGE CONTENTS — Konten dinamis halaman publik
// ================================================================

// GET — Publik: ambil konten per halaman
app.get('/api/page-contents', async (req, res) => {
  try {
    const { page } = req.query;
    const where = page ? eq(schema.pageContents.page, page as string) : undefined;
    const rows = await db.query.pageContents.findMany({ where });
    // Return as object map: { section: value }
    const map: Record<string, string> = {};
    rows.forEach(r => { map[r.section] = r.value; });
    res.json(map);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET — Admin: ambil semua konten (dengan detail lengkap)
app.get('/api/admin/page-contents', async (_req, res) => {
  try {
    const rows = await db.query.pageContents.findMany({
      orderBy: [asc(schema.pageContents.page), asc(schema.pageContents.section)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT — Admin: update satu item konten
app.put('/api/admin/page-contents/:id', async (req, res) => {
  try {
    const { value, label } = req.body;
    const [row] = await db
      .update(schema.pageContents)
      .set({ value, label, updatedAt: new Date() })
      .where(eq(schema.pageContents.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Konten tidak ditemukan' });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Admin: seed konten default semua halaman
app.post('/api/admin/page-contents/seed', async (_req, res) => {
  try {
    const defaultContents = [
      // Beranda
      { page: 'beranda', section: 'hero_title', label: 'Judul Utama Hero', value: 'Daftar Ulang SPMB SMKN 5 Kota Serang' },
      { page: 'beranda', section: 'hero_subtitle', label: 'Subtitle / Deskripsi Hero', value: 'Selamat datang kepada calon peserta didik baru. Lengkapi proses daftar ulang Anda sesuai jadwal yang telah ditentukan.' },
      { page: 'beranda', section: 'hero_button', label: 'Teks Tombol Hero', value: 'Mulai Daftar Ulang' },
      { page: 'beranda', section: 'steps_title', label: 'Judul Seksi Alur Pendaftaran', value: 'Alur Daftar Ulang' },
      { page: 'beranda', section: 'steps_desc', label: 'Deskripsi Seksi Alur', value: 'Ikuti langkah-langkah berikut untuk menyelesaikan proses daftar ulang Anda.' },
      { page: 'beranda', section: 'step1_title', label: 'Langkah 1 - Judul', value: 'Verifikasi Kelulusan' },
      { page: 'beranda', section: 'step1_desc', label: 'Langkah 1 - Deskripsi', value: 'Periksa status kelulusan Anda menggunakan NISN dan tanggal lahir.' },
      { page: 'beranda', section: 'step2_title', label: 'Langkah 2 - Judul', value: 'Isi Formulir' },
      { page: 'beranda', section: 'step2_desc', label: 'Langkah 2 - Deskripsi', value: 'Lengkapi data pribadi dan unggah dokumen yang diperlukan.' },
      { page: 'beranda', section: 'step3_title', label: 'Langkah 3 - Judul', value: 'Simpan Bukti' },
      { page: 'beranda', section: 'step3_desc', label: 'Langkah 3 - Deskripsi', value: 'Unduh dan simpan bukti daftar ulang sebagai konfirmasi.' },
      { page: 'beranda', section: 'announcement_title', label: 'Judul Seksi Pengumuman', value: 'Pengumuman Terbaru' },
      { page: 'beranda', section: 'map_title', label: 'Judul Seksi Peta', value: 'Lokasi SMKN 5 Kota Serang' },
      { page: 'beranda', section: 'map_desc', label: 'Deskripsi Lokasi', value: 'Jl. Raya Pandeglang KM 3, Kota Serang, Banten' },
      // Verifikasi
      { page: 'verifikasi', section: 'page_title', label: 'Judul Halaman', value: 'Verifikasi Kelulusan' },
      { page: 'verifikasi', section: 'page_desc', label: 'Deskripsi Halaman', value: 'Masukkan NISN dan tanggal lahir Anda untuk memverifikasi status kelulusan.' },
      { page: 'verifikasi', section: 'nisn_label', label: 'Label Input NISN', value: 'Nomor Induk Siswa Nasional (NISN)' },
      { page: 'verifikasi', section: 'nisn_placeholder', label: 'Placeholder NISN', value: 'Masukkan NISN Anda' },
      { page: 'verifikasi', section: 'tgl_label', label: 'Label Tanggal Lahir', value: 'Tanggal Lahir' },
      { page: 'verifikasi', section: 'button_text', label: 'Teks Tombol Verifikasi', value: 'Verifikasi Sekarang' },
      { page: 'verifikasi', section: 'success_title', label: 'Judul Sukses', value: 'Selamat! Anda Dinyatakan Lulus' },
      { page: 'verifikasi', section: 'fail_title', label: 'Judul Gagal', value: 'Data Tidak Ditemukan' },
      // Daftar Ulang
      { page: 'daftar-ulang', section: 'page_title', label: 'Judul Halaman', value: 'Formulir Daftar Ulang' },
      { page: 'daftar-ulang', section: 'page_desc', label: 'Deskripsi Halaman', value: 'Lengkapi semua data di bawah ini dengan benar dan unggah dokumen yang diperlukan.' },
      { page: 'daftar-ulang', section: 'submit_button', label: 'Teks Tombol Submit', value: 'Kirim Pendaftaran' },
      { page: 'daftar-ulang', section: 'success_title', label: 'Judul Sukses', value: 'Pendaftaran Berhasil!' },
      { page: 'daftar-ulang', section: 'success_desc', label: 'Deskripsi Sukses', value: 'Data Anda telah berhasil disimpan. Simpan nomor pendaftaran Anda.' },
      // Bukti
      { page: 'bukti', section: 'page_title', label: 'Judul Halaman Bukti', value: 'Bukti Daftar Ulang' },
      { page: 'bukti', section: 'page_desc', label: 'Deskripsi', value: 'Berikut adalah bukti daftar ulang Anda. Simpan atau cetak dokumen ini.' },
      { page: 'bukti', section: 'print_button', label: 'Teks Tombol Cetak', value: 'Cetak Bukti' },
    ];

    // Upsert: skip jika sudah ada
    for (const item of defaultContents) {
      const existing = await db.query.pageContents.findFirst({
        where: (pc, { and, eq: eqFn }) => and(eqFn(pc.page, item.page), eqFn(pc.section, item.section)),
      });
      if (!existing) {
        await db.insert(schema.pageContents).values(item);
      }
    }
    res.json({ message: 'Seed konten halaman berhasil', total: defaultContents.length });
  } catch (e: any) {
    console.error('Seed page-contents error:', e.message);
    res.status(500).json({ message: 'Server error', detail: e.message });
  }
});

// ================================================================
//  FORM QUESTIONS — Pertanyaan dinamis form daftar ulang
// ================================================================

// GET — Publik: ambil pertanyaan aktif untuk form daftar ulang
app.get('/api/form-questions', async (_req, res) => {
  try {
    const rows = await db.query.formQuestions.findMany({
      where: eq(schema.formQuestions.isActive, true),
      orderBy: [asc(schema.formQuestions.sortOrder)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// GET — Admin: semua pertanyaan
app.get('/api/admin/form-questions', async (_req, res) => {
  try {
    const rows = await db.query.formQuestions.findMany({
      orderBy: [asc(schema.formQuestions.sortOrder)],
    });
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Admin: tambah pertanyaan baru
app.post('/api/admin/form-questions', async (req, res) => {
  try {
    const { section, fieldName, label, fieldType, placeholder, options, isRequired, isActive, sortOrder } = req.body;
    if (!section || !fieldName || !label || !fieldType) {
      return res.status(400).json({ message: 'section, fieldName, label, dan fieldType wajib diisi' });
    }
    const [row] = await db.insert(schema.formQuestions).values({
      section, fieldName, label, fieldType,
      placeholder: placeholder || null,
      options: options || null,
      isRequired: isRequired !== undefined ? isRequired : true,
      isActive: isActive !== undefined ? isActive : true,
      sortOrder: sortOrder || 0,
    }).returning();
    res.status(201).json(row);
  } catch (e: any) {
    if (e.message?.includes('unique')) {
      return res.status(400).json({ message: 'Field name sudah digunakan' });
    }
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT — Admin: update pertanyaan
app.put('/api/admin/form-questions/:id', async (req, res) => {
  try {
    const { section, fieldName, label, fieldType, placeholder, options, isRequired, isActive, sortOrder } = req.body;
    const [row] = await db
      .update(schema.formQuestions)
      .set({
        section, fieldName, label, fieldType,
        placeholder: placeholder || null,
        options: options || null,
        isRequired, isActive, sortOrder,
        updatedAt: new Date(),
      })
      .where(eq(schema.formQuestions.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Pertanyaan tidak ditemukan' });
    res.json(row);
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// DELETE — Admin: hapus pertanyaan
app.delete('/api/admin/form-questions/:id', async (req, res) => {
  try {
    const [row] = await db
      .delete(schema.formQuestions)
      .where(eq(schema.formQuestions.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Pertanyaan tidak ditemukan' });
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// PUT — Admin: reorder pertanyaan
app.put('/api/admin/form-questions/reorder', async (req, res) => {
  try {
    const { items } = req.body as { items: { id: number; sortOrder: number }[] };
    for (const item of items) {
      await db
        .update(schema.formQuestions)
        .set({ sortOrder: item.sortOrder, updatedAt: new Date() })
        .where(eq(schema.formQuestions.id, item.id));
    }
    res.json({ success: true });
  } catch (e: any) {
    res.status(500).json({ message: 'Server error' });
  }
});

// POST — Admin: seed pertanyaan default
app.post('/api/admin/form-questions/seed', async (_req, res) => {
  try {
    const defaults = [
      // Data Pribadi
      { section: 'dataPribadi', fieldName: 'nisn', label: 'NISN', fieldType: 'text', placeholder: 'Masukkan NISN 10 digit', isRequired: true, sortOrder: 1 },
      { section: 'dataPribadi', fieldName: 'namaLengkap', label: 'Nama Lengkap', fieldType: 'text', placeholder: 'Nama lengkap sesuai akta', isRequired: true, sortOrder: 2 },
      { section: 'dataPribadi', fieldName: 'tempatLahir', label: 'Tempat Lahir', fieldType: 'text', placeholder: 'Kota tempat lahir', isRequired: true, sortOrder: 3 },
      { section: 'dataPribadi', fieldName: 'tanggalLahir', label: 'Tanggal Lahir', fieldType: 'date', placeholder: '', isRequired: true, sortOrder: 4 },
      { section: 'dataPribadi', fieldName: 'jenisKelamin', label: 'Jenis Kelamin', fieldType: 'radio', options: ['Laki-laki', 'Perempuan'], isRequired: true, sortOrder: 5 },
      { section: 'dataPribadi', fieldName: 'agama', label: 'Agama', fieldType: 'select', options: ['Islam', 'Protestan', 'Katolik', 'Hindu', 'Buddha', 'Konghucu'], isRequired: true, sortOrder: 6 },
      { section: 'dataPribadi', fieldName: 'alamatLengkap', label: 'Alamat Lengkap', fieldType: 'textarea', placeholder: 'Alamat lengkap sesuai KK', isRequired: true, sortOrder: 7 },
      { section: 'dataPribadi', fieldName: 'asalSekolah', label: 'Asal Sekolah', fieldType: 'text', placeholder: 'Nama SMP/MTs asal', isRequired: true, sortOrder: 8 },
      // Data Orang Tua
      { section: 'dataOrangTua', fieldName: 'namaOrangTua', label: 'Nama Orang Tua / Wali', fieldType: 'text', placeholder: 'Nama lengkap orang tua', isRequired: true, sortOrder: 9 },
      { section: 'dataOrangTua', fieldName: 'pekerjaanOrangTua', label: 'Pekerjaan Orang Tua', fieldType: 'text', placeholder: 'Pekerjaan orang tua', isRequired: true, sortOrder: 10 },
      { section: 'dataOrangTua', fieldName: 'noTelpOrangTua', label: 'No. Telp Orang Tua', fieldType: 'text', placeholder: '08xxxxxxxxxx', isRequired: true, sortOrder: 11 },
      // Akademik
      { section: 'akademik', fieldName: 'pilihanJurusan1', label: 'Pilihan Jurusan 1', fieldType: 'select', options: [], isRequired: true, sortOrder: 12 },
      { section: 'akademik', fieldName: 'pilihanJurusan2', label: 'Pilihan Jurusan 2', fieldType: 'select', options: [], isRequired: true, sortOrder: 13 },
    ];

    let seeded = 0;
    for (const item of defaults) {
      const existing = await db.query.formQuestions.findFirst({
        where: eq(schema.formQuestions.fieldName, item.fieldName),
      });
      if (!existing) {
        await db.insert(schema.formQuestions).values({
          ...item,
          options: item.options && item.options.length > 0 ? item.options : null,
          isActive: true,
        });
        seeded++;
      }
    }
    res.json({ message: 'Seed pertanyaan berhasil', seeded });
  } catch (e: any) {
    console.error('Seed form-questions error:', e.message);
    res.status(500).json({ message: 'Server error', detail: e.message });
  }
});

// ================================================================

export default app;

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: Neon PostgreSQL`);
  });
}
