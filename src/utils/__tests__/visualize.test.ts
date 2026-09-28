/** The Visualize screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import { cardMeta, dreamMood, pickPaintings, visualizeIntro } from '../visualize.ts';

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
const now = new Date(2026, 8, 27, 9);

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

describe('visualizeIntro', () => {
  it('counts what was painted this week', () => {
    const week = [dream('a', new Date(2026, 8, 27), painted), dream('b', new Date(2026, 8, 21), painted)];
    const old = dream('c', new Date(2026, 8, 1), painted);
    assert.equal(
      visualizeIntro([...week, old], now),
      '2 dreams painted from your own words. swipe to wander back through them, or tap + to paint a new one.'
    );
    assert.equal(visualizeIntro(week.slice(0, 1), now).startsWith('1 dream painted'), true);
  });

  it('still invites a look back when nothing is new, and a first dream when nothing is painted', () => {
    assert.equal(
      visualizeIntro([dream('c', new Date(2026, 8, 1), painted)], now),
      'nothing new painted this week. swipe to wander back, or tap + to paint a new one.'
    );
    assert.equal(visualizeIntro([], now), 'nothing painted yet. tap + and tell afterdream a dream — it’ll be painted here.');
  });
});

describe('cardMeta', () => {
  it('reads "sep 27 • wonder", without a mood when there is none', () => {
    assert.equal(cardMeta({ created_at: new Date(2026, 8, 27, 7).toISOString(), mood: 'Wonder' }), 'sep 27 • wonder');
    assert.equal(cardMeta({ created_at: new Date(2026, 8, 27, 7).toISOString(), mood: null }), 'sep 27');
  });
});
