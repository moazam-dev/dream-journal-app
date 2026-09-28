/** How long each of the three "personalizing" slides stays up, in order. */
export const SLIDE_MS = [4200, 4200, 4400] as const;
export const SLIDE_COUNT = SLIDE_MS.length;
/** The whole reveal; the "enter afterdream" button shows after this. */
export const TOTAL_MS = SLIDE_MS.reduce((sum, ms) => sum + ms, 0);
/** Screen colour behind every slide. */
export const PERSONALIZING_BACKGROUND = '#000000';

const STATUSES = ['reading your answers…', 'personalizing your journal…', 'setting up your patterns…'];

/** When slide `index` comes up, in ms after the screen opened. */
function slideStart(index: number): number {
  return SLIDE_MS.slice(0, index).reduce((sum, ms) => sum + ms, 0);
}

/** Which slide shows `elapsed` ms after the screen opened (0, 1 or 2; the last one stays). */
export function slideAt(elapsed: number): number {
  for (let i = 0; i < SLIDE_COUNT - 1; i++) {
    if (elapsed < slideStart(i + 1)) return i;
  }
  return SLIDE_COUNT - 1;
}

/** How full slide `index`'s bar at the top is, from 0 (not started) to 1 (done). */
export function slideProgress(elapsed: number, index: number): number {
  return Math.min(1, Math.max(0, (elapsed - slideStart(index)) / SLIDE_MS[index]));
}

/** The line on the left of the loading bar, e.g. "personalizing your journal…". */
export function loadingStatus(elapsed: number): string {
  return STATUSES[slideAt(elapsed)];
}

/** The whole reveal's progress as a whole percent, 0 to 100. */
export function loadingPercent(elapsed: number): number {
  return Math.round(Math.min(1, Math.max(0, elapsed / TOTAL_MS)) * 100);
}

/** The name to greet them by, or "dreamer" if they skipped it. */
export function dreamerName(name: unknown): string {
  return typeof name === 'string' && name.trim() ? name.trim() : 'dreamer';
}
