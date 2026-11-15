import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import DeleteAccount from "./DeleteAccount";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

// Account settings hub: notifications, privacy, block list, data export,
// delete account.
export default async function SettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="max-w-2xl">
      <h1 className="font-display text-2xl font-semibold">Settings</h1>

      <Section title="Notification preferences">
        <Toggle label="Email me about replies to my topics" defaultOn />
        <Toggle label="Notify me about new webinars" defaultOn />
        <Toggle label="Weekly newsletter" />
      </Section>

      <Section title="Privacy & security">
        <p className="text-sm text-gray-600">You sign in with mobile OTP — there's no password to manage. Your profile is visible to other verified members.</p>
        <Link href="/account/profile" className="mt-2 inline-block text-sm text-brand-600 hover:underline">Edit what others see →</Link>
      </Section>

      <Section title="Block list">
        <p className="text-sm text-gray-500">You haven't blocked anyone.</p>
      </Section>

      <Section title="Your data">
        <p className="text-sm text-gray-600">Download a copy of your account data.</p>
        <a href="/api/account/export" className="btn-ghost mt-2 inline-flex text-sm">Export my data (JSON)</a>
      </Section>

      <Section title="Delete account">
        <p className="text-sm text-gray-600">Permanently delete your account and all your data. This cannot be undone.</p>
        <div className="mt-3"><DeleteAccount /></div>
      </Section>

      <p className="mt-8 text-xs text-gray-400">Signed in as {user?.phone ?? user?.id}</p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mt-6 rounded-2xl border border-black/5 p-5">
      <h2 className="text-sm font-semibold text-gray-800">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </div>
  );
}

function Toggle({ label, defaultOn }: { label: string; defaultOn?: boolean }) {
  return (
    <label className="flex items-center justify-between text-sm text-gray-700">
      <span>{label}</span>
      <input type="checkbox" defaultChecked={defaultOn} className="h-4 w-8 accent-brand-500" />
    </label>
  );
}
