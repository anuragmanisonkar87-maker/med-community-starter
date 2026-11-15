import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Marks all of the signed-in user's notifications as read.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", user.id)
    .is("read_at", null);

  return NextResponse.redirect(new URL("/account/notifications", req.url));
}
