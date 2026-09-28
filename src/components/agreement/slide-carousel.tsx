import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { useEntrance, WelcomeEasing } from '@/components/welcome/motion';

type SlideCarouselProps = {
  /** Time on each slide before moving to the next. */
  intervalMs?: number;
  reduceMotion: boolean;
};

/** Each slide: plain white lead-in, then the lime part. */
const SLIDES: [lead: string, accent: string][] = [
  ['afterdream to', 'catch dreams before they fade'],
  ['speak it half-asleep,', 'we write it down'],
  ['look back and', 'find what your nights repeat'],
];

/** Gap between the slide text and the dots (pt). */
const DOTS_GAP = 36;

/**
 * Three short lines about the app that cross-fade in turn, with dots underneath.
 * Tapping a dot jumps to that slide and restarts the timer.
 */
export function SlideCarousel({ intervalMs = 3500, reduceMotion }: SlideCarouselProps) {
  const [index, setIndex] = useState(0);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const start = useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => setIndex((i) => (i + 1) % SLIDES.length), intervalMs);
  }, [intervalMs]);

  useEffect(() => {
    start();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [start]);

  function goTo(k: number) {
    setIndex(k);
    start();
  }

  const slidesIn = useEntrance(500, 800, WelcomeEasing.ease, reduceMotion);
  const dotsIn = useEntrance(800, 600, WelcomeEasing.ease, reduceMotion);

  const slidesStyle = useAnimatedStyle(() => ({
    opacity: slidesIn.get(),
    transform: [{ translateY: 16 * (1 - slidesIn.get()) }],
  }));
  const dotsStyle = useAnimatedStyle(() => ({ opacity: dotsIn.get() }));

  // Reanimated CSS transitions: changing the style animates it, like the design's CSS.
  const motion = reduceMotion ? 0 : 1;

  return (
    <View>
      <Animated.View style={[styles.slides, slidesStyle]}>
        {SLIDES.map(([lead, accent], k) => {
          const active = k === index;
          return (
            <Animated.View
              key={lead}
              accessibilityElementsHidden={!active}
              importantForAccessibility={active ? 'auto' : 'no-hide-descendants'}
              style={[
                styles.slide,
                {
                  opacity: active ? 1 : 0,
                  // Earlier slides leave upwards, later ones wait below.
                  transform: [{ translateY: active ? 0 : k < index ? -14 : 14 }],
                  transitionProperty: ['opacity', 'transform'],
                  transitionDuration: 600 * motion,
                  transitionTimingFunction: 'ease',
                },
              ]}>
              <Text style={styles.slideText}>
                {lead} <Text style={styles.accent}>{accent}</Text>
              </Text>
            </Animated.View>
          );
        })}
      </Animated.View>

      <Animated.View style={[styles.dots, dotsStyle]}>
        {SLIDES.map(([lead], k) => {
          const active = k === index;
          return (
            <Pressable
              key={lead}
              accessibilityRole="button"
              accessibilityLabel={`Slide ${k + 1} of ${SLIDES.length}`}
              accessibilityState={{ selected: active }}
              hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
              onPress={() => goTo(k)}>
              <Animated.View
                style={[
                  styles.dot,
                  {
                    width: active ? 28 : 8,
                    backgroundColor: active ? NightColors.text : NightColors.dot,
                    transitionProperty: ['width', 'backgroundColor'],
                    transitionDuration: 400 * motion,
                    transitionTimingFunction: 'ease',
                  },
                ]}
              />
            </Pressable>
          );
        })}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  slides: {
    height: 100,
  },
  slide: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  slideText: {
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.2,
    color: NightColors.text,
  },
  accent: {
    color: BrandColors.lime,
  },
  dots: {
    marginTop: DOTS_GAP,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
});
