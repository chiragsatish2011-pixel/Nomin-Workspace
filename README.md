# Nomin Workspace

A private team workspace: a shared progress timeline, plus routed shells for
files, projects and chat. Built as a Next.js App Router application with
server-enforced auth and a Postgres schema that covers every section.

## Tech stack

- **Next.js 16** (App Router) + TypeScript + **Tailwind CSS v4**
- **NextAuth v4** — Credentials provider (email + password), JWT sessions
- **Postgres** via the Neon serverless driver (`@neondatabase/serverless`
  HTTP driver — one fetch per query, no connection pool, so every route is
  stateless and fits a serverless host)
- **Drizzle ORM** (`drizzle-orm` + `drizzle-kit`) for schema and migrations
- **bcryptjs** for password hashing — plaintext is never stored or logged

## Design system

Nomin's own palette and type pairing, defined once as tokens in
`app/globals.css` and consumed as Tailwind utilities:

- Purple `#7132f5` for primary actions and brand marks.
- IBM Plex Sans for display type, Inter for UI and body, mono for
  micro-labels.
- White canvas, hairline borders, flat surfaces, pill-shaped controls.
- One identity colour per section, reserved for that section alone:
  Checkpoints `#149e61` · Files `#2563eb` · Projects `#c2410c` ·
  Chat `#7132f5`.
- Dark mode redefines the same token names, so no component carries a
  `dark:` colour variant.

## What works, and what doesn't

Stated plainly, because the UI says the same thing:

| Area | State |
|---|---|
| Auth, sessions, route guards | Working end to end |
| `/setup` first-run wizard | Working — database, tables, owner account |
| Admin account management | Working — create, change password, delete |
| Settings (own profile) | Working |
| **Checkpoints** | **Working end to end** — post, edit, delete, timeline |
| Files, Projects, Chat | Routed, designed, navigable — **no data layer yet.** The tables exist in the schema; nothing reads or writes them. |

## Environment variables

Three, and no others:

| Name | Used for | Example |
|---|---|---|
| `DATABASE_URL` | Postgres connection. Use a **pooled** URL (Neon: the `-pooler` host) — serverless functions would exhaust a normal pool. | `postgresql://USER:PASSWORD@HOST-pooler/DB?sslmode=require` |
| `NEXTAUTH_SECRET` | Signs JWT sessions. Generate with `openssl rand -base64 32`. | any strong random string |
| `NEXTAUTH_URL` | Public app URL, used for callbacks and redirects. | `http://localhost:3000` locally |

Copy `.env.example` to `.env.local` for development, or set them in your
host's dashboard for a deploy — a local `.env.local` never deploys.

A missing variable fails fast with a message naming it (via `lib/env.ts`),
rather than surfacing later as a generic 500. `next build` still succeeds
without them, so CI stays green. `/setup` is the one flow that runs without
`DATABASE_URL`, since step 1 is what collects it.

## Run locally

```bash
npm install
npm run dev
```

Then open <http://localhost:3000/setup> and follow the three steps —
database, tables, owner account — all in the browser.

Terminal alternative:

```bash
# 1. Put DATABASE_URL, NEXTAUTH_SECRET and NEXTAUTH_URL in .env.local
npm run db:migrate    # create the tables
npm run db:seed       # create admin@nomin.app with a placeholder password
```

The seed prints a placeholder password — **change it immediately** after
signing in, from **Admin → your row → Change password**.

## Team-only access

There is **no sign-up page**, and members have **no self-service password
UI** at all:

- **First account** — the `/setup` wizard (which creates it as `admin` and
  then refuses to run again, so it can never hijack a live workspace), or
  `npm run db:seed`.
- **Everyone else** — an admin creates them at **Admin → New account** with
  a password the admin types. It is shown once, in a copy box, and is never
  stored in plaintext or recoverable afterwards.
- **Changes and removals** — the same page: each row has *Change password*
  and *Delete*. Admins cannot delete their own account.
- **Settings** lets a member edit their display name, department and job
  title. Email, role and password are an admin's to change.

## Project structure

```
app/
  page.tsx                dashboard (protected)
  signin/                 sign-in (public, no registration links)
  setup/                  first-run wizard (public until an account exists)
  settings/               own profile + read-only account summary
  admin/                  create / change password / delete (admins only)
  checkpoints/            the team timeline — fully working
  files|projects|chat/    routed section shells, no data layer yet
  api/auth/[...nextauth]/ NextAuth handler (GET + POST)
  api/admin/users/        admin-only GET / POST / PATCH / DELETE
  api/checkpoints/        GET / POST / PATCH / DELETE, author-or-admin
  api/user/profile/       PATCH own profile only
  api/setup/*/            wizard endpoints (status / database / migrate / owner)
components/               AppShell, sections registry, Button, Badge, …
lib/env.ts                fail-fast env validation
lib/auth.ts               NextAuth options (JWT sessions, secure cookies)
lib/session.ts            requireActiveSession / requireAdmin / API variants
lib/setup.ts              wizard helpers (probe, bootstrap, dev env write)
db/                       schema.ts (7 tables) + index.ts (Neon HTTP client)
drizzle/                  generated SQL migrations
proxy.ts                  route protection (Next.js 16's middleware)
scripts/seed-admin.mjs    one-time first-admin bootstrap
```

## Architecture notes

**Where authorization actually happens.** `proxy.ts` redirects signed-out
visitors away from page routes — a convenience, not the security boundary.
The real check is in `lib/session.ts`, which re-reads the user row from the
database on every protected page and API route, so a token belonging to a
deleted or demoted account is rejected immediately rather than at expiry.

**Why `/api` is excluded from the proxy.** `withAuth` answers an
unauthenticated request with a redirect to the HTML sign-in page. That is
correct for a navigation and wrong for a `fetch`, which would follow it and
fail parsing HTML as JSON. API routes therefore guard themselves and answer
`401`/`403` JSON. The cost: a new route that forgets `requireApiSession()`
is public. That rule is written down in `AGENTS.md`.

**Why the database client is a Proxy.** `db` resolves lazily so a missing
`DATABASE_URL` throws on first use with a message naming the variable —
while `next build` still succeeds and `/setup` can render before any
database exists.

**Two copies of the schema.** `drizzle/0000_init.sql` is generated from
`db/schema.ts`; `EMBEDDED_BOOTSTRAP` in `lib/setup.ts` is a fallback for
runtimes where the migration files aren't readable. Both are verified to
produce byte-identical columns, constraints and indexes. Change the schema
and you must update all three.

## Scripts

- `npm run dev` / `npm run build` / `npm start` — standard Next.js
  (Turbopack is the default in 16; no `--turbopack` flag needed)
- `npm run lint` — ESLint
- `npm run db:generate` — regenerate SQL from `db/schema.ts`
- `npm run db:migrate` — apply `drizzle/` migrations (needs `DATABASE_URL`)
- `npm run db:push` — quick prototype sync (needs `DATABASE_URL`)
- `npm run db:seed` — create or promote the first admin

## Security notes

- Passwords are bcrypt-hashed at cost 12; plaintext is never stored or
  logged. A minimum of 8 characters is enforced server-side.
- Sign-in returns the same failure for an unknown email and a wrong
  password, so the form cannot be used to enumerate accounts. The
  distinction stays in the server log.
- A database or configuration outage during sign-in is reported as a
  distinct error, never as "wrong password".
- Session cookies are `httpOnly`, `sameSite=lax`, and `Secure` with a
  `__Secure-` prefix in production.
- Security headers (`X-Frame-Options`, `X-Content-Type-Options`,
  `Referrer-Policy`, `Permissions-Policy`, HSTS) are set in
  `next.config.ts`.
- Write permissions are always checked against the stored row, never
  against an id supplied by the client.
- Failures log with route context (`[auth][authorize]`, `[admin/users]`,
  `[api/checkpoints]`, `[setup/*]`) — check your host's function logs.
