"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";

/**
 * Per-row admin actions: change a member's password, or delete the account.
 *
 * Deletion asks for confirmation because it cascades — the user's
 * checkpoints, messages and files go with them. An admin's own row renders
 * without a delete button; the API refuses self-deletion regardless.
 */
export function UserRowActions({
  userId,
  email,
  isSelf,
}: {
  userId: string;
  email: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [mode, setMode] = useState<"idle" | "password" | "confirmDelete">("idle");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  async function call(method: "PATCH" | "DELETE", body: unknown) {
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      return true;
    } catch (err) {
      setError((err as Error).message);
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (mode === "password") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={password}
            minLength={8}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="New password"
            className="h-9 w-48 rounded-xl border border-hairline bg-canvas px-3 font-mono text-[13px] focus:border-purple focus:outline-none"
          />
          <Button
            size="sm"
            loading={busy}
            disabled={password.length < 8}
            onClick={async () => {
              if (await call("PATCH", { id: userId, newPassword: password })) {
                setDone("Password changed — share it privately.");
                setPassword("");
                setMode("idle");
              }
            }}
          >
            Save
          </Button>
          <Button size="sm" variant="subtle" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    );
  }

  if (mode === "confirmDelete") {
    return (
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[13px] text-slate">
            Delete {email} and everything they posted?
          </span>
          <Button
            size="sm"
            variant="danger"
            loading={busy}
            onClick={async () => {
              if (await call("DELETE", { id: userId })) router.refresh();
            }}
          >
            Delete
          </Button>
          <Button size="sm" variant="subtle" onClick={() => setMode("idle")}>
            Cancel
          </Button>
        </div>
        {error && <p className="text-[12px] text-error">{error}</p>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button size="sm" variant="outlined" onClick={() => setMode("password")}>
        Change password
      </Button>
      {!isSelf && (
        <Button
          size="sm"
          variant="subtle"
          onClick={() => setMode("confirmDelete")}
        >
          Delete
        </Button>
      )}
      {done && <span className="text-[12px] text-success-text">{done}</span>}
      {error && <span className="text-[12px] text-error">{error}</span>}
    </div>
  );
}
