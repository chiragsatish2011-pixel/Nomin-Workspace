#!/usr/bin/env node
/**
 * One-time first-admin bootstrap — the terminal alternative to /setup.
 *
 *   DATABASE_URL="postgresql://..." npm run db:seed
 *   # or, with DATABASE_URL in .env.local:
 *   npm run db:seed
 *
 * Creates admin@nomin.app with a PLACEHOLDER password, or promotes that
 * account to admin if it already exists. Change the password immediately
 * after signing in, from Admin → your own row.
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";

const EMAIL = "admin@nomin.app";
const PLACEHOLDER_PASSWORD = "nomin1234";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error(
    "[seed-admin] DATABASE_URL is not set. Pass it inline or add it to .env.local."
  );
  process.exit(1);
}

const sql = neon(url);

try {
  const existing = await sql`SELECT id, role FROM users WHERE email = ${EMAIL} LIMIT 1`;

  if (existing.length > 0) {
    // Don't silently reset a password that may already have been changed —
    // only make sure the account can actually administer the workspace.
    if (existing[0].role !== "admin") {
      await sql`UPDATE users SET role = 'admin' WHERE id = ${existing[0].id}`;
      console.log(`[seed-admin] promoted existing account to admin (${EMAIL}).`);
    } else {
      console.log(`[seed-admin] ${EMAIL} already exists as admin — nothing to do.`);
    }
    process.exit(0);
  }

  const passwordHash = await bcrypt.hash(PLACEHOLDER_PASSWORD, 12);
  await sql`
    INSERT INTO users (email, password_hash, role, display_name)
    VALUES (${EMAIL}, ${passwordHash}, 'admin', 'Workspace Owner')
  `;

  console.log(`[seed-admin] created admin ${EMAIL}`);
  console.log(`[seed-admin] placeholder password: ${PLACEHOLDER_PASSWORD}`);
  console.log("[seed-admin] CHANGE IT NOW — sign in, then Admin → your row → Change password.");
} catch (err) {
  console.error("[seed-admin] failed:", err?.message ?? err);
  console.error("[seed-admin] Do the tables exist? Run `npm run db:migrate` first.");
  process.exit(1);
}
