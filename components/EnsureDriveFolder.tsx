"use client";

import { useState } from "react";
import { Badge } from "@/components/Badge";

/**
 * One-click team-folder setup (Admin → Drive setup).
 *
 * Creates (or finds) the SEPARATE locked folder for this Nomin Workspace —
 * default "Nomin Workspace" — via POST /api/drive/ensure-folder, then shows
 * the Drive folder ID to save as GOOGLE_DRIVE_UPLOAD_FOLDER_ID. Idempotent:
 * re-running finds the existing folder, never duplicates it, and never
 * touches any other folder in the account (e.g. Vaayu).
 */

interface EnsureFolderResult {
  id: string;
  name: string;
  envVar: string;
}

export function EnsureDriveFolder({ defaultName }: { defaultName: string }) {
  const [name, setName] = useState(defaultName);
  const [working, setWorking] = useState(false);
  const [result, setResult] = useState<EnsureFolderResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleEnsure = async () => {
    setWorking(true);
    setError(null);
    setResult(null);
    setCopied(false);
    try {
      const res = await fetch("/api/drive/ensure-folder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() || defaultName }),
      });
      const data = (await res.json().catch(() => null)) as
        | (EnsureFolderResult & { error?: unknown })
        | null;
      if (!res.ok || !data || typeof data.id !== "string") {
        throw new Error(
          data && typeof data.error === "string" && data.error
            ? data.error
            : "Could not create the team folder — check the OAuth status above first."
        );
      }
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Setup failed.");
    } finally {
      setWorking(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — the ID is still visible below to copy manually.
    }
  };

  return (
    <div className="mt-4">
      <label
        htmlFor="team-folder-name"
        className="block font-mono text-xs uppercase tracking-wider text-steel mb-1.5 font-semibold"
      >
        Team folder name
      </label>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          id="team-folder-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={100}
          placeholder={defaultName}
          className="flex-1 rounded-2xl border border-hairline bg-canvas px-4 py-2.5 text-sm text-ink placeholder:text-stone focus:border-ink focus:outline-none transition-colors"
        />
        <button
          type="button"
          onClick={handleEnsure}
          disabled={working}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-kraken px-6 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {working ? "Creating…" : "Create folder automatically"}
        </button>
      </div>

      {error && (
        <div className="mt-3 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs leading-relaxed text-red-700">
          {error}
        </div>
      )}

      {result && (
        <div className="mt-3 rounded-xl border border-green-200 bg-green-50 p-3.5 text-xs leading-relaxed text-green-900">
          <div className="flex items-center justify-between gap-3">
            <p className="font-semibold">
              Team folder “{result.name}” is ready.
            </p>
            <Badge tone="live">Ready</Badge>
          </div>
          <p className="mt-2">
            Save this folder ID as{" "}
            <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono">
              {result.envVar}
            </code>{" "}
            in <code className="rounded bg-white/70 px-1.5 py-0.5 font-mono">.env.local</code> and in
            Vercel env vars (all environments), then redeploy:
          </p>
          <code className="mt-1.5 block break-all rounded bg-white/70 px-2 py-1.5 font-mono">
            {result.id}
          </code>
          <button
            type="button"
            onClick={handleCopy}
            className="mt-2 rounded-full border border-green-300 bg-white px-4 py-1.5 text-xs font-semibold text-green-900 hover:bg-green-100 transition-colors"
          >
            {copied ? "Copied" : "Copy folder ID"}
          </button>
        </div>
      )}
    </div>
  );
}
