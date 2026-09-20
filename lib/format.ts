/**
 * Display formatting shared by server and client components — no imports,
 * no side effects, safe on both sides of the boundary.
 */

/** "2 minutes ago", "3 days ago", or an absolute date past a week. */
export function formatRelativeTime(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";

  const seconds = Math.round((Date.now() - date.getTime()) / 1000);
  if (seconds < 45) return "just now";

  const units: [Intl.RelativeTimeFormatUnit, number][] = [
    ["minute", 60],
    ["hour", 3600],
    ["day", 86400],
  ];
  // Past a week, a relative label stops being useful — show the date.
  if (seconds >= 7 * 86400) return formatDate(date);

  let unit: Intl.RelativeTimeFormatUnit = "minute";
  let divisor = 60;
  for (const [u, d] of units) {
    if (seconds >= d) {
      unit = u;
      divisor = d;
    }
  }
  const rtf = new Intl.RelativeTimeFormat("en", { numeric: "auto" });
  return rtf.format(-Math.round(seconds / divisor), unit);
}

/** "20 Sep 2026" — unambiguous across locales, unlike a numeric date. */
export function formatDate(input: Date | string | number): string {
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

/** "1.4 MB". Takes the byte count as a string, matching the files schema. */
export function formatBytes(input: string | number | null | undefined): string {
  const bytes = typeof input === "string" ? Number(input) : (input ?? 0);
  if (!Number.isFinite(bytes) || bytes <= 0) return "—";
  const units = ["B", "KB", "MB", "GB", "TB"];
  const i = Math.min(
    Math.floor(Math.log(bytes) / Math.log(1024)),
    units.length - 1
  );
  const value = bytes / 1024 ** i;
  return `${value.toFixed(i === 0 ? 0 : value < 10 ? 1 : 0)} ${units[i]}`;
}
