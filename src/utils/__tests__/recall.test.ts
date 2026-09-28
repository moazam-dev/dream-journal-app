/** The dream week on the recall onboarding screen. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dreamWeek, RECALL_ANSWERS, RECALLS } from '../recall.ts';

const lit = (week: (number | null)[]) => week.filter((place) => place !== null).length;

describe('dreamWeek', () => {
  it('lights no days for 0 nights and every day for 7', () => {
    assert.deepEqual(dreamWeek(0), [null, null, null, null, null, null, null]);
    assert.deepEqual(dreamWeek(7), [0, 3, 5, 1, 6, 2, 4]);
  });

  it('scatters a few nights across the week instead of bunching them', () => {
    // Monday, Thursday and Saturday first.
    assert.deepEqual(dreamWeek(2), [0, null, null, 1, null, null, null]);
    assert.deepEqual(dreamWeek(4), [0, 3, null, 1, null, 2, null]);
  });

  it('lights exactly as many days as each answer says', () => {
    for (const recall of RECALLS) {
      const { nights } = RECALL_ANSWERS[recall];
      assert.equal(lit(dreamWeek(nights)), nights);
    }
  });
});
