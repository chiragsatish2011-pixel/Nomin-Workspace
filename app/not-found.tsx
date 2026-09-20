import Link from "next/link";
import { Button } from "@/components/Button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center">
      <p className="text-micro text-purple">404</p>
      <h1 className="font-display text-[26px] font-bold tracking-[-0.025em]">
        That page doesn&apos;t exist.
      </h1>
      <p className="max-w-sm text-[15px] leading-relaxed text-steel">
        The link may be out of date, or the section may not be built yet.
      </p>
      <Link href="/">
        <Button>Back to dashboard</Button>
      </Link>
    </main>
  );
}
