-- All finance data of a user as one JSON document. The app is local-first and mirrors
-- its data here when the user is signed in, so it is available on every device.
create table public.finance_documents (
  user_id uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table public.finance_documents enable row level security;

create policy "Users read own document" on public.finance_documents
  for select to authenticated using ((select auth.uid()) = user_id);

create policy "Users insert own document" on public.finance_documents
  for insert to authenticated with check ((select auth.uid()) = user_id);

create policy "Users update own document" on public.finance_documents
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users delete own document" on public.finance_documents
  for delete to authenticated using ((select auth.uid()) = user_id);

grant select, insert, update, delete on public.finance_documents to authenticated;
