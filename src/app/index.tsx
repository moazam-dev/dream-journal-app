import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts } from '@/constants/theme';
import { Ghost, STAR_CENTER } from '@/components/ghost/ghost';
import { SignInSheet } from '@/components/ghost/sign-in-sheet';

/** The design was drawn for a 390 × 844 pt phone; sizes and positions scale from that. */
const DESIGN_WIDTH = 390;
const DESIGN_HEIGHT = 844;
/** Ghost picture size, and where it sits during the intro and once settled (pt). */
const GHOST_SIZE = 240;
const GHOST_TOP_START = 300;
const GHOST_TOP_END = 128;
/** Where the "what did you dream about?" block starts (pt from the top). */
const TITLE_TOP = 420;
/** Radius the lime flood grows to (pt). */
const FLOOD_RADIUS = 1100;

/**
 * The intro plays in steps: 1 the star pops in on black, 2 lime floods out from it,
 * 3 the ghost rises up beside the star, 4 the ghost moves up and the title and sheet come in.
 */
const PHASE_TIMES_MS = [150, 1000, 1500, 3000];
const FINAL_PHASE = 4;
/** How long the little hop lasts after accepting the terms. */
const HOP_MS = 380;

const Ease = {
  flood: cubicBezier(0.65, 0, 0.35, 1),
  move: cubicBezier(0.7, 0, 0.2, 1),
  rise: cubicBezier(0.2, 0.8, 0.2, 1),
};

/**
 * Welcome screen ("/", the first screen), from the Afterdream Welcome Ghost design:
 * a lime star pops in on black, lime floods the screen, the ghost rises beside the star,
 * then "what did you dream about?" and the sign-in sheet come in. The ghost floats,
 * blinks and hops when the terms are accepted, then flies off on "Continue with Apple".
 */
export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [phase, setPhase] = useState(reduceMotion ? FINAL_PHASE : 0);
  const [agreed, setAgreed] = useState(false);
  const [hop, setHop] = useState(false);
  const [signing, setSigning] = useState(false);
  const hopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const timers = PHASE_TIMES_MS.map((ms, i) => setTimeout(() => setPhase(i + 1), ms));
    return () => timers.forEach(clearTimeout);
  }, [reduceMotion]);

  useEffect(() => {
    return () => {
      if (hopTimer.current) clearTimeout(hopTimer.current);
    };
  }, []);

  function handleToggle() {
    const next = !agreed;
    setAgreed(next);
    setHop(next);
    if (hopTimer.current) clearTimeout(hopTimer.current);
    if (next) hopTimer.current = setTimeout(() => setHop(false), HOP_MS);
  }

  function handleContinue() {
    if (!agreed || signing) return;
    setSigning(true);
    // There is no Sign in with Apple yet, so this goes straight to the "You're in" screen.
    // `replace` (not `push`) so "back" doesn't return here.
    router.replace('/welcome-in');
  }

  const motion = reduceMotion ? 0 : 1;
  const done = phase >= FINAL_PHASE;

  // Scale the ghost and positions with the phone, so it keeps the design's proportions.
  const scale = Math.min(width / DESIGN_WIDTH, height / DESIGN_HEIGHT);
  const ghostSize = GHOST_SIZE * scale;
  const ghostLeft = (width - ghostSize) / 2;
  const ghostTopStart = GHOST_TOP_START * scale;
  const ghostTopEnd = GHOST_TOP_END * scale;

  // The lime floods out from the star, where it sits during the intro.
  const floodRadius = FLOOD_RADIUS * scale;
  const floodX = ghostLeft + STAR_CENTER.x * ghostSize;
  const floodY = ghostTopStart + STAR_CENTER.y * ghostSize;

  return (
    <View style={styles.screen}>
      {/* Light status bar on black, dark once the lime floods in. */}
      <StatusBar style={phase >= 2 ? 'dark' : 'light'} />

      <Animated.View
        style={[
          styles.flood,
          {
            left: floodX - floodRadius,
            top: floodY - floodRadius,
            width: floodRadius * 2,
            height: floodRadius * 2,
            borderRadius: floodRadius,
            transform: [{ scale: phase >= 2 ? 1 : 0 }],
            transitionProperty: 'transform',
            transitionDuration: 1100 * motion,
            transitionTimingFunction: Ease.flood,
          },
        ]}
      />

      <Animated.View
        style={[
          styles.ghost,
          {
            left: ghostLeft,
            top: ghostTopEnd,
            transform: [{ translateY: done ? 0 : ghostTopStart - ghostTopEnd }],
            transitionProperty: 'transform',
            transitionDuration: 1000 * motion,
            transitionTimingFunction: Ease.move,
          },
        ]}>
        <Ghost
          size={ghostSize}
          starIn={phase >= 1}
          starDark={phase >= 2}
          bodyIn={phase >= 3}
          agreed={agreed}
          hop={hop}
          leaving={signing}
          reduceMotion={reduceMotion}
        />
      </Animated.View>

      <Animated.View
        style={[
          styles.title,
          {
            top: TITLE_TOP * scale,
            opacity: done ? 1 : 0,
            transform: [{ translateY: done ? 0 : 20 }],
            transitionProperty: ['opacity', 'transform'],
            transitionDuration: 700 * motion,
            transitionDelay: 300 * motion,
            transitionTimingFunction: ['ease', Ease.rise],
          },
        ]}>
        <Text style={styles.brand} accessibilityRole="header" numberOfLines={1} adjustsFontSizeToFit>
          afterdream
        </Text>
        <Text style={styles.tagline} numberOfLines={1}>
          what did you dream about?
        </Text>
      </Animated.View>

      <Animated.View
        style={[
          styles.sheet,
          {
            transform: [{ translateY: done ? 0 : 420 }],
            transitionProperty: 'transform',
            transitionDuration: 800 * motion,
            transitionDelay: 450 * motion,
            transitionTimingFunction: Ease.rise,
          },
        ]}>
        <SignInSheet
          agreed={agreed}
          onToggle={handleToggle}
          signing={signing}
          onContinue={handleContinue}
          bottomPadding={Math.max(insets.bottom + 8, 24)}
          reduceMotion={reduceMotion}
        />
      </Animated.View>

      {/* Development builds only (never in a release): skip sign-in and onboarding. */}
      {__DEV__ && (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.replace('/home')}
          hitSlop={8}
          style={({ pressed }) => [styles.devSkip, { top: insets.top + 8 }, pressed && styles.devSkipPressed]}>
          <Text style={styles.devSkipText}>dev · skip to home</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
    overflow: 'hidden',
  },
  flood: {
    position: 'absolute',
    pointerEvents: 'none',
    backgroundColor: BrandColors.lime,
  },
  ghost: {
    position: 'absolute',
  },
  title: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 4,
  },
  brand: {
    fontFamily: BrandFonts.semibold,
    fontSize: 68,
    lineHeight: 74,
    letterSpacing: -3,
    textAlign: 'center',
    color: BrandColors.ink,
  },
  tagline: {
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 20,
    letterSpacing: -0.2,
    color: BrandColors.ink,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  devSkip: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: 'rgba(17,17,17,0.85)',
  },
  devSkipPressed: {
    opacity: 0.7,
  },
  devSkipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: '#fff',
  },
});
