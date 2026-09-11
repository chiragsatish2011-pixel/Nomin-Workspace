import Image from "next/image";
import Link from "next/link";

/** Nomin brand lockup: chameleon mark + Space Grotesk wordmark.
 *  Uses /nomin-mark.svg (transparent). To use the exact PNG you were
 *  given, save it as /public/logo.png (see NOMIN-ASSETS.md).
 */
export function Wordmark({
  compact = false,
  size = "md",
}: {
  compact?: boolean;
  /** "md" (header/nav) or "lg" (hero moments like sign-in). */
  size?: "md" | "lg";
}) {
  // nomin-mark.svg is 240x220; rendered height is set by class with w-auto.
  // No rounded corners, ring, background or shadow: the SVG floats cleanly
  // with a whisper of Kraken-purple glow.
  const dims = size === "lg" ? { w: 240, h: 220 } : { w: 128, h: 117 };
  return (
    <Link href="/" className="group flex items-center gap-3.5">
      <span className="relative grid shrink-0 place-items-center">
        <span
          aria-hidden
          className="absolute inset-0 scale-110 rounded-full bg-[radial-gradient(circle,rgba(113,50,245,0.18),transparent_70%)] blur-md"
        />
        <Image
          src="/nomin-mark.svg"
          alt="Nomin Workspace logo"
          width={dims.w}
          height={dims.h}
          priority
          className={
            compact
              ? "relative h-10 w-auto shrink-0 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
              : size === "lg"
                ? "relative h-24 w-auto shrink-0 transition-transform duration-200 group-hover:-rotate-2 group-hover:scale-105"
                : "relative h-14 w-auto shrink-0 transition-transform duration-200 group-hover:-rotate-3 group-hover:scale-105"
          }
        />
      </span>
      {!compact && (
        <span className="leading-none">
          <span
            className={`block bg-gradient-to-r from-[#5b1ecf] via-[#0e9f8a] to-[#1456f0] bg-clip-text font-display font-bold tracking-tight text-transparent ${
              size === "lg" ? "text-3xl" : "text-[22px]"
            }`}
          >
            Nomin
          </span>
          <span
            className={`mt-1.5 flex items-center gap-1.5 font-mono uppercase tracking-[0.22em] text-stone ${
              size === "lg" ? "text-xs" : "text-[11px]"
            }`}
          >
            <span className="h-1 w-1 animate-pulse-dot rounded-full bg-teal" />
            Workspace
          </span>
        </span>
      )}
    </Link>
  );
}
