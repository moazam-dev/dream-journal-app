/** The Entries screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import {
  clampFan,
  dreamsByDay,
  entryDate,
  fanCard,
  isSeen,
  monthGrid,
  monthStats,
  MOOD_COLORS,
  moodColor,
  nightStreak,
  notesLabel,
  streakLabel,
} from '../entries.ts';

function dream(id: string, told: Date, seen = false): Dream {
  return {
    id,
    dream_text: `dream ${id}`,
    created_at: told.toISOString(),
    title: null,
    summary: null,
    mood: null,
    themes: null,
    reflection: null,
    analysis_status: 'completed',
    image_url: seen ? `https://example.com/${id}.png` : null,
    image_status: seen ? 'completed' : 'pending',
    audio_url: null,
    audio_status: 'pending',
  };
}

const now = new Date(2026, 8, 27, 9);

describe('isSeen', () => {
  it('needs a finished picture with a link', () => {
    assert.equal(isSeen({ image_status: 'completed', image_url: 'x' }), true);
    assert.equal(isSeen({ image_status: 'completed', image_url: null }), false);
    assert.equal(isSeen({ image_status: 'generating', image_url: 'x' }), false);
  });
});

describe('moodColor', () => {
  it('keeps a mood’s colour, whatever the case', () => {
    assert.equal(moodColor('Anxious'), moodColor('anxious'));
    assert.ok(MOOD_COLORS.includes(moodColor('wonder') as (typeof MOOD_COLORS)[number]));
  });

  it('is lime without a mood', () => {
    assert.equal(moodColor(null), '#E2EB98');
  });
});

describe('monthGrid', () => {
  it('knows where the month starts and how long it is', () => {
    assert.deepEqual(monthGrid(2026, 8), { lead: 2, days: 30 }); // september 2026 starts on a tuesday
    assert.deepEqual(monthGrid(2028, 1), { lead: 2, days: 29 }); // leap february
  });
});

describe('dreamsByDay', () => {
  it('keeps the newest dream of each day in the month', () => {
    const early = dream('early', new Date(2026, 8, 25, 6));
    const late = dream('late', new Date(2026, 8, 25, 8));
    const other = dream('other', new Date(2026, 7, 25, 8));
    const days = dreamsByDay([early, late, other], 2026, 8);
    assert.equal(days.get(25)?.id, 'late');
    assert.equal(days.size, 1);
  });
});

describe('nightStreak', () => {
  it('counts back from today', () => {
    const dreams = [25, 26, 27].map((d) => dream(String(d), new Date(2026, 8, d, 7)));
    assert.equal(nightStreak(dreams, now), 3);
  });

  it('still counts when today’s dream isn’t told yet', () => {
    const dreams = [25, 26].map((d) => dream(String(d), new Date(2026, 8, d, 7)));
    assert.equal(nightStreak(dreams, now), 2);
  });

  it('stops at a gap', () => {
    const dreams = [23, 26, 27].map((d) => dream(String(d), new Date(2026, 8, d, 7)));
    assert.equal(nightStreak(dreams, now), 2);
    assert.equal(nightStreak([dream('old', new Date(2026, 8, 20))], now), 0);
  });
});

describe('labels', () => {
  it('reads naturally', () => {
    assert.equal(streakLabel(0), null);
    assert.equal(streakLabel(1), '☾ 1 night in a row');
    assert.equal(streakLabel(9), '☾ 9 nights in a row');
    assert.equal(notesLabel(1), '1 note · tap to read');
    assert.equal(notesLabel(4), '4 notes · tap to read');
    assert.equal(entryDate({ created_at: new Date(2026, 8, 7, 7).toISOString() }), 'sep 7');
  });

  it('counts this month’s dreams and the seen ones', () => {
    const dreams = [dream('a', new Date(2026, 8, 3), true), dream('b', new Date(2026, 8, 4)), dream('c', new Date(2026, 7, 4), true)];
    assert.equal(monthStats(dreams, now), '2 dreams this month · 1 seen');
    assert.equal(monthStats([], now), '0 dreams this month · 0 seen');
  });
});

describe('the fan', () => {
  it('clamps its position, with a little give while dragging', () => {
    assert.equal(clampFan(-1, 5), 0);
    assert.equal(clampFan(9, 5), 4);
    assert.equal(clampFan(-1, 5, 0.4), -0.4);
    assert.equal(clampFan(3, 0), 0);
  });

  it('lifts the middle card and turns the others out', () => {
    const middle = fanCard(0);
    assert.deepEqual(middle, { rotate: 0, lift: -22, scale: 1.06, opacity: 1, dim: 0, z: 100 });
    const right = fanCard(2);
    assert.equal(right.rotate, 18);
    assert.equal(right.lift, 0);
    assert.ok(right.dim > 0 && right.dim <= 0.55);
    assert.ok(right.z < middle.z);
    assert.equal(fanCard(-4).opacity, 0);
  });
});
