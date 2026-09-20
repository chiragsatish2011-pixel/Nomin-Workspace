import type { DefaultSession } from "next-auth";

/**
 * Widen NextAuth's types with the workspace fields the JWT and session
 * callbacks in `lib/auth.ts` carry. Without this, `session.user.role` is a
 * type error everywhere the route guards use it.
 */
declare module "next-auth" {
  interface User {
    id: string;
    email: string;
    role: "admin" | "member";
    displayName?: string | null;
    department?: string | null;
    jobTitle?: string | null;
  }

  interface Session {
    user: {
      id: string;
      role: "admin" | "member";
      displayName?: string | null;
      department?: string | null;
      jobTitle?: string | null;
    } & DefaultSession["user"];
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: "admin" | "member";
    displayName?: string | null;
    department?: string | null;
    jobTitle?: string | null;
  }
}
