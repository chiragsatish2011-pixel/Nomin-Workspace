"use client";

import Link from "next/link";
import { useState } from "react";
import { CloseIcon, HomeIcon, MenuIcon, SettingsIcon, ShieldIcon } from "@/components/icons";
import { SECTIONS } from "@/components/sections";

/**
 * Navigation links, shared by the desktop sidebar and the mobile drawer so
 * the two can never drift apart. Admin-only entries are filtered by role
 * here for tidiness — the actual gate is requireAdmin() on the server.
 */
export function NavLinks({
  active,
  role,
  onNavigate,
}: {
  active?: string;
  role: "admin" | "member";
  onNavigate?: () => void;
}) {
  const items = [
    { key: "home", href: "/", label: "Dashboard", icon: HomeIcon, accent: undefined as string | undefined },
    ...SECTIONS.map((s) => ({
      key: s.key,
      href: s.href,
      label: s.label,
      icon: s.icon as typeof HomeIcon,
      accent: s.accent,
    })),
    { key: "settings", href: "/settings", label: "Settings", icon: SettingsIcon, accent: undefined },
    ...(role === "admin"
      ? [{ key: "admin", href: "/admin", label: "Admin", icon: ShieldIcon, accent: undefined }]
      : []),
  ];

  return (
    <ul className="flex flex-col gap-0.5">
      {items.map((item) => {
        const isActive = active === item.key;
        const Icon = item.icon;
        return (
          <li key={item.key}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-[14px] transition-colors ${
                isActive
                  ? "bg-mist font-semibold text-ink"
                  : "font-medium text-steel hover:bg-fog hover:text-ink"
              }`}
            >
              <Icon
                className="h-[18px] w-[18px]"
                // The section's identity color marks the active row only —
                // an inactive row stays neutral, so the nav doesn't turn
                // into a row of competing colors.
                style={isActive && item.accent ? { color: item.accent } : undefined}
              />
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function MobileNav({
  active,
  role,
}: {
  active?: string;
  role: "admin" | "member";
}) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        className="inline-flex h-9 w-9 items-center justify-center rounded-full text-steel transition-colors hover:bg-mist hover:text-ink lg:hidden"
      >
        <MenuIcon className="h-5 w-5" />
      </button>

      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close navigation"
            onClick={() => setOpen(false)}
            className="absolute inset-0 bg-ink/35 backdrop-blur-[2px]"
          />
          <nav className="absolute inset-y-0 left-0 flex w-[280px] flex-col border-r border-hairline-soft bg-canvas p-4 animate-[fade-in_0.2s_ease]">
            <div className="mb-4 flex items-center justify-between px-1">
              <span className="text-micro text-stone">Navigate</span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close navigation"
                className="inline-flex h-8 w-8 items-center justify-center rounded-full text-steel hover:bg-mist hover:text-ink"
              >
                <CloseIcon className="h-4 w-4" />
              </button>
            </div>
            <NavLinks active={active} role={role} onNavigate={() => setOpen(false)} />
          </nav>
        </div>
      )}
    </>
  );
}
