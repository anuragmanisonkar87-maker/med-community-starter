import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

// A single forum topic with its replies and a reply composer.
export default async function TopicPage({ params }: { params: { slug: string; id: string } }) {
  const supabase = createClient();

  const { data: topic } = await supabase
    .from("forum_topics")
    .select("id, title, body, created_at")
    .eq("id", params.id)
    .single();

  if (!topic) notFound();

  const { data: replies } = await supabase
    .from("forum_replies")
    .select("id, body, created_at")
    .eq("topic_id", params.id)
    .order("created_at", { ascending: true });

  return (
    <main className="section">
      <div className="container-page max-w-3xl">
        <Link href={`/community/${params.slug}`} className="text-sm text-brand-600 hover:underline">← Back</Link>
        <h1 className="mt-2 font-display text-2xl font-semibold">{topic.title}</h1>
        <article className="mt-3 rounded-2xl border border-black/5 p-5 text-sm text-gray-800 whitespace-pre-line">
          {topic.body}
        </article>

        <h2 className="mt-8 text-sm font-semibold text-gray-700">
          {replies?.length ?? 0} {replies?.length === 1 ? "reply" : "replies"}
        </h2>
        <div className="mt-3 space-y-3">
          {(replies ?? []).map((r) => (
            <div key={r.id} className="rounded-xl border border-black/5 p-4 text-sm text-gray-800 whitespace-pre-line">
              {r.body}
              <p className="mt-2 text-xs text-gray-400">{new Date(r.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>

        <form action="/api/community/reply" method="post" className="mt-6">
          <input type="hidden" name="topic_id" value={topic.id} />
          <input type="hidden" name="slug" value={params.slug} />
          <textarea
            name="body"
            required
            rows={3}
            placeholder="Write a reply…"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
          />
          <button className="btn-primary mt-2 text-sm">Reply</button>
        </form>
      </div>
    </main>
  );
}
