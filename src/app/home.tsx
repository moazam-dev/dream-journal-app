import { router } from 'expo-router';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { EmptyState } from '@/components/empty-state';
import { ErrorState } from '@/components/error-state';
import { Screen } from '@/components/screen';
import { Colors, Spacing } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { getGreeting } from '@/utils/date';

/** Home screen ("/home"). */
export default function HomeScreen() {
  const { dreams, loading, error, reload } = useDreams();

  function renderSummary() {
    if (loading) {
      return <ActivityIndicator color={Colors.primary} />;
    }
    if (error) {
      return <ErrorState message={error} onRetry={reload} />;
    }
    if (dreams.length === 0) {
      return (
        <EmptyState
          title="No dreams yet"
          message="Tap “Record a Dream” to write down your first one."
        />
      );
    }
    return (
      <Text style={styles.summary}>
        You have recorded {dreams.length} {dreams.length === 1 ? 'dream' : 'dreams'}.
      </Text>
    );
  }

  return (
    <Screen style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.greeting}>{getGreeting()} 👋</Text>
        {renderSummary()}
      </View>

      <View style={styles.actions}>
        <AppButton title="Record a Dream" onPress={() => router.push('/record')} />
        <AppButton
          title="Dream History"
          variant="secondary"
          onPress={() => router.push('/history')}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  content: {
    gap: Spacing.lg,
  },
  greeting: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
  },
  summary: {
    fontSize: 17,
    color: Colors.textSecondary,
  },
  actions: {
    gap: Spacing.md,
  },
});
