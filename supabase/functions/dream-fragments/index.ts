/**
 * Supabase Edge Function: dream-fragments
 *
 * Runs on Supabase's servers, never on the phone, so the Groq API key stays secret.
 * Nothing is saved here: the app saves the finished dream itself, then calls analyze-dream.
 *
 * The app sends one of:
 *   POST { "mode": "ask",     "fragments": [{ "question", "answer" }, …] }  →  { "question", "suggestions" }
 *   POST { "mode": "compose", "fragments": [{ "question", "answer" }, …] }  →  { "dream" }
 * See fragments.ts for the prompts.
 */
import { withSupabase } from '@supabase/server';

import { askNextQuestion, composeDream, readFragments } from './fragments.ts';

export default {
  // `auth: 'publishable'` only lets in requests that carry this project's publishable key.
  fetch: withSupabase({ auth: 'publishable' }, async (req) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405 });
    }

    const payload = await req.json().catch(() => null);
    const mode = payload?.mode;
    if (mode !== 'ask' && mode !== 'compose') {
      return Response.json({ error: 'mode must be "ask" or "compose".' }, { status: 400 });
    }

    let fragments;
    try {
      // Asking the first question needs no answers yet; composing needs at least one.
      fragments = readFragments(payload?.fragments, { allowEmpty: mode === 'ask' });
    } catch (error) {
      return Response.json({ error: (error as Error).message }, { status: 400 });
    }

    try {
      const apiKey = Deno.env.get('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('GROQ_API_KEY secret is not set for this project.');
      }

      if (mode === 'ask') {
        return Response.json(await askNextQuestion(fragments, apiKey));
      }
      return Response.json({ dream: await composeDream(fragments, apiKey) });
    } catch (error) {
      // Full details go to the function logs; the app only gets a friendly message.
      console.error(`dream-fragments (${mode}) failed`, error);
      return Response.json(
        { error: mode === 'ask' ? 'Afterdream lost its train of thought. Please try again.' : 'The pieces couldn’t be put together right now. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
