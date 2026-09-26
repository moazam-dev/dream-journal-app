import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text } from 'react-native';

import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { formatDreamDate } from '@/utils/date';

type DreamCardProps = {
  dream: Dream;
};

/** A tappable preview of one dream. Tapping it opens the Dream Detail screen. */
export function DreamCard({ dream }: DreamCardProps) {
  return (
    // `Link` handles navigation; `asChild` lets our Pressable be the thing that gets tapped.
    <Link href={{ pathname: '/dream/[id]', params: { id: dream.id } }} asChild>
      <Pressable style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
        {!!dream.title && <Text style={styles.title}>{dream.title}</Text>}
        <Text style={styles.date}>{formatDreamDate(dream.created_at)}</Text>
        <Text style={styles.preview} numberOfLines={3}>
          {dream.dream_text}
        </Text>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  pressed: {
    opacity: 0.7,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.text,
  },
  date: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  preview: {
    fontSize: 16,
    lineHeight: 22,
    color: Colors.text,
  },
});
