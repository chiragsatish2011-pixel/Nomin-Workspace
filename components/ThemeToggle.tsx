"use client";

import { useSyncExternalStore } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";

/**
 * Light/dark toggle.
 *
 * The `dark` class on <html> is the source of truth, written before first
 * paint by the script in app/layout.tsx — that script is what stops dark
 * mode flashing light on load, and this component is what keeps it in sync
 * afterwards. The storage key below must stay identical to the one there.
 *
 * The class is external state that React doesn't own, so it is read through
 * useSyncExternalStore rather than mirrored into an effect: the server
 * snapshot is always light (nothing is rendered dark on the server), and
 * the client re-reads the real class on hydration.
 */
const STORAGE_KEY = "nomin:theme";

function subscribe(onChange: () => void) {
  // The class changes from this component and, across tabs, from storage.
  const observer = new MutationObserver(onChange);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["class"],
  });
  window.addEventListener("storage", onChange);
  return () => {
    observer.disconnect();
    window.removeEventListener("storage", onChange);
  };
}

function getSnapshot() {
  return document.documentElement.classList.contains("dark");
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const dark = useSyncExternalStore(subscribe, getSnapshot, () => false);

  function toggle() {
    const next = !dark;
    // Write to the DOM only — the store subscription above turns that into
    // a re-render, so there is no second copy of this state to keep in sync.
    document.documentElement.classList.toggle("dark", next);
    document.documentElement.setAttribute("data-theme", next ? "dark" : "light");
    document.documentElement.style.colorScheme = next ? "dark" : "light";
    try {
      localStorage.setItem(STORAGE_KEY, next ? "dark" : "light");
    } catch {
      // Private mode or blocked storage: the toggle still works for this
      // page view, it just won't be remembered. Not worth surfacing.
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className={`inline-flex items-center justify-center rounded-full text-steel transition-colors hover:bg-mist hover:text-ink ${
        compact ? "h-9 w-9" : "h-10 w-10"
      }`}
    >
      {dark ? (
        <SunIcon className="h-[18px] w-[18px]" />
      ) : (
        <MoonIcon className="h-[18px] w-[18px]" />
      )}
    </button>
  );
}
