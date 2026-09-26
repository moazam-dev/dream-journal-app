/**
 * Unit tests for cloudflare.ts. Cloudflare is replaced by a fake `fetch`.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildCloudflareUrl,
  decodeBase64,
  detectImageType,
  generateImageWithCloudflare,
} from './cloudflare.ts';

// The first bytes of real image files ("magic numbers") plus some padding.
const JPEG_BYTES = [0xff, 0xd8, 0xff, 0xe0, 0, 0x10, 0x4a, 0x46, 0x49, 0x46, 0, 1, 1, 0];
const PNG_BYTES = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0x0d];
const toBase64 = (bytes: number[]) => btoa(String.fromCharCode(...bytes));

function fakeCloudflare(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe('generateImageWithCloudflare', () => {
  it('calls the FLUX.1 schnell model with the token and returns JPEG bytes', async () => {
    const { fetchImpl, calls } = fakeCloudflare(200, {
      success: true,
      result: { image: toBase64(JPEG_BYTES) },
      errors: [],
    });

    const image = await generateImageWithCloudflare('A dry fountain at night.', 'acc123', 'cf_token', fetchImpl);

    assert.equal(image.contentType, 'image/jpeg');
    assert.equal(image.extension, 'jpg');
    assert.deepEqual(Array.from(image.bytes), JPEG_BYTES);
    assert.equal(
      calls[0].url,
      'https://api.cloudflare.com/client/v4/accounts/acc123/ai/run/@cf/black-forest-labs/flux-1-schnell'
    );
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Bearer cf_token');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { prompt: 'A dry fountain at night.', steps: 8 });
  });

  it('throws Cloudflare’s own error message on failure (e.g. bad token)', async () => {
    const { fetchImpl } = fakeCloudflare(401, {
      success: false,
      errors: [{ code: 10000, message: 'Authentication error' }],
    });
    await assert.rejects(
      generateImageWithCloudflare('x', 'acc', 'bad', fetchImpl),
      /Cloudflare request failed \(401\): Authentication error/
    );
  });

  it('throws when the reply is not JSON', async () => {
    const { fetchImpl } = fakeCloudflare(502, '<html>Bad gateway</html>');
    await assert.rejects(generateImageWithCloudflare('x', 'acc', 't', fetchImpl), /502/);
  });

  it('throws when no image comes back', async () => {
    const { fetchImpl } = fakeCloudflare(200, { success: true, result: {} });
    await assert.rejects(generateImageWithCloudflare('x', 'acc', 't', fetchImpl), /no image/);
  });

  it('throws when the data is not an image', async () => {
    const { fetchImpl } = fakeCloudflare(200, { success: true, result: { image: btoa('hello world!!') } });
    await assert.rejects(generateImageWithCloudflare('x', 'acc', 't', fetchImpl), /not a JPEG, PNG or WebP/);
  });
});

describe('helpers', () => {
  it('builds the account URL', () => {
    assert.match(buildCloudflareUrl('abc'), /accounts\/abc\/ai\/run\/@cf\//);
  });

  it('decodes base64 and detects formats', () => {
    assert.deepEqual(Array.from(decodeBase64(toBase64([1, 2, 255]))), [1, 2, 255]);
    assert.equal(detectImageType(new Uint8Array(PNG_BYTES))?.contentType, 'image/png');
    const webp = new Uint8Array([...'RIFF'].map((c) => c.charCodeAt(0)).concat([0, 0, 0, 0], [...'WEBP'].map((c) => c.charCodeAt(0)), [0]));
    assert.equal(detectImageType(webp)?.contentType, 'image/webp');
    assert.equal(detectImageType(new Uint8Array([1, 2, 3, 4])), null);
  });
});
