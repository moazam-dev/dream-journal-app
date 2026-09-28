/** Moon phase maths for the birthday onboarding screen. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { daysInMonth, moonPhase } from '../moon.ts';

describe('moonPhase', () => {
  it('knows well-documented new and full moons', () => {
    assert.equal(moonPhase(2000, 0, 6).name, 'a new moon');
    assert.equal(moonPhase(2000, 0, 21).name, 'a full moon'); // total lunar eclipse
    assert.equal(moonPhase(2000, 0, 14).name, 'a first quarter moon');
    assert.equal(moonPhase(2000, 0, 28).name, 'a last quarter moon');
    assert.equal(moonPhase(2024, 3, 8).name, 'a new moon'); // total solar eclipse
  });

  it('keeps the cycle between 0 and 1 for dates before the reference moon', () => {
    const { cycle } = moonPhase(1940, 0, 1);
    assert.ok(cycle >= 0 && cycle < 1);
  });
});

describe('daysInMonth', () => {
  it('handles leap years', () => {
    assert.equal(daysInMonth(2000, 1), 29);
    assert.equal(daysInMonth(1900, 1), 28);
    assert.equal(daysInMonth(2001, 1), 28);
    assert.equal(daysInMonth(2001, 11), 31);
  });
});
