import { getDisplayName, getUserColor, getUserInitials } from "@/lib/userColor";

/**
 * Initials avatar in the user's deterministic color. No image source yet —
 * when avatars land, this is the single component to extend, and every
 * call site picks the change up.
 */
export function UserAvatar({
  displayName,
  email,
  userId,
  size = 36,
}: {
  displayName?: string | null;
  email: string;
  userId?: string;
  size?: number;
}) {
  // Key the color on the stable id where we have one, so renaming a user or
  // changing their email never reshuffles their avatar color.
  const color = getUserColor(userId || email);
  const initials = getUserInitials(displayName, email);
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-semibold text-white ${color.bg}`}
      style={{ width: size, height: size, fontSize: Math.round(size * 0.38) }}
      title={getDisplayName(displayName, email)}
    >
      {initials}
    </span>
  );
}
