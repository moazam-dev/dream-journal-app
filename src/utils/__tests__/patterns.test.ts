/** The Patterns screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import {
  bestLine,
  bestStreak,
  dreamPeople,
  dreamSymbols,
  MOOD_KEY_COLORS,
  moodHeadline,
  moodNights,
  OTHER_MOOD_COLOR,
  PATTERN_COLORS,
  patternsDate,
  recentDreams,
  tally,
  themeNote,
  topThemes,
  weekLabel,
  weekNights,
} from '../patterns.ts';

// Sunday 27 September 2026, late morning.
const NOW = new Date(2026, 8, 27, 10, 0);

function dream(id: string, told: Date, extra: Partial<Dream> = {}): Dream {
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
    image_url: null,
    image_status: 'pending',
    audio_url: null,
    audio_status: 'pending',
    ...extra,
  };
}

const night = (day: number, hour = 7) => new Date(2026, 8, day, hour);

describe('patternsDate', () => {
  it('reads like the design', () => {
    assert.equal(patternsDate(NOW), 'sunday, sep 27');
  });
});

describe('recentDreams', () => {
  it('keeps the last 30 nights, including today', () => {
    const dreams = [dream('today', night(27)), dream('edge', new Date(2026, 7, 29, 7)), dream('old', new Date(2026, 7, 28, 7)), dream('later', night(28))];
    assert.deepEqual(recentDreams(dreams, NOW).map((d) => d.id), ['today', 'edge']);
  });
});

describe('tally', () => {
  it('counts each name once per dream, ignoring case, most first', () => {
    assert.deepEqual(tally([['Water', 'water', 'doors'], ['doors'], null, ['water ']]), [
      { name: 'water', count: 2 },
      { name: 'doors', count: 2 },
    ]);
  });
});

describe('themes', () => {
  const dreams = [
    dream('a', night(27), { themes: ['change', 'water'], user_mood: 'curious' }),
    dream('b', night(26), { themes: ['Change'], mood: 'Curious' }),
    dream('c', night(24), { themes: ['home'], mood: 'calm' }),
  ];

  it('ranks themes with colours and notes', () => {
    const themes = topThemes(dreams);
    assert.deepEqual(themes.map((t) => [t.name, t.count, t.color]), [
      ['change', 2, PATTERN_COLORS[0]],
      ['water', 1, PATTERN_COLORS[1]],
      ['home', 1, PATTERN_COLORS[2]],
    ]);
    assert.equal(themes[0].note, 'last showed up sep 27. these dreams mostly felt curious.');
    assert.equal(themes[2].note, 'showed up once, on sep 24, feeling calm.');
  });

  it('writes a note without a mood', () => {
    assert.equal(themeNote([dream('x', night(20))]), 'showed up once, on sep 20.');
    assert.equal(themeNote([]), '');
  });
});

describe('weekNights', () => {
  it('marks the caught nights this week and the richest one', () => {
    const long = Array.from({ length: 120 }, () => 'word').join(' ');
    const dreams = [dream('mon', night(21)), dream('wed', night(23), { dream_text: long }), dream('lastweek', night(20))];
    const week = weekNights(dreams, NOW);
    assert.deepEqual(week.nights.map((n) => n.caught), [true, false, true, false, false, false, false]);
    assert.deepEqual(week.nights.map((n) => n.best), [false, false, true, false, false, false, false]);
    assert.equal(week.nights[2].height, 76);
    assert.equal(week.nights[1].height, 16);
    assert.equal(week.caught, 2);
    assert.equal(week.elapsed, 7);
  });

  it('only counts the days so far', () => {
    const tuesday = new Date(2026, 8, 22, 9);
    assert.equal(weekNights([], tuesday).elapsed, 2);
    assert.equal(weekLabel(1, 1), '1 of 1 night caught');
    assert.equal(weekLabel(5, 7), '5 of 7 nights caught');
  });
});

describe('streaks', () => {
  it('finds the longest run of nights ever', () => {
    const dreams = [night(1), night(2), night(2, 22), night(3), night(10), night(11)].map((d, i) => dream(String(i), d));
    assert.equal(bestStreak(dreams), 3);
    assert.equal(bestStreak([]), 0);
  });

  it('runs across a month boundary', () => {
    assert.equal(bestStreak([dream('a', new Date(2026, 7, 31, 7)), dream('b', new Date(2026, 8, 1, 7))]), 2);
  });

  it('says how far the current streak is from the best', () => {
    assert.equal(bestLine(9, 14), '5 more to beat it');
    assert.equal(bestLine(14, 14), 'your best run yet');
    assert.equal(bestLine(0, 0), 'start one tonight');
  });
});

describe('moods', () => {
  const dreams = [
    dream('1', night(27), { mood: 'Calm' }),
    dream('1b', night(27, 3), { mood: 'scared' }),
    dream('2', night(26), { user_mood: 'calm', mood: 'anxious' }),
    dream('3', night(20), { mood: 'uneasy' }),
    dream('4', night(13), { mood: 'uneasy' }),
    dream('5', night(12), { mood: 'weird' }),
    dream('6', night(11), { mood: 'sad' }),
    dream('7', night(10), { mood: 'happy' }),
    dream('8', night(9)),
  ];

  it('gives each of the last nights its newest dream’s mood', () => {
    const { nights, legend, from } = moodNights(dreams, NOW);
    assert.equal(nights.length, 28);
    assert.equal(from, 'aug 31');
    assert.equal(nights[27].mood, 'calm');
    assert.equal(nights[27].color, MOOD_KEY_COLORS[0]);
    assert.equal(nights[26].height, 37);
    assert.equal(nights[0].told, false);
    assert.equal(nights[0].height, 10);
    // A dream without a mood still shows as a bar.
    assert.equal(nights[9].told, true);
    assert.equal(nights[9].color, OTHER_MOOD_COLOR);
    assert.deepEqual(legend.map((m) => [m.name, m.pct]), [
      ['calm', 29],
      ['uneasy', 29],
      ['weird', 14],
      ['sad', 14],
    ]);
  });

  it('writes the headline, with a weekday when a mood keeps landing on one', () => {
    const { nights, legend } = moodNights(dreams, NOW);
    assert.deepEqual(moodHeadline(nights, legend)?.map((p) => p.text).join(''), 'mostly calm, with uneasy sundays.');
    const once = moodNights(dreams.slice(0, 4), NOW);
    assert.equal(moodHeadline(once.nights, once.legend)?.map((p) => p.text).join(''), 'mostly calm, sometimes uneasy.');
    const alone = moodNights(dreams.slice(0, 1), NOW);
    assert.equal(moodHeadline(alone.nights, alone.legend)?.map((p) => p.text).join(''), 'mostly calm.');
    assert.equal(moodHeadline([], []), null);
  });
});

describe('people and symbols', () => {
  const dreams = [
    dream('a', night(27), { people: ['Grandma', 'a stranger'], places: ['the old house'], themes: ['change', 'water'] }),
    dream('b', night(26), { people: ['a stranger', '  rosa'], places: ['The old house'], themes: ['water'] }),
  ];

  it('finds the people who show up most, with initials', () => {
    assert.deepEqual(dreamPeople(dreams).map((p) => [p.name, p.initial, p.label]), [
      ['a stranger', '?', '2 dreams'],
      ['grandma', 'G', '1 dream'],
      ['rosa', 'R', '1 dream'],
    ]);
  });

  it('lists places and smaller themes, skipping the big ones', () => {
    assert.deepEqual(dreamSymbols(dreams, ['water']), [
      { name: 'the old house', count: 2 },
      { name: 'change', count: 1 },
    ]);
  });
});
