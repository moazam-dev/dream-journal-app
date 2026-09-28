-- Adds details the dreamer fills in themselves after the reflection:
-- their own mood (the AI's guess stays in `mood`), who was in the dream, and where it was.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Existing columns are not touched.

alter table public.dreams
  add column if not exists user_mood text
    check (user_mood is null or char_length(user_mood) between 1 and 40),
  add column if not exists people text[] not null default '{}'
    check (cardinality(people) <= 12),
  add column if not exists places text[] not null default '{}'
    check (cardinality(places) <= 12);

-- TEMPORARY, UNTIL WE ADD AUTHENTICATION:
-- the app may change only these three columns, on any dream. Everything else (the dream
-- text and the AI fields) stays read-only for the app. Once users can log in, this becomes
-- "users can only update their own dreams".
grant update (user_mood, people, places) on public.dreams to anon;

create policy "Temporary: anyone can add their own details to a dream"
  on public.dreams for update
  to anon
  using (true)
  with check (true);
