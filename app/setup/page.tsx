"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthSubmit,
} from "@/components/AuthLayout";
import { Button } from "@/components/Button";

/**
 * First-run wizard: database → tables → owner account.
 *
 * This is the ONE flow that works without DATABASE_URL — step 1 is what
 * collects it. It self-disables permanently once any account exists (the
 * server enforces that in /api/setup/owner; this page just reflects it),
 * so it can never become a public sign-up route.
 */

interface SetupStatus {
  configured: boolean;
  reachable: boolean;
  tables: boolean;
  admin: boolean;
  hasUsers: boolean;
  isProduction: boolean;
}

type StepState = "todo" | "active" | "done";

function StepHeader({
  index,
  title,
  state,
}: {
  index: number;
  title: string;
  state: StepState;
}) {
  return (
    <div className="flex items-center gap-3">
      <span
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-mono text-[12px] font-semibold ${
          state === "done"
            ? "bg-success-bg text-success-text"
            : state === "active"
              ? "bg-purple text-white"
              : "bg-mist text-stone"
        }`}
      >
        {state === "done" ? "✓" : index}
      </span>
      <span
        className={`text-[15px] font-semibold ${
          state === "todo" ? "text-stone" : "text-ink"
        }`}
      >
        {title}
      </span>
    </div>
  );
}

export default function SetupPage() {
  const [status, setStatus] = useState<SetupStatus | null>(null);
  const [databaseUrl, setDatabaseUrl] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [busy, setBusy] = useState<null | "database" | "migrate" | "owner">(null);
  const [done, setDone] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/setup/status");
      if (res.ok) setStatus(await res.json());
    } catch {
      // Leave the last known status in place; the next poll may succeed.
    }
  }, []);

  useEffect(() => {
    // The state update lives inside the async callback rather than the
    // effect body, and a cancel flag stops a late response writing to an
    // unmounted component.
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/setup/status");
        if (!cancelled && res.ok) setStatus(await res.json());
      } catch {
        // Leave the last known status in place; the user can retry a step.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  async function post(url: string, body?: unknown) {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function submitDatabase(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("database");
    try {
      const data = await post("/api/setup/database", { databaseUrl });
      // In production the URL is only tested; the message explains that the
      // value still has to be set in the host's dashboard.
      if (data.message) setNotice(data.message);
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function submitMigrate() {
    setError(null);
    setNotice(null);
    setBusy("migrate");
    try {
      const data = await post("/api/setup/migrate");
      setNotice(
        data.already
          ? "The tables already existed — nothing was changed."
          : "Tables created."
      );
      await refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  async function submitOwner(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy("owner");
    try {
      await post("/api/setup/owner", { email: email.trim(), password });
      setDone(true);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(null);
    }
  }

  // Already set up: say so and point at sign-in rather than showing a
  // wizard that the server would refuse anyway.
  if (status?.hasUsers && !done) {
    return (
      <AuthLayout
        eyebrow="Setup"
        title="This workspace is already set up."
        subtitle="Setup runs once, on an empty workspace. Sign in to continue."
      >
        <Link href="/signin">
          <Button size="lg" className="w-full">
            Go to sign in
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  if (done) {
    return (
      <AuthLayout
        eyebrow="Setup complete"
        title="Your workspace is ready."
        subtitle="Sign in with the owner account you just created. From there, add the rest of your team under Admin."
      >
        <Link href="/signin">
          <Button size="lg" className="w-full">
            Go to sign in
          </Button>
        </Link>
      </AuthLayout>
    );
  }

  const dbState: StepState = status?.reachable ? "done" : "active";
  const tableState: StepState = status?.tables
    ? "done"
    : status?.reachable
      ? "active"
      : "todo";
  const ownerState: StepState = status?.tables ? "active" : "todo";

  return (
    <AuthLayout
      eyebrow="First run"
      title="Set up your workspace."
      subtitle="Three steps: connect a database, create the tables, create the owner account."
      footer={
        <span className="text-micro text-stone">
          Setup closes for good once the first account exists
        </span>
      }
    >
      <div className="flex flex-col gap-8">
        {/* ── Step 1 · Database ── */}
        <section className="flex flex-col gap-3">
          <StepHeader index={1} title="Connect a database" state={dbState} />
          {dbState === "done" ? (
            <p className="pl-10 text-[13px] text-steel">
              Connected. DATABASE_URL is set and reachable.
            </p>
          ) : (
            <form onSubmit={submitDatabase} className="flex flex-col gap-3 pl-10">
              <AuthField
                label="Postgres URL"
                type="password"
                required
                value={databaseUrl}
                onChange={(e) => setDatabaseUrl(e.target.value)}
                placeholder="postgresql://…"
                hint={
                  status?.isProduction
                    ? "In production this is only tested — set the value in your host's dashboard."
                    : "Saved to .env.local. Use a pooled connection string."
                }
              />
              <Button type="submit" loading={busy === "database"}>
                Test connection
              </Button>
            </form>
          )}
        </section>

        {/* ── Step 2 · Tables ── */}
        <section className="flex flex-col gap-3">
          <StepHeader index={2} title="Create the tables" state={tableState} />
          {tableState === "done" ? (
            <p className="pl-10 text-[13px] text-steel">
              Schema applied. The workspace tables exist.
            </p>
          ) : (
            <div className="pl-10">
              <Button
                onClick={submitMigrate}
                loading={busy === "migrate"}
                disabled={tableState === "todo"}
              >
                Create tables
              </Button>
            </div>
          )}
        </section>

        {/* ── Step 3 · Owner ── */}
        <section className="flex flex-col gap-3">
          <StepHeader index={3} title="Create the owner account" state={ownerState} />
          <form onSubmit={submitOwner} className="flex flex-col gap-3 pl-10">
            <AuthField
              label="Email"
              type="email"
              required
              autoComplete="email"
              disabled={ownerState !== "active"}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@team.com"
            />
            <AuthField
              label="Password"
              type="password"
              required
              autoComplete="new-password"
              disabled={ownerState !== "active"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 8 characters"
            />
            <AuthSubmit
              loading={busy === "owner"}
              disabled={ownerState !== "active"}
            >
              Create owner account
            </AuthSubmit>
          </form>
        </section>

        {notice && (
          <p className="rounded-xl bg-purple-soft px-3.5 py-2.5 text-[13px] text-purple-deep">
            {notice}
          </p>
        )}
        {error && <AuthError message={error} />}
      </div>
    </AuthLayout>
  );
}
