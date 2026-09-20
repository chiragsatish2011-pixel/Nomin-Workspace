"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

/**
 * Shown above the sign-in form when the workspace has no accounts yet —
 * otherwise a fresh deployment looks broken, with a login form and no way
 * in. It disappears the moment the first account exists.
 *
 * The status endpoint returns booleans only, so this is safe pre-auth.
 */
export function SetupBanner() {
  const [needsSetup, setNeedsSetup] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/setup/status")
      .then((r) => (r.ok ? r.json() : null))
      .then((s) => {
        if (!cancelled && s && s.reachable && !s.hasUsers) setNeedsSetup(true);
      })
      // A failed probe means we don't know — stay quiet rather than show a
      // misleading "set up your workspace" prompt on a working install.
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (!needsSetup) return null;

  return (
    <div className="rounded-xl bg-purple-soft px-4 py-3 text-[13px] text-purple-deep">
      This workspace has no accounts yet.{" "}
      <Link href="/setup" className="font-semibold underline underline-offset-2">
        Run the setup wizard
      </Link>{" "}
      to create the first one.
    </div>
  );
}
