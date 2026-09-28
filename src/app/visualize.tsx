import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { BrandBar } from '@/components/today/brand-bar';
import { animate, FADE, TOAST } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { COLUMN_WIDTH, CREAM, NextDream, Painting } from '@/components/visualize/painting';
import { BrandFonts } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import type { Dream } from '@/types/dream';
import { nightStreak } from '@/utils/entries';
import { pickPaintings, visualizeIntro } from '@/utils/visualize';

const TOAST_MS = 2200;
/** A column, the gap either side of the divider, and the divider itself. */
const DIVIDER_GAP = 24;
const STEP = COLUMN_WIDTH + DIVIDER_GAP * 2 + 1;
/** The design's 844 pt tall phone: the big gaps shrink on shorter ones. */
const DESIGN_HEIGHT = 844;

/**
 * Visualize ("/visualize"), from the Afterdream Visualize (simple) design: every dream
 * painted so far, side by side, newest first, to swipe back through. Tapping a painting
 * shows it full screen; the last column and "+" go to Today to tell a new one.
 *
 * `?id=<dream id>` adds that dream if it isn't painted yet, paints it, and scrolls to it.
 */
export default function VisualizeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { dreams: loaded, loading, error, reload } = useDreams();

  const [now] = useState(() => new Date());
  // Dreams painted on this screen, until the next reload brings them from the server.
  const [changed, setChanged] = useState<Record<string, Dream>>({});
  const [galleryHeight, setGalleryHeight] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gallery = useRef<ScrollView>(null);
  const scrolledTo = useRef<string | null>(null);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const dreams = useMemo(() => loaded.map((dream) => changed[dream.id] ?? dream), [loaded, changed]);
  const paintings = useMemo(() => pickPaintings(dreams, id), [dreams, id]);
  const streak = useMemo(() => nightStreak(dreams, now), [dreams, now]);

  const tabBarBottom = Math.max(insets.bottom, 8);
  const squeeze = Math.min(1, height / DESIGN_HEIGHT);
  const pictureSize = Math.max(140, Math.min(COLUMN_WIDTH, galleryHeight - 140));

  // Opened for one dream: bring its column into view once it's there.
  const focusIndex = id ? paintings.findIndex((dream) => dream.id === id) : -1;
  useEffect(() => {
    if (focusIndex < 0 || !galleryHeight || scrolledTo.current === id) return;
    scrolledTo.current = id ?? null;
    gallery.current?.scrollTo({ x: focusIndex * STEP, animated: !reduceMotion });
  }, [focusIndex, galleryHeight, id, reduceMotion]);

  function showToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  function change(dreamId: string, update: SetStateAction<Dream | null>) {
    setChanged((current) => {
      const dream = current[dreamId] ?? loaded.find((item) => item.id === dreamId) ?? null;
      const next = typeof update === 'function' ? update(dream) : update;
      return next ? { ...current, [dreamId]: next } : current;
    });
  }

  function openPainting(dream: Dream) {
    router.push({ pathname: '/painting/[id]', params: { id: dream.id } });
  }

  function tellNew() {
    openTab('today', 'visualize');
  }

  function pickTab(tab: Tab) {
    if (!openTab(tab, 'visualize')) showToast(`${tab} is coming soon ✦`);
  }

  const intro = loading && loaded.length === 0 ? null : error && loaded.length === 0 ? error : visualizeIntro(paintings, now);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <BrandBar streak={streak} />

      <Text style={styles.title} accessibilityRole="header">
        visualize
      </Text>

      <View style={[styles.intro, { marginTop: 86 * squeeze }]}>
        <Text style={styles.introTitle}>{error && loaded.length === 0 ? 'couldn’t reach your dreams.' : 'this week'}</Text>
        {intro === null ? (
          <Animated.Text style={[styles.introText, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
            gathering your paintings…
          </Animated.Text>
        ) : (
          <Text style={styles.introText}>{intro}</Text>
        )}
        {error && loaded.length === 0 && (
          <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
            <Text style={styles.retryText}>try again</Text>
          </Pressable>
        )}
      </View>

      <View
        style={[styles.galleryArea, { marginTop: 30 * squeeze, marginBottom: TAB_BAR_HEIGHT + tabBarBottom + 8 }]}
        onLayout={(event) => setGalleryHeight(event.nativeEvent.layout.height)}>
        {galleryHeight > 0 && !(loading && loaded.length === 0) && (
          <ScrollView
            ref={gallery}
            horizontal
            showsHorizontalScrollIndicator={false}
            snapToInterval={STEP}
            decelerationRate="fast"
            contentContainerStyle={styles.gallery}>
            {paintings.map((dream) => (
              <View key={dream.id} style={styles.slot}>
                <Painting
                  dream={dream}
                  height={galleryHeight}
                  size={pictureSize}
                  reduceMotion={reduceMotion}
                  onChange={change}
                  onOpen={openPainting}
                />
                <View style={styles.divider} />
              </View>
            ))}
            <NextDream height={galleryHeight} size={pictureSize} onPress={tellNew} />
          </ScrollView>
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Visualize a new dream"
        onPress={tellNew}
        style={({ pressed }) => [styles.add, { bottom: TAB_BAR_HEIGHT + tabBarBottom + 24 }, pressed && styles.addPressed]}>
        <Svg width={22} height={22} viewBox="0 0 22 22">
          <Path d="M11 3v16M3 11h16" stroke="#111" strokeWidth={2.6} strokeLinecap="round" />
        </Svg>
      </Pressable>

      <View style={styles.tabBar}>
        <TabBar current="visualize" bottomInset={tabBarBottom} onPick={pickTab} />
      </View>

      {toast && (
        <View pointerEvents="none" style={[styles.toastRow, { bottom: TAB_BAR_HEIGHT + tabBarBottom + 100 }]}>
          <Animated.Text
            key={toast.id}
            accessibilityLiveRegion="polite"
            style={[styles.toast, animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' })]}>
            {toast.text}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  title: {
    marginTop: 14,
    paddingHorizontal: 20,
    fontFamily: BrandFonts.light,
    fontSize: 58,
    lineHeight: 60,
    letterSpacing: -2,
    color: '#bdbdbd',
  },
  intro: {
    paddingHorizontal: 20,
    gap: 10,
    alignItems: 'flex-start',
  },
  introTitle: {
    fontFamily: BrandFonts.regular,
    fontSize: 28,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: CREAM,
  },
  introText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: CREAM,
  },
  retry: {
    marginTop: 4,
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    justifyContent: 'center',
    backgroundColor: CREAM,
  },
  retryText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  pressed: {
    opacity: 0.8,
  },
  galleryArea: {
    flex: 1,
  },
  gallery: {
    paddingHorizontal: 20,
  },
  slot: {
    flexDirection: 'row',
  },
  divider: {
    width: 1,
    marginHorizontal: DIVIDER_GAP,
    backgroundColor: CREAM,
    opacity: 0.8,
  },
  add: {
    position: 'absolute',
    right: 20,
    zIndex: 4,
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EDEDED',
    boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
  },
  addPressed: {
    transform: [{ scale: 0.94 }],
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  toastRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 6,
    alignItems: 'center',
  },
  toast: {
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
});
