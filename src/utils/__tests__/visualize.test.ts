/** The Visualize screen helpers. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import type { Dream } from '../../types/dream.ts';
import { dreamDay, dreamMood, dustWords, pickDreams, seedFor, spokenText, visualizeTiming, wrapIndex } from '../visualize.ts';

function dream(id: string, status: Dream['analysis_status'] = 'completed'): Dream {
  return {
    id,
    dream_text: `dream ${id}`,
    created_at: '2026-09-27T07:00:00Z',
    title: null,
    summary: null,
    mood: null,
    themes: null,
    reflection: null,
    analysis_status: status,
    image_url: null,
    image_status: 'pending',
    audio_url: null,
    audio_status: 'pending',
  };
}

describe('wrapIndex', () => {
  it('wraps past both ends', () => {
    assert.equal(wrapIndex(7, 7), 0);
    assert.equal(wrapIndex(-1, 7), 6);
    assert.equal(wrapIndex(3, 7), 3);
  });

  it('is 0 for an empty list', () => {
    assert.equal(wrapIndex(4, 0), 0);
  });
});

describe('pickDreams', () => {
  it('keeps only dreams with a finished reflection, newest first, up to the max', () => {
    const all = [dream('a'), dream('b', 'pending'), dream('c'), dream('d', 'failed'), dream('e')];
    const { list, start } = pickDreams(all, null, 2);
    assert.deepEqual(list.map((d) => d.id), ['a', 'c']);
    assert.equal(start, 0);
  });

  it('starts at the focused dream', () => {
    const { list, start } = pickDreams([dream('a'), dream('b'), dream('c')], 'b');
    assert.equal(list[start].id, 'b');
  });

  it('adds an older focused dream in place of the last one', () => {
    const all = [dream('a'), dream('b'), dream('c'), dream('d')];
    const { list, start } = pickDreams(all, 'd', 3);
    assert.deepEqual(list.map((d) => d.id), ['a', 'b', 'd']);
    assert.equal(start, 2);
  });

  it('ignores an unknown or unfinished focus', () => {
    assert.equal(pickDreams([dream('a'), dream('b', 'pending')], 'b').start, 0);
    assert.equal(pickDreams([dream('a')], 'zzz').start, 0);
  });
});

describe('dreamDay', () => {
  const now = new Date(2026, 8, 27, 9); // a sunday

  it('names today and yesterday', () => {
    assert.equal(dreamDay(new Date(2026, 8, 27, 6), now), 'last night');
    assert.equal(dreamDay(new Date(2026, 8, 26, 23), now), 'yesterday');
  });

  it('names the weekday within the week, then the date', () => {
    assert.equal(dreamDay(new Date(2026, 8, 22, 7), now), 'tuesday');
    assert.equal(dreamDay(new Date(2026, 8, 12, 7), now), 'sep 12');
  });
});

describe('dreamMood', () => {
  it('prefers the dreamer’s own mood, lower-cased', () => {
    assert.equal(dreamMood({ mood: 'Wonder', user_mood: 'Calm' }), 'calm');
    assert.equal(dreamMood({ mood: 'Wonder', user_mood: null }), 'wonder');
    assert.equal(dreamMood({ mood: null }), null);
  });
});

describe('spokenText', () => {
  it('keeps short dreams whole, tidied', () => {
    assert.equal(spokenText('  I was   Floating\nin water '), 'i was floating in water');
  });

  it('cuts long dreams at a word', () => {
    const text = spokenText('the house by the river kept moving, room after room', 30);
    assert.equal(text, 'the house by the river kept…');
    assert.ok(text.length <= 31);
  });
});

describe('visualizeTiming', () => {
  it('types, holds briefly, then develops', () => {
    const t = visualizeTiming(false, 10);
    assert.ok(Math.abs(t.type - 0.15) < 1e-9);
    assert.ok(Math.abs(t.out - 0.45) < 1e-9);
    assert.ok(Math.abs(t.develop - 0.55) < 1e-9);
  });

  it('never keeps the dreamer waiting long', () => {
    assert.equal(visualizeTiming(false, 500).type, 0.9);
    assert.ok(visualizeTiming(false, 500).develop < 1.5);
  });

  it('skips the words when repainting', () => {
    assert.deepEqual(visualizeTiming(true, 100), { type: 0, out: 0, develop: 0 });
  });
});

describe('dustWords', () => {
  it('splits into words and letters', () => {
    const words = dustWords('a sea of lights', 1);
    assert.deepEqual(
      words.map((w) => w.chars.map((c) => c.ch).join('')),
      ['a', 'sea', 'of', 'lights']
    );
  });

  it('types every letter in before any blows away', () => {
    const chars = dustWords(spokenText('x'.repeat(40) + ' ' + 'y'.repeat(200)), 3).flatMap((w) => w.chars);
    const lastIn = Math.max(...chars.map((c) => c.in));
    const firstOut = Math.min(...chars.map((c) => c.out));
    assert.ok(lastIn < firstOut);
  });

  it('drifts letters upward, the same way each time', () => {
    const a = dustWords('floating through', 2).flatMap((w) => w.chars);
    const b = dustWords('floating through', 2).flatMap((w) => w.chars);
    assert.deepEqual(a, b);
    for (const c of a) {
      assert.ok(c.dy <= -20 && c.dy >= -80);
      assert.ok(Math.abs(c.dx) <= 30);
    }
  });
});

describe('seedFor', () => {
  it('is stable per id and differs between ids', () => {
    assert.equal(seedFor('abc'), seedFor('abc'));
    assert.notEqual(seedFor('abc'), seedFor('abd'));
  });
});
