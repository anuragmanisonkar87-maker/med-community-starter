import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// A forum category: lists its topics and lets a member start a new one.
export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const supabase = createClient();

  const { data: category } = await supabase
    .from("forum_categories")
    .select("id, name, description")
    .eq("slug", params.slug)
    .single();

  if (!category) notFound();

  const { data: topics } = await supabase
    .from("forum_topics")
    .select("id, title, reply_count, last_activity_at")
    .eq("category_id", category.id)
    .order("last_activity_at", { ascending: false })
    .limit(50);

  return (
    <main className="section">
      <div className="container-page max-w-3xl">
        <Link href="/community" className="text-sm text-brand-600 hover:underline">← All forums</Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">{category.name}</h1>
        <p className="mt-1 text-gray-600">{category.description}</p>

        {/* New topic */}
        <form action="/api/community/topic" method="post" className="mt-6 rounded-2xl border border-black/5 p-5">
          <input type="hidden" name="category_id" value={category.id} />
          <input type="hidden" name="slug" value={params.slug} />
          <input
            name="title"
            required
            placeholder="Topic title"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="What would you like to discuss?"
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button className="btn-primary mt-3 text-sm">Start discussion</button>
        </form>

        {/* Topic list */}
        <div className="mt-6 divide-y divide-black/5 rounded-2xl border border-black/5">
          {(topics ?? []).map((t) => (
            <Link key={t.id} href={`/community/${params.slug}/${t.id}`} className="flex items-center justify-between p-4 hover:bg-brand-50/40">
              <span className="text-sm font-medium text-brand-ink">{t.title}</span>
              <span className="text-xs text-gray-400">{t.reply_count} replies</span>
            </Link>
          ))}
          {(!topics || topics.length === 0) && (
            <p className="p-5 text-sm text-gray-500">No discussions yet — start the first one.</p>
          )}
        </div>
      </div>
    </main>
  );
}
