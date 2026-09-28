/**
 * Unit tests for fragments.ts. Groq is replaced by a fake `fetch`, so no API key is needed.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  askNextQuestion,
  ASK_MODEL,
  ASK_PROMPT,
  buildAskBody,
  buildComposeBody,
  composeDream,
  COMPOSE_MODEL,
  fragmentsBlock,
  MAX_ANSWER_CHARS,
  MAX_FRAGMENTS,
  parseComposedDream,
  parseNextQuestion,
  parseObject,
  readFragments,
} from './fragments.ts';

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

const fragments = [
  { question: 'what’s the first thing you remember?', answer: 'a train' },
  { question: 'where was the train going?', answer: 'not sure' },
];

describe('readFragments', () => {
  it('accepts and trims questions and answers', () => {
    assert.deepEqual(readFragments([{ question: ' q? ', answer: ' a ' }], { allowEmpty: false }), [{ question: 'q?', answer: 'a' }]);
  });

  it('allows an empty list only when asking the first question', () => {
    assert.deepEqual(readFragments([], { allowEmpty: true }), []);
    assert.throws(() => readFragments([], { allowEmpty: false }), /At least one/);
  });

  it('refuses bad input', () => {
    assert.throws(() => readFragments('nope', { allowEmpty: true }), /list/);
    assert.throws(() => readFragments([{ question: 'q?' }], { allowEmpty: true }), /question and an answer/);
    assert.throws(() => readFragments([{ question: 'q?', answer: '   ' }], { allowEmpty: true }), /question and an answer/);
    const tooMany = Array.from({ length: MAX_FRAGMENTS + 1 }, () => ({ question: 'q?', answer: 'a' }));
    assert.throws(() => readFragments(tooMany, { allowEmpty: true }), /At most/);
  });

  it('cuts very long answers', () => {
    const [fragment] = readFragments([{ question: 'q?', answer: 'x'.repeat(MAX_ANSWER_CHARS + 50) }], { allowEmpty: false });
    assert.equal(fragment.answer.length, MAX_ANSWER_CHARS);
  });
});

describe('request bodies', () => {
  it('numbers the conversation inside fragment tags', () => {
    assert.equal(
      fragmentsBlock(fragments),
      '<fragments>\n1. q: what’s the first thing you remember?\n   a: a train\n2. q: where was the train going?\n   a: not sure\n</fragments>'
    );
  });

  it('asks with the quick model and strict JSON', () => {
    const body = buildAskBody(fragments);
    assert.equal(body.model, ASK_MODEL);
    assert.equal(body.messages[0].content, ASK_PROMPT);
    assert.equal(body.response_format.json_schema.strict, true);
  });

  it('composes with the larger model', () => {
    assert.equal(buildComposeBody(fragments).model, COMPOSE_MODEL);
  });
});

describe('parsing', () => {
  it('tidies the next question and its suggestions', () => {
    assert.deepEqual(parseNextQuestion({ question: '"Who Was On The Train"', suggestions: ['A Stranger.', 'my mum', 'my mum', '', 'not sure', 'extra'] }), {
      question: 'who was on the train?',
      suggestions: ['a stranger', 'my mum', 'not sure'],
    });
  });

  it('always leaves at least one suggestion', () => {
    assert.deepEqual(parseNextQuestion({ question: 'what then?', suggestions: [] }).suggestions, ['not sure']);
  });

  it('rejects missing fields', () => {
    assert.throws(() => parseNextQuestion({ suggestions: [] }), /missing the question/);
    assert.throws(() => parseNextQuestion({ question: '  ', suggestions: [] }), /empty question/);
    assert.throws(() => parseComposedDream({}), /missing the dream/);
  });

  it('rejects replies that are not JSON objects', () => {
    assert.throws(() => parseObject(''), /empty/);
    assert.throws(() => parseObject('nope'), /valid JSON/);
    assert.throws(() => parseObject('[1]'), /not an object/);
  });
});

describe('calling Groq', () => {
  it('returns the next question', async () => {
    const { fetchImpl, calls } = fakeGroq(200, reply({ question: 'what colour was it?', suggestions: ['red', 'grey', 'not sure'] }));
    const next = await askNextQuestion(fragments, 'key', fetchImpl);
    assert.equal(next.question, 'what colour was it?');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer key');
  });

  it('returns the composed dream', async () => {
    const { fetchImpl } = fakeGroq(200, reply({ dream: 'i was on a train.' }));
    assert.equal(await composeDream(fragments, 'key', fetchImpl), 'i was on a train.');
  });

  it('throws when Groq fails', async () => {
    const { fetchImpl } = fakeGroq(429, { error: 'rate limited' });
    await assert.rejects(askNextQuestion(fragments, 'key', fetchImpl), /429/);
  });
});
