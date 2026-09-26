import { Image } from 'expo-image';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { Dream } from '@/types/dream';

type DreamImageSectionProps = {
  dream: Dream;
  /** True while this screen is waiting for the image function. */
  generating: boolean;
  onRetry: () => void;
};

/**
 * The AI image of the dream, or the right message when it isn't ready:
 * - waiting for the reflection → short note (the image is based on it)
 * - being painted             → soft frame with a spinner
 * - failed                    → explanation + "Try again"
 */
export function DreamImageSection({ dream, generating, onRetry }: DreamImageSectionProps) {
  // If the saved link can't be loaded (e.g. no internet), say so instead of showing a blank box.
  const [loadFailed, setLoadFailed] = useState(false);

  if (dream.analysis_status !== 'completed') {
    return (
      <View style={styles.note}>
        <Text style={styles.muted}>Your dream image will be painted once the reflection is ready.</Text>
      </View>
    );
  }

  if (dream.image_status === 'completed' && dream.image_url && !generating) {
    if (loadFailed) {
      return (
        <View style={[styles.frame, styles.centered]}>
          <Text style={styles.muted}>The image couldn’t be loaded. Check your connection.</Text>
          <AppButton title="Reload image" variant="secondary" onPress={() => setLoadFailed(false)} />
        </View>
      );
    }
    return (
      <Image
        source={{ uri: dream.image_url }}
        style={styles.frame}
        contentFit="cover"
        transition={400}
        cachePolicy="memory-disk"
        accessibilityLabel={`AI image of the dream${dream.title ? ` “${dream.title}”` : ''}`}
        onError={() => setLoadFailed(true)}
      />
    );
  }

  if (dream.image_status === 'failed' && !generating) {
    return (
      <View style={[styles.frame, styles.centered]}>
        <Text style={styles.heading}>We couldn’t paint this dream</Text>
        <Text style={styles.muted}>Your dream and its reflection are safely saved.</Text>
        <AppButton title="Try again" variant="secondary" onPress={onRetry} />
      </View>
    );
  }

  // 'pending' (about to start) or 'generating'.
  return (
    <View style={[styles.frame, styles.centered]}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.heading}>Painting your dream…</Text>
      <Text style={styles.muted}>This can take up to a minute.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    width: '100%',
    // FLUX.1 [schnell] makes square images.
    aspectRatio: 1,
    borderRadius: Radius.lg,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    padding: Spacing.lg,
  },
  note: {
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Colors.textSecondary,
    borderRadius: Radius.md,
    padding: Spacing.md,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
