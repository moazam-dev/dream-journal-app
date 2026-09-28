/**
 * Unit tests for patterns.ts. Groq is replaced by a fake `fetch`, so no API key is needed.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildReadBody,
  countDreams,
  dreamsBlock,
  MAX_CAST,
  MAX_DREAM_CHARS,
  MAX_DREAMS,
  nightLabel,
  parseReading,
  READ_MODEL,
  READ_PROMPT,
  readPatterns,
  readTimezoneOffset,
  type JournalDream,
} from './patterns.ts';

function fakeGroq(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const reply = (content: unknown) => ({ choices: [{ message: { role: 'assistant', content: JSON.stringify(content) } }] });

const dreams: JournalDream[] = [
  {
    dream_text: 'I was on a train with no doors.',
    created_at: '2026-09-27T07:30:00Z',
    title: 'The Doorless Train',
    mood: 'Curious',
    user_mood: null,
    themes: ['change', 'travel'],
    people: ['a stranger'],
    places: [],
  },
  { dream_text: 'my grandmother’s kitchen, but the walls kept moving', created_at: '2026-09-26T06:00:00Z', mood: 'calm', user_mood: 'wistful' },
  { dream_text: 'grandma and a lake that rose up the stairs', created_at: '2026-09-25T06:00:00Z' },
];

const goodReading = {
  thread: { title: 'your mind is rehearsing a change.', body: '2 of your 3 dreams move under you.' },
  monthTitle: '“A month of rooms that wouldn’t stay still.”',
  cast: [
    { name: 'a stranger', role: 'Stranger', dreams: [1], note: 'Faceless, always a step ahead.' },
    { name: 'Grandma', role: 'family member', dreams: [2, 3, 3, 9, 0], note: 'shows up in kitchens and brings calm.' },
    { name: 'grandma', role: 'family', dreams: [2], note: 'duplicate.' },
    { name: 'me', role: 'self', dreams: [1, 2, 3], note: 'the dreamer.' },
    { name: 'Ghost', role: 'figure', dreams: [42], note: 'not in any real dream.' },
  ],
  symbols: [
    { name: 'Doors', dreams: [1], meaning: 'choices you are weighing.' },
    { name: 'water', dreams: [3, 2], meaning: 'how your feelings are moving.' },
    { name: 'sea', dreams: [], meaning: 'never in a dream.' },
    { name: 'stairs', dreams: [3], meaning: '' },
  ],
  question: { title: 'What are you getting ready for?', body: 'Name it in the morning.' },
};

describe('input checks', () => {
  it('accepts only sensible time zone offsets', () => {
    assert.equal(readTimezoneOffset(-300), -300);
    assert.equal(readTimezoneOffset(480.4), 480);
    assert.equal(readTimezoneOffset(99999), 0);
    assert.equal(readTimezoneOffset('60'), 0);
  });
});

describe('dreamsBlock', () => {
  it('names nights in the dreamer’s time zone', () => {
    assert.equal(nightLabel('2026-09-27T02:00:00Z', 0), 'sun sep 27');
    // 02:00 UTC is still Saturday evening five hours behind.
    assert.equal(nightLabel('2026-09-27T02:00:00Z', 300), 'sat sep 26');
    assert.equal(nightLabel('not a date', 0), 'unknown night');
  });

  it('lists each dream with its details, preferring the dreamer’s own mood', () => {
    const block = dreamsBlock(dreams);
    assert.ok(block.startsWith('<dreams>\n1. sun sep 27 · title: The Doorless Train · mood: Curious · themes: change, travel · people: a stranger\n'));
    assert.ok(block.includes('2. sat sep 26 · mood: wistful\n   dream: my grandmother’s kitchen'));
    assert.ok(block.includes('3. fri sep 25\n   dream: grandma and a lake that rose up the stairs'));
    assert.ok(block.endsWith('</dreams>'));
  });

  it('keeps long dreams and long journals short', () => {
    const many = Array.from({ length: MAX_DREAMS + 5 }, (_, i) => ({ dream_text: 'x'.repeat(MAX_DREAM_CHARS + 100), created_at: `2026-09-0${(i % 9) + 1}T06:00:00Z` }));
    const block = dreamsBlock(many);
    assert.equal(block.split('\n   dream: ').length - 1, MAX_DREAMS);
    assert.ok(!block.includes('x'.repeat(MAX_DREAM_CHARS + 1)));
  });
});

describe('request body', () => {
  it('reads with strict JSON and asks for the cast from the dream text', () => {
    const body = buildReadBody(dreams);
    assert.equal(body.model, READ_MODEL);
    assert.equal(body.messages[0].content, READ_PROMPT);
    assert.equal(body.messages[1].content, dreamsBlock(dreams));
    assert.equal(body.response_format.json_schema.strict, true);
    assert.deepEqual(body.response_format.json_schema.schema.required, ['thread', 'monthTitle', 'cast', 'symbols', 'question']);
    assert.match(READ_PROMPT, /from the dream text itself/);
  });
});

describe('countDreams', () => {
  it('counts each real dream once', () => {
    assert.equal(countDreams([1, 2, 2, 3], 3), 3);
    assert.equal(countDreams([0, 4, -1, 1.5, '2'], 3), 0);
    assert.equal(countDreams('1,2', 3), 0);
  });
});

describe('parseReading', () => {
  it('tidies the thread, month title and question', () => {
    const reading = parseReading(goodReading, 3);
    assert.equal(reading.thread.title, 'Your mind is rehearsing a change.');
    assert.equal(reading.monthTitle, 'A month of rooms that wouldn’t stay still');
    assert.equal(reading.question.title, 'What are you getting ready for?');
  });

  it('counts the cast from real dreams, merges repeats and leaves out the dreamer', () => {
    const { cast } = parseReading(goodReading, 3);
    assert.deepEqual(cast, [
      { name: 'Grandma', role: 'family', count: 2, note: 'shows up in kitchens and brings calm.' },
      { name: 'A stranger', role: 'stranger', count: 1, note: 'faceless, always a step ahead.' },
    ]);
  });

  it('keeps at most a few cast members', () => {
    const many = Array.from({ length: MAX_CAST + 3 }, (_, i) => ({ name: `person ${i}`, role: 'friend', dreams: [1], note: 'x' }));
    assert.equal(parseReading({ ...goodReading, cast: many }, 3).cast.length, MAX_CAST);
  });

  it('keeps symbols with a meaning, most frequent first', () => {
    const { symbols } = parseReading(goodReading, 3);
    assert.deepEqual(symbols.map((s) => [s.name, s.count]), [['water', 2], ['doors', 1]]);
    assert.equal(symbols[0].meaning, 'How your feelings are moving.');
  });

  it('allows a reading with nobody in it', () => {
    assert.deepEqual(parseReading({ ...goodReading, cast: 'nope' }, 3).cast, []);
  });

  it('refuses a reading with missing parts', () => {
    assert.throws(() => parseReading({ ...goodReading, thread: { title: '', body: 'x' } }, 3), /thread/);
    assert.throws(() => parseReading({ ...goodReading, question: {} }, 3), /question/);
    assert.throws(() => parseReading({ ...goodReading, monthTitle: '  ' }, 3), /month title/);
  });
});

describe('calling Groq', () => {
  it('returns the reading with how many dreams were read', async () => {
    const { fetchImpl, calls } = fakeGroq(200, reply(goodReading));
    const reading = await readPatterns(dreams, 'key', 0, fetchImpl);
    assert.equal(reading.dreamCount, 3);
    assert.equal(reading.cast[0].name, 'Grandma');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer key');
  });

  it('throws when Groq fails or sends nonsense', async () => {
    await assert.rejects(readPatterns(dreams, 'key', 0, fakeGroq(500, 'boom').fetchImpl), /500/);
    await assert.rejects(readPatterns(dreams, 'key', 0, fakeGroq(200, { choices: [{ message: { content: 'nope' } }] }).fetchImpl), /valid JSON/);
  });
});
