import { router } from 'expo-router';
import { FlatList, StyleSheet, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { DreamCard } from '@/components/dream-card';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { LoadingState } from '@/components/loading-state';
import { Screen } from '@/components/screen';
import { Spacing } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';

/** Dream History screen ("/history"). Lists every saved dream, newest first. */
export default function DreamHistoryScreen() {
  const { dreams, loading, error, reload } = useDreams();

  if (loading) {
    return (
      <Screen>
        <LoadingState message="Loading your dreams…" />
      </Screen>
    );
  }

  if (error) {
    return (
      <Screen>
        <ErrorState message={error} onRetry={reload} />
      </Screen>
    );
  }

  return (
    <Screen style={styles.screen}>
      <FlatList
        data={dreams}
        keyExtractor={(dream) => dream.id}
        renderItem={({ item }) => <DreamCard dream={item} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <EmptyState
              title="No dreams saved"
              message="Dreams you record will show up here."
            />
            <AppButton title="Record a Dream" onPress={() => router.push('/record')} />
          </View>
        }
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    padding: 0,
  },
  list: {
    padding: Spacing.lg,
    gap: Spacing.md,
  },
  empty: {
    gap: Spacing.md,
  },
});
