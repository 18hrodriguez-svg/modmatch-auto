create table if not exists public.feedback (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid null references auth.users(id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  role text null,
  liked text null,
  confusing text null,
  missing text null,
  would_use boolean null,
  email text null,
  page text null default 'site'
);

alter table public.feedback enable row level security;

drop policy if exists "Anyone can submit feedback" on public.feedback;
create policy "Anyone can submit feedback"
on public.feedback
for insert
to anon, authenticated
with check (
  user_id is null
  or user_id = auth.uid()
);

revoke all on table public.feedback from anon, authenticated;
grant insert on table public.feedback to anon, authenticated;
