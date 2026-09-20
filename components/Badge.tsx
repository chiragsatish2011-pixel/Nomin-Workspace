const tones: Record<string, string> = {
  new: "badge-brand",
  beta: "badge-neutral",
  live: "badge-success",
  phase: "bg-ink text-white rounded-md",
  mono: "badge-neutral",
};

/**
 * Kraken badge system — 6px radius on success, 8px on neutral/brand, never a
 * pill. NEW = brand purple · BETA/mono = neutral · LIVE = Kraken green.
 */
export function Badge({
  tone = "mono",
  children,
  className = "",
}: {
  tone?: keyof typeof tones | string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 font-mono text-[12px] font-medium uppercase tracking-[0.06em] ${
        tones[tone] ?? tones.mono
      }${className ? ` ${className}` : ""}`}
    >
      {children}
    </span>
  );
}

/** Pulsing live dot for status rows. */
export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={`relative flex h-2 w-2${className ? ` ${className}` : ""}`}>
      <span className="absolute inline-flex h-full w-full animate-pulse-dot rounded-full bg-teal" />
      <span className="relative inline-flex h-2 w-2 rounded-full bg-teal" />
    </span>
  );
}
