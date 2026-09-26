import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, ScrollView, StyleSheet, Text, View } from 'react-native';

import { AiReflectionSection } from '@/components/ai-reflection-section';
import { Chip } from '@/components/chip';
import { DreamImageSection } from '@/components/dream-image-section';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { ReflectionAudioPlayer } from '@/components/reflection-audio-player';
import { Screen } from '@/components/screen';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useDreamImage } from '@/hooks/use-dream-image';
import { useDream } from '@/hooks/use-dreams';
import { analyzeDream } from '@/services/dreams';
import { formatDreamDate } from '@/utils/date';
import { getErrorMessage } from '@/utils/errors';

/**
 * Dream Detail screen ("/dream/<id>").
 * The [id] in the file name is a dynamic segment: whatever is in the URL becomes `id`.
 */
export default function DreamDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { dream, loading, error, reload, setDream } = useDream(id);
  const [analyzing, setAnalyzing] = useState(false);
  // Starts the AI image once the reflection is ready (see the hook for details).
  const image = useDreamImage(dream, setDream);

  async function handleRetryReflection() {
    setAnalyzing(true);
    try {
      const updatedDream = await analyzeDream(id);
      setDream(updatedDream);
    } catch (err) {
      Alert.alert('Reflection failed', getErrorMessage(err));
      // The server marked the dream as 'failed'; show that state.
      setDream((current) => (current ? { ...current, analysis_status: 'failed' } : current));
    } finally {
      setAnalyzing(false);
    }
  }

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading dream…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState title="Couldn’t load this dream" message={error} onRetry={reload} />
      </Screen>
    );
  }

  if (!dream) {
    return (
      <Screen>
        <EmptyState title="Dream not found" message="This dream may have been removed." />
      </Screen>
    );
  }

  const hasAnalysis = dream.analysis_status === 'completed' && !analyzing;

  return (
    <Screen style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          {hasAnalysis && !!dream.title && <Text style={styles.title}>{dream.title}</Text>}
          <Text style={styles.date}>{formatDreamDate(dream.created_at)}</Text>
        </View>

        {hasAnalysis && (
          <View style={styles.chips}>
            {!!dream.mood && <Chip label={dream.mood} variant="filled" />}
            {dream.themes?.map((theme) => <Chip key={theme} label={theme} />)}
          </View>
        )}

        <DreamImageSection dream={dream} generating={image.generating} onRetry={image.retry} />

        <View style={styles.dreamBox}>
          <Text style={styles.dreamLabel}>Your dream</Text>
          <Text style={styles.dreamText}>{dream.dream_text}</Text>
        </View>

        <AiReflectionSection
          dream={dream}
          analyzing={analyzing}
          onRetry={handleRetryReflection}
        />

        <ReflectionAudioPlayer dream={dream} setDream={setDream} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  header: {
    gap: Spacing.xs,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
  },
  date: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  dreamBox: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  dreamLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  dreamText: {
    fontSize: 17,
    lineHeight: 26,
    color: Colors.text,
  },
});
