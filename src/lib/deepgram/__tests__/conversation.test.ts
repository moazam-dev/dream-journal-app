/** Turning a voice conversation into a saveable dream. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  canSaveTranscript,
  dreamTextFromTranscript,
  MAX_DREAM_CHARS,
  MIN_DREAM_CHARS,
} from '../conversation.ts';
import type { TranscriptEntry } from '../types.ts';

/** Builds a transcript from ['user', text] style pairs. */
const transcript = (...turns: ['user' | 'assistant', string][]): TranscriptEntry[] =>
  turns.map(([role, text], index) => ({ id: index + 1, role, text }));

describe('dreamTextFromTranscript', () => {
  it('keeps only the dreamer, never the companion', () => {
    const text = dreamTextFromTranscript(
      transcript(
        ['assistant', 'Hello, what did you dream about?'],
        ['user', 'i was flying over a city made of glass'],
        ['assistant', 'How did that feel?'],
        ['user', 'calm, but i knew i would fall eventually']
      )
    );

    assert.equal(text, 'i was flying over a city made of glass\n\ncalm, but i knew i would fall eventually');
    assert.ok(!text.includes('How did that feel?'));
  });

  it('drops blank and whitespace-only turns', () => {
    const text = dreamTextFromTranscript(
      transcript(['user', '  '], ['user', 'there was a door'], ['user', ''])
    );

    assert.equal(text, 'there was a door');
  });

  it('is empty when the dreamer never spoke', () => {
    assert.equal(dreamTextFromTranscript(transcript(['assistant', 'Are you still there?'])), '');
    assert.equal(dreamTextFromTranscript([]), '');
  });

  it('trims each turn', () => {
    assert.equal(dreamTextFromTranscript(transcript(['user', '  a red door  '])), 'a red door');
  });

  it('cuts at a sentence end when the text is too long', () => {
    const sentence = 'i walked through the long hallway again. ';
    const text = dreamTextFromTranscript(
      transcript(['user', sentence.repeat(200)])
    );

    assert.ok(text.length <= MAX_DREAM_CHARS);
    assert.ok(text.endsWith('.'), `expected a sentence end, got: ${text.slice(-40)}`);
  });

  it('never cuts mid-word when there is no sentence break to use', () => {
    const text = dreamTextFromTranscript(transcript(['user', 'falling '.repeat(1200)]));

    assert.ok(text.length <= MAX_DREAM_CHARS);
    assert.ok(text.endsWith('falling'), `expected a whole word, got: ${text.slice(-20)}`);
  });
});

describe('canSaveTranscript', () => {
  it('refuses a conversation the dreamer barely spoke in', () => {
    assert.equal(canSaveTranscript(transcript(['assistant', 'What did you dream?'], ['user', 'hi'])), false);
    assert.equal(canSaveTranscript([]), false);
  });

  it('accepts a real telling', () => {
    assert.equal(
      canSaveTranscript(transcript(['user', 'i was flying over a city made of glass and it felt calm'])),
      true
    );
  });

  it('accepts exactly at the threshold', () => {
    const text = 'x'.repeat(MIN_DREAM_CHARS);
    assert.equal(canSaveTranscript(transcript(['user', text])), true);
    assert.equal(canSaveTranscript(transcript(['user', text.slice(0, -1)])), false);
  });
});
