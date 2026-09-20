"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/Button";

/**
 * A member editing their own profile. Deliberately limited to display name,
 * department and job title — email, role and password are an admin's to
 * change, and the API refuses them here regardless of what this form sends.
 */
export function SettingsForm({
  initial,
}: {
  initial: {
    displayName: string | null;
    department: string | null;
    jobTitle: string | null;
  };
}) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(initial.displayName ?? "");
  const [department, setDepartment] = useState(initial.department ?? "");
  const [jobTitle, setJobTitle] = useState(initial.jobTitle ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    setBusy(true);
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ displayName, department, jobTitle }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Couldn't save your profile.");
      setSaved(true);
      // The name shows in the shell and on every checkpoint, so refresh the
      // server components rather than leaving a stale name on screen.
      router.refresh();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  const field =
    "h-10 rounded-xl border border-hairline bg-canvas px-3.5 text-[14px] focus:border-purple focus:outline-none";

  return (
    <form onSubmit={submit} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">Display name</span>
        <input
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          maxLength={120}
          placeholder="How your name appears to the team"
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">Department</span>
        <input
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          maxLength={120}
          placeholder="Engineering, Design, …"
          className={field}
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-[13px] font-medium text-slate">Job title</span>
        <input
          value={jobTitle}
          onChange={(e) => setJobTitle(e.target.value)}
          maxLength={120}
          placeholder="What you do here"
          className={field}
        />
      </label>

      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}
      <div className="flex items-center gap-3 pt-1">
        <Button type="submit" loading={busy}>
          Save profile
        </Button>
        {saved && !busy && (
          <span className="text-[13px] text-success-text">Saved.</span>
        )}
      </div>
    </form>
  );
}
