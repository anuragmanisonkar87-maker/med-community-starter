import Link from "next/link";
import BookingButton from "@/components/BookingButton";

// Homepage. Structure mirrors the reference layout (hero → stats → problems →
// features → steps → courses → testimonials → FAQ → CTA) but all copy here is
// original placeholder content. Replace with your own approved copy and assets.

export default function HomePage() {
  return (
    <main>
      {/* Hero */}
      <section className="section">
        <div className="container-page grid items-center gap-10 lg:grid-cols-2">
          <div>
            <p className="eyebrow">For doctors, by a finance team</p>
            <h1 className="mt-3 font-display text-4xl font-semibold leading-tight sm:text-5xl">
              You trained for years in medicine. <span className="text-brand-500">Train a little in money too.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg text-gray-600">
              Clear, jargon-free personal finance for doctors — tax, investing, insurance and
              planning. Free to join, no sales pitch.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link href="/signup" className="btn-primary">Join free</Link>
              <BookingButton className="btn-ghost">Book a consultation</BookingButton>
            </div>
            <p className="mt-4 text-sm text-gray-500">₹0 forever · No credit card · Verified doctors only</p>
          </div>
          <div className="rounded-3xl border border-black/5 bg-brand-50 p-8">
            {/* Replace with your own hero illustration/banner. */}
            <div className="aspect-[4/3] w-full rounded-2xl bg-white shadow-sm grid place-items-center text-gray-400">
              Hero image placeholder
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="border-y border-black/5 bg-brand-50/50">
        <div className="container-page grid grid-cols-2 gap-6 py-10 sm:grid-cols-4">
          {[["1,700+", "Doctors"], ["50+", "Webinars"], ["12", "Cities"], ["4.8/5", "Rating"]].map(([n, l]) => (
            <div key={l} className="text-center">
              <p className="font-display text-3xl font-semibold text-brand-600">{n}</p>
              <p className="text-sm text-gray-500">{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="section">
        <div className="container-page">
          <h2 className="font-display text-3xl font-semibold">Everything in one place</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {features.map((f) => (
              <div key={f.title} className="rounded-2xl border border-black/5 p-6">
                <div className="mb-3 h-10 w-10 rounded-xl bg-brand-50 text-brand-600 grid place-items-center">●</div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="section bg-brand-50/50">
        <div className="container-page">
          <h2 className="font-display text-3xl font-semibold">Get started in 3 steps</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={s.title} className="rounded-2xl bg-white border border-black/5 p-6">
                <span className="text-brand-500 font-display text-2xl font-semibold">0{i + 1}</span>
                <h3 className="mt-2 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-gray-600">{s.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="section">
        <div className="container-page rounded-3xl bg-brand-ink px-8 py-14 text-center text-white">
          <h2 className="font-display text-3xl font-semibold">Ready to take charge of your money?</h2>
          <p className="mx-auto mt-3 max-w-xl text-gray-300">
            Join free and get access to webinars, courses and a verified community of doctors.
          </p>
          <div className="mt-7 flex justify-center gap-3">
            <Link href="/signup" className="btn-primary">Join free</Link>
            <Link href="/courses" className="btn-ghost border-white/30 text-white hover:text-white">Browse courses</Link>
          </div>
        </div>
      </section>
    </main>
  );
}

const features = [
  { title: "Live webinars", body: "Monthly sessions on tax, investing and insurance, with replays you can watch anytime." },
  { title: "Expert courses", body: "Short, structured courses built for the way doctors earn and spend." },
  { title: "Verified community", body: "Ask questions and get answers from a doctor-only community and qualified experts." },
];

const steps = [
  { title: "Create your account", body: "Sign up free with your mobile number — no password to remember." },
  { title: "Verify you're a doctor", body: "Add your registration number so the community stays doctor-only." },
  { title: "Start learning", body: "Join a webinar, take a course, or ask the community anything." },
];
