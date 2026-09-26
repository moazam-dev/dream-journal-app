import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Screen } from '@/components/screen';
import { Colors, Spacing } from '@/constants/theme';

/** Onboarding screen. `index.tsx` is the first route the app opens ("/"). */
export default function OnboardingScreen() {
  function handleGetStarted() {
    // `replace` (not `push`) so the user can't go "back" to onboarding from Home.
    router.replace('/home');
  }

  return (
    <Screen edges={['top', 'bottom', 'left', 'right']} style={styles.container}>
      <View style={styles.hero}>
        <Text style={styles.icon}>🌙</Text>
        <Text style={styles.title}>Dream Journal</Text>
        <Text style={styles.description}>
          Write down your dreams each morning and look back on them over time.
        </Text>
      </View>

      <AppButton title="Get Started" onPress={handleGetStarted} />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'space-between',
  },
  hero: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.md,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.text,
  },
  description: {
    fontSize: 17,
    lineHeight: 24,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
