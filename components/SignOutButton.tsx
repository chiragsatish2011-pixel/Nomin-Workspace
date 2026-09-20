"use client";

import { signOut } from "next-auth/react";
import { useState } from "react";
import { SignOutIcon } from "@/components/icons";

export function SignOutButton() {
  const [busy, setBusy] = useState(false);
  return (
    <button
      type="button"
      disabled={busy}
      onClick={() => {
        setBusy(true);
        // Land on the sign-in page rather than the dashboard, which would
        // only bounce back here through the proxy redirect.
        signOut({ callbackUrl: "/signin" });
      }}
      className="flex w-full items-center justify-center gap-2 rounded-full border border-hairline px-4 py-2.5 text-[13px] font-medium text-steel transition-colors hover:border-purple hover:text-purple disabled:opacity-55"
    >
      <SignOutIcon className="h-4 w-4" />
      {busy ? "Signing out…" : "Sign out"}
    </button>
  );
}
