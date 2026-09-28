/**
 * Supabase Edge Function: dream-patterns
 *
 * Runs on Supabase's servers, never on the phone, so the Groq API key stays secret.
 * It loads the newest dreams itself, so the app only says what it wants. Nothing is saved.
 *
 * The app sends one of:
 *   POST { "mode": "read", "timezoneOffset": -300 }                       →  { "reading": { thread, insights, questions, dreamCount } }
 *   POST { "mode": "ask",  "timezoneOffset": -300, "question": "…?" }     →  { "answer" }
 * `timezoneOffset` is the app's `new Date().getTimezoneOffset()`. See patterns.ts for the prompts.
 */
import { withSupabase } from '@supabase/server';

import { askAboutPatterns, MAX_DREAMS, MIN_DREAMS, readPatterns, readQuestion, readTimezoneOffset } from './patterns.ts';

export default {
  // `auth: 'publishable'` only lets in requests that carry this project's publishable key.
  // `ctx.supabaseAdmin` reads the dreams.
  fetch: withSupabase({ auth: 'publishable' }, async (req, ctx) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405 });
    }

    const payload = await req.json().catch(() => null);
    const mode = payload?.mode;
    if (mode !== 'read' && mode !== 'ask') {
      return Response.json({ error: 'mode must be "read" or "ask".' }, { status: 400 });
    }

    let question = '';
    if (mode === 'ask') {
      try {
        question = readQuestion(payload?.question);
      } catch (error) {
        return Response.json({ error: (error as Error).message }, { status: 400 });
      }
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

      if (mode === 'read') {
        return Response.json({ reading: await readPatterns(dreams, apiKey, timezoneOffset) });
      }
      return Response.json({ answer: await askAboutPatterns(dreams, question, apiKey, timezoneOffset) });
    } catch (error) {
      // Full details go to the function logs; the app only gets a friendly message.
      console.error(`dream-patterns (${mode}) failed`, error);
      return Response.json(
        { error: mode === 'read' ? 'Your patterns couldn’t be read right now. Please try again.' : 'Afterdream couldn’t answer that right now. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
