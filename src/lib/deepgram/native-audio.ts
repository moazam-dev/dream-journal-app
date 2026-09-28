/**
 * Loads the native two-way audio module (microphone PCM streaming + PCM playback with
 * echo cancellation) only if it exists in this build.
 *
 * It is NOT part of Expo Go, so in Expo Go this returns null and the voice screen shows a
 * friendly "needs the development build" message instead of crashing the whole app.
 */
import { requireOptionalNativeModule } from 'expo';

export type NativeAudio = typeof import('@speechmatics/expo-two-way-audio');

let cached: NativeAudio | null | undefined;

/**
 * True only in a native build that includes the audio module (not in Expo Go).
 * Used to hide the voice companion's buttons where it can't run.
 */
export function isVoiceAgentAvailable() {
  return loadNativeAudio() !== null;
}

export function loadNativeAudio(): NativeAudio | null {
  if (cached !== undefined) return cached;
  if (!requireOptionalNativeModule('ExpoTwoWayAudio')) {
    cached = null;
    return cached;
  }
  // Loaded lazily on purpose: importing it at the top of a file would crash in Expo Go.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  cached = require('@speechmatics/expo-two-way-audio') as NativeAudio;
  return cached;
}
