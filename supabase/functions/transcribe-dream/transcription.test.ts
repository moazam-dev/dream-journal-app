/**
 * Unit tests for transcription.ts. Groq is replaced by a fake `fetch`.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  checkAudioFile,
  extractTranscript,
  MAX_AUDIO_BYTES,
  transcribeWithGroq,
  UserFacingError,
} from './transcription.ts';

const recording = () => new File([new Uint8Array([0, 0, 0, 0x20, 0x66, 0x74, 0x79, 0x70])], 'dream.m4a', { type: 'audio/m4a' });

function fakeGroq(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe('checkAudioFile', () => {
  it('accepts an m4a recording from the phone', () => {
    assert.equal(checkAudioFile(recording()).name, 'dream.m4a');
  });

  it('rejects missing, empty, oversized and unsupported uploads with friendly messages', () => {
    const expectError = (value: unknown, status: number, pattern: RegExp) => {
      assert.throws(
        () => checkAudioFile(value),
        (error: unknown) => error instanceof UserFacingError && error.status === status && pattern.test(error.message)
      );
    };
    expectError(null, 400, /No recording/);
    expectError('not a file', 400, /No recording/);
    expectError(new File([], 'dream.m4a'), 400, /empty/);
    expectError(new File([new Uint8Array(MAX_AUDIO_BYTES + 1)], 'dream.m4a'), 413, /too long/);
    expectError(new File([new Uint8Array(4)], 'dream.exe'), 415, /not supported/);
  });
});

describe('extractTranscript', () => {
  it('joins spoken segments', () => {
    const text = extractTranscript({
      text: ' I was flying over a city.  Then I fell. ',
      segments: [
        { text: ' I was flying over a city.', no_speech_prob: 0.01 },
        { text: ' Then I fell.', no_speech_prob: 0.05 },
      ],
    });
    assert.equal(text, 'I was flying over a city. Then I fell.');
  });

  it('drops segments that are probably silence (Whisper "hallucinations")', () => {
    const text = extractTranscript({
      text: 'I was in a forest. Thank you.',
      segments: [
        { text: ' I was in a forest.', no_speech_prob: 0.02 },
        { text: ' Thank you.', no_speech_prob: 0.93 },
      ],
    });
    assert.equal(text, 'I was in a forest.');
  });

  it('returns an empty string for a silent recording', () => {
    assert.equal(extractTranscript({ text: ' Thank you.', segments: [{ text: ' Thank you.', no_speech_prob: 0.97 }] }), '');
  });

  it('falls back to the plain text when there are no segments', () => {
    assert.equal(extractTranscript({ text: '  A red door.  ' }), 'A red door.');
  });

  it('rejects replies without text', () => {
    assert.throws(() => extractTranscript({}), /without text/);
    assert.throws(() => extractTranscript(null), /unexpected/);
  });
});

describe('transcribeWithGroq', () => {
  it('sends the recording to Whisper with the right settings and returns the text', async () => {
    const { fetchImpl, calls } = fakeGroq(200, {
      text: 'I was flying.',
      segments: [{ text: 'I was flying.', no_speech_prob: 0.01 }],
    });

    const text = await transcribeWithGroq(recording(), 'dream.m4a', 'gsk_test', fetchImpl);

    assert.equal(text, 'I was flying.');
    assert.equal(calls[0].url, 'https://api.groq.com/openai/v1/audio/transcriptions');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer gsk_test');
    const form = calls[0].init.body as FormData;
    assert.equal(form.get('model'), 'whisper-large-v3-turbo');
    assert.equal(form.get('language'), 'en');
    assert.equal(form.get('response_format'), 'verbose_json');
    assert.equal((form.get('file') as File).name, 'dream.m4a');
  });

  it('throws on a Groq error (e.g. bad key)', async () => {
    const { fetchImpl } = fakeGroq(401, { error: { message: 'Invalid API Key' } });
    await assert.rejects(transcribeWithGroq(recording(), 'dream.m4a', 'bad', fetchImpl), /failed \(401\).*Invalid API Key/);
  });
});
