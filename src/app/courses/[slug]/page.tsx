import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import BuyCourseButton from "@/components/BuyCourseButton";
import Link from "next/link";

// Course detail + purchase. Free courses enroll directly; paid ones go through Razorpay.
export default async function CourseDetail({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, summary, description, price_paise, slug, is_published")
    .eq("slug", params.slug)
    .single();

  if (!course || !course.is_published) notFound();

  const { data: { user } } = await supabase.auth.getUser();
  let profile: { full_name: string | null; phone: string | null } | null = null;
  let enrolled = false;

  if (user) {
    const [{ data: p }, { data: e }] = await Promise.all([
      supabase.from("profiles").select("full_name, phone").eq("id", user.id).single(),
      supabase.from("enrollments").select("course_id").eq("user_id", user.id).eq("course_id", course.id).maybeSingle(),
    ]);
    profile = p as any;
    enrolled = !!e;
  }

  const priceLabel = course.price_paise === 0 ? "Free" : `₹${(course.price_paise / 100).toLocaleString("en-IN")}`;

  return (
    <main className="section">
      <div className="container-page grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <h1 className="font-display text-3xl font-semibold">{course.title}</h1>
          <p className="mt-3 text-gray-600">{course.summary}</p>
          <div className="prose mt-6 max-w-none text-gray-700 whitespace-pre-line">{course.description}</div>
        </div>

        <aside className="h-fit rounded-2xl border border-black/5 p-6">
          <p className="font-display text-2xl font-semibold text-brand-600">{priceLabel}</p>

          {!user ? (
            <Link href={`/login?next=/courses/${course.slug}`} className="btn-primary mt-4 w-full">
              Sign in to enroll
            </Link>
          ) : enrolled ? (
            <Link href={`/courses/learn/${course.id}`} className="btn-primary mt-4 w-full">
              Go to course
            </Link>
          ) : course.price_paise === 0 ? (
            <form action={`/api/courses/enroll-free`} method="post" className="mt-4">
              <input type="hidden" name="courseId" value={course.id} />
              <button className="btn-primary w-full">Enroll free</button>
            </form>
          ) : (
            <div className="mt-4">
              <BuyCourseButton
                courseId={course.id}
                priceLabel={priceLabel}
                userName={profile?.full_name ?? undefined}
                userPhone={profile?.phone ?? undefined}
              />
            </div>
          )}

          <ul className="mt-6 space-y-2 text-sm text-gray-600">
            <li>• Lifetime access</li>
            <li>• Watch on any device</li>
            <li>• Certificate on completion</li>
          </ul>
        </aside>
      </div>
    </main>
  );
}
