/**
 * Speech-to-text for recorded dreams, using Groq's Whisper model.
 *
 * No Supabase or Deno code here, so it can be unit tested with Node (see transcription.test.ts).
 */

export const GROQ_STT_URL = 'https://api.groq.com/openai/v1/audio/transcriptions';
/** Fast, low-cost Whisper model on Groq. Swap for 'whisper-large-v3' if accuracy matters more. */
export const GROQ_STT_MODEL = 'whisper-large-v3-turbo';
/** The app is in English; telling Whisper the language makes it faster and more accurate. */
export const STT_LANGUAGE = 'en';
/** Gives Whisper context so it spells dream-related words sensibly (max 224 tokens). */
export const STT_PROMPT = 'Someone describing a dream they had, in their own words.';

/** Groq's free-tier upload limit. A phone recording is about 1 MB per minute. */
export const MAX_AUDIO_BYTES = 25 * 1024 * 1024;
export const ALLOWED_EXTENSIONS = ['m4a', 'mp4', 'mp3', 'mpeg', 'mpga', 'wav', 'webm', 'ogg', 'flac'];

/** Whisper segments that are probably silence (above this) are dropped. */
const NO_SPEECH_THRESHOLD = 0.6;
const STT_TIMEOUT_MS = 60_000;

/** A problem with the user's upload; the message is safe to show in the app. */
export class UserFacingError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

/** Checks the uploaded form field is a usable audio file. Throws a `UserFacingError` if not. */
export function checkAudioFile(value: unknown): File {
  if (!(value instanceof File)) {
    throw new UserFacingError('No recording was received. Please try again.', 400);
  }
  if (value.size === 0) {
    throw new UserFacingError('The recording is empty. Please try again.', 400);
  }
  if (value.size > MAX_AUDIO_BYTES) {
    throw new UserFacingError('The recording is too long. Please keep it under about 20 minutes.', 413);
  }
  const extension = value.name.split('.').pop()?.toLowerCase() ?? '';
  if (!ALLOWED_EXTENSIONS.includes(extension)) {
    throw new UserFacingError('This audio format is not supported.', 415);
  }
  return value;
}

/** Builds the multipart form Groq expects. */
export function buildTranscriptionForm(audio: Blob, fileName: string) {
  const form = new FormData();
  form.append('file', audio, fileName);
  form.append('model', GROQ_STT_MODEL);
  form.append('language', STT_LANGUAGE);
  form.append('prompt', STT_PROMPT);
  form.append('temperature', '0');
  // verbose_json includes a "no speech" score per segment, so we can drop silence.
  form.append('response_format', 'verbose_json');
  return form;
}

type WhisperSegment = { text?: unknown; no_speech_prob?: unknown };

/**
 * Picks the spoken text out of Groq's reply. Segments Whisper thinks are silence are dropped,
 * because on silent audio Whisper sometimes "hears" phrases like "Thank you.".
 */
export function extractTranscript(body: unknown): string {
  const reply = body as { text?: unknown; segments?: unknown } | null;
  if (!reply || typeof reply !== 'object') {
    throw new Error('Groq returned an unexpected transcription reply.');
  }

  if (Array.isArray(reply.segments) && reply.segments.length > 0) {
    const spoken = (reply.segments as WhisperSegment[])
      .filter((segment) => typeof segment.text === 'string')
      .filter(
        (segment) =>
          typeof segment.no_speech_prob !== 'number' || segment.no_speech_prob < NO_SPEECH_THRESHOLD
      )
      .map((segment) => segment.text as string);
    return cleanTranscript(spoken.join(' '));
  }

  if (typeof reply.text !== 'string') {
    throw new Error('Groq returned a transcription without text.');
  }
  return cleanTranscript(reply.text);
}

/** Tidies whitespace. */
export function cleanTranscript(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

/** Sends the recording to Groq Whisper and returns the text ('' if nothing was said). */
export async function transcribeWithGroq(
  audio: Blob,
  fileName: string,
  apiKey: string,
  fetchImpl: typeof fetch = fetch
): Promise<string> {
  const response = await fetchImpl(GROQ_STT_URL, {
    method: 'POST',
    // No Content-Type header: fetch adds the multipart boundary itself.
    headers: { Authorization: `Bearer ${apiKey}` },
    body: buildTranscriptionForm(audio, fileName),
    signal: AbortSignal.timeout(STT_TIMEOUT_MS),
  });

  if (!response.ok) {
    const details = await response.text().catch(() => '');
    throw new Error(`Groq transcription failed (${response.status}): ${details.slice(0, 300)}`);
  }
  return extractTranscript(await response.json());
}
