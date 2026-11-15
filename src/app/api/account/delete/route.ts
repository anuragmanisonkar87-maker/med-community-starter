import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

// Permanently deletes the signed-in user's own account.
// Most data cascades via `on delete cascade` foreign keys to auth.users.
export async function POST(req: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/login", req.url));

  const admin = createAdminClient();
  // Deleting the auth user cascades to profiles, enrollments, posts, etc.
  await admin.auth.admin.deleteUser(user.id);

  // Sign the browser session out and return home.
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/", req.url));
}
