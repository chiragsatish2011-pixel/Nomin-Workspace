"use client";

import { useCallback, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { PencilIcon, TrashIcon } from "@/components/icons";
import { UserAvatar } from "@/components/UserAvatar";
import { formatRelativeTime } from "@/lib/format";
import { getDisplayName } from "@/lib/userColor";

/**
 * The checkpoints timeline: compose, list, edit and delete.
 *
 * The permission checks below only decide what to RENDER. The API enforces
 * author-or-admin independently on every write, so hiding a button is a
 * courtesy, never the security boundary.
 */

export interface CheckpointRow {
  id: string;
  note: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  displayName: string | null;
  userEmail: string;
}

export interface Viewer {
  id: string;
  role: "admin" | "member";
}

export function CheckpointsList({
  initial,
  viewer,
  loadError,
}: {
  initial: CheckpointRow[];
  viewer: Viewer;
  /** Set when the server render itself failed to read the timeline. */
  loadError?: string | null;
}) {
  const [rows, setRows] = useState<CheckpointRow[]>(initial);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(loadError ?? null);
  const [posting, setPosting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState("");
  const [pendingId, setPendingId] = useState<string | null>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);

  const canModify = useCallback(
    (row: CheckpointRow) => row.userId === viewer.id || viewer.role === "admin",
    [viewer.id, viewer.role]
  );

  async function send(method: string, body: unknown) {
    const res = await fetch("/api/checkpoints", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Something went wrong.");
    return data;
  }

  async function post(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = note.trim();
    if (!trimmed || posting) return;
    setError(null);
    setPosting(true);
    try {
      const data = await send("POST", { note: trimmed });
      // The server returns the stored row, so the timestamps rendered are
      // the database's, never a guess made on the client.
      setRows((prev) => [data.checkpoint as CheckpointRow, ...prev]);
      setNote("");
      composerRef.current?.focus();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPosting(false);
    }
  }

  async function saveEdit(id: string) {
    const trimmed = editText.trim();
    if (!trimmed) return;
    setError(null);
    setPendingId(id);
    try {
      const data = await send("PATCH", { id, note: trimmed });
      const updated = data.checkpoint as CheckpointRow;
      setRows((prev) =>
        prev.map((r) => (r.id === id ? { ...r, ...updated } : r))
      );
      setEditingId(null);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  async function remove(id: string) {
    setError(null);
    setPendingId(id);
    try {
      await send("DELETE", { id });
      setRows((prev) => prev.filter((r) => r.id !== id));
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 py-8">
      {/* ── Composer ── */}
      <form onSubmit={post} className="flex flex-col gap-3">
        <textarea
          ref={composerRef}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onKeyDown={(e) => {
            // Cmd/Ctrl+Enter posts, matching the convention everywhere else
            // a multi-line composer exists.
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              e.currentTarget.form?.requestSubmit();
            }
          }}
          rows={3}
          maxLength={4000}
          placeholder="What moved forward? Post a checkpoint for the team…"
          className="w-full resize-y rounded-2xl border border-hairline bg-canvas px-4 py-3.5 text-[15px] leading-relaxed text-ink transition-colors placeholder:text-muted hover:border-stone focus:border-purple focus:outline-none"
        />
        <div className="flex items-center gap-3">
          <Button type="submit" loading={posting} disabled={!note.trim()}>
            Post checkpoint
          </Button>
          <span className="text-[12px] text-stone">
            Visible to everyone in the workspace · ⌘↵ to post
          </span>
        </div>
      </form>

      {error && (
        <p
          role="alert"
          className="rounded-xl bg-error-bg px-4 py-3 text-[13px] text-error"
        >
          {error}
        </p>
      )}

      {/* ── Timeline ── */}
      {rows.length === 0 ? (
        <p className="rounded-2xl border border-hairline-soft bg-fog px-5 py-8 text-center text-[14px] text-stone">
          No checkpoints yet. The first one sets the timeline going.
        </p>
      ) : (
        <ol className="flex flex-col">
          {rows.map((row, i) => {
            const editing = editingId === row.id;
            const pending = pendingId === row.id;
            const edited = row.updatedAt !== row.createdAt;
            return (
              <li key={row.id} className="relative flex gap-4 pb-7">
                {/* Timeline rail — omitted on the last row so it doesn't
                    trail off past the final entry. */}
                {i < rows.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-[19px] top-11 bottom-0 w-px bg-hairline-soft"
                  />
                )}
                <UserAvatar
                  displayName={row.displayName}
                  email={row.userEmail}
                  userId={row.userId}
                  size={38}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                    <span className="text-[14px] font-semibold">
                      {getDisplayName(row.displayName, row.userEmail)}
                    </span>
                    <span className="font-mono text-[11px] text-stone">
                      {formatRelativeTime(row.createdAt)}
                      {edited && " · edited"}
                    </span>
                    {canModify(row) && !editing && (
                      <span className="ml-auto flex items-center gap-1">
                        <button
                          type="button"
                          aria-label="Edit checkpoint"
                          disabled={pending}
                          onClick={() => {
                            setEditingId(row.id);
                            setEditText(row.note);
                          }}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-stone transition-colors hover:bg-mist hover:text-ink disabled:opacity-50"
                        >
                          <PencilIcon className="h-[15px] w-[15px]" />
                        </button>
                        <button
                          type="button"
                          aria-label="Delete checkpoint"
                          disabled={pending}
                          onClick={() => remove(row.id)}
                          className="inline-flex h-7 w-7 items-center justify-center rounded-full text-stone transition-colors hover:bg-error-bg hover:text-error disabled:opacity-50"
                        >
                          <TrashIcon className="h-[15px] w-[15px]" />
                        </button>
                      </span>
                    )}
                  </div>

                  {editing ? (
                    <div className="mt-2 flex flex-col gap-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={3}
                        maxLength={4000}
                        className="w-full resize-y rounded-xl border border-hairline bg-canvas px-3.5 py-2.5 text-[14px] leading-relaxed focus:border-purple focus:outline-none"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          loading={pending}
                          disabled={!editText.trim()}
                          onClick={() => saveEdit(row.id)}
                        >
                          Save
                        </Button>
                        <Button
                          size="sm"
                          variant="subtle"
                          onClick={() => setEditingId(null)}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="mt-1.5 whitespace-pre-wrap text-[15px] leading-relaxed text-slate">
                      {row.note}
                    </p>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
