import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema.js';
import { eq, desc, asc, count, sql, like } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client, { schema });

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
    const publicSettings = rows.filter(r => !sensitiveKeys.includes(r.key));
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
export default app;

if (process.env.VERCEL !== '1') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 API Server running on http://localhost:${PORT}`);
    console.log(`📊 Database: Neon PostgreSQL`);
  });
}
