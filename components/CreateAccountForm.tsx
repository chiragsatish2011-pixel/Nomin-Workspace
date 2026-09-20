"use client";

import { useState } from "react";
import { Button } from "@/components/Button";

/**
 * Admin → create a member account.
 *
 * The password is typed by the admin and shown back exactly once, in a copy
 * box, so it can be shared privately. It is never stored in plaintext, never
 * logged, and never retrievable afterwards — losing it means setting a new
 * one from the team list.
 */
export function CreateAccountForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{
    email: string;
    password: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't create the account.");
      setCreated({ email: email.trim().toLowerCase(), password });
      setEmail("");
      setPassword("");
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (created) {
    return (
      <div className="rounded-2xl border border-hairline-soft bg-fog p-5">
        <p className="text-micro text-success-text">Account created</p>
        <p className="mt-3 text-[14px] text-slate">
          Share these credentials privately with{" "}
          <span className="font-semibold">{created.email}</span>. This password
          is shown once and cannot be recovered.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-hairline bg-canvas px-3.5 py-2.5">
          <code className="min-w-0 flex-1 truncate font-mono text-[13px]">
            {created.password}
          </code>
          <Button
            size="sm"
            variant="outlined"
            onClick={() => {
              navigator.clipboard
                ?.writeText(created.password)
                .then(() => setCopied(true))
                // Clipboard access can be refused; the password is on screen
                // either way, so there is nothing to recover from.
                .catch(() => {});
            }}
          >
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <div className="mt-4">
          <Button
            variant="subtle"
            size="sm"
            onClick={() => {
              setCreated(null);
              setCopied(false);
            }}
          >
            Create another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="flex flex-col gap-3 rounded-2xl border border-hairline-soft bg-fog p-5"
    >
      <p className="text-micro text-stone">New account</p>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">Email</span>
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="teammate@team.com"
          className="h-10 rounded-xl border border-hairline bg-canvas px-3.5 text-[14px] focus:border-purple focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">Password</span>
        <input
          type="text"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
          className="h-10 rounded-xl border border-hairline bg-canvas px-3.5 font-mono text-[14px] focus:border-purple focus:outline-none"
        />
      </label>
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
      <div className="pt-1">
        <Button type="submit" loading={busy}>
          Create account
        </Button>
      </div>
    </form>
  );
}
