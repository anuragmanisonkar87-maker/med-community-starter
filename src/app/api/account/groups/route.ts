import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Join or leave a group (RLS lets a user manage only their own membership row).
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const form = await req.formData();
  const group_id = String(form.get("group_id") || "");
  const action = String(form.get("action") || "");
  if (!group_id) return NextResponse.redirect(new URL("/account/groups", req.url));

  if (action === "join") {
    await supabase.from("group_members").upsert({ group_id, user_id: user.id }, { onConflict: "group_id,user_id" });
  } else if (action === "leave") {
    await supabase.from("group_members").delete().eq("group_id", group_id).eq("user_id", user.id);
  }

  return NextResponse.redirect(new URL("/account/groups", req.url));
}
