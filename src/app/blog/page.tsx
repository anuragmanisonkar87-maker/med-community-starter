import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Blog" };
export const dynamic = "force-dynamic";

// Blog listing — articles of kind 'blog'. Supports a ?tag= filter.
export default async function BlogPage({ searchParams }: { searchParams: { tag?: string } }) {
  const supabase = createClient();
  let query = supabase
    .from("articles")
    .select("slug, title, excerpt, author_name, tags, published_at")
    .eq("kind", "blog")
    .eq("is_published", true)
    .order("published_at", { ascending: false });
  if (searchParams.tag) query = query.contains("tags", [searchParams.tag]);
  const { data: articles } = await query;

  return (
    <main className="section">
      <div className="container-page max-w-4xl">
        <h1 className="font-display text-3xl font-semibold">Blog</h1>
        <p className="mt-2 text-gray-600">Practical money articles for doctors.</p>
        {searchParams.tag && (
          <p className="mt-2 text-sm">
            Filtered by <span className="font-medium">#{searchParams.tag}</span> ·{" "}
            <Link href="/blog" className="text-brand-600 hover:underline">clear</Link>
          </p>
        )}

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {(articles ?? []).map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="rounded-2xl border border-black/5 p-6 transition hover:shadow-md">
              <h2 className="font-semibold text-brand-ink">{a.title}</h2>
              <p className="mt-2 text-sm text-gray-600">{a.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {(a.tags ?? []).map((t: string) => (
                  <span key={t} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-600">#{t}</span>
                ))}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                {a.author_name} · {a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}
              </p>
            </Link>
          ))}
          {(!articles || articles.length === 0) && (
            <p className="text-sm text-gray-500">No articles yet.</p>
          )}
        </div>
      </div>
    </main>
  );
}
