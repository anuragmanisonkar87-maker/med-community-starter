import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Creates a Razorpay order for a PAID event. Price read from the DB.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { eventId } = await req.json();
  if (!eventId) return NextResponse.json({ error: "eventId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: event } = await admin
    .from("events")
    .select("id, title, price_paise, is_published")
    .eq("id", eventId)
    .single();

  if (!event || !event.is_published) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }
  if (event.price_paise <= 0) {
    return NextResponse.json({ error: "Event is free" }, { status: 400 });
  }

  const order = await getRazorpay().orders.create({
    amount: event.price_paise,
    currency: "INR",
    receipt: `e_${event.id}_${user.id}`.slice(0, 40),
    notes: { event_id: String(event.id), user_id: user.id },
  });

  await admin.from("event_orders").insert({
    user_id: user.id,
    event_id: event.id,
    razorpay_order_id: order.id,
    amount_paise: event.price_paise,
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    eventTitle: event.title,
  });
}
