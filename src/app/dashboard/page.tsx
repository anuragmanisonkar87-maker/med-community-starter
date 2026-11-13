import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Home" };
export const dynamic = "force-dynamic";

// Logged-in member home. Protected by middleware (/dashboard is in protectedPaths).
// Standard community-dashboard layout: profile sidebar, activity feed, side rail.
// Original design — not a copy of any other site's member page.
export default async function Dashboard() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard");

  const [{ data: profile }, { data: enrollments }, { data: posts }] = await Promise.all([
    supabase.from("profiles").select("full_name, drn, state").eq("id", user.id).single(),
    supabase
      .from("enrollments")
      .select("course_id, courses(title, slug)")
      .eq("user_id", user.id)
      .limit(4),
    supabase.from("posts").select("id, body, created_at").order("created_at", { ascending: false }).limit(8),
  ]);

  const firstName = (profile?.full_name ?? "there").split(" ")[0];

  return (
    <main className="section">
      <div className="container-page grid gap-8 lg:grid-cols-[260px_1fr_300px]">
        {/* Left: profile + quick links */}
        <aside className="h-fit space-y-6">
          <div className="rounded-2xl border border-black/5 p-5 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-brand-50 text-brand-600 grid place-items-center text-xl font-semibold">
              {firstName.charAt(0).toUpperCase()}
            </div>
            <p className="mt-3 font-semibold">{profile?.full_name ?? "Member"}</p>
            <p className="text-xs text-gray-500">{profile?.state ?? ""}</p>
            {profile?.drn && (
              <span className="mt-2 inline-block rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-600">
                ✓ Verified doctor
              </span>
            )}
          </div>
          <nav className="rounded-2xl border border-black/5 p-2 text-sm">
            {[
              ["Home", "/dashboard"],
              ["Community", "/community"],
              ["My courses", "/dashboard#courses"],
              ["Webinars", "/webinars"],
              ["Account", "/account"],
            ].map(([label, href]) => (
              <Link key={label} href={href} className="block rounded-lg px-3 py-2 text-gray-700 hover:bg-brand-50">
                {label}
              </Link>
            ))}
          </nav>
        </aside>

        {/* Center: welcome + activity feed */}
        <section className="space-y-6">
          <div className="rounded-2xl bg-brand-ink p-6 text-white">
            <h1 className="font-display text-2xl font-semibold">Welcome back, {firstName}</h1>
            <p className="mt-1 text-sm text-gray-300">Here's what's happening in your community.</p>
          </div>

          <div className="rounded-2xl border border-black/5 p-5">
            <form action="/api/community/post" method="post" className="flex gap-3">
              <input
                name="body"
                placeholder="Share something or ask a question…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
              <button className="btn-primary text-sm">Post</button>
            </form>
          </div>

          <div className="space-y-4">
            {(posts ?? []).map((p) => (
              <article key={p.id} className="rounded-2xl border border-black/5 p-5">
                <p className="whitespace-pre-line text-sm text-gray-800">{p.body}</p>
                <p className="mt-2 text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
              </article>
            ))}
            {(!posts || posts.length === 0) && (
              <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
                No activity yet — be the first to post.
              </p>
            )}
          </div>
        </section>

        {/* Right: continue learning + upcoming + CTA */}
        <aside className="h-fit space-y-6">
          <div id="courses" className="rounded-2xl border border-black/5 p-5">
            <h3 className="text-sm font-semibold">Continue learning</h3>
            <div className="mt-3 space-y-2">
              {(enrollments ?? []).map((e: any) => (
                <Link
                  key={e.course_id}
                  href={`/courses/learn/${e.course_id}`}
                  className="block rounded-lg bg-brand-50/60 px-3 py-2 text-sm text-brand-ink hover:bg-brand-50"
                >
                  {e.courses?.title ?? "Course"}
                </Link>
              ))}
              {(!enrollments || enrollments.length === 0) && (
                <Link href="/courses" className="text-sm text-brand-600 hover:underline">
                  Browse courses →
                </Link>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 p-5">
            <h3 className="text-sm font-semibold">Upcoming webinar</h3>
            <p className="mt-2 text-sm text-gray-700">Tax planning for doctors</p>
            <p className="text-xs text-gray-500">Register from the Webinars page.</p>
            <Link href="/webinars" className="btn-primary mt-3 w-full text-sm">View webinars</Link>
          </div>

          <div className="rounded-2xl bg-brand-50 p-5">
            <h3 className="text-sm font-semibold">Need 1:1 help?</h3>
            <p className="mt-1 text-sm text-gray-600">Book a free consultation with an adviser.</p>
            <Link href="/#book" className="btn-ghost mt-3 w-full text-sm">Book a slot</Link>
          </div>
        </aside>
      </div>
    </main>
  );
}
