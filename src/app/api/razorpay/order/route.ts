import { NextResponse } from "next/server";
import { getRazorpay } from "@/lib/razorpay";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Creates a Razorpay order for a course the member wants to buy.
// Price is read from the DB (never trusted from the client).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { courseId } = await req.json();
  if (!courseId) {
    return NextResponse.json({ error: "courseId required" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: course, error } = await admin
    .from("courses")
    .select("id, title, price_paise, is_published")
    .eq("id", courseId)
    .single();

  if (error || !course || !course.is_published) {
    return NextResponse.json({ error: "Course not found" }, { status: 404 });
  }
  if (course.price_paise <= 0) {
    return NextResponse.json({ error: "Course is free" }, { status: 400 });
  }

  // Create the Razorpay order.
  const order = await getRazorpay().orders.create({
    amount: course.price_paise, // amount in paise
    currency: "INR",
    receipt: `c_${course.id}_${user.id}`.slice(0, 40),
    notes: { course_id: String(course.id), user_id: user.id },
  });

  // Record a pending order so the webhook/verify step can reconcile it.
  await admin.from("orders").insert({
    user_id: user.id,
    course_id: course.id,
    razorpay_order_id: order.id,
    amount_paise: course.price_paise,
    status: "created",
  });

  return NextResponse.json({
    orderId: order.id,
    amount: order.amount,
    currency: order.currency,
    keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    courseTitle: course.title,
  });
}
