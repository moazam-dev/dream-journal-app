import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Colors, Radius, Spacing } from '@/constants/theme';

type ErrorStateProps = {
  title?: string;
  message: string;
  onRetry: () => void;
};

/** Shown when loading data fails, with a button to try again. */
export function ErrorState({
  title = 'Couldn’t load your dreams',
  message,
  onRetry,
}: ErrorStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      <AppButton title="Try again" variant="secondary" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.md,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
