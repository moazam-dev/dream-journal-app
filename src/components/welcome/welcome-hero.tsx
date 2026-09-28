import { useEffect } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';

import { useEntrance, WelcomeEasing } from './motion';

type WelcomeHeroProps = {
  word: string;
  reduceMotion: boolean;
};

const LOGO = 112;

/**
 * Logo, "afterdream" and "Dreams fade. Words stay.": the logo and title come into
 * focus, a short line draws out, then the tagline rises with "fade." slowly fading.
 */
export function WelcomeHero({ word, reduceMotion }: WelcomeHeroProps) {
  const logoIn = useEntrance(1200, 1400, WelcomeEasing.focus, reduceMotion);
  const wordIn = useEntrance(1600, 1200, WelcomeEasing.focus, reduceMotion);
  const lineIn = useEntrance(2200, 600, WelcomeEasing.line, reduceMotion);
  const taglineIn = useEntrance(2400, 800, WelcomeEasing.ease, reduceMotion);

  // Endless back-and-forth loops: the logo floating, "fade." dimming.
  const float = useLoop(2600, 2500, reduceMotion);
  const drift = useLoop(3400, 2400, reduceMotion);

  const logoStyle = useFocusStyle(logoIn);
  const wordStyle = useFocusStyle(wordIn);
  const floatStyle = useAnimatedStyle(() => ({ transform: [{ translateY: -6 * float.get() }] }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: lineIn.get() }] }));
  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineIn.get(),
    transform: [{ translateY: 14 * (1 - taglineIn.get()) }],
  }));
  // The design also blurs the word; opacity and a small lift carry the same "fading" feel.
  const driftStyle = useAnimatedStyle(() => ({
    opacity: 1 - 0.82 * drift.get(),
    transform: [{ translateY: -3 * drift.get() }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.logo, logoStyle]} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Animated.View style={floatStyle}>
          <Image source={require('@/assets/images/afterdream-logo.png')} style={styles.logoImage} resizeMode="contain" />
        </Animated.View>
      </Animated.View>

      <Animated.Text style={[styles.word, wordStyle]} accessibilityRole="header">
        {word}
      </Animated.Text>

      <Animated.View style={[styles.line, lineStyle]} />

      {/* Read as one sentence by screen readers. */}
      <Animated.View style={[styles.tagline, taglineStyle]} accessible accessibilityLabel="Dreams fade. Words stay.">
        <Text style={styles.taglineText}>Dreams</Text>
        <Animated.Text style={[styles.taglineText, driftStyle]}>fade.</Animated.Text>
        <Text style={styles.taglineText}>Words stay.</Text>
      </Animated.View>
    </View>
  );
}

/** Comes into focus: fades in while settling from slightly too large. */
function useFocusStyle(progress: SharedValue<number>) {
  return useAnimatedStyle(() => ({
    opacity: progress.get(),
    transform: [{ scale: 1.15 - 0.15 * progress.get() }],
  }));
}

/** 0 → 1 → 0 forever, `halfDuration` ms each way, starting after `delay` ms. */
function useLoop(delay: number, halfDuration: number, reduceMotion: boolean) {
  const phase = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    phase.set(
      withDelay(delay, withRepeat(withTiming(1, { duration: halfDuration, easing: WelcomeEasing.easeInOut }), -1, true))
    );
  }, [reduceMotion, delay, halfDuration, phase]);

  return phase;
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logo: {
    width: LOGO,
    height: LOGO,
  },
  logoImage: {
    width: LOGO,
    height: LOGO,
    tintColor: BrandColors.ink,
  },
  word: {
    // The design uses a 44 px line; the extra 3 px above and below the text is taken off the gaps.
    marginTop: 37,
    fontFamily: BrandFonts.medium,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.8,
    color: BrandColors.ink,
  },
  line: {
    marginTop: 19,
    width: 28,
    height: 1.5,
    backgroundColor: BrandColors.ink,
  },
  tagline: {
    marginTop: 22,
    flexDirection: 'row',
    gap: 6,
  },
  taglineText: {
    fontFamily: BrandFonts.regular,
    fontSize: 17,
    lineHeight: 24,
    color: BrandColors.inkSoft,
  },
});
