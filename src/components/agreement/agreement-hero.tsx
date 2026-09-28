import { useEffect } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BrandColors, NightColors } from '@/constants/theme';
import { useEntrance, WelcomeEasing } from '@/components/welcome/motion';

type AgreementHeroProps = {
  /** 1 = the design's size (390 × 844 phone). Smaller on short screens. */
  scale: number;
  reduceMotion: boolean;
};

const LOGO_SOURCE = require('@/assets/images/afterdream-logo.png');

/** Design sizes (pt at scale 1). */
const LOGO = 170;
const WIDTH = 260;
const LOGO_WINDOW = 190;
const LINE_WIDTH = 280;
const LINE_HEIGHT = 3;
const REFLECTION_WINDOW = 120;

/** Total height of the hero at scale 1, so the screen can place things below it. */
export const AGREEMENT_HERO_HEIGHT = LOGO_WINDOW + LINE_HEIGHT + REFLECTION_WINDOW;

/**
 * The lime logo rises out of a lime line like a reflection on still water:
 * the line draws out, the logo emerges above it and bobs, and a blurred,
 * fading mirror image ripples below.
 */
export function AgreementHero({ scale, reduceMotion }: AgreementHeroProps) {
  const lineIn = useEntrance(200, 900, WelcomeEasing.line, reduceMotion);
  const logoIn = useEntrance(900, 1300, WelcomeEasing.rise, reduceMotion);
  const reflectionIn = useEntrance(1800, 1000, WelcomeEasing.ease, reduceMotion);

  const bob = useSharedValue(0);
  const ripple = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    const ease = WelcomeEasing.easeInOut;
    // Up and back every 6 s.
    bob.set(withDelay(2400, withRepeat(withTiming(1, { duration: 3000, easing: ease }), -1, true)));
    // Lean right, lean left, settle: 3.2 s per ripple.
    ripple.set(
      withDelay(
        1800,
        withRepeat(
          withSequence(
            withTiming(1, { duration: 800, easing: ease }),
            withTiming(-1, { duration: 1600, easing: ease }),
            withTiming(0, { duration: 800, easing: ease })
          ),
          -1,
          false
        )
      )
    );
  }, [reduceMotion, bob, ripple]);

  const logo = LOGO * scale;
  const width = WIDTH * scale;

  const logoStyle = useAnimatedStyle(() => ({
    // Starts just below the line (105% of its height) and slides up into view.
    transform: [{ translateY: logo * 1.05 * (1 - logoIn.get()) }, { translateY: -6 * bob.get() }],
  }));
  const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: lineIn.get() }] }));
  const reflectionStyle = useAnimatedStyle(() => ({ opacity: reflectionIn.get() }));
  const rippleStyle = useAnimatedStyle(() => ({
    transform: [{ skewX: `${3 * ripple.get()}deg` }, { scaleX: 1 + 0.03 * ripple.get() }],
  }));

  return (
    <View style={styles.container} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[styles.logoWindow, { width, height: LOGO_WINDOW * scale }]}>
        <Animated.View style={logoStyle}>
          <Image source={LOGO_SOURCE} style={[styles.logo, { width: logo, height: logo }]} resizeMode="contain" />
        </Animated.View>
      </View>

      <Animated.View style={[styles.line, { width: LINE_WIDTH * scale }, lineStyle]} />

      <Animated.View style={[styles.reflectionWindow, { width, height: REFLECTION_WINDOW * scale }, reflectionStyle]}>
        <View style={styles.mirror}>
          <Animated.View style={rippleStyle}>
            <Image
              source={LOGO_SOURCE}
              style={[styles.logo, { width: logo, height: logo }]}
              resizeMode="contain"
              blurRadius={1.5}
            />
          </Animated.View>
        </View>
        {/* Fades the reflection into the black: clear at the top, gone by 75% of the way down. */}
        <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
          <Defs>
            <LinearGradient id="reflectionFade" x1="0" y1="0" x2="0" y2="1">
              <Stop offset="0" stopColor={NightColors.background} stopOpacity={0} />
              <Stop offset="0.75" stopColor={NightColors.background} stopOpacity={1} />
            </LinearGradient>
          </Defs>
          <Rect width="100%" height="100%" fill="url(#reflectionFade)" />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  logoWindow: {
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  logo: {
    tintColor: BrandColors.lime,
  },
  line: {
    height: LINE_HEIGHT,
    borderRadius: 2,
    backgroundColor: BrandColors.lime,
  },
  reflectionWindow: {
    overflow: 'hidden',
    alignItems: 'center',
  },
  mirror: {
    opacity: 0.28,
    transform: [{ scaleY: -1 }],
  },
});
