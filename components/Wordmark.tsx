import Link from "next/link";

/**
 * The Nomin wordmark. `compact` drops the tagline for the mobile topbar,
 * where the sidebar's full lockup doesn't fit.
 */
export function Wordmark({ compact = false }: { compact?: boolean }) {
  return (
    <Link href="/" className="inline-flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple font-display text-[15px] font-bold text-white"
      >
        N
      </span>
      <span className="leading-tight">
        <span className="block font-display text-[17px] font-bold tracking-[-0.02em]">
          Nomin
        </span>
        {!compact && (
          <span className="block text-micro text-stone">Workspace</span>
        )}
      </span>
    </Link>
  );
}
