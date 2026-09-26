-- Adds the AI reflection fields to `dreams`.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.

alter table public.dreams
  add column title text,
  add column summary text,
  add column mood text,
  add column themes text[],
  add column reflection text,
  -- 'pending'   = saved, no AI reflection yet
  -- 'completed' = AI reflection saved
  -- 'failed'    = the AI step failed; the app shows a "Try again" button
  add column analysis_status text not null default 'pending'
    check (analysis_status in ('pending', 'completed', 'failed'));

-- The app may only fill in `dream_text` when it adds a dream.
-- The AI fields are written only by the `analyze-dream` Edge Function (server side),
-- so nobody can insert a fake "completed" reflection from the app.
-- (There is still no update or delete policy for the app.)
revoke insert on public.dreams from anon;
grant insert (dream_text) on public.dreams to anon;
