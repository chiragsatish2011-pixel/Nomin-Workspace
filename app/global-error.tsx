"use client";

import { useEffect } from "react";

/**
 * The last-resort boundary, for a failure in the root layout itself. It
 * must render its own <html> and <body>, and it cannot rely on the app's
 * fonts or tokens — the layout that provides them is what failed.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body
        style={{
          display: "flex",
          minHeight: "100vh",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "24px",
          textAlign: "center",
          fontFamily:
            "ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif",
          color: "#101114",
          background: "#ffffff",
        }}
      >
        <h1 style={{ fontSize: "22px", fontWeight: 700, margin: 0 }}>
          Nomin Workspace couldn&apos;t start.
        </h1>
        <p style={{ maxWidth: "380px", color: "#686b82", margin: 0 }}>
          A failure in the root layout stopped the app from rendering. The
          details are in the server logs.
        </p>
        <button
          onClick={reset}
          style={{
            borderRadius: "999px",
            border: "none",
            background: "#7132f5",
            color: "#fff",
            padding: "10px 20px",
            fontSize: "14px",
            cursor: "pointer",
          }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
