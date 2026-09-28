import { GOAL_TILES, GOALS, type Goal } from './goals.ts';
import { moonPhase, type MoonPhase } from './moon.ts';
import { RECALL_ANSWERS, RECALLS, type Recall } from './recall.ts';

/** How long each of the three "personalizing" slides stays up. */
export const SLIDE_MS = 3800;
export const SLIDE_COUNT = 3;
/** The whole reveal; the "enter afterdream" button shows after this. */
export const TOTAL_MS = SLIDE_MS * SLIDE_COUNT;
/** Screen colour behind each slide (it eases from one to the next). */
export const SLIDE_BACKGROUNDS = ['#231C4D', '#1D2B1A', '#0E2A2C'] as const;

const STATUSES = ['reading your answers', 'tuning your journal', 'almost ready'];
/** The "..." after the status grows by one dot this often, then starts over. */
const DOT_MS = 400;

/** Which slide shows `elapsed` ms after the screen opened (0, 1 or 2; the last one stays). */
export function slideAt(elapsed: number): number {
  return Math.min(SLIDE_COUNT - 1, Math.max(0, Math.floor(elapsed / SLIDE_MS)));
}

/** The line inside the loading bar, e.g. "tuning your journal..". */
export function loadingStatus(elapsed: number): string {
  const dots = Math.floor(Math.max(0, elapsed) / DOT_MS) % 4;
  return STATUSES[slideAt(elapsed)] + '.'.repeat(dots);
}

/** What onboarding saved; any of it may be missing (skipped) or malformed. */
export type Answers = {
  name?: unknown;
  birthday?: unknown;
  recall?: unknown;
  goals?: unknown;
};

export type Trait = {
  /** Small grey label on the left. */
  label: string;
  /** Their answer, in a coloured pill on the right. */
  value: string;
  color: string;
};

export type DreamerCard = {
  name: string;
  /** "no. 0414" from their birthday (month and day), or `null` without one. */
  number: string | null;
  /** The moon on the night they were born, or `null` without a birthday. */
  moon: MoonPhase | null;
  traits: Trait[];
};

/** Short pill text for each recall answer (the full labels are too long for the card). */
const RECALL_SHORT: Record<Recall, string> = {
  'every-morning': 'almost every morning',
  'few-a-week': 'few times a week',
  sometimes: 'sometimes',
  rarely: 'rarely',
  forget: 'still catching them',
};

/** Short pill text for each goal. */
const GOAL_SHORT: Record<Goal, string> = {
  remember: 'remember more',
  understand: 'find the meaning',
  lucid: 'go lucid',
  sleep: 'sleep soundly',
  patterns: 'spot patterns',
  stress: 'stress less',
};

/** Shown when they skipped a question. */
const UNKNOWN_COLOR = '#D8DCC0';
/** The design's default morning reminder time. */
const MORNING_NUDGE = '7:30 am';

/** The name to greet them by, or "dreamer" if they skipped it. */
export function dreamerName(name: unknown): string {
  return typeof name === 'string' && name.trim() ? name.trim() : 'dreamer';
}

/** Reads a "YYYY-MM-DD" birthday. `month` is 0-based, like `Date`. */
function parseBirthday(birthday: unknown): { year: number; month: number; day: number } | null {
  if (typeof birthday !== 'string') return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(birthday);
  if (!match) return null;
  const [year, month, day] = [Number(match[1]), Number(match[2]) - 1, Number(match[3])];
  if (month < 0 || month > 11 || day < 1 || day > 31) return null;
  return { year, month, day };
}

/** Everything on the "dreamer id" card, built from their onboarding answers. */
export function dreamerCard(answers: Answers): DreamerCard {
  const birthday = parseBirthday(answers.birthday);
  const recall = RECALLS.find((r) => r === answers.recall);
  const firstGoal: unknown = Array.isArray(answers.goals) ? answers.goals[0] : undefined;
  const goal = GOALS.find((g) => g === firstGoal);
  const pad = (n: number) => String(n).padStart(2, '0');

  return {
    name: dreamerName(answers.name),
    number: birthday ? `no. ${pad(birthday.month + 1)}${pad(birthday.day)}` : null,
    moon: birthday ? moonPhase(birthday.year, birthday.month, birthday.day) : null,
    traits: [
      recall
        ? { label: 'dream recall', value: RECALL_SHORT[recall], color: RECALL_ANSWERS[recall].color }
        : { label: 'dream recall', value: "we'll find out", color: UNKNOWN_COLOR },
      goal
        ? { label: 'your focus', value: GOAL_SHORT[goal], color: GOAL_TILES[goal].color }
        : { label: 'your focus', value: 'just exploring', color: UNKNOWN_COLOR },
      { label: 'morning nudge', value: MORNING_NUDGE, color: '#E2EB98' },
    ],
  };
}
