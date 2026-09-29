import { GlassContainer, GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { Image } from 'expo-image';
import { router, useIsFocused, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { clamp, Easing, runOnJS, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming, type SharedValue } from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { usePaywall } from '@/hooks/use-paywall';
import type { PaidFeature } from '@/utils/subscription';

export const TABS = ['today', 'visualize', 'garden', 'entries', 'patterns'] as const;
export type Tab = (typeof TABS)[number];

/** Height of the tab row, above the home indicator. */
export const TAB_BAR_HEIGHT = 58;

/** The floating glass bar (Today): how tall it is, and the gap under it. */
export const GLASS_BAR_HEIGHT = 64;
export const GLASS_BAR_GAP = 10;
/** How far the glass bar sits in from the sides of the screen. */
const GLASS_SIDE = 16;
/** The gap between the bar's edge and the lens sliding inside it. */
const LENS_INSET = 4;
const LENS_HEIGHT = GLASS_BAR_HEIGHT - LENS_INSET * 2;

const LOGO = require('@/assets/images/afterdream-logo.png');

const TAB_ROUTES: Record<Tab, Href> = {
  today: '/home',
  visualize: '/visualize',
  garden: '/garden',
  entries: '/entries',
  patterns: '/patterns',
};

/** The three tabs the subscription pays for. Today and Entries stay free. */
const TAB_FEATURES: Partial<Record<Tab, PaidFeature>> = {
  visualize: 'visualize',
  garden: 'garden',
  patterns: 'patterns',
};

/** How long the highlight takes to slide over to the new tab. */
const SLIDE_MS = 220;
const BAR_PADDING = 6;
const PILL_WIDTH = 56;
/** The lens settling after a drag: quick, with the smallest bounce that still feels alive. */
const SETTLE = { damping: 18, stiffness: 220, mass: 0.7 };

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
  /**
   * Today's bar: a rounded pane of glass floating over the screen, which you can drag your
   * finger along to move the lens from tab to tab instead of tapping.
   */
  floating?: boolean;
};

/**
 * The tab bar at the bottom of the Today, Visualize, Garden, Entries and Patterns screens.
 * Each screen has its own, so when a screen comes into view its highlight slides over from
 * the tab that was showing before.
 *
 * Today asks for the `floating` one, from the Home - Orb Flow design: clear liquid glass over
 * the picture, with a lens you can either tap or drag along the bar. It stretches as it is
 * thrown and settles on the tab you let go over. Where liquid glass isn't there (older iOS,
 * Android) the same bar is drawn in frosted white instead.
 */
export function TabBar({ current, bottomInset, onPick, background = '#000', floating = false }: TabBarProps) {
  const focused = useIsFocused();
  const reduceMotion = useReducedMotion();
  const [barWidth, setBarWidth] = useState(0);
  const position = useSharedValue(TABS.indexOf(current));
  // How far the lens is squashed by the throw: wider and flatter the faster it moves.
  const stretch = useSharedValue(0);
  const held = useSharedValue(0);
  // Visualize, Garden and Patterns are paid: the guard nudges or stops before the tab switches.
  const { guard, reminder } = usePaywall();

  const padding = floating ? LENS_INSET : BAR_PADDING;
  const tabWidth = barWidth > 0 ? (barWidth - padding * 2) / TABS.length : 0;

  function pick(tab: Tab) {
    const feature = TAB_FEATURES[tab];
    if (!feature || tab === current) onPick(tab);
    else guard(feature, () => onPick(tab));
  }

  useEffect(() => {
    if (!focused) return;
    const to = TABS.indexOf(current);
    if (reduceMotion) position.set(to);
    else {
      position.set(TABS.indexOf(shownTab));
      position.set(withTiming(to, { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) }));
    }
    shownTab = current;
  }, [focused, current, reduceMotion, position]);

  const pill = useAnimatedStyle(() => ({
    transform: [{ translateX: BAR_PADDING + position.get() * tabWidth + (tabWidth - PILL_WIDTH) / 2 }],
  }));

  function onLayout(event: LayoutChangeEvent) {
    setBarWidth(event.nativeEvent.layout.width);
  }

  /** Where the finger is along the bar, as a tab number (0 is the first tab). */
  function place(x: number) {
    'worklet';
    return clamp((x - LENS_INSET) / tabWidth - 0.5, 0, TABS.length - 1);
  }

  const drag = Gesture.Pan()
    .enabled(floating && tabWidth > 0)
    // Only once the finger has really moved sideways, so tapping a tab still just taps it.
    .activeOffsetX([-8, 8])
    .failOffsetY([-12, 12])
    .onBegin(() => {
      held.set(withTiming(1, { duration: 120 }));
    })
    .onUpdate((event) => {
      position.set(place(event.x));
      stretch.set(withTiming(clamp(Math.abs(event.velocityX) / 3000, 0, 0.2), { duration: 90 }));
    })
    .onEnd((event) => {
      runOnJS(pick)(TABS[Math.round(place(event.x))]);
    })
    .onFinalize(() => {
      // Back to this screen's own tab: if the one let go over was paid for and turned down,
      // nothing changed, and if it went through, that screen's bar slides over from here.
      position.set(withSpring(TABS.indexOf(current), SETTLE));
      stretch.set(withTiming(0, { duration: 180 }));
      held.set(withTiming(0, { duration: 180 }));
    });

  const lens = useAnimatedStyle(() => ({
    transform: [
      { translateX: LENS_INSET + position.get() * tabWidth },
      { scaleX: 1 + stretch.get() },
      { scaleY: 1 - stretch.get() * 0.5 },
    ],
  }));
  const bar = useAnimatedStyle(() => ({ transform: [{ scale: 1 + held.get() * 0.02 }] }));

  const tabs = TABS.map((tab) => (
    <Pressable
      key={tab}
      accessibilityRole="tab"
      accessibilityState={{ selected: tab === current }}
      onPress={() => pick(tab)}
      hitSlop={{ top: 8 }}
      style={floating ? styles.glassTab : styles.tab}>
      {({ pressed }) =>
        floating ? (
          <TabFace tab={tab} index={TABS.indexOf(tab)} position={position} pressed={pressed} />
        ) : (
          <View style={[styles.face, { opacity: tab === current ? 1 : pressed ? 0.8 : 0.45, transform: [{ scale: pressed ? 0.92 : 1 }] }]}>
            <View style={styles.icon}>
              <TabIcon tab={tab} />
            </View>
            <Text style={styles.label}>{tab}</Text>
          </View>
        )
      }
    </Pressable>
  ));

  if (!floating) {
    return (
      <View style={[styles.bar, { paddingBottom: bottomInset, backgroundColor: background }]} onLayout={onLayout} accessibilityRole="tablist">
        {tabWidth > 0 && <Animated.View pointerEvents="none" style={[styles.pill, pill]} />}
        {tabs}
        {reminder}
      </View>
    );
  }

  const liquid = isLiquidGlassAvailable();
  const lensStyle = [styles.lens, { width: tabWidth || 0 }, lens];

  return (
    <View style={[styles.floater, { bottom: bottomInset + GLASS_BAR_GAP }]} pointerEvents="box-none">
      <GestureDetector gesture={drag}>
        <Animated.View style={[styles.glassBar, bar]} onLayout={onLayout} accessibilityRole="tablist">
          {liquid ? (
            // One container, so the lens and the bar behave as a single piece of glass:
            // the lens melts back into the bar as it passes over it.
            <GlassContainer spacing={LENS_HEIGHT / 2} style={StyleSheet.absoluteFill} pointerEvents="none">
              <GlassView glassEffectStyle="clear" style={[StyleSheet.absoluteFill, styles.barGlass]} />
              {tabWidth > 0 && (
                <Animated.View style={lensStyle}>
                  <GlassView glassEffectStyle="regular" isInteractive style={[StyleSheet.absoluteFill, styles.lensGlass]} />
                </Animated.View>
              )}
            </GlassContainer>
          ) : (
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <View style={[StyleSheet.absoluteFill, styles.barGlass, styles.frosted]} />
              {tabWidth > 0 && <Animated.View style={[...lensStyle, styles.lensGlass, styles.frostedLens]} />}
            </View>
          )}
          <View style={styles.glassRow} pointerEvents="box-none">
            {tabs}
          </View>
          {reminder}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

type TabFaceProps = {
  tab: Tab;
  index: number;
  position: SharedValue<number>;
  pressed: boolean;
};

/**
 * One tab on the glass bar. It brightens and grows as the lens comes over it, so dragging
 * along the bar lights each tab up in turn rather than waiting for the finger to lift.
 */
function TabFace({ tab, index, position, pressed }: TabFaceProps) {
  const style = useAnimatedStyle(() => {
    const away = Math.min(Math.abs(position.get() - index), 1);
    return { opacity: 1 - away * 0.55, transform: [{ scale: (1 + (1 - away) * 0.08) * (pressed ? 0.94 : 1) }] };
  });

  return (
    <Animated.View style={[styles.face, style]}>
      <View style={styles.icon}>
        <TabIcon tab={tab} />
      </View>
      <Text style={styles.label}>{tab}</Text>
    </Animated.View>
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
  /** Holds the glass bar off the bottom of the screen, clear of the home indicator. */
  floater: {
    position: 'absolute',
    left: GLASS_SIDE,
    right: GLASS_SIDE,
    zIndex: 3,
  },
  glassBar: {
    height: GLASS_BAR_HEIGHT,
    borderRadius: GLASS_BAR_HEIGHT / 2,
    borderCurve: 'continuous',
  },
  barGlass: {
    borderRadius: GLASS_BAR_HEIGHT / 2,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  glassRow: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: LENS_INSET,
  },
  /** The bright pane that slides from tab to tab. */
  lens: {
    position: 'absolute',
    left: 0,
    top: LENS_INSET,
    height: LENS_HEIGHT,
  },
  lensGlass: {
    borderRadius: LENS_HEIGHT / 2,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  /** Without liquid glass: frosted white, with the design's lit top edge. */
  frosted: {
    backgroundColor: 'rgba(28, 28, 32, 0.42)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  frostedLens: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  glassTab: {
    flex: 1,
    justifyContent: 'center',
  },
  face: {
    alignItems: 'center',
    gap: 6,
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
