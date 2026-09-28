/** What was tapped in the garden: the night it grew on, and what kind of thing it is. */
export type GardenPick = { day: number; kind: string };

/** How many of each kind of thing a drop in growth takes away (see `countLost`). */
export type LostCounts = Record<string, number>;

export type Garden = {
  /** Grows (or shrinks) the garden to `nights`; `instant` skips the animation. */
  setGrowth(nights: number, instant?: boolean): void;
  /** 0 is healthy, 1 fully wilted (grey sky, drooping flowers). */
  setWilt(amount: number, instant?: boolean): void;
  /** Slowly turns the camera when nobody is dragging. */
  setAuto(on: boolean): void;
  setPaused(paused: boolean): void;
  /** Sparks rising ("grow") or leaves falling ("wilt"). */
  burst(kind: 'grow' | 'wilt'): void;
  /** What disappears going from `from` nights of growth down to `to`. */
  countLost(from: number, to: number): LostCounts;
  dispose(): void;
};

export function createGarden(
  host: HTMLElement,
  callbacks?: { onPick?: (pick: GardenPick | null) => void; onDrag?: () => void }
): Garden;
