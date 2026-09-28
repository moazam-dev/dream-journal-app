import { File, Paths } from 'expo-file-system';

import type { Gender } from '@/utils/gender';
import type { Goal } from '@/utils/goals';
import type { Recall } from '@/utils/recall';

/**
 * What the person told us about themselves during onboarding, saved on the phone only
 * (a small JSON file in the app's documents folder). There are no accounts yet.
 */
type Profile = {
  /** The name or nickname they want to be called. */
  name?: string;
  /** Their birthday as "YYYY-MM-DD" (no time zone; it's a calendar date). */
  birthday?: string;
  /** How they describe themselves, so the app talks to them the right way. */
  gender?: Gender;
  /** Their own words, when `gender` is "self-describe". */
  genderWords?: string;
  /** How often they remember their dreams. */
  recall?: Recall;
  /** What they want from their nights, in the order they picked them. */
  goals?: Goal[];
};

function profileFile() {
  return new File(Paths.document, 'profile.json');
}

function loadProfile(): Profile {
  try {
    const file = profileFile();
    if (!file.exists) return {};
    const profile = JSON.parse(file.textSync()) as unknown;
    return profile && typeof profile === 'object' ? (profile as Profile) : {};
  } catch {
    return {};
  }
}

/** Merges `changes` into the saved profile. Failing to save isn't worth stopping onboarding for, so errors are only logged. */
function saveProfile(changes: Profile, what: string): void {
  try {
    const file = profileFile();
    const profile = { ...loadProfile(), ...changes } satisfies Profile;
    if (!file.exists) file.create();
    file.write(JSON.stringify(profile));
  } catch (error) {
    console.warn(`Could not save profile ${what}`, error);
  }
}

/** Everything saved so far (possibly empty). Values come from disk, so check them before use. */
export function loadProfileAnswers(): Profile {
  return loadProfile();
}

/** The saved name, or `null` if they skipped it or it can't be read. */
export function loadProfileName(): string | null {
  const { name } = loadProfile();
  return typeof name === 'string' && name.trim() ? name.trim() : null;
}

export function saveProfileName(name: string): void {
  saveProfile({ name: name.trim() }, 'name');
}

/** Saves the birthday. `month` is 0-based, like `Date`. */
export function saveProfileBirthday(year: number, month: number, day: number): void {
  const pad = (n: number) => String(n).padStart(2, '0');
  saveProfile({ birthday: `${year}-${pad(month + 1)}-${pad(day)}` }, 'birthday');
}

/** Saves the gender answer. `words` is only kept for "self-describe". */
export function saveProfileGender(gender: Gender, words: string): void {
  saveProfile(
    { gender, genderWords: gender === 'self-describe' ? words.trim() : undefined },
    'gender',
  );
}

export function saveProfileRecall(recall: Recall): void {
  saveProfile({ recall }, 'dream recall');
}

export function saveProfileGoals(goals: readonly Goal[]): void {
  saveProfile({ goals: [...goals] }, 'goals');
}
