import { NextResponse } from "next/server";
import { getSetupStatus } from "@/lib/setup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/setup/status — booleans only, and therefore safe to expose
 * before auth exists. It reveals whether setup is finished, never any
 * connection string, email or other value.
 */
export async function GET() {
  try {
    return NextResponse.json(await getSetupStatus());
  } catch (err) {
    console.error("[setup/status]", err);
    return NextResponse.json(
      {
        configured: false,
        reachable: false,
        tables: false,
        admin: false,
        hasUsers: false,
        isProduction: process.env.NODE_ENV === "production",
      },
      { status: 500 }
    );
  }
}
