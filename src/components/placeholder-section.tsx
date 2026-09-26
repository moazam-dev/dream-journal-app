import { StyleSheet, Text, View } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';

type PlaceholderSectionProps = {
  title: string;
  description: string;
};

/**
 * A dashed box marking a feature that is not built yet
 * (AI Reflection, Dream Image, Audio Reflection).
 */
export function PlaceholderSection({ title, description }: PlaceholderSectionProps) {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.badge}>Coming soon</Text>
      </View>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.textSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  badge: {
    fontSize: 12,
    color: Colors.textSecondary,
    backgroundColor: Colors.border,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: Radius.md,
    overflow: 'hidden',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
});
