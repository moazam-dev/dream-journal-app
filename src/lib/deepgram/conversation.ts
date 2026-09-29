/**
 * Turns a finished voice conversation into the dream the app saves.
 *
 * Only the dreamer's own words become the dream. `analyze-dream` asks for "the text of one of
 * their own dreams, written in their own words", so the companion's questions are left out:
 * what stays is the dream as they told it, which is also what the Dream screen's transcript
 * tab shows back to them.
 *
 * Plain TypeScript with no React or network in it, so every rule can be unit tested.
 */
import type { TranscriptEntry } from './types';

/** `analyze-dream` keeps only the first 6000 characters, so there is no point sending more. */
export const MAX_DREAM_CHARS = 6000;

/** Below this there isn't enough of a dream to be worth saving and interpreting. */
export const MIN_DREAM_CHARS = 25;

/** The dreamer's side of the conversation, as one piece of text. */
export function dreamTextFromTranscript(entries: readonly TranscriptEntry[]): string {
  const spoken = entries
    .filter((entry) => entry.role === 'user')
    .map((entry) => entry.text.trim())
    .filter((text) => text.length > 0);

  return clamp(spoken.join('\n\n'), MAX_DREAM_CHARS);
}

/** True when they said enough for a dream worth saving. */
export function canSaveTranscript(entries: readonly TranscriptEntry[]): boolean {
  return dreamTextFromTranscript(entries).length >= MIN_DREAM_CHARS;
}

/**
 * Shortens to `limit`, preferring to stop at the end of a sentence and never mid-word.
 * A sentence break is only used when it keeps most of the text, so a single long
 * sentence isn't cut down to almost nothing.
 */
function clamp(text: string, limit: number): string {
  if (text.length <= limit) return text;

  const cut = text.slice(0, limit);
  const sentenceEnd = Math.max(
    cut.lastIndexOf('. '),
    cut.lastIndexOf('! '),
    cut.lastIndexOf('? '),
    cut.lastIndexOf('\n')
  );
  if (sentenceEnd > limit * 0.6) return cut.slice(0, sentenceEnd + 1).trim();

  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trim();
}
