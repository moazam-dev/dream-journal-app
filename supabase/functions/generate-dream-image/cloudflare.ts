/**
 * Calls Cloudflare Workers AI (FLUX.1 [schnell]) and returns the image as bytes.
 *
 * No Supabase or Deno code here, so it can be unit tested with Node (see cloudflare.test.ts).
 */

export const CLOUDFLARE_IMAGE_MODEL = '@cf/black-forest-labs/flux-1-schnell';
const CLOUDFLARE_TIMEOUT_MS = 60_000;

export type GeneratedImage = {
  bytes: Uint8Array;
  contentType: 'image/jpeg' | 'image/png' | 'image/webp';
  extension: 'jpg' | 'png' | 'webp';
};

export function buildCloudflareUrl(accountId: string) {
  return `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${CLOUDFLARE_IMAGE_MODEL}`;
}

/** Sends the prompt to Cloudflare and returns the decoded image. Throws on any problem. */
export async function generateImageWithCloudflare(
  prompt: string,
  accountId: string,
  apiToken: string,
  fetchImpl: typeof fetch = fetch
): Promise<GeneratedImage> {
  const response = await fetchImpl(buildCloudflareUrl(accountId), {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiToken}`, 'Content-Type': 'application/json' },
    // steps: 4 is the default, 8 is the maximum (a little slower, a little more detail).
    body: JSON.stringify({ prompt, steps: 8 }),
    signal: AbortSignal.timeout(CLOUDFLARE_TIMEOUT_MS),
  });

  const text = await response.text();
  let body: {
    success?: boolean;
    result?: { image?: unknown };
    errors?: { message?: string }[];
  } | null = null;
  try {
    body = JSON.parse(text);
  } catch {
    // Not JSON: handled below.
  }

  if (!response.ok || !body || body.success === false) {
    const message = body?.errors?.map((error) => error.message).join('; ') || text.slice(0, 300);
    throw new Error(`Cloudflare request failed (${response.status}): ${message}`);
  }

  const base64 = body.result?.image;
  if (typeof base64 !== 'string' || base64.length === 0) {
    throw new Error('Cloudflare returned no image.');
  }

  const bytes = decodeBase64(base64);
  const type = detectImageType(bytes);
  if (!type) {
    throw new Error('Cloudflare returned data that is not a JPEG, PNG or WebP image.');
  }
  return { bytes, ...type };
}

export function decodeBase64(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/** Checks the first bytes of the file ("magic numbers") to know the real image format. */
export function detectImageType(bytes: Uint8Array): Omit<GeneratedImage, 'bytes'> | null {
  if (bytes.length > 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: 'image/jpeg', extension: 'jpg' };
  }
  if (bytes.length > 8 && bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) {
    return { contentType: 'image/png', extension: 'png' };
  }
  const isRiff = String.fromCharCode(...bytes.slice(0, 4)) === 'RIFF';
  const isWebp = String.fromCharCode(...bytes.slice(8, 12)) === 'WEBP';
  if (bytes.length > 12 && isRiff && isWebp) {
    return { contentType: 'image/webp', extension: 'webp' };
  }
  return null;
}
