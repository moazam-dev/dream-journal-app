/** PCM helpers and the clearable playback queue. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import { PlaybackQueue } from '../playback-queue.ts';
import { bytesPerMs, PcmAligner, pcmDurationMs, splitPcm, toUint8Array } from '../pcm.ts';

describe('PCM helpers', () => {
  it('computes durations for 16-bit mono audio', () => {
    assert.equal(bytesPerMs(16000), 32);
    assert.equal(pcmDurationMs(32000, 16000), 1000);
    assert.equal(pcmDurationMs(3200, 16000), 100);
  });

  it('turns ArrayBuffers and views into Uint8Array without copying the wrong bytes', () => {
    const buffer = new Uint8Array([9, 1, 2, 3, 9]).buffer;
    assert.deepEqual(Array.from(toUint8Array(buffer)), [9, 1, 2, 3, 9]);
    assert.deepEqual(Array.from(toUint8Array(new Uint8Array(buffer, 1, 3))), [1, 2, 3]);
    assert.deepEqual(Array.from(toUint8Array(new DataView(buffer, 1, 2))), [1, 2]);
  });

  it('keeps samples whole when a frame ends in the middle of a sample', () => {
    const aligner = new PcmAligner();
    assert.deepEqual(Array.from(aligner.push(new Uint8Array([1, 2, 3]))), [1, 2]);
    assert.deepEqual(Array.from(aligner.push(new Uint8Array([4, 5, 6]))), [3, 4, 5, 6]);
    assert.deepEqual(Array.from(aligner.push(new Uint8Array([7]))), []);
    assert.deepEqual(Array.from(aligner.push(new Uint8Array([8]))), [7, 8]);
    aligner.push(new Uint8Array([1]));
    aligner.reset();
    assert.deepEqual(Array.from(aligner.push(new Uint8Array([2, 3]))), [2, 3]);
  });

  it('splits on sample boundaries', () => {
    const pieces = splitPcm(new Uint8Array(10), 3);
    assert.deepEqual(pieces.map((piece) => piece.length), [2, 2, 2, 2, 2]);
    assert.deepEqual(splitPcm(new Uint8Array(7), 4).map((piece) => piece.length), [4, 3]);
  });
});

/** A fake clock and timer so we can step through playback exactly. */
function harness(options: { leadMs?: number } = {}) {
  let time = 0;
  let tick: (() => void) | null = null;
  const played: Uint8Array[] = [];
  let drained = 0;
  const queue = new PlaybackQueue({
    sampleRate: 16000,
    leadMs: options.leadMs ?? 250,
    sliceMs: 100,
    play: (chunk) => played.push(chunk),
    onDrained: () => drained++,
    now: () => time,
    setInterval: (callback) => {
      tick = callback;
      return 1;
    },
    clearInterval: () => {
      tick = null;
    },
  });
  return {
    queue,
    played,
    drainedCount: () => drained,
    timerRunning: () => tick !== null,
    /** Moves the clock forward in 40 ms steps, like the real timer. */
    advance(ms: number) {
      for (let step = 0; step < ms; step += 40) {
        time += Math.min(40, ms - step);
        tick?.();
      }
    },
  };
}

const ms = (milliseconds: number) => new Uint8Array(milliseconds * 32); // 16 kHz 16-bit mono

describe('PlaybackQueue', () => {
  it('feeds the player only ~250 ms ahead of real time', () => {
    const h = harness();
    h.queue.enqueue(ms(1000)); // one second of agent audio arrives at once
    assert.equal(h.played.length, 3, '3 × 100 ms slices handed over immediately');
    assert.equal(h.queue.pendingMs, 700);

    h.advance(80);
    assert.equal(h.played.length, 4, 'topped up as time passes');
    assert.ok(h.queue.pendingMs <= 600);
    h.advance(1000);
    assert.equal(h.queue.pendingMs, 0);
    assert.equal(h.played.reduce((total, chunk) => total + chunk.length, 0), ms(1000).length);
  });

  it('interruption: clear() drops everything not yet handed to the player', () => {
    const h = harness();
    h.queue.enqueue(ms(5000));
    h.advance(50);
    const handedOver = h.played.length;
    h.queue.clear();
    assert.equal(h.queue.pendingMs, 0);
    h.advance(1000);
    assert.equal(h.played.length, handedOver, 'no more agent audio after the user interrupts');
    assert.ok(handedOver * 100 <= 400, 'at most a few hundred ms were already with the player');
  });

  it('reports "drained" once playback has really finished, then stops its timer', () => {
    const h = harness();
    h.queue.enqueue(ms(300));
    assert.equal(h.drainedCount(), 0);
    h.advance(200);
    assert.equal(h.drainedCount(), 0);
    h.advance(150);
    assert.equal(h.drainedCount(), 1);
    assert.equal(h.timerRunning(), false);
    assert.equal(h.queue.isIdle, true);
  });

  it('handles frames that split samples, and ignores audio after dispose()', () => {
    const h = harness();
    h.queue.enqueue(new Uint8Array(3));
    h.queue.enqueue(new Uint8Array(1));
    assert.equal(h.played.reduce((total, chunk) => total + chunk.length, 0), 4, 'no byte lost or added');
    h.queue.dispose();
    h.queue.enqueue(ms(100));
    assert.equal(h.played.length, 2, 'nothing new is played after dispose()');
    assert.equal(h.timerRunning(), false);
  });
});
