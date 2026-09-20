import "server-only";

import { eq } from "drizzle-orm";
import { getServerSession } from "next-auth";
import { redirect, unstable_rethrow } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { authOptions } from "@/lib/auth";

/**
 * Route guards. Every protected page or route calls one of these instead of
 * reading getServerSession directly.
 *
 * All four re-read the user row on every request rather than trusting the
 * JWT alone, so a deleted or demoted account loses access immediately even
 * while it still holds a valid, unexpired token.
 *
 * Pages redirect; API routes return null so the handler can answer JSON:
 *
 * - requireActiveSession() — signed in AND the account still exists, else → /signin
 * - requireAdmin()         — the above AND role === "admin", else → /
 * - requireApiSession()    — same check, returns null instead of redirecting
 * - requireApiAdmin()      — same, admin only
 */

export interface ActiveUser {
  id: string;
  email: string;
  role: "admin" | "member";
  displayName: string | null;
  department: string | null;
  jobTitle: string | null;
}

const USER_COLUMNS = {
  id: users.id,
  email: users.email,
  role: users.role,
  displayName: users.displayName,
  department: users.department,
  jobTitle: users.jobTitle,
};

/**
 * Race a promise against a timeout, so a hung database fails closed
 * (redirect to /signin) instead of hanging the navigation with no feedback.
 */
function withGuardTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(
      () => reject(new Error(`guard DB read timed out after ${ms}ms`)),
      ms
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}

async function loadSessionUser(): Promise<ActiveUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return null;

  const rows = await withGuardTimeout(
    db
      .select(USER_COLUMNS)
      .from(users)
      .where(eq(users.id, session.user.id))
      .limit(1),
    15000
  );
  const user = rows[0];
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    role: user.role,
    displayName: user.displayName ?? null,
    department: user.department ?? null,
    jobTitle: user.jobTitle ?? null,
  };
}

export async function requireActiveSession(): Promise<ActiveUser> {
  let user: ActiveUser | null = null;
  try {
    user = await loadSessionUser();
  } catch (err) {
    // redirect(), notFound() and the dynamic-rendering bailout all signal
    // themselves by throwing. Catching those would turn a redirect into a
    // silent failure, so hand them straight back to Next.
    unstable_rethrow(err);
    console.error("[session] failed to load user for guard:", err);
    redirect("/signin");
  }
  if (!user) redirect("/signin");
  return user;
}

export async function requireAdmin(): Promise<ActiveUser> {
  const user = await requireActiveSession();
  if (user.role !== "admin") redirect("/");
  return user;
}

export async function requireApiSession(): Promise<ActiveUser | null> {
  try {
    return await loadSessionUser();
  } catch (err) {
    unstable_rethrow(err);
    console.error("[session] api guard DB error:", err);
    return null;
  }
}

export async function requireApiAdmin(): Promise<ActiveUser | null> {
  const user = await requireApiSession();
  if (!user || user.role !== "admin") return null;
  return user;
}
