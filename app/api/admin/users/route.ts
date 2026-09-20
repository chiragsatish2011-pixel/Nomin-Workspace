import bcrypt from "bcryptjs";
import { asc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireApiAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Admin-only account management. Every handler requires a signed-in caller
 * whose role is still "admin" in the database — the JWT alone is never
 * trusted, so a demoted admin loses access on their next request.
 *
 * Members have NO self-service credential UI anywhere. Every password below
 * is set by an admin, bcrypt-hashed at cost 12 before storage, and never
 * stored, logged or returned in plaintext.
 *
 * - GET    — list the team.
 * - POST   { email, password }   — create a member account.
 * - PATCH  { id, newPassword }   — set a user's password. No current
 *   password needed: this is an admin acting on someone else's account,
 *   not a self-service change.
 * - DELETE { id }                — delete an account. An admin cannot
 *   delete their own, which would risk locking the workspace.
 */

const DENIED = NextResponse.json(
  { error: "Admin access required." },
  { status: 403 }
);

function isValidEmail(email: unknown): email is string {
  return (
    typeof email === "string" &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.toLowerCase().trim())
  );
}

async function readBody(req: Request): Promise<unknown | null> {
  try {
    return await req.json();
  } catch {
    return null;
  }
}

export async function GET() {
  const caller = await requireApiAdmin();
  if (!caller) return DENIED;

  try {
    const team = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt));
    return NextResponse.json({ users: team });
  } catch (err) {
    console.error("[admin/users] list failed:", err);
    return NextResponse.json(
      { error: "Couldn't load the team." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const caller = await requireApiAdmin();
  if (!caller) return DENIED;

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { email: rawEmail, password } = body as {
    email?: unknown;
    password?: unknown;
  };

  if (!isValidEmail(rawEmail)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }
  const email = rawEmail.toLowerCase().trim();
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const existing = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const inserted = await db
      .insert(users)
      .values({ email, passwordHash, role: "member" })
      .returning({ id: users.id, email: users.email });

    console.log(
      `[admin/users] account created (${email}) by admin (${caller.email})`
    );
    return NextResponse.json(
      { id: inserted[0].id, email: inserted[0].email },
      { status: 201 }
    );
  } catch (err) {
    console.error(`[admin/users] unexpected error creating (${email}):`, err);
    return NextResponse.json(
      { error: "Couldn't create the account. Please try again." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const caller = await requireApiAdmin();
  if (!caller) return DENIED;

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { id, newPassword } = body as { id?: unknown; newPassword?: unknown };

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "A user id is required." }, { status: 400 });
  }
  if (typeof newPassword !== "string" || newPassword.length < 8) {
    return NextResponse.json(
      { error: "New password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const target = await db
      .select({ id: users.id, email: users.email })
      .from(users)
      .where(eq(users.id, id))
      .limit(1);
    if (target.length === 0) {
      return NextResponse.json({ error: "No such account." }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await db.update(users).set({ passwordHash }).where(eq(users.id, id));

    console.log(
      `[admin/users] password changed for (${target[0].email}) by admin (${caller.email})`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users] password change failed:", err);
    return NextResponse.json(
      { error: "Couldn't change the password. Please try again." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const caller = await requireApiAdmin();
  if (!caller) return DENIED;

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { id } = body as { id?: unknown };

  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "A user id is required." }, { status: 400 });
  }
  // Deleting yourself could leave the workspace with no admin at all.
  if (id === caller.id) {
    return NextResponse.json(
      { error: "You can't delete your own account." },
      { status: 400 }
    );
  }

  try {
    const deleted = await db
      .delete(users)
      .where(eq(users.id, id))
      .returning({ email: users.email });
    if (deleted.length === 0) {
      return NextResponse.json({ error: "No such account." }, { status: 404 });
    }

    console.log(
      `[admin/users] account deleted (${deleted[0].email}) by admin (${caller.email})`
    );
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[admin/users] delete failed:", err);
    return NextResponse.json(
      { error: "Couldn't delete the account. Please try again." },
      { status: 500 }
    );
  }
}
