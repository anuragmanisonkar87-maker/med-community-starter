-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — database schema + Row Level Security (RLS)
-- Run in Supabase Studio -> SQL Editor, or via the Supabase CLI.
-- ─────────────────────────────────────────────────────────────

-- PROFILES: one row per auth user (doctor details).
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  drn text,                       -- doctor registration number
  state text,
  role text not null default 'member',  -- member | admin
  created_at timestamptz not null default now()
);

-- COURSES: price stored in paise (integer) to avoid float issues.
create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  price_paise integer not null default 0 check (price_paise >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ORDERS: one row per Razorpay order attempt.
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  amount_paise integer not null,
  status text not null default 'created',   -- created | paid | failed
  created_at timestamptz not null default now()
);

-- ENROLLMENTS: who can access which course.
create table if not exists public.enrollments (
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  source text not null default 'purchase',  -- purchase | free | manual
  created_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

-- POSTS: simple community/forum posts.
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- ── Auto-create a profile row when a user signs up ──
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, phone) values (new.id, new.phone)
  on conflict (id) do nothing;
  return new;
end; $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.profiles     enable row level security;
alter table public.courses      enable row level security;
alter table public.orders       enable row level security;
alter table public.enrollments  enable row level security;
alter table public.posts        enable row level security;

-- profiles: a user sees and edits only their own row.
create policy "own profile read"  on public.profiles for select using (auth.uid() = id);
create policy "own profile write" on public.profiles for update using (auth.uid() = id);

-- courses: anyone can read published courses.
create policy "published courses readable" on public.courses
  for select using (is_published = true);

-- orders: a user reads only their own orders. Writes happen server-side
-- with the service-role key (which bypasses RLS), so no insert policy here.
create policy "own orders read" on public.orders
  for select using (auth.uid() = user_id);

-- enrollments: a user reads only their own enrollments.
create policy "own enrollments read" on public.enrollments
  for select using (auth.uid() = user_id);

-- posts: any signed-in member reads; author writes/deletes their own.
create policy "members read posts"   on public.posts for select using (auth.role() = 'authenticated');
create policy "author inserts post"  on public.posts for insert with check (auth.uid() = author_id);
create policy "author edits post"    on public.posts for update using (auth.uid() = author_id);
create policy "author deletes post"  on public.posts for delete using (auth.uid() = author_id);

-- ── Seed a couple of courses (optional) ──
insert into public.courses (slug, title, summary, description, price_paise, is_published) values
  ('mutual-fund-basics', 'Mutual Fund Basics for Doctors', 'Start investing with confidence.', 'A short, practical course covering how mutual funds work, SIPs, and building a simple portfolio.', 29900, true),
  ('retire-rich', 'Retirement Planning 101', 'Plan an unhurried, well-funded retirement.', 'Understand corpus targets, withdrawal strategies and how to stay on track.', 9900, true),
  ('finance-starter', 'Money Starter Kit', 'The free foundation every doctor should have.', 'Budgeting, emergency fund, insurance basics — the essentials, free.', 0, true)
on conflict (slug) do nothing;
