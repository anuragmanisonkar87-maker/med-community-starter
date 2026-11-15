-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — course progress + seed modules. Run AFTER schema-02.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────

create table if not exists public.course_progress (
  user_id uuid not null references auth.users(id) on delete cascade,
  module_id uuid not null references public.course_modules(id) on delete cascade,
  completed_at timestamptz not null default now(),
  primary key (user_id, module_id)
);

alter table public.course_progress enable row level security;
drop policy if exists "own progress read" on public.course_progress;
create policy "own progress read" on public.course_progress for select using (auth.uid() = user_id);
drop policy if exists "own progress write" on public.course_progress;
create policy "own progress write" on public.course_progress for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Seed modules for the three seed courses (original content).
insert into public.course_modules (course_id, title, sort_order)
select c.id, m.title, m.sort_order
from public.courses c
join (values
  ('mutual-fund-basics', 'Welcome & how funds work', 1),
  ('mutual-fund-basics', 'Choosing your first fund', 2),
  ('mutual-fund-basics', 'Setting up a SIP', 3),
  ('mutual-fund-basics', 'Building a simple portfolio', 4),
  ('retire-rich', 'What corpus do you actually need?', 1),
  ('retire-rich', 'Withdrawal strategies', 2),
  ('retire-rich', 'Staying on track', 3),
  ('finance-starter', 'Budgeting in 20 minutes', 1),
  ('finance-starter', 'Your emergency fund', 2),
  ('finance-starter', 'Insurance basics', 3)
) as m(slug, title, sort_order) on m.slug = c.slug
where not exists (
  select 1 from public.course_modules cm where cm.course_id = c.id and cm.title = m.title
);
