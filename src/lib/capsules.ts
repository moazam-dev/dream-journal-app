import { Directory, File, Paths } from 'expo-file-system';

import { dateKey, type Capsule } from '@/utils/today';

/**
 * Notes to future you, saved on the phone only: each recording is an audio file in
 * documents/capsules/, and capsules.json lists them. There are no accounts yet.
 */

function capsuleDir() {
  return new Directory(Paths.document, 'capsules');
}

function indexFile() {
  return new File(Paths.document, 'capsules.json');
}

function isCapsule(value: unknown): value is Capsule & { file: string } {
  if (!value || typeof value !== 'object') return false;
  const c = value as Record<string, unknown>;
  return (
    typeof c.id === 'string' &&
    typeof c.file === 'string' &&
    typeof c.sealedAt === 'string' &&
    typeof c.opensOn === 'string' &&
    typeof c.seconds === 'number'
  );
}

export type StoredCapsule = Capsule & {
  /** File name inside the capsules folder. */
  file: string;
};

/** Every sealed note, newest first (empty if none, or if the list can't be read). */
export function loadCapsules(): StoredCapsule[] {
  try {
    const file = indexFile();
    if (!file.exists) return [];
    const list = JSON.parse(file.textSync()) as unknown;
    return Array.isArray(list) ? list.filter(isCapsule) : [];
  } catch {
    return [];
  }
}

/** Where a capsule's recording lives, for playing it back. */
export function capsuleUri(capsule: StoredCapsule): string {
  return new File(capsuleDir(), capsule.file).uri;
}

/**
 * Moves a finished recording into the capsules folder and adds it to the list.
 * Returns the updated list. Throws if the recording can't be kept.
 */
export function sealCapsule(recordingUri: string, seconds: number, opensOn: Date): StoredCapsule[] {
  const dir = capsuleDir();
  dir.create({ idempotent: true, intermediates: true });

  const recording = new File(recordingUri);
  const id = `${Date.now()}`;
  const extension = recording.extension || '.m4a';
  const file = `${id}${extension}`;
  recording.moveSync(new File(dir, file));

  const capsule: StoredCapsule = {
    id,
    file,
    sealedAt: new Date().toISOString(),
    opensOn: dateKey(opensOn),
    seconds: Math.max(1, Math.round(seconds)),
  };
  const list = [capsule, ...loadCapsules()];

  const index = indexFile();
  if (!index.exists) index.create();
  index.write(JSON.stringify(list));
  return list;
}
