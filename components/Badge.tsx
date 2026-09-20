/**
 * Small status pill. Carried over from Nomin's original design system and
 * retoned onto the shared tokens.
 */

export type BadgeTone = "neutral" | "success" | "brand" | "danger" | "live";

const TONES: Record<BadgeTone, string> = {
  neutral: "bg-mist text-steel",
  success: "bg-success-bg text-success-text",
  brand: "bg-purple-soft text-purple-deep",
  danger: "bg-error-bg text-error",
  live: "bg-success-bg text-success-text",
};

export function Badge({
  tone = "neutral",
  children,
  className = "",
}: {
  tone?: BadgeTone;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] ${TONES[tone]} ${className}`}
    >
      {children}
    </span>
  );
}
