import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

// Only enrolled members can view course content.
export default async function LearnPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/courses/learn/${params.id}`);

  const { data: enrolled } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", user!.id)
    .eq("course_id", params.id)
    .maybeSingle();

  if (!enrolled) redirect("/courses");

  const { data: course } = await supabase
    .from("courses").select("title, description").eq("id", params.id).single();
  if (!course) notFound();

  return (
    <main className="section">
      <div className="container-page max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">{course.title}</h1>
        <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">{course.description}</div>
        <p className="mt-8 rounded-xl bg-brand-50 p-4 text-sm text-gray-600">
          Add your lessons, videos (Bunny Stream / Mux signed URLs) and progress tracking here.
        </p>
      </div>
    </main>
  );
}
