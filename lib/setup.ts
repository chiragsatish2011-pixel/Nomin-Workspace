import "server-only";

import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { neon } from "@neondatabase/serverless";
import { sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

/**
 * First-run setup helpers (SERVER ONLY — never import from client code).
 *
 * Everything the /setup wizard needs: probe whether the workspace is ready,
 * test a pasted database URL, create the tables, and — in local dev only —
 * persist DATABASE_URL to `.env.local`, so the first owner never has to
 * touch a terminal or an env dashboard.
 *
 * This module deliberately does NOT import `@/db` or `@/lib/auth`: the
 * wizard has to work on step 1, before any env var exists.
 */

export interface SetupStatus {
  /** A DATABASE_URL string is configured (it may still be unreachable). */
  configured: boolean;
  /** The configured URL actually connects. */
  reachable: boolean;
  /** The `users` table exists. */
  tables: boolean;
  /** At least one admin account exists. */
  admin: boolean;
  /**
   * True once ANY user exists. This is the self-disable switch for the
   * one-time wizard — see getSetupStatus() below.
   */
  hasUsers: boolean;
  /** True in production — file writes are refused there. */
  isProduction: boolean;
}

export function isProduction(): boolean {
  return process.env.NODE_ENV === "production" || process.env.VERCEL === "1";
}

function clientFor(url: string) {
  return drizzle(
    neon(url, { fetchOptions: { signal: AbortSignal.timeout(12000) } })
  );
}

type Row = Record<string, unknown>;

async function probeRows(url: string, statement: string): Promise<Row[] | null> {
  try {
    const res = (await clientFor(url).execute(sql.raw(statement))) as unknown;
    // drizzle's execute() shape varies (a bare rows array vs. a result
    // object with `.rows`) depending on driver and bundler — accept both.
    const rows = Array.isArray(res)
      ? (res as Row[])
      : ((res as { rows?: unknown }).rows ?? null);
    return Array.isArray(rows) ? (rows as Row[]) : null;
  } catch {
    return null;
  }
}

export async function testDatabaseUrl(url: string): Promise<boolean> {
  const rows = await probeRows(url, "SELECT 1 AS ok");
  return rows?.[0]?.ok === 1;
}

export async function getSetupStatus(): Promise<SetupStatus> {
  const url = process.env.DATABASE_URL ?? null;
  const status: SetupStatus = {
    configured: !!url,
    reachable: false,
    tables: false,
    admin: false,
    hasUsers: false,
    isProduction: isProduction(),
  };
  if (!url) return status;

  if (!(await testDatabaseUrl(url))) return status;
  status.reachable = true;

  const tbl = await probeRows(url, "SELECT to_regclass('public.users') AS tbl");
  if (!tbl?.[0]?.tbl) return status;
  status.tables = true;

  // ONE-TIME SETUP GATE — this is NOT a public sign-up path.
  //
  // The wizard exists only to bootstrap the very first account on a fresh
  // database. The moment ANY user exists, /setup self-disables permanently
  // and redirects to /signin — even for someone who knows the URL — so it
  // can never hijack a live workspace or be abused as open registration.
  //
  // The lock is COUNT(*) over all users, not just admins: deleting the
  // admin, or leaving only members, still keeps setup closed. `admin` is
  // tracked separately purely for display ("does an owner exist?").
  const cnt = await probeRows(url, "SELECT COUNT(*) AS cnt FROM users");
  const rawCnt = cnt?.[0]?.cnt;
  const count =
    typeof rawCnt === "number"
      ? rawCnt
      : typeof rawCnt === "string"
        ? parseInt(rawCnt, 10)
        : 0;
  status.hasUsers = Number.isFinite(count) && count > 0;

  const adm = await probeRows(
    url,
    "SELECT EXISTS (SELECT 1 FROM users WHERE role = 'admin') AS adm"
  );
  status.admin = adm?.[0]?.adm === true;
  return status;
}

/**
 * Mirrors `drizzle/0000_init.sql`, hardened to be safely re-runnable. Used
 * only when the migration files aren't readable at runtime (some serverless
 * bundlers drop non-imported files from the deployment).
 */
const EMBEDDED_BOOTSTRAP = [
  `CREATE EXTENSION IF NOT EXISTS "pgcrypto"`,
  `DO $$ BEGIN CREATE TYPE "public"."role" AS ENUM('admin', 'member'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `DO $$ BEGIN CREATE TYPE "public"."conversation_type" AS ENUM('direct', 'group'); EXCEPTION WHEN duplicate_object THEN NULL; END $$`,
  `CREATE TABLE IF NOT EXISTS "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"role" "role" DEFAULT 'member' NOT NULL,
	"display_name" text,
	"department" text,
	"job_title" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
)`,
  `CREATE TABLE IF NOT EXISTS "checkpoints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"note" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "projects" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"title" text NOT NULL,
	"description" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "conversations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" "conversation_type" NOT NULL,
	"name" text,
	"created_by" uuid REFERENCES "public"."users"("id") ON DELETE set null,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "conversation_participants" (
	"conversation_id" uuid NOT NULL REFERENCES "public"."conversations"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	"last_read_at" timestamp with time zone
)`,
  `CREATE TABLE IF NOT EXISTS "chat_messages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"conversation_id" uuid NOT NULL REFERENCES "public"."conversations"("id") ON DELETE cascade,
	"user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"content" text NOT NULL,
	"edited_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `CREATE TABLE IF NOT EXISTS "files" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL REFERENCES "public"."users"("id") ON DELETE cascade,
	"name" text NOT NULL,
	"parent_id" uuid,
	"is_folder" boolean DEFAULT false NOT NULL,
	"size_bytes" text,
	"mime_type" text,
	"storage_key" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
)`,
  `CREATE INDEX IF NOT EXISTS "checkpoints_user_id_idx" ON "checkpoints" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "checkpoints_created_at_idx" ON "checkpoints" ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "projects_user_id_idx" ON "projects" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "projects_created_at_idx" ON "projects" ("created_at")`,
  `CREATE INDEX IF NOT EXISTS "conversation_participants_user_idx" ON "conversation_participants" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "chat_messages_conversation_idx" ON "chat_messages" ("conversation_id")`,
  `CREATE INDEX IF NOT EXISTS "chat_messages_user_id_idx" ON "chat_messages" ("user_id")`,
  `CREATE INDEX IF NOT EXISTS "files_parent_idx" ON "files" ("parent_id")`,
  `CREATE INDEX IF NOT EXISTS "files_user_id_idx" ON "files" ("user_id")`,
];

async function loadBootstrapStatements(): Promise<string[]> {
  // Apply every migration file in order, so databases created by the wizard
  // land on the current schema even as new migrations are added later.
  try {
    const dir = path.join(process.cwd(), "drizzle");
    const files = (await readdir(dir))
      .filter((f) => /^\d+_.*\.sql$/.test(f))
      .sort();
    const parts: string[] = [];
    for (const f of files) {
      const content = await readFile(path.join(dir, f), "utf8");
      for (const s of content.split("--> statement-breakpoint")) {
        const stmt = s.trim();
        if (stmt) parts.push(stmt);
      }
    }
    if (parts.length > 0) return parts;
  } catch {
    /* files not bundled (e.g. serverless) — fall through to the embedded copy */
  }
  return EMBEDDED_BOOTSTRAP;
}

/**
 * Create the tables. Returns `already: true` without writing when they
 * already exist, so hitting this twice — or by accident — can never
 * clobber live data.
 */
export async function runBootstrap(
  url: string
): Promise<{ applied: boolean; already: boolean }> {
  const tbl = await probeRows(url, "SELECT to_regclass('public.users') AS tbl");
  if (tbl?.[0]?.tbl) return { applied: false, already: true };

  const client = clientFor(url);
  for (const stmt of await loadBootstrapStatements()) {
    await client.execute(sql.raw(stmt));
  }
  return { applied: true, already: false };
}

function escapeEnvValue(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Persist keys to `.env.local` (LOCAL DEV ONLY — refused in production,
 * where env vars belong in the host's dashboard). Next.js reloads
 * `.env.local` automatically, so the wizard just polls status afterwards.
 */
export async function saveDevEnv(vars: Record<string, string>): Promise<void> {
  if (isProduction()) {
    throw new Error(
      "Cannot write env files in production. Set the variables in your host's dashboard instead."
    );
  }
  const file = path.join(process.cwd(), ".env.local");
  let content = "";
  try {
    content = await readFile(file, "utf8");
  } catch {
    content = "# Nomin Workspace · local dev (written by the /setup wizard)\n";
  }
  if (content.length > 0 && !content.endsWith("\n")) content += "\n";
  for (const [key, value] of Object.entries(vars)) {
    const line = `${key}=${escapeEnvValue(value)}`;
    const re = new RegExp(`^${key}=.*$`, "m");
    content = re.test(content)
      ? content.replace(re, line)
      : `${content}${line}\n`;
  }
  await writeFile(file, content, "utf8");
}
