import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import UploadVideo from "./UploadVideo";

export const metadata = { title: "Upload videos" };
export const dynamic = "force-dynamic";

// Admin-only page to upload a video file and attach it to a course lesson.
// A user is an admin when their profiles.role = 'admin'.
export default async function AdminVideosPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/admin/videos");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") {
    return (
      <main className="section">
        <div className="container-page max-w-lg">
          <h1 className="font-display text-2xl font-semibold">Admins only</h1>
          <p className="mt-2 text-sm text-gray-600">
            This page is for instructors. To grant yourself access, run in Supabase SQL editor:
          </p>
          <pre className="mt-3 overflow-auto rounded-lg bg-brand-ink p-3 text-xs text-brand-50">
{`update public.profiles set role = 'admin' where id = '${user.id}';`}
          </pre>
        </div>
      </main>
    );
  }

  const { data: modules } = await supabase
    .from("course_modules")
    .select("id, title, course_id, courses(title)")
    .order("sort_order");

  return (
    <main className="section">
      <div className="container-page max-w-2xl">
        <h1 className="font-display text-2xl font-semibold">Upload a lesson video</h1>
        <p className="mt-2 text-sm text-gray-600">
          Pick a lesson, choose a video file, and upload. It's stored in Supabase Storage and played in the course.
        </p>
        <div className="mt-6">
          <UploadVideo modules={(modules ?? []) as any} />
        </div>
      </div>
    </main>
  );
}
