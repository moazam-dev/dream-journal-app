import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BackHandler, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts } from '@/constants/theme';
import { DreamerSlide } from '@/components/personalizing/dreamer-slide';
import { animate, POP, SPRING } from '@/components/personalizing/motion';
import { WaysSlide } from '@/components/personalizing/ways-slide';
import { WelcomeSlide } from '@/components/personalizing/welcome-slide';
import { loadProfileAnswers } from '@/lib/profile';
import { dreamerCard, loadingStatus, SLIDE_BACKGROUNDS, SLIDE_COUNT, slideAt, TOTAL_MS } from '@/utils/personalize';

/** How often the loading bar and its "..." update. */
const TICK_MS = 120;
/** Time to enjoy "sweet dreams, …" before Home. */
const DONE_PAUSE_MS = 1400;
/** Height of the slide dots, the button and the space between them. */
const FOOTER_HEIGHT = 8 + 34 + 58;

/**
 * "/personalizing", shown once onboarding is finished (or skipped), from the Afterdream
 * Personalizing design. While a loading bar fills, three slides play: a welcome, the ways
 * to catch a dream, and a "dreamer id" card built from their answers. Then they enter Home.
 */
export default function PersonalizingScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Read once: the answers don't change while this screen is up.
  const card = useMemo(() => dreamerCard(loadProfileAnswers()), []);
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
  const progress = elapsed / TOTAL_MS;

  function handleEnter() {
    if (entered) return;
    setEntered(true);
    leaveTimer.current = setTimeout(enterHome, DONE_PAUSE_MS);
  }

  // The design's button sits 40 pt from the bottom of a phone with a 34 pt home indicator.
  const footerBottom = Math.max(insets.bottom + 6, 24);
  const slideFrame = {
    paddingTop: insets.top + 66,
    paddingBottom: footerBottom + FOOTER_HEIGHT + 32,
  };

  return (
    <Animated.View
      style={[
        styles.screen,
        {
          backgroundColor: SLIDE_BACKGROUNDS[slide],
          transitionProperty: 'backgroundColor',
          transitionDuration: reduceMotion ? 0 : 1000,
          transitionTimingFunction: 'ease',
        },
      ]}>
      <StatusBar style="light" />

      {/* Each slide mounts fresh when it comes up, so its entrance plays. */}
      <View style={[styles.slides, slideFrame]}>
        {slide === 0 && <WelcomeSlide name={card.name} reduceMotion={reduceMotion} />}
        {slide === 1 && <WaysSlide reduceMotion={reduceMotion} />}
        {slide === 2 && <DreamerSlide card={card} reduceMotion={reduceMotion} />}
      </View>

      <View style={[styles.footer, { bottom: footerBottom }]}>
        <View style={styles.dots} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
          {Array.from({ length: SLIDE_COUNT }, (_, k) => (
            <Animated.View
              key={k}
              style={[
                styles.dot,
                {
                  width: k === slide ? 26 : 8,
                  backgroundColor: k === slide ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)',
                  transitionProperty: ['width', 'backgroundColor'],
                  transitionDuration: reduceMotion ? 0 : 400,
                  transitionTimingFunction: 'ease',
                },
              ]}
            />
          ))}
        </View>

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
                  <Text style={styles.enterText}>{entered ? `sweet dreams, ${card.name} ✦` : 'enter afterdream →'}</Text>
                </Animated.View>
              )}
            </Pressable>
          </Animated.View>
        ) : (
          <View
            style={styles.loading}
            accessible
            accessibilityRole="progressbar"
            accessibilityLabel="Personalizing afterdream"
            accessibilityValue={{ min: 0, max: 100, now: Math.round(progress * 100) }}>
            <Animated.View
              style={[
                styles.loadingFill,
                {
                  transform: [{ scaleX: progress }],
                  transitionProperty: 'transform',
                  transitionDuration: reduceMotion ? 0 : 250,
                  transitionTimingFunction: 'linear',
                },
              ]}
            />
            <Text style={styles.loadingText}>{loadingStatus(elapsed)}</Text>
          </View>
        )}
      </View>
    </Animated.View>
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
  },
  slides: {
    ...StyleSheet.absoluteFill,
    paddingHorizontal: 28,
  },
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    gap: 34,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  loading: {
    height: 58,
    borderRadius: 29,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.28)',
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingFill: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transformOrigin: 'left',
  },
  loadingText: {
    fontFamily: BrandFonts.medium,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  enter: {
    height: 58,
    borderRadius: 29,
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
