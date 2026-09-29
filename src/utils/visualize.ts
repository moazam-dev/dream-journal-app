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

export type PaintingRow = { key: 'week' | 'month' | 'earlier'; title: string; dreams: Dream[] };

/**
 * The gallery split into rows: this week (monday to today), the rest of this month, and
 * anything older. The week row is always there (it ends with "your next dream"); the
 * others only when they have something in them.
 */
export function paintingRows(paintings: readonly Dream[], now: Date): PaintingRow[] {
  // getDay() is 0 on sunday; step back to this week's monday.
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7)).getTime();
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
  const rows: PaintingRow[] = [
    { key: 'week', title: 'this week', dreams: [] },
    { key: 'month', title: 'this month', dreams: [] },
    { key: 'earlier', title: 'earlier', dreams: [] },
  ];
  for (const dream of paintings) {
    const told = new Date(dream.created_at).getTime();
    rows[told >= monday ? 0 : told >= monthStart ? 1 : 2].dreams.push(dream);
  }
  return rows.filter((row) => row.key === 'week' || row.dreams.length > 0);
}

/** Above a painting: "sep 27 • wonder". */
export function cardMeta(dream: Pick<Dream, 'created_at' | 'mood'> & Partial<Pick<Dream, 'user_mood'>>): string {
  const mood = dreamMood({ mood: dream.mood, user_mood: dream.user_mood });
  const day = shortDate(new Date(dream.created_at));
  return mood ? `${day} • ${mood}` : day;
}
