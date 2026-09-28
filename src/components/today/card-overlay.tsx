import { Image } from 'expo-image';
import { useEffect, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';

/** Where the card was on screen when it was tapped (window coordinates). */
export type CardRect = { x: number; y: number; width: number; height: number };

/** The design's `cubic-bezier(.7,0,.2,1)`: a slow start, then a soft landing. */
const GROW = Easing.bezier(0.7, 0, 0.2, 1);
export const OVERLAY_MS = 600;
/** Background of the plain dark screens. */
export const DARK = '#0B0B0B';

type CardOverlayProps = {
  from: CardRect;
  screen: { width: number; height: number };
  /** False while closing: the overlay shrinks back into its card. */
  open: boolean;
  reduceMotion: boolean;
  /** Blurred photo behind the screen; without one the screen is plain dark. */
  photo?: string;
  pill: string;
  /** Replaces the pill on the right of the top bar (e.g. tabs). */
  headerRight?: ReactNode;
  topInset: number;
  onClose: () => void;
  children: ReactNode;
};

/**
 * A card opening up into a full screen: it grows from where the card sits to fill the
 * phone, then its content fades in. Setting `open` to false plays it backwards.
 */
export function CardOverlay({ from, screen, open, reduceMotion, photo, pill, headerRight, topInset, onClose, children }: CardOverlayProps) {
  const grow = useSharedValue(reduceMotion ? 1 : 0);
  const show = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    const ms = reduceMotion ? 0 : OVERLAY_MS;
    grow.set(withTiming(open ? 1 : 0, { duration: ms, easing: GROW }));
    show.set(open ? withDelay(reduceMotion ? 0 : 350, withTiming(1, { duration: reduceMotion ? 0 : 400 })) : withTiming(0, { duration: reduceMotion ? 0 : 200 }));
  }, [open, reduceMotion, grow, show]);

  const frame = useAnimatedStyle(() => {
    const p = grow.get();
    return {
      top: interpolate(p, [0, 1], [from.y, 0]),
      left: interpolate(p, [0, 1], [from.x, 0]),
      width: interpolate(p, [0, 1], [from.width, screen.width]),
      height: interpolate(p, [0, 1], [from.height, screen.height]),
      borderRadius: interpolate(p, [0, 1], [40, 0]),
    };
  });
  const content = useAnimatedStyle(() => ({ opacity: show.get() }));

  return (
    <Animated.View style={[styles.frame, frame]} accessibilityViewIsModal>
      {/* Drawn at full-screen size from the start, so nothing reflows while it grows. */}
      <View style={[styles.inner, screen]}>
        {photo ? (
          <>
            <Image source={{ uri: photo }} style={styles.photo} contentFit="cover" blurRadius={12} />
            <View style={styles.shade} />
          </>
        ) : (
          <View style={styles.dark} />
        )}
        <Animated.View style={[StyleSheet.absoluteFill, content]} pointerEvents={open ? 'auto' : 'none'}>
          <View style={[styles.bar, { top: topInset + 6 }]}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} hitSlop={6} style={({ pressed }) => [styles.close, pressed && styles.pressed]}>
              <Text style={styles.closeGlyph}>✕</Text>
            </Pressable>
            {headerRight ?? (
              <View style={styles.pill}>
                <Text style={styles.pillText}>{pill}</Text>
              </View>
            )}
          </View>
          <View style={[styles.body, { top: topInset + 58 }]}>{children}</View>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

/** Frosted panel used on the opened screens. */
export const panel = {
  borderRadius: 24,
  borderCurve: 'continuous' as const,
  padding: 18,
  backgroundColor: 'rgba(255, 255, 255, 0.13)',
};

/** Small spaced-out capitals over a panel ("IN SHORT"). */
export const overline = {
  fontFamily: BrandFonts.semibold,
  fontSize: 11,
  lineHeight: 13,
  letterSpacing: 1.6,
  textTransform: 'uppercase' as const,
  color: 'rgba(255, 255, 255, 0.75)',
};

const styles = StyleSheet.create({
  frame: {
    position: 'absolute',
    zIndex: 5,
    overflow: 'hidden',
    backgroundColor: '#111',
  },
  inner: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  photo: {
    position: 'absolute',
    top: -40,
    left: -40,
    right: -40,
    bottom: -40,
  },
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.3) 40%, rgba(0,0,0,0.6))',
  },
  dark: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: DARK,
    // A faint lime glow at the top, so the dark screen doesn't feel flat.
    experimental_backgroundImage: 'radial-gradient(120% 45% at 50% 0%, rgba(226, 235, 152, 0.10), transparent 70%)',
  },
  bar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 44,
    zIndex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  close: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.16)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeGlyph: {
    fontFamily: BrandFonts.regular,
    fontSize: 18,
    lineHeight: 22,
    color: '#fff',
  },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  pillText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  body: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
});
