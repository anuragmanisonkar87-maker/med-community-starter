import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Courses" };

// Lists published courses from Supabase. Prices are stored in paise.
export default async function CoursesPage() {
  const supabase = createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, summary, price_paise, slug")
    .eq("is_published", true)
    .order("price_paise", { ascending: true });

  return (
    <main className="section">
      <div className="container-page">
        <h1 className="font-display text-3xl font-semibold">Courses</h1>
        <p className="mt-2 text-gray-600">Short, practical courses for doctors.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {(courses ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/courses/${c.slug}`}
              className="rounded-2xl border border-black/5 p-6 transition hover:shadow-md"
            >
              <h3 className="font-semibold">{c.title}</h3>
              <p className="mt-2 line-clamp-3 text-sm text-gray-600">{c.summary}</p>
              <p className="mt-4 font-display text-lg font-semibold text-brand-600">
                {c.price_paise === 0 ? "Free" : `₹${(c.price_paise / 100).toLocaleString("en-IN")}`}
              </p>
            </Link>
          ))}
          {(!courses || courses.length === 0) && (
            <p className="text-gray-500">No courses yet. Add rows to the `courses` table in Supabase.</p>
          )}
        </div>
      </div>
    </main>
  );
}
