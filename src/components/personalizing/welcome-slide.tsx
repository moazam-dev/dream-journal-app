import { memo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';

import { animate, BREATHE, CENTER_IN, EASE_OUT, FADE, morph, SOFT_IN, useFitScale } from './motion';

type WelcomeSlideProps = {
  name: string;
  reduceMotion: boolean;
};

const CARD_WIDTH = 310;
const CARD_HEIGHT = 390;
const BLOB_WIDTH = 160;
const BLOB_HEIGHT = 150;
const BLOB_MORPH = morph(BLOB_WIDTH, BLOB_HEIGHT);
const LILAC = '#C9B8F2';

/** Lilac petals tucked into each corner of the card. */
const PETALS = [
  { left: -30, top: -30, rotate: '-35deg' },
  { right: -30, top: -30, rotate: '35deg' },
  { left: -30, bottom: -30, rotate: '35deg' },
  { right: -30, bottom: -30, rotate: '-35deg' },
];

/** Slide 1: "hi {name}, welcome in." over a breathing lime card with a sleepy blob. */
export const WelcomeSlide = memo(function WelcomeSlide({ name, reduceMotion }: WelcomeSlideProps) {
  const { scale, onLayout } = useFitScale(CARD_HEIGHT);

  return (
    <View style={styles.slide}>
      <View accessible accessibilityRole="header" accessibilityLabel={`hi ${name}, welcome in.`} style={styles.title}>
        <Animated.Text
          style={[styles.hello, animate(reduceMotion, { animationName: FADE, animationDuration: 1200, animationDelay: 300, animationTimingFunction: 'ease' })]}>
          hi {name},
        </Animated.Text>
        <Animated.Text
          style={[styles.welcome, animate(reduceMotion, { animationName: SOFT_IN, animationDuration: 1400, animationDelay: 600, animationTimingFunction: 'ease' })]}>
          welcome in.
        </Animated.Text>
      </View>

      <View style={styles.art} onLayout={onLayout}>
        <Animated.View
          style={[
            { transform: [{ scale }] },
            animate(reduceMotion, { animationName: CENTER_IN, animationDuration: 1200, animationDelay: 1000, animationTimingFunction: EASE_OUT }),
          ]}>
          <Animated.View
            style={[
              styles.card,
              animate(reduceMotion, {
                animationName: BREATHE,
                animationDuration: 7000,
                animationDelay: 2200,
                animationTimingFunction: 'ease-in-out',
                animationIterationCount: 'infinite',
              }),
            ]}>
            {PETALS.map(({ rotate, ...spot }) => (
              <View key={rotate + Object.keys(spot).join()} style={[styles.petal, spot, { transform: [{ rotate }] }]} />
            ))}

            <Animated.View
              importantForAccessibility="no-hide-descendants"
              accessibilityElementsHidden
              style={[
                styles.blob,
                animate(reduceMotion, {
                  animationName: BLOB_MORPH,
                  animationDuration: 10000,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                }),
              ]}
            />
            <View style={styles.eyes} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
              <ClosedEye />
              <ClosedEye />
            </View>

            <View style={styles.caption}>
              <Text style={styles.captionTitle}>breathe out.</Text>
              <Text style={styles.captionText}>this is your quiet corner for the nights.</Text>
            </View>
          </Animated.View>
        </Animated.View>
      </View>
    </View>
  );
});

/** A sleepy "‿": the bottom half of a lime ring. */
function ClosedEye() {
  return (
    <View style={styles.eye}>
      <View style={styles.eyeRing} />
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  title: {
    paddingHorizontal: 28,
    gap: 10,
  },
  hello: {
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 20,
    color: NightColors.text,
  },
  welcome: {
    fontFamily: BrandFonts.medium,
    fontSize: 52,
    lineHeight: 56,
    letterSpacing: -2.4,
    color: NightColors.text,
  },
  art: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 32,
    overflow: 'hidden',
    backgroundColor: BrandColors.lime,
  },
  petal: {
    position: 'absolute',
    width: 110,
    height: 64,
    borderRadius: 32,
    backgroundColor: LILAC,
  },
  blob: {
    position: 'absolute',
    left: (CARD_WIDTH - BLOB_WIDTH) / 2,
    top: 70,
    width: BLOB_WIDTH,
    height: BLOB_HEIGHT,
    borderRadius: BLOB_HEIGHT / 2,
    backgroundColor: BrandColors.ink,
  },
  eyes: {
    position: 'absolute',
    left: (CARD_WIDTH - 80) / 2,
    top: 132,
    width: 80,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  eye: {
    width: 26,
    height: 13,
    overflow: 'hidden',
  },
  eyeRing: {
    position: 'absolute',
    left: 0,
    top: -13,
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 3,
    borderColor: BrandColors.lime,
  },
  caption: {
    position: 'absolute',
    left: 24,
    right: 24,
    top: 250,
    alignItems: 'center',
    gap: 8,
  },
  captionTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 26,
    lineHeight: 28,
    letterSpacing: -0.8,
    textAlign: 'center',
    color: BrandColors.ink,
  },
  captionText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
    color: BrandColors.ink,
  },
});
