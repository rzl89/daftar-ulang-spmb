import { pgTable, serial, varchar, text, date, timestamp, jsonb, boolean, integer } from 'drizzle-orm/pg-core';

// ===================== REGISTRATIONS TABLE =====================
export const registrations = pgTable('registrations', {
  id: serial('id').primaryKey(),
  registrationId: varchar('registration_id', { length: 20 }).notNull().unique(),
  
  // Data Pribadi
  nisn: varchar('nisn', { length: 20 }).notNull().unique(),
  namaLengkap: varchar('nama_lengkap', { length: 150 }).notNull(),
  tempatLahir: varchar('tempat_lahir', { length: 100 }).notNull(),
  tanggalLahir: date('tanggal_lahir').notNull(),
  jenisKelamin: varchar('jenis_kelamin', { length: 20 }).notNull(),
  agama: varchar('agama', { length: 50 }).notNull(),
  alamatLengkap: text('alamat_lengkap').notNull(),
  asalSekolah: varchar('asal_sekolah', { length: 150 }).notNull(),
  
  // Data Orang Tua
  namaOrangTua: varchar('nama_orang_tua', { length: 150 }).notNull(),
  pekerjaanOrangTua: varchar('pekerjaan_orang_tua', { length: 100 }).notNull(),
  noTelpOrangTua: varchar('no_telp_orang_tua', { length: 20 }).notNull(),
  
  // Akademik & Jurusan
  pilihanJurusan1: varchar('pilihan_jurusan_1', { length: 100 }).notNull(),
  pilihanJurusan2: varchar('pilihan_jurusan_2', { length: 100 }).notNull(),
  
  // Status & Dokumen
  status: varchar('status', { length: 50 }).default('MENUNGGU_VERIFIKASI').notNull(),
  dokumen: jsonb('dokumen').$type<{
    ijazahUrl?: string;
    kartuKeluargaUrl?: string;
    aktaKelahiranUrl?: string;
    pasFotoUrl?: string;
  }>(),
  
  // Timestamps
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== JURUSAN TABLE =====================
export const jurusan = pgTable('jurusan', {
  id: serial('id').primaryKey(),
  code: varchar('code', { length: 20 }).notNull().unique(),
  name: varchar('name', { length: 200 }).notNull(),
  description: text('description'),
  quota: integer('quota').default(36),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== SETTINGS TABLE =====================
export const settings = pgTable('settings', {
  id: serial('id').primaryKey(),
  key: varchar('key', { length: 100 }).notNull().unique(),
  value: text('value').notNull(),
  label: varchar('label', { length: 200 }),
  category: varchar('category', { length: 50 }).default('general').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== ANNOUNCEMENTS TABLE =====================
export const announcements = pgTable('announcements', {
  id: serial('id').primaryKey(),
  title: varchar('title', { length: 300 }).notNull(),
  content: text('content').notNull(),
  category: varchar('category', { length: 50 }).default('umum').notNull(),
  isPublished: boolean('is_published').default(false).notNull(),
  publishedAt: timestamp('published_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== ACTIVITY LOGS TABLE =====================
export const activityLogs = pgTable('activity_logs', {
  id: serial('id').primaryKey(),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description').notNull(),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: varchar('entity_id', { length: 50 }),
  performedBy: varchar('performed_by', { length: 100 }).default('admin').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===================== PASSED STUDENTS (KELULUSAN) TABLE =====================
export const passedStudents = pgTable('passed_students', {
  id: serial('id').primaryKey(),
  nisn: varchar('nisn', { length: 20 }).unique().notNull(),
  namaLengkap: varchar('nama_lengkap', { length: 255 }).notNull(),
  tanggalLahir: varchar('tanggal_lahir', { length: 50 }),
  asalSekolah: varchar('asal_sekolah', { length: 255 }),
  jurusanDiterima: varchar('jurusan_diterima', { length: 100 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ===================== LANDING PAGE BLOCKS TABLE =====================
export const landingPageBlocks = pgTable('landing_page_blocks', {
  id: serial('id').primaryKey(),
  type: varchar('type', { length: 50 }).notNull(), // 'HERO', 'STEPS', 'MAP', 'TEXT', 'IMAGE'
  content: jsonb('content').$type<{
    title?: string;
    description?: string;
    imageUrl?: string;
    html?: string;
    buttonText?: string;
    buttonLink?: string;
    [key: string]: any;
  }>().default({}).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== PAGE CONTENTS TABLE =====================
export const pageContents = pgTable('page_contents', {
  id: serial('id').primaryKey(),
  page: varchar('page', { length: 50 }).notNull(),        // 'beranda', 'verifikasi', 'daftar-ulang', 'bukti'
  section: varchar('section', { length: 100 }).notNull(), // 'hero_title', 'hero_desc', dll.
  label: varchar('label', { length: 200 }),               // Label deskriptif untuk admin
  value: text('value').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// ===================== FORM QUESTIONS TABLE =====================
export const formQuestions = pgTable('form_questions', {
  id: serial('id').primaryKey(),
  section: varchar('section', { length: 100 }).notNull(),      // 'dataPribadi', 'dataOrangTua', 'akademik', 'dokumen'
  fieldName: varchar('field_name', { length: 100 }).notNull().unique(), // key unik field
  label: varchar('label', { length: 200 }).notNull(),          // Teks label / pertanyaan
  fieldType: varchar('field_type', { length: 50 }).notNull(),  // 'text','select','date','textarea','radio'
  placeholder: varchar('placeholder', { length: 200 }),
  options: jsonb('options').$type<string[]>(),                 // Untuk select/radio
  isRequired: boolean('is_required').default(true).notNull(),
  isActive: boolean('is_active').default(true).notNull(),
  sortOrder: integer('sort_order').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});
