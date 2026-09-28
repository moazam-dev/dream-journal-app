/** The Today screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  activeCard,
  addTag,
  MAX_TAGS,
  sameTags,
  fragmentsHint,
  fragmentTurns,
  MAX_ASKS,
  capsuleLine,
  capsuleRow,
  dateKey,
  dayOfYear,
  daysUntil,
  fromDateKey,
  isUnlocked,
  longDate,
  formatClock,
  QUOTES,
  quoteOfDay,
  quoteShareText,
  resultDate,
  shortDate,
  todayGreeting,
  TYPEWRITER_START,
  typewriterStep,
  typewriterText,
  unlockDate,
  wordCount,
  writeHint,
} from '../today.ts';

describe('todayGreeting', () => {
  it('changes with the time of day', () => {
    assert.equal(todayGreeting('Sam', 7), 'good morning, Sam.');
    assert.equal(todayGreeting('Sam', 14), 'hey Sam, still thinking about it?');
    assert.equal(todayGreeting('Sam', 21), 'evening, Sam.');
  });

  it('says "you" without a name', () => {
    assert.equal(todayGreeting(null, 7), 'good morning, you.');
    assert.equal(todayGreeting('   ', 21), 'evening, you.');
  });
});

describe('quoteOfDay', () => {
  it('counts January 1st as day 1', () => {
    assert.equal(dayOfYear(new Date(2026, 0, 1, 9)), 1);
    assert.equal(dayOfYear(new Date(2026, 1, 1, 23)), 32);
  });

  it('keeps one quote all day and moves on the next day', () => {
    const morning = quoteOfDay(new Date(2026, 8, 27, 6));
    assert.equal(quoteOfDay(new Date(2026, 8, 27, 23)), morning);
    assert.notEqual(quoteOfDay(new Date(2026, 8, 28, 6)), morning);
  });

  it('cycles through every quote in a week', () => {
    const week = new Set(Array.from({ length: QUOTES.length }, (_, i) => quoteOfDay(new Date(2026, 3, 1 + i))));
    assert.equal(week.size, QUOTES.length);
  });

  it('signs the shared text', () => {
    assert.equal(quoteShareText({ text: 'hope is a waking dream.', by: 'Aristotle' }), '“hope is a waking dream.” — Aristotle · via afterdream');
  });
});

describe('formatClock and shortDate', () => {
  it('formats seconds as m:ss', () => {
    assert.equal(formatClock(0), '0:00');
    assert.equal(formatClock(9), '0:09');
    assert.equal(formatClock(75), '1:15');
  });

  it('writes short lower-case dates', () => {
    assert.equal(shortDate(new Date(2026, 9, 27)), 'oct 27');
  });
});

describe('typewriter', () => {
  const lines = ['ab', 'c'];

  it('types, holds, erases, then starts the next line', () => {
    let state = TYPEWRITER_START;
    const seen: string[] = [];
    for (let i = 0; i < 40; i++) {
      state = typewriterStep(state, lines);
      seen.push(typewriterText(state, lines));
    }
    assert.deepEqual(seen.slice(0, 3), ['a', 'ab', 'ab']);
    // After the hold it erases back to nothing, then types "c".
    const firstC = seen.indexOf('c');
    assert.ok(firstC > 0);
    assert.deepEqual(seen.slice(firstC - 3, firstC), ['a', '', '']);
  });

  it('wraps back to the first line', () => {
    const state = typewriterStep({ line: 1, char: 0, dir: -1 }, lines);
    assert.deepEqual(state, { line: 0, char: 0, dir: 1 });
  });
});

describe('unlockDate', () => {
  it('adds months, clamping to the end of short months', () => {
    assert.deepEqual(unlockDate(new Date(2026, 8, 27), 1), new Date(2026, 9, 27));
    assert.deepEqual(unlockDate(new Date(2026, 0, 31), 1), new Date(2026, 1, 28));
    assert.deepEqual(unlockDate(new Date(2026, 8, 27), 12), new Date(2027, 8, 27));
  });
});

describe('capsules', () => {
  const now = new Date(2026, 8, 27, 9);
  const capsule = { id: 'a', sealedAt: new Date(2026, 5, 3, 22).toISOString(), opensOn: '2026-10-27', seconds: 72 };

  it('round-trips calendar dates', () => {
    assert.equal(dateKey(new Date(2027, 2, 5, 23)), '2027-03-05');
    assert.deepEqual(fromDateKey('2027-03-05'), new Date(2027, 2, 5));
  });

  it('counts whole days, ignoring the time of day', () => {
    assert.equal(daysUntil(new Date(2026, 9, 27), now), 30);
    assert.equal(daysUntil(new Date(2026, 8, 27, 23), now), 0);
  });

  it('opens on its day', () => {
    assert.equal(isUnlocked(capsule, now), false);
    assert.equal(isUnlocked(capsule, new Date(2026, 9, 27, 6)), true);
  });

  it('describes locked and unlocked rows', () => {
    assert.deepEqual(capsuleRow(capsule, now), { locked: true, title: 'sealed jun 3', subtitle: 'opens oct 27 · 30 days to go', length: '1:12' });
    assert.deepEqual(capsuleRow(capsule, new Date(2026, 9, 28)), { locked: false, title: 'sealed jun 3', subtitle: 'unlocked · tap to listen', length: '1:12' });
    const fresh = { ...capsule, sealedAt: now.toISOString(), opensOn: '2026-09-28' };
    assert.equal(capsuleRow(fresh, now).title, 'sealed today');
    assert.equal(capsuleRow(fresh, now).subtitle, 'opens sep 28 · 1 day to go');
  });

  it('links to the capsule', () => {
    assert.equal(capsuleLine(0), 'your capsule is empty · see how it works');
    assert.equal(capsuleLine(1), '1 message in your capsule · see all');
    assert.equal(capsuleLine(3), '3 messages in your capsule · see all');
  });
});

describe('dream flow text', () => {
  it('counts words for the write hint', () => {
    assert.equal(wordCount('  '), 0);
    assert.equal(wordCount('a house\nmade  of water'), 5);
    assert.equal(writeHint('', false), 'tap to start writing');
    assert.equal(writeHint('', true), 'no wrong way to do this');
    assert.equal(writeHint('water', true), '1 word · tap ↑ to interpret');
    assert.equal(writeHint('a house of water', false), '4 words · tap ↑ to interpret');
  });

  it('formats result and unlock dates', () => {
    assert.equal(resultDate(new Date(2026, 8, 27)), 'sunday, sep 27');
    assert.equal(longDate(new Date(2027, 8, 27)), 'september 27, 2027');
  });
});

describe('activeCard', () => {
  it('rounds to the nearest card and stays in range', () => {
    assert.equal(activeCard(0, 620, 5), 0);
    assert.equal(activeCard(320, 620, 5), 1);
    assert.equal(activeCard(-50, 620, 5), 0);
    assert.equal(activeCard(9999, 620, 5), 4);
    assert.equal(activeCard(100, 0, 5), 0);
  });
});

describe('dream details', () => {
  it('turns the talk fragments into a transcript', () => {
    assert.deepEqual(fragmentTurns([{ question: 'who was there?', answer: 'a stranger' }]), [
      { from: 'afterdream', text: 'who was there?' },
      { from: 'you', text: 'a stranger' },
    ]);
  });

  it('counts pieces towards the limit', () => {
    assert.equal(fragmentsHint(0), 'tap an answer or type your own');
    assert.equal(fragmentsHint(1), `1 piece so far · up to ${MAX_ASKS - 1} more`);
    assert.equal(fragmentsHint(2), `2 pieces so far · up to ${MAX_ASKS - 2} more`);
    assert.equal(fragmentsHint(MAX_ASKS), 'that’s plenty — piecing it together');
  });

  it('adds tidy, unique tags', () => {
    assert.deepEqual(addTag([], '  my   sister '), ['my sister']);
    assert.deepEqual(addTag(['My Sister'], 'my sister'), ['My Sister']);
    assert.deepEqual(addTag(['mum'], '   '), ['mum']);
    assert.equal(addTag([], 'x'.repeat(60))[0].length, 40);
  });

  it('stops at the limit', () => {
    const full = Array.from({ length: MAX_TAGS }, (_, i) => `p${i}`);
    assert.equal(addTag(full, 'one more').length, MAX_TAGS);
  });

  it('compares tag lists', () => {
    assert.equal(sameTags(['a', 'b'], ['a', 'b']), true);
    assert.equal(sameTags(['a', 'b'], ['b', 'a']), false);
    assert.equal(sameTags([], ['a']), false);
  });
});
