import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  const questions = await sql`SELECT * FROM form_questions;`;
  console.log(JSON.stringify(questions, null, 2));
}

run();
