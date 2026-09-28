import type { Dream } from '@/types/dream';

import { shortDate } from './today.ts';

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

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

/** The line under "this week". */
export function visualizeIntro(paintings: readonly Dream[], now: Date): string {
  const painted = paintings.filter(isPainted);
  if (painted.length === 0) return 'nothing painted yet. tap + and tell afterdream a dream — it’ll be painted here.';
  const week = painted.filter((dream) => now.getTime() - new Date(dream.created_at).getTime() < WEEK_MS).length;
  if (week === 0) return 'nothing new painted this week. swipe to wander back, or tap + to paint a new one.';
  return `${week} dream${week === 1 ? '' : 's'} painted from your own words. swipe to wander back through them, or tap + to paint a new one.`;
}

/** Above a painting: "sep 27 • wonder". */
export function cardMeta(dream: Pick<Dream, 'created_at' | 'mood'> & Partial<Pick<Dream, 'user_mood'>>): string {
  const mood = dreamMood({ mood: dream.mood, user_mood: dream.user_mood });
  const day = shortDate(new Date(dream.created_at));
  return mood ? `${day} • ${mood}` : day;
}
