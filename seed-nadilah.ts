import dotenv from 'dotenv';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './db/schema.ts';

dotenv.config();

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

async function run() {
  await db.insert(schema.registrations).values({
    registrationId: 'TEST-NADILAH',
    nisn: '0107055530',
    namaLengkap: 'nadilah',
    tempatLahir: 'Jakarta',
    tanggalLahir: '2007-05-05',
    jenisKelamin: 'P',
    agama: 'Islam',
    alamatLengkap: 'Jl. Test Nadilah',
    asalSekolah: 'SMP Test',
    namaOrangTua: 'Bapak Test',
    pekerjaanOrangTua: 'PNS',
    noTelpOrangTua: '08123456789',
    pilihanJurusan1: 'RPL',
    pilihanJurusan2: 'TKJ',
    statusVerifikasi: 'PENDING'
  });
  console.log('✅ Inserted Nadilah');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
