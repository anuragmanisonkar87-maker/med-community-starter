import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Events" };
export const dynamic = "force-dynamic";

// Events listing — upcoming events from the `events` table.
export default async function EventsPage() {
  const supabase = createClient();
  const { data: events } = await supabase
    .from("events")
    .select("slug, title, summary, starts_at, location, price_paise")
    .eq("is_published", true)
    .order("starts_at", { ascending: true });

  return (
    <main className="section">
      <div className="container-page max-w-4xl">
        <h1 className="font-display text-3xl font-semibold">Events</h1>
        <p className="mt-2 text-gray-600">Webinars and masterclasses for doctors.</p>

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(events ?? []).map((e) => (
            <Link key={e.slug} href={`/events/${e.slug}`} className="rounded-2xl border border-black/5 p-6 transition hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-brand-600">
                  {e.starts_at ? new Date(e.starts_at).toLocaleDateString("en-IN", { day: "numeric", month: "short" }) : "TBA"}
                </span>
                <span className="text-xs font-semibold text-brand-ink">
                  {e.price_paise === 0 ? "Free" : `₹${(e.price_paise / 100).toLocaleString("en-IN")}`}
                </span>
              </div>
              <h2 className="mt-2 font-semibold text-brand-ink">{e.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{e.summary}</p>
              <p className="mt-3 text-xs text-gray-400">{e.location}</p>
            </Link>
          ))}
          {(!events || events.length === 0) && <p className="text-sm text-gray-500">No upcoming events.</p>}
        </div>
      </div>
    </main>
  );
}
