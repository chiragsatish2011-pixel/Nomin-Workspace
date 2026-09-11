import { NextRequest, NextResponse } from "next/server";
import {
  DRIVE_FOLDER_NAME,
  ensureDriveFolder,
  getDriveAccessToken,
  sanitizeFolderName,
} from "@/lib/drive";
import { assertGoogleOAuthEnv } from "@/lib/env";
import { requireApiAdmin } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/drive/ensure-folder — one-click creation of the team's locked
 * Drive folder (Admin → Drive setup).
 *
 * Body (optional): { name?: string }. Defaults to DRIVE_FOLDER_NAME
 * ("Nomin Workspace"). Finds the folder by name or creates it when missing,
 * then returns its Drive ID so the admin can save it as
 * GOOGLE_DRIVE_UPLOAD_FOLDER_ID.
 *
 * Separation by design: every deployment points at its OWN folder ID. This
 * Nomin folder lives alongside — never inside — any other project folder
 * (e.g. Vaayu) in the same Google account, and no route in this app ever
 * writes outside the configured ID, so the other folder is never touched.
 *
 * Deliberately uses assertGoogleOAuthEnv (NOT assertDriveEnv): this runs
 * BEFORE the folder ID exists, so requiring the folder ID here would be a
 * chicken-and-egg failure. Admin-only: folder creation is owner setup, not
 * a team action.
 */
export async function POST(req: NextRequest) {
  const admin = await requireApiAdmin();
  if (!admin) {
    return NextResponse.json(
      { error: "Admin access required." },
      { status: 403 }
    );
  }

  let oauth;
  try {
    oauth = assertGoogleOAuthEnv();
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    );
  }

  let rawName: unknown = DRIVE_FOLDER_NAME;
  try {
    const body = (await req.json().catch(() => null)) as {
      name?: unknown;
    } | null;
    if (typeof body?.name === "string" && body.name.trim()) {
      rawName = body.name;
    }
  } catch {
    // Empty/unparseable body → fall back to the default folder name.
  }

  const name = sanitizeFolderName(String(rawName));

  try {
    const accessToken = await getDriveAccessToken(
      oauth.clientId,
      oauth.clientSecret,
      oauth.refreshToken
    );
    const id = await ensureDriveFolder(accessToken, name);
    console.log(
      `[drive/ensure-folder] ensured ("${name}") id=${id} by (${admin.email})`
    );
    return NextResponse.json(
      { id, name, envVar: "GOOGLE_DRIVE_UPLOAD_FOLDER_ID" },
      { status: 200 }
    );
  } catch (err) {
    console.error("[drive/ensure-folder]", err);
    return NextResponse.json(
      { error: "Could not create the team folder. Please try again." },
      { status: 502 }
    );
  }
}
