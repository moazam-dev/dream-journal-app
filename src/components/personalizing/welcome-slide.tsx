import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';

import { animate, FADE, POP, SPIN, useFitScale, WORD_IN } from './motion';

type WelcomeSlideProps = {
  name: string;
  reduceMotion: boolean;
};

const ORBIT = 300;
const MOON = 170;
/** Orbit, gap and tagline together, at full size. */
const ART_HEIGHT = ORBIT + 40 + 22;

const FLOAT = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -10 }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const TWINKLE = {
  '0%': { opacity: 0.5, transform: [{ scale: 0.6 }, { rotate: '0deg' }] },
  '50%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '45deg' }] },
  '100%': { opacity: 0.5, transform: [{ scale: 0.6 }, { rotate: '0deg' }] },
};
const MOON_SPRING = cubicBezier(0.3, 1.4, 0.5, 1);

/** Little planets riding the orbit, from the design. */
const PLANETS = [
  { style: { left: ORBIT / 2 - 9, top: -9 }, size: 18, color: '#F4B8E4', delay: 1000 },
  { style: { left: 14, bottom: 50 }, size: 12, color: '#A8D8F0', delay: 1150 },
  { style: { right: 20, bottom: 40 }, size: 14, color: '#F2B8A0', delay: 1300 },
];
const CRATERS = [
  { left: 52, top: 44, size: 30, opacity: 0.35 },
  { left: 100, top: 96, size: 20, opacity: 0.3 },
  { left: 44, top: 110, size: 14, opacity: 0.28 },
];
const SPARKLES = [
  { style: { right: 6, top: 30 }, size: 30, color: BrandColors.lime, duration: 2400, delay: 0 },
  { style: { left: 10, top: 70 }, size: 18, color: '#F4B8E4', duration: 2800, delay: 600 },
  { style: { left: 60, bottom: 0 }, size: 22, color: BrandColors.lime, duration: 2200, delay: 1100 },
];

/** Slide 1: "welcome to afterdream, {name}!" over a floating lime moon with planets circling it. */
export const WelcomeSlide = memo(function WelcomeSlide({ name, reduceMotion }: WelcomeSlideProps) {
  const { scale, onLayout } = useFitScale(ART_HEIGHT);
  const words = [
    { word: 'welcome', delay: 200 },
    { word: 'to', delay: 320 },
    { word: 'afterdream,', delay: 440, accent: true },
    { word: `${name}!`, delay: 600 },
  ];

  return (
    <View style={styles.slide}>
      <View accessible accessibilityRole="header" accessibilityLabel={`welcome to afterdream, ${name}!`} style={styles.title}>
        {words.map(({ word, delay, accent }) => (
          <Animated.Text
            key={word}
            style={[
              styles.titleText,
              accent && styles.titleAccent,
              animate(reduceMotion, { animationName: WORD_IN, animationDuration: 700, animationDelay: delay, animationTimingFunction: 'ease' }),
            ]}>
            {word}
          </Animated.Text>
        ))}
      </View>

      <View style={styles.art} onLayout={onLayout}>
        <View style={[styles.artInner, { transform: [{ scale }] }]}>
          <View style={styles.orbit} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
            <Animated.View
              style={[styles.ring, animate(reduceMotion, { animationName: FADE, animationDuration: 1000, animationDelay: 600, animationTimingFunction: 'ease' })]}
            />
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                animate(reduceMotion, { animationName: SPIN, animationDuration: 14000, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }),
              ]}>
              {PLANETS.map((p) => (
                <Animated.View
                  key={p.color}
                  style={[
                    styles.planet,
                    p.style,
                    { width: p.size, height: p.size, borderRadius: p.size / 2, backgroundColor: p.color },
                    animate(reduceMotion, { animationName: POP, animationDuration: 600, animationDelay: p.delay, animationTimingFunction: 'ease' }),
                  ]}
                />
              ))}
            </Animated.View>

            <Animated.View
              style={[
                styles.moonSpot,
                animate(reduceMotion, { animationName: POP, animationDuration: 900, animationDelay: 500, animationTimingFunction: MOON_SPRING }),
              ]}>
              <Animated.View
                style={[
                  styles.moonGlow,
                  animate(reduceMotion, {
                    animationName: FLOAT,
                    animationDuration: 5000,
                    animationDelay: 1400,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                  }),
                ]}>
                <View style={styles.moon}>
                  {CRATERS.map((c) => (
                    <View
                      key={c.left}
                      style={[
                        styles.crater,
                        { left: c.left, top: c.top, width: c.size, height: c.size, borderRadius: c.size / 2, backgroundColor: `rgba(160, 170, 80, ${c.opacity})` },
                      ]}
                    />
                  ))}
                </View>
              </Animated.View>
            </Animated.View>

            {SPARKLES.map((s) => (
              <Animated.Text
                key={s.delay}
                style={[
                  styles.sparkle,
                  s.style,
                  { fontSize: s.size, lineHeight: s.size * 1.2, color: s.color },
                  animate(reduceMotion, {
                    animationName: TWINKLE,
                    animationDuration: s.duration,
                    animationDelay: s.delay,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                  }),
                ]}>
                ✦
              </Animated.Text>
            ))}
          </View>

          <Animated.View style={animate(reduceMotion, { animationName: FADE, animationDuration: 800, animationDelay: 1200, animationTimingFunction: 'ease' })}>
            <Text style={styles.tagline}>a softer place for your nights.</Text>
          </Animated.View>
        </View>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.3,
    color: NightColors.text,
  },
  titleAccent: {
    color: BrandColors.lime,
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  artInner: {
    alignItems: 'center',
    gap: 40,
  },
  orbit: {
    width: ORBIT,
    height: ORBIT,
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: ORBIT / 2,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255, 255, 255, 0.14)',
  },
  planet: {
    position: 'absolute',
  },
  moonSpot: {
    position: 'absolute',
    left: (ORBIT - MOON) / 2,
    top: (ORBIT - MOON) / 2,
    width: MOON,
    height: MOON,
  },
  // The halo sits outside the clipped moon so it isn't cut off.
  moonGlow: {
    width: MOON,
    height: MOON,
    borderRadius: MOON / 2,
    boxShadow: '0 0 90px 10px rgba(226, 235, 152, 0.28)',
  },
  moon: {
    width: MOON,
    height: MOON,
    borderRadius: MOON / 2,
    overflow: 'hidden',
    backgroundColor: BrandColors.lime,
  },
  crater: {
    position: 'absolute',
  },
  sparkle: {
    position: 'absolute',
    fontFamily: BrandFonts.regular,
  },
  tagline: {
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.7)',
  },
});
