import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Sends a private message from the signed-in user.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const recipient_id = String(form.get("recipient_id") || "").trim();
  const body = String(form.get("body") || "").trim().slice(0, 4000);
  if (recipient_id && body) {
    await supabase.from("private_messages").insert({ sender_id: user.id, recipient_id, body });
  }
  return NextResponse.redirect(new URL("/account/messages", req.url));
}
