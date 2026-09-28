/** The answers on the gender onboarding screen, in the order the chips show them. */
export const GENDERS = ['woman', 'man', 'non-binary', 'self-describe', 'rather-not-say'] as const;

export type Gender = (typeof GENDERS)[number];

export const GENDER_CHIPS: Record<Gender, string> = {
  woman: 'a woman',
  man: 'a man',
  'non-binary': 'non-binary',
  'self-describe': 'self-describe',
  'rather-not-say': 'rather not say',
};

/** Longest self-description that still fits the big title line. */
export const MAX_GENDER_WORDS_LENGTH = 22;

/**
 * The words that finish "…the dreamer is ___", or '' while nothing is picked
 * (or "self-describe" is picked but nothing typed yet).
 */
export function genderSlot(gender: Gender | null, ownWords: string): string {
  switch (gender) {
    case null:
      return '';
    case 'self-describe':
      return ownWords.trim();
    case 'rather-not-say':
      return 'a mystery';
    default:
      return GENDER_CHIPS[gender];
  }
}
