import { File } from 'expo-file-system';

import { supabase } from '@/lib/supabase';
import { toReadableError } from '@/services/function-errors';
import type { Dream, DreamDetails } from '@/types/dream';
import type { PatternReading } from '@/utils/patterns';
import type { Ask, Fragment } from '@/utils/today';

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

/** Saves the mood, people and places the dreamer added, and returns the updated dream. */
export async function updateDreamDetails(dreamId: string, details: DreamDetails): Promise<Dream> {
  const { data, error } = await supabase
    .from('dreams')
    .update(details)
    .eq('id', dreamId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  // No row back means the database didn't allow the change (the details migration isn't applied).
  if (!data) throw new Error('Your details couldn’t be saved yet. Please try again later.');
  return data;
}

/** Saves the card colour picked on the Entries screen, and returns the updated dream. */
export async function updateDreamColor(dreamId: string, color: string): Promise<Dream> {
  const { data, error } = await supabase
    .from('dreams')
    .update({ color })
    .eq('id', dreamId)
    .select()
    .maybeSingle();

  if (error) throw new Error(error.message);
  // No row back means the database didn't allow the change (the colour migration isn't applied).
  if (!data) throw new Error('The colour couldn’t be saved yet. Please try again later.');
  return data;
}

/** Deletes a dream for good. */
export async function deleteDream(dreamId: string): Promise<void> {
  const { data, error } = await supabase.from('dreams').delete().eq('id', dreamId).select('id');

  if (error) throw new Error(error.message);
  // Nothing deleted means the database didn't allow it (the delete migration isn't applied).
  if (!data?.length) throw new Error('The dream couldn’t be deleted yet. Please try again later.');
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

/**
 * Asks the `generate-dream-audio` Edge Function (server side) to read the reflection aloud.
 * The function calls Groq Text-to-Speech, stores the WAV file in Supabase Storage,
 * saves its link on the dream, and returns the updated dream.
 */
export async function generateDreamAudio(dreamId: string): Promise<Dream> {
  return invokeDreamFunction(
    'generate-dream-audio',
    dreamId,
    'The audio reflection could not be created. Please try again.'
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

  if (error) throw await toReadableError(error, fallbackMessage);
  if (!data?.dream) {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return data.dream;
}

/**
 * Sends a voice recording to the `transcribe-dream` Edge Function (server side),
 * which uses Groq Whisper, and returns the text. Returns '' if no words were heard.
 * The recording itself is not stored anywhere.
 */
export async function transcribeDreamRecording(fileUri: string): Promise<string> {
  const form = new FormData();
  // Expo's `fetch` needs a real file object (with its bytes) for uploads, so we wrap the
  // recording in expo-file-system's `File`. Its name keeps the extension (e.g. ".m4a").
  form.append('audio', new File(fileUri));

  const { data, error } = await supabase.functions.invoke<{ text: string }>('transcribe-dream', {
    body: form,
  });

  if (error) {
    throw await toReadableError(error, 'We couldn’t turn your recording into text. Please try again.');
  }
  if (typeof data?.text !== 'string') {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return data.text;
}

/**
 * Asks the `dream-fragments` Edge Function (Groq, server side) for the next question on the
 * "talk it through" card, built on the answers so far. Nothing is saved.
 */
export async function askNextFragment(fragments: readonly Fragment[]): Promise<Ask> {
  const { data, error } = await supabase.functions.invoke<Ask>('dream-fragments', {
    body: { mode: 'ask', fragments },
  });

  if (error) throw await toReadableError(error, 'Afterdream lost its train of thought. Please try again.');
  if (typeof data?.question !== 'string' || !Array.isArray(data.suggestions)) {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return { question: data.question, suggestions: data.suggestions.filter((s) => typeof s === 'string') };
}

/** Has the `dream-fragments` Edge Function stitch the answers into one retelling of the dream. */
export async function composeDreamFromFragments(fragments: readonly Fragment[]): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ dream: string }>('dream-fragments', {
    body: { mode: 'compose', fragments },
  });

  if (error) throw await toReadableError(error, 'The pieces couldn’t be put together right now. Please try again.');
  if (typeof data?.dream !== 'string' || !data.dream.trim()) {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return data.dream.trim();
}

/**
 * Asks the `dream-patterns` Edge Function (Groq, server side) to read the newest dreams side
 * by side and find what runs through them. Nothing is saved.
 */
export async function readDreamPatterns(): Promise<PatternReading> {
  const { data, error } = await supabase.functions.invoke<{ reading: PatternReading }>('dream-patterns', {
    body: { mode: 'read', timezoneOffset: new Date().getTimezoneOffset() },
  });

  if (error) throw await toReadableError(error, 'Your patterns couldn’t be read right now. Please try again.');
  const reading = data?.reading;
  if (typeof reading?.thread?.title !== 'string' || !Array.isArray(reading.insights) || !Array.isArray(reading.questions)) {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return reading;
}

/** Has the `dream-patterns` Edge Function answer a question about the dreamer's patterns. */
export async function askDreamPatterns(question: string): Promise<string> {
  const { data, error } = await supabase.functions.invoke<{ answer: string }>('dream-patterns', {
    body: { mode: 'ask', question, timezoneOffset: new Date().getTimezoneOffset() },
  });

  if (error) throw await toReadableError(error, 'Afterdream couldn’t answer that right now. Please try again.');
  if (typeof data?.answer !== 'string' || !data.answer.trim()) {
    throw new Error('The server sent an unexpected answer. Please try again.');
  }
  return data.answer.trim();
}
