import { Image } from 'expo-image';
import { router, useIsFocused, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useReducedMotion, useSharedValue, withTiming } from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';

export const TABS = ['today', 'visualize', 'garden', 'entries', 'patterns'] as const;
export type Tab = (typeof TABS)[number];

/** Height of the tab row, above the home indicator. */
export const TAB_BAR_HEIGHT = 58;

const LOGO = require('@/assets/images/afterdream-logo.png');

const TAB_ROUTES: Record<Tab, Href> = {
  today: '/home',
  visualize: '/visualize',
  garden: '/garden',
  entries: '/entries',
  patterns: '/patterns',
};

/** How long the highlight takes to slide over to the new tab. */
const SLIDE_MS = 220;
const BAR_PADDING = 6;
const PILL_WIDTH = 56;

/** The tab whose screen was last on show, so the next one's highlight slides over from it. */
let shownTab: Tab = 'today';

/**
 * Switches to another tab's screen. The tabs stay mounted, so this is instant.
 * Returns false for a tab that doesn't exist yet.
 */
export function openTab(tab: Tab, from: Tab): boolean {
  if (tab !== from) router.navigate(TAB_ROUTES[tab]);
  return true;
}

type TabBarProps = {
  current: Tab;
  bottomInset: number;
  onPick: (tab: Tab) => void;
  /** Background behind the tabs (black unless the screen is a different dark). */
  background?: string;
};

/**
 * The black tab bar at the bottom of the Today, Visualize, Garden, Entries and Patterns screens.
 * Each screen has its own, so when a screen comes into view its highlight slides over from
 * the tab that was showing before.
 */
export function TabBar({ current, bottomInset, onPick, background = '#000' }: TabBarProps) {
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [tabWidth, setTabWidth] = useState(0);
  const position = useSharedValue(TABS.indexOf(current));

  useEffect(() => {
    if (!focused) return;
    const to = TABS.indexOf(current);
    if (reduceMotion) position.value = to;
    else {
      position.value = TABS.indexOf(shownTab);
      position.value = withTiming(to, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) });
    }
    shownTab = current;
  }, [focused, current, reduceMotion, position]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: BAR_PADDING + position.value * tabWidth + (tabWidth - PILL_WIDTH) / 2 }],
  }));

  function onLayout(event: LayoutChangeEvent) {
    setTabWidth((event.nativeEvent.layout.width - BAR_PADDING * 2) / TABS.length);
  }

  return (
    <View style={[styles.bar, { paddingBottom: bottomInset, backgroundColor: background }]} onLayout={onLayout} accessibilityRole="tablist">
      {tabWidth > 0 && <Animated.View pointerEvents="none" style={[styles.pill, pill]} />}
      {TABS.map((tab) => {
        const selected = tab === current;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onPick(tab)}
            hitSlop={{ top: 8 }}
            style={({ pressed }) => [styles.tab, { opacity: selected ? 1 : pressed ? 0.8 : 0.45, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
            <View style={styles.icon}>
              <TabIcon tab={tab} />
            </View>
            <Text style={styles.label}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function TabIcon({ tab }: { tab: Tab }) {
  switch (tab) {
    case 'today':
      return <Image source={LOGO} style={styles.logo} contentFit="contain" tintColor="#fff" />;
    case 'visualize':
      return (
        <View style={styles.moon}>
          <View style={styles.moonHalf} />
        </View>
      );
    case 'garden':
      return (
        <View style={styles.sprout}>
          <View style={styles.sproutStem} />
          <View style={[styles.sproutLeaf, styles.sproutLeft]} />
          <View style={[styles.sproutLeaf, styles.sproutRight]} />
        </View>
      );
    case 'entries':
      return (
        <View style={styles.lines}>
          {[20, 14, 18].map((width, i) => (
            <View key={i} style={[styles.line, { width }]} />
          ))}
        </View>
      );
    case 'patterns':
      return (
        <View style={styles.bars}>
          {[8, 16, 11, 20].map((height, i) => (
            <View key={i} style={[styles.chartBar, { height }]} />
          ))}
        </View>
      );
  }
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 8,
    paddingHorizontal: BAR_PADDING,
  },
  pill: {
    position: 'absolute',
    left: 0,
    top: 6,
    width: PILL_WIDTH,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
  },
  tab: {
    flex: 1,
    height: TAB_BAR_HEIGHT - 8,
    alignItems: 'center',
    gap: 6,
    paddingTop: 4,
  },
  icon: {
    width: 26,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#fff',
  },
  logo: {
    width: 24,
    height: 24,
  },
  moon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#fff',
    overflow: 'hidden',
  },
  moonHalf: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    right: 0,
    backgroundColor: '#fff',
  },
  sprout: {
    width: 22,
    height: 22,
  },
  sproutStem: {
    position: 'absolute',
    left: 10,
    bottom: 0,
    width: 2,
    height: 14,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  sproutLeaf: {
    position: 'absolute',
    width: 10,
    height: 7,
    backgroundColor: '#fff',
  },
  sproutLeft: {
    left: 1,
    top: 3,
    borderTopLeftRadius: 10,
    borderBottomRightRadius: 10,
  },
  sproutRight: {
    right: 1,
    top: 0,
    borderTopRightRadius: 10,
    borderBottomLeftRadius: 10,
  },
  lines: {
    gap: 4,
    alignItems: 'flex-start',
  },
  line: {
    height: 3,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  bars: {
    height: 20,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  chartBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
});
