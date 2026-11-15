import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const sections = [
  ["Dashboard", "/dashboard"],
  ["Profile", "/account/profile"],
  ["Friends", "/account/friends"],
  ["Notifications", "/account/notifications"],
  ["Groups", "/account/groups"],
  ["Messages", "/account/messages"],
  ["Courses", "/account/courses"],
  ["Media", "/account/media"],
  ["Settings", "/account/settings"],
];

// Shared layout for all member-account sections, with a side nav.
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/account/profile");

  return (
    <main className="section">
      <div className="container-page grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="h-fit rounded-2xl border border-black/5 p-2 text-sm">
          {sections.map(([label, href]) => (
            <Link key={href} href={href} className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-brand-50">
              {label}
            </Link>
          ))}
        </aside>
        <section>{children}</section>
      </div>
    </main>
  );
}
