import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { entrance } from '@/components/onboarding/motion';
import { Glow, GLOW_SIZE } from '@/components/welcome-in/glow';

/** The design was drawn for a 390 × 844 pt phone; positions scale from that. */
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
/** Centre of the glow in the design (pt from the top). */
const GLOW_CENTER = 390;

const UP = {
  from: { opacity: 0, transform: [{ translateY: 14 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};

/**
 * "You're in" screen ("/welcome-in"), shown right after "Continue with Apple",
 * from the Afterdream Welcome In design: a big lime glow springs up and breathes,
 * "congrats, you're in." drops into place, and tapping the glow sends out ripples.
 */
export default function WelcomeInScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Scale the glow (and its text) with the phone, so it keeps the design's proportions.
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  const glowCenter = height * (GLOW_CENTER / DESIGN_HEIGHT);

  function animate(style: object) {
    return entrance(reduceMotion, style);
  }

  function handleContinue() {
    // On to onboarding. `replace` (not `push`) so "back" doesn't return here.
    router.replace('/onboarding-name');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View
        style={[
          styles.glow,
          {
            left: width / 2 - GLOW_SIZE / 2,
            top: glowCenter - GLOW_SIZE / 2,
            transform: [{ scale }],
          },
        ]}>
        <Glow reduceMotion={reduceMotion} />
      </View>

      <Animated.View
        style={[
          styles.action,
          { bottom: Math.max(insets.bottom + 6, 24) },
          animate({ animationName: UP, animationDuration: 700, animationDelay: 2900, animationTimingFunction: cubicBezier(0.2, 0.8, 0.2, 1) }),
        ]}>
        <Pressable
          accessibilityRole="button"
          onPress={handleContinue}
          style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>let’s begin</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: NightColors.background,
  },
  glow: {
    position: 'absolute',
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  action: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
  button: {
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NightColors.buttonLight,
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  buttonText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 17,
    color: BrandColors.ink,
  },
});
