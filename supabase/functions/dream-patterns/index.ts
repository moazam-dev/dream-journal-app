/**
 * Supabase Edge Function: dream-patterns
 *
 * Runs on Supabase's servers, never on the phone, so the Groq API key stays secret.
 * It loads the newest dreams itself, so the app only says when to read. Nothing is saved.
 *
 * The app sends:
 *   POST { "mode": "read", "timezoneOffset": -300 }
 *     →  { "reading": { thread, monthTitle, cast, symbols, question, dreamCount } }
 * `timezoneOffset` is the app's `new Date().getTimezoneOffset()`. See patterns.ts for the prompt.
 */
import { withSupabase } from '@supabase/server';

import { MAX_DREAMS, MIN_DREAMS, readPatterns, readTimezoneOffset } from './patterns.ts';

export default {
  // `auth: 'publishable'` only lets in requests that carry this project's publishable key.
  // `ctx.supabaseAdmin` reads the dreams.
  fetch: withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405 });
    }

    const payload = await req.json().catch(() => null);
    if (payload?.mode !== 'read') {
      return Response.json({ error: 'mode must be "read".' }, { status: 400 });
    }
    const timezoneOffset = readTimezoneOffset(payload?.timezoneOffset);

    const { data: dreams, error: loadError } = await ctx.supabaseAdmin
      .from('dreams')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(MAX_DREAMS);

    if (loadError) {
      console.error('Could not load dreams', loadError);
      return Response.json({ error: 'Could not load your dreams.' }, { status: 500 });
    }
    if (!dreams || dreams.length < MIN_DREAMS) {
      return Response.json({ error: `Tell afterdream at least ${MIN_DREAMS} dreams to see your patterns.` }, { status: 422 });
    }

    try {
      const apiKey = Deno.env.get('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('GROQ_API_KEY secret is not set for this project.');
      }
      return Response.json({ reading: await readPatterns(dreams, apiKey, timezoneOffset) });
    } catch (error) {
      // Full details go to the function logs; the app only gets a friendly message.
      console.error('dream-patterns failed', error);
      return Response.json({ error: 'Your patterns couldn’t be read right now. Please try again.' }, { status: 502 });
    }
  }),
};
