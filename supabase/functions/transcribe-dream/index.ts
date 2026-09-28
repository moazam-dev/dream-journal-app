/**
 * Supabase Edge Function: transcribe-dream
 *
 * Runs on Supabase's servers, so the Groq API key never reaches the phone.
 *
 * 1. The app sends the voice recording as form data (field name "audio").
 * 2. We check it and pass it to Groq Whisper (transcription.ts).
 * 3. We return { "text": "..." }. Nothing is stored: the recording is discarded,
 *    and the user can edit the text before saving the dream as usual.
 */
import { withSupabase } from '@supabase/server';

import { checkAudioFile, transcribeWithGroq, UserFacingError } from './transcription.ts';

export default {
  // Only requests carrying this project's publishable key get in (same as the other functions).
  fetch: withSupabase({ auth: 'publishable' }, async (req) => {
    if (req.method !== 'POST') {
      return Response.json({ error: 'Use POST.' }, { status: 405 });
    }

    try {
      const form = await req.formData().catch(() => {
        throw new UserFacingError('The recording could not be read. Please try again.', 400);
      });
      const audio = checkAudioFile(form.get('audio'));

      const apiKey = Deno.env.get('GROQ_API_KEY');
      if (!apiKey) {
        throw new Error('GROQ_API_KEY secret is not set for this project.');
      }

      const text = await transcribeWithGroq(audio, audio.name, apiKey);
      console.log('Transcribed recording', { bytes: audio.size, characters: text.length });
      return Response.json({ text });
    } catch (error) {
      if (error instanceof UserFacingError) {
        return Response.json({ error: error.message }, { status: error.status });
      }
      // Details go to the function logs (Supabase dashboard > Edge Functions > Logs).
      console.error('transcribe-dream failed', error);
      return Response.json(
        { error: 'We couldn’t turn your recording into text right now. Please try again.' },
        { status: 502 }
      );
    }
  }),
};
