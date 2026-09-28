import type { Dream } from '@/types/dream';

import { shortDate } from './today.ts';

/** How many dreams the visualize screen flips through (one tick each). */
export const MAX_VISUALIZED = 7;

/** Only this much of a dream is spelled out before it turns into a picture. */
export const MAX_SPOKEN_CHARS = 90;

/** Seconds between one letter appearing and the next. */
const CHAR_STEP = 0.015;
/** The words never take longer than this to type in, so nobody is kept waiting. */
const MAX_TYPE = 0.9;

const WEEKDAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

/** How the picture is painted. Each one is a set of tints laid over the image. */
export type Look = { label: string };

export const LOOKS: readonly Look[] = [
  { label: 'as dreamt' },
  { label: 'cinematic' },
  { label: 'anime' },
  { label: 'oil paint' },
  { label: 'noir' },
];

/** Keeps `index` inside a list of `count` items, wrapping at both ends. */
export function wrapIndex(index: number, count: number): number {
  if (count <= 0) return 0;
  return ((index % count) + count) % count;
}

/**
 * The dreams to visualize, newest first: the ones with a finished reflection (the image
 * is painted from it). `focusId` is always included, and is where the screen starts.
 */
export function pickDreams(dreams: readonly Dream[], focusId?: string | null, max = MAX_VISUALIZED) {
  const ready = dreams.filter((dream) => dream.analysis_status === 'completed');
  let list = ready.slice(0, max);
  const focus = focusId ? ready.find((dream) => dream.id === focusId) : undefined;
  if (focus && !list.includes(focus)) list = [...list.slice(0, max - 1), focus];
  const start = focus ? list.indexOf(focus) : 0;
  return { list, start };
}

function startOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

/** When the dream was told: "last night", "yesterday", a weekday this week, or "sep 12". */
export function dreamDay(told: Date, now: Date): string {
  const days = Math.round((startOfDay(now) - startOfDay(told)) / 86_400_000);
  if (days <= 0) return 'last night';
  if (days === 1) return 'yesterday';
  if (days < 7) return WEEKDAYS[told.getDay()];
  return shortDate(told);
}

/** The mood shown under the picture: the dreamer's own, or else the AI's guess. */
export function dreamMood(dream: Pick<Dream, 'mood' | 'user_mood'>): string | null {
  const mood = dream.user_mood ?? dream.mood;
  return mood ? mood.toLowerCase() : null;
}

/** The start of the dream, cut at a word, so spelling it out stays short. */
export function spokenText(text: string, max = MAX_SPOKEN_CHARS): string {
  const clean = text.replace(/\s+/g, ' ').trim().toLowerCase();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max);
  const lastSpace = cut.lastIndexOf(' ');
  return `${(lastSpace > max / 2 ? cut.slice(0, lastSpace) : cut).replace(/[\s,.;:!?-]+$/, '')}…`;
}

/** Seconds: letters typed in, held briefly, then the picture comes up as they blow away. */
export function visualizeTiming(fast: boolean, letters: number) {
  const type = fast ? 0 : Math.min(letters * CHAR_STEP, MAX_TYPE);
  const hold = fast ? 0 : 0.3;
  return { type, out: type + hold, develop: fast ? 0 : type + hold + 0.1 };
}

export type DustChar = { ch: string; key: number; in: number; out: number; dx: number; dy: number };
export type DustWord = { key: number; chars: DustChar[] };

/**
 * The dream's words, letter by letter: when each letter appears (`in`), when it blows
 * away as dust (`out`) and where it drifts to (`dx`, `dy`). The same `seed` always
 * scatters the same way, so a dream looks the same each time it is shown.
 */
export function dustWords(text: string, seed: number): DustWord[] {
  const letters = text.replace(/ /g, '').length;
  // Long dreams type faster, so every letter is in before the dust starts.
  const { type, out } = visualizeTiming(false, letters);
  let k = 0;
  return text
    .split(' ')
    .filter(Boolean)
    .map((word, wi) => ({
      key: wi,
      chars: word.split('').map((ch) => {
        const i = k++;
        const r1 = Math.sin(i * 12.9898 + seed) * 43758.5453;
        const r2 = Math.sin(i * 78.233 + seed) * 12543.1;
        const f1 = r1 - Math.floor(r1);
        const f2 = r2 - Math.floor(r2);
        return {
          ch,
          key: i,
          in: (i / letters) * type,
          out: out + f1 * 0.3,
          dx: Math.round((f1 - 0.5) * 60),
          dy: Math.round(-20 - f2 * 60),
        };
      }),
    }));
}

/** A small number from a dream's id, so each dream scatters its letters its own way. */
export function seedFor(id: string): number {
  let seed = 0;
  for (const ch of id) seed = (seed * 31 + ch.charCodeAt(0)) % 997;
  return seed;
}
