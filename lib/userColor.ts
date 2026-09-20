/**
 * Deterministic user color — avatar background when no picture is set.
 * Hashed from user id/email into a curated 12-color palette so it's
 * stable per user, not random per render, and adjacent users rarely
 * collide visually even in dense views (checkpoints, chat, projects).
 */

const PALETTE = [
  { bg: "bg-[#7132f5]", text: "text-white", hex: "#7132f5" }, // kraken purple
  { bg: "bg-[#2f6bf0]", text: "text-white", hex: "#2f6bf0" }, // azure
  { bg: "bg-[#149e61]", text: "text-white", hex: "#149e61" }, // kraken green
  { bg: "bg-[#5741d8]", text: "text-white", hex: "#5741d8" }, // purple dark
  { bg: "bg-[#c44ec9]", text: "text-white", hex: "#c44ec9" }, // magenta
  { bg: "bg-[#e0523c]", text: "text-white", hex: "#e0523c" }, // coral
  { bg: "bg-[#026b3f]", text: "text-white", hex: "#026b3f" }, // green dark
  { bg: "bg-[#b53a27]", text: "text-white", hex: "#b53a27" }, // coral deep
  { bg: "bg-[#1f4fc4]", text: "text-white", hex: "#1f4fc4" }, // azure deep
  { bg: "bg-[#5b1ecf]", text: "text-white", hex: "#5b1ecf" }, // purple deep
  { bg: "bg-[#484b5e]", text: "text-white", hex: "#484b5e" }, // slate
  { bg: "bg-[#101114]", text: "text-white", hex: "#101114" }, // near black
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
  const idx = hashString(input.toLowerCase().trim()) % PALETTE.length;
  return PALETTE[idx];
}

export function getDisplayName(displayName?: string | null, email?: string | null): string {
  const raw = displayName && displayName.trim();
  const mail = email && email.trim();
  // If displayName is missing, empty, iso-like, or identical to email (user set email as name), derive from email
  if (!raw || /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(raw) || (mail && raw.toLowerCase() === mail.toLowerCase())) {
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

export function getUserInitials(displayName?: string | null, email?: string | null): string {
  // Use derived display name so "chirag@nomin.com" with no explicit name gives "C" not email first char still but consistent
  const effectiveName = getDisplayName(displayName, email);
  const source = effectiveName !== "Unknown" ? effectiveName : email?.trim() || "?";
  if (source.includes(" ")) {
    const parts = source.trim().split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase().slice(0, 2);
  }
  const base = source.trim();
  return (base[0] ?? "?").toUpperCase();
}

export { PALETTE };
