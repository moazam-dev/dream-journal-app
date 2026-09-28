/**
 * Creates a short-lived Deepgram access token with Deepgram's token-based auth API
 * (POST /v1/auth/grant). The permanent API key is only used here, on the server.
 *
 * No Supabase or Deno code here, so it can be unit tested with Node (see grant.test.ts).
 */

export const DEEPGRAM_GRANT_URL = 'https://api.deepgram.com/v1/auth/grant';

/**
 * How long the temporary token is valid. It only has to be valid while the phone opens the
 * WebSocket; an open Voice Agent connection keeps running after the token expires.
 */
export const TOKEN_TTL_SECONDS = 30;
const GRANT_TIMEOUT_MS = 10_000;

export type TemporaryToken = {
  access_token: string;
  expires_in: number;
};

/** Asks Deepgram for a temporary token. Throws on any problem (never includes the API key). */
export async function createTemporaryToken(
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<TemporaryToken> {
  const response = await fetchImpl(DEEPGRAM_GRANT_URL, {
    method: 'POST',
    headers: {
      // Deepgram's permanent keys use the "Token" scheme; the temporary token uses "Bearer".
      Authorization: `Token ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ttl_seconds: TOKEN_TTL_SECONDS }),
    signal: AbortSignal.timeout(GRANT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Deepgram token request failed (${response.status}): ${details.slice(0, 300)}`);
  }

  const body = (await response.json().catch(() => null)) as Partial<TemporaryToken> | null;
  if (!body || typeof body.access_token !== 'string' || body.access_token === '') {
    throw new Error('Deepgram returned no access token.');
  }
  return {
    access_token: body.access_token,
    expires_in: typeof body.expires_in === 'number' ? body.expires_in : TOKEN_TTL_SECONDS,
  };
}
