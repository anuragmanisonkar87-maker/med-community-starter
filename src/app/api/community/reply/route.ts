import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a reply on a forum topic for the signed-in member.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const topic_id = String(form.get("topic_id") || "");
  const slug = String(form.get("slug") || "");
  const body = String(form.get("body") || "").trim().slice(0, 5000);

  if (!topic_id || !body) {
    return NextResponse.redirect(new URL("/community", req.url));
  }

  await supabase.from("forum_replies").insert({
    topic_id,
    author_id: user.id,
    body,
  });

  return NextResponse.redirect(new URL(`/community/${slug}/${topic_id}`, req.url));
}
