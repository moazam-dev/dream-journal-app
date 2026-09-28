import type { Dream } from '@/types/dream';

import { entryDate } from './entries.ts';
import { dateKey, shortDate } from './today.ts';
import { dreamMood } from './visualize.ts';

/** Colours for ranked things (themes, people), strongest first. From the Patterns design. */
export const PATTERN_COLORS = ['#E2EB98', '#F2B8A0', '#A8D8F0', '#C9B8F2', '#B8E6C4'] as const;
/** Colours for the four most common moods, most common first. */
export const MOOD_KEY_COLORS = ['#B8E6C4', '#E2EB98', '#F2B8A0', '#C9B8F2'] as const;
/** Bars for any other mood (or a dream without one). */
export const OTHER_MOOD_COLOR = 'rgba(255,255,255,0.5)';

/** "Your month in dreams" looks back this many nights. */
export const RECENT_NIGHTS = 30;
/** The mood chart shows this many nights. */
export const MOOD_NIGHTS = 28;
/** Dive deeper reads at most this many of the newest dreams (the server's limit). */
export const MAX_READ_DREAMS = 30;
/** Dive deeper needs at least this many dreams (the server refuses fewer). */
export const MIN_READING_DREAMS = 3;

/** Labels for the three insights, in the order the server sends them. */
export const INSIGHT_LABELS = ['what keeps coming back', 'when it shifts', 'a question to sit with'] as const;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const WEEK_LETTERS = ['m', 't', 'w', 't', 'f', 's', 's'];
const DAY_MS = 86_400_000;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

/** Whole nights between the dream and today (0 for a dream told today). */
function nightsAgo(dream: Pick<Dream, 'created_at'>, now: Date): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(new Date(dream.created_at)).getTime()) / DAY_MS);
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The header's date: "sunday, sep 28". */
export function patternsDate(now: Date): string {
  return `${WEEKDAYS[now.getDay()]}, ${shortDate(now)}`;
}

/** Dreams told in the last `nights` nights, including today (newest first, as given). */
export function recentDreams(dreams: readonly Dream[], now: Date, nights = RECENT_NIGHTS): Dream[] {
  return dreams.filter((dream) => {
    const ago = nightsAgo(dream, now);
    return ago >= 0 && ago < nights;
  });
}

export type Tally = { name: string; count: number };

/**
 * How many dreams each name shows up in (once per dream, ignoring case), most first.
 * Ties keep the order they were first seen in, so the newest dream wins.
 */
export function tally(lists: readonly (readonly string[] | null | undefined)[]): Tally[] {
  const counts = new Map<string, number>();
  for (const list of lists) {
    const names = new Set((list ?? []).map((name) => name.trim().toLowerCase()).filter(Boolean));
    for (const name of names) counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return [...counts].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export type Theme = Tally & { color: string; note: string };

/** The themes on the "on your mind lately" card, each with a short note about it. */
export function topThemes(dreams: readonly Dream[], max = 5): Theme[] {
  return tally(dreams.map((dream) => dream.themes)).slice(0, max).map((theme, i) => {
    const withTheme = dreams.filter((dream) => dream.themes?.some((t) => t.trim().toLowerCase() === theme.name));
    return { ...theme, color: PATTERN_COLORS[i % PATTERN_COLORS.length], note: themeNote(withTheme) };
  });
}

/** "last showed up sep 24. these dreams mostly felt calm." */
export function themeNote(withTheme: readonly Dream[]): string {
  const newest = withTheme[0];
  if (!newest) return '';
  const mood = tally(withTheme.map((dream) => [dreamMood(dream) ?? ''].filter(Boolean)))[0]?.name;
  if (withTheme.length === 1) {
    return `showed up once, on ${entryDate(newest)}${mood ? `, feeling ${mood}` : ''}.`;
  }
  return `last showed up ${entryDate(newest)}.${mood ? ` these dreams mostly felt ${mood}.` : ''}`;
}

export type WeekNight = {
  key: number;
  /** "m", "t", … */
  day: string;
  caught: boolean;
  /** The richest dream of the week so far (glows lime). */
  best: boolean;
  height: number;
};

/** This week, Monday to Sunday: which nights had a dream, and how much of one. */
export function weekNights(dreams: readonly Dream[], now: Date) {
  const today = (now.getDay() + 6) % 7;
  const monday = addDays(now, -today);
  const longest = new Map<string, number>();
  for (const dream of dreams) {
    const key = dateKey(new Date(dream.created_at));
    longest.set(key, Math.max(longest.get(key) ?? 0, words(dream.dream_text)));
  }

  const nights: WeekNight[] = WEEK_LETTERS.map((day, i) => {
    const count = i <= today ? longest.get(dateKey(addDays(monday, i))) : undefined;
    const caught = count !== undefined;
    return { key: i, day, caught, best: false, height: caught ? 36 + Math.min(56, Math.round(count / 3)) : 16 };
  });
  const richest = nights.reduce<WeekNight | null>((top, night) => (night.caught && (!top || night.height > top.height) ? night : top), null);
  if (richest) richest.best = true;

  return { nights, caught: nights.filter((night) => night.caught).length, elapsed: today + 1 };
}

/** "5 of 7 nights caught". */
export function weekLabel(caught: number, elapsed: number): string {
  return `${caught} of ${elapsed} night${elapsed === 1 ? '' : 's'} caught`;
}

/** The longest run of nights in a row with a dream, ever. */
export function bestStreak(dreams: readonly Pick<Dream, 'created_at'>[]): number {
  const days = [...new Set(dreams.map((dream) => dateKey(new Date(dream.created_at))))].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of days) {
    const [year, month, day] = key.split('-').map(Number);
    const date = new Date(year, month - 1, day);
    run = previous && dateKey(addDays(previous, 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
}

/** Under "best ever": how far the current streak is from it. */
export function bestLine(streak: number, best: number): string {
  if (best <= 0) return 'start one tonight';
  if (streak >= best) return 'your best run yet';
  const left = best - streak;
  return `${left} more to beat it`;
}

export type MoodNight = {
  key: number;
  mood: string | null;
  /** Whether a dream was told that night. */
  told: boolean;
  weekday: number;
  color: string;
  height: number;
};

export type MoodKey = { name: string; pct: number; color: string };

/**
 * The last `count` nights, oldest first, each with the mood of its newest dream, plus the
 * four most common moods (with their share of the nights that had a mood).
 */
export function moodNights(dreams: readonly Dream[], now: Date, count = MOOD_NIGHTS) {
  const byNight = new Map<string, Dream>();
  // Dreams come newest first, so the first one seen for a night is its newest.
  for (const dream of dreams) {
    const key = dateKey(new Date(dream.created_at));
    if (!byNight.has(key)) byNight.set(key, dream);
  }

  const days = Array.from({ length: count }, (_, i) => addDays(now, i - count + 1));
  const told = days.map((day) => byNight.get(dateKey(day)) ?? null);
  const moods = told.map((dream) => (dream ? dreamMood(dream) : null));
  // Newest first, so a tie goes to the mood felt most recently.
  const counted = tally([...moods].reverse().map((mood) => (mood ? [mood] : [])));
  const withMood = moods.filter(Boolean).length;
  const legend: MoodKey[] = counted.slice(0, MOOD_KEY_COLORS.length).map((mood, i) => ({
    name: mood.name,
    pct: Math.round((mood.count / withMood) * 100),
    color: MOOD_KEY_COLORS[i],
  }));

  const nights: MoodNight[] = days.map((day, i) => {
    const dream = told[i];
    const mood = moods[i];
    return {
      key: i,
      mood,
      told: !!dream,
      weekday: day.getDay(),
      color: legend.find((key) => key.name === mood)?.color ?? (dream ? OTHER_MOOD_COLOR : 'rgba(255,255,255,0.2)'),
      height: dream ? 36 + Math.min(44, Math.round(words(dream.dream_text) / 3)) : 10,
    };
  });

  return { nights, legend, from: shortDate(days[0]) };
}

export type HeadlinePart = { text: string; color?: string };

/** "mostly calm, with uneasy sundays." — with the moods in their colours. */
export function moodHeadline(nights: readonly MoodNight[], legend: readonly MoodKey[]): HeadlinePart[] | null {
  const [first, second] = legend;
  if (!first) return null;
  const lead = [{ text: 'mostly ' }, { text: first.name, color: first.color }];
  if (!second) return [...lead, { text: '.' }];

  const weekdays = new Array(7).fill(0);
  for (const night of nights) if (night.mood === second.name) weekdays[night.weekday] += 1;
  const top = Math.max(...weekdays);
  if (top >= 2) {
    const weekday = WEEKDAYS[weekdays.indexOf(top)];
    return [...lead, { text: ', with ' }, { text: `${second.name} ${weekday}s`, color: second.color }, { text: '.' }];
  }
  return [...lead, { text: ', sometimes ' }, { text: second.name, color: second.color }, { text: '.' }];
}

export type Figure = { name: string; initial: string; count: number; color: string; label: string };

/** The people who show up most, with an initial for their bubble ("?" for strangers). */
export function dreamPeople(dreams: readonly Dream[], max = 3): Figure[] {
  const colors = [PATTERN_COLORS[1], PATTERN_COLORS[3], PATTERN_COLORS[2]];
  return tally(dreams.map((dream) => dream.people)).slice(0, max).map((person, i) => ({
    ...person,
    initial: /stranger|someone|somebody|unknown|nobody|faceless/.test(person.name)
      ? '?'
      : (person.name.match(/[\p{L}\p{N}]/u)?.[0] ?? '?').toUpperCase(),
    color: colors[i % colors.length],
    label: `${person.count} dream${person.count === 1 ? '' : 's'}`,
  }));
}

/** Places and smaller themes that keep showing up (the big themes have their own card). */
export function dreamSymbols(dreams: readonly Dream[], skip: readonly string[], max = 5): Tally[] {
  return tally(dreams.map((dream) => [...(dream.places ?? []), ...(dream.themes ?? [])]))
    .filter((symbol) => !skip.includes(symbol.name))
    .slice(0, max);
}

/** The lines shown while the patterns are being read. */
export function readingLines(count: number): string[] {
  return [`reading ${count} dreams side by side…`, 'finding what keeps coming back…', 'connecting it to your week…'];
}

export type ReadingInsight = { title: string; body: string };

/** What the `dream-patterns` Edge Function reads in the dreams ("dive deeper"). */
export type PatternReading = {
  thread: ReadingInsight;
  /** Three, in the order of INSIGHT_LABELS. */
  insights: ReadingInsight[];
  /** Questions the dreamer can tap to ask next. */
  questions: string[];
  /** How many dreams were read. */
  dreamCount: number;
};
