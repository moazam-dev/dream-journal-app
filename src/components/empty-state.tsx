import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type EmptyStateProps = {
  title: string;
  message: string;
};

/** Friendly message shown when there is nothing to display yet. */
export function EmptyState({ title, message }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.icon}>🌙</Text>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: Spacing.xl,
    borderRadius: Radius.lg,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  icon: {
    fontSize: 40,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
