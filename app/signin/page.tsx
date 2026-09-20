"use client";

import { signIn } from "next-auth/react";
import { useState } from "react";
import {
  AuthError,
  AuthField,
  AuthLayout,
  AuthSubmit,
} from "@/components/AuthLayout";
import { SetupBanner } from "@/components/SetupBanner";

/**
 * Resolve the post-login target from ?callbackUrl= (route guards put it
 * there when they bounce a signed-out visitor). Absolute and
 * protocol-relative URLs are rejected, so a crafted link can never send a
 * fresh login to an external site.
 */
function safeCallbackTarget(): string {
  if (typeof window === "undefined") return "/";
  const raw = new URLSearchParams(window.location.search).get("callbackUrl");
  if (!raw || !raw.startsWith("/") || raw.startsWith("//")) return "/";
  return raw;
}

export default function SignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  // idle → submitting (checking credentials) → navigating (dashboard
  // loading). The button stays busy through navigation, so the handoff
  // never looks stuck on an idle form.
  const [phase, setPhase] = useState<"idle" | "submitting" | "navigating">(
    "idle"
  );
  const busy = phase !== "idle";

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPhase("submitting");
    try {
      const res = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (res?.error) {
        // CredentialsSignin means wrong email or password. Any other code
        // is the server reporting that auth itself is broken (the
        // ServiceUnavailable thrown in lib/auth.ts on a database outage) —
        // never show that as "wrong password".
        setError(
          res.error === "CredentialsSignin"
            ? "Invalid email or password."
            : "Something went wrong signing in. Please try again."
        );
        setPhase("idle");
      } else if (res?.ok) {
        // A full browser navigation rather than router.push: it guarantees
        // a clean handoff with fresh server state, so no in-flight router
        // cache can stall on the way to the dashboard.
        setPhase("navigating");
        window.location.assign(safeCallbackTarget());
      } else {
        setError("Could not sign in. Please try again.");
        setPhase("idle");
      }
    } catch {
      setError("Could not sign in. Please try again.");
      setPhase("idle");
    }
  }

  return (
    <AuthLayout
      eyebrow="Sign in"
      title="Welcome back."
      subtitle="Pick up exactly where your team left off."
      footer={
        <span className="text-micro text-stone">
          Private workspace · accounts are created by your admin
        </span>
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <SetupBanner />
        <AuthField
          label="Email"
          type="email"
          required
          autoComplete="email"
          disabled={busy}
          value={email}
          onChange={(e) => {
            if (error) setError(null);
            setEmail(e.target.value);
          }}
          placeholder="you@team.com"
        />
        <AuthField
          label="Password"
          type="password"
          required
          autoComplete="current-password"
          disabled={busy}
          value={password}
          onChange={(e) => {
            if (error) setError(null);
            setPassword(e.target.value);
          }}
          placeholder="••••••••"
        />
        {error && <AuthError message={error} />}
        <div className="pt-1">
          <AuthSubmit loading={busy}>
            {phase === "navigating"
              ? "Opening workspace…"
              : phase === "submitting"
                ? "Signing in…"
                : "Sign in"}
          </AuthSubmit>
        </div>
      </form>
    </AuthLayout>
  );
}
