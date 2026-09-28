/**
 * Helpers for raw PCM audio: 16-bit signed little-endian samples, mono.
 * Plain TypeScript, so it can be unit tested with Node.
 */

export const BYTES_PER_SAMPLE = 2;

/** How many bytes one millisecond of 16-bit mono audio takes at this sample rate. */
export function bytesPerMs(sampleRate: number) {
  return (sampleRate * BYTES_PER_SAMPLE) / 1000;
}

/** Duration of a 16-bit mono PCM chunk in milliseconds. */
export function pcmDurationMs(byteLength: number, sampleRate: number) {
  return byteLength / bytesPerMs(sampleRate);
}

/** Converts whatever the WebSocket gives us for a binary frame into a Uint8Array view. */
export function toUint8Array(data: ArrayBuffer | ArrayBufferView): Uint8Array {
  if (data instanceof Uint8Array) return data;
  if (ArrayBuffer.isView(data)) return new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
  return new Uint8Array(data);
}

/**
 * Network frames don't have to end on a sample boundary. A 16-bit sample split across two
 * frames would shift every later byte and turn the audio into loud noise, so this keeps a
 * leftover odd byte and puts it in front of the next frame.
 */
export class PcmAligner {
  private leftover: number | null = null;

  /** Returns only whole samples (an even number of bytes). */
  push(chunk: Uint8Array): Uint8Array {
    const hasLeftover = this.leftover !== null;
    const total = chunk.length + (hasLeftover ? 1 : 0);
    const usable = total - (total % BYTES_PER_SAMPLE);

    const output = new Uint8Array(usable);
    let written = 0;
    if (hasLeftover && usable > 0) {
      output[0] = this.leftover as number;
      written = 1;
    }
    output.set(chunk.subarray(0, usable - written), written);

    if (total % BYTES_PER_SAMPLE === 1) {
      this.leftover = chunk.length > 0 ? chunk[chunk.length - 1] : this.leftover;
    } else {
      this.leftover = null;
    }
    return output;
  }

  reset() {
    this.leftover = null;
  }
}

/** Cuts PCM into pieces of at most `maxBytes`, always on sample boundaries. */
export function splitPcm(chunk: Uint8Array, maxBytes: number): Uint8Array[] {
  const size = Math.max(BYTES_PER_SAMPLE, maxBytes - (maxBytes % BYTES_PER_SAMPLE));
  const pieces: Uint8Array[] = [];
  for (let start = 0; start < chunk.length; start += size) {
    pieces.push(chunk.subarray(start, Math.min(start + size, chunk.length)));
  }
  return pieces;
}
