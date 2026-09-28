import type { Dream } from '@/types/dream';

import { shortDate } from './today.ts';

function isPainted(dream: Pick<Dream, 'image_status' | 'image_url'>): boolean {
  return dream.image_status === 'completed' && !!dream.image_url;
}

/** The mood shown with a dream: the dreamer's own, or else the AI's guess. */
export function dreamMood(dream: Pick<Dream, 'mood' | 'user_mood'>): string | null {
  const mood = dream.user_mood ?? dream.mood;
  return mood ? mood.toLowerCase() : null;
}

/**
 * The Visualize gallery, newest first: every painted dream, and the ones being painted.
 * `focusId` (a dream opened from its page) is added so it gets painted, once it has been
 * read: the picture is painted from the reading.
 */
export function pickPaintings(dreams: readonly Dream[], focusId?: string | null): Dream[] {
  return dreams
    .filter(
      (dream) =>
        isPainted(dream) || dream.image_status === 'generating' || (dream.id === focusId && dream.analysis_status === 'completed')
    )
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/** Dreams still to be painted, newest first: the list behind "visualize old dream". */
export function unpaintedDreams(dreams: readonly Dream[]): Dream[] {
  return dreams
    .filter((dream) => !isPainted(dream) && dream.image_status !== 'generating')
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

/** Above a painting: "sep 27 • wonder". */
export function cardMeta(dream: Pick<Dream, 'created_at' | 'mood'> & Partial<Pick<Dream, 'user_mood'>>): string {
  const mood = dreamMood({ mood: dream.mood, user_mood: dream.user_mood });
  const day = shortDate(new Date(dream.created_at));
  return mood ? `${day} • ${mood}` : day;
}
