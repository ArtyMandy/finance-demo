-- Monthly income per user. One row per user and month.
create table public.monthly_income (
  id bigint generated always as identity primary key,
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  -- Always the first day of the month, e.g. 2026-10-01
  month date not null check (extract(day from month) = 1),
  amount numeric(12, 2) not null check (amount >= 0),
  created_at timestamptz not null default now(),
  unique (user_id, month)
);

alter table public.monthly_income enable row level security;

-- Signed-in users may only see and change their own rows
create policy "Users read own income" on public.monthly_income
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users insert own income" on public.monthly_income
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update own income" on public.monthly_income
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own income" on public.monthly_income
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.monthly_income to authenticated;
