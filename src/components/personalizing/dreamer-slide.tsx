import { memo, useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import type { DreamerCard } from '@/utils/personalize';

import { animate, EASE_OUT, FADE, SLIDE_IN, useFitScale, WORD_IN } from './motion';

type DreamerSlideProps = {
  card: DreamerCard;
  reduceMotion: boolean;
};

/** Card size in the design. */
const CARD_HEIGHT = 396;
const MOON = 64;
const BEAM = 60;

const MINT = '#A8E0D8';
const CARD = '#F4F7DC';
const DEEP = '#0E2A2C';

const CARD_IN = {
  from: { opacity: 0, transform: [{ perspective: 900 }, { translateY: 60 }, { rotateX: '25deg' }, { scale: 0.9 }] },
  to: { opacity: 1, transform: [{ perspective: 900 }, { translateY: 0 }, { rotateX: '0deg' }, { scale: 1 }] },
};
const TILT = {
  '0%': { transform: [{ rotate: '0deg' }] },
  '50%': { transform: [{ rotate: '1.5deg' }] },
  '100%': { transform: [{ rotate: '0deg' }] },
};
const SCAN = {
  from: { top: -BEAM },
  to: { top: '100%' },
};
const STAMP = {
  from: { opacity: 0, transform: [{ scale: 2 }, { rotate: '-30deg' }] },
  to: { opacity: 0.9, transform: [{ scale: 1 }, { rotate: '-12deg' }] },
};
const PHASE_EASE = cubicBezier(0.6, 0, 0.2, 1);
const STAMP_SPRING = cubicBezier(0.3, 1.6, 0.5, 1);

const TITLE_WORDS = [
  { word: 'meet', delay: 100 },
  { word: 'your', delay: 200 },
  { word: 'dream', delay: 350, accent: true },
  { word: 'self.', delay: 450, accent: true },
];

/** Slide 3: "meet your dream self." A "dreamer id" card built from their onboarding answers. */
export const DreamerSlide = memo(function DreamerSlide({ card, reduceMotion }: DreamerSlideProps) {
  const { scale, onLayout } = useFitScale(CARD_HEIGHT);

  // A dark disc slides across the little moon to show their birth moon's phase (like the
  // birthday screen). Without a birthday it stops at the design's waxing crescent.
  const cycle = card.moon?.cycle;
  const shadowX = cycle === undefined ? 0.62 * MOON : cycle < 0.5 ? -cycle * 2 * MOON : (1 - cycle) * 2 * MOON;
  const phase = useMemo(
    () => ({ from: { transform: [{ translateX: 0 }] }, to: { transform: [{ translateX: shadowX }] } }),
    [shadowX]
  );

  return (
    <View style={styles.slide}>
      <View style={styles.intro}>
        <View accessible accessibilityRole="header" accessibilityLabel="meet your dream self." style={styles.title}>
          {TITLE_WORDS.map(({ word, delay, accent }) => (
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
        <Animated.Text
          style={[styles.subtitle, animate(reduceMotion, { animationName: FADE, animationDuration: 800, animationDelay: 700, animationTimingFunction: 'ease' })]}>
          built from everything you told us.
        </Animated.Text>
      </View>

      <View style={styles.cardArea} onLayout={onLayout}>
        <View style={[styles.cardSpot, { transform: [{ scale }] }]}>
          <Animated.View
            style={[styles.cardBehind, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 500, animationTimingFunction: 'ease' })]}
          />
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              animate(reduceMotion, { animationName: CARD_IN, animationDuration: 1000, animationDelay: 400, animationTimingFunction: EASE_OUT }),
            ]}>
            <Animated.View
              style={[
                styles.card,
                animate(reduceMotion, {
                  animationName: TILT,
                  animationDuration: 6000,
                  animationDelay: 1600,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                }),
              ]}>
              <View style={styles.cardHead}>
                <Text style={styles.cardKicker}>DREAMER ID</Text>
                {card.number && <Text style={styles.cardNumber}>{card.number}</Text>}
              </View>

              <View style={styles.who}>
                <View style={styles.moon} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  <View style={styles.moonRing} />
                  <Animated.View
                    style={[
                      styles.moonShadow,
                      reduceMotion
                        ? { transform: [{ translateX: shadowX }] }
                        : animate(reduceMotion, { animationName: phase, animationDuration: 1400, animationDelay: 900, animationTimingFunction: PHASE_EASE }),
                    ]}
                  />
                </View>
                <View style={styles.whoText}>
                  <Animated.Text
                    numberOfLines={1}
                    adjustsFontSizeToFit
                    minimumFontScale={0.5}
                    style={[styles.name, animate(reduceMotion, { animationName: WORD_IN, animationDuration: 600, animationDelay: 900, animationTimingFunction: 'ease' })]}>
                    {card.name}
                  </Animated.Text>
                  <Animated.Text
                    style={[styles.born, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 1100, animationTimingFunction: 'ease' })]}>
                    {card.moon ? `born under ${card.moon.name}` : 'a dreamer in the making'}
                  </Animated.Text>
                </View>
              </View>

              <View style={styles.divider} />

              {card.traits.map((trait, k) => (
                <Animated.View
                  key={trait.label}
                  accessible
                  accessibilityLabel={`${trait.label}: ${trait.value}`}
                  style={[
                    styles.trait,
                    animate(reduceMotion, { animationName: SLIDE_IN, animationDuration: 500, animationDelay: 1400 + k * 300, animationTimingFunction: 'ease' }),
                  ]}>
                  <Text style={styles.traitLabel}>{trait.label}</Text>
                  <Text style={[styles.traitValue, { backgroundColor: trait.color }]} numberOfLines={1}>
                    {trait.value}
                  </Text>
                </Animated.View>
              ))}

              {/* A light sweeps down the card twice, as if it's being scanned. */}
              {!reduceMotion && (
                <Animated.View
                  pointerEvents="none"
                  style={[
                    styles.beam,
                    animate(reduceMotion, {
                      animationName: SCAN,
                      animationDuration: 1600,
                      animationDelay: 800,
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 2,
                    }),
                  ]}>
                  <Svg width="100%" height={BEAM}>
                    <Defs>
                      <LinearGradient id="scanBeam" x1="0" y1="0" x2="0" y2="1">
                        <Stop offset="0" stopColor={MINT} stopOpacity={0} />
                        <Stop offset="0.5" stopColor={MINT} stopOpacity={0.7} />
                        <Stop offset="1" stopColor={MINT} stopOpacity={0} />
                      </LinearGradient>
                    </Defs>
                    <Rect width="100%" height={BEAM} fill="url(#scanBeam)" />
                  </Svg>
                </Animated.View>
              )}

              <Animated.View
                style={[
                  styles.stamp,
                  reduceMotion
                    ? styles.stampStill
                    : animate(reduceMotion, { animationName: STAMP, animationDuration: 500, animationDelay: 3100, animationTimingFunction: STAMP_SPRING }),
                ]}>
                <Text style={styles.stampText}>{'READY\nTO DREAM'}</Text>
              </Animated.View>
            </Animated.View>
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
  intro: {
    gap: 12,
  },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.2,
    color: NightColors.text,
  },
  titleAccent: {
    color: MINT,
  },
  subtitle: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  cardArea: {
    flex: 1,
    justifyContent: 'center',
  },
  cardSpot: {
    height: CARD_HEIGHT,
    marginHorizontal: 8,
  },
  cardBehind: {
    ...StyleSheet.absoluteFill,
    borderRadius: 32,
    backgroundColor: MINT,
    transform: [{ rotate: '-6deg' }, { translateY: 10 }],
  },
  card: {
    flex: 1,
    overflow: 'hidden',
    padding: 24,
    borderRadius: 32,
    backgroundColor: CARD,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardKicker: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 2,
    color: DEEP,
  },
  cardNumber: {
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: 'rgba(14, 42, 44, 0.5)',
  },
  who: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginTop: 22,
  },
  moon: {
    width: MOON,
    height: MOON,
    borderRadius: MOON / 2,
    overflow: 'hidden',
    backgroundColor: BrandColors.lime,
  },
  moonRing: {
    ...StyleSheet.absoluteFill,
    borderRadius: MOON / 2,
    borderWidth: 1.5,
    borderColor: DEEP,
  },
  moonShadow: {
    ...StyleSheet.absoluteFill,
    borderRadius: MOON / 2,
    backgroundColor: DEEP,
  },
  whoText: {
    flex: 1,
    minWidth: 0,
    gap: 6,
  },
  name: {
    fontFamily: BrandFonts.semibold,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.2,
    color: DEEP,
  },
  born: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(14, 42, 44, 0.6)',
  },
  divider: {
    height: 1,
    marginTop: 22,
    marginBottom: 6,
    backgroundColor: 'rgba(14, 42, 44, 0.15)',
  },
  trait: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(14, 42, 44, 0.08)',
  },
  traitLabel: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(14, 42, 44, 0.55)',
  },
  traitValue: {
    flexShrink: 1,
    overflow: 'hidden',
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 14,
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    lineHeight: 16,
    color: DEEP,
  },
  beam: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -BEAM,
    height: BEAM,
  },
  stamp: {
    alignSelf: 'flex-end',
    marginTop: 'auto',
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 2,
    borderColor: DEEP,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampStill: {
    opacity: 0.9,
    transform: [{ rotate: '-12deg' }],
  },
  stampText: {
    textAlign: 'center',
    fontFamily: BrandFonts.semibold,
    fontSize: 10,
    lineHeight: 11.5,
    letterSpacing: 1,
    color: DEEP,
  },
});
