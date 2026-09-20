import { AppShell } from "@/components/AppShell";
import { SettingsForm } from "@/components/SettingsForm";
import { requireActiveSession } from "@/lib/session";

export const metadata = {
  title: "Settings · Nomin Workspace",
  description: "Your account details and profile.",
};

export const dynamic = "force-dynamic";

/**
 * Settings — an editable profile plus a read-only account summary.
 *
 * Password changes are deliberately absent: only admins set credentials, so
 * offering a password field here would promise something the API refuses.
 */
export default async function SettingsPage() {
  const user = await requireActiveSession();

  return (
    <AppShell user={user} active="settings">
      <header className="border-b border-hairline-soft py-8">
        <p className="text-micro text-purple">Settings</p>
        <h1 className="mt-3 font-display text-[26px] font-bold tracking-[-0.025em]">
          Your account
        </h1>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section>
          <h2 className="text-micro text-stone">Profile</h2>
          <div className="mt-4">
            <SettingsForm
              initial={{
                displayName: user.displayName,
                department: user.department,
                jobTitle: user.jobTitle,
              }}
            />
          </div>
        </section>

        <aside>
          <h2 className="text-micro text-stone">Account</h2>
          <dl className="mt-4 flex flex-col gap-4 rounded-2xl border border-hairline-soft bg-fog p-5">
            <div>
              <dt className="text-[12px] text-stone">Email</dt>
              <dd className="mt-0.5 break-all font-mono text-[13px]">
                {user.email}
              </dd>
            </div>
            <div>
              <dt className="text-[12px] text-stone">Role</dt>
              <dd className="mt-0.5 text-[13px] capitalize">{user.role}</dd>
            </div>
          </dl>
          <p className="mt-4 text-[13px] leading-relaxed text-stone">
            Your email, role and password are managed by a workspace admin.
            Ask one of them to change your password.
          </p>
        </aside>
      </div>
    </AppShell>
  );
}
