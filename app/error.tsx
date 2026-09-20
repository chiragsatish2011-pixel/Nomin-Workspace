"use client";

import { useEffect } from "react";
import { Button } from "@/components/Button";

/**
 * Route-level error boundary. The raw error message may name internal
 * details, so it goes to the console for the developer, and the user sees a
 * plain description plus a way to retry.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-micro text-purple">Something broke</p>
      <h1 className="max-w-md font-display text-[26px] font-bold tracking-[-0.025em]">
        This page didn&apos;t load.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-steel">
        The error has been logged. Trying again often clears it — if it
        doesn&apos;t, the workspace may be missing a configuration value.
      </p>
      {error.digest && (
        <p className="font-mono text-[11px] text-stone">
          Reference: {error.digest}
        </p>
      )}
      <Button onClick={reset}>Try again</Button>
    </main>
  );
}
