/**
 * Plays the agent's streamed voice with a small, clearable buffer.
 *
 * The native player can't drop audio it has already been given, so we don't hand it the whole
 * reply at once. We keep the agent's audio here and feed the player only ~250 ms ahead of
 * real time. When the user interrupts, `clear()` throws away everything not yet handed over,
 * so the agent stops within a fraction of a second.
 *
 * Plain TypeScript (the player, clock and timers are passed in), so it can be unit tested.
 */
import { PcmAligner, pcmDurationMs, splitPcm, bytesPerMs } from './pcm.ts';

export type PlaybackQueueOptions = {
  sampleRate: number;
  /** Hands audio to the native player. */
  play: (chunk: Uint8Array) => void;
  /** Called once when everything handed to the player has finished playing. */
  onDrained?: () => void;
  /** How far ahead of real time we let the native player get (ms). */
  leadMs?: number;
  /** Size of each piece handed to the player (ms). */
  sliceMs?: number;
  /** How often we top up the player (ms). */
  tickMs?: number;
  now?: () => number;
  setInterval?: (callback: () => void, ms: number) => unknown;
  clearInterval?: (handle: unknown) => void;
};

export class PlaybackQueue {
  private readonly options: Required<Omit<PlaybackQueueOptions, 'onDrained'>> &
    Pick<PlaybackQueueOptions, 'onDrained'>;
  private readonly aligner = new PcmAligner();
  private pending: Uint8Array[] = [];
  private pendingBytes = 0;
  /** Time (per `now()`) when the audio already handed to the player will have finished. */
  private scheduledUntil = 0;
  private timer: unknown = null;
  /** True while something has been played since the last "drained" notice. */
  private active = false;
  private disposed = false;

  constructor(options: PlaybackQueueOptions) {
    this.options = {
      leadMs: 250,
      sliceMs: 100,
      tickMs: 40,
      now: () => Date.now(),
      setInterval: (callback, ms) => setInterval(callback, ms),
      clearInterval: (handle) => clearInterval(handle as ReturnType<typeof setInterval>),
      ...options,
    };
  }

  /** Adds agent audio (any byte length) to the queue and starts feeding the player. */
  enqueue(chunk: Uint8Array) {
    if (this.disposed) return;
    const aligned = this.aligner.push(chunk);
    if (aligned.length === 0) return;
    const maxBytes = Math.round(bytesPerMs(this.options.sampleRate) * this.options.sliceMs);
    for (const piece of splitPcm(aligned, maxBytes)) {
      this.pending.push(piece);
      this.pendingBytes += piece.length;
    }
    this.active = true;
    this.pump();
    this.ensureTimer();
  }

  /** Barge-in: drop all audio not yet handed to the player. */
  clear() {
    this.pending = [];
    this.pendingBytes = 0;
    this.aligner.reset();
    this.pump();
  }

  /** Milliseconds of agent audio still waiting in this queue. */
  get pendingMs() {
    return pcmDurationMs(this.pendingBytes, this.options.sampleRate);
  }

  /** True when nothing is waiting and the player has finished what it was given. */
  get isIdle() {
    return this.pending.length === 0 && this.options.now() >= this.scheduledUntil;
  }

  /** Stops timers; used when the conversation ends. */
  dispose() {
    this.disposed = true;
    this.pending = [];
    this.pendingBytes = 0;
    this.stopTimer();
  }

  /** Hands audio to the player until it is `leadMs` ahead of real time. */
  private pump() {
    const { now, leadMs, sampleRate, play, onDrained } = this.options;
    const currentTime = now();
    if (this.scheduledUntil < currentTime) this.scheduledUntil = currentTime;

    while (this.pending.length > 0 && this.scheduledUntil - currentTime < leadMs) {
      const piece = this.pending.shift() as Uint8Array;
      this.pendingBytes -= piece.length;
      play(piece);
      this.scheduledUntil += pcmDurationMs(piece.length, sampleRate);
    }

    if (this.active && this.isIdle) {
      this.active = false;
      this.stopTimer();
      onDrained?.();
    }
  }

  private ensureTimer() {
    if (this.timer !== null || this.disposed) return;
    this.timer = this.options.setInterval(() => this.pump(), this.options.tickMs);
  }

  private stopTimer() {
    if (this.timer === null) return;
    this.options.clearInterval(this.timer);
    this.timer = null;
  }
}
