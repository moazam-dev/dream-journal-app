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

import { BrandColors, Colors, NightColors, SettingsColors, VoiceColors } from '@/constants/theme';
import { PERSONALIZING_BACKGROUND } from '@/utils/personalize';

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
    <>
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
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="welcome-in"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-name"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-birthday"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-gender"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-frequency"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        <Stack.Screen
          name="onboarding-vision"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: NightColors.background } }}
        />
        {/* No swiping back into onboarding once it's done. */}
        <Stack.Screen
          name="personalizing"
          options={{ headerShown: false, animation: 'fade', gestureEnabled: false, contentStyle: { backgroundColor: PERSONALIZING_BACKGROUND } }}
        />
        {/* The Today feed: black, full screen, with its own tab bar. */}
        <Stack.Screen
          name="home"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#000000' } }}
        />
        {/* The dreams painted so far, side by side: black, with the same tab bar as home. */}
        <Stack.Screen
          name="visualize"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#000000' } }}
        />
        {/* Every dream told, under a night sky, with the same tab bar as home. */}
        <Stack.Screen
          name="entries"
          options={{ headerShown: false, animation: 'fade', contentStyle: { backgroundColor: '#000' } }}
        />
        {/* What keeps coming back across the dreams, with the same tab bar as home. */}
        <Stack.Screen
          name="patterns"
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
            contentStyle: { backgroundColor: VoiceColors.background },
          }}
        />
      </Stack>
    </>
  );
}
