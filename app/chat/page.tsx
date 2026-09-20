import { AppShell } from "@/components/AppShell";
import { ComingSoon } from "@/components/ComingSoon";
import { SectionHeader } from "@/components/SectionHeader";
import { sectionByKey } from "@/components/sections";
import { requireActiveSession } from "@/lib/session";

const section = sectionByKey("chat");

export const metadata = {
  title: `${section.label} · Nomin Workspace`,
  description: section.blurb,
};

export default async function ChatPage() {
  const user = await requireActiveSession();
  return (
    <AppShell user={user} active="chat">
      <SectionHeader section={section} />
      <ComingSoon section={section} />
    </AppShell>
  );
}
