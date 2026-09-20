import type { InputHTMLAttributes } from "react";
import { Button } from "@/components/Button";

/**
 * The two-panel frame behind /signin and /setup: a brand panel on the left
 * (hidden on small screens, where it would just push the form below the
 * fold) and the form on the right.
 */
export function AuthLayout({
  eyebrow,
  title,
  subtitle,
  footer,
  children,
}: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  footer?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <aside className="relative hidden flex-col justify-between overflow-hidden bg-purple-deep p-12 text-white lg:flex">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-purple opacity-60 blur-3xl"
        />
        <span className="relative flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 font-display text-base font-bold">
            N
          </span>
          <span className="font-display text-lg font-bold tracking-[-0.02em]">
            Nomin
          </span>
        </span>
        <div className="relative max-w-md">
          <p className="font-display text-[34px] font-bold leading-[1.15] tracking-[-0.025em]">
            One workspace for the whole team.
          </p>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Checkpoints, files, projects and chat — together, and private to
            your team.
          </p>
        </div>
        <p className="relative text-micro text-white/45">
          Private workspace · no public sign-up
        </p>
      </aside>

      <main className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-[400px] animate-[fade-up_0.6s_cubic-bezier(0.22,1,0.36,1)_both]">
          <p className="text-micro text-purple">{eyebrow}</p>
          <h1 className="mt-3 font-display text-[30px] font-bold tracking-[-0.025em]">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-2 text-[15px] leading-relaxed text-steel">
              {subtitle}
            </p>
          )}
          <div className="mt-8">{children}</div>
          {footer && <div className="mt-8">{footer}</div>}
        </div>
      </main>
    </div>
  );
}

export function AuthField({
  label,
  hint,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[13px] font-medium text-slate">{label}</span>
      <input
        {...props}
        className="h-11 rounded-xl border border-hairline bg-canvas px-3.5 text-[15px] text-ink transition-colors placeholder:text-muted hover:border-stone focus:border-purple focus:outline-none disabled:opacity-60"
      />
      {hint && <span className="text-[12px] text-stone">{hint}</span>}
    </label>
  );
}

export function AuthError({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="rounded-xl bg-error-bg px-3.5 py-2.5 text-[13px] text-error"
    >
      {message}
    </p>
  );
}

export function AuthSubmit({
  loading,
  disabled,
  children,
}: {
  loading?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Button
      type="submit"
      size="lg"
      loading={loading}
      disabled={disabled}
      className="w-full"
    >
      {children}
    </Button>
  );
}
