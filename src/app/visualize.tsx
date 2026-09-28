import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState, type SetStateAction } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandBar } from '@/components/today/brand-bar';
import { animate, FADE, TOAST } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { AddMenu } from '@/components/visualize/add-menu';
import { OldDreamSheet } from '@/components/visualize/old-dream-sheet';
import { COLUMN_WIDTH, CREAM, NextDream, Painting } from '@/components/visualize/painting';
import { BrandFonts } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { analyzeDream } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';
import { currentStreak } from '@/utils/garden';
import { pickPaintings, unpaintedDreams, visualizeIntro } from '@/utils/visualize';

const TOAST_MS = 2200;
/** A column, the gap either side of the divider, and the divider itself. */
const DIVIDER_GAP = 24;
const STEP = COLUMN_WIDTH + DIVIDER_GAP * 2 + 1;
/** How far the divider runs on below its picture. */
const DIVIDER_TAIL = 20;
/** The design's 844 pt tall phone: the big gaps shrink on shorter ones. */
const DESIGN_HEIGHT = 844;

/**
 * Visualize ("/visualize"), from the Afterdream Visualize (simple) design: every dream
 * painted so far, side by side, newest first, to swipe back through. Tapping a painting
 * shows it full screen; the last column goes to Today to tell a new one. "+" offers both:
 * yap a new dream on Today, or pick an old dream that isn't painted yet and paint it here.
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
  const [menuOpen, setMenuOpen] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
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
  const streak = useMemo(() => currentStreak(dreams, now), [dreams, now]);
  const oldDreams = useMemo(() => unpaintedDreams(dreams), [dreams]);

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

  const toggleMenu = useCallback(() => setMenuOpen((open) => !open), []);
  const closePicker = useCallback(() => setPickerOpen(false), []);

  function yap() {
    setMenuOpen(false);
    tellNew();
  }

  function chooseOldDream() {
    setMenuOpen(false);
    setPickerOpen(true);
  }

  /** Paints a dream from the list here: reads it first if needed, since the picture comes from the reading. */
  async function visualizeOld(dream: Dream) {
    setPickerOpen(false);
    if (dream.analysis_status !== 'completed') {
      showToast('reading it first…');
      try {
        change(dream.id, await analyzeDream(dream.id));
      } catch (err) {
        console.warn('Could not read the dream', getErrorMessage(err));
        showToast('couldn’t read it — try again');
        return;
      }
    }
    // A picture that failed before gets another go.
    if (dream.image_status === 'failed') change(dream.id, (current) => (current ? { ...current, image_status: 'pending' } : current));
    router.setParams({ id: dream.id });
  }

  function pickTab(tab: Tab) {
    if (!openTab(tab, 'visualize')) showToast(`${tab} is coming soon ✦`);
  }

  const intro = loading && loaded.length === 0 ? null : error && loaded.length === 0 ? error : visualizeIntro(paintings, now);

  return (
    <View style={[styles.screen, { paddingTop: insets.top }]}>
      <StatusBar style="light" />
      <BrandBar title="visualize" streak={streak} />

      <View style={[styles.intro, { marginTop: 48 * squeeze }]}>
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
                <View style={styles.tail}>
                  <Painting dream={dream} size={pictureSize} reduceMotion={reduceMotion} onChange={change} onOpen={openPainting} />
                </View>
                <View style={styles.divider} />
              </View>
            ))}
            <NextDream size={pictureSize} onPress={tellNew} />
          </ScrollView>
        )}
      </View>

      <View style={styles.tabBar}>
        <TabBar current="visualize" bottomInset={tabBarBottom} onPick={pickTab} />
      </View>

      <AddMenu
        open={menuOpen}
        bottom={TAB_BAR_HEIGHT + tabBarBottom + 24}
        reduceMotion={reduceMotion}
        onToggle={toggleMenu}
        onYap={yap}
        onOldDream={chooseOldDream}
      />

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

      <OldDreamSheet
        dreams={oldDreams}
        open={pickerOpen}
        maxListHeight={height * 0.5}
        bottomInset={insets.bottom}
        reduceMotion={reduceMotion}
        onClose={closePicker}
        onPick={visualizeOld}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
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
  // As tall as its painting (plus the tail), so the divider stops just below the picture.
  slot: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  tail: {
    paddingBottom: DIVIDER_TAIL,
  },
  divider: {
    width: 1,
    marginHorizontal: DIVIDER_GAP,
    backgroundColor: CREAM,
    opacity: 0.8,
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
