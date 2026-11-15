import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Admin-only. Attaches a Bunny Stream video GUID to a course lesson.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  const { moduleId, bunnyVideoId } = await req.json();
  if (!moduleId || !bunnyVideoId) return NextResponse.json({ error: "moduleId and bunnyVideoId required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("course_modules").update({ bunny_video_id: bunnyVideoId }).eq("id", moduleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
