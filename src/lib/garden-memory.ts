import { File, Paths } from 'expo-file-system';
import { Platform } from 'react-native';

import type { GardenSeen } from '@/utils/garden';

/**
 * How the dream garden looked the last time it was opened, saved on the phone only
 * (garden.json in the documents folder, or local storage on the web, which has no file
 * system). Opening it again grows or wilts it from there.
 */

const KEY = 'afterdream.garden';

function readText(): string | null {
  if (Platform.OS === 'web') return globalThis.localStorage?.getItem(KEY) ?? null;
  const file = seenFile();
  return file.exists ? file.textSync() : null;
}

function writeText(text: string): void {
  if (Platform.OS === 'web') {
    globalThis.localStorage?.setItem(KEY, text);
    return;
  }
  const file = seenFile();
  if (!file.exists) file.create();
  file.write(text);
}

function seenFile() {
  return new File(Paths.document, 'garden.json');
}

function isSeen(value: unknown): value is GardenSeen {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  const keyOrNull = (x: unknown) => x === null || typeof x === 'string';
  return (
    typeof v.growth === 'number' &&
    typeof v.dew === 'number' &&
    typeof v.wilted === 'boolean' &&
    keyOrNull(v.wiltSince) &&
    keyOrNull(v.dewSave)
  );
}

/** The last garden seen, or `null` the first time (or if it can't be read). */
export function loadGardenSeen(): GardenSeen | null {
  try {
    const text = readText();
    if (!text) return null;
    const seen = JSON.parse(text) as unknown;
    return isSeen(seen) ? seen : null;
  } catch {
    return null;
  }
}

/** Remembers the garden as it is now. Not worth interrupting anything for, so errors are only logged. */
export function saveGardenSeen(seen: GardenSeen): void {
  try {
    writeText(JSON.stringify(seen));
  } catch (error) {
    console.warn('Could not save the garden', error);
  }
}
