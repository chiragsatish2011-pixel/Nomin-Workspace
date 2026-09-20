<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Conventions specific to this repository

Things that are easy to get wrong here, and the reasons behind them:

- **Route protection is `proxy.ts`, not `middleware.ts`.** Next.js 16 renamed
  the convention; the exported function is `proxy`, and its runtime is
  always Node.js (the edge runtime is unsupported and not configurable).
- **`/api` is excluded from the proxy on purpose.** `withAuth` redirects to
  the HTML sign-in page, which breaks `fetch` callers. So **every** route
  under `app/api/` must call `requireApiSession()` or `requireApiAdmin()`
  as its first statement — except `api/auth/*` and `api/setup/*`, which are
  deliberately public. Nothing enforces this automatically: a route that
  forgets the guard is public.
- **Never catch Next.js control-flow errors.** `redirect()`, `notFound()`
  and the dynamic-rendering bailout all signal by throwing. Any `try/catch`
  wrapping them must call `unstable_rethrow(err)` first, or a redirect
  silently becomes a caught exception. See `lib/session.ts`.
- **The session guards re-read the user row on every request.** The JWT is
  never trusted on its own, so deleting or demoting an account takes effect
  immediately rather than at token expiry. Don't "optimize" this away.
- **Env access goes through `lib/env.ts`.** It returns build-phase
  placeholders so `next build` succeeds without secrets, and throws a
  message naming the variable at runtime. `db` fails lazily for the same
  reason: `/setup` has to run before `DATABASE_URL` exists.
- **`/setup` self-disables.** It refuses once any user row exists, so it can
  never act as public registration. There is no sign-up route anywhere.
- **Two copies of the schema must stay in sync.** `drizzle/0000_init.sql`
  is generated from `db/schema.ts` (`npm run db:generate`), and
  `EMBEDDED_BOOTSTRAP` in `lib/setup.ts` is the fallback used when the
  migration files aren't readable at runtime. Change the schema and you
  change all three.
- **Design tokens live only in `app/globals.css`.** Components consume them
  as Tailwind utilities (`bg-canvas`, `text-ink`, `border-hairline`), which
  is why dark mode needs no `dark:` colour variants. Don't hardcode hex in
  a component; the exceptions are the per-section identity colours, which
  come from the registry in `components/sections.tsx`.
