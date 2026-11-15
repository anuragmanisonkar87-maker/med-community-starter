import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a new forum topic for the signed-in member.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const category_id = String(form.get("category_id") || "");
  const slug = String(form.get("slug") || "");
  const title = String(form.get("title") || "").trim().slice(0, 200);
  const body = String(form.get("body") || "").trim().slice(0, 5000);

  if (!category_id || !title || !body) {
    return NextResponse.redirect(new URL(`/community/${slug}`, req.url));
  }

  await supabase.from("forum_topics").insert({
    category_id,
    author_id: user.id,
    title,
    body,
  });

  return NextResponse.redirect(new URL(`/community/${slug}`, req.url));
}
