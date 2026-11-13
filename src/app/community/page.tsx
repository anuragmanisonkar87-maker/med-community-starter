import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Community" };

// Guarded by middleware — only signed-in members reach this.
export default async function CommunityPage() {
  const supabase = createClient();
  const { data: posts } = await supabase
    .from("posts")
    .select("id, body, created_at")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <main className="section">
      <div className="container-page max-w-2xl">
        <h1 className="font-display text-3xl font-semibold">Community</h1>
        <p className="mt-2 text-gray-600">Ask questions and share with other doctors.</p>
        <div className="mt-8 space-y-4">
          {(posts ?? []).map((p) => (
            <div key={p.id} className="rounded-xl border border-black/5 p-4">
              <p className="whitespace-pre-line text-gray-800">{p.body}</p>
              <p className="mt-2 text-xs text-gray-400">{new Date(p.created_at).toLocaleString()}</p>
            </div>
          ))}
          {(!posts || posts.length === 0) && (
            <p className="text-gray-500">No posts yet. Be the first to start a discussion.</p>
          )}
        </div>
      </div>
    </main>
  );
}
