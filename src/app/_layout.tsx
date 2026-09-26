import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { Colors } from '@/constants/theme';

/**
 * Root layout: wraps every screen in the app.
 * Stack is the navigator: new screens slide in on top, "back" pops them off.
 */
export default function RootLayout() {
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
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="home" options={{ title: 'Dream Journal' }} />
        <Stack.Screen name="record" options={{ title: 'New Dream' }} />
        <Stack.Screen name="history" options={{ title: 'Dream History' }} />
        <Stack.Screen name="dream/[id]" options={{ title: 'Dream' }} />
      </Stack>
    </>
  );
}
