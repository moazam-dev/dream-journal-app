/** The "personalizing" reveal after onboarding. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dreamerName, loadingPercent, loadingStatus, slideAt, slideProgress, TOTAL_MS } from '../personalize.ts';

describe('slideAt', () => {
  it('moves to the next slide when each one is over', () => {
    assert.equal(slideAt(0), 0);
    assert.equal(slideAt(4199), 0);
    assert.equal(slideAt(4200), 1);
    assert.equal(slideAt(8399), 1);
    assert.equal(slideAt(8400), 2);
  });

  it('stays on the last slide once the reveal is over', () => {
    assert.equal(TOTAL_MS, 12800);
    assert.equal(slideAt(TOTAL_MS), 2);
    assert.equal(slideAt(TOTAL_MS * 5), 2);
  });
});

describe('slideProgress', () => {
  it('fills only the current slide', () => {
    assert.equal(slideProgress(2100, 0), 0.5);
    assert.equal(slideProgress(2100, 1), 0);
    assert.equal(slideProgress(6300, 0), 1);
    assert.equal(slideProgress(6300, 1), 0.5);
    assert.equal(slideProgress(10600, 2), 0.5);
  });

  it('stays full once the reveal is over', () => {
    assert.equal(slideProgress(TOTAL_MS * 2, 2), 1);
  });
});

describe('loadingStatus', () => {
  it('names what is happening on each slide', () => {
    assert.equal(loadingStatus(0), 'reading your answers…');
    assert.equal(loadingStatus(4200), 'personalizing your journal…');
    assert.equal(loadingStatus(9000), 'setting up your patterns…');
  });
});

describe('loadingPercent', () => {
  it('counts up to 100 over the whole reveal', () => {
    assert.equal(loadingPercent(0), 0);
    assert.equal(loadingPercent(TOTAL_MS / 2), 50);
    assert.equal(loadingPercent(TOTAL_MS), 100);
    assert.equal(loadingPercent(TOTAL_MS * 3), 100);
    assert.equal(loadingPercent(-10), 0);
  });
});

describe('dreamerName', () => {
  it('uses their name, trimmed', () => {
    assert.equal(dreamerName('  Sam '), 'Sam');
  });

  it('falls back to "dreamer" when they skipped it', () => {
    assert.equal(dreamerName(undefined), 'dreamer');
    assert.equal(dreamerName(null), 'dreamer');
    assert.equal(dreamerName('   '), 'dreamer');
    assert.equal(dreamerName(42), 'dreamer');
  });
});
