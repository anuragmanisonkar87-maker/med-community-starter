-- ─────────────────────────────────────────────────────────────
-- MedWealth Circle — event payment tracking. Run AFTER schema-02.
-- Idempotent.
-- ─────────────────────────────────────────────────────────────

-- Pending/completed Razorpay orders for paid events.
create table if not exists public.event_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  razorpay_order_id text unique not null,
  razorpay_payment_id text,
  amount_paise integer not null,
  status text not null default 'created',   -- created | paid | failed
  created_at timestamptz not null default now()
);

alter table public.event_orders enable row level security;

drop policy if exists "own event orders read" on public.event_orders;
create policy "own event orders read" on public.event_orders
  for select using (auth.uid() = user_id);
-- Writes happen server-side with the service-role key (bypasses RLS).
