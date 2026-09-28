/** The goal tiles on the vision onboarding screen. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { GOAL_TILES, GOALS, goalsSubtitle, toggleGoal } from '../goals.ts';

describe('toggleGoal', () => {
  it('adds a goal that is not picked yet, at the end', () => {
    assert.deepEqual(toggleGoal([], 'lucid'), ['lucid']);
    assert.deepEqual(toggleGoal(['lucid'], 'remember'), ['lucid', 'remember']);
  });

  it('removes a goal that is already picked, keeping the rest in order', () => {
    assert.deepEqual(toggleGoal(['lucid', 'remember', 'stress'], 'remember'), ['lucid', 'stress']);
  });

  it('does not change the list it was given', () => {
    const picked = ['sleep'] as const;
    toggleGoal(picked, 'sleep');
    assert.deepEqual(picked, ['sleep']);
  });
});

describe('goalsSubtitle', () => {
  it('nudges them to pick before anything is picked', () => {
    assert.equal(goalsSubtitle(0), 'tap all that feel true');
  });

  it('says "this" for one goal and "these" for more', () => {
    assert.equal(goalsSubtitle(1), "1 picked — we'll shape afterdream around this");
    assert.equal(goalsSubtitle(3), "3 picked — we'll shape afterdream around these");
  });
});

describe('GOAL_TILES', () => {
  it('gives every goal its own shape', () => {
    const shapes = GOALS.map((goal) => GOAL_TILES[goal].shape);
    assert.equal(new Set(shapes).size, GOALS.length);
  });
});
