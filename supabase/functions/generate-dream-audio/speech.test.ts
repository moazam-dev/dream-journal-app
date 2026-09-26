/**
 * Unit tests for speech.ts. Groq is replaced by a fake `fetch` that returns real WAV bytes.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  createReflectionAudio,
  joinWavFiles,
  MAX_CHUNK_CHARS,
  MAX_TTS_CHARS,
  readWav,
  speakWithGroq,
  splitIntoSpeechChunks,
  wavDurationSeconds,
} from './speech.ts';

const SAMPLE_RATE = 24000;

/** Builds a real 16-bit mono PCM WAV file where every sample has the value `fill`. */
function makeWav(frames: number, fill = 1000, options: { sampleRate?: number; dataSize?: number } = {}) {
  const sampleRate = options.sampleRate ?? SAMPLE_RATE;
  const dataBytes = frames * 2;
  const bytes = new Uint8Array(44 + dataBytes);
  const view = new DataView(bytes.buffer);
  const text = (offset: number, value: string) =>
    [...value].forEach((c, i) => (bytes[offset + i] = c.charCodeAt(0)));
  text(0, 'RIFF');
  view.setUint32(4, 36 + dataBytes, true);
  text(8, 'WAVE');
  text(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  text(36, 'data');
  view.setUint32(40, options.dataSize ?? dataBytes, true);
  for (let i = 0; i < frames; i++) view.setInt16(44 + i * 2, fill, true);
  return bytes;
}

/** Fake Groq TTS: answers each call with a 1-second WAV whose samples equal the call number. */
function fakeGroqTts(options: { failOnCall?: number; body?: Uint8Array | string } = {}) {
  const calls: { url: string; body: { model: string; voice: string; input: string; response_format: string } }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: JSON.parse(String(init.body)) });
    if (options.failOnCall === calls.length) {
      return new Response('{"error":{"message":"Rate limit reached"}}', { status: 429 });
    }
    const payload = options.body ?? makeWav(SAMPLE_RATE, calls.length);
    return new Response(payload, { status: 200, headers: { 'Content-Type': 'audio/wav' } });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const normalReflection =
  'Walking through an empty, glowing city may suggest a feeling of searching for connection. ' +
  'The streets that keep returning to the same square could reflect a sense of going in circles, ' +
  'perhaps around a decision or a question you have not settled yet. One possible interpretation is ' +
  'that the lit windows stand for opportunities that feel visible but out of reach. ' +
  'What might you be looking for right now?';

describe('splitIntoSpeechChunks', () => {
  it('keeps a short reflection as one piece', () => {
    assert.deepEqual(splitIntoSpeechChunks('  Falling may suggest a loss of control.  '), [
      'Falling may suggest a loss of control.',
    ]);
  });

  it('splits a normal reflection at sentence breaks, every piece within Groq’s limit, nothing lost', () => {
    const chunks = splitIntoSpeechChunks(normalReflection);
    assert.ok(chunks.length >= 2);
    for (const chunk of chunks) assert.ok(chunk.length <= MAX_CHUNK_CHARS, `too long: ${chunk.length}`);
    assert.equal(chunks.join(' '), normalReflection);
    assert.ok(chunks.every((chunk) => /[.?!]$/.test(chunk)), 'each piece should end a sentence');
  });

  it('splits a very long sentence at commas, then at spaces', () => {
    const longSentence = Array.from({ length: 30 }, (_, i) => `part ${i} of a long thought`).join(', ') + '.';
    const chunks = splitIntoSpeechChunks(longSentence);
    for (const chunk of chunks) assert.ok(chunk.length <= MAX_CHUNK_CHARS);
    assert.equal(chunks.join(' '), longSentence);

    const noPunctuation = Array.from({ length: 80 }, () => 'dream').join(' ');
    const wordChunks = splitIntoSpeechChunks(noPunctuation);
    for (const chunk of wordChunks) assert.ok(chunk.length <= MAX_CHUNK_CHARS);
    assert.equal(wordChunks.join(' '), noPunctuation);
  });

  it('returns nothing for empty text', () => {
    assert.deepEqual(splitIntoSpeechChunks('   '), []);
  });
});

describe('speakWithGroq', () => {
  it('calls Groq TTS with the Orpheus model, a calm direction and WAV output', async () => {
    const { fetchImpl, calls } = fakeGroqTts();
    const wav = await speakWithGroq('Falling may suggest a loss of control.', 'gsk_test', fetchImpl);

    assert.equal(calls[0].url, 'https://api.groq.com/openai/v1/audio/speech');
    assert.deepEqual(calls[0].body, {
      model: 'canopylabs/orpheus-v1-english',
      voice: 'hannah',
      input: '[calm] Falling may suggest a loss of control.',
      response_format: 'wav',
    });
    assert.equal(readWav(wav).sampleRate, SAMPLE_RATE);
  });

  it('refuses text over Groq’s 200-character limit instead of sending it', async () => {
    const { fetchImpl, calls } = fakeGroqTts();
    await assert.rejects(speakWithGroq('a'.repeat(MAX_TTS_CHARS), 'k', fetchImpl), /too long/);
    assert.equal(calls.length, 0);
  });

  it('throws on a Groq error status', async () => {
    const { fetchImpl } = fakeGroqTts({ failOnCall: 1 });
    await assert.rejects(speakWithGroq('Hello.', 'k', fetchImpl), /Groq TTS request failed \(429\)/);
  });

  it('throws when Groq sends something that is not a WAV file', async () => {
    const { fetchImpl } = fakeGroqTts({ body: '{"not":"audio"}' });
    await assert.rejects(speakWithGroq('Hello.', 'k', fetchImpl), /did not return a WAV/);
  });
});

describe('createReflectionAudio', () => {
  it('speaks a normal reflection piece by piece, in order, as one WAV with pauses', async () => {
    const { fetchImpl, calls } = fakeGroqTts();
    const wav = await createReflectionAudio(normalReflection, 'gsk_test', fetchImpl);
    const pieces = splitIntoSpeechChunks(normalReflection).length;

    assert.equal(calls.length, pieces);
    assert.equal(calls[0].body.input, `[calm] ${splitIntoSpeechChunks(normalReflection)[0]}`);
    // Each fake piece is 1 second; there is a 0.35 s pause between pieces.
    assert.ok(Math.abs(wavDurationSeconds(wav) - (pieces + (pieces - 1) * 0.35)) < 0.001);

    // Order check: first sample comes from call 1, last sample from the last call.
    const samples = new DataView(readWav(wav).samples.buffer);
    assert.equal(samples.getInt16(0, true), 1);
    assert.equal(samples.getInt16(samples.byteLength - 2, true), pieces);
  });

  it('makes a single call for a short reflection', async () => {
    const { fetchImpl, calls } = fakeGroqTts();
    const wav = await createReflectionAudio('There is little detail, but falling could reflect uncertainty.', 'k', fetchImpl);
    assert.equal(calls.length, 1);
    assert.equal(wavDurationSeconds(wav), 1);
  });

  it('fails as a whole if any piece fails (no half-finished audio is saved)', async () => {
    const { fetchImpl } = fakeGroqTts({ failOnCall: 2 });
    await assert.rejects(createReflectionAudio(normalReflection, 'k', fetchImpl), /429/);
  });

  it('rejects empty and overly long reflections', async () => {
    const { fetchImpl } = fakeGroqTts();
    await assert.rejects(createReflectionAudio('  ', 'k', fetchImpl), /no reflection text/);
    await assert.rejects(createReflectionAudio('This is a sentence. '.repeat(120), 'k', fetchImpl), /too long/);
  });
});

describe('WAV helpers', () => {
  it('produces a valid WAV header after joining', () => {
    const joined = joinWavFiles([makeWav(100), makeWav(200)], 0);
    const view = new DataView(joined.buffer);
    assert.equal(String.fromCharCode(...joined.slice(0, 4)), 'RIFF');
    assert.equal(view.getUint32(4, true), joined.length - 8);
    assert.equal(readWav(joined).samples.length, 600);
  });

  it('handles streamed WAVs with a placeholder data size', () => {
    const streamed = makeWav(50, 7, { dataSize: 0xffffffff });
    assert.equal(readWav(streamed).samples.length, 100);
  });

  it('refuses to join different formats', () => {
    assert.throws(() => joinWavFiles([makeWav(10), makeWav(10, 1, { sampleRate: 48000 })]), /different formats/);
  });
});
