import { FunctionsHttpError } from '@supabase/supabase-js';

/** Turns an Edge Function error into an Error with a message we can show to the user. */
export async function toReadableError(error: unknown, fallbackMessage: string) {
  // For HTTP errors our functions send back { error: "friendly message" }.
  if (error instanceof FunctionsHttpError) {
    const body = await error.context.json().catch(() => null);
    return new Error(body?.error ?? fallbackMessage);
  }
  // Network or request problem: log the real cause in the Expo terminal for debugging.
  console.warn('Edge Function request failed:', error, (error as { context?: unknown })?.context);
  return new Error('Could not reach the server. Check your connection and try again.');
}
