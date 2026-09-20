import "dotenv/config";
import { defineConfig } from "drizzle-kit";

/**
 * Drizzle Kit config — generates SQL migrations from `db/schema.ts` into
 * `./drizzle`, applied to a fresh Postgres database with:
 *
 *   npm run db:migrate
 *
 * (requires DATABASE_URL). `generate` itself needs no live database, hence
 * the placeholder fallback below.
 */
export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url:
      process.env.DATABASE_URL ??
      "postgresql://placeholder:placeholder@localhost:5432/placeholder",
  },
});
