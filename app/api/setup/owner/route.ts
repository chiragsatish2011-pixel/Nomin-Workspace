import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { getSetupStatus } from "@/lib/setup";

export const runtime = "nodejs";

/**
 * POST /api/setup/owner { email, password } — create the FIRST account, as
 * an admin, with a password the owner chooses.
 *
 * ONE-TIME SETUP GATE — this is NOT a public sign-up path. It refuses once
 * ANY user exists, so it can never hijack a live workspace or be used as
 * open registration. After this, every further account is created by an
 * admin at /admin.
 */
export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const { email: rawEmail, password } = body as {
    email?: unknown;
    password?: unknown;
  };
  const email = typeof rawEmail === "string" ? rawEmail.toLowerCase().trim() : "";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json(
      { error: "A valid email address is required." },
      { status: 400 }
    );
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  try {
    const status = await getSetupStatus();
    if (!status.reachable) {
      return NextResponse.json(
        { error: "The database isn't reachable. Complete steps 1–2 first." },
        { status: 503 }
      );
    }
    if (!status.tables) {
      return NextResponse.json(
        { error: "The tables don't exist yet. Run step 2 first." },
        { status: 409 }
      );
    }
    // Self-disable: any existing user locks the wizard permanently.
    if (status.hasUsers || status.admin) {
      return NextResponse.json(
        { error: "An owner already exists. Sign in instead." },
        { status: 403 }
      );
    }

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
      .values({ email, passwordHash, role: "admin" })
      .returning({ id: users.id, email: users.email });

    console.log(`[setup/owner] owner account created (${email})`);
    return NextResponse.json(
      { id: inserted[0].id, email: inserted[0].email },
      { status: 201 }
    );
  } catch (err) {
    console.error("[setup/owner]", err);
    return NextResponse.json(
      { error: "Couldn't create the owner account. Please try again." },
      { status: 500 }
    );
  }
}
