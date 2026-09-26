import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors, Spacing } from '@/constants/theme';

type LoadingStateProps = {
  message?: string;
};

/** Centered spinner shown while data is loading. */
export function LoadingState({ message = 'Loading…' }: LoadingStateProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
    padding: Spacing.lg,
  },
  message: {
    fontSize: 15,
    color: Colors.textSecondary,
  },
});
