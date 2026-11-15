import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "My courses" };
export const dynamic = "force-dynamic";

// Courses the member is enrolled in.
export default async function MyCoursesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, source, courses(title, slug, summary)")
    .eq("user_id", user!.id);

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">My courses</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {(enrollments ?? []).map((e: any) => (
          <Link key={e.course_id} href={`/courses/learn/${e.course_id}`} className="rounded-2xl border border-black/5 p-5 hover:shadow-md">
            <h2 className="font-semibold">{e.courses?.title ?? "Course"}</h2>
            <p className="mt-1 text-sm text-gray-600">{e.courses?.summary}</p>
            <span className="mt-3 inline-block rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-600">
              {e.source === "purchase" ? "Purchased" : e.source === "free" ? "Free" : "Enrolled"}
            </span>
          </Link>
        ))}
        {(!enrollments || enrollments.length === 0) && (
          <p className="text-sm text-gray-500">
            You're not enrolled in any courses yet. <Link href="/courses" className="text-brand-600 hover:underline">Browse courses →</Link>
          </p>
        )}
      </div>
    </div>
  );
}
