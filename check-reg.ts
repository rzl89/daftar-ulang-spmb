import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './db/schema.ts';
import 'dotenv/config';

async function main() {
  const sql = neon(process.env.DATABASE_URL!);
  const db = drizzle(sql, { schema });

  try {
    const registrations = await db.query.registrations.findMany({ limit: 1 });
    console.log(JSON.stringify(registrations[0], null, 2));
  } catch (err) {
    console.error(err);
  }
}

main();
