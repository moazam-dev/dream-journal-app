/** The dream garden: how the nights a dream was told grow it, and what it says about that. */
import type { Dream } from '@/types/dream';

import { dreamHeadline } from './entries.ts';
import { dateKey, daysUntil, fromDateKey } from './today.ts';

/** The garden's stages: the night of growth each starts on, and its name. */
export const STAGES = [
  [0, 'a seed'],
  [1, 'first sprout'],
  [4, 'seedling'],
  [7, 'sapling'],
  [10, 'young tree'],
  [15, 'first blossoms'],
  [21, 'butterflies'],
  [30, 'a small grove'],
  [45, 'dreamscape'],
  [60, 'dream world'],
] as const;

/** Nights of growth that fade when a night goes by without a dream. */
export const PENALTY_NIGHTS = 3;
/** Nights in a row that earn a dewdrop. */
export const DEW_EVERY = 7;
/** Most dewdrops kept at once. */
export const MAX_DEW = 2;
/** Growth at which everything in the garden is there. */
export const FULL_GROWTH = STAGES[STAGES.length - 1][0];

/** Index into STAGES for this much growth. */
export function stageIndex(growth: number): number {
  let index = 0;
  STAGES.forEach(([night], i) => {
    if (growth >= night) index = i;
  });
  return index;
}

export function stageName(growth: number): string {
  return STAGES[stageIndex(growth)][1];
}

/** Where the garden is headed: this stage, the next one, and how far along the way it is. */
export type GardenGoal = {
  /** 1-based, of STAGES.length. */
  stageNumber: number;
  stage: string;
  /** Nights of growth this stage started on. */
  from: number;
  /** The next stage and the night it starts on; null once the garden is a whole dream world. */
  next: { name: string; at: number } | null;
  /** Nights grown into this stage, and nights it takes to reach the next. */
  done: number;
  span: number;
};

export function gardenGoal(growth: number): GardenGoal {
  const index = stageIndex(growth);
  const [from, stage] = STAGES[index];
  const upcoming = STAGES[index + 1];
  if (!upcoming) return { stageNumber: index + 1, stage, from, next: null, done: 1, span: 1 };
  const [at, name] = upcoming;
  return { stageNumber: index + 1, stage, from, next: { name, at }, done: Math.max(0, growth - from), span: at - from };
}

/** "3 more nights → young tree", or the finish line once it's whole. */
export function goalCaption(goal: GardenGoal, growth: number): string {
  if (!goal.next) return 'a whole dream world ✦';
  const left = goal.next.at - growth;
  return `${left} more night${left === 1 ? '' : 's'} → ${goal.next.name}`;
}

/** One night of growth: the dream that grew it, and the day it was told. */
export type GrowthNight = { dreamId: string; day: string };

/** Nights missed in a row (with no dewdrop left), and what they cost. */
export type Wilt = {
  /** The first missed night, "YYYY-MM-DD". */
  since: string;
  nights: number;
  /** The streak and growth before the first missed night, and the growth now. */
  fromStreak: number;
  fromGrowth: number;
  toGrowth: number;
};

export type GardenState = {
  /** Nights of growth: +1 for every night told, −PENALTY_NIGHTS for every night missed. */
  growth: number;
  /** Nights in a row with a dream (a dewdrop keeps it going over a missed night). */
  streak: number;
  dew: number;
  loggedToday: boolean;
  /** One entry per night of growth still in the garden, oldest first. */
  grown: GrowthNight[];
  /** Set while the garden is wilted: missed nights with no dream told since. */
  wilt: Wilt | null;
  /** The last night a dewdrop covered, "YYYY-MM-DD". */
  lastDewSave: string | null;
};

/**
 * Plays back every day from the first dream to today. A day with a dream grows the garden
 * one night and adds to the streak; every 7 in a row earn a dewdrop (up to 2). A day without
 * one uses up a dewdrop, or else wilts the garden: PENALTY_NIGHTS of growth fade (never below
 * a seed) and the streak starts over. Today only counts once its dream is told.
 */
export function gardenState(dreams: readonly Pick<Dream, 'id' | 'created_at'>[], now: Date): GardenState {
  // The first dream told on each day.
  const byDay = new Map<string, { id: string; at: number }>();
  for (const dream of dreams) {
    const at = new Date(dream.created_at).getTime();
    if (Number.isNaN(at)) continue;
    const key = dateKey(new Date(at));
    const current = byDay.get(key);
    if (!current || at < current.at) byDay.set(key, { id: dream.id, at });
  }

  const state: GardenState = { growth: 0, streak: 0, dew: 0, loggedToday: false, grown: [], wilt: null, lastDewSave: null };
  if (byDay.size === 0) return state;

  const first = new Date(Math.min(...[...byDay.values()].map((night) => night.at)));
  const today = dateKey(now);
  const day = new Date(first.getFullYear(), first.getMonth(), first.getDate());
  for (let key = dateKey(day); key <= today; key = dateKey(day)) {
    day.setDate(day.getDate() + 1);
    const told = byDay.get(key);
    if (told) {
      state.growth += 1;
      state.streak += 1;
      state.grown.push({ dreamId: told.id, day: key });
      if (state.streak % DEW_EVERY === 0 && state.dew < MAX_DEW) state.dew += 1;
      state.wilt = null;
      if (key === today) state.loggedToday = true;
    } else if (key === today) {
      // Tonight's dream can still be told.
    } else if (state.dew > 0) {
      state.dew -= 1;
      state.lastDewSave = key;
    } else {
      const before = state.growth;
      state.growth = Math.max(0, before - PENALTY_NIGHTS);
      state.grown.length = state.growth;
      state.wilt = state.wilt
        ? { ...state.wilt, nights: state.wilt.nights + 1, toGrowth: state.growth }
        : { since: key, nights: 1, fromStreak: state.streak, fromGrowth: before, toGrowth: state.growth };
      state.streak = 0;
    }
  }
  return state;
}

/** The streak shown next to the flame on every screen. */
export function currentStreak(dreams: readonly Pick<Dream, 'id' | 'created_at'>[], now: Date): number {
  return gardenState(dreams, now).streak;
}

/** What the garden looked like the last time it was opened (saved on the phone). */
export type GardenSeen = {
  growth: number;
  dew: number;
  wilted: boolean;
  /** The wilt whose "your garden wilted" sheet was already shown. */
  wiltSince: string | null;
  dewSave: string | null;
};

export function seenNow(state: GardenState): GardenSeen {
  return {
    growth: state.growth,
    dew: state.dew,
    wilted: !!state.wilt,
    wiltSince: state.wilt?.since ?? null,
    dewSave: state.lastDewSave,
  };
}

/** How opening the garden plays out, from what was seen last time to how it is now. */
export type Visit = {
  /** Growth and wilt to start from before growing (or wilting) into the current state. */
  fromGrowth: number;
  fromWilted: boolean;
  burst: 'grow' | 'wilt' | null;
  /** A stage name to announce ("new stage unlocked"). */
  banner: string | null;
  toast: string | null;
  /** Show the "your garden wilted" sheet. */
  wiltSheet: boolean;
};

export function gardenVisit(seen: GardenSeen | null, state: GardenState): Visit {
  const wiltSheet = !!state.wilt && seen?.wiltSince !== state.wilt.since && (state.wilt.fromGrowth > 0 || state.wilt.fromStreak > 0);
  // First time here: grow it from the seed, without fanfare.
  if (!seen) {
    return { fromGrowth: 0, fromWilted: false, burst: state.growth > 0 ? 'grow' : null, banner: null, toast: null, wiltSheet };
  }

  const grew = state.growth > seen.growth;
  const shrank = state.growth < seen.growth;
  const banner = grew && stageIndex(state.growth) > stageIndex(seen.growth) ? stageName(state.growth) : null;

  let toast: string | null = null;
  if (seen.wilted && !state.wilt && grew) toast = 'revived ✦ your garden is breathing again';
  else if (state.dew > seen.dew) toast = 'dewdrop earned — one missed night is covered';
  else if (state.lastDewSave && state.lastDewSave !== seen.dewSave) toast = 'a dewdrop kept your streak alive';
  else if (grew) {
    const nights = state.growth - seen.growth;
    toast = `+${nights} night${nights === 1 ? '' : 's'} of growth · ${state.streak} night streak`;
  }

  return {
    fromGrowth: seen.growth,
    fromWilted: seen.wilted,
    burst: grew ? 'grow' : shrank || (state.wilt && !seen.wilted) ? 'wilt' : null,
    banner,
    toast,
    wiltSheet,
  };
}

/** What each kind of thing in the garden is called on the card for it. */
const KINDS: Record<string, string> = {
  seedling: 'your first leaves',
  branch: 'a branch',
  leaves: 'new leaves',
  blossom: 'blossoms',
  flower: 'a flower bed',
  bush: 'a shrub',
  mushroom: 'mushrooms',
  butterfly: 'a butterfly',
  pond: 'the pond',
  lily: 'water lilies',
  tree: 'a cherry tree',
  path: 'stepping stones',
  bench: 'the bench',
  orb: 'a glow orb',
  moon: 'the moon',
};

export type PickCard = { when: string; title: string; kind: string; dreamId: string };

/**
 * The card for something tapped in the garden: the night it grew on and the dream that grew
 * it. `day` 0 is the seed (the first dream). Null when there's no dream behind it yet.
 */
export function pickCard(
  pick: { day: number; kind: string },
  state: GardenState,
  dreams: readonly Pick<Dream, 'id' | 'title' | 'dream_text'>[],
  now: Date
): PickCard | null {
  if (state.grown.length === 0) return null;
  const night = Math.min(Math.max(1, Math.round(pick.day)), state.grown.length);
  const grown = state.grown[night - 1];
  const dream = dreams.find((item) => item.id === grown.dreamId);
  if (!dream) return null;

  const ago = Math.max(0, -daysUntil(fromDateKey(grown.day), now));
  const when = pick.day <= 0 ? 'the night it all began' : ago === 0 ? 'grew last night' : `grew on night ${night} · ${ago + 1} nights ago`;
  return { when, title: `“${dreamHeadline(dream)}”`, kind: KINDS[pick.kind] ?? pick.kind, dreamId: dream.id };
}

/** Kinds worth naming when they fade, and their plurals. */
const PLURALS: Record<string, string> = {
  leaves: 'leaf clusters',
  branch: 'branches',
  blossom: 'blossom sprays',
  flower: 'flower beds',
  bush: 'shrubs',
  mushroom: 'mushroom patches',
  butterfly: 'butterflies',
  lily: 'lily pads',
  tree: 'trees',
  path: 'stepping stones',
  orb: 'glow orbs',
};

/** "fresh leaves", "a few twigs", "2 flower beds": what faded, for the wilted sheet. */
export function lostLabels(counts: Record<string, number>): string[] {
  return Object.entries(counts)
    .filter(([kind, count]) => PLURALS[kind] && count > 0)
    .map(([kind, count]) => {
      if (kind === 'leaves') return 'fresh leaves';
      if (kind === 'branch') return count > 6 ? 'some branches' : 'a few twigs';
      if (kind === 'blossom') return 'blossoms';
      if (kind === 'butterfly') return `${count} ${count > 1 ? 'butterflies' : 'butterfly'}`;
      return count > 1 ? `${count} ${PLURALS[kind]}` : `1 ${PLURALS[kind].replace(/(?<=ch)es$|s$/, '')}`;
    });
}

/** The wilted sheet's text. */
export function wiltBody(wilt: Wilt): string {
  const lost = wilt.fromGrowth - wilt.toGrowth;
  const missed = wilt.nights === 1 ? 'no dream was logged' : `no dream was logged for ${wilt.nights} nights`;
  return `${missed}, so ${lost} night${lost === 1 ? '' : 's'} of growth faded. your roots are safe — nothing here ever dies.`;
}

/** The "?" sheet: how the garden works. Lime dots for growing, grey for the rest. */
export const GARDEN_RULES = [
  { text: 'every dream you log grows it by one day.', grows: true },
  { text: 'keep your streak and it becomes a whole garden.', grows: true },
  { text: 'miss a day and it wilts a little — it never dies.', grows: false },
  { text: 'drag to look around. tap a plant to see its dream.', grows: false },
] as const;
