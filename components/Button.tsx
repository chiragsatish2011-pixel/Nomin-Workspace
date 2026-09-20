import type { ButtonHTMLAttributes } from "react";

/**
 * The workspace button. Carried over from Nomin's original design system
 * (primary / secondary / outlined / subtle / white), restyled onto the
 * shared tokens so it follows the theme instead of hardcoded hex.
 */

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outlined"
  | "subtle"
  | "danger";

export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary:
    "bg-purple text-white hover:bg-purple-deep active:bg-purple-deep shadow-[var(--shadow-micro)]",
  secondary: "bg-ink text-canvas hover:bg-charcoal",
  outlined:
    "border border-hairline bg-canvas text-ink hover:border-purple hover:text-purple",
  subtle: "bg-transparent text-steel hover:bg-mist hover:text-ink",
  danger: "bg-error text-white hover:brightness-110",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-[13px]",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-[15px]",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Renders a spinner and blocks input without collapsing the layout. */
  loading?: boolean;
}

export function Button({
  variant = "primary",
  size = "md",
  loading = false,
  className = "",
  disabled,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      // `loading` implies disabled, so a caller can never leave a busy
      // button clickable and fire the same request twice.
      disabled={disabled || loading}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-55 ${VARIANTS[variant]} ${SIZES[size]} ${className}`}
      {...props}
    >
      {loading && (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent"
        />
      )}
      {children}
    </button>
  );
}
