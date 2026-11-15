import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SERIES: Record<string, { name: string; desc: string }> = {
  monarchs: { name: "Medical Monarchs", desc: "Stories of doctors who built lasting wealth." },
  maharathis: { name: "Medical Maharathis", desc: "Deep-dives with experienced medical investors." },
  "rx-navigate": { name: "Rx Navigate", desc: "Guided walkthroughs of key money decisions." },
};

// Lists videos in a series. Each video can embed a YouTube player when a
// youtube_id is set on the row (you add your own videos in Supabase).
export default async function SeriesPage({ params }: { params: { series: string } }) {
  const meta = SERIES[params.series];
  if (!meta) notFound();

  const supabase = createClient();
  const { data: videos } = await supabase
    .from("videos")
    .select("slug, title, description, youtube_id")
    .eq("series", params.series)
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  return (
    <main className="section">
      <div className="container-page max-w-4xl">
        <Link href="/watch" className="text-sm text-brand-600 hover:underline">← All series</Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">{meta.name}</h1>
        <p className="mt-1 text-gray-600">{meta.desc}</p>

        <div className="mt-8 grid gap-8">
          {(videos ?? []).map((v) => (
            <div key={v.slug} className="rounded-2xl border border-black/5 p-5">
              {v.youtube_id ? (
                <div className="aspect-video w-full overflow-hidden rounded-xl">
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${v.youtube_id}`}
                    title={v.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="grid aspect-video place-items-center rounded-xl bg-brand-50 text-brand-600">▶</div>
              )}
              <h2 className="mt-3 font-semibold">{v.title}</h2>
              <p className="mt-1 text-sm text-gray-600">{v.description}</p>
            </div>
          ))}
          {(!videos || videos.length === 0) && (
            <p className="rounded-2xl border border-dashed border-gray-200 p-6 text-center text-sm text-gray-500">
              No videos in this series yet. Add rows to the <code>videos</code> table (set <code>series</code> = “{params.series}” and a <code>youtube_id</code>).
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
