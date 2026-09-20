import { withAuth } from "next-auth/middleware";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

/**
 * Route protection for every path except the public ones.
 * Unauthenticated visitors are redirected to /signin.
 *
 * Next.js 16 renamed the `middleware` convention to `proxy`: the file is
 * `proxy.ts`, the exported function is `proxy`, and the runtime is always
 * Node.js (the edge runtime is not supported here and cannot be
 * configured). This is a short-lived check that reads the JWT only — it
 * never touches the database, so it adds no latency per request.
 *
 * The real authorization happens server-side in `lib/session.ts`, which
 * re-reads the user row on every protected page and route. This proxy is
 * a redirect for signed-out visitors, not the security boundary: a token
 * for a deleted account still gets past here and is rejected there.
 *
 * On env: this never hard-fails when NEXTAUTH_SECRET is missing, because
 * that would brick every request on a deployment whose env is merely
 * mid-rollout. It logs loudly and lets the request through to the Node
 * layer, where `lib/auth.ts` enforces the same variables with a live read
 * and NextAuth actually consumes the secret. Public paths skip even the
 * logging, so the first-run wizard works before any env var exists.
 */

const protectedAuth = withAuth({ pages: { signIn: "/signin" } });

function isBuildPhase(): boolean {
  return process.env.NEXT_PHASE === "phase-production-build";
}

function isPublicPath(pathname: string): boolean {
  return (
    pathname === "/signin" ||
    pathname.startsWith("/signin/") ||
    pathname === "/setup" ||
    pathname.startsWith("/setup/") ||
    // Every /api route authenticates itself (see the note on `config`).
    pathname.startsWith("/api/")
  );
}

export function proxy(req: NextRequest, ...rest: unknown[]) {
  if (isBuildPhase() || isPublicPath(req.nextUrl.pathname)) {
    return NextResponse.next();
  }
  if (!process.env.NEXTAUTH_SECRET) {
    console.error(
      "[proxy] NEXTAUTH_SECRET is not visible here — passing through to the Node layer, which enforces it."
    );
  }
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return (protectedAuth as any)(req, ...rest);
}

export default proxy;

export const config = {
  matcher: [
    /*
     * Page routes only. Excluded:
     * - /signin, /setup (public pages)
     * - /api/*          (see below)
     * - Next.js internals and static files
     *
     * WHY /api IS EXCLUDED, AND THE RULE THAT COMES WITH IT:
     * withAuth answers an unauthenticated request with a 307 to the HTML
     * sign-in page. That is right for a navigation and wrong for a fetch —
     * the client would follow the redirect, receive HTML, and fail parsing
     * it as JSON, reporting a parse error instead of "not signed in". So
     * API routes are left to guard themselves and answer 401/403 JSON.
     *
     * The rule: EVERY route under /api must call requireApiSession() or
     * requireApiAdmin() as its first statement, unless it is deliberately
     * public (/api/auth/* is NextAuth itself; /api/setup/* is the one-time
     * wizard, which self-disables once any account exists). A new route
     * that forgets the guard is public — nothing here will catch it.
     *
     * There is intentionally no public /signup: the first account comes
     * from /setup or the seed script, and every other one from an admin
     * at /admin.
     */
    "/((?!api/|setup|signin|_next/static|_next/image|favicon.ico|.*\\..*).*)",
  ],
};
