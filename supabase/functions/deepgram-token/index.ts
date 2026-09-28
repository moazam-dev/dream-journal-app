/**
 * Supabase Edge Function: deepgram-token
 *
 * Gives the app a temporary (30-second) Deepgram token for the real-time voice companion.
 * The permanent DEEPGRAM_API_KEY stays here as a Supabase secret and is never returned.
 *
 * The app sends:   POST (no body)
 * We return:       { "access_token": "<temporary JWT>", "expires_in": 30 }
 */
import { withSupabase } from '@supabase/server';

import { createTemporaryToken } from './grant.ts';

export default {
  // Only requests carrying this project's publishable key get in (same as the other functions).
  fetch: withSupabase({ auth: 'publishable' }, async (req) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405 });
    }

    try {
      const apiKey = Deno.env.get('DEEPGRAM_API_KEY');
      if (!apiKey) {
        throw new Error('DEEPGRAM_API_KEY secret is not set for this project.');
      }

      const token = await createTemporaryToken(apiKey);
      return Response.json(token, { headers: { 'Cache-Control': 'no-store' } });
    } catch (error) {
      // Details go to the function logs (Supabase dashboard > Edge Functions > Logs).
      console.error('deepgram-token failed', error);
      return Response.json(
        { error: 'Couldn’t connect to your dream companion. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
