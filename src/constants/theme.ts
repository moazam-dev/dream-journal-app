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
  /** Thin lime horizon line above the keyboard. */
  horizon: 'rgba(226, 235, 152, 0.5)',
} as const;

/** Bricolage Grotesque, loaded in the root layout. Use as `fontFamily`. */
export const BrandFonts = {
  regular: 'BricolageGrotesque_400Regular',
  medium: 'BricolageGrotesque_500Medium',
  semibold: 'BricolageGrotesque_600SemiBold',
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
