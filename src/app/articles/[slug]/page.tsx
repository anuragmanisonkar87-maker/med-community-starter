import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// Article / newsletter detail page with related articles and share links.
export default async function ArticlePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  const { data: article } = await supabase
    .from("articles")
    .select("slug, kind, title, excerpt, body, author_name, tags, published_at")
    .eq("slug", params.slug)
    .eq("is_published", true)
    .single();

  if (!article) notFound();

  // Related: same kind, excluding this one.
  const { data: related } = await supabase
    .from("articles")
    .select("slug, title")
    .eq("kind", article.kind)
    .eq("is_published", true)
    .neq("slug", article.slug)
    .limit(3);

  const shareUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}/articles/${article.slug}`;

  return (
    <main className="section">
      <article className="container-page max-w-2xl">
        <Link href={article.kind === "newsletter" ? "/newsletters" : "/blog"} className="text-sm text-brand-600 hover:underline">
          ← {article.kind === "newsletter" ? "Newsletters" : "Blog"}
        </Link>
        <h1 className="mt-3 font-display text-3xl font-semibold leading-tight">{article.title}</h1>
        <p className="mt-3 text-sm text-gray-500">
          {article.author_name} · {article.published_at ? new Date(article.published_at).toLocaleDateString() : ""}
        </p>

        <div className="prose mt-6 max-w-none whitespace-pre-line text-gray-800">{article.body}</div>

        <div className="mt-6 flex flex-wrap gap-2">
          {(article.tags ?? []).map((t: string) => (
            <Link key={t} href={`/blog?tag=${t}`} className="rounded-full bg-brand-50 px-2.5 py-0.5 text-xs text-brand-600">#{t}</Link>
          ))}
        </div>

        {/* Social sharing */}
        <div className="mt-6 flex gap-3 text-sm">
          <a className="text-brand-600 hover:underline" target="_blank" rel="noopener" href={`https://wa.me/?text=${encodeURIComponent(article.title + " " + shareUrl)}`}>Share on WhatsApp</a>
          <a className="text-brand-600 hover:underline" target="_blank" rel="noopener" href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}>LinkedIn</a>
        </div>

        {related && related.length > 0 && (
          <div className="mt-10 border-t border-black/5 pt-6">
            <h2 className="text-sm font-semibold text-gray-700">Related</h2>
            <ul className="mt-3 space-y-2">
              {related.map((r) => (
                <li key={r.slug}>
                  <Link href={`/articles/${r.slug}`} className="text-sm text-brand-600 hover:underline">{r.title}</Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </article>
    </main>
  );
}
