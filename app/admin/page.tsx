import { asc } from "drizzle-orm";
import { unstable_rethrow } from "next/navigation";
import { db } from "@/db";
import { users } from "@/db/schema";
import { AppShell } from "@/components/AppShell";
import { Badge } from "@/components/Badge";
import { CreateAccountForm } from "@/components/CreateAccountForm";
import { UserAvatar } from "@/components/UserAvatar";
import { UserRowActions } from "@/components/UserRowActions";
import { formatDate } from "@/lib/format";
import { requireAdmin } from "@/lib/session";
import { getDisplayName } from "@/lib/userColor";

export const metadata = {
  title: "Admin · Nomin Workspace",
  description: "Create accounts, change passwords and remove team members.",
};

export const dynamic = "force-dynamic";

/**
 * Admin — the only place credentials are managed.
 *
 * requireAdmin() redirects a non-admin away before any of this renders, and
 * every action here goes through /api/admin/users, which re-checks the
 * caller's role server-side. There is no public sign-up anywhere in the app.
 */
export default async function AdminPage() {
  const admin = await requireAdmin();

  let team: {
    id: string;
    email: string;
    role: "admin" | "member";
    displayName: string | null;
    createdAt: Date;
  }[] = [];
  let loadError: string | null = null;
  try {
    team = await db
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
        displayName: users.displayName,
        createdAt: users.createdAt,
      })
      .from(users)
      .orderBy(asc(users.createdAt));
  } catch (err) {
    unstable_rethrow(err);
    console.error("[admin] team load failed:", err);
    loadError = "Couldn't load the team. Try refreshing the page.";
  }

  return (
    <AppShell user={admin} active="admin">
      <header className="border-b border-hairline-soft py-8">
        <p className="text-micro text-purple">Admin</p>
        <h1 className="mt-3 font-display text-[26px] font-bold tracking-[-0.025em]">
          Team &amp; credentials
        </h1>
        <p className="mt-1 max-w-xl text-[15px] leading-relaxed text-steel">
          Accounts are created here and nowhere else. Members have no
          self-service password UI — every password on this page is one you
          set and share privately.
        </p>
      </header>

      <div className="grid gap-8 py-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="order-2 lg:order-1">
          <h2 className="text-micro text-stone">
            Team · {team.length} {team.length === 1 ? "member" : "members"}
          </h2>

          {loadError ? (
            <p
              role="alert"
              className="mt-4 rounded-xl bg-error-bg px-4 py-3 text-[13px] text-error"
            >
              {loadError}
            </p>
          ) : (
            <ul className="mt-4 flex flex-col gap-3">
              {team.map((member) => (
                <li
                  key={member.id}
                  className="flex flex-wrap items-center gap-4 rounded-2xl border border-hairline-soft p-4"
                >
                  <UserAvatar
                    displayName={member.displayName}
                    email={member.email}
                    userId={member.id}
                    size={40}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[14px] font-semibold">
                        {getDisplayName(member.displayName, member.email)}
                      </span>
                      {member.role === "admin" && (
                        <Badge tone="brand">Admin</Badge>
                      )}
                      {member.id === admin.id && <Badge tone="neutral">You</Badge>}
                    </div>
                    <span className="block truncate font-mono text-[12px] text-steel">
                      {member.email}
                    </span>
                    <span className="block text-[12px] text-stone">
                      Joined {formatDate(member.createdAt)}
                    </span>
                  </div>
                  <UserRowActions
                    userId={member.id}
                    email={member.email}
                    isSelf={member.id === admin.id}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="order-1 lg:order-2">
          <CreateAccountForm />
        </aside>
      </div>
    </AppShell>
  );
}
