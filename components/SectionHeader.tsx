import type { Section } from "@/components/sections";
import { Badge } from "@/components/Badge";

/**
 * The header every section page opens with. Takes the whole registry entry
 * rather than loose strings, so a section can never be titled one thing in
 * the nav and another on its own page.
 */
export function SectionHeader({
  section,
  children,
}: {
  section: Section;
  children?: React.ReactNode;
}) {
  const Icon = section.icon;
  return (
    <header className="flex flex-wrap items-start gap-4 border-b border-hairline-soft py-8">
      <span
        className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: section.accentSoft, color: section.accent }}
      >
        <Icon className="h-6 w-6" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-[26px] font-bold tracking-[-0.025em]">
            {section.label}
          </h1>
          <Badge tone={section.status === "live" ? "success" : "neutral"}>
            {section.status === "live" ? "Live" : "Shell"}
          </Badge>
        </div>
        <p className="mt-1 text-[15px] text-steel">{section.tagline}</p>
      </div>
      {children && <div className="flex items-center gap-2">{children}</div>}
    </header>
  );
}
