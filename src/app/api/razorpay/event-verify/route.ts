import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Verifies the event payment signature, then marks the registration paid.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = await req.json();
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest("hex");

  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!valid) return NextResponse.json({ error: "Invalid signature" }, { status: 400 });

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("event_orders")
    .select("id, user_id, event_id")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  await admin.from("event_orders").update({ status: "paid", razorpay_payment_id }).eq("id", order.id);
  await admin
    .from("event_registrations")
    .upsert({ user_id: order.user_id, event_id: order.event_id, status: "paid" }, { onConflict: "user_id,event_id" });

  return NextResponse.json({ ok: true });
}
