import "server-only";

/**
 * Central environment-variable validation (SERVER ONLY).
 *
 * Why this file exists: a missing DATABASE_URL / NEXTAUTH_SECRET /
 * NEXTAUTH_URL otherwise surfaces as a generic 500 deep inside some route,
 * or as a build warning that is easy to miss. These helpers fail fast with
 * a loud message naming exactly which variable is missing.
 *
 * Build safety: `next build` must succeed before env vars are set (CI,
 * fresh clone, a host's build step). During the build phase
 * (`NEXT_PHASE === "phase-production-build"`) the helpers return a
 * placeholder instead of throwing. At runtime they throw immediately.
 *
 * Setup-wizard safety: /setup intentionally runs WITHOUT a database (step 1
 * collects DATABASE_URL), so nothing here throws for DATABASE_URL at import
 * time — `db` throws lazily on first real query and /api/setup/* answer
 * structured 503s. The NEXTAUTH checks live in `lib/auth.ts`, which /setup
 * never imports.
 */

export function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isMissing(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

const HINT =
  "Add it to .env.local for local development, or to your host's Environment Variables settings for this environment.";

export function requireDatabaseUrl(): string {
  const url = process.env.DATABASE_URL;
  if (isMissing(url)) {
    if (isBuildPhase()) {
      // Placeholder keeps `next build` working without a live database.
      // Never used for real queries.
      return "postgresql://placeholder:placeholder@localhost:5432/placeholder";
    }
    throw new Error(`DATABASE_URL is not set. ${HINT}`);
  }
  return url as string;
}

export function requireNextAuthSecret(): string {
  const secret = process.env.NEXTAUTH_SECRET;
  if (isMissing(secret)) {
    if (isBuildPhase()) {
      // Only lets `next build` collect routes. Real sessions are never
      // signed with this.
      return "build-phase-placeholder-secret-please-set-nextauth-secret-32-chars-min";
    }
    throw new Error(`NEXTAUTH_SECRET is not set. ${HINT}`);
  }
  return secret as string;
}

export function requireNextAuthUrl(): string {
  const url = process.env.NEXTAUTH_URL;
  if (isMissing(url)) {
    if (isBuildPhase()) return "http://localhost:3000";
    // Hosts that inject VERCEL_URL let NextAuth auto-detect the origin, so
    // an explicit NEXTAUTH_URL is genuinely optional there.
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    throw new Error(`NEXTAUTH_URL is not set. ${HINT}`);
  }
  return url as string;
}
