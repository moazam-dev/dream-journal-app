/** The Patterns screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import {
  bestStreak,
  castLine,
  castNote,
  castRole,
  localCast,
  MAX_DOTS,
  monthDreams,
  monthHeadline,
  monthReport,
  moodHeadline,
  moodMix,
  MOOD_COLORS,
  patternsDate,
  pickCast,
  pickSymbols,
  QUIET_COLOR,
  recentDreams,
  reportShareText,
  reportStats,
  splitHeadline,
  tally,
  THEME_COLORS,
  threadLabel,
  topThemes,
  VIVID_COLOR,
  vividNights,
  vividNote,
  weekCount,
  type PatternReading,
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

const night = (day: number, hour = 7, minute = 0) => new Date(2026, 8, day, hour, minute);

const reading: PatternReading = {
  thread: { title: 'Your mind is rehearsing a change.', body: '7 of your last 12 dreams shift.' },
  monthTitle: 'a month of rooms that wouldn’t stay still',
  cast: [
    { name: 'Grandma', role: 'family', count: 3, note: 'shows up in kitchens.' },
    { name: 'A stranger', role: 'stranger', count: 2, note: 'always a step ahead.' },
  ],
  symbols: [{ name: 'water', count: 5, meaning: 'how your feelings are moving.' }],
  question: { title: 'What are you getting ready for?', body: 'Name it in the morning.' },
  dreamCount: 12,
};

describe('dates', () => {
  it('reads like the design', () => {
    assert.equal(patternsDate(NOW), 'Sunday, Sep 27');
  });

  it('keeps the last 30 nights, including today', () => {
    const dreams = [dream('today', night(27)), dream('edge', new Date(2026, 7, 29, 7)), dream('old', new Date(2026, 7, 28, 7)), dream('later', night(28))];
    assert.deepEqual(recentDreams(dreams, NOW).map((d) => d.id), ['today', 'edge']);
  });

  it('keeps this calendar month', () => {
    const dreams = [dream('sep', night(1)), dream('aug', new Date(2026, 7, 31, 7))];
    assert.deepEqual(monthDreams(dreams, NOW).map((d) => d.id), ['sep']);
  });
});

describe('streaks and weeks', () => {
  it('counts the dreams told since Monday', () => {
    // Monday was the 21st.
    const dreams = [dream('sun', night(27)), dream('mon', night(21)), dream('mon2', night(21, 23)), dream('lastweek', night(20))];
    assert.equal(weekCount(dreams, NOW), 3);
  });

  it('finds the longest run ever', () => {
    const dreams = [night(1), night(2), night(3), night(10), night(11)].map((d, i) => dream(String(i), d));
    assert.equal(bestStreak(dreams), 3);
    assert.equal(bestStreak([]), 0);
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

describe('dream cast', () => {
  it('guesses roles from how people are named', () => {
    assert.equal(castRole('grandma'), 'family');
    assert.equal(castRole('my mum'), 'family');
    assert.equal(castRole('a stranger'), 'unknown');
    assert.equal(castRole('my dog'), 'companion');
    assert.equal(castRole('old friend'), 'friend');
    assert.equal(castRole('my boss'), 'colleague');
    assert.equal(castRole('Sam'), 'someone');
  });

  it('tallies the saved people with notes', () => {
    const dreams = [
      dream('a', night(27), { people: ['Grandma', 'a stranger'], places: ['the kitchen'], user_mood: 'calm' }),
      dream('b', night(25), { people: ['grandma'], places: ['the old house', 'the kitchen'], mood: 'Calm' }),
      dream('c', night(20), { people: ['my dog'] }),
    ];
    const cast = localCast(dreams);
    assert.deepEqual(cast.map((m) => [m.name, m.count, m.role]), [
      ['Grandma', 2, 'family'],
      ['A stranger', 1, 'unknown'],
      ['My dog', 1, 'companion'],
    ]);
    assert.equal(cast[0].note, 'shows up in the kitchen and the old house. these dreams mostly felt calm.');
    assert.equal(cast[1].note, 'showed up once in the kitchen, on sep 27, and it felt calm.');
    assert.equal(cast[2].note, 'showed up once, on sep 20.');
  });

  it('skips vague places in the note', () => {
    assert.equal(castNote([dream('x', night(20), { places: ['nowhere'] })]), 'showed up once, on sep 20.');
  });

  it('writes a note without places', () => {
    assert.equal(castNote([dream('x', night(20)), dream('y', night(18))]), 'last showed up sep 20.');
    assert.equal(castNote([]), '');
  });

  it('prefers the reading’s cast, which finds people in the dream text', () => {
    const local = localCast([dream('a', night(27), { people: ['sam'] })]);
    assert.deepEqual(pickCast(null, local).map((m) => m.name), ['Sam']);
    const cast = pickCast(reading, local);
    assert.deepEqual(cast.map((m) => [m.name, m.role]), [['Grandma', 'family'], ['A stranger', 'unknown']]);
    assert.deepEqual(pickCast({ ...reading, cast: [] }, local).map((m) => m.name), ['Sam']);
  });

  it('says how often and who', () => {
    assert.equal(castLine({ count: 3, role: 'family' }), '3 dreams · family');
    assert.equal(castLine({ count: 1, role: 'friend' }), '1 dream · friend');
  });
});

describe('monthly report', () => {
  // The 26th is a Saturday.
  const month = [
    dream('a', night(26), { themes: ['change'], mood: 'Calm', people: ['grandma'] }),
    dream('b', night(19), { themes: ['Change', 'home'], user_mood: 'peaceful', people: ['Grandma', 'sam'] }),
    dream('c', night(21), { themes: ['home'], mood: 'uneasy' }),
  ];

  it('sums up the month', () => {
    assert.deepEqual(monthReport(month), { count: 3, topTheme: 'change', mainMood: 'calm', topPerson: 'grandma', calmestDay: 'Saturday' });
    assert.deepEqual(monthReport([]), { count: 0, topTheme: null, mainMood: null, topPerson: null, calmestDay: null });
  });

  it('titles the month from the reading, or from the top theme', () => {
    const report = monthReport(month);
    assert.equal(monthHeadline(report, reading), 'A month of rooms that wouldn’t stay still');
    assert.equal(monthHeadline(report, null), 'A month of change');
    assert.equal(monthHeadline(monthReport([]), null), 'A quiet month, so far');
  });

  it('sets the end of the title in italics', () => {
    assert.deepEqual(splitHeadline('A month of rooms that wouldn’t stay still'), { plain: 'A month of ', italic: 'rooms that wouldn’t stay still' });
    assert.deepEqual(splitHeadline('A quiet month, so far'), { plain: 'A quiet month, ', italic: 'so far' });
    assert.deepEqual(splitHeadline('Strange weeks'), { plain: '', italic: 'Strange weeks' });
  });

  it('shows three numbers and shares them', () => {
    const report = monthReport(month);
    assert.deepEqual(reportStats(report), [
      { value: '3', label: 'dreams' },
      { value: 'change', label: 'top theme' },
      { value: 'calm', label: 'main mood' },
    ]);
    assert.equal(
      reportShareText('September', report, 'A month of change'),
      'My September in dreams on Afterdream: 3 dreams, top theme "change", mostly calm. A month of change.'
    );
  });
});

describe('dive deeper', () => {
  it('ranks themes with colours and a dot per dream', () => {
    const dreams = [dream('a', night(27), { themes: ['change', 'water'] }), dream('b', night(26), { themes: ['Change'] })];
    const themes = topThemes(dreams);
    assert.deepEqual(themes.map((t) => [t.rank, t.name, t.count, t.dots, t.color]), [
      [1, 'Change', 2, 2, THEME_COLORS[0]],
      [2, 'Water', 1, 1, THEME_COLORS[1]],
    ]);
    const many = Array.from({ length: MAX_DOTS + 3 }, (_, i) => dream(String(i), night(1 + i), { themes: ['water'] }));
    assert.equal(topThemes(many)[0].dots, MAX_DOTS);
  });

  it('mixes moods and names the uneasy weekday', () => {
    // The 20th and 13th are Sundays.
    const dreams = [
      dream('a', night(27), { mood: 'calm' }),
      dream('b', night(26), { mood: 'calm' }),
      dream('c', night(20), { mood: 'uneasy' }),
      dream('d', night(13), { mood: 'Uneasy' }),
      dream('e', night(12)),
      dream('f', night(11), { mood: 'calm' }),
    ];
    const mix = moodMix(dreams);
    assert.deepEqual(mix, [
      { name: 'Calm', pct: 60, color: MOOD_COLORS[0] },
      { name: 'Uneasy', pct: 40, color: MOOD_COLORS[1] },
    ]);
    assert.deepEqual(moodHeadline(dreams, mix), { plain: 'Mostly calm, with ', italic: 'uneasy Sundays' });
    assert.deepEqual(moodHeadline(dreams.slice(0, 3), moodMix(dreams.slice(0, 3))), { plain: 'Mostly calm, sometimes ', italic: 'uneasy' });
    assert.deepEqual(moodHeadline([], []), null);
  });

  it('folds rare moods into "Other" so the shares add up', () => {
    const dreams = ['calm', 'calm', 'calm', 'uneasy', 'uneasy', 'awe', 'curious', 'surreal'].map((mood, i) => dream(String(i), night(20 - i), { mood }));
    assert.deepEqual(moodMix(dreams).map((m) => [m.name, m.pct]), [
      ['Calm', 38],
      ['Uneasy', 25],
      ['Awe', 13],
      ['Other', 25],
    ]);
  });

  it('uses the reading’s symbols, or the saved places without meanings', () => {
    const dreams = [dream('a', night(27), { places: ['the lake'], themes: ['change', 'doors'] })];
    assert.deepEqual(pickSymbols(reading, dreams, []), reading.symbols);
    assert.deepEqual(pickSymbols(null, dreams, ['Change']), [
      { name: 'the lake', count: 1, meaning: null },
      { name: 'doors', count: 1, meaning: null },
    ]);
  });

  it('finds the most vivid weekdays', () => {
    const long = Array.from({ length: 90 }, () => 'word').join(' ');
    // 26th Saturday, 27th Sunday, 21st Monday.
    const dreams = [
      dream('sat', night(26, 7, 30), { dream_text: long }),
      dream('sun', night(27, 7, 40), { dream_text: long }),
      dream('mon', night(21, 7, 45)),
    ];
    const nights = vividNights(dreams);
    assert.deepEqual(nights.map((n) => n.day), ['M', 'T', 'W', 'T', 'F', 'S', 'S']);
    assert.deepEqual(nights.map((n) => n.dots), [1, 0, 0, 0, 0, MAX_DOTS, MAX_DOTS]);
    assert.equal(nights[5].color, VIVID_COLOR);
    assert.equal(nights[1].color, QUIET_COLOR);
    assert.equal(vividNote(dreams), 'Weekends are your richest nights. You usually log your dreams around 7:30am.');
    assert.equal(vividNote([dream('mon', night(21, 7))]), 'Mondays are your richest nights.');
    assert.equal(vividNote([]), '');
  });

  it('labels the thread', () => {
    assert.equal(threadLabel(12), 'The thread · 12 dreams');
    assert.equal(threadLabel(1), 'The thread · 1 dream');
  });
});
