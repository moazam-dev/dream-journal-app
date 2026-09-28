import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, View, type GestureResponderEvent } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';

type GlowProps = {
  /** Called on every tap on the glow (after the ripple starts). */
  onTap: () => void;
  reduceMotion: boolean;
};

/** Size of the glow in the design (pt). The screen scales it to fit the phone. */
export const GLOW_SIZE = 560;
const RIPPLE_SIZE = 320;
/** How long a ripple lasts; it is removed a little after it has faded. */
const RIPPLE_MS = 1600;
/** At most this many ripples at once, so fast tapping stays smooth. */
const MAX_RIPPLES = 6;

// Keyframes and timings from the design's CSS (@keyframes wRise, wBreathe, …).
const RISE = {
  '0%': { transform: [{ translateY: 720 }] },
  '70%': { transform: [{ translateY: -18 }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const BREATHE = {
  '0%': { transform: [{ scale: 1 }] },
  '50%': { transform: [{ scale: 1.06 }] },
  '100%': { transform: [{ scale: 1 }] },
};
const UP = {
  from: { opacity: 0, transform: [{ translateY: 14 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const DROP = {
  '0%': { opacity: 0, transform: [{ translateY: -140 }, { rotate: '-14deg' }] },
  '60%': { opacity: 1, transform: [{ translateY: 10 }, { rotate: '4deg' }] },
  '80%': { transform: [{ translateY: -4 }, { rotate: '-1deg' }] },
  '100%': { opacity: 1, transform: [{ translateY: 0 }, { rotate: '0deg' }] },
};
const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };
/** "breathe in…" shows for the first half of each 8 s breath, "and let it go" for the second. */
const SAY_IN = {
  '0%': { opacity: 1, transform: [{ translateY: 0 }] },
  '42%': { opacity: 1, transform: [{ translateY: 0 }] },
  '50%': { opacity: 0, transform: [{ translateY: -6 }] },
  '92%': { opacity: 0, transform: [{ translateY: -6 }] },
  '100%': { opacity: 1, transform: [{ translateY: 0 }] },
};
const SAY_OUT = {
  '0%': { opacity: 0, transform: [{ translateY: 6 }] },
  '42%': { opacity: 0, transform: [{ translateY: 6 }] },
  '50%': { opacity: 1, transform: [{ translateY: 0 }] },
  '92%': { opacity: 1, transform: [{ translateY: 0 }] },
  '100%': { opacity: 0, transform: [{ translateY: 6 }] },
};
const RIPPLE = {
  from: { opacity: 0.7, transform: [{ scale: 0 }] },
  to: { opacity: 0, transform: [{ scale: 1 }] },
};

const LETTERS = ['i', 'n', '.'];

type Ripple = { id: number; x: number; y: number };

/**
 * The big lime glow: it springs up from below, breathes slowly, and says
 * "congrats, you're in." Tapping it sends out a ring from where you tapped.
 */
export function Glow({ onTap, reduceMotion }: GlowProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);
  const nextId = useRef(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);

  useEffect(() => {
    const pending = timers.current;
    return () => pending.forEach(clearTimeout);
  }, []);

  function handlePress(event: GestureResponderEvent) {
    onTap();
    if (reduceMotion) return;

    const id = ++nextId.current;
    const { locationX: x, locationY: y } = event.nativeEvent;
    setRipples((current) => [...current.slice(-(MAX_RIPPLES - 1)), { id, x, y }]);
    timers.current.push(
      setTimeout(() => setRipples((current) => current.filter((r) => r.id !== id)), RIPPLE_MS + 100)
    );
  }

  /** The design's animation, or nothing with reduced motion (everything simply shows). */
  function animate(style: object) {
    return reduceMotion ? null : { animationFillMode: 'both' as const, ...style };
  }

  return (
    <Animated.View
      style={[
        styles.glow,
        animate({ animationName: RISE, animationDuration: 1200, animationDelay: 200, animationTimingFunction: cubicBezier(0.3, 0.9, 0.3, 1) }),
      ]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Congrats, you're in. Tap the glow to let go."
        onPress={handlePress}
        style={StyleSheet.absoluteFill}>
        {/* Touches go to the Pressable, so ripple positions are measured on the whole glow. */}
        <Animated.View
          pointerEvents="none"
          style={[
            styles.disc,
            animate({
              animationName: BREATHE,
              animationDuration: 8000,
              animationDelay: 1600,
              animationTimingFunction: 'ease-in-out',
              animationIterationCount: 'infinite',
            }),
          ]}
        />

        {/* Rings stay inside the circle. */}
        <View style={styles.clip} pointerEvents="none">
          {ripples.map((r) => (
            <Animated.View
              key={r.id}
              style={[
                styles.ripple,
                { left: r.x - RIPPLE_SIZE / 2, top: r.y - RIPPLE_SIZE / 2 },
                animate({ animationName: RIPPLE, animationDuration: RIPPLE_MS, animationTimingFunction: cubicBezier(0.2, 0.7, 0.3, 1) }),
              ]}
            />
          ))}
        </View>

        <View style={styles.content} pointerEvents="none">
          <Animated.Text
            style={[styles.congrats, animate({ animationName: UP, animationDuration: 700, animationDelay: 1200, animationTimingFunction: 'ease' })]}>
            congrats, you’re
          </Animated.Text>

          <View style={styles.inRow}>
            {LETTERS.map((letter, k) => (
              <Animated.Text
                key={letter}
                style={[
                  styles.in,
                  animate({
                    animationName: DROP,
                    animationDuration: 900,
                    animationDelay: 1500 + k * 120,
                    animationTimingFunction: cubicBezier(0.3, 0.8, 0.3, 1),
                  }),
                ]}>
                {letter}
              </Animated.Text>
            ))}
          </View>

          <Animated.View
            style={[styles.saying, animate({ animationName: FADE, animationDuration: 800, animationDelay: 2600, animationTimingFunction: 'ease' })]}>
            <Animated.Text
              style={[
                styles.sayingText,
                animate({
                  animationName: SAY_IN,
                  animationDuration: 8000,
                  animationDelay: 1600,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                }),
              ]}>
              breathe in…
            </Animated.Text>
            {/* With reduced motion only "breathe in…" is shown. */}
            {!reduceMotion && (
              <Animated.Text
                style={[
                  styles.sayingText,
                  animate({
                    animationName: SAY_OUT,
                    animationDuration: 8000,
                    animationDelay: 1600,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                  }),
                ]}>
                and let it go
              </Animated.Text>
            )}
          </Animated.View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

/** Fills the whole glow. */
const FILL = { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 } as const;

const styles = StyleSheet.create({
  glow: {
    width: GLOW_SIZE,
    height: GLOW_SIZE,
  },
  disc: {
    ...FILL,
    borderRadius: GLOW_SIZE / 2,
    backgroundColor: BrandColors.lime,
  },
  clip: {
    ...FILL,
    borderRadius: GLOW_SIZE / 2,
    overflow: 'hidden',
  },
  ripple: {
    position: 'absolute',
    width: RIPPLE_SIZE,
    height: RIPPLE_SIZE,
    borderRadius: RIPPLE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: BrandColors.ink,
  },
  content: {
    ...FILL,
    alignItems: 'center',
    justifyContent: 'center',
  },
  congrats: {
    fontFamily: BrandFonts.medium,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.6,
    color: BrandColors.ink,
  },
  inRow: {
    flexDirection: 'row',
    // The design's 6 pt gap, minus the taller line box below.
    marginTop: -4,
  },
  in: {
    fontFamily: BrandFonts.semibold,
    fontSize: 128,
    lineHeight: 148,
    letterSpacing: -6,
    color: BrandColors.ink,
  },
  saying: {
    width: 200,
    height: 22,
    // The design's 22 pt gap, minus the taller line box above.
    marginTop: 12,
  },
  sayingText: {
    ...FILL,
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 22,
    color: NightColors.onLimeSoft,
  },
});
