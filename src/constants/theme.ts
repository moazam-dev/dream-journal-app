/**
 * Shared colors and spacing so every screen looks consistent.
 * Change a value here and it updates everywhere.
 */

export const Colors = {
  primary: '#5B4BDB',
  primaryText: '#FFFFFF',
  background: '#F7F6FB',
  surface: '#FFFFFF',
  text: '#1C1B29',
  textSecondary: '#6B6880',
  border: '#E3E1EC',
  /** Recording indicator and error messages. */
  danger: '#C4314B',
} as const;

/** Afterdream brand colours (welcome screen). */
export const BrandColors = {
  lime: '#E2EB98',
  limeDeep: '#C9D46E',
  limeSoft: '#F2F7C4',
  ink: '#111111',
  inkSoft: '#2B2D18',
} as const;

/** Night palette for the agreement screen (black, white text, lime accents). */
export const NightColors = {
  background: '#000000',
  text: '#FFFFFF',
  textSoft: '#D6D6D6',
  /** Inactive slide dot. */
  dot: '#555555',
  /** Main button before the terms are accepted. */
  buttonOff: '#1F1F1F',
  buttonOffText: '#6B6B6B',
  /** Pale lime button on black ("You're in" screen). */
  buttonLight: '#F4F7DC',
  /** Small grey hint text. */
  hint: '#8A8A8A',
  /** Soft text on the lime glow. */
  onLimeSoft: '#3A3D1F',
  /** Empty part of the onboarding progress bar. */
  track: '#2A2A2A',
  /** Placeholder text in big inputs. */
  placeholder: '#3D3D3D',
  /** Small "continue" button before anything is typed. */
  pillOff: '#1A1A1A',
  pillOffText: '#555555',
} as const;

/** Bricolage Grotesque, loaded in the root layout. Use as `fontFamily`. */
export const BrandFonts = {
  light: 'BricolageGrotesque_300Light',
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
} as const;

/**
 * Patterns' type roles (from the Patterns design), set in Bricolage Grotesque so Patterns
 * reads like the other tabs. "serif" is the display face for card headlines and numbers.
 */
export const PatternFonts = {
  serif: BrandFonts.regular,
  serifItalic: BrandFonts.light,
  sans: BrandFonts.regular,
  sansMedium: BrandFonts.medium,
  sansSemibold: BrandFonts.semibold,
} as const;

/** Warm night palette from the Afterdream Patterns design, on the black the other tabs use. */
export const PatternColors = {
  background: '#000000',
  card: '#1C1A17',
  line: '#2E2B26',
  cream: '#F3EEE4',
  muted: '#A39B8C',
  ink: '#1B1A17',
  rust: '#C8553D',
  mustard: '#E3B04B',
  sky: '#7C9CBF',
  plum: '#3D2A4F',
  aubergine: '#5B3A5E',
  lilac: '#D8C7E3',
  forest: '#2F4A3A',
  mint: '#C9D6C3',
  sage: '#8FA98B',
  sageLight: '#A9BFA5',
  paperLine: '#D9D2C4',
  paperMuted: '#6E675B',
  paperText: '#3B372F',
  whatsapp: '#25D366',
  whatsappInk: '#0B2A16',
} as const;

/** Black palette from the Afterdream Settings design. */
export const SettingsColors = {
  background: '#000000',
  text: '#FFFFFF',
  soft: 'rgba(255, 255, 255, 0.78)',
  muted: 'rgba(255, 255, 255, 0.55)',
  line: '#262626',
  /** Round back button and keypad keys. */
  button: '#1F1F1F',
  card: '#1A1A1A',
  /** Unselected chips and switches that are off. */
  chip: '#2A2A2A',
  input: '#0D0D0D',
  border: '#333333',
  borderSoft: '#3A3A3A',
  lime: '#E2EB98',
  light: '#E4E4E4',
  ink: '#111111',
  violet: '#2B1B5A',
  lilac: '#C9B8F2',
  orange: '#FF7A35',
  forest: '#14301C',
  sky: '#A8D8F0',
} as const;

/** Dark, calm palette used only by the voice companion screen. */
export const VoiceColors = {
  background: '#0D0B1E',
  surface: 'rgba(255, 255, 255, 0.07)',
  userBubble: 'rgba(139, 124, 246, 0.28)',
  text: '#F2F0FA',
  textSecondary: '#A8A3C2',
  // Orb colours per state.
  idle: '#6E68A3',
  connecting: '#6E68A3',
  listening: '#8B7CF6',
  thinking: '#5E8BF0',
  speaking: '#C58BFF',
  muted: '#55526A',
  error: '#E0607A',
} as const;

export const Spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const Radius = {
  md: 12,
  lg: 16,
} as const;
