import {
  BricolageGrotesque_300Light,
  BricolageGrotesque_400Regular,
  BricolageGrotesque_500Medium,
  BricolageGrotesque_600SemiBold,
  useFonts,
} from '@expo-google-fonts/bricolage-grotesque';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { BrandColors, Colors, NightColors, SettingsColors } from '@/constants/theme';
import { PERSONALIZING_BACKGROUND } from '@/utils/personalize';

/** Sign-in and onboarding screens swap with a quick fade (iOS; Android uses its own). */
const QUICK_FADE_MS = 200;

// Keep the splash screen up until the brand font has loaded (avoids a flash of the wrong font).
SplashScreen.preventAutoHideAsync().catch(() => {});

/**
 * Root layout: wraps every screen in the app.
 * Stack is the navigator: new screens slide in on top, "back" pops them off.
 */
export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    BricolageGrotesque_300Light,
    BricolageGrotesque_400Regular,
    BricolageGrotesque_500Medium,
    BricolageGrotesque_600SemiBold,
  });
  const ready = fontsLoaded || !!fontError; // if the font fails, carry on with the system font

  useEffect(() => {
    if (ready) SplashScreen.hideAsync().catch(() => {});
  }, [ready]);

  if (!ready) return null;

  return (
    // Needed for the drag along Today's glass tab bar.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <StatusBar style="dark" />
      <Stack
        screenOptions={{
          headerTintColor: Colors.primary,
          headerTitleStyle: { color: Colors.text },
          headerBackTitle: 'Back',
          contentStyle: { backgroundColor: Colors.background },
        }}>
        {/* `name` matches the file path inside src/app (without .tsx). */}
        <Stack.Screen
          name="index"
          options={{ headerShown: false, contentStyle: { backgroundColor: BrandColors.ink } }}
        />
        <Stack.Screen
          name="agreement"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="welcome-in"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-name"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-birthday"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-gender"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-frequency"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-vision"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, contentStyle: { backgroundColor: NightColors.background } }}
        />
        {/* No swiping back into onboarding once it's done. */}
        <Stack.Screen
          name="personalizing"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, gestureEnabled: false, contentStyle: { backgroundColor: PERSONALIZING_BACKGROUND } }}
        />
        {/* The paywall: once on the way in (after the loading screen), then over any locked feature. */}
        <Stack.Screen
          name="paywall"
          options={{ headerShown: false, animation: 'fade', animationDuration: QUICK_FADE_MS, gestureEnabled: false, contentStyle: { backgroundColor: '#000000' } }}
        />
        {/* Today, Visualize, Garden, Entries and Patterns: the tabs, switched instantly. */}
        <Stack.Screen
          name="(tabs)"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#000000' } }}
        />
        {/* Settings, opened from the cog on Patterns: black, with its own back button. */}
        <Stack.Screen name="settings" options={{ headerShown: false, contentStyle: { backgroundColor: SettingsColors.background } }} />
        <Stack.Screen name="record" options={{ title: 'New Dream' }} />
        <Stack.Screen name="history" options={{ title: 'Dream History' }} />
        {/* One dream: its transcript and analysis, with a way into Visualize. */}
        <Stack.Screen name="dream/[id]" options={{ headerShown: false, contentStyle: { backgroundColor: '#000' } }} />
        {/* One dream's picture, full screen, with its title over the bottom. */}
        <Stack.Screen name="painting/[id]" options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#000' } }} />
        {/* Full-screen, dark voice companion with its own header. */}
        <Stack.Screen
          name="voice"
          options={{
            headerShown: false,
            presentation: 'fullScreenModal',
            // The night blue the Voice Agent design's backdrop sits on, so there is no
            // flash of another colour while the screen comes up.
            contentStyle: { backgroundColor: '#0b0f1f' },
          }}
        />
      </Stack>
    </GestureHandlerRootView>
  );
}
