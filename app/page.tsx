import { AppShell } from "@/components/AppShell";
import { SectionMatrix } from "@/components/SectionMatrix";
import { requireActiveSession } from "@/lib/session";
import { getDisplayName } from "@/lib/userColor";

/**
 * The dashboard. A server component behind requireActiveSession(), so the
 * page never renders at all for a signed-out visitor or a deleted account —
 * there is no client-side flash of protected content.
 */
export default async function DashboardPage() {
  const user = await requireActiveSession();
  const name = getDisplayName(user.displayName, user.email);

  return (
    <AppShell user={user} active="home">
      <section className="py-10">
        <p className="text-micro text-purple">Dashboard</p>
        <h1 className="mt-3 font-display text-[32px] font-bold tracking-[-0.03em] sm:text-[38px]">
          Welcome back, {name.split(" ")[0]}.
        </h1>
        <p className="mt-2 max-w-xl text-[15px] leading-relaxed text-steel">
          Everything your team is working on, in one place. Pick a section to
          get started.
        </p>
      </section>

      <SectionMatrix />
    </AppShell>
  );
}
