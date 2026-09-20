import bcrypt from "bcryptjs";
import { neon } from "@neondatabase/serverless";
import { config as loadDotenv } from "dotenv";

loadDotenv({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function main() {
  const hash = await bcrypt.hash("6363403353", 10);
  try {
    await sql`INSERT INTO nomin_users (email, password_hash, role) VALUES ('chirag@nomin.ai', ${hash}, 'admin') ON CONFLICT (email) DO UPDATE SET password_hash = ${hash}, role = 'admin'`;
    console.log("Admin seeded successfully.");
  } catch (err) {
    console.error(err);
  }
}
main();
