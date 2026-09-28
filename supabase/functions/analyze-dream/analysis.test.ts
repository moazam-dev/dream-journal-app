/**
 * Unit tests for analysis.ts. Groq is replaced by a fake `fetch`, so no API key is needed.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  analyzeDreamWithGroq,
  buildGroqRequestBody,
  MAX_DREAM_CHARS,
  MAX_FOUND,
  mergeNames,
  parseDreamAnalysis,
  SYSTEM_PROMPT,
} from './analysis.ts';

/** A fake `fetch` that answers like Groq would. */
function fakeGroq(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    const text = typeof body === 'string' ? body : JSON.stringify(body);
    return new Response(text, { status, headers: { 'Content-Type': 'application/json' } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

function groqReply(content: string) {
  return { choices: [{ message: { role: 'assistant', content } }] };
}

const detailedDream =
  'I was walking through an empty city at night. All the shop windows were lit but nobody was ' +
  'inside. I kept looking for my phone to call someone, but every street led back to the same square.';

const detailedAnswer = {
  title: 'The Empty City',
  summary: 'You walk through a lit but empty city, searching for your phone as every street loops back.',
  mood: 'Mysterious',
  themes: ['Isolation', 'Searching', 'Feeling Stuck'],
  reflection:
    'The looping streets may suggest a sense of going in circles. One possible interpretation is a wish to reach out to someone. What might you be searching for?',
  people: [],
  places: ['an empty city', 'the same square'],
};

describe('buildGroqRequestBody', () => {
  it('wraps the dream in <dream> tags and asks for strict JSON', () => {
    const body = buildGroqRequestBody('  I was flying.  ');
    assert.equal(body.messages[0].content, SYSTEM_PROMPT);
    assert.equal(body.messages[1].content, '<dream>\nI was flying.\n</dream>');
    assert.equal(body.response_format.type, 'json_schema');
    assert.equal(body.response_format.json_schema.strict, true);
  });

  it('cuts very long dreams', () => {
    const body = buildGroqRequestBody('a'.repeat(MAX_DREAM_CHARS + 500));
    assert.equal(body.messages[1].content.length, MAX_DREAM_CHARS + '<dream>\n\n</dream>'.length);
  });
});

describe('parseDreamAnalysis', () => {
  it('accepts a normal, detailed answer', () => {
    assert.deepEqual(parseDreamAnalysis(JSON.stringify(detailedAnswer)), detailedAnswer);
  });

  it('accepts a brief answer for a very short dream', () => {
    const shortAnswer = {
      title: 'A Falling Moment',
      summary: 'You fall.',
      mood: 'Uneasy',
      themes: ['Falling'],
      reflection: 'There is little detail to go on, but falling could reflect a feeling of losing control.',
    };
    // No people or places in the answer: still fine, they come back empty.
    assert.deepEqual(parseDreamAnalysis(JSON.stringify(shortAnswer)), { ...shortAnswer, people: [], places: [] });
  });

  it('keeps the people in the dream: lower case, no repeats, never the dreamer', () => {
    const result = parseDreamAnalysis(
      JSON.stringify({ ...detailedAnswer, people: [' Grandma ', 'grandma', 'Me', 'A Stranger', '', 7, 'my dog'] })
    );
    assert.deepEqual(result.people, ['grandma', 'a stranger', 'my dog']);
  });

  it('keeps at most a few people and places', () => {
    const many = Array.from({ length: MAX_FOUND + 4 }, (_, i) => `person ${i}`);
    const result = parseDreamAnalysis(JSON.stringify({ ...detailedAnswer, people: many, places: many }));
    assert.equal(result.people.length, MAX_FOUND);
    assert.equal(result.places.length, MAX_FOUND);
  });

  it('cleans up themes: trims, removes duplicates and blanks, keeps at most 4', () => {
    const result = parseDreamAnalysis(
      JSON.stringify({
        ...detailedAnswer,
        themes: [' Change ', 'change', '', 42, 'Loss', 'Home', 'Water', 'Fire'],
      })
    );
    assert.deepEqual(result.themes, ['Change', 'Loss', 'Home', 'Water']);
  });

  it('removes wrapping quotes from the title', () => {
    const result = parseDreamAnalysis(JSON.stringify({ ...detailedAnswer, title: '"The Empty City"' }));
    assert.equal(result.title, 'The Empty City');
  });

  it('rejects text that is not JSON', () => {
    assert.throws(() => parseDreamAnalysis('Sure! Here is your analysis...'), /valid JSON/);
  });

  it('rejects an empty answer', () => {
    assert.throws(() => parseDreamAnalysis(''), /empty answer/);
    assert.throws(() => parseDreamAnalysis(undefined), /empty answer/);
  });

  it('rejects answers with missing or empty fields', () => {
    const { reflection: _omit, ...withoutReflection } = detailedAnswer;
    assert.throws(() => parseDreamAnalysis(JSON.stringify(withoutReflection)), /"reflection"/);
    assert.throws(
      () => parseDreamAnalysis(JSON.stringify({ ...detailedAnswer, mood: '   ' })),
      /empty "mood"/
    );
  });

  it('rejects JSON that is not an object', () => {
    assert.throws(() => parseDreamAnalysis('["a", "b"]'), /not an object/);
  });
});

describe('mergeNames', () => {
  it('keeps what the dreamer typed and adds the new names', () => {
    assert.deepEqual(mergeNames(['Grandma'], ['grandma', 'a stranger']), ['Grandma', 'a stranger']);
    assert.deepEqual(mergeNames(null, ['my dog']), ['my dog']);
  });

  it('never saves more than the table allows', () => {
    const typed = Array.from({ length: 11 }, (_, i) => `typed ${i}`);
    assert.equal(mergeNames(typed, ['a', 'b', 'c']).length, 12);
  });
});

describe('analyzeDreamWithGroq', () => {
  it('sends the dream to Groq with the API key and returns the analysis', async () => {
    const { fetchImpl, calls } = fakeGroq(200, groqReply(JSON.stringify(detailedAnswer)));

    const result = await analyzeDreamWithGroq(detailedDream, 'gsk_test', fetchImpl);

    assert.deepEqual(result, detailedAnswer);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, 'https://api.groq.com/openai/v1/chat/completions');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer gsk_test');
    assert.match(String(calls[0].init.body), /empty city at night/);
  });

  it('throws when Groq returns an error status (e.g. bad key or rate limit)', async () => {
    const { fetchImpl } = fakeGroq(429, { error: { message: 'Rate limit reached' } });
    await assert.rejects(analyzeDreamWithGroq(detailedDream, 'gsk_test', fetchImpl), /429/);
  });

  it('throws when Groq returns a reply without content', async () => {
    const { fetchImpl } = fakeGroq(200, { choices: [] });
    await assert.rejects(analyzeDreamWithGroq(detailedDream, 'gsk_test', fetchImpl), /empty answer/);
  });

  it('throws when Groq returns malformed JSON content', async () => {
    const { fetchImpl } = fakeGroq(200, groqReply('{"title": "Broken"'));
    await assert.rejects(analyzeDreamWithGroq(detailedDream, 'gsk_test', fetchImpl), /valid JSON/);
  });
});
