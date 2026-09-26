-- Adds AI dream images: two new columns on `dreams` and a Storage bucket for the files.
-- Run this once in the Supabase dashboard: SQL Editor > New query > paste > Run.
-- Existing columns (including the Groq reflection fields) are not touched.

alter table public.dreams
  -- Public link to the image file in the `dream-images` bucket.
  add column if not exists image_url text,
  -- 'pending'    = no image yet
  -- 'generating' = the generate-dream-image function is working on it
  -- 'completed'  = image_url is ready
  -- 'failed'     = generation failed; the app shows a "Try again" button
  add column if not exists image_status text not null default 'pending'
    check (image_status in ('pending', 'generating', 'completed', 'failed'));

-- Storage bucket for the generated images.
-- `public = true` means anyone with the link can view an image, which is what lets
-- the app show it with a plain URL. File names contain the dream's random id, so they
-- can't be guessed. Only the Edge Function (server side) can upload: there are no
-- upload policies for the app.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'dream-images',
  'dream-images',
  true,
  5242880, -- 5 MB
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do nothing;

-- The app may still only fill in `dream_text` when adding a dream
-- (set up in the previous migration), so it can't fake an image either.
