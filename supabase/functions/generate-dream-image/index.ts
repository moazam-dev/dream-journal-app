/**
 * Supabase Edge Function: generate-dream-image
 *
 * Runs on Supabase's servers, so the Cloudflare token never reaches the phone.
 *
 * 1. The app sends:            POST { "dreamId": "<uuid>" }
 * 2. We load the dream (it must already have its Groq reflection).
 * 3. We write an image prompt from the dream (image-prompt.ts).
 * 4. Cloudflare Workers AI paints the image (cloudflare.ts).
 * 5. We upload it to the `dream-images` Storage bucket.
 * 6. We save the public link in dreams.image_url and return the updated dream.
 * If anything fails, the dream is kept and marked image_status = 'failed'.
 */
import { withSupabase } from '@supabase/server';

import { generateImageWithCloudflare } from './cloudflare.ts';
import { createImagePrompt } from './image-prompt.ts';

const BUCKET = 'dream-images';

export default {
  // Only requests carrying this project's publishable key get in (same as analyze-dream).
  fetch: withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405 });
    }

    const body = await req.json().catch(() => null);
    const dreamId = body?.dreamId;
    if (typeof dreamId !== 'string' || dreamId === '') {
      return Response.json({ error: 'dreamId is required.' }, { status: 400 });
    }

    const db = ctx.supabaseAdmin;

    const { data: dream, error: loadError } = await db
      .from('dreams')
      .select('*')
      .eq('id', dreamId)
      .maybeSingle();

    if (loadError) {
      console.error('Could not load dream', loadError);
      return Response.json({ error: 'Could not load this dream.' }, { status: 500 });
    }
    if (!dream) {
      return Response.json({ error: 'Dream not found.' }, { status: 404 });
    }

    // Already done: return it instead of paying for another image.
    if (dream.image_status === 'completed' && dream.image_url) {
      return Response.json({ dream });
    }
    // The prompt uses the reflection (title, mood, themes), so that must exist first.
    if (dream.analysis_status !== 'completed') {
      return Response.json(
        { error: 'The dream needs its AI reflection before an image can be created.' },
        { status: 409 }
      );
    }

    await db.from('dreams').update({ image_status: 'generating' }).eq('id', dreamId);

    try {
      const accountId = Deno.env.get('CLOUDFLARE_ACCOUNT_ID');
      const apiToken = Deno.env.get('CLOUDFLARE_API_TOKEN');
      if (!accountId || !apiToken) {
        throw new Error('CLOUDFLARE_ACCOUNT_ID or CLOUDFLARE_API_TOKEN secret is not set.');
      }

      const { prompt, usedFallback } = await createImagePrompt(dream, Deno.env.get('GROQ_API_KEY'));
      console.log('Image prompt', { dreamId, usedFallback, prompt });

      const image = await generateImageWithCloudflare(prompt, accountId, apiToken);

      // One folder per dream; the timestamp keeps every file name unique (no stale caches).
      const path = `${dreamId}/${Date.now()}.${image.extension}`;
      const { error: uploadError } = await db.storage.from(BUCKET).upload(path, image.bytes, {
        contentType: image.contentType,
        cacheControl: '31536000', // the file never changes, so phones may cache it for a year
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = db.storage.from(BUCKET).getPublicUrl(path);

      const { data: updatedDream, error: saveError } = await db
        .from('dreams')
        .update({ image_url: publicUrlData.publicUrl, image_status: 'completed' })
        .eq('id', dreamId)
        .select()
        .single();
      if (saveError) throw saveError;

      return Response.json({ dream: updatedDream });
    } catch (error) {
      // Details go to the function logs (Supabase dashboard > Edge Functions > Logs).
      console.error('generate-dream-image failed', error);
      await db.from('dreams').update({ image_status: 'failed' }).eq('id', dreamId);
      return Response.json(
        { error: 'The dream image could not be created right now. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
