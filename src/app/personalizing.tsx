import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { animate, POP, SPRING } from '@/components/personalizing/motion';
import { PatternsSlide } from '@/components/personalizing/patterns-slide';
import { WaysSlide } from '@/components/personalizing/ways-slide';
import { WelcomeSlide } from '@/components/personalizing/welcome-slide';
import { loadProfileName } from '@/lib/profile';
import {
  dreamerName,
  loadingPercent,
  loadingStatus,
  PERSONALIZING_BACKGROUND,
  SLIDE_COUNT,
  slideAt,
  slideProgress,
  TOTAL_MS,
} from '@/utils/personalize';

/** How often the bars and the percent update. */
const TICK_MS = 60;
/** Time to enjoy "sweet dreams, …" before Home. */
const DONE_PAUSE_MS = 1400;
const BUTTON_HEIGHT = 58;
const TRACK = 'rgba(255, 255, 255, 0.16)';

/**
 * "/personalizing", shown once onboarding is finished (or skipped), from the Afterdream
 * Personalizing design. Story-style bars run along the top while three slides play: a
 * welcome, the ways to catch a dream, and the patterns they'll unlock. A loading bar
 * fills underneath, then turns into the button that takes them into Home.
 */
export default function PersonalizingScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Read once: the name doesn't change while this screen is up.
  const name = useMemo(() => dreamerName(loadProfileName()), []);
  const [elapsed, setElapsed] = useState(0);
  const [entered, setEntered] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const start = Date.now();
    const timer = setInterval(() => {
      const now = Math.min(Date.now() - start, TOTAL_MS);
      setElapsed(now);
      if (now >= TOTAL_MS) clearInterval(timer);
    }, TICK_MS);
    return () => {
      clearInterval(timer);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  // Onboarding is behind them: Android's back button does nothing here.
  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
      return () => sub.remove();
    }, [])
  );

  const slide = slideAt(elapsed);
  const ready = elapsed >= TOTAL_MS;
  const percent = loadingPercent(elapsed);
  const barMotion = {
    transitionProperty: 'transform',
    transitionDuration: reduceMotion ? 0 : 150,
    transitionTimingFunction: 'linear',
  } as const;

  function handleEnter() {
    if (entered) return;
    setEntered(true);
    leaveTimer.current = setTimeout(enterHome, DONE_PAUSE_MS);
  }

  // The design's button sits 40 pt from the bottom of a phone with a 34 pt home indicator.
  const footerBottom = Math.max(insets.bottom + 6, 24);
  const slideFrame = {
    paddingTop: insets.top + 56,
    paddingBottom: footerBottom + BUTTON_HEIGHT + 24,
  };

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.segments, { top: insets.top + 8 }]} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {Array.from({ length: SLIDE_COUNT }, (_, k) => (
          <View key={k} style={styles.segment}>
            <Animated.View style={[styles.segmentFill, { transform: [{ scaleX: slideProgress(elapsed, k) }] }, barMotion]} />
          </View>
        ))}
      </View>

      {/* Each slide mounts fresh when it comes up, so its entrance plays. */}
      <View style={[styles.slides, slideFrame]}>
        {slide === 0 && <WelcomeSlide name={name} reduceMotion={reduceMotion} />}
        {slide === 1 && <WaysSlide reduceMotion={reduceMotion} />}
        {slide === 2 && <PatternsSlide reduceMotion={reduceMotion} />}
      </View>

      <View style={[styles.footer, { bottom: footerBottom }]}>
        {ready ? (
          <Animated.View style={animate(reduceMotion, { animationName: POP, animationDuration: 500, animationTimingFunction: SPRING })}>
            <Pressable accessibilityRole="button" onPress={handleEnter} disabled={entered}>
              {({ pressed }) => (
                <Animated.View
                  style={[
                    styles.enter,
                    {
                      transform: [{ scale: pressed ? 0.97 : 1 }],
                      transitionProperty: 'transform',
                      transitionDuration: reduceMotion ? 0 : 200,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  <Text style={styles.enterText}>{entered ? `sweet dreams, ${name} ✦` : 'enter afterdream →'}</Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ) : (
          <View
            style={styles.loading}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel={loadingStatus(elapsed)}
            accessibilityValue={{ min: 0, max: 100, now: percent }}>
            <Animated.View style={[styles.loadingFill, { transform: [{ scaleX: percent / 100 }] }, barMotion]} />
            <Text style={styles.loadingText}>{loadingStatus(elapsed)}</Text>
            <Text style={styles.loadingPercent}>{percent}%</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** Clear onboarding off the stack so "back" from Home doesn't return to it. */
function enterHome() {
  if (router.canDismiss()) router.dismissAll();
  router.replace('/home');
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: PERSONALIZING_BACKGROUND,
  },
  segments: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 3,
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: TRACK,
  },
  segmentFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: 2,
    backgroundColor: NightColors.text,
    transformOrigin: 'left',
  },
  slides: {
    ...StyleSheet.absoluteFill,
  },
  footer: {
    position: 'absolute',
    left: 20,
    right: 20,
    height: BUTTON_HEIGHT,
  },
  loading: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    overflow: 'hidden',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
    backgroundColor: TRACK,
  },
  loadingFill: {
    ...StyleSheet.absoluteFill,
    borderRadius: BUTTON_HEIGHT / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transformOrigin: 'left',
  },
  loadingText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    color: NightColors.text,
  },
  loadingPercent: {
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    fontVariant: ['tabular-nums'],
    color: NightColors.text,
  },
  enter: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  enterText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 17,
    color: BrandColors.ink,
  },
});
