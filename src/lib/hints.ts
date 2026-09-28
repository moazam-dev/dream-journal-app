import { File, Paths } from 'expo-file-system';

/** One-time tips the app shows until the person has tried the thing they point at. */
type Hint = 'visualizeSwipe';

type Hints = Partial<Record<Hint, true>>;

function hintsFile() {
  return new File(Paths.document, 'hints.json');
}

function loadHints(): Hints {
  try {
    const file = hintsFile();
    if (!file.exists) return {};
    const hints = JSON.parse(file.textSync()) as unknown;
    return hints && typeof hints === 'object' ? (hints as Hints) : {};
  } catch {
    return {};
  }
}

/** Whether the tip has done its job (the person has used the gesture). */
export function isHintDone(hint: Hint): boolean {
  return loadHints()[hint] === true;
}

/** Stops showing the tip. Losing this is harmless (the tip just shows again), so errors are ignored. */
export function markHintDone(hint: Hint) {
  try {
    const hints = { ...loadHints(), [hint]: true };
    const file = hintsFile();
    if (!file.exists) file.create();
    file.write(JSON.stringify(hints));
  } catch (error) {
    console.warn('Could not save the hint', error);
  }
}
