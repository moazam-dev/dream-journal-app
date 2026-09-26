/**
 * Supabase Edge Function: generate-dream-audio
 *
 * Runs on Supabase's servers, so the Groq API key never reaches the phone.
 *
 * 1. The app sends:              POST { "dreamId": "<uuid>" }
 * 2. We load the dream and its existing Groq `reflection` (no new interpretation).
 * 3. Groq Text-to-Speech reads the reflection aloud (speech.ts).
 * 4. We upload the WAV file to the `dream-audio` Storage bucket.
 * 5. We save the public link in dreams.audio_url and return the updated dream.
 * If anything fails, the dream is kept and marked audio_status = 'failed'.
 */
import { withSupabase } from '@supabase/server';

import { createReflectionAudio, wavDurationSeconds } from './speech.ts';

const BUCKET = 'dream-audio';

export default {
  // Only requests carrying this project's publishable key get in (same as the other functions).
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

    // Already made: return it instead of generating (and paying for) it again.
    if (dream.audio_status === 'completed' && dream.audio_url) {
      return Response.json({ dream });
    }
    // We only ever read out the existing Groq reflection.
    if (dream.analysis_status !== 'completed' || !dream.reflection) {
      return Response.json(
        { error: 'The dream needs its AI reflection before it can be read aloud.' },
        { status: 409 }
      );
    }

    await db.from('dreams').update({ audio_status: 'generating' }).eq('id', dreamId);

    try {
      const apiKey = Deno.env.get('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('GROQ_API_KEY secret is not set for this project.');
      }

      const wav = await createReflectionAudio(dream.reflection, apiKey);
      console.log('Reflection audio created', {
        dreamId,
        seconds: Math.round(wavDurationSeconds(wav)),
        bytes: wav.length,
      });

      // One folder per dream; the timestamp keeps every file name unique (no stale caches).
      const path = `${dreamId}/${Date.now()}.wav`;
      const { error: uploadError } = await db.storage.from(BUCKET).upload(path, wav, {
        contentType: 'audio/wav',
        cacheControl: '31536000', // the file never changes, so phones may cache it for a year
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { data: publicUrlData } = db.storage.from(BUCKET).getPublicUrl(path);

      const { data: updatedDream, error: saveError } = await db
        .from('dreams')
        .update({ audio_url: publicUrlData.publicUrl, audio_status: 'completed' })
        .eq('id', dreamId)
        .select()
        .single();
      if (saveError) throw saveError;

      return Response.json({ dream: updatedDream });
    } catch (error) {
      // Details go to the function logs (Supabase dashboard > Edge Functions > Logs).
      console.error('generate-dream-audio failed', error);
      await db.from('dreams').update({ audio_status: 'failed' }).eq('id', dreamId);
      return Response.json(
        { error: 'The audio reflection could not be created right now. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
