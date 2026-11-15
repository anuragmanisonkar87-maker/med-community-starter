-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — member profile fields + media. Run AFTER schema-02.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────

alter table public.profiles add column if not exists headline text;
alter table public.profiles add column if not exists bio text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists specialty text;

-- Member media (links/metadata; files live in Supabase Storage).
create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text,
  url text not null,
  kind text not null default 'image',   -- image | document | video
  created_at timestamptz not null default now()
);
create index if not exists media_owner_idx on public.media(owner_id, created_at desc);

alter table public.media enable row level security;
drop policy if exists "read own media" on public.media;
create policy "read own media" on public.media for select using (auth.uid() = owner_id);
drop policy if exists "manage own media" on public.media;
create policy "manage own media" on public.media for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- Let members read each other's basic public profile (for friends/messages lists).
drop policy if exists "read public profiles" on public.profiles;
create policy "read public profiles" on public.profiles for select using (auth.role() = 'authenticated');
