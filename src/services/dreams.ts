import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import type { Dream } from '@/types/dream';

/**
 * All database work for dreams lives here, so screens never talk to Supabase directly.
 * Each function either returns data or throws an Error with a readable message.
 */

/** Saves a new dream and returns the saved row (including its new `id`). */
export async function createDream(dreamText: string): Promise<Dream> {
  const { data, error } = await supabase
    .from('dreams')
    .insert({ dream_text: dreamText.trim() })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}

/** Returns every dream, newest first. */
export async function fetchDreams(): Promise<Dream[]> {
  const { data, error } = await supabase
    .from('dreams')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

/** Returns one dream, or `null` if no dream has that id. */
export async function fetchDreamById(id: string): Promise<Dream | null> {
  const { data, error } = await supabase.from('dreams').select('*').eq('id', id).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

/**
 * Asks the `analyze-dream` Edge Function (server side) to create the AI reflection.
 * The function calls Groq, saves the result on the dream, and returns the updated dream.
 */
export async function analyzeDream(dreamId: string): Promise<Dream> {
  return invokeDreamFunction(
    'analyze-dream',
    dreamId,
    'The AI reflection could not be created. Please try again.'
  );
}

/**
 * Asks the `generate-dream-image` Edge Function (server side) to paint the dream.
 * The function calls Cloudflare Workers AI, stores the image in Supabase Storage,
 * saves its link on the dream, and returns the updated dream.
 */
export async function generateDreamImage(dreamId: string): Promise<Dream> {
  return invokeDreamFunction(
    'generate-dream-image',
    dreamId,
    'The dream image could not be created. Please try again.'
  );
}

/** Calls one of our Edge Functions with `{ dreamId }` and returns the updated dream it sends back. */
async function invokeDreamFunction(
  functionName: string,
  dreamId: string,
  fallbackMessage: string
): Promise<Dream> {
  const { data, error } = await supabase.functions.invoke<{ dream: Dream }>(functionName, {
    body: { dreamId },
  });

  if (error) {
    // For HTTP errors the function sends back { error: "friendly message" }.
    if (error instanceof FunctionsHttpError) {
      const body = await error.context.json().catch(() => null);
      throw new Error(body?.error ?? fallbackMessage);
    }
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  if (!data?.dream) {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return data.dream;
}
