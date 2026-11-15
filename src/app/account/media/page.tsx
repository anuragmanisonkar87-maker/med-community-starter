import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Media" };
export const dynamic = "force-dynamic";

// Member media library. Files live in Supabase Storage; this lists metadata.
export default async function MediaPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: media } = await supabase
    .from("media")
    .select("id, title, url, kind, created_at")
    .eq("owner_id", user!.id)
    .order("created_at", { ascending: false });

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold">Media</h1>
      <p className="mt-1 text-sm text-gray-500">
        Your uploads. Wire a Supabase Storage bucket to add upload; this lists saved media.
      </p>

      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {(media ?? []).map((m) => (
          <a key={m.id} href={m.url} target="_blank" rel="noopener" className="rounded-xl border border-black/5 p-3 text-sm hover:shadow-md">
            <div className="grid aspect-square place-items-center rounded-lg bg-brand-50 text-brand-600">
              {m.kind === "image" ? "🖼" : m.kind === "video" ? "▶" : "📄"}
            </div>
            <p className="mt-2 truncate">{m.title ?? m.url}</p>
          </a>
        ))}
        {(!media || media.length === 0) && (
          <p className="col-span-full text-sm text-gray-500">No media yet.</p>
        )}
      </div>
    </div>
  );
}
