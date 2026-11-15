import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Course player: module list on the left, the selected lesson on the right,
// with completion tracking. Only enrolled members can view.
export default async function LearnPage({
  params, searchParams,
}: {
  params: { id: string }; searchParams: { m?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/login?next=/courses/learn/${params.id}`);

  const { data: enrolled } = await supabase
    .from("enrollments").select("course_id").eq("user_id", user!.id).eq("course_id", params.id).maybeSingle();
  if (!enrolled) redirect("/courses");

  const [{ data: course }, { data: modules }, { data: progress }] = await Promise.all([
    supabase.from("courses").select("title, description").eq("id", params.id).single(),
    supabase.from("course_modules").select("id, title, video_id, sort_order").eq("course_id", params.id).order("sort_order"),
    supabase.from("course_progress").select("module_id").eq("user_id", user!.id),
  ]);
  if (!course) notFound();

  const done = new Set((progress ?? []).map((p) => p.module_id));
  const list = modules ?? [];
  const current = list.find((m) => m.id === searchParams.m) ?? list[0] ?? null;
  const pct = list.length ? Math.round((done.size / list.length) * 100) : 0;

  return (
    <main className="section">
      <div className="container-page grid gap-8 lg:grid-cols-[280px_1fr]">
        {/* Module list */}
        <aside className="h-fit rounded-2xl border border-black/5 p-4">
          <h2 className="font-display text-lg font-semibold">{course.title}</h2>
          <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="h-full bg-brand-500" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-1 text-xs text-gray-500">{pct}% complete</p>
          <nav className="mt-4 space-y-1">
            {list.map((m, i) => (
              <Link
                key={m.id}
                href={`/courses/learn/${params.id}?m=${m.id}`}
                className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm ${current?.id === m.id ? "bg-brand-50 text-brand-ink" : "text-gray-700 hover:bg-brand-50/50"}`}
              >
                <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full text-xs ${done.has(m.id) ? "bg-brand-500 text-white" : "bg-gray-100 text-gray-500"}`}>
                  {done.has(m.id) ? "✓" : i + 1}
                </span>
                {m.title}
              </Link>
            ))}
            {list.length === 0 && <p className="px-3 text-sm text-gray-500">No modules yet.</p>}
          </nav>
        </aside>

        {/* Lesson */}
        <section>
          {current ? (
            <>
              <h1 className="font-display text-2xl font-semibold">{current.title}</h1>
              <div className="mt-4 overflow-hidden rounded-2xl border border-black/5">
                {current.video_id ? (
                  <div className="aspect-video w-full">
                    <iframe className="h-full w-full" src={`https://www.youtube.com/embed/${current.video_id}`} title={current.title} allowFullScreen />
                  </div>
                ) : (
                  <div className="grid aspect-video place-items-center bg-brand-50 text-brand-600">▶ Lesson video</div>
                )}
              </div>
              <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-700">{course.description}</div>

              {!done.has(current.id) && (
                <form action="/api/courses/complete" method="post" className="mt-6">
                  <input type="hidden" name="course_id" value={params.id} />
                  <input type="hidden" name="module_id" value={current.id} />
                  <button className="btn-primary">Mark as complete</button>
                </form>
              )}
              {done.has(current.id) && <p className="mt-6 text-sm text-brand-600">✓ Completed</p>}
            </>
          ) : (
            <p className="text-gray-500">This course has no lessons yet.</p>
          )}
        </section>
      </div>
    </main>
  );
}
