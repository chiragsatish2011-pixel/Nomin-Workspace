import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
import * as dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config({ path: '.env.local' });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const hash = await bcrypt.hash('6363403353', 10);
  const email = 'chirag@nomin.ai';
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  
  try {
    await sql.query('INSERT INTO nomin_users (id, email, password_hash, role, display_name, created_at) VALUES (, , , , , )', [id, email, hash, 'ADMIN', 'Nomin Admin', now]);
    console.log('Admin user created successfully in nomin_users');
  } catch (e) {
    console.error('Error creating admin:', e);
  }
}
main();
