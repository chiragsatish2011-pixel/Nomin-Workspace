/**
 * Deterministic per-user color — the avatar background when no picture is
 * set. Hashed from the user's id or email into a curated palette, so it is
 * stable per user rather than random per render, and adjacent users rarely
 * collide visually in dense views like the checkpoints timeline.
 *
 * The palette is tuned around Nomin's purple identity: every entry carries
 * white text at an accessible contrast ratio.
 */

const PALETTE = [
  { bg: "bg-[#7132f5]", hex: "#7132f5" }, // nomin purple
  { bg: "bg-[#5b1ecf]", hex: "#5b1ecf" }, // purple deep
  { bg: "bg-[#101114]", hex: "#101114" }, // near black
  { bg: "bg-[#149e61]", hex: "#149e61" }, // green
  { bg: "bg-[#1d4ed8]", hex: "#1d4ed8" }, // blue
  { bg: "bg-[#0e7490]", hex: "#0e7490" }, // cyan
  { bg: "bg-[#c2410c]", hex: "#c2410c" }, // orange
  { bg: "bg-[#be123c]", hex: "#be123c" }, // rose
  { bg: "bg-[#6d28d9]", hex: "#6d28d9" }, // violet
  { bg: "bg-[#026b3f]", hex: "#026b3f" }, // green dark
  { bg: "bg-[#3730a3]", hex: "#3730a3" }, // indigo
  { bg: "bg-[#686b82]", hex: "#686b82" }, // cool gray
] as const;

function hashString(input: string): number {
  let h = 0;
  for (let i = 0; i < input.length; i++) {
    h = (h * 31 + input.charCodeAt(i)) >>> 0;
  }
  return h;
}

export function getUserColor(input: string) {
  if (!input) return PALETTE[0];
  return PALETTE[hashString(input.toLowerCase().trim()) % PALETTE.length];
}

/**
 * The name to show for a user. Falls back to a humanized email prefix when
 * no display name is set, or when the stored name is just the email again.
 */
export function getDisplayName(
  displayName?: string | null,
  email?: string | null
): string {
  const raw = displayName?.trim();
  const mail = email?.trim();
  if (!raw || (mail && raw.toLowerCase() === mail.toLowerCase())) {
    if (!mail) return raw || "Unknown";
    const prefix = mail.split("@")[0] || mail;
    return prefix
      .split(/[._-]+/)
      .filter(Boolean)
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1).toLowerCase())
      .join(" ");
  }
  return raw;
}

export function getUserInitials(
  displayName?: string | null,
  email?: string | null
): string {
  const name = getDisplayName(displayName, email);
  const source = name !== "Unknown" ? name : (email?.trim() || "?");
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return (source.trim()[0] ?? "?").toUpperCase();
}

export { PALETTE };
