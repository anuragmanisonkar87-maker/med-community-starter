import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Attaches an uploaded video URL to a course module. Admin only.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Admins only" }, { status: 403 });
  }

  const { moduleId, url } = await req.json();
  if (!moduleId || !url) return NextResponse.json({ error: "moduleId and url required" }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from("course_modules").update({ video_url: url }).eq("id", moduleId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
