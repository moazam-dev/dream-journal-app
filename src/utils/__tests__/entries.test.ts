/** The Entries screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import {
  calendarMonth,
  calendarWeek,
  analysisState,
  clampFan,
  colorFill,
  DREAM_COLORS,
  dreamColor,
  dreamHeadline,
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
  rowDate,
  toldAt,
  streakLabel,
  weekDays,
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

  it('counts this month’s dreams', () => {
    const dreams = [dream('a', new Date(2026, 8, 3), true), dream('b', new Date(2026, 8, 4)), dream('c', new Date(2026, 7, 4), true)];
    assert.equal(monthStats(dreams, now), '2 dreams this month');
    assert.equal(monthStats(dreams.slice(0, 1), now), '1 dream this month');
    assert.equal(monthStats([], now), '0 dreams this month');
  });

  it('dates a row with its weekday', () => {
    assert.equal(rowDate({ created_at: new Date(2026, 8, 27, 7).toISOString() }), 'sun, sep 27');
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

describe('weekDays', () => {
  it('runs monday to sunday and marks the days with a dream', () => {
    // Sunday 27 Sep 2026: the week is Mon 21 – Sun 27.
    const sunday = new Date(2026, 8, 27, 9);
    const dreams = [22, 23, 27, 28].map((d) => dream(String(d), new Date(2026, 8, d, 7)));
    const week = weekDays(dreams, sunday);
    assert.deepEqual(
      week.map((day) => day.letter),
      ['M', 'T', 'W', 'T', 'F', 'S', 'S']
    );
    assert.deepEqual(
      week.map((day) => day.logged),
      [false, true, true, false, false, false, true]
    );
    assert.deepEqual(
      week.map((day) => day.today),
      [false, false, false, false, false, false, true]
    );
  });

  it('starts the week on monday even on a monday', () => {
    const monday = new Date(2026, 8, 28, 9);
    const week = weekDays([dream('m', new Date(2026, 8, 28, 6))], monday);
    assert.equal(week[0].logged, true);
    assert.equal(week[0].today, true);
    assert.equal(week.filter((day) => day.logged).length, 1);
  });
});

describe('dream colours', () => {
  it('uses the colour the dreamer picked', () => {
    assert.equal(dreamColor({ color: 'rose', mood: 'calm' }), 'rose');
  });

  it('picks one from the mood otherwise, whatever the case', () => {
    assert.equal(dreamColor({ mood: 'Anxious' }), dreamColor({ mood: 'anxious' }));
    assert.equal(dreamColor({ mood: 'calm', user_mood: 'weird' }), dreamColor({ mood: 'weird' }));
    assert.ok(dreamColor({ mood: 'wonder' }) in DREAM_COLORS);
  });

  it('ignores a colour it doesn’t know, and is lime without a mood', () => {
    assert.equal(dreamColor({ color: 'plaid', mood: null }), 'lime');
    assert.equal(dreamColor({ mood: null }), 'lime');
  });

  it('turns a colour into its gradient, over a plain fallback', () => {
    assert.deepEqual(colorFill('sky'), {
      backgroundColor: '#A8D8F0',
      experimental_backgroundImage: 'linear-gradient(135deg, #A8D8F0, #B8E6C4)',
    });
  });
});

describe('dreamHeadline', () => {
  it('prefers the title, then the start of the dream', () => {
    assert.equal(dreamHeadline({ title: 'Floating over water', dream_text: 'x' }), 'floating over water');
    assert.equal(dreamHeadline({ title: '  ', dream_text: '  I was   on a train\nwith no doors ' }), 'i was on a train with no doors');
  });
});

describe('the calendar', () => {
  // Sunday 27 Sep 2026.
  const dreams = [dream('early', new Date(2026, 8, 25, 6)), dream('late', new Date(2026, 8, 25, 8)), dream('aug', new Date(2026, 7, 30, 8))];

  it('lays out the month from sunday, with the newest dream on each day', () => {
    const days = calendarMonth(dreams, now);
    assert.equal(days.length, 2 + 30); // september 2026 starts on a tuesday
    assert.equal(days[0], null);
    assert.equal(days[2]?.day, 1);
    const day25 = days[2 + 24];
    assert.equal(day25?.day, 25);
    assert.equal(day25?.dream?.id, 'late');
    assert.equal(days[2 + 26]?.today, true);
    assert.equal(days[2 + 27]?.future, true);
    assert.equal(days[2 + 26]?.future, false);
  });

  it('shows this week, sunday to saturday, even across months', () => {
    const week = calendarWeek(dreams, now);
    assert.deepEqual(
      week.map((day) => day.day),
      [27, 28, 29, 30, 1, 2, 3]
    );
    const monday = calendarWeek(dreams, new Date(2026, 7, 31, 9));
    assert.deepEqual(
      monday.map((day) => day.day),
      [30, 31, 1, 2, 3, 4, 5]
    );
    assert.equal(monday[0].dream?.id, 'aug');
  });
});

describe('the dream page', () => {
  it('says when the dream was told and how long it is', () => {
    const told = { created_at: new Date(2026, 8, 27, 7, 5).toISOString(), dream_text: 'I was on a train' };
    assert.equal(toldAt(told), 'sun, sep 27 · 7:05 am · 5 words');
    const evening = { created_at: new Date(2026, 8, 27, 0, 30).toISOString(), dream_text: 'one' };
    assert.equal(toldAt(evening), 'sun, sep 27 · 12:30 am · 1 word');
  });

  it('knows where the reading is', () => {
    assert.equal(analysisState({ analysis_status: 'completed' }, false), 'ready');
    assert.equal(analysisState({ analysis_status: 'completed' }, true), 'reading');
    assert.equal(analysisState({ analysis_status: 'pending' }, true), 'reading');
    assert.equal(analysisState({ analysis_status: 'pending' }, false), 'unread');
    assert.equal(analysisState({ analysis_status: 'failed' }, false), 'failed');
  });
});
