/**
 * Unit tests for patterns.ts. Groq is replaced by a fake `fetch`, so no API key is needed.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  askAboutPatterns,
  ASK_PROMPT,
  buildAskBody,
  buildReadBody,
  dreamsBlock,
  MAX_DREAM_CHARS,
  MAX_DREAMS,
  MAX_QUESTION_CHARS,
  nightLabel,
  parseAnswer,
  parseReading,
  READ_MODEL,
  READ_PROMPT,
  readPatterns,
  readQuestion,
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
  { dream_text: 'a lake that rose up the stairs', created_at: '2026-09-25T06:00:00Z' },
];

const goodReading = {
  thread: { title: 'Your mind is rehearsing a change.', body: '2 of your 3 dreams move under you.' },
  insights: [
    { title: 'places that won’t stay still', body: 'rooms and trains that shift.' },
    { title: 'sundays run anxious', body: 'uneasy dreams cluster before the week.' },
    { title: 'what are you getting ready for?', body: 'name it in the morning.' },
  ],
  questions: ['Why so many change dreams', 'when do i dream best?', 'when do i dream best?', 'what should i watch for?'],
};

describe('input checks', () => {
  it('trims and cuts the question', () => {
    assert.equal(readQuestion('  why?  '), 'why?');
    assert.equal(readQuestion('x'.repeat(MAX_QUESTION_CHARS + 20)).length, MAX_QUESTION_CHARS);
    assert.throws(() => readQuestion('   '), /required/);
    assert.throws(() => readQuestion(42), /required/);
  });

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
    assert.ok(block.includes('3. fri sep 25\n   dream: a lake that rose up the stairs'));
    assert.ok(block.endsWith('</dreams>'));
  });

  it('keeps long dreams and long journals short', () => {
    const many = Array.from({ length: MAX_DREAMS + 5 }, (_, i) => ({ dream_text: 'x'.repeat(MAX_DREAM_CHARS + 100), created_at: `2026-09-0${(i % 9) + 1}T06:00:00Z` }));
    const block = dreamsBlock(many);
    assert.equal(block.split('\n   dream: ').length - 1, MAX_DREAMS);
    assert.ok(!block.includes('x'.repeat(MAX_DREAM_CHARS + 1)));
  });
});

describe('request bodies', () => {
  it('reads with strict JSON', () => {
    const body = buildReadBody(dreams);
    assert.equal(body.model, READ_MODEL);
    assert.equal(body.messages[0].content, READ_PROMPT);
    assert.equal(body.messages[1].content, dreamsBlock(dreams));
    assert.equal(body.response_format.json_schema.strict, true);
  });

  it('asks with the question after the dreams', () => {
    const body = buildAskBody(dreams, 'why trains?', 0);
    assert.equal(body.messages[0].content, ASK_PROMPT);
    assert.ok(body.messages[1].content.endsWith('</dreams>\n<question>\nwhy trains?\n</question>'));
  });
});

describe('parseReading', () => {
  it('tidies the reading and its questions', () => {
    const reading = parseReading(goodReading);
    assert.equal(reading.thread.title, 'your mind is rehearsing a change.');
    assert.equal(reading.insights.length, 3);
    assert.deepEqual(reading.questions, ['why so many change dreams?', 'when do i dream best?', 'what should i watch for?']);
  });

  it('keeps only the first three insights', () => {
    const reading = parseReading({ ...goodReading, insights: [...goodReading.insights, { title: 'extra', body: 'extra' }] });
    assert.equal(reading.insights.length, 3);
  });

  it('refuses a reading with missing parts', () => {
    assert.throws(() => parseReading({ ...goodReading, thread: { title: '', body: 'x' } }), /thread/);
    assert.throws(() => parseReading({ ...goodReading, insights: goodReading.insights.slice(0, 2) }), /too few/);
    assert.throws(() => parseReading({ ...goodReading, insights: [goodReading.insights[0], {}, goodReading.insights[2]] }), /insight 2/);
  });

  it('allows a reading without questions', () => {
    assert.deepEqual(parseReading({ ...goodReading, questions: 'nope' }).questions, []);
  });
});

describe('parseAnswer', () => {
  it('lower-cases and unquotes the answer', () => {
    assert.equal(parseAnswer({ answer: '"Your Change dreams began that week."' }), 'your change dreams began that week.');
  });

  it('refuses an empty answer', () => {
    assert.throws(() => parseAnswer({ answer: '  ' }), /empty/);
    assert.throws(() => parseAnswer({}), /missing/);
  });
});

describe('calling Groq', () => {
  it('returns the reading with how many dreams were read', async () => {
    const { fetchImpl, calls } = fakeGroq(200, reply(goodReading));
    const reading = await readPatterns(dreams, 'key', 0, fetchImpl);
    assert.equal(reading.dreamCount, 3);
    assert.equal(reading.thread.body, '2 of your 3 dreams move under you.');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer key');
  });

  it('returns the answer', async () => {
    const { fetchImpl } = fakeGroq(200, reply({ answer: 'they began the week your routine changed.' }));
    assert.equal(await askAboutPatterns(dreams, 'why?', 'key', 0, fetchImpl), 'they began the week your routine changed.');
  });

  it('throws when Groq fails or sends nonsense', async () => {
    await assert.rejects(readPatterns(dreams, 'key', 0, fakeGroq(500, 'boom').fetchImpl), /500/);
    await assert.rejects(readPatterns(dreams, 'key', 0, fakeGroq(200, { choices: [{ message: { content: 'nope' } }] }).fetchImpl), /valid JSON/);
  });
});
