import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Marks a course module complete for the signed-in member.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const course_id = String(form.get("course_id") || "");
  const module_id = String(form.get("module_id") || "");
  if (module_id) {
    await supabase
      .from("course_progress")
      .upsert({ user_id: user.id, module_id }, { onConflict: "user_id,module_id" });
  }
  return NextResponse.redirect(new URL(`/courses/learn/${course_id}?m=${module_id}`, req.url));
}
