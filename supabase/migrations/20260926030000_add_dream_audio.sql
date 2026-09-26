-- Adds spoken reflections: two new columns on `dreams` and a Storage bucket for the files.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Existing columns (Groq reflection and image fields) are not touched.

alter table public.dreams
  -- Public link to the audio file in the `dream-audio` bucket.
  add column if not exists audio_url text,
  -- 'pending'    = no audio yet (created only when the user taps "Listen")
  -- 'generating' = the generate-dream-audio function is working on it
  -- 'completed'  = audio_url is ready
  -- 'failed'     = generation failed; the app shows a "Try again" button
  add column if not exists audio_status text not null default 'pending'
    check (audio_status in ('pending', 'generating', 'completed', 'failed'));

-- Storage bucket for the spoken reflections (WAV files from Groq).
-- `public = true` lets the app stream the file from a plain URL. File names contain the
-- dream's random id, so they can't be guessed. Only the Edge Function (server side)
-- can upload: there are no upload policies for the app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dream-audio',
  'dream-audio',
  true,
  20971520, -- 20 MB (a one-minute WAV is about 3 MB)
  array['audio/wav', 'audio/x-wav', 'audio/wave']
)
on conflict (id) do nothing;

-- The app may still only fill in `dream_text` when adding a dream
-- (set up in an earlier migration), so it can't fake audio either.
