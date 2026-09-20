import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { users } from "@/db/schema";
import { requireApiSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * PATCH /api/user/profile — a member editing their OWN profile.
 *
 * Deliberately narrow: display name, department and job title only. Email,
 * role and password are not editable here at any cost — role escalation and
 * credential changes belong to an admin, at /api/admin/users. The row
 * updated is always the caller's own, taken from the session rather than
 * from the request body.
 */

const MAX_FIELD_LENGTH = 120;

function cleanField(raw: unknown): string | null | undefined {
  if (raw === undefined) return undefined; // absent → leave unchanged
  if (raw === null) return null; // explicit null → clear
  if (typeof raw !== "string") return undefined;
  const value = raw.trim().slice(0, MAX_FIELD_LENGTH);
  return value.length > 0 ? value : null;
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const updates: {
    displayName?: string | null;
    department?: string | null;
    jobTitle?: string | null;
  } = {};
  const displayName = cleanField(body.displayName);
  const department = cleanField(body.department);
  const jobTitle = cleanField(body.jobTitle);
  if (displayName !== undefined) updates.displayName = displayName;
  if (department !== undefined) updates.department = department;
  if (jobTitle !== undefined) updates.jobTitle = jobTitle;

  if (Object.keys(updates).length === 0) {
    return NextResponse.json(
      { error: "Nothing to update." },
      { status: 400 }
    );
  }

  try {
    const updated = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, user.id))
      .returning({
        id: users.id,
        email: users.email,
        displayName: users.displayName,
        department: users.department,
        jobTitle: users.jobTitle,
      });
    return NextResponse.json({ user: updated[0] });
  } catch (err) {
    console.error("[user/profile] update failed:", err);
    return NextResponse.json(
      { error: "Couldn't save your profile. Please try again." },
      { status: 500 }
    );
  }
}
