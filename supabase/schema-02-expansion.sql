-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — schema expansion (forums, events, content,
-- groups, messaging, notifications, quiz). Run AFTER schema.sql.
-- Idempotent: safe to re-run.
-- ─────────────────────────────────────────────────────────────

-- ── FORUMS ──
create table if not exists public.forum_categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.forum_topics (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.forum_categories(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  reply_count int not null default 0,
  last_activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index if not exists forum_topics_category_idx on public.forum_topics(category_id, last_activity_at desc);

create table if not exists public.forum_replies (
  id uuid primary key default gen_random_uuid(),
  topic_id uuid not null references public.forum_topics(id) on delete cascade,
  author_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);
create index if not exists forum_replies_topic_idx on public.forum_replies(topic_id, created_at);

-- Keep reply_count / last_activity_at in sync.
create or replace function public.bump_topic_on_reply()
returns trigger language plpgsql security definer set search_path = public as $fn$
begin
  update public.forum_topics
    set reply_count = reply_count + 1, last_activity_at = now()
    where id = new.topic_id;
  return new;
end; $fn$;
drop trigger if exists on_forum_reply on public.forum_replies;
create trigger on_forum_reply after insert on public.forum_replies
  for each row execute function public.bump_topic_on_reply();

-- ── REACTIONS (likes on topics/replies/posts) ──
create table if not exists public.reactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null,     -- 'topic' | 'reply' | 'post'
  target_id uuid not null,
  kind text not null default 'like',
  created_at timestamptz not null default now(),
  unique (user_id, target_type, target_id, kind)
);

-- ── EVENTS ──
create table if not exists public.events (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  title text not null,
  summary text,
  description text,
  starts_at timestamptz,
  location text,
  speaker text,
  price_paise integer not null default 0 check (price_paise >= 0),
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.event_registrations (
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  status text not null default 'registered',   -- registered | paid | cancelled
  created_at timestamptz not null default now(),
  primary key (user_id, event_id)
);

-- ── CONTENT: articles, newsletters, videos ──
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  kind text not null default 'blog',   -- blog | newsletter
  title text not null,
  excerpt text,
  body text,
  author_name text,
  cover_url text,
  tags text[] default '{}',
  published_at timestamptz,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  series text,                          -- e.g. 'medical-monarchs'
  title text not null,
  description text,
  youtube_id text,
  is_published boolean not null default false,
  created_at timestamptz not null default now()
);

-- ── GROUPS & FRIENDS ──
create table if not exists public.groups (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);
create table if not exists public.group_members (
  group_id uuid not null references public.groups(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  primary key (group_id, user_id)
);
create table if not exists public.friendships (
  requester_id uuid not null references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',   -- pending | accepted
  created_at timestamptz not null default now(),
  primary key (requester_id, addressee_id)
);

-- ── MESSAGING & NOTIFICATIONS ──
create table if not exists public.private_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists pm_recipient_idx on public.private_messages(recipient_id, created_at desc);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null,
  body text not null,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notif_user_idx on public.notifications(user_id, created_at desc);

-- ── QUIZ (FinnFit) ──
create table if not exists public.quiz_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  score int not null,
  band text not null,                   -- e.g. 'Needs attention' | 'On track' | 'Strong'
  answers jsonb,
  created_at timestamptz not null default now()
);

-- ── COURSE MODULES ──
create table if not exists public.course_modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text not null,
  sort_order int not null default 0,
  video_id text,
  created_at timestamptz not null default now()
);

-- ─────────────────────────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────────────────────────
alter table public.forum_categories    enable row level security;
alter table public.forum_topics         enable row level security;
alter table public.forum_replies         enable row level security;
alter table public.reactions             enable row level security;
alter table public.events                enable row level security;
alter table public.event_registrations   enable row level security;
alter table public.articles              enable row level security;
alter table public.videos                enable row level security;
alter table public.groups                enable row level security;
alter table public.group_members         enable row level security;
alter table public.friendships           enable row level security;
alter table public.private_messages      enable row level security;
alter table public.notifications         enable row level security;
alter table public.quiz_results          enable row level security;
alter table public.course_modules        enable row level security;

-- Public/readable content
drop policy if exists "read categories" on public.forum_categories;
create policy "read categories" on public.forum_categories for select using (true);
drop policy if exists "read events" on public.events;
create policy "read events" on public.events for select using (is_published = true);
drop policy if exists "read articles" on public.articles;
create policy "read articles" on public.articles for select using (is_published = true);
drop policy if exists "read videos" on public.videos;
create policy "read videos" on public.videos for select using (is_published = true);
drop policy if exists "read groups" on public.groups;
create policy "read groups" on public.groups for select using (true);
drop policy if exists "read modules" on public.course_modules;
create policy "read modules" on public.course_modules for select using (true);

-- Forums: members read; authors write their own
drop policy if exists "read topics" on public.forum_topics;
create policy "read topics" on public.forum_topics for select using (auth.role() = 'authenticated');
drop policy if exists "insert topics" on public.forum_topics;
create policy "insert topics" on public.forum_topics for insert with check (auth.uid() = author_id);
drop policy if exists "edit own topics" on public.forum_topics;
create policy "edit own topics" on public.forum_topics for update using (auth.uid() = author_id);

drop policy if exists "read replies" on public.forum_replies;
create policy "read replies" on public.forum_replies for select using (auth.role() = 'authenticated');
drop policy if exists "insert replies" on public.forum_replies;
create policy "insert replies" on public.forum_replies for insert with check (auth.uid() = author_id);

-- Reactions: own
drop policy if exists "read reactions" on public.reactions;
create policy "read reactions" on public.reactions for select using (auth.role() = 'authenticated');
drop policy if exists "manage own reactions" on public.reactions;
create policy "manage own reactions" on public.reactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Event registrations: own
drop policy if exists "own event regs read" on public.event_registrations;
create policy "own event regs read" on public.event_registrations for select using (auth.uid() = user_id);
drop policy if exists "own event regs write" on public.event_registrations;
create policy "own event regs write" on public.event_registrations for insert with check (auth.uid() = user_id);

-- Group membership: own rows
drop policy if exists "read group members" on public.group_members;
create policy "read group members" on public.group_members for select using (auth.role() = 'authenticated');
drop policy if exists "join groups" on public.group_members;
create policy "join groups" on public.group_members for insert with check (auth.uid() = user_id);
drop policy if exists "leave groups" on public.group_members;
create policy "leave groups" on public.group_members for delete using (auth.uid() = user_id);

-- Friendships: only parties involved
drop policy if exists "read own friendships" on public.friendships;
create policy "read own friendships" on public.friendships for select using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists "request friendship" on public.friendships;
create policy "request friendship" on public.friendships for insert with check (auth.uid() = requester_id);
drop policy if exists "update friendship" on public.friendships;
create policy "update friendship" on public.friendships for update using (auth.uid() = addressee_id or auth.uid() = requester_id);

-- Private messages: only sender/recipient
drop policy if exists "read own messages" on public.private_messages;
create policy "read own messages" on public.private_messages for select using (auth.uid() = sender_id or auth.uid() = recipient_id);
drop policy if exists "send messages" on public.private_messages;
create policy "send messages" on public.private_messages for insert with check (auth.uid() = sender_id);

-- Notifications: own
drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select using (auth.uid() = user_id);
drop policy if exists "update own notifications" on public.notifications;
create policy "update own notifications" on public.notifications for update using (auth.uid() = user_id);

-- Quiz results: own (plus anonymous inserts allowed)
drop policy if exists "read own quiz" on public.quiz_results;
create policy "read own quiz" on public.quiz_results for select using (auth.uid() = user_id);
drop policy if exists "insert quiz" on public.quiz_results;
create policy "insert quiz" on public.quiz_results for insert with check (true);

-- ─────────────────────────────────────────────────────────────
-- SEED DATA (original placeholder content)
-- ─────────────────────────────────────────────────────────────
insert into public.forum_categories (slug, name, description, sort_order) values
  ('general-discussion', 'General Discussion', 'Anything about money and medicine.', 1),
  ('tax-planning-itr', 'Tax Planning & ITR', 'Income tax, deductions and filing for doctors.', 2),
  ('mutual-funds-sip', 'Mutual Funds & SIP', 'Fund selection, SIPs and portfolios.', 3),
  ('insurance-risk-cover', 'Insurance & Risk Cover', 'Term, health and professional indemnity.', 4),
  ('stock-market-equity', 'Stock Market & Equity', 'Direct equity and market discussion.', 5),
  ('loans-emi-management', 'Loans & EMI Management', 'Education loans, home loans and EMIs.', 6),
  ('retirement-nps-ppf', 'Retirement, NPS & PPF', 'Long-term retirement planning.', 7),
  ('real-estate', 'Real Estate', 'Property as an investment and for practice.', 8),
  ('practice-business-finance', 'Practice & Business Finance', 'Running a clinic or practice.', 9),
  ('international-investments', 'International Investments', 'Investing abroad and for NRIs.', 10)
on conflict (slug) do nothing;

insert into public.events (slug, title, summary, description, starts_at, location, speaker, price_paise, is_published) values
  ('wealth-shift-webinar', 'The Wealth Shift: A Doctor''s Roadmap', 'A free live session on building long-term wealth.', 'Join a practical, jargon-free session on the money moves that matter most in a medical career.', now() + interval '14 days', 'Online (Zoom)', 'MedWealth Circle team', 0, true),
  ('tax-masterclass', 'Year-End Tax Masterclass for Doctors', 'Cut your tax bill before 31 March.', 'A focused masterclass on deductions, advance tax and ITR for medical professionals.', now() + interval '30 days', 'Online', 'Invited CA', 49900, true)
on conflict (slug) do nothing;

insert into public.articles (slug, kind, title, excerpt, body, author_name, tags, published_at, is_published) values
  ('asset-allocation-for-doctors', 'blog', 'Asset Allocation for Doctors: Build a Portfolio That Works as a Team', 'Why the mix of your investments matters more than any single pick.', 'Asset allocation is the share of your money across equity, debt, gold and cash. For doctors with irregular, lumpy income, getting this mix right matters more than picking any single fund. This piece walks through a simple, resilient allocation and how to rebalance once a year.', 'MedWealth Circle', array['investing','portfolio'], now(), true),
  ('term-insurance-residents', 'newsletter', 'Term Insurance While You''re Still a Resident', 'Lock in a low premium before your liabilities grow.', 'Buying term cover early, while you are young and healthy, locks in a low premium for decades. Here is how much cover to consider and what to check before you buy.', 'MedWealth Circle', array['insurance'], now(), true)
on conflict (slug) do nothing;
