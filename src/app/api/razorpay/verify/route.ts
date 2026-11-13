import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Verifies the payment signature returned to the browser after Razorpay checkout.
// Signature = HMAC_SHA256(order_id + "|" + payment_id, key_secret).
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

  // Constant-time comparison to avoid timing attacks.
  const valid =
    expected.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(razorpay_signature));

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, user_id, course_id, status")
    .eq("razorpay_order_id", razorpay_order_id)
    .single();

  if (!order || order.user_id !== user.id) {
    return NextResponse.json({ error: "Order mismatch" }, { status: 400 });
  }

  // Mark paid and grant access (idempotent).
  await admin
    .from("orders")
    .update({ status: "paid", razorpay_payment_id })
    .eq("id", order.id);

  await admin
    .from("enrollments")
    .upsert(
      { user_id: order.user_id, course_id: order.course_id, source: "purchase" },
      { onConflict: "user_id,course_id" }
    );

  return NextResponse.json({ ok: true });
}
