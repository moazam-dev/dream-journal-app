import type { Dream } from '@/types/dream';

import { entryDate } from './entries.ts';
import { dateKey } from './today.ts';
import { dreamMood } from './visualize.ts';

/** Colours for ranked themes, strongest first. From the Patterns v3 design. */
export const THEME_COLORS = ['#C8553D', '#E3B04B', '#7C9CBF', '#D8C7E3', '#8FA98B'] as const;
/** Colours for the four most common moods, most common first. */
export const MOOD_COLORS = ['#F3EEE4', '#C8553D', '#3D2A4F', '#E3B04B'] as const;
/** The richest nights on the "most vivid nights" chart, and the rest. */
export const VIVID_COLOR = '#C8553D';
export const QUIET_COLOR = '#7C9CBF';

/** "Lately" looks back this many nights. */
export const RECENT_NIGHTS = 30;
/** The reading covers at most this many of the newest dreams (the server's limit). */
export const MAX_READ_DREAMS = 30;
/** The reading needs at least this many dreams (the server refuses fewer). */
export const MIN_READING_DREAMS = 3;
/** Cards in the "dream cast" grid. */
export const MAX_CAST = 4;
/** Most dots in a row on the theme and vivid-night charts. */
export const MAX_DOTS = 7;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
const WEEK_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
const DAY_MS = 86_400_000;
/** Moods that count towards the "calmest night". */
const CALM = /calm|peace|content|happy|relax|seren|hope|joy|safe|warm|tender|gentle|cozy|cosy|comfort|light|free|love/;

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole nights between the dream and today (0 for a dream told today). */
function nightsAgo(dream: Pick<Dream, 'created_at'>, now: Date): number {
  return Math.round((startOfDay(now).getTime() - startOfDay(new Date(dream.created_at)).getTime()) / DAY_MS);
}

function words(text: string): number {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** "calm" → "Calm". */
export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/** "Sunday, Sep 28" (shown in capitals above the title). */
export function patternsDate(now: Date): string {
  return `${capitalize(WEEKDAYS[now.getDay()])}, ${capitalize(MONTHS[now.getMonth()].slice(0, 3))} ${now.getDate()}`;
}

/** "September". */
export function monthLabel(now: Date): string {
  return capitalize(MONTHS[now.getMonth()]);
}

/** Dreams told in the last `nights` nights, including today (newest first, as given). */
export function recentDreams(dreams: readonly Dream[], now: Date, nights = RECENT_NIGHTS): Dream[] {
  return dreams.filter((dream) => {
    const ago = nightsAgo(dream, now);
    return ago >= 0 && ago < nights;
  });
}

/** Dreams told in the same calendar month as `now`. */
export function monthDreams(dreams: readonly Dream[], now: Date): Dream[] {
  return dreams.filter((dream) => {
    const told = new Date(dream.created_at);
    return told.getFullYear() === now.getFullYear() && told.getMonth() === now.getMonth();
  });
}

/** Dreams told this week, Monday to today. */
export function weekCount(dreams: readonly Pick<Dream, 'created_at'>[], now: Date): number {
  const sinceMonday = (now.getDay() + 6) % 7;
  return dreams.filter((dream) => {
    const ago = nightsAgo(dream, now);
    return ago >= 0 && ago <= sinceMonday;
  }).length;
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
    run = previous && dateKey(new Date(previous.getFullYear(), previous.getMonth(), previous.getDate() + 1)) === key ? run + 1 : 1;
    best = Math.max(best, run);
    previous = date;
  }
  return best;
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

// ─── Dream cast ─────────────────────────────────────────────────────────────

export type CastMember = {
  /** "Grandma", "A stranger". */
  name: string;
  /** "family", "unknown", "friend", "companion", … */
  role: string;
  count: number;
  note: string;
};

const ROLES: [RegExp, string][] = [
  [/stranger|someone|somebody|unknown|nobody|faceless|figure|shadow|man\b|woman\b|person|people|crowd/, 'unknown'],
  [/\b(dog|puppy|cat|kitten|bird|horse|pet|wolf|fox|snake|owl|rabbit|bunny|animal|fish|whale|bear|deer)\b/, 'companion'],
  [/\b(husband|wife|partner|boyfriend|girlfriend|fianc|spouse|ex)\b/, 'partner'],
  [/\b(boss|colleague|coworker|co-worker|teacher|manager|doctor|client|classmate|student)\b/, 'colleague'],
  [/\b(friend|bestie|buddy|mate|pal|roommate|neighbou?r)\b/, 'friend'],
  [/grand|\b(mom|mum|mother|mama|dad|father|papa|nan|nana|nanny|brother|sister|sibling|aunt|auntie|uncle|cousin|son|daughter|baby|parent|family|niece|nephew)\b/, 'family'],
];

/** A best guess at who someone is from how the dreamer names them. */
export function castRole(name: string): string {
  const lower = name.toLowerCase();
  return ROLES.find(([pattern]) => pattern.test(lower))?.[1] ?? 'someone';
}

/** Places too vague to say someone "shows up in" them. */
const VAGUE_PLACE = /^(nowhere|somewhere|anywhere|everywhere|unknown|none|n\/a|unclear|a place|a room)$/;

/** "shows up in the kitchen and the old house. these dreams mostly felt calm." */
export function castNote(withPerson: readonly Dream[]): string {
  const newest = withPerson[0];
  if (!newest) return '';
  const places = tally(withPerson.map((dream) => dream.places))
    .filter((place) => !VAGUE_PLACE.test(place.name))
    .slice(0, 2)
    .map((place) => place.name);
  const mood = tally(withPerson.map((dream) => [dreamMood(dream) ?? ''].filter(Boolean)))[0]?.name;
  if (withPerson.length === 1) {
    const where = places.length ? ` in ${places[0]}` : '';
    return `showed up once${where}, on ${entryDate(newest)}${mood ? `, and it felt ${mood}` : ''}.`;
  }
  const where = places.length ? `shows up in ${places.join(' and ')}` : `last showed up ${entryDate(newest)}`;
  return `${where}.${mood ? ` these dreams mostly felt ${mood}.` : ''}`;
}

/** The people saved on the dreams (typed by the dreamer or found by the reflection). */
export function localCast(dreams: readonly Dream[], max = MAX_CAST): CastMember[] {
  return tally(dreams.map((dream) => dream.people))
    .slice(0, max)
    .map((person) => ({
      name: capitalize(person.name),
      role: castRole(person.name),
      count: person.count,
      note: castNote(dreams.filter((dream) => dream.people?.some((p) => p.trim().toLowerCase() === person.name))),
    }));
}

/**
 * The cast shown on the overview: the reading's (read from the dream text itself, so it
 * also finds people in older dreams) once it is there, or else the saved people.
 */
export function pickCast(reading: PatternReading | null, local: readonly CastMember[], max = MAX_CAST): CastMember[] {
  if (reading && reading.cast.length > 0) {
    return reading.cast.slice(0, max).map((member) => ({ ...member, role: member.role === 'stranger' ? 'unknown' : member.role }));
  }
  return local.slice(0, max);
}

/** "3 dreams · family". */
export function castLine(member: Pick<CastMember, 'count' | 'role'>): string {
  return `${member.count} dream${member.count === 1 ? '' : 's'} · ${member.role}`;
}

// ─── Monthly report ─────────────────────────────────────────────────────────

export type MonthReport = {
  count: number;
  topTheme: string | null;
  mainMood: string | null;
  topPerson: string | null;
  /** "Saturday": the weekday with the most calm dreams. */
  calmestDay: string | null;
};

export function monthReport(month: readonly Dream[]): MonthReport {
  const calm = new Array(7).fill(0);
  for (const dream of month) {
    const mood = dreamMood(dream);
    if (mood && CALM.test(mood)) calm[new Date(dream.created_at).getDay()] += 1;
  }
  const top = Math.max(...calm);
  return {
    count: month.length,
    topTheme: tally(month.map((dream) => dream.themes))[0]?.name ?? null,
    mainMood: tally(month.map((dream) => [dreamMood(dream) ?? ''].filter(Boolean)))[0]?.name ?? null,
    topPerson: tally(month.map((dream) => dream.people))[0]?.name ?? null,
    calmestDay: top > 0 ? capitalize(WEEKDAYS[calm.indexOf(top)]) : null,
  };
}

/** The report's big line, when the reading hasn't given one: "A month of change". */
export function monthHeadline(report: MonthReport, reading: PatternReading | null): string {
  if (reading?.monthTitle) return capitalize(reading.monthTitle);
  if (report.topTheme) return `A month of ${report.topTheme}`;
  return report.count > 0 ? 'A month of new dreams' : 'A quiet month, so far';
}

/**
 * The report title as the design sets it, plain then italic:
 * "A month of rooms that wouldn't stay still" → "A month of " + "rooms that wouldn't stay still".
 */
export function splitHeadline(headline: string): { plain: string; italic: string } {
  const match = /^(a month of|a quiet month,)\s+(.+)$/i.exec(headline.trim());
  return match ? { plain: `${match[1]} `, italic: match[2] } : { plain: '', italic: headline.trim() };
}

/** The report's three numbers: dreams, top theme, main mood. */
export function reportStats(report: MonthReport): { value: string; label: string }[] {
  return [
    { value: String(report.count), label: report.count === 1 ? 'dream' : 'dreams' },
    { value: report.topTheme ?? '—', label: 'top theme' },
    { value: report.mainMood ?? '—', label: 'main mood' },
  ];
}

/** What "Share on WhatsApp", "More apps" and "Copy text" send. */
export function reportShareText(month: string, report: MonthReport, headline: string): string {
  const parts = [`${report.count} dream${report.count === 1 ? '' : 's'}`];
  if (report.topTheme) parts.push(`top theme "${report.topTheme}"`);
  if (report.mainMood) parts.push(`mostly ${report.mainMood}`);
  return `My ${month} in dreams on Afterdream: ${parts.join(', ')}. ${headline}.`;
}

// ─── Dive deeper ────────────────────────────────────────────────────────────

export type RankedTheme = Tally & { rank: number; color: string; dots: number };

/** The themes that keep coming back, with a dot per dream (capped). */
export function topThemes(dreams: readonly Dream[], max = 5): RankedTheme[] {
  return tally(dreams.map((dream) => dream.themes))
    .slice(0, max)
    .map((theme, i) => ({ ...theme, name: capitalize(theme.name), rank: i + 1, color: THEME_COLORS[i % THEME_COLORS.length], dots: Math.min(MAX_DOTS, theme.count) }));
}

export type MoodShare = { name: string; pct: number; color: string };

/**
 * The most common moods and their share of the dreams that have a mood. With more than
 * four moods, the three most common are kept and the rest become "Other", so the shares
 * always cover every dream.
 */
export function moodMix(dreams: readonly Dream[]): MoodShare[] {
  const moods = dreams.map((dream) => dreamMood(dream)).filter((mood): mood is string => !!mood);
  const counted = tally(moods.map((mood) => [mood]));
  const shown = counted.length > MOOD_COLORS.length ? counted.slice(0, MOOD_COLORS.length - 1) : counted;
  const rest = moods.length - shown.reduce((sum, mood) => sum + mood.count, 0);
  const parts = rest > 0 ? [...shown, { name: 'other', count: rest }] : shown;
  return parts.map((mood, i) => ({ name: capitalize(mood.name), pct: Math.round((mood.count / moods.length) * 100), color: MOOD_COLORS[i] }));
}

/**
 * The mood card's title, as plain text then italic text:
 * "Mostly calm, with " + "uneasy Sundays", or "Mostly " + "calm".
 */
export function moodHeadline(dreams: readonly Dream[], mix: readonly MoodShare[]): { plain: string; italic: string } | null {
  const [first, second] = mix;
  if (!first) return null;
  if (!second) return { plain: 'Mostly ', italic: first.name.toLowerCase() };

  const weekdays = new Array(7).fill(0);
  for (const dream of dreams) {
    if (dreamMood(dream) === second.name.toLowerCase()) weekdays[new Date(dream.created_at).getDay()] += 1;
  }
  const top = Math.max(...weekdays);
  const lead = `Mostly ${first.name.toLowerCase()}, `;
  if (top >= 2) return { plain: `${lead}with `, italic: `${second.name.toLowerCase()} ${capitalize(WEEKDAYS[weekdays.indexOf(top)])}s` };
  return { plain: `${lead}sometimes `, italic: second.name.toLowerCase() };
}

export type SymbolChip = { name: string; count: number; meaning: string | null };

/**
 * Symbols with what they might mean: the reading's once it is there, or else the saved
 * places and smaller themes (without meanings yet).
 */
export function pickSymbols(reading: PatternReading | null, dreams: readonly Dream[], skip: readonly string[], max = 5): SymbolChip[] {
  if (reading && reading.symbols.length > 0) return reading.symbols.slice(0, max);
  const lowerSkip = skip.map((name) => name.toLowerCase());
  return tally(dreams.map((dream) => [...(dream.places ?? []), ...(dream.themes ?? [])]))
    .filter((symbol) => !lowerSkip.includes(symbol.name))
    .slice(0, max)
    .map((symbol) => ({ ...symbol, meaning: null }));
}

export type VividNight = { key: number; day: string; dots: number; color: string };

/**
 * Monday to Sunday: how much was dreamed on each weekday (words told), as up to MAX_DOTS
 * dots. The two richest weekdays glow.
 */
export function vividNights(dreams: readonly Dream[]): VividNight[] {
  const told = new Array(7).fill(0);
  for (const dream of dreams) told[(new Date(dream.created_at).getDay() + 6) % 7] += Math.max(1, words(dream.dream_text));
  const most = Math.max(...told);
  const richest = [...told.keys()].filter((i) => told[i] > 0).sort((a, b) => told[b] - told[a]).slice(0, 2);
  return WEEK_LETTERS.map((day, i) => ({
    key: i,
    day,
    dots: told[i] === 0 ? 0 : Math.max(1, Math.round((told[i] / most) * MAX_DOTS)),
    color: richest.includes(i) ? VIVID_COLOR : QUIET_COLOR,
  }));
}

/** "Weekends are your richest nights. You usually log your dreams around 7:30am." */
export function vividNote(dreams: readonly Dream[]): string {
  if (dreams.length === 0) return '';
  const told = new Array(7).fill(0);
  for (const dream of dreams) told[new Date(dream.created_at).getDay()] += Math.max(1, words(dream.dream_text));
  const richest = [...told.keys()].filter((i) => told[i] > 0).sort((a, b) => told[b] - told[a]).slice(0, 2);
  const names = richest.map((i) => capitalize(WEEKDAYS[i]));
  let lead: string;
  if (richest.length === 2 && richest.includes(0) && richest.includes(6)) lead = 'Weekends are your richest nights.';
  else if (richest.length === 2) lead = `${names[0]}s and ${names[1]}s are your richest nights.`;
  else lead = `${names[0]}s are your richest nights.`;

  // Half-hour of the day most dreams are logged in.
  const slots = new Map<number, number>();
  for (const dream of dreams) {
    const at = new Date(dream.created_at);
    const slot = at.getHours() * 2 + (at.getMinutes() >= 30 ? 1 : 0);
    slots.set(slot, (slots.get(slot) ?? 0) + 1);
  }
  const [slot, count] = [...slots].sort((a, b) => b[1] - a[1])[0];
  if (dreams.length < 3 || count < 2) return lead;
  return `${lead} You usually log your dreams around ${clock(slot)}.`;
}

/** Half-hour slot of the day as "7:30am". */
function clock(slot: number): string {
  const hour = Math.floor(slot / 2);
  const minutes = slot % 2 ? '30' : '00';
  return `${hour % 12 || 12}:${minutes}${hour < 12 ? 'am' : 'pm'}`;
}

/** The label over the thread: "The thread · 12 dreams". */
export function threadLabel(count: number): string {
  return `The thread · ${count} dream${count === 1 ? '' : 's'}`;
}

/** The lines shown while the patterns are being read. */
export function readingLines(count: number): string[] {
  return [`Reading ${count} dreams side by side…`, 'Finding who keeps showing up…', 'Looking for what it might mean…'];
}

export type ReadingInsight = { title: string; body: string };

/** What the `dream-patterns` Edge Function reads in the dreams. */
export type PatternReading = {
  thread: ReadingInsight;
  /** "a month of rooms that wouldn't stay still". */
  monthTitle: string;
  cast: CastMember[];
  symbols: { name: string; count: number; meaning: string }[];
  question: ReadingInsight;
  /** How many dreams were read. */
  dreamCount: number;
};
