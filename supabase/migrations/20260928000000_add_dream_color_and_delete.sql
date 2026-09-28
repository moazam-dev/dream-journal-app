-- Lets the Entries screen recolour a dream's card and delete a dream.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Existing columns are not touched.

-- The card colour the dreamer picked. Empty means "pick one from the mood".
alter table public.dreams
  add column if not exists color text
    check (color is null or color in ('lime', 'peach', 'lilac', 'sky', 'rose', 'dusk'));

-- TEMPORARY, UNTIL WE ADD AUTHENTICATION:
-- the app may also change the colour, and delete any dream. Once users can log in, this
-- becomes "users can only change and delete their own dreams".
grant update (color) on public.dreams to anon;
grant delete on public.dreams to anon;

create policy "Temporary: anyone can delete a dream"
  on public.dreams for delete
  to anon
  using (true);
