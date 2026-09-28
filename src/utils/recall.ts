/** How often they remember their dreams, in the order the answers show on screen. */
export const RECALLS = ['every-morning', 'few-a-week', 'sometimes', 'rarely', 'forget'] as const;

export type Recall = (typeof RECALLS)[number];

type RecallAnswer = {
  label: string;
  /** Accent the screen takes on once this answer is picked. */
  color: string;
  /** Dreams caught in a typical week (0–7): how many days light up. */
  nights: number;
  /** Line under the week, once picked. */
  caption: string;
};

export const RECALL_ANSWERS: Record<Recall, RecallAnswer> = {
  'every-morning': { label: 'Almost every morning', color: '#E2EB98', nights: 7, caption: 'a vivid dreamer, 7 nights out of 7' },
  'few-a-week': { label: 'A few times a week', color: '#A8D8F0', nights: 4, caption: 'about 4 dreams caught each week' },
  sometimes: { label: 'Sometimes', color: '#C9B8F2', nights: 2, caption: 'a couple of dreams slip through each week' },
  rarely: { label: 'Rarely', color: '#F2B8A0', nights: 1, caption: "one here and there — we'll grow that" },
  forget: { label: 'I usually forget them', color: '#F2A8C4', nights: 0, caption: "they're still there. we'll help you catch them" },
};

export const WEEK_DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'] as const;

/** Days light up in this order (Monday, Thursday, Saturday, …), so a few dreams look scattered, not bunched. */
const LIGHT_ORDER = [0, 3, 5, 1, 6, 2, 4];

/**
 * For each weekday (Monday first): its place in the light-up order when it's lit,
 * or `null` when it stays dark. The place sets the stagger, so lit days pop one by one.
 */
export function dreamWeek(nights: number): (number | null)[] {
  return WEEK_DAYS.map((_, day) => {
    const place = LIGHT_ORDER.indexOf(day);
    return place < nights ? place : null;
  });
}
