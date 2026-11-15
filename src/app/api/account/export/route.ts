import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Exports the signed-in user's own data as a downloadable JSON file.
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [profile, enrollments, topics, replies, posts, registrations, quiz] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", user.id).single(),
    supabase.from("enrollments").select("*").eq("user_id", user.id),
    supabase.from("forum_topics").select("*").eq("author_id", user.id),
    supabase.from("forum_replies").select("*").eq("author_id", user.id),
    supabase.from("posts").select("*").eq("author_id", user.id),
    supabase.from("event_registrations").select("*").eq("user_id", user.id),
    supabase.from("quiz_results").select("*").eq("user_id", user.id),
  ]);

  const payload = {
    exported_at: new Date().toISOString(),
    account: { id: user.id, phone: user.phone, created_at: user.created_at },
    profile: profile.data,
    enrollments: enrollments.data,
    forum_topics: topics.data,
    forum_replies: replies.data,
    posts: posts.data,
    event_registrations: registrations.data,
    quiz_results: quiz.data,
  };

  return new NextResponse(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="my-data.json"`,
    },
  });
}
