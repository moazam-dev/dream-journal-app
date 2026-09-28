/** Average length of a lunar cycle (new moon to new moon), in days. */
const SYNODIC_DAYS = 29.530588853;
/** A known new moon: 6 Jan 2000, 18:14 UTC. */
const REFERENCE_NEW_MOON = Date.UTC(2000, 0, 6, 18, 14);
const DAY_MS = 86_400_000;

const PHASE_NAMES = [
  'a new moon',
  'a waxing crescent',
  'a first quarter moon',
  'a waxing gibbous moon',
  'a full moon',
  'a waning gibbous moon',
  'a last quarter moon',
  'a waning crescent',
] as const;

export type MoonPhase = {
  /** Position in the lunar cycle: 0 = new moon, 0.5 = full moon, back to 1 = new moon. */
  cycle: number;
  /** Nearest of the eight named phases, e.g. "a waxing crescent". */
  name: (typeof PHASE_NAMES)[number];
};

/** The moon's phase at midday (UTC) on a date. `month` is 0-based, like `Date`. */
export function moonPhase(year: number, month: number, day: number): MoonPhase {
  const days = (Date.UTC(year, month, day, 12) - REFERENCE_NEW_MOON) / DAY_MS;
  let cycle = (days % SYNODIC_DAYS) / SYNODIC_DAYS;
  if (cycle < 0) cycle += 1;
  return { cycle, name: PHASE_NAMES[Math.round(cycle * 8) % 8] };
}

/** Number of days in a month (`month` is 0-based). */
export function daysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
}
