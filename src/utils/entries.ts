import type { Dream } from '@/types/dream';

import { dateKey, shortDate } from './today.ts';

const MONTHS_LONG = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Most cards the fan holds, newest first. */
export const MAX_FAN = 12;
/** Most "written, not yet seen" notes in the row. */
export const MAX_NOTES = 12;

/** Soft colours for mood tags, picked by the mood's name so a mood keeps its colour. */
export const MOOD_COLORS = ['#F2B8A0', '#E2EB98', '#C9B8F2', '#A8D8F0', '#F2A8C4', '#B8E6C4'] as const;

/** A dream is "seen" once its picture has been painted. */
export function isSeen(dream: Pick<Dream, 'image_status' | 'image_url'>): boolean {
  return dream.image_status === 'completed' && !!dream.image_url;
}

/** The colour for a mood (lime when there is none). */
export function moodColor(mood: string | null | undefined): string {
  if (!mood) return MOOD_COLORS[1];
  let hash = 0;
  for (const ch of mood.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return MOOD_COLORS[hash % MOOD_COLORS.length];
}

/** Month name, lower-case: "september". */
export function monthName(date: Date): string {
  return MONTHS_LONG[date.getMonth()];
}

/** How the month's calendar is laid out: blank cells before the 1st, and the number of days. */
export function monthGrid(year: number, month: number) {
  return { lead: new Date(year, month, 1).getDay(), days: new Date(year, month + 1, 0).getDate() };
}

/** The newest dream told on each day of the given month, by day of the month. */
export function dreamsByDay(dreams: readonly Dream[], year: number, month: number): Map<number, Dream> {
  const byDay = new Map<number, Dream>();
  for (const dream of dreams) {
    const told = new Date(dream.created_at);
    if (told.getFullYear() !== year || told.getMonth() !== month) continue;
    const current = byDay.get(told.getDate());
    if (!current || new Date(current.created_at) < told) byDay.set(told.getDate(), dream);
  }
  return byDay;
}

/**
 * Nights in a row with a dream, counting back from today (or from yesterday, when
 * today's dream hasn't been told yet).
 */
export function nightStreak(dreams: readonly Pick<Dream, 'created_at'>[], now: Date): number {
  const days = new Set(dreams.map((dream) => dateKey(new Date(dream.created_at))));
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (!days.has(dateKey(day))) day.setDate(day.getDate() - 1);
  let streak = 0;
  while (days.has(dateKey(day))) {
    streak += 1;
    day.setDate(day.getDate() - 1);
  }
  return streak;
}

/** "☾ 9 nights in a row", or nothing without a streak. */
export function streakLabel(streak: number): string | null {
  if (streak <= 0) return null;
  return streak === 1 ? '☾ 1 night in a row' : `☾ ${streak} nights in a row`;
}

/** The line under the title: "12 dreams this month · 8 seen". */
export function monthStats(dreams: readonly Dream[], now: Date): string {
  const month = dreams.filter((dream) => {
    const told = new Date(dream.created_at);
    return told.getFullYear() === now.getFullYear() && told.getMonth() === now.getMonth();
  });
  const seen = month.filter(isSeen).length;
  return `${month.length} dream${month.length === 1 ? '' : 's'} this month · ${seen} seen`;
}

/** The dream's date on a card: "sep 27". */
export function entryDate(dream: Pick<Dream, 'created_at'>): string {
  return shortDate(new Date(dream.created_at));
}

/** The note row's count: "4 notes · tap to read". */
export function notesLabel(count: number): string {
  return `${count} note${count === 1 ? '' : 's'} · tap to read`;
}

/** Keeps the fan's position inside its cards (a little past the ends while dragging). */
export function clampFan(offset: number, count: number, overscroll = 0): number {
  'worklet';
  return Math.max(0 - overscroll, Math.min(Math.max(0, count - 1) + overscroll, offset));
}

/**
 * Where a fan card sits, `rel` cards away from the middle one: turned outward, the
 * middle one lifted and a little bigger, the far ones dimmed and then hidden.
 */
export function fanCard(rel: number) {
  'worklet';
  const a = Math.abs(rel);
  const near = Math.max(0, 1 - a);
  return {
    rotate: rel * 9,
    lift: near > 0 ? -near * 22 : 0,
    scale: 1 + near * 0.06,
    opacity: a > 3.2 ? 0 : 1,
    dim: a < 0.5 ? 0 : 1 - Math.max(0.45, 1 - a * 0.22),
    z: 100 - Math.round(a * 10),
  };
}
