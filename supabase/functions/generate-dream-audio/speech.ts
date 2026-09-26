/**
 * Turns the dream's reflection text into one WAV file with Groq Text-to-Speech.
 *
 * Groq's Orpheus model accepts at most 200 characters per request, and reflections are
 * longer than that. So we:
 *   1. split the reflection into sentence-sized pieces (`splitIntoSpeechChunks`),
 *   2. ask Groq to speak each piece (`speakWithGroq`),
 *   3. join the WAV files into one, with a short pause between pieces (`joinWavFiles`).
 *
 * No Supabase or Deno code here, so it can be unit tested with Node (see speech.test.ts).
 */

export const GROQ_TTS_URL = 'https://api.groq.com/openai/v1/audio/speech';
export const GROQ_TTS_MODEL = 'canopylabs/orpheus-v1-english';
/** One of the English Orpheus voices: autumn, diana, hannah (female), austin, daniel, troy (male). */
export const GROQ_TTS_VOICE = 'hannah';
/**
 * Vocal direction added before each piece for a calm, reflective tone.
 * Groq's docs say the model ignores directions it doesn't recognise.
 */
export const VOCAL_DIRECTION = '[calm]';

/** Groq's limit per request, including the vocal direction. */
export const MAX_TTS_CHARS = 200;
/** Longest piece of reflection text we send (leaves room for the direction and a space). */
export const MAX_CHUNK_CHARS = MAX_TTS_CHARS - VOCAL_DIRECTION.length - 1;
/** Safety cap: at most this many Groq calls per reflection (~1,500 characters). */
export const MAX_CHUNKS = 8;
/** Silence between pieces, so sentences don't run into each other. */
const PAUSE_SECONDS = 0.35;
const TTS_TIMEOUT_MS = 30_000;

/**
 * Splits text into pieces of at most `maxChars`, preferring to break between sentences,
 * then at commas/semicolons, and only as a last resort between words.
 */
export function splitIntoSpeechChunks(text: string, maxChars = MAX_CHUNK_CHARS): string[] {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean === '') return [];

  const sentences = clean.split(/(?<=[.!?…])\s+/);
  const pieces = sentences.flatMap((sentence) => splitLongText(sentence, maxChars));

  // Put as many whole pieces as fit into each chunk.
  const chunks: string[] = [];
  let current = '';
  for (const piece of pieces) {
    const combined = current ? `${current} ${piece}` : piece;
    if (combined.length <= maxChars) {
      current = combined;
    } else {
      if (current) chunks.push(current);
      current = piece;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

/** Breaks one over-long sentence at , ; : and then at spaces. */
function splitLongText(text: string, maxChars: number): string[] {
  if (text.length <= maxChars) return [text];

  const parts = text.split(/(?<=[,;:])\s+/);
  const splitBy = parts.length > 1 ? parts : text.split(' ');
  const result: string[] = [];
  let current = '';
  for (const part of splitBy) {
    // A single word longer than the limit (very unlikely) is cut hard.
    const safePart = part.length > maxChars ? part.slice(0, maxChars) : part;
    const combined = current ? `${current} ${safePart}` : safePart;
    if (combined.length <= maxChars) {
      current = combined;
    } else {
      if (current) result.push(current);
      current = safePart;
    }
  }
  if (current) result.push(current);
  return result;
}

/** Asks Groq to speak one piece of text (max 200 characters). Returns the WAV file bytes. */
export async function speakWithGroq(
  text: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<Uint8Array> {
  const input = `${VOCAL_DIRECTION} ${text}`;
  if (input.length > MAX_TTS_CHARS) {
    throw new Error(`Speech text is too long (${input.length} > ${MAX_TTS_CHARS} characters).`);
  }

  const response = await fetchImpl(GROQ_TTS_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: GROQ_TTS_MODEL,
      voice: GROQ_TTS_VOICE,
      input,
      response_format: 'wav', // the only format Orpheus supports
    }),
    signal: AbortSignal.timeout(TTS_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Groq TTS request failed (${response.status}): ${details.slice(0, 300)}`);
  }

  const bytes = new Uint8Array(await response.arrayBuffer());
  readWav(bytes); // throws if Groq didn't send a real WAV file
  return bytes;
}

/** Speaks the whole reflection and returns a single WAV file. */
export async function createReflectionAudio(
  reflection: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<Uint8Array> {
  const chunks = splitIntoSpeechChunks(reflection);
  if (chunks.length === 0) {
    throw new Error('There is no reflection text to speak.');
  }
  if (chunks.length > MAX_CHUNKS) {
    throw new Error(`The reflection is too long to speak (${chunks.length} pieces).`);
  }

  // One piece at a time keeps us well inside Groq's rate limits and keeps the order.
  const wavFiles: Uint8Array[] = [];
  for (const chunk of chunks) {
    wavFiles.push(await speakWithGroq(chunk, apiKey, fetchImpl));
  }
  return joinWavFiles(wavFiles);
}

// ---------------------------------------------------------------------------
// WAV helpers. A WAV file is a small header ("fmt " chunk: sample rate, channels, …)
// followed by a "data" chunk with the raw audio samples. To join files that share the
// same format, we keep one header and put all the samples one after another.
// ---------------------------------------------------------------------------

type WavInfo = {
  /** The raw "fmt " chunk content (describes the audio format). */
  format: Uint8Array;
  audioFormat: number;
  channels: number;
  sampleRate: number;
  byteRate: number;
  blockAlign: number;
  bitsPerSample: number;
  /** The raw audio samples. */
  samples: Uint8Array;
};

/** Reads the format and the audio samples out of a WAV file. Throws if it isn't one. */
export function readWav(bytes: Uint8Array): WavInfo {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const text = (offset: number) => String.fromCharCode(...bytes.slice(offset, offset + 4));

  if (bytes.length < 12 || text(0) !== 'RIFF' || text(8) !== 'WAVE') {
    throw new Error('Groq did not return a WAV file.');
  }

  let format: Uint8Array | null = null;
  let samples: Uint8Array | null = null;
  let offset = 12;
  while (offset + 8 <= bytes.length) {
    const id = text(offset);
    let size = view.getUint32(offset + 4, true);
    const start = offset + 8;
    // Streamed WAVs sometimes write a placeholder size; use what is actually there.
    if (id === 'data' && (size === 0 || size === 0xffffffff || start + size > bytes.length)) {
      size = bytes.length - start;
    }
    if (id === 'fmt ') format = bytes.slice(start, start + size);
    if (id === 'data') {
      samples = bytes.slice(start, start + size);
      break;
    }
    offset = start + size + (size % 2); // chunks are padded to an even length
  }

  if (!format || format.length < 16 || !samples) {
    throw new Error('The WAV file is missing its format or audio data.');
  }
  const fmt = new DataView(format.buffer, format.byteOffset, format.byteLength);
  return {
    format,
    audioFormat: fmt.getUint16(0, true),
    channels: fmt.getUint16(2, true),
    sampleRate: fmt.getUint32(4, true),
    byteRate: fmt.getUint32(8, true),
    blockAlign: fmt.getUint16(12, true),
    bitsPerSample: fmt.getUint16(14, true),
    samples,
  };
}

/** Joins WAV files that share the same format into one, with a short pause between them. */
export function joinWavFiles(files: Uint8Array[], pauseSeconds = PAUSE_SECONDS): Uint8Array {
  if (files.length === 0) throw new Error('No audio to join.');
  const wavs = files.map(readWav);
  const first = wavs[0];

  for (const wav of wavs) {
    const sameFormat =
      wav.audioFormat === first.audioFormat &&
      wav.channels === first.channels &&
      wav.sampleRate === first.sampleRate &&
      wav.bitsPerSample === first.bitsPerSample;
    if (!sameFormat) throw new Error('Audio pieces have different formats and cannot be joined.');
  }

  // Silence: whole sample frames of "zero" (8-bit audio uses 128 as its zero).
  const pauseFrames = Math.round(first.sampleRate * pauseSeconds);
  const pause = new Uint8Array(pauseFrames * first.blockAlign).fill(first.bitsPerSample === 8 ? 128 : 0);

  const parts: Uint8Array[] = [];
  wavs.forEach((wav, index) => {
    if (index > 0) parts.push(pause);
    parts.push(wav.samples);
  });
  const dataSize = parts.reduce((total, part) => total + part.length, 0);

  const headerSize = 12 + 8 + first.format.length + 8;
  const output = new Uint8Array(headerSize + dataSize);
  const view = new DataView(output.buffer);
  const writeText = (offset: number, value: string) => {
    for (let i = 0; i < value.length; i++) output[offset + i] = value.charCodeAt(i);
  };

  writeText(0, 'RIFF');
  view.setUint32(4, output.length - 8, true);
  writeText(8, 'WAVE');
  writeText(12, 'fmt ');
  view.setUint32(16, first.format.length, true);
  output.set(first.format, 20);
  const dataHeader = 20 + first.format.length;
  writeText(dataHeader, 'data');
  view.setUint32(dataHeader + 4, dataSize, true);

  let offset = headerSize;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

/** Length of a WAV file in seconds (used in logs and tests). */
export function wavDurationSeconds(bytes: Uint8Array): number {
  const wav = readWav(bytes);
  return wav.samples.length / wav.byteRate;
}
