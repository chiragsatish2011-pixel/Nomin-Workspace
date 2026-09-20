import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";
import { db } from "@/db";
import { checkpoints, users } from "@/db/schema";
import { requireApiSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * /api/checkpoints — the team's shared progress timeline.
 *
 * Reads are workspace-wide: every signed-in member sees every checkpoint.
 * Writes are author-or-admin — the ownership check runs against the row in
 * the database, never against an id the client supplies, so a member can't
 * edit someone else's note by posting its id.
 */

const UNAUTHORIZED = NextResponse.json(
  { error: "Unauthorized" },
  { status: 401 }
);

const MAX_NOTE_LENGTH = 4000;

/** Joined shape the timeline renders: the note plus its author. */
const CHECKPOINT_COLUMNS = {
  id: checkpoints.id,
  note: checkpoints.note,
  createdAt: checkpoints.createdAt,
  updatedAt: checkpoints.updatedAt,
  userId: checkpoints.userId,
  displayName: users.displayName,
  userEmail: users.email,
};

async function readBody(req: Request): Promise<Record<string, unknown> | null> {
  try {
    const body = await req.json();
    return body && typeof body === "object"
      ? (body as Record<string, unknown>)
      : null;
  } catch {
    return null;
  }
}

function validateNote(raw: unknown): { note: string } | { error: string } {
  if (typeof raw !== "string") return { error: "Note content is required." };
  const note = raw.trim();
  if (!note) return { error: "Note content is required." };
  if (note.length > MAX_NOTE_LENGTH) {
    return { error: `Notes are limited to ${MAX_NOTE_LENGTH} characters.` };
  }
  return { note };
}

export async function GET() {
  const user = await requireApiSession();
  if (!user) return UNAUTHORIZED;

  try {
    const rows = await db
      .select(CHECKPOINT_COLUMNS)
      .from(checkpoints)
      .innerJoin(users, eq(checkpoints.userId, users.id))
      .orderBy(desc(checkpoints.createdAt))
      .limit(200);
    return NextResponse.json({ checkpoints: rows });
  } catch (err) {
    console.error("[api/checkpoints] list failed:", err);
    return NextResponse.json(
      { error: "Couldn't load the timeline." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  const user = await requireApiSession();
  if (!user) return UNAUTHORIZED;

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const validated = validateNote(body.note);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const inserted = await db
      .insert(checkpoints)
      .values({ userId: user.id, note: validated.note })
      .returning({
        id: checkpoints.id,
        note: checkpoints.note,
        createdAt: checkpoints.createdAt,
        updatedAt: checkpoints.updatedAt,
        userId: checkpoints.userId,
      });

    return NextResponse.json(
      {
        checkpoint: {
          ...inserted[0],
          displayName: user.displayName,
          userEmail: user.email,
        },
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("[api/checkpoints] create failed:", err);
    return NextResponse.json(
      { error: "Couldn't post the checkpoint." },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  const user = await requireApiSession();
  if (!user) return UNAUTHORIZED;

  const body = await readBody(req);
  if (!body) {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }
  const id = typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "A checkpoint id is required." },
      { status: 400 }
    );
  }
  const validated = validateNote(body.note);
  if ("error" in validated) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  try {
    const existing = await db
      .select({ id: checkpoints.id, userId: checkpoints.userId })
      .from(checkpoints)
      .where(eq(checkpoints.id, id))
      .limit(1);
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "That checkpoint no longer exists." },
        { status: 404 }
      );
    }
    // Ownership is read from the stored row, not from the request.
    if (existing[0].userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "You can only edit your own checkpoints." },
        { status: 403 }
      );
    }

    const updated = await db
      .update(checkpoints)
      .set({ note: validated.note, updatedAt: new Date() })
      .where(eq(checkpoints.id, id))
      .returning({
        id: checkpoints.id,
        note: checkpoints.note,
        createdAt: checkpoints.createdAt,
        updatedAt: checkpoints.updatedAt,
        userId: checkpoints.userId,
      });

    return NextResponse.json({ checkpoint: updated[0] });
  } catch (err) {
    console.error("[api/checkpoints] update failed:", err);
    return NextResponse.json(
      { error: "Couldn't save the change." },
      { status: 500 }
    );
  }
}

export async function DELETE(req: Request) {
  const user = await requireApiSession();
  if (!user) return UNAUTHORIZED;

  const body = await readBody(req);
  const id = body && typeof body.id === "string" ? body.id : "";
  if (!id) {
    return NextResponse.json(
      { error: "A checkpoint id is required." },
      { status: 400 }
    );
  }

  try {
    const existing = await db
      .select({ id: checkpoints.id, userId: checkpoints.userId })
      .from(checkpoints)
      .where(eq(checkpoints.id, id))
      .limit(1);
    if (existing.length === 0) {
      return NextResponse.json(
        { error: "That checkpoint no longer exists." },
        { status: 404 }
      );
    }
    if (existing[0].userId !== user.id && user.role !== "admin") {
      return NextResponse.json(
        { error: "You can only delete your own checkpoints." },
        { status: 403 }
      );
    }

    await db.delete(checkpoints).where(eq(checkpoints.id, id));
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[api/checkpoints] delete failed:", err);
    return NextResponse.json(
      { error: "Couldn't delete the checkpoint." },
      { status: 500 }
    );
  }
}
