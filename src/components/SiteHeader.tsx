"use client";

import Link from "next/link";
import { useState } from "react";

const nav = [
  { label: "Watch", href: "/watch" },
  { label: "Courses", href: "/courses" },
  { label: "Community", href: "/community" },
  { label: "Blog", href: "/blog" },
  { label: "Tools", href: "/calculators/fire" },
];

// Sticky header with a mobile drawer — mirrors the structure of the reference site.
export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-black/5 bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between">
        <Link href="/" className="font-display text-lg font-semibold text-brand-ink">
          MedWealth<span className="text-brand-500">Circle</span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="text-sm text-gray-600 hover:text-brand-600">
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link href="/login" className="text-sm text-gray-600 hover:text-brand-600">Sign in</Link>
          <Link href="/signup" className="btn-primary text-sm">Join free</Link>
        </div>

        <button className="md:hidden" aria-label="Menu" onClick={() => setOpen((v) => !v)}>
          <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M3 6h18M3 12h18M3 18h18" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="border-t border-black/5 bg-white md:hidden">
          <div className="container-page flex flex-col gap-1 py-3">
            {nav.map((n) => (
              <Link key={n.href} href={n.href} className="py-2 text-gray-700" onClick={() => setOpen(false)}>
                {n.label}
              </Link>
            ))}
            <div className="mt-2 flex gap-3">
              <Link href="/login" className="btn-ghost flex-1 text-sm">Sign in</Link>
              <Link href="/signup" className="btn-primary flex-1 text-sm">Join free</Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
