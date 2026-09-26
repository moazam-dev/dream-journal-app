import { ActivityIndicator, Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type AppButtonProps = {
  title: string;
  onPress: () => void;
  /** 'primary' = filled purple button, 'secondary' = outlined button. */
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  /** Shows a spinner and blocks taps, e.g. while saving. */
  loading?: boolean;
};

export function AppButton({
  title,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
}: AppButtonProps) {
  const isPrimary = variant === 'primary';
  const textColor = isPrimary ? Colors.primaryText : Colors.primary;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}>
      {loading && <ActivityIndicator color={textColor} />}
      <Text style={[styles.text, { color: textColor }]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  secondary: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.4,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});
