import { StyleSheet, Text } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type ChipProps = {
  label: string;
  /** 'filled' = purple (used for mood), 'outline' = light (used for themes). */
  variant?: 'filled' | 'outline';
};

/** A small rounded label, e.g. a mood or a theme. */
export function Chip({ label, variant = 'outline' }: ChipProps) {
  const isFilled = variant === 'filled';

  return (
    <Text style={[styles.chip, isFilled ? styles.filled : styles.outline]}>{label}</Text>
  );
}

const styles = StyleSheet.create({
  chip: {
    fontSize: 13,
    fontWeight: '600',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.lg,
    overflow: 'hidden',
  },
  filled: {
    backgroundColor: Colors.primary,
    color: Colors.primaryText,
  },
  outline: {
    backgroundColor: Colors.surface,
    color: Colors.primary,
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
