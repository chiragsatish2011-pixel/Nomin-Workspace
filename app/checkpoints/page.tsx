import { desc, eq } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/db";
import { checkpoints, users } from "@/db/schema";
import { AppShell } from "@/components/AppShell";
import {
  CheckpointsList,
  type CheckpointRow,
} from "@/components/CheckpointsList";
import { SectionHeader } from "@/components/SectionHeader";
import { sectionByKey } from "@/components/sections";
import { requireActiveSession } from "@/lib/session";

const section = sectionByKey("checkpoints");

export const metadata = {
  title: "Checkpoints · Nomin Workspace",
  description: section.blurb,
};

// The timeline must reflect what was just posted, so this page is never
// served from a cache.
export const dynamic = "force-dynamic";

export default async function CheckpointsPage() {
  const user = await requireActiveSession();

  // Read on the server for the first paint — the list renders complete,
  // with no loading flash, and the client component takes over from there.
  let initial: CheckpointRow[] = [];
  let loadError: string | null = null;
  try {
    const rows = await db
      .select({
        id: checkpoints.id,
        note: checkpoints.note,
        createdAt: checkpoints.createdAt,
        updatedAt: checkpoints.updatedAt,
        userId: checkpoints.userId,
        displayName: users.displayName,
        userEmail: users.email,
      })
      .from(checkpoints)
      .innerJoin(users, eq(checkpoints.userId, users.id))
      .orderBy(desc(checkpoints.createdAt))
      .limit(200);
    initial = rows.map((r) => ({
      ...r,
      createdAt: r.createdAt.toISOString(),
      updatedAt: r.updatedAt.toISOString(),
    }));
  } catch (err) {
    unstable_rethrow(err);
    // A failed read must not take the whole page down: render the composer
    // and say what happened, rather than throwing to the error boundary.
    console.error("[checkpoints] initial load failed:", err);
    loadError = "Couldn't load the timeline. Try refreshing the page.";
  }

  return (
    <AppShell user={user} active="checkpoints">
      <SectionHeader section={section} />
      <CheckpointsList
        initial={initial}
        viewer={{ id: user.id, role: user.role }}
        loadError={loadError}
      />
    </AppShell>
  );
}
