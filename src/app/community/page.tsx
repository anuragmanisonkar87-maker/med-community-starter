import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Community" };
export const dynamic = "force-dynamic";

// Forums hub — lists discussion categories. Guarded by middleware.
export default async function CommunityPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("forum_categories")
    .select("id, slug, name, description")
    .order("sort_order", { ascending: true });

  return (
    <main className="section">
      <div className="container-page max-w-4xl">
        <h1 className="font-display text-3xl font-semibold">Community forums</h1>
        <p className="mt-2 text-gray-600">Ask questions and share with other doctors, by topic.</p>

        <div className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5">
          {(categories ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/community/${c.slug}`}
              className="flex items-center justify-between gap-4 p-5 transition hover:bg-brand-50/40"
            >
              <div>
                <h3 className="font-semibold text-brand-ink">{c.name}</h3>
                <p className="text-sm text-gray-500">{c.description}</p>
              </div>
              <span className="text-brand-600">→</span>
            </Link>
          ))}
          {(!categories || categories.length === 0) && (
            <p className="p-6 text-sm text-gray-500">
              No categories yet. Run <code>supabase/schema-02-expansion.sql</code> to seed them.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
