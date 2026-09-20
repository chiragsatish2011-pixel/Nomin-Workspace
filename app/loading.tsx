/**
 * Route-level loading skeleton. Mirrors the shell's proportions — sidebar,
 * topbar, content — so the layout doesn't jump when the real page arrives.
 */
export default function Loading() {
  return (
    <div className="flex min-h-screen animate-[fade-in_0.3s_ease] bg-canvas">
      <div className="hidden h-screen w-[264px] shrink-0 border-r border-hairline-soft lg:block">
        <div className="flex flex-col gap-3 p-5">
          <span className="h-8 w-28 rounded-lg bg-mist" />
          {[...Array(6)].map((_, i) => (
            <span key={i} className="h-10 rounded-xl bg-fog" />
          ))}
        </div>
      </div>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="h-[57px] border-b border-hairline-soft" />
        <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
          <span className="block h-4 w-24 rounded bg-mist" />
          <span className="mt-4 block h-10 w-3/5 rounded-lg bg-mist" />
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {[...Array(4)].map((_, i) => (
              <span key={i} className="h-44 rounded-2xl bg-fog" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
