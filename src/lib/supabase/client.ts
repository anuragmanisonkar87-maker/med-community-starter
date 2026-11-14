"use client";

import { createBrowserClient } from "@supabase/ssr";

// True only when the public Supabase env vars were present at build time.
// NEXT_PUBLIC_* values are inlined during `next build`, so this is static.
export const isSupabaseConfigured = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// Browser-side Supabase client. Uses the public anon key — safe to expose.
// Returns null (instead of throwing) when env vars are missing, so a
// misconfigured deploy shows a clear message rather than white-screening.
export function createClient() {
  if (!isSupabaseConfigured) return null;
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
