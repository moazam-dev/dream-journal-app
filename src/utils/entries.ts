import type { Dream } from '@/types/dream';

import { dateKey, shortDate, wordCount } from './today.ts';
import { dreamMood } from './visualize.ts';

const WEEKDAYS = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'];
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
  return MOOD_COLORS[moodHash(mood) % MOOD_COLORS.length];
}

function moodHash(mood: string): number {
  let hash = 0;
  for (const ch of mood.toLowerCase()) hash = (hash * 31 + ch.charCodeAt(0)) % 9973;
  return hash;
}

/** The card colours a dream can have on the Entries screen: two soft stops each. */
export const DREAM_COLORS = {
  lime: ['#E2EB98', '#B8E6C4'],
  peach: ['#F2B8A0', '#F2A8C4'],
  lilac: ['#C9B8F2', '#A8D8F0'],
  sky: ['#A8D8F0', '#B8E6C4'],
  rose: ['#F2A8C4', '#C9B8F2'],
  dusk: ['#E2EB98', '#F2B8A0'],
} as const;
export type DreamColor = keyof typeof DREAM_COLORS;
export const DREAM_COLOR_NAMES = Object.keys(DREAM_COLORS) as DreamColor[];

function isDreamColor(value: string | null | undefined): value is DreamColor {
  return !!value && Object.hasOwn(DREAM_COLORS, value);
}

/** A dream's card colour: the one the dreamer picked, or else one kept for its mood (lime without one). */
export function dreamColor(dream: Pick<Dream, 'mood'> & Partial<Pick<Dream, 'user_mood' | 'color'>>): DreamColor {
  if (isDreamColor(dream.color)) return dream.color;
  const mood = dreamMood({ mood: dream.mood, user_mood: dream.user_mood });
  return mood ? DREAM_COLOR_NAMES[moodHash(mood) % DREAM_COLOR_NAMES.length] : 'lime';
}

/** The colour as a background style: the gradient, over its first stop where gradients don't draw (web). */
export function colorFill(color: DreamColor) {
  const [from, to] = DREAM_COLORS[color];
  return { backgroundColor: from, experimental_backgroundImage: `linear-gradient(135deg, ${from}, ${to})` };
}

/** The line a dream is known by: its title, or else how it starts. Lower-case, on one line. */
export function dreamHeadline(dream: Pick<Dream, 'title' | 'dream_text'>): string {
  const text = dream.title?.trim() || dream.dream_text;
  return text.replace(/\s+/g, ' ').trim().toLowerCase();
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

export type WeekDay = { letter: string; logged: boolean; today: boolean };

const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** This week, monday to sunday, with the days a dream was told marked. */
export function weekDays(dreams: readonly Pick<Dream, 'created_at'>[], now: Date): WeekDay[] {
  const days = new Set(dreams.map((dream) => dateKey(new Date(dream.created_at))));
  const today = dateKey(now);
  // getDay() is 0 on sunday; step back to this week's monday.
  const monday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  return WEEK_LETTERS.map((letter, i) => {
    const key = dateKey(new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() + i));
    return { letter, logged: days.has(key), today: key === today };
  });
}

/** "☾ 9 nights in a row", or nothing without a streak. */
export function streakLabel(streak: number): string | null {
  if (streak <= 0) return null;
  return streak === 1 ? '☾ 1 night in a row' : `☾ ${streak} nights in a row`;
}

/** The line under the title: "12 dreams this month". */
export function monthStats(dreams: readonly Pick<Dream, 'created_at'>[], now: Date): string {
  const count = dreams.filter((dream) => {
    const told = new Date(dream.created_at);
    return told.getFullYear() === now.getFullYear() && told.getMonth() === now.getMonth();
  }).length;
  return `${count} dream${count === 1 ? '' : 's'} this month`;
}

/** A history row's date: "sun, sep 27". */
export function rowDate(dream: Pick<Dream, 'created_at'>): string {
  const told = new Date(dream.created_at);
  return `${WEEKDAYS[told.getDay()]}, ${shortDate(told)}`;
}

/** The line under a dream's page title: "sun, sep 27 · 7:05 am · 142 words". */
export function toldAt(dream: Pick<Dream, 'created_at' | 'dream_text'>): string {
  const told = new Date(dream.created_at);
  const hour = told.getHours() % 12 || 12;
  const time = `${hour}:${String(told.getMinutes()).padStart(2, '0')} ${told.getHours() < 12 ? 'am' : 'pm'}`;
  const words = wordCount(dream.dream_text);
  return `${rowDate(dream)} · ${time} · ${words} word${words === 1 ? '' : 's'}`;
}

/** Where a dream's reading is: done, being read now, never read, or failed (it can be tried again). */
export type AnalysisState = 'ready' | 'reading' | 'unread' | 'failed';

export function analysisState(dream: Pick<Dream, 'analysis_status'>, reading: boolean): AnalysisState {
  if (reading) return 'reading';
  if (dream.analysis_status === 'completed') return 'ready';
  return dream.analysis_status === 'failed' ? 'failed' : 'unread';
}

/** One day in the Entries calendar, with the newest dream told that day (if any). */
export type CalendarDay = { key: string; day: number; dream: Dream | null; today: boolean; future: boolean };

function calendarDay(date: Date, byKey: Map<string, Dream>, now: Date): CalendarDay {
  const key = dateKey(date);
  const today = dateKey(now);
  return { key, day: date.getDate(), dream: byKey.get(key) ?? null, today: key === today, future: key > today };
}

function newestByDay(dreams: readonly Dream[]): Map<string, Dream> {
  const byKey = new Map<string, Dream>();
  for (const dream of dreams) {
    const key = dateKey(new Date(dream.created_at));
    const current = byKey.get(key);
    if (!current || current.created_at < dream.created_at) byKey.set(key, dream);
  }
  return byKey;
}

/** This month, sunday first: a blank (null) for each cell before the 1st, then every day. */
export function calendarMonth(dreams: readonly Dream[], now: Date): (CalendarDay | null)[] {
  const byKey = newestByDay(dreams);
  const { lead, days } = monthGrid(now.getFullYear(), now.getMonth());
  const cells: (CalendarDay | null)[] = Array.from({ length: lead }, () => null);
  for (let d = 1; d <= days; d++) cells.push(calendarDay(new Date(now.getFullYear(), now.getMonth(), d), byKey, now));
  return cells;
}

/** This week, sunday to saturday (spilling into the next or last month when it has to). */
export function calendarWeek(dreams: readonly Dream[], now: Date): CalendarDay[] {
  const byKey = newestByDay(dreams);
  const sunday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay());
  return Array.from({ length: 7 }, (_, i) =>
    calendarDay(new Date(sunday.getFullYear(), sunday.getMonth(), sunday.getDate() + i), byKey, now)
  );
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
