import { Image } from 'expo-image';
import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

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

/**
 * Goes to another tab's screen. Today stays at the bottom of the stack: other tabs open
 * on top of it and replace each other, and "today" goes back down to it.
 * Returns false for a tab that doesn't exist yet.
 */
export function openTab(tab: Tab, from: Tab): boolean {
  if (tab === from) return true;
  if (tab === 'today') router.dismissTo('/home');
  else if (from === 'today') router.push(TAB_ROUTES[tab]);
  else router.replace(TAB_ROUTES[tab]);
  return true;
}

type TabBarProps = {
  current: Tab;
  bottomInset: number;
  onPick: (tab: Tab) => void;
  /** Background behind the tabs (black unless the screen is a different dark). */
  background?: string;
};

/** The black tab bar at the bottom of the Today, Visualize, Garden, Entries and Patterns screens. */
export function TabBar({ current, bottomInset, onPick, background = '#000' }: TabBarProps) {
  return (
    <View style={[styles.bar, { paddingBottom: bottomInset, backgroundColor: background }]} accessibilityRole="tablist">
      {TABS.map((tab) => {
        const selected = tab === current;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{ selected }}
            onPress={() => onPick(tab)}
            style={[styles.tab, { opacity: selected ? 1 : 0.45 }]}>
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
    paddingHorizontal: 6,
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
