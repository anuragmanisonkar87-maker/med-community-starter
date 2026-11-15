import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import RegisterEventButton from "@/components/RegisterEventButton";

export const dynamic = "force-dynamic";

// Event detail + registration. Free events register directly; paid events
// go through Razorpay.
export default async function EventDetail({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: event } = await supabase
    .from("events")
    .select("id, title, summary, description, starts_at, location, speaker, price_paise")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!event) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let profile: { full_name: string | null; phone: string | null } | null = null;
  let registered = false;
  if (user) {
    const [{ data: p }, { data: r }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
      supabase.from("event_registrations").select("event_id").eq("user_id", user.id).eq("event_id", event.id).maybeSingle(),
    ]);
    profile = p as any;
    registered = !!r;
  }

  const priceLabel = event.price_paise === 0 ? "Free" : `₹${(event.price_paise / 100).toLocaleString("en-IN")}`;

  return (
    <main className="section">
      <div className="container-page grid max-w-4xl gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Link href="/events" className="text-sm text-brand-600 hover:underline">← All events</Link>
          <h1 className="mt-2 font-display text-3xl font-semibold">{event.title}</h1>
          <p className="mt-3 text-gray-600">{event.summary}</p>
          <dl className="mt-6 grid grid-cols-2 gap-4 text-sm">
            <Meta label="When" value={event.starts_at ? new Date(event.starts_at).toLocaleString("en-IN") : "TBA"} />
            <Meta label="Where" value={event.location ?? "—"} />
            <Meta label="Speaker" value={event.speaker ?? "—"} />
            <Meta label="Price" value={priceLabel} />
          </dl>
          <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">{event.description}</div>
        </div>

        <aside className="h-fit rounded-2xl border border-black/5 p-6">
          <p className="font-display text-2xl font-semibold text-brand-600">{priceLabel}</p>
          {!user ? (
            <Link href={`/login?next=/events/${params.slug}`} className="btn-primary mt-4 w-full">Sign in to register</Link>
          ) : registered ? (
            <p className="mt-4 rounded-lg bg-brand-50 px-3 py-2 text-center text-sm text-brand-700">✓ You're registered</p>
          ) : event.price_paise === 0 ? (
            <form action="/api/events/register" method="post" className="mt-4">
              <input type="hidden" name="eventId" value={event.id} />
              <button className="btn-primary w-full">Register free</button>
            </form>
          ) : (
            <div className="mt-4">
              <RegisterEventButton
                eventId={event.id}
                priceLabel={priceLabel}
                userName={profile?.full_name ?? undefined}
                userPhone={profile?.phone ?? undefined}
              />
            </div>
          )}
        </aside>
      </div>
    </main>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs uppercase tracking-wide text-gray-400">{label}</dt>
      <dd className="mt-0.5 text-brand-ink">{value}</dd>
    </div>
  );
}
