import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Enrolls a signed-in user into a FREE course (price_paise = 0).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const courseId = String(form.get("courseId") || "");
  if (!courseId) return NextResponse.json({ error: "courseId required" }, { status: 400 });

  const admin = createAdminClient();
  const { data: course } = await admin
    .from("courses")
    .select("id, price_paise, is_published")
    .eq("id", courseId)
    .single();

  if (!course || !course.is_published || course.price_paise !== 0) {
    return NextResponse.json({ error: "Not a free course" }, { status: 400 });
  }

  await admin
    .from("enrollments")
    .upsert({ user_id: user.id, course_id: courseId, source: "free" }, { onConflict: "user_id,course_id" });

  return NextResponse.redirect(new URL(`/courses/learn/${courseId}`, req.url));
}
