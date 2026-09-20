import { NextResponse } from "next/server";
import { runBootstrap, testDatabaseUrl } from "@/lib/setup";

export const runtime = "nodejs";

/**
 * POST /api/setup/migrate — create the tables on the configured database.
 * Idempotent: it reports `already` and writes nothing when the tables
 * exist, so a double-click can never clobber live data.
 */
export async function POST() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    return NextResponse.json(
      { error: "No database configured yet. Complete step 1 first." },
      { status: 503 }
    );
  }
  try {
    if (!(await testDatabaseUrl(url))) {
      return NextResponse.json(
        { error: "Can't reach the database. Check DATABASE_URL and try again." },
        { status: 503 }
      );
    }
    return NextResponse.json(await runBootstrap(url));
  } catch (err) {
    console.error("[setup/migrate]", err);
    return NextResponse.json(
      {
        error:
          "Couldn't create the tables. Check the database URL and its permissions.",
      },
      { status: 500 }
    );
  }
}
