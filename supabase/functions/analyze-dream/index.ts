/**
 * Supabase Edge Function: analyze-dream
 *
 * Runs on Supabase's servers, never on the phone, so the Groq API key stays secret.
 *
 * 1. The app sends:          POST { "dreamId": "<uuid>" }
 * 2. We load that dream from the database.
 * 3. We ask Groq for a reflection, and who and where the dream was about (see analysis.ts).
 * 4. We save the result on the same row and return the updated dream.
 * If the AI step fails, the dream is kept and marked analysis_status = 'failed'.
 */
import { withSupabase } from '@supabase/server';

import { analyzeDreamWithGroq, mergeNames } from './analysis.ts';

export default {
  // `auth: 'publishable'` only lets in requests that carry this project's publishable key
  // (the one in the app's .env.local). `ctx.supabaseAdmin` can write to the database.
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

    // Already done: return it as-is instead of paying for a second Groq call.
    if (dream.analysis_status === 'completed') {
      return Response.json({ dream });
    }

    try {
      const apiKey = Deno.env.get('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('GROQ_API_KEY secret is not set for this project.');
      }

      const { people, places, ...analysis } = await analyzeDreamWithGroq(dream.dream_text, apiKey);

      const { data: updatedDream, error: saveError } = await db
        .from('dreams')
        .update({
          ...analysis,
          // Who and where the dream was about, added to anything the dreamer already typed.
          people: mergeNames(dream.people, people),
          places: mergeNames(dream.places, places),
          analysis_status: 'completed',
        })
        .eq('id', dreamId)
        .select()
        .single();

      if (saveError) throw saveError;
      return Response.json({ dream: updatedDream });
    } catch (error) {
      // Full details go to the function logs (Supabase dashboard > Edge Functions > Logs),
      // the app only gets a friendly message.
      console.error('analyze-dream failed', error);
      await db.from('dreams').update({ analysis_status: 'failed' }).eq('id', dreamId);
      return Response.json(
        { error: 'The AI reflection could not be created right now. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
