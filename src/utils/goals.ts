/** What they want from their nights, in the order the tiles show on screen. */
export const GOALS = ['remember', 'understand', 'lucid', 'sleep', 'patterns', 'stress'] as const;

export type Goal = (typeof GOALS)[number];

/** The little shape drawn at the top of each tile. */
export type GoalShape = 'circle' | 'dome' | 'ring' | 'bars' | 'pair' | 'diamond';

type GoalTile = {
  label: string;
  /** Tile colour once picked (and the shape's colour before). */
  color: string;
  shape: GoalShape;
};

export const GOAL_TILES: Record<Goal, GoalTile> = {
  remember: { label: 'remember more dreams', color: '#E2EB98', shape: 'circle' },
  understand: { label: 'understand what they mean', color: '#C9B8F2', shape: 'dome' },
  lucid: { label: 'try lucid dreaming', color: '#A8D8F0', shape: 'ring' },
  sleep: { label: 'sleep more soundly', color: '#F2B8A0', shape: 'bars' },
  patterns: { label: 'spot patterns in my life', color: '#F2A8C4', shape: 'pair' },
  stress: { label: 'stress less', color: '#B8E6C4', shape: 'diamond' },
};

/** Picks `goal` if it isn't picked yet, un-picks it if it is. Keeps the order they tapped in. */
export function toggleGoal(picked: readonly Goal[], goal: Goal): Goal[] {
  return picked.includes(goal) ? picked.filter((g) => g !== goal) : [...picked, goal];
}

/** The line under the question: a nudge before anything is picked, then a count. */
export function goalsSubtitle(count: number): string {
  if (count === 0) return 'tap all that feel true';
  return `${count} picked — we'll shape afterdream around ${count > 1 ? 'these' : 'this'}`;
}
