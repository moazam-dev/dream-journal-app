import { router } from 'expo-router';
import { Tabs } from 'expo-router/js-tabs';
import { useEffect } from 'react';

import { PatternColors } from '@/constants/theme';

/** How long after the first tab shows before the others start loading in the background. */
const PREFETCH_DELAY_MS = 1200;

/**
 * The five tabs: Today, Visualize, Garden, Entries and Patterns. Once opened, a tab stays
 * mounted, so switching back is instant (no animation, no reload). Each screen draws its own
 * TabBar, so its sheets and overlays can still cover the bar.
 */
export default function TabsLayout() {
  // Load the other tabs quietly once the first one is up, so even the first switch is quick.
  useEffect(() => {
    const timer = setTimeout(() => {
      for (const href of ['/visualize', '/garden', '/entries', '/patterns'] as const) router.prefetch(href);
    }, PREFETCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <Tabs
      tabBar={() => null}
      backBehavior="firstRoute"
      screenOptions={{ headerShown: false, animation: 'none', sceneStyle: { backgroundColor: '#000' } }}>
      <Tabs.Screen name="home" />
      <Tabs.Screen name="visualize" />
      <Tabs.Screen name="garden" options={{ sceneStyle: { backgroundColor: '#1d1838' } }} />
      <Tabs.Screen name="entries" />
      <Tabs.Screen name="patterns" options={{ sceneStyle: { backgroundColor: PatternColors.background } }} />
    </Tabs>
  );
}
