import { Badge } from "@/components/Badge";
import { MobileNav, NavLinks } from "@/components/MobileNav";
import { SignOutButton } from "@/components/SignOutButton";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserAvatar } from "@/components/UserAvatar";
import { Wordmark } from "@/components/Wordmark";
import { getDisplayName } from "@/lib/userColor";

export interface ShellUser {
  id?: string | null;
  email: string;
  role: "admin" | "member";
  displayName?: string | null;
}

/**
 * The workspace shell — sticky sidebar on desktop, topbar plus drawer on
 * mobile. A server component: the only interactive parts are the client
 * islands it mounts (MobileNav, ThemeToggle, SignOutButton).
 */
export function AppShell({
  user,
  active,
  children,
  fullBleed,
}: {
  user: ShellUser;
  active?: string;
  children: React.ReactNode;
  /**
   * Full-bleed mode: content fills the main column edge to edge, with no
   * max width or side padding. For interfaces that ARE the page — a chat
   * two-pane layout — rather than a card floating inside page chrome.
   */
  fullBleed?: boolean;
}) {
  const primary = getDisplayName(user.displayName, user.email);

  return (
    <div className="flex min-h-screen bg-canvas text-ink">
      {/* ── Sidebar (desktop) ── */}
      <aside className="sticky top-0 hidden h-screen w-[264px] shrink-0 flex-col border-r border-hairline-soft bg-canvas lg:flex">
        <div className="px-5 pb-2 pt-5">
          <Wordmark />
        </div>
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          <NavLinks active={active} role={user.role} />
        </nav>
        <div className="border-t border-hairline-soft p-4">
          <div className="mb-3 flex items-center gap-3 rounded-xl bg-fog px-3 py-2.5">
            <UserAvatar
              displayName={user.displayName}
              email={user.email}
              userId={user.id ?? undefined}
              size={36}
            />
            <span className="min-w-0 flex-1 leading-tight">
              <span className="block truncate text-[13px] font-semibold">
                {primary}
              </span>
              <span className="block truncate font-mono text-[11px] text-steel">
                {user.email}
              </span>
              <span className="mt-0.5 block text-micro text-stone">
                {user.role}
              </span>
            </span>
          </div>
          <SignOutButton />
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-hairline-soft bg-canvas/85 backdrop-blur-md">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-3 sm:px-6">
            <MobileNav active={active} role={user.role} />
            <div className="lg:hidden">
              <Wordmark compact />
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle compact />
              <Badge tone="live">
                <span className="h-1.5 w-1.5 rounded-full bg-success-text animate-[pulse-dot_2.2s_ease-in-out_infinite]" />
                Live
              </Badge>
              <span title={`${primary} · ${user.role}`}>
                <UserAvatar
                  displayName={user.displayName}
                  email={user.email}
                  userId={user.id ?? undefined}
                  size={34}
                />
              </span>
            </div>
          </div>
        </header>

        <div
          className={
            fullBleed
              ? "flex min-w-0 flex-1 flex-col"
              : "mx-auto w-full max-w-6xl flex-1 px-4 pb-16 sm:px-6"
          }
        >
          {children}
        </div>

        <footer className="border-t border-hairline-soft">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-1 px-4 py-5 text-micro text-stone sm:px-6">
            <span>Nomin Workspace</span>
            <span className="ml-auto">© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
