import type { Section } from "@/components/sections";

/**
 * The body of a section whose UI is routed and designed but whose data
 * layer isn't built yet. It states that plainly and lists what is planned,
 * rather than showing a fake empty state that implies the feature works.
 */
export function ComingSoon({ section }: { section: Section }) {
  return (
    <div className="py-10">
      <div className="max-w-2xl rounded-2xl border border-hairline-soft bg-fog p-6">
        <p className="text-micro" style={{ color: section.accent }}>
          Not built yet
        </p>
        <p className="mt-3 text-[15px] leading-relaxed text-slate">
          {section.blurb} The route, navigation and design are in place; the
          data layer is not. Nothing here reads or writes real data yet.
        </p>

        <p className="mt-6 text-micro text-stone">Planned</p>
        <ul className="mt-3 flex flex-col gap-2.5">
          {section.planned.map((item) => (
            <li key={item} className="flex gap-3 text-[14px] text-slate">
              <span
                aria-hidden="true"
                className="mt-[7px] h-1.5 w-1.5 shrink-0 rounded-full"
                style={{ backgroundColor: section.accent }}
              />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
