/** The "personalizing" reveal after onboarding. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { dreamerCard, dreamerName, loadingStatus, slideAt, SLIDE_MS, TOTAL_MS } from '../personalize.ts';

describe('slideAt', () => {
  it('moves to the next slide every SLIDE_MS', () => {
    assert.equal(slideAt(0), 0);
    assert.equal(slideAt(SLIDE_MS - 1), 0);
    assert.equal(slideAt(SLIDE_MS), 1);
    assert.equal(slideAt(SLIDE_MS * 2), 2);
  });

  it('stays on the last slide once the reveal is over', () => {
    assert.equal(slideAt(TOTAL_MS), 2);
    assert.equal(slideAt(TOTAL_MS * 5), 2);
  });
});

describe('loadingStatus', () => {
  it('names what is happening on each slide', () => {
    assert.equal(loadingStatus(0), 'reading your answers');
    // The dots keep their own beat, so only the words are checked here.
    const words = (elapsed: number) => loadingStatus(elapsed).replace(/\.+$/, '');
    assert.equal(words(SLIDE_MS), 'tuning your journal');
    assert.equal(words(SLIDE_MS * 2 + 10), 'almost ready');
  });

  it('grows the dots one at a time, then starts over', () => {
    assert.equal(loadingStatus(400), 'reading your answers.');
    assert.equal(loadingStatus(800), 'reading your answers..');
    assert.equal(loadingStatus(1200), 'reading your answers...');
    assert.equal(loadingStatus(1600), 'reading your answers');
  });
});

describe('dreamerName', () => {
  it('uses their name, trimmed', () => {
    assert.equal(dreamerName('  Sam '), 'Sam');
  });

  it('falls back to "dreamer" when they skipped it', () => {
    assert.equal(dreamerName(undefined), 'dreamer');
    assert.equal(dreamerName('   '), 'dreamer');
    assert.equal(dreamerName(42), 'dreamer');
  });
});

describe('dreamerCard', () => {
  it('builds the card from every answer', () => {
    const card = dreamerCard({ name: 'Sam', birthday: '1998-04-14', recall: 'few-a-week', goals: ['remember', 'lucid'] });
    assert.equal(card.name, 'Sam');
    assert.equal(card.number, 'no. 0414');
    assert.ok(card.moon);
    assert.deepEqual(card.traits, [
      { label: 'dream recall', value: 'few times a week', color: '#A8D8F0' },
      { label: 'your focus', value: 'remember more', color: '#E2EB98' },
      { label: 'morning nudge', value: '7:30 am', color: '#E2EB98' },
    ]);
  });

  it('uses the first goal they picked as their focus', () => {
    const card = dreamerCard({ goals: ['stress', 'remember'] });
    assert.equal(card.traits[1].value, 'stress less');
  });

  it('still fills the card when everything was skipped', () => {
    const card = dreamerCard({});
    assert.equal(card.name, 'dreamer');
    assert.equal(card.number, null);
    assert.equal(card.moon, null);
    assert.equal(card.traits.length, 3);
    assert.equal(card.traits[0].value, "we'll find out");
    assert.equal(card.traits[1].value, 'just exploring');
  });

  it('ignores answers it does not recognise', () => {
    const card = dreamerCard({ birthday: '14/04/1998', recall: 'always', goals: ['fly'] });
    assert.equal(card.number, null);
    assert.equal(card.traits[0].value, "we'll find out");
    assert.equal(card.traits[1].value, 'just exploring');
  });
});
