/** The dream garden helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  currentStreak,
  gardenGoal,
  gardenState,
  goalCaption,
  gardenVisit,
  lostLabels,
  pickCard,
  seenNow,
  stageIndex,
  stageName,
  wiltBody,
} from '../garden.ts';

// Fixed "now": monday, sep 28 2026, 10am (local time).
const now = new Date(2026, 8, 28, 10);

function dream(id: string, daysAgo: number, hour = 7) {
  const told = new Date(2026, 8, 28 - daysAgo, hour);
  return { id, created_at: told.toISOString(), title: `dream ${id}`, dream_text: `text ${id}` };
}

/** A dream on each of these days ago. */
function nights(...daysAgo: number[]) {
  return daysAgo.map((ago) => dream(`d${ago}`, ago));
}

describe('stages', () => {
  it('names the stage for the growth', () => {
    assert.equal(stageName(0), 'a seed');
    assert.equal(stageName(1), 'first sprout');
    assert.equal(stageName(6), 'seedling');
    assert.equal(stageName(7), 'sapling');
    assert.equal(stageName(59), 'dreamscape');
    assert.equal(stageName(80), 'dream world');
    assert.equal(stageIndex(15), 5);
  });

  it('measures the way to the next stage', () => {
    const goal = gardenGoal(8);
    assert.equal(goal.stage, 'sapling');
    assert.equal(goal.stageNumber, 4);
    assert.deepEqual(goal.next, { name: 'young tree', at: 10 });
    assert.equal(goal.done, 1);
    assert.equal(goal.span, 3);
    assert.equal(goalCaption(goal, 8), '2 more nights → young tree');
    assert.equal(goalCaption(gardenGoal(9), 9), '1 more night → young tree');
  });

  it('starts at a seed and ends at a whole dream world', () => {
    assert.equal(goalCaption(gardenGoal(0), 0), '1 more night → first sprout');
    const whole = gardenGoal(72);
    assert.equal(whole.stage, 'dream world');
    assert.equal(whole.next, null);
    assert.equal(goalCaption(whole, 72), 'a whole dream world ✦');
  });
});

describe('gardenState', () => {
  it('is a seed with no dreams', () => {
    const state = gardenState([], now);
    assert.equal(state.growth, 0);
    assert.equal(state.streak, 0);
    assert.equal(state.wilt, null);
  });

  it('grows one night per night told, however many dreams that night', () => {
    const state = gardenState([...nights(2, 1, 0), dream('extra', 0, 9)], now);
    assert.equal(state.growth, 3);
    assert.equal(state.streak, 3);
    assert.equal(state.loggedToday, true);
    assert.deepEqual(
      state.grown.map((g) => g.dreamId),
      ['d2', 'd1', 'd0']
    );
  });

  it('does not count today against them before its dream is told', () => {
    const state = gardenState(nights(3, 2, 1), now);
    assert.equal(state.growth, 3);
    assert.equal(state.streak, 3);
    assert.equal(state.loggedToday, false);
    assert.equal(state.wilt, null);
  });

  it('wilts after a missed night: three nights of growth fade and the streak restarts', () => {
    const state = gardenState(nights(6, 5, 4, 3, 2), now);
    assert.equal(state.growth, 2);
    assert.equal(state.streak, 0);
    assert.deepEqual(state.wilt, { since: '2026-09-27', nights: 1, fromStreak: 5, fromGrowth: 5, toGrowth: 2 });
    assert.equal(state.grown.length, 2);
  });

  it('keeps wilting for each missed night, never below a seed', () => {
    const state = gardenState(nights(5, 4), now);
    assert.equal(state.growth, 0);
    assert.equal(state.wilt?.nights, 3);
    assert.equal(state.wilt?.fromGrowth, 2);
    assert.equal(state.wilt?.toGrowth, 0);
  });

  it('revives with the next dream', () => {
    const state = gardenState(nights(6, 5, 4, 3, 1), now);
    assert.equal(state.wilt, null);
    assert.equal(state.growth, 2);
    assert.equal(state.streak, 1);
  });

  it('earns a dewdrop every 7 nights in a row, which covers a missed night', () => {
    const state = gardenState(nights(9, 8, 7, 6, 5, 4, 3, 1), now);
    assert.equal(state.growth, 8);
    assert.equal(state.streak, 8);
    assert.equal(state.dew, 0);
    assert.equal(state.lastDewSave, '2026-09-26');
    assert.equal(state.wilt, null);
  });

  it('keeps at most two dewdrops', () => {
    const state = gardenState(nights(...Array.from({ length: 30 }, (_, i) => i + 1)), now);
    assert.equal(state.dew, 2);
    assert.equal(state.streak, 30);
    assert.equal(currentStreak(nights(3, 2, 1), now), 3);
  });
});

describe('gardenVisit', () => {
  it('grows from the seed on the first visit', () => {
    const visit = gardenVisit(null, gardenState(nights(2, 1), now));
    assert.equal(visit.fromGrowth, 0);
    assert.equal(visit.burst, 'grow');
    assert.equal(visit.banner, null);
  });

  it('announces a new stage and the growth since last time', () => {
    const before = seenNow(gardenState(nights(4, 3, 2), new Date(2026, 8, 26, 10)));
    const visit = gardenVisit(before, gardenState(nights(4, 3, 2, 1), now));
    assert.equal(visit.fromGrowth, 3);
    assert.equal(visit.banner, 'seedling');
    assert.equal(visit.toast, '+1 night of growth · 4 night streak');
  });

  it('shows the wilted sheet once per wilt', () => {
    const wilted = gardenState(nights(6, 5, 4, 3, 2), now);
    const healthy = { growth: 5, dew: 0, wilted: false, wiltSince: null, dewSave: null };
    const visit = gardenVisit(healthy, wilted);
    assert.equal(visit.wiltSheet, true);
    assert.equal(visit.burst, 'wilt');
    assert.equal(visit.fromGrowth, 5);
    assert.equal(gardenVisit(seenNow(wilted), wilted).wiltSheet, false);
  });

  it('says when a dream revives the garden', () => {
    const wilted = seenNow(gardenState(nights(6, 5, 4, 3, 2), new Date(2026, 8, 28, 10)));
    const revived = gardenState([...nights(6, 5, 4, 3, 2), dream('today', 0)], now);
    assert.equal(gardenVisit(wilted, revived).toast, 'revived ✦ your garden is breathing again');
  });
});

describe('pickCard', () => {
  const list = nights(3, 2, 1);
  const state = gardenState(list, now);

  it('finds the dream that grew a night', () => {
    const card = pickCard({ day: 2, kind: 'flower' }, state, list, now);
    assert.deepEqual(card, { when: 'grew on night 2 · 3 nights ago', title: '“dream d2”', kind: 'a flower bed', dreamId: 'd2' });
  });

  it('calls the seed the night it all began, and the newest night last night', () => {
    assert.equal(pickCard({ day: 0, kind: 'seedling' }, state, list, now)?.when, 'the night it all began');
    const today = [...list, dream('d0', 0)];
    assert.equal(pickCard({ day: 4, kind: 'leaves' }, gardenState(today, now), today, now)?.when, 'grew last night');
  });

  it('has nothing to show for an empty garden', () => {
    assert.equal(pickCard({ day: 0, kind: 'seedling' }, gardenState([], now), [], now), null);
  });
});

describe('wilted sheet', () => {
  it('names what faded', () => {
    assert.deepEqual(lostLabels({ leaves: 3, branch: 2, flower: 1, bush: 2, mushroom: 1, butterfly: 1, path: 1, seedling: 4 }), [
      'fresh leaves',
      'a few twigs',
      '1 flower bed',
      '2 shrubs',
      '1 mushroom patch',
      '1 butterfly',
      '1 stepping stone',
    ]);
  });

  it('says how much growth faded', () => {
    assert.equal(
      wiltBody({ since: '2026-09-27', nights: 1, fromStreak: 5, fromGrowth: 5, toGrowth: 2 }),
      'no dream was logged, so 3 nights of growth faded. your roots are safe — nothing here ever dies.'
    );
    assert.match(wiltBody({ since: '2026-09-25', nights: 3, fromStreak: 2, fromGrowth: 2, toGrowth: 0 }), /for 3 nights, so 2 nights/);
  });
});
