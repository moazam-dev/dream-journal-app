import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Dream } from '@/types/dream';

type AiReflectionSectionProps = {
  dream: Dream;
  /** True while a retry is running. */
  analyzing: boolean;
  onRetry: () => void;
};

/**
 * Shows the AI summary + reflection for a dream, or the right message when it isn't ready:
 * - analyzing → spinner
 * - failed    → explanation + "Try again"
 * - pending   → "Create reflection" button
 */
export function AiReflectionSection({ dream, analyzing, onRetry }: AiReflectionSectionProps) {
  if (analyzing) {
    return (
      <View style={[styles.card, styles.centered]}>
        <ActivityIndicator color={Colors.primary} />
        <Text style={styles.muted}>Reflecting on your dream…</Text>
      </View>
    );
  }

  if (dream.analysis_status === 'completed') {
    return (
      <>
        <View style={styles.card}>
          <Text style={styles.heading}>Summary</Text>
          <Text style={styles.body}>{dream.summary}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.heading}>AI Reflection</Text>
          <Text style={styles.body}>{dream.reflection}</Text>
          <Text style={styles.note}>
            AI reflections offer possibilities, not facts. Only you know what your dream means to you.
          </Text>
        </View>
      </>
    );
  }

  const failed = dream.analysis_status === 'failed';
  return (
    <View style={styles.card}>
      <Text style={styles.heading}>AI Reflection</Text>
      <Text style={styles.muted}>
        {failed
          ? 'We couldn’t create a reflection this time. Your dream is safely saved.'
          : 'This dream doesn’t have a reflection yet.'}
      </Text>
      <AppButton
        title={failed ? 'Try again' : 'Create reflection'}
        variant="secondary"
        onPress={onRetry}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  centered: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: Colors.text,
  },
  muted: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  note: {
    fontSize: 12,
    lineHeight: 18,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
});
