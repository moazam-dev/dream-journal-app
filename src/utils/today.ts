/** Pure helpers for the Today screen (the home feed of cards). */

/** The line under "write it down": what they're called, and when it is. */
export function todayGreeting(name: string | null, hour: number): string {
  const who = name?.trim() || 'you';
  if (hour < 12) return `good morning, ${who}.`;
  if (hour < 18) return `hey ${who}, still thinking about it?`;
  return `evening, ${who}.`;
}

export type Quote = { text: string; by: string };

export const QUOTES: readonly Quote[] = [
  { text: 'dreams are today’s answers to tomorrow’s questions.', by: 'Edgar Cayce' },
  { text: 'the future belongs to those who believe in the beauty of their dreams.', by: 'Eleanor Roosevelt' },
  { text: 'all that we see or seem is but a dream within a dream.', by: 'Edgar Allan Poe' },
  { text: 'who looks outside, dreams; who looks inside, awakes.', by: 'Carl Jung' },
  { text: 'hope is a waking dream.', by: 'Aristotle' },
  { text: 'you are never too old to set another goal or to dream a new dream.', by: 'Les Brown' },
  { text: 'we are such stuff as dreams are made on, and our little life is rounded with a sleep.', by: 'William Shakespeare' },
  { text: 'i dream my painting and i paint my dream.', by: 'Vincent van Gogh' },
  { text: 'the dream is a little hidden door in the innermost and most secret recesses of the soul.', by: 'Carl Jung' },
  { text: 'a dream you dream alone is only a dream. a dream you dream together is reality.', by: 'Yoko Ono' },
  { text: 'dreams are illustrations from the book your soul is writing about you.', by: 'Marsha Norman' },
  { text: 'hold fast to dreams, for if dreams die, life is a broken-winged bird that cannot fly.', by: 'Langston Hughes' },
  { text: 'tread softly because you tread on my dreams.', by: 'W. B. Yeats' },
  { text: 'yesterday is but today’s memory, and tomorrow is today’s dream.', by: 'Khalil Gibran' },
  { text: 'the best way to make your dreams come true is to wake up.', by: 'Paul Valéry' },
  { text: 'a dream which is not interpreted is like a letter which is not read.', by: 'The Talmud' },
  { text: 'those who dream by day are cognizant of many things which escape those who dream only by night.', by: 'Edgar Allan Poe' },
  { text: 'i dreamed a thousand new paths. i woke and walked my old one.', by: 'Chinese proverb' },
  { text: 'it’s a poor sort of memory that only works backwards.', by: 'Lewis Carroll' },
  { text: 'sometimes i’ve believed as many as six impossible things before breakfast.', by: 'Lewis Carroll' },
  { text: 'dreams are necessary to life.', by: 'Anaïs Nin' },
  { text: 'the night is more alive and more richly colored than the day.', by: 'Vincent van Gogh' },
  { text: 'a ruffled mind makes a restless pillow.', by: 'Charlotte Brontë' },
  { text: 'all men dream, but not equally.', by: 'T. E. Lawrence' },
  { text: 'sleep is the golden chain that ties health and our bodies together.', by: 'Thomas Dekker' },
  { text: 'the interpretation of dreams is the royal road to the unconscious.', by: 'Sigmund Freud' },
];

/** Day of the year, 1 on January 1st (local time). */
export function dayOfYear(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 0);
  return Math.floor((date.getTime() - start.getTime()) / 86_400_000);
}

/** One quote per day, the same all day long. */
export function quoteOfDay(date: Date): Quote {
  return QUOTES[dayOfYear(date) % QUOTES.length];
}

/** Text to put on the clipboard / share sheet for a quote. */
export function quoteShareText(quote: Quote): string {
  return `“${quote.text}” — ${quote.by} · via afterdream`;
}

/** Lower-case short date, like "sep 27". */
export function shortDate(date: Date): string {
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  return `${months[date.getMonth()]} ${date.getDate()}`;
}

/** Seconds as "m:ss". */
export function formatClock(seconds: number): string {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/** Sample dream lines the write card types and erases, one after another. */
export const SAMPLE_LINES = [
  'i was in a house made of water…',
  'there was a train with no doors…',
  'my old school, but upside down…',
] as const;

/** Extra ticks a finished line stays on screen before it is erased. */
const HOLD_TICKS = 12;

export type Typewriter = { line: number; char: number; dir: 1 | -1 };

export const TYPEWRITER_START: Typewriter = { line: 0, char: 0, dir: 1 };

/** Moves the typewriter one letter forward (or back while erasing). */
export function typewriterStep(state: Typewriter, lines: readonly string[] = SAMPLE_LINES): Typewriter {
  const length = lines[state.line].length;
  const char = state.char + state.dir;
  if (char > length + HOLD_TICKS) return { ...state, char: length, dir: -1 };
  if (char < 0) return { line: (state.line + 1) % lines.length, char: 0, dir: 1 };
  return { ...state, char };
}

/** The text currently shown by the typewriter. */
export function typewriterText(state: Typewriter, lines: readonly string[] = SAMPLE_LINES): string {
  const line = lines[state.line];
  return line.slice(0, Math.min(state.char, line.length));
}

/** One question Afterdream asked on the "talk it through" card, and what they answered. */
export type Fragment = { question: string; answer: string };

/** A question with a few short answers to tap. */
export type Ask = { question: string; suggestions: string[] };

/** The opening question, asked before the AI has anything to build on. */
export const FIRST_ASK: Ask = {
  question: 'what’s the first thing you remember?',
  suggestions: ['a place', 'a person', 'just a feeling'],
};

/** After this many answers the dream is pieced together without asking. */
export const MAX_ASKS = 6;

/** One line in the transcript of how a dream was told. */
export type Turn = { from: 'you' | 'afterdream'; text: string };

/** The talk card's chat as transcript lines: each question, then the answer given. */
export function fragmentTurns(fragments: readonly Fragment[]): Turn[] {
  return fragments.flatMap((f): Turn[] => [
    { from: 'afterdream', text: f.question },
    { from: 'you', text: f.answer },
  ]);
}

/** The line under the talk card's chat: how many answers so far, and what happens next. */
export function fragmentsHint(count: number): string {
  if (count === 0) return 'tap an answer or type your own';
  const left = MAX_ASKS - count;
  return left > 0 ? `${count} piece${count > 1 ? 's' : ''} so far · up to ${left} more` : 'that’s plenty — piecing it together';
}

/** Feelings they can pick for a dream themselves (the AI suggests its own too). */
export const MOOD_OPTIONS = ['calm', 'happy', 'excited', 'anxious', 'scared', 'sad', 'confused', 'weird'] as const;

/** Most people or places one dream keeps, and the longest name. */
export const MAX_TAGS = 12;
export const MAX_TAG_LENGTH = 40;

/**
 * Adds a person or place typed by the user: trimmed, spaces tidied, no duplicates
 * (ignoring case), and within the limits above. Returns the list unchanged if it can't add.
 */
export function addTag(list: readonly string[], raw: string): string[] {
  const tag = raw.trim().replace(/\s+/g, ' ').slice(0, MAX_TAG_LENGTH).trim();
  if (!tag || list.length >= MAX_TAGS) return [...list];
  if (list.some((item) => item.toLowerCase() === tag.toLowerCase())) return [...list];
  return [...list, tag];
}

/** True when two tag lists hold the same names in the same order. */
export function sameTags(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((item, i) => item === b[i]);
}

/** Lines that take turns under the glowing orb while the dream is read. */
export const LOADING_LINES = ['reading between the lines…', 'finding the symbols…', 'feeling out the mood…'] as const;

/** How a dream reached the reflection: typed, spoken, or talked through. */
export type DreamSource = 'write' | 'yap' | 'talk';

/** Heading over their own words on the result screen. */
export const SOURCE_LABELS: Record<DreamSource, string> = {
  write: 'what you wrote',
  yap: 'what you said',
  talk: 'what you told afterdream',
};

/** Words in a draft (0 for blank). */
export function wordCount(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

/** The small line under the write box. */
export function writeHint(draft: string, open: boolean): string {
  const words = wordCount(draft);
  if (words > 0) return `${words} word${words > 1 ? 's' : ''} · tap ↑ to interpret`;
  return open ? 'no wrong way to do this' : 'tap to start writing';
}

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
const MONTHS_LONG = ['january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];

/** Date over a dream's title, like "sunday, sep 27". */
export function resultDate(date: Date): string {
  return `${WEEKDAYS[date.getDay()]}, ${shortDate(date)}`;
}

/** Long lower-case date, like "september 27, 2027". */
export function longDate(date: Date): string {
  return `${MONTHS_LONG[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;
}

/** Heights of the little bars in the reflection player's waveform. */
export const WAVE_HEIGHTS = Array.from({ length: 38 }, (_, i) => 4 + ((i * 53) % 14));

/** How long a note to future you stays sealed. */
export const LOCK_OPTIONS = [
  { label: '1 month', months: 1 },
  { label: '6 months', months: 6 },
  { label: '1 year', months: 12 },
] as const;

/** The day a note sealed on `from` opens. Month ends clamp (Jan 31 + 1 month = Feb 28/29). */
export function unlockDate(from: Date, months: number): Date {
  const target = new Date(from.getFullYear(), from.getMonth() + months, 1);
  const lastDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  target.setDate(Math.min(from.getDate(), lastDay));
  return target;
}

/** A sealed note to future you (the audio file lives on the phone). */
export type Capsule = {
  id: string;
  /** When it was sealed (ISO date and time). */
  sealedAt: string;
  /** The day it opens, "YYYY-MM-DD" (a calendar date, local time). */
  opensOn: string;
  /** Length of the recording. */
  seconds: number;
};

/** Calendar date as "YYYY-MM-DD" (local time). */
export function dateKey(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Reads a "YYYY-MM-DD" key back as local midnight. */
export function fromDateKey(key: string): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day);
}

/** Whole days from `now` until `date` (0 on the day itself). */
export function daysUntil(date: Date, now: Date): number {
  const day = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  // Rounded, so a daylight-saving change (a 23 or 25 hour day) still counts as one day.
  return Math.round((day(date) - day(now)) / 86_400_000);
}

export function isUnlocked(capsule: Capsule, now: Date): boolean {
  return daysUntil(fromDateKey(capsule.opensOn), now) <= 0;
}

/** One row in the time capsule list. */
export function capsuleRow(capsule: Capsule, now: Date) {
  const sealed = new Date(capsule.sealedAt);
  const days = daysUntil(fromDateKey(capsule.opensOn), now);
  const locked = days > 0;
  return {
    locked,
    title: daysUntil(sealed, now) === 0 ? 'sealed today' : `sealed ${shortDate(sealed)}`,
    subtitle: locked
      ? `opens ${shortDate(fromDateKey(capsule.opensOn))} · ${days} day${days > 1 ? 's' : ''} to go`
      : 'unlocked · tap to listen',
    length: formatClock(capsule.seconds),
  };
}

/** The link under the future-you button. */
export function capsuleLine(count: number): string {
  if (count === 0) return 'your capsule is empty · see how it works';
  return `${count} message${count > 1 ? 's' : ''} in your capsule · see all`;
}

/** Which card is centred for a scroll offset, kept inside 0…count-1. */
export function activeCard(offset: number, interval: number, count: number): number {
  if (interval <= 0 || count <= 0) return 0;
  return Math.min(count - 1, Math.max(0, Math.round(offset / interval)));
}
