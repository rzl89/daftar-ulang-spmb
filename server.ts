import express from 'express';
import cors from 'cors';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema.js';
import { eq, desc, asc, count, sql, like } from 'drizzle-orm';
import { cache } from './memoryCache.js';
import dotenv from 'dotenv';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { z } from 'zod';

dotenv.config();

// --- Startup validation ---
if (!process.env.SECRET_KEY) {
  console.error('❌ FATAL: SECRET_KEY environment variable is not set.');
  console.error('   Generate one with: openssl rand -hex 64');
  console.error('   Add it to your .env file as SECRET_KEY=<generated-value>');
  process.exit(1);
}

const app = express();

// Security headers (CSP, X-Frame-Options, HSTS, etc.)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      fontSrc: ["'self'"],
      connectSrc: ["'self'", "https://api.cloudinary.com"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
    },
  },
}));

// CORS — restrict to allowed origins
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',').map(o => o.trim()) || [
  'http://localhost:5173',
  'http://localhost:3000',
];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (server-to-server, curl, etc.)
    if (!origin) return callback(null, true);
    // Check exact matches
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Allow vercel.app preview/staging deployments (same-origin requests)
    if (/^https?:\/\/.*\.vercel\.app$/.test(origin)) return callback(null, true);
    callback(new Error(`Origin ${origin} not allowed by CORS`));
  },
  credentials: true,
}));
app.use(express.json({ limit: '5mb' }));
app.use(cookieParser());

// Rate limiting
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { message: 'Terlalu banyak percobaan login. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { message: 'Terlalu banyak permintaan. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// ================================================================
//  AUTH MIDDLEWARE
// ================================================================
const authMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  // Only the login endpoint is public
  if (req.path === '/api/admin/login') {
    return next();
  }

  if (req.path.startsWith('/api/admin')) {
    // Check httpOnly cookie first, then fall back to Authorization header
    let token = req.cookies?.admin_token;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized: No token provided' });
    }

    try {
      const decoded = jwt.verify(token, process.env.SECRET_KEY!);
      (req as any).admin = decoded;
      next();
    } catch (err) {
      return res.status(401).json({ message: 'Unauthorized: Invalid token' });
    }
  } else {
    next();
  }
};

app.use(authMiddleware);
app.use('/api/', apiLimiter);

const sql_client = neon(process.env.DATABASE_URL!);
const db = drizzle(sql_client, { schema });

// ================================================================
//  CLOUDINARY UPLOAD SIGNATURE
// ================================================================
// Rate limiter khusus upload signature — lebih ketat
const uploadSignLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10,
  message: { message: 'Terlalu banyak permintaan signature. Coba lagi nanti.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.get('/api/cloudinary/sign', uploadSignLimiter, (req, res) => {
  try {
    const apiSecret = process.env.CLOUDINARY_API_SECRET;
    if (!apiSecret) {
      console.error('CLOUDINARY_API_SECRET is not configured');
      return res.status(500).json({ message: 'Upload service is not configured' });
    }

    const folder = req.query.folder as string | undefined;
    const timestamp = Math.round(new Date().getTime() / 1000);
    
    // Cloudinary signature = sha1(sorted_params + apiSecret)
    let signString = '';
    if (folder) {
      signString += `folder=${folder}&`;
    }
    signString += `timestamp=${timestamp}${apiSecret}`;

    const signature = crypto.createHash('sha1').update(signString).digest('hex');

    res.json({ timestamp, signature, folder });
  } catch (error) {
    console.error('Error generating signature', error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    const CACHE_KEY = 'settings:public';
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const rows = await db.query.settings.findMany();
    const sensitiveKeys = ['admin_password'];
    const publicSettings = rows.filter(r => !sensitiveKeys.includes(r.key as string));
    cache.set(CACHE_KEY, publicSettings, 5 * 60 * 1000); // 5 min TTL
    res.json(publicSettings);
  } catch (e: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ================================================================
//  SOCIAL MEDIA — PUBLIC
// ================================================================
app.get('/api/social-media', async (_req, res) => {
  try {
    const CACHE_KEY = 'social-media:public';
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const rows = await db.query.socialMedia.findMany({
      where: eq(schema.socialMedia.isActive, true),
      orderBy: asc(schema.socialMedia.sortOrder),
    });
    cache.set(CACHE_KEY, rows, 5 * 60 * 1000); // 5 min TTL
    res.json(rows);
  } catch (e: any) {
    console.error('GET /api/social-media', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET — List sekolah asal unik
app.get('/api/sekolah-asal', async (_req, res) => {
  try {
    const rows = await db.query.passedStudents.findMany({
      columns: { asalSekolah: true }
    });
    // Gunakan Set untuk mendapatkan nilai unik
    const uniqueSchools = Array.from(new Set(rows.map(r => (r.asalSekolah || '').trim()).filter(Boolean))).sort();
    res.json(uniqueSchools);
  } catch (e: any) {
    console.error('GET /api/sekolah-asal', e.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// Zod schema for server-side registration validation
const RegistrationSchema = z.object({
  dataPribadi: z.object({
    nisn: z.string().length(10, 'NISN harus 10 digit').regex(/^\d+$/, 'NISN harus berupa angka'),
    namaLengkap: z.string().max(150).optional().default(''),
    tempatLahir: z.string().max(100).optional().default(''),
    tanggalLahir: z.string().optional().default(''),
    jenisKelamin: z.string().optional().default('L'),
    agama: z.string().max(50).optional().default(''),
    alamat: z.string().max(500).optional().default(''),
  }),
  dataOrtu: z.object({
    namaAyah: z.string().max(150).optional().default(''),
    pekerjaanAyah: z.string().max(100).optional().default(''),
    namaIbu: z.string().max(150).optional().default(''),
    pekerjaanIbu: z.string().max(100).optional().default(''),
    noTelpOrtu: z.string().max(20).optional().default(''),
  }),
  dataAkademik: z.object({
    asalSekolah: z.string().max(150).optional().default(''),
    jurusanPilihan1: z.string().optional().default(''),
    jurusanPilihan2: z.string().optional().default(''),
  }),
  dokumen: z.object({
    ijazahUrl: z.string().url().optional(),
    kartuKeluargaUrl: z.string().url().optional(),
    aktaKelahiranUrl: z.string().url().optional(),
    pasFotoUrl: z.string().url().optional(),
  }).optional(),
  // Dynamic fields managed by admin via Kelola Pertanyaan
  dynamicData: z.record(z.string(), z.any()).optional(),
});

// POST — Submit new registration (with server-side validation)
app.post('/api/registrations', async (req, res) => {
  try {
    // Server-side validation
    const parsed = RegistrationSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Data tidak valid',
        errors: parsed.error.flatten().fieldErrors,
      });
    }

    const data = parsed.data;

    const existing = await db.query.registrations.findFirst({
      where: eq(schema.registrations.nisn, data.dataPribadi.nisn),
    });
    if (existing) return res.status(400).json({ message: 'NISN sudah terdaftar sebelumnya' });

    // Check registration deadline
    const deadlineSetting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'registration_deadline'),
    });
    if (deadlineSetting?.value) {
      if (new Date() > new Date(deadlineSetting.value)) {
        return res.status(403).json({ message: 'Batas waktu daftar ulang telah berakhir.' });
      }
    }

    // Check if registration is open
    const isOpen = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'is_registration_open'),
    });
    if (isOpen?.value === 'false') {
      return res.status(403).json({ message: 'Pendaftaran sedang ditutup oleh admin.' });
    }

    const suffix = crypto.randomBytes(4).toString('hex').toUpperCase();
    const registrationId = `SPMB-${new Date().getFullYear()}-${suffix}`;

    const [row] = await db.insert(schema.registrations).values({
      registrationId,
      nisn: data.dataPribadi.nisn,
      namaLengkap: data.dataPribadi.namaLengkap,
      tempatLahir: data.dataPribadi.tempatLahir,
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
      dynamicData: data.dynamicData || {},
    }).returning();

    console.log(`✅ Pendaftaran: ${registrationId} — ${data.dataPribadi.namaLengkap}`);
    res.status(201).json(row);
  } catch (e: any) {
    console.error('POST /api/registrations', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// GET — All jurusan (admin)
app.get('/api/admin/jurusan', async (_req, res) => {
  try {
    const CACHE_KEY = 'jurusan:admin';
    const cached = cache.get(CACHE_KEY);
    if (cached) return res.json(cached);

    const rows = await db.query.jurusan.findMany({
      orderBy: [asc(schema.jurusan.sortOrder)],
    });
    cache.set(CACHE_KEY, rows, 2 * 60 * 1000); // 2 min TTL
    res.json(rows);
  } catch (e: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    cache.invalidate('jurusan:admin');
    res.status(201).json(row);
  } catch (e: any) {
    console.error('POST /api/admin/jurusan', e.message);
    console.error(e); res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    cache.invalidate('jurusan:admin');
    res.json(row);
  } catch (e: any) {
    console.error('PUT /api/admin/jurusan/:id', e.message);
    console.error(e); res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE — Delete jurusan
app.delete('/api/admin/jurusan/:id', async (req, res) => {
  try {
    const [row] = await db.delete(schema.jurusan)
      .where(eq(schema.jurusan.id, Number(req.params.id)))
      .returning();
    if (!row) return res.status(404).json({ message: 'Jurusan tidak ditemukan' });
    cache.invalidate('jurusan:admin');
    res.json({ message: 'Jurusan berhasil dihapus' });
  } catch (e: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ================================================================
//  SETTINGS — ADMIN
// ================================================================

// GET — All settings (password hash is filtered out)
app.get('/api/admin/settings', async (_req, res) => {
  try {
    const rows = await db.query.settings.findMany();
    const sensitiveKeys = ['admin_password'];
    const safeSettings = rows.filter(r => !sensitiveKeys.includes(r.key as string));
    res.json(safeSettings);
  } catch (e: any) {
    console.error('GET /api/admin/settings', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT — Upsert a setting
app.put('/api/admin/settings/:key', async (req, res) => {
  try {
    const { value, label, category } = req.body;
    const existing = await db.query.settings.findFirst({
      where: eq(schema.settings.key, req.params.key),
    });

    let finalValue = value;
    if (req.params.key === 'admin_password') {
      const salt = await bcrypt.genSalt(10);
      finalValue = await bcrypt.hash(value, salt);
    }

    if (existing) {
      const [row] = await db.update(schema.settings)
        .set({ value: finalValue, updatedAt: new Date(), ...(label && { label }), ...(category && { category }) })
        .where(eq(schema.settings.key, req.params.key))
        .returning();
      cache.invalidate('settings:public');
      res.json(row);
    } else {
      const [row] = await db.insert(schema.settings).values({
        key: req.params.key,
        value: finalValue,
        label: label || req.params.key,
        category: category || 'general',
      }).returning();
      cache.invalidate('settings:public');
      res.status(201).json(row);
    }
  } catch (e: any) {
    console.error(e); res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// ================================================================
//  SOCIAL MEDIA — ADMIN CRUD
// ================================================================

// GET — All social media (active + inactive)
app.get('/api/admin/social-media', async (_req, res) => {
  try {
    const rows = await db.query.socialMedia.findMany({
      orderBy: asc(schema.socialMedia.sortOrder),
    });
    res.json(rows);
  } catch (e: any) {
    console.error('GET /api/admin/social-media', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// POST — Create new social media
app.post('/api/admin/social-media', async (req, res) => {
  try {
    const { name, url, icon, sortOrder, isActive } = req.body;
    if (!name || !url || !icon) {
      return res.status(400).json({ message: 'Nama, URL, dan Ikon wajib diisi' });
    }
    const [row] = await db.insert(schema.socialMedia).values({
      name,
      url,
      icon,
      sortOrder: sortOrder || 0,
      isActive: isActive !== undefined ? isActive : true,
    }).returning();
    cache.invalidate('social-media:public');
    res.status(201).json(row);
  } catch (e: any) {
    console.error('POST /api/admin/social-media', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// PUT — Update social media
app.put('/api/admin/social-media/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { name, url, icon, sortOrder, isActive } = req.body;
    const [row] = await db.update(schema.socialMedia)
      .set({
        ...(name !== undefined && { name }),
        ...(url !== undefined && { url }),
        ...(icon !== undefined && { icon }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(schema.socialMedia.id, id))
      .returning();
    if (!row) return res.status(404).json({ message: 'Data tidak ditemukan' });
    cache.invalidate('social-media:public');
    res.json(row);
  } catch (e: any) {
    console.error('PUT /api/admin/social-media/:id', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE — Remove social media
app.delete('/api/admin/social-media/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(schema.socialMedia).where(eq(schema.socialMedia.id, id));
    cache.invalidate('social-media:public');
    res.json({ message: 'Social media berhasil dihapus' });
  } catch (e: any) {
    console.error('DELETE /api/admin/social-media/:id', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});


// ================================================================
//  SEED — Initialize default jurusan data
// ================================================================
app.post('/api/admin/seed', async (_req, res) => {
  try {
    const defaultJurusan = [
      { code: 'JURUSAN1', name: 'Nama Jurusan 1', quota: 36, sortOrder: 1 },
      { code: 'JURUSAN2', name: 'Nama Jurusan 2', quota: 36, sortOrder: 2 },
    ];

    for (const j of defaultJurusan) {
      const existing = await db.query.jurusan.findFirst({ where: eq(schema.jurusan.code, j.code) });
      if (!existing) {
        await db.insert(schema.jurusan).values(j);
      }
    }

    const defaultSettings = [
      { key: 'school_name', value: 'NAMA SEKOLAH', label: 'Nama Sekolah', category: 'general' },
      { key: 'school_full_name', value: 'Nama Lengkap Sekolah', label: 'Nama Lengkap Sekolah', category: 'general' },
      { key: 'school_year', value: 'YYYY/YYYY', label: 'Tahun Ajaran', category: 'general' },
      { key: 'school_address', value: 'Alamat Sekolah', label: 'Alamat Sekolah', category: 'general' },
      { key: 'school_phone', value: '(021) 12345678', label: 'No. Telepon', category: 'contact' },
      { key: 'school_email', value: 'email@sekolah.sch.id', label: 'Email Sekolah', category: 'contact' }
    ];

    const salt = await bcrypt.genSalt(10);
    const adminPassword = process.env.DEFAULT_ADMIN_PASSWORD || crypto.randomBytes(8).toString('hex');
    const defaultHashedPassword = await bcrypt.hash(adminPassword, salt);
    defaultSettings.push({ key: 'admin_password', value: defaultHashedPassword, label: 'Password Admin', category: 'security' });

    for (const s of defaultSettings) {
      const existing = await db.query.settings.findFirst({ where: eq(schema.settings.key, s.key) });
      if (!existing) {
        await db.insert(schema.settings).values(s);
      }
    }


    await db.insert(schema.activityLogs).values({
      action: 'SYSTEM_SEED',
      description: 'System seeded with default data',
      performedBy: 'system'
    });

    console.log('🌱 Seed completed');
    console.log(`🔐 Default admin password: ${adminPassword} — change it immediately via Pengaturan page.`);
    res.json({ message: 'Seed berhasil', adminPassword: process.env.DEFAULT_ADMIN_PASSWORD ? undefined : adminPassword });
  } catch (e: any) {
    console.error('Seed error:', e);
    res.status(500).json({ message: 'Terjadi kesalahan server saat seeding' });
  }
});

// ================================================================
//  AUTH — Simple admin login
// ================================================================
app.post('/api/admin/login', loginLimiter, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ message: 'Password wajib diisi' });
    }

    const setting = await db.query.settings.findFirst({
      where: eq(schema.settings.key, 'admin_password'),
    });
    const adminPwHash = setting?.value || '';

    if (!adminPwHash) {
      return res.status(500).json({ message: 'Server belum dikonfigurasi. Jalankan seed terlebih dahulu.' });
    }

    const isMatch = await bcrypt.compare(password, adminPwHash);

    if (isMatch) {
      const token = jwt.sign({ role: 'admin' }, process.env.SECRET_KEY!, { expiresIn: '4h' });
      // Set httpOnly cookie as primary auth mechanism
      res.cookie('admin_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 4 * 60 * 60 * 1000, // 4 hours
        path: '/',
      });
      // Also return token in response for fallback (sessionStorage in SPAs)
      res.json({ success: true, token });
    } else {
      res.status(401).json({ message: 'Password salah' });
    }
  } catch (e: any) {
    console.error('Login error:', e);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    console.error(e); res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

// DELETE — Reset all passed students
app.delete('/api/admin/passed-students', async (_req, res) => {
  try {
    await db.delete(schema.passedStudents);
    res.json({ message: 'Data kelulusan berhasil di-reset' });
  } catch (e: any) {
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
});

function getPossibleDateNorms(dateStr: string): string[] {
  if (!dateStr) return [];
  const trimmed = dateStr.trim();
  const results = new Set<string>();

  // Excel serial dates
  if (/^\d{4,5}$/.test(trimmed)) {
    const serial = Number(trimmed);
    const utcDays = Math.floor(serial - 25569);
    const d = new Date(utcDays * 86400 * 1000);
    const yyyy = d.getUTCFullYear();
    const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
    const dd = String(d.getUTCDate()).padStart(2, '0');
    results.add(`${yyyy}-${mm}-${dd}`);
    return Array.from(results);
  }

  // Already YYYY-MM-DD (possibly with time suffix)
  if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) {
    results.add(trimmed.substring(0, 10));
    return Array.from(results);
  }

  // Handle dd/mm/yyyy or mm/dd/yyyy or yyyy/mm/dd
  const match = trimmed.match(/^(\d{1,4})[/\-](\d{1,2})[/\-](\d{1,4})$/);
  if (match) {
    const p1 = parseInt(match[1], 10);
    const p2 = parseInt(match[2], 10);
    const p3 = parseInt(match[3], 10);

    // Format: YYYY-MM-DD
    if (p1 > 1000) {
      results.add(`${p1}-${String(p2).padStart(2, '0')}-${String(p3).padStart(2, '0')}`);
    } 
    // Format: DD-MM-YYYY or MM-DD-YYYY
    else if (p3 > 1000) {
      if (p1 <= 12 && p2 <= 31) {
        // Assume MM-DD-YYYY
        results.add(`${p3}-${String(p1).padStart(2, '0')}-${String(p2).padStart(2, '0')}`);
      }
      if (p2 <= 12 && p1 <= 31) {
        // Assume DD-MM-YYYY
        results.add(`${p3}-${String(p2).padStart(2, '0')}-${String(p1).padStart(2, '0')}`);
      }
    }
    
    if (results.size > 0) return Array.from(results);
  }

  // Fallback: try parsing as JS Date
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    const yyyy = parsed.getFullYear();
    const mm = String(parsed.getMonth() + 1).padStart(2, '0');
    const dd = String(parsed.getDate()).padStart(2, '0');
    results.add(`${yyyy}-${mm}-${dd}`);
  }

  if (results.size === 0) {
    results.add(trimmed);
  }

  return Array.from(results);
}

// POST — Verifikasi kelulusan (Public)
app.post('/api/verifikasi', async (req, res) => {
  try {
    const { nisn, tanggalLahir, namaLengkap, tempatLahir, jenisKelamin } = req.body;
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

    // Normalize both dates to YYYY-MM-DD before comparison
    const storedDateOptions = getPossibleDateNorms(student.tanggalLahir || '');
    const inputDateOptions = getPossibleDateNorms(tanggalLahir);

    // Check if there is any intersection between stored and input possibilities
    const isDateMatch = inputDateOptions.some(date => storedDateOptions.includes(date));

    if (!isDateMatch) {
      return res.status(404).json({ field: 'tanggalLahir', message: 'Tanggal lahir tidak sesuai dengan data kelulusan.' });
    }

    const normalizeStr = (str: string) => (str || '').trim().toLowerCase().replace(/\s+/g, ' ');

    if (namaLengkap && normalizeStr(student.namaLengkap) !== normalizeStr(namaLengkap)) {
      return res.status(404).json({ field: 'namaLengkap', message: 'Nama lengkap tidak sesuai dengan data kelulusan.' });
    }

    res.json({ success: true, data: student });
  } catch (e: any) {
    console.error('Verifikasi Error:', e.message);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    res.status(500).json({ message: 'Terjadi kesalahan server' });
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
    console.error('Seed form-questions error:', e);
    res.status(500).json({ message: 'Terjadi kesalahan server saat seeding pertanyaan' });
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
