import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Newsletters" };
export const dynamic = "force-dynamic";

// Newsletter listing — articles of kind 'newsletter'.
export default async function NewslettersPage() {
  const supabase = createClient();
  const { data: items } = await supabase
    .from("articles")
    .select("slug, title, excerpt, published_at")
    .eq("kind", "newsletter")
    .eq("is_published", true)
    .order("published_at", { ascending: false });

  return (
    <main className="section">
      <div className="container-page max-w-3xl">
        <h1 className="font-display text-3xl font-semibold">Newsletters</h1>
        <p className="mt-2 text-gray-600">Short, regular money notes for doctors.</p>

        <div className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5">
          {(items ?? []).map((a) => (
            <Link key={a.slug} href={`/articles/${a.slug}`} className="block p-5 hover:bg-brand-50/40">
              <h2 className="font-semibold text-brand-ink">{a.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{a.excerpt}</p>
              <p className="mt-2 text-xs text-gray-400">{a.published_at ? new Date(a.published_at).toLocaleDateString() : ""}</p>
            </Link>
          ))}
          {(!items || items.length === 0) && <p className="p-5 text-sm text-gray-500">No newsletters yet.</p>}
        </div>
      </div>
    </main>
  );
}
