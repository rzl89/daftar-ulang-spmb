import { db } from './db/index.js';
import { formQuestions } from './db/schema.js';

async function check() {
  try {
    const questions = await db.select().from(formQuestions);
    console.log(JSON.stringify(questions, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
