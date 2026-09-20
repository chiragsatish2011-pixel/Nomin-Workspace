import "server-only";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireNextAuthSecret, requireNextAuthUrl } from "@/lib/env";

/**
 * Fail fast if auth env is missing (except during `next build`, where a
 * placeholder keeps route collection working). Without this, a missing
 * NEXTAUTH_SECRET / NEXTAUTH_URL surfaces later as a generic 500 or a
 * confusing JWT error.
 *
 * NOTE: /setup never imports this module, so the first-run wizard still
 * works before these variables are set.
 */
const nextAuthSecret = requireNextAuthSecret();
// Validated for its side effect (throws if missing) — NextAuth reads
// NEXTAUTH_URL from process.env itself.
requireNextAuthUrl();

/**
 * NextAuth configuration — Credentials provider (email + password).
 *
 * - JWT session strategy; the secret comes from NEXTAUTH_SECRET, never
 *   hardcoded.
 * - Passwords are verified with bcrypt against `users.password_hash`.
 *   Plaintext is never stored or logged. Only admins set passwords (via
 *   /admin) — there is no self-service password UI.
 * - The JWT and session carry the role, so admin routes stay gated.
 * - The session cookie is httpOnly, and Secure in production.
 * - Stateless: each authorize() call does one short lookup and returns.
 */
export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  secret: nextAuthSecret,
  pages: { signIn: "/signin" },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;
        const email = credentials.email.toLowerCase().trim();
        if (!email) return null;

        try {
          const rows = await db
            .select()
            .from(users)
            .where(eq(users.email, email))
            .limit(1);
          const user = rows[0];

          // Both branches below return null, so the sign-in form cannot
          // tell "no such account" from "wrong password" — no account
          // enumeration. The distinction stays in the server log.
          if (!user) {
            console.error(
              `[auth][authorize] login failed: unknown email (${email})`
            );
            return null;
          }

          const ok = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );
          if (!ok) {
            console.error(
              `[auth][authorize] login failed: wrong password (${email})`
            );
            return null;
          }

          console.log(`[auth][authorize] login ok (${email})`);
          return {
            id: user.id,
            email: user.email,
            role: user.role,
            displayName: user.displayName,
            department: user.department,
            jobTitle: user.jobTitle,
          };
        } catch (err) {
          // Infrastructure failure (database or env down) — NOT bad
          // credentials. Re-throw an opaque code so the sign-in UI can tell
          // "server broken" apart from "wrong email/password". Details stay
          // in the server log.
          console.error(`[auth][authorize] login error for (${email}):`, err);
          throw new Error("ServiceUnavailable");
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.displayName = user.displayName ?? null;
        token.department = user.department ?? null;
        token.jobTitle = user.jobTitle ?? null;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = token.role ?? "member";
        session.user.displayName = token.displayName ?? null;
        session.user.department = token.department ?? null;
        session.user.jobTitle = token.jobTitle ?? null;
      }
      return session;
    },
  },
  cookies: {
    sessionToken: {
      name: `${
        process.env.NODE_ENV === "production" ? "__Secure-" : ""
      }next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        // Production is served over HTTPS, so require Secure cookies there.
        // Local dev runs over HTTP, where Secure must stay off.
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};
