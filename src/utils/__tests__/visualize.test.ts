/** The Visualize screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import { cardMeta, dreamMood, paintingRows, pickPaintings, unpaintedDreams } from '../visualize.ts';

type Paint = Pick<Dream, 'image_status' | 'image_url' | 'analysis_status'>;

function dream(id: string, told: Date, paint: Partial<Paint> = {}): Dream {
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
    ...paint,
  };
}

const painted = { image_status: 'completed', image_url: 'https://example.com/x.png' } as const;

describe('dreamMood', () => {
  it('prefers the dreamer’s own mood, lower-cased', () => {
    assert.equal(dreamMood({ mood: 'Wonder', user_mood: 'Calm' }), 'calm');
    assert.equal(dreamMood({ mood: 'Wonder', user_mood: null }), 'wonder');
    assert.equal(dreamMood({ mood: null }), null);
  });
});

describe('pickPaintings', () => {
  const a = dream('a', new Date(2026, 8, 27), painted);
  const b = dream('b', new Date(2026, 8, 26), { image_status: 'generating' });
  const c = dream('c', new Date(2026, 8, 25));
  const d = dream('d', new Date(2026, 8, 24), painted);
  const e = dream('e', new Date(2026, 8, 23), { analysis_status: 'pending' });

  it('keeps painted dreams and ones being painted, newest first', () => {
    assert.deepEqual(
      pickPaintings([c, d, a, b, e]).map((x) => x.id),
      ['a', 'b', 'd']
    );
  });

  it('adds the dream asked for, so it gets painted', () => {
    assert.deepEqual(
      pickPaintings([a, b, c, d], 'c').map((x) => x.id),
      ['a', 'b', 'c', 'd']
    );
  });

  it('leaves out an unread dream even when asked (its picture comes from the reading)', () => {
    assert.deepEqual(
      pickPaintings([a, e], 'e').map((x) => x.id),
      ['a']
    );
  });
});

describe('unpaintedDreams', () => {
  it('lists every dream not painted or being painted, newest first, read or not', () => {
    const a = dream('a', new Date(2026, 8, 27), painted);
    const b = dream('b', new Date(2026, 8, 26), { image_status: 'generating' });
    const c = dream('c', new Date(2026, 8, 25));
    const d = dream('d', new Date(2026, 8, 24), { image_status: 'failed' });
    const e = dream('e', new Date(2026, 8, 28), { analysis_status: 'pending' });
    assert.deepEqual(
      unpaintedDreams([c, d, a, b, e]).map((x) => x.id),
      ['e', 'c', 'd']
    );
  });
});

describe('paintingRows', () => {
  // A tuesday: the week started on monday the 28th.
  const now = new Date(2026, 8, 29, 9);

  it('splits the gallery into this week, the rest of this month, and earlier, keeping the order', () => {
    const rows = paintingRows(
      [
        dream('a', new Date(2026, 8, 29, 7), painted),
        dream('b', new Date(2026, 8, 28, 1), painted),
        dream('c', new Date(2026, 8, 27, 23), painted),
        dream('d', new Date(2026, 8, 1, 3), painted),
        dream('e', new Date(2026, 7, 31, 22), painted),
      ],
      now
    );
    assert.deepEqual(
      rows.map((row) => [row.key, row.dreams.map((x) => x.id)]),
      [
        ['week', ['a', 'b']],
        ['month', ['c', 'd']],
        ['earlier', ['e']],
      ]
    );
  });

  it('always keeps this week (for "your next dream"), and leaves out empty rows', () => {
    assert.deepEqual(
      paintingRows([dream('d', new Date(2026, 8, 10), painted)], now).map((row) => [row.key, row.dreams.length]),
      [
        ['week', 0],
        ['month', 1],
      ]
    );
    assert.deepEqual(
      paintingRows([], now).map((row) => row.key),
      ['week']
    );
  });

  it('counts a week that started last month as this week', () => {
    const rows = paintingRows([dream('a', new Date(2026, 8, 30), painted)], new Date(2026, 9, 1, 9));
    assert.deepEqual(
      rows.map((row) => [row.key, row.dreams.length]),
      [['week', 1]]
    );
  });
});

describe('cardMeta', () => {
  it('reads "sep 27 • wonder", without a mood when there is none', () => {
    assert.equal(cardMeta({ created_at: new Date(2026, 8, 27, 7).toISOString(), mood: 'Wonder' }), 'sep 27 • wonder');
    assert.equal(cardMeta({ created_at: new Date(2026, 8, 27, 7).toISOString(), mood: null }), 'sep 27');
  });
});
