import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Creates a community post for the signed-in member, then returns to the dashboard.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const body = String(form.get("body") || "").trim().slice(0, 2000);
  if (body) {
    await supabase.from("posts").insert({ author_id: user.id, body });
  }
  return NextResponse.redirect(new URL("/dashboard", req.url));
}
