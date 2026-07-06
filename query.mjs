import { neon } from '@neondatabase/serverless';
import { config } from 'dotenv';
config();

const sql = neon(process.env.DATABASE_URL);
const questions = await sql`SELECT id, section, field_name as "fieldName", label, is_active as "isActive" FROM form_questions WHERE section = 'dataOrangTua'`;
console.log('Data Orang Tua Questions:', questions);
