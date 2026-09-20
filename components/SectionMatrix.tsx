import Link from "next/link";
import { Badge } from "@/components/Badge";
import { SECTIONS } from "@/components/sections";

/**
 * The dashboard grid — one card per section, each in its own identity
 * color. Card status is read from the registry rather than hardcoded here,
 * so a section that goes live stops advertising itself as a shell without
 * anyone remembering to edit this file.
 */
export function SectionMatrix() {
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {SECTIONS.map((section, i) => {
        const Icon = section.icon;
        return (
          <Link
            key={section.key}
            href={section.href}
            style={{ animationDelay: `${i * 70}ms` }}
            className="group flex animate-[fade-up_0.6s_cubic-bezier(0.22,1,0.36,1)_both] flex-col rounded-2xl border border-hairline-soft bg-canvas p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-hairline hover:shadow-[var(--shadow-lifted)]"
          >
            <div className="flex items-start justify-between gap-3">
              <span
                className="flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: section.accentSoft,
                  color: section.accent,
                }}
              >
                <Icon className="h-[22px] w-[22px]" />
              </span>
              <Badge tone={section.status === "live" ? "success" : "neutral"}>
                {section.status === "live" ? "Live" : "Shell"}
              </Badge>
            </div>

            <h2 className="mt-4 font-display text-[19px] font-bold tracking-[-0.02em]">
              {section.label}
            </h2>
            <p className="mt-1 text-[14px] text-steel">{section.tagline}</p>
            <p className="mt-3 text-[13px] leading-relaxed text-stone">
              {section.blurb}
            </p>

            <span
              className="mt-5 text-[13px] font-semibold transition-transform duration-200 group-hover:translate-x-0.5"
              style={{ color: section.accent }}
            >
              Open {section.label} →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
