import Image from "next/image";
import Link from "next/link";

/**
 * Nomin brand lockup — the petal mark + IBM Plex Sans wordmark.
 *
 * The mark is a transparent PNG generated from `brand/nomin-mark-source.webp`
 * by `scripts/generate-brand-assets.mjs`, which also emits the favicon and
 * app icons. Change the source and re-run that script; never hand-edit the
 * generated files. No rounded corners, ring, background or shadow here — the
 * mark has a transparent background and must float cleanly on any surface.
 */
export function Wordmark({
  compact = false,
  size = "md",
}: {
  compact?: boolean;
  /** "md" (header/nav) or "lg" (hero moments like sign-in). */
  size?: "md" | "lg";
}) {
  const markClass = compact
    ? "h-9 w-9"
    : size === "lg"
      ? "h-16 w-16"
      : "h-11 w-11";
  return (
    <Link href="/" className="group flex items-center gap-3">
      <Image
        src="/nomin-mark.png"
        alt="Nomin Workspace logo"
        width={1024}
        height={1024}
        priority
        className={`${markClass} shrink-0 object-contain transition-transform duration-200 group-hover:scale-105`}
      />
      {!compact && (
        <span className="leading-none">
          <span
            className={`block font-display font-bold tracking-[-0.02em] ${
              size === "lg" ? "text-3xl" : "text-[22px]"
            }`}
          >
            Nomin
          </span>
          <span
            className={`mt-1.5 block font-mono uppercase tracking-[0.22em] text-brand ${
              size === "lg" ? "text-xs" : "text-[11px]"
            }`}
          >
            Workspace
          </span>
        </span>
      )}
    </Link>
  );
}
