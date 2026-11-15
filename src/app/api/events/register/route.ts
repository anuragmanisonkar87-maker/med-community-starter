import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Registers a signed-in user for a FREE event (price_paise = 0).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const eventId = String(form.get("eventId") || "");
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, slug, price_paise, is_published")
    .eq("id", eventId)
    .single();

  if (!event || !event.is_published || event.price_paise !== 0) {
    return NextResponse.json({ error: "Not a free event" }, { status: 400 });
  }

  await admin
    .from("event_registrations")
    .upsert({ user_id: user.id, event_id: eventId, status: "registered" }, { onConflict: "user_id,event_id" });

  return NextResponse.redirect(new URL(`/events/${event.slug}`, req.url));
}
