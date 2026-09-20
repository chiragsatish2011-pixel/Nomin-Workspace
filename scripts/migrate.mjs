import { neon } from '@neondatabase/serverless';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const migration = fs.readFileSync('drizzle/0000_freezing_kinsey_walden.sql', 'utf8');

async function run() {
  console.log("Running migration...");
  try {
    // Neon HTTP driver doesn't support executing multiple statements at once if it contains DO $$ or complex statements, but let's try
    await sql(migration);
    console.log("Migration successful!");
  } catch(e) {
    console.error("Migration failed:", e);
  }
}
run();
