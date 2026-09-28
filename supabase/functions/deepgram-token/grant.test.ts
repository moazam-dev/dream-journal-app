/**
 * Unit tests for grant.ts. Deepgram is replaced by a fake `fetch`.
 * Run from the project folder with:  npm run test:functions
 */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { createTemporaryToken, DEEPGRAM_GRANT_URL, TOKEN_TTL_SECONDS } from './grant.ts';

function fakeDeepgram(status: number, body: unknown) {
  const calls: { url: string; init: RequestInit }[] = [];
  const fetchImpl = (async (url: string, init: RequestInit) => {
    calls.push({ url, init });
    return new Response(typeof body === 'string' ? body : JSON.stringify(body), { status });
  }) as unknown as typeof fetch;
  return { fetchImpl, calls };
}

describe('createTemporaryToken', () => {
  it('asks Deepgram for a 30-second token using the permanent key, and returns only the token', async () => {
    const { fetchImpl, calls } = fakeDeepgram(200, { access_token: 'eyJ.temp.jwt', expires_in: 30 });

    const token = await createTemporaryToken('dg_permanent_key', fetchImpl);

    assert.deepEqual(token, { access_token: 'eyJ.temp.jwt', expires_in: 30 });
    assert.equal(calls[0].url, DEEPGRAM_GRANT_URL);
    assert.equal(calls[0].init.method, 'POST');
    assert.equal((calls[0].init.headers as Record<string, string>).Authorization, 'Token dg_permanent_key');
    assert.deepEqual(JSON.parse(String(calls[0].init.body)), { ttl_seconds: TOKEN_TTL_SECONDS });
    assert.ok(!JSON.stringify(token).includes('dg_permanent_key'), 'the permanent key must never be returned');
  });

  it('falls back to the requested TTL when Deepgram omits expires_in', async () => {
    const { fetchImpl } = fakeDeepgram(200, { access_token: 'eyJ.temp.jwt' });
    assert.equal((await createTemporaryToken('k', fetchImpl)).expires_in, TOKEN_TTL_SECONDS);
  });

  it('throws on a Deepgram error (e.g. key without Member permission)', async () => {
    const { fetchImpl } = fakeDeepgram(403, { err_msg: 'Insufficient permissions.' });
    await assert.rejects(createTemporaryToken('k', fetchImpl), /failed \(403\).*Insufficient permissions/);
  });

  it('throws when the reply has no token', async () => {
    const { fetchImpl } = fakeDeepgram(200, { something: 'else' });
    await assert.rejects(createTemporaryToken('k', fetchImpl), /no access token/);
    const { fetchImpl: notJson } = fakeDeepgram(200, '<html>');
    await assert.rejects(createTemporaryToken('k', notJson), /no access token/);
  });
});
