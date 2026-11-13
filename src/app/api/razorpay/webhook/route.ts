import { NextResponse } from "next/server";
import crypto from "crypto";
import { createAdminClient } from "@/lib/supabase/server";

// Server-to-server webhook from Razorpay (payment.captured, etc.).
// This is the source of truth even if the browser never returns to /verify.
// Configure the URL + secret in Razorpay Dashboard -> Webhooks.
export async function POST(req: Request) {
  const body = await req.text(); // raw body required for signature check
  const signature = req.headers.get("x-razorpay-signature") ?? "";

  const expected = crypto
    .createHmac("sha256", process.env.RAZORPAY_WEBHOOK_SECRET!)
    .update(body)
    .digest("hex");

  const valid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));

  if (!valid) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  const event = JSON.parse(body);
  const admin = createAdminClient();

  if (event.event === "payment.captured") {
    const payment = event.payload.payment.entity;
    const orderId = payment.order_id;

    const { data: order } = await admin
      .from("orders")
      .select("id, user_id, course_id, status")
      .eq("razorpay_order_id", orderId)
      .single();

    if (order && order.status !== "paid") {
      await admin
        .from("orders")
        .update({ status: "paid", razorpay_payment_id: payment.id })
        .eq("id", order.id);
      await admin
        .from("enrollments")
        .upsert(
          { user_id: order.user_id, course_id: order.course_id, source: "purchase" },
          { onConflict: "user_id,course_id" }
        );
    }
  }

  return NextResponse.json({ received: true });
}
