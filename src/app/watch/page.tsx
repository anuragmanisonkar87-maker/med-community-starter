import Link from "next/link";

export const metadata = { title: "Watch" };

// Video hub — the series. Videos themselves live in the `videos` table,
// listed per series on /watch/[series]. Series are defined here as the
// navigable sections (original names/descriptions).
const SERIES = [
  { slug: "monarchs", name: "Medical Monarchs", desc: "Stories of doctors who built lasting wealth." },
  { slug: "maharathis", name: "Medical Maharathis", desc: "Deep-dives with experienced medical investors." },
  { slug: "rx-navigate", name: "Rx Navigate", desc: "Guided walkthroughs of key money decisions." },
];

export default function WatchPage() {
  return (
    <main className="section">
      <div className="container-page max-w-4xl">
        <h1 className="font-display text-3xl font-semibold">Watch</h1>
        <p className="mt-2 text-gray-600">Video series on money for doctors.</p>

        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {SERIES.map((s) => (
            <Link key={s.slug} href={`/watch/${s.slug}`} className="rounded-2xl border border-black/5 p-6 transition hover:shadow-md">
              <div className="mb-3 grid aspect-video place-items-center rounded-xl bg-brand-50 text-brand-600">▶</div>
              <h2 className="font-semibold">{s.name}</h2>
              <p className="mt-1 text-sm text-gray-600">{s.desc}</p>
            </Link>
          ))}
        </div>
      </div>
    </main>
  );
}
