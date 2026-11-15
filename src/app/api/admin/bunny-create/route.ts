import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { bunnyConfigured, createBunnyVideo, bunnyUploadAuth } from "@/lib/bunny";

// Admin-only. Creates a Bunny Stream video object and returns the presigned
// details the browser needs to upload the file directly to Bunny (TUS).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admins only" }, { status: 403 });

  if (!bunnyConfigured()) {
    return NextResponse.json({ error: "Bunny Stream isn't configured. Add BUNNY_STREAM_* env vars." }, { status: 400 });
  }

  const { title } = await req.json();
  const videoId = await createBunnyVideo(String(title || "Lesson video").slice(0, 120));
  const auth = bunnyUploadAuth(videoId);
  return NextResponse.json(auth);
}
