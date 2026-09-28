import { supabase } from '@/lib/supabase';
import { toReadableError } from '@/services/function-errors';

/**
 * Gets a temporary (30-second) Deepgram token from the `deepgram-token` Edge Function.
 * The permanent Deepgram key never leaves the server.
 */
export async function fetchDeepgramToken(): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ access_token: string }>(
    'deepgram-token',
    { method: 'POST' }
  );

  if (error) {
    throw await toReadableError(error, 'Couldn’t connect to your dream companion.');
  }
  if (typeof data?.access_token !== 'string' || data.access_token === '') {
    throw new Error('Couldn’t connect to your dream companion.');
  }
  return data.access_token;
}
