-- Creates the `dreams` table for the Dream Journal MVP.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

create table public.dreams (
  id uuid primary key default gen_random_uuid(),
  dream_text text not null check (char_length(trim(dream_text)) > 0),
  created_at timestamptz not null default now()
);

-- Row Level Security: nothing is allowed unless a policy below allows it.
alter table public.dreams enable row level security;

-- TEMPORARY, UNTIL WE ADD AUTHENTICATION:
-- anyone using the app's publishable key can read and add dreams (but not edit or delete them).
-- Once users can log in, these policies will be replaced with "users only see their own dreams".
grant select, insert on public.dreams to anon;

create policy "Temporary: anyone can read dreams"
  on public.dreams for select
  to anon
  using (true);

create policy "Temporary: anyone can add dreams"
  on public.dreams for insert
  to anon
  with check (true);
