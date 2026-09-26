/**
 * Unit tests for image-prompt.ts. Groq is replaced by a fake `fetch`.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildFallbackScene,
  buildImagePrompt,
  buildScenePromptRequestBody,
  createImagePrompt,
  IMAGE_STYLE,
  MAX_IMAGE_PROMPT_CHARS,
  parseScene,
  type DreamForImage,
} from './image-prompt.ts';

function fakeGroq(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

const groqScene = (scene: string) => ({
  choices: [{ message: { content: JSON.stringify({ scene }) } }],
});

const detailedDream: DreamForImage = {
  dream_text:
    'I was walking through an empty city at night. All the shop windows were lit but nobody was ' +
    'inside. Every street led back to the same square with a dry fountain.',
  title: 'The Empty City',
  mood: 'Mysterious',
  themes: ['Isolation', 'Feeling Stuck'],
};

const shortDream: DreamForImage = {
  dream_text: 'I fell.',
  title: 'A Sudden Fall',
  mood: 'Uneasy',
  themes: ['Falling'],
};

const abstractDream: DreamForImage = {
  dream_text: 'The color blue had a sound and the number seven kept melting into the floor.',
  title: 'Melting Seven',
  mood: 'Surreal',
  themes: ['Synesthesia', 'Transformation'],
};

describe('buildScenePromptRequestBody', () => {
  it('sends the dream in <dream> tags with its title, mood and themes, asking for strict JSON', () => {
    const body = buildScenePromptRequestBody(detailedDream);
    const userMessage = body.messages[1].content;
    assert.match(userMessage, /<dream>\nI was walking through an empty city/);
    assert.match(userMessage, /Title: The Empty City/);
    assert.match(userMessage, /Mood: Mysterious/);
    assert.match(userMessage, /Themes: Isolation, Feeling Stuck/);
    assert.equal(body.response_format.json_schema.strict, true);
  });

  it('handles a dream that has no themes', () => {
    const body = buildScenePromptRequestBody({ ...shortDream, themes: null });
    assert.match(body.messages[1].content, /Themes: none/);
  });
});

describe('parseScene', () => {
  it('reads the scene', () => {
    assert.equal(parseScene(JSON.stringify({ scene: '  A dry fountain under violet streetlights.  ' })),
      'A dry fountain under violet streetlights.');
  });

  it('rejects bad answers', () => {
    assert.throws(() => parseScene(''), /empty scene/);
    assert.throws(() => parseScene('not json'), /valid JSON/);
    assert.throws(() => parseScene(JSON.stringify({ scene: 'short' })), /too short/);
    assert.throws(() => parseScene(JSON.stringify({ other: 'x' })), /missing/);
  });
});

describe('buildImagePrompt', () => {
  it('adds the shared style, including "no text"', () => {
    const prompt = buildImagePrompt('A dry fountain\n under   violet streetlights.');
    assert.equal(prompt, `A dry fountain under violet streetlights. ${IMAGE_STYLE}`);
    assert.match(prompt, /cinematic/);
    assert.match(prompt, /No text/);
  });

  it('never exceeds the model limit, even for a huge scene', () => {
    const prompt = buildImagePrompt('mist '.repeat(2000));
    assert.ok(prompt.length <= MAX_IMAGE_PROMPT_CHARS);
    assert.ok(prompt.endsWith(IMAGE_STYLE));
  });
});

describe('buildFallbackScene', () => {
  it('is abstract and uses only the dream analysis', () => {
    const scene = buildFallbackScene(detailedDream);
    assert.match(scene, /abstract/);
    assert.match(scene, /"The Empty City"/);
    assert.match(scene, /mysterious/);
    assert.match(scene, /isolation, feeling stuck/);
  });

  it('still works when the analysis is missing', () => {
    const scene = buildFallbackScene({ dream_text: 'x', title: null, mood: null, themes: null });
    assert.match(scene, /half-remembered dream/);
  });
});

describe('createImagePrompt', () => {
  it('uses Groq for a normal detailed dream', async () => {
    const { fetchImpl, calls } = fakeGroq(200, groqScene(
      'A deserted city square at night, glowing empty shop windows, a dry stone fountain, a small faceless figure seen from behind.'
    ));
    const result = await createImagePrompt(detailedDream, 'gsk_test', fetchImpl);
    assert.equal(result.usedFallback, false);
    assert.match(result.prompt, /dry stone fountain/);
    assert.ok(result.prompt.endsWith(IMAGE_STYLE));
    assert.equal(calls.length, 1);
  });

  it('works for a very short dream', async () => {
    const { fetchImpl } = fakeGroq(200, groqScene('A lone figure tumbling through deep indigo space, streaks of pale light.'));
    const result = await createImagePrompt(shortDream, 'gsk_test', fetchImpl);
    assert.equal(result.usedFallback, false);
    assert.match(result.prompt, /tumbling/);
  });

  it('works for an unusual, abstract dream', async () => {
    const { fetchImpl, calls } = fakeGroq(200, groqScene('A floor of liquid blue light where a glowing numeral seven slowly melts into ripples.'));
    const result = await createImagePrompt(abstractDream, 'gsk_test', fetchImpl);
    assert.equal(result.usedFallback, false);
    assert.match(String(calls[0].init.body), /number seven kept melting/);
  });

  it('falls back to an abstract scene when Groq fails', async () => {
    const { fetchImpl } = fakeGroq(500, { error: 'down' });
    const result = await createImagePrompt(detailedDream, 'gsk_test', fetchImpl);
    assert.equal(result.usedFallback, true);
    assert.match(result.prompt, /abstract, symbolic dreamscape/);
  });

  it('falls back without calling Groq when no Groq key is set', async () => {
    const { fetchImpl, calls } = fakeGroq(200, groqScene('unused'));
    const result = await createImagePrompt(detailedDream, undefined, fetchImpl);
    assert.equal(result.usedFallback, true);
    assert.equal(calls.length, 0);
  });
});
