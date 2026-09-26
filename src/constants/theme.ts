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
