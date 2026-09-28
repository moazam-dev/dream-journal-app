import { Image } from 'expo-image';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';

import { DRIFT, DRIFT_BACK, EASE_OUT, loop, ZOOM } from './motion';

/** Soft blob of light drifting behind a card's text. Positions are in the design's points. */
export type Glow = {
  left: number;
  top: number;
  width: number;
  height: number;
  color: string;
  opacity: number;
  rotate?: string;
  drift: 'out' | 'back';
  duration: number;
};

type TodayCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  /** Layered radial gradients (CSS syntax), shown while the photo loads or if it can't. */
  gradient: string;
  base: ColorValue;
  photo: string;
  glow: Glow;
  label: string;
  children: ReactNode;
  ref?: Ref<View>;
};

/**
 * One full-height card on the Today feed: a blurred, slowly zooming photo over a gradient,
 * a drifting glow, and whatever the card holds. The card in view is full size; the others
 * shrink a little and dim.
 */
export function TodayCard({ height, active, reduceMotion, gradient, base, photo, glow, label, children, ref }: TodayCardProps) {
  return (
    <Animated.View
      ref={ref}
      accessibilityLabel={label}
      style={[
        styles.card,
        { height, backgroundColor: base, experimental_backgroundImage: gradient },
        { opacity: active ? 1 : 0.6, transform: [{ scale: active ? 1 : 0.94 }] },
        !reduceMotion && { transitionProperty: ['opacity', 'transform'], transitionDuration: 500, transitionTimingFunction: EASE_OUT },
      ]}>
      <Animated.View style={[styles.photo, loop(reduceMotion, ZOOM, 24000)]}>
        <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={26} transition={600} />
      </Animated.View>
      <View style={styles.shade} />
      <Animated.View
        pointerEvents="none"
        style={[
          styles.glow,
          {
            left: glow.left,
            top: glow.top,
            width: glow.width,
            height: glow.height,
            opacity: glow.opacity,
            experimental_backgroundImage: `radial-gradient(${glow.color} 0%, transparent 70%)`,
          },
          glow.rotate ? { transform: [{ rotate: glow.rotate }] } : null,
          loop(reduceMotion, glow.drift === 'out' ? DRIFT : DRIFT_BACK, glow.duration),
        ]}
      />
      {children}
    </Animated.View>
  );
}

type CardPillProps = {
  /** Step number in the small white dot, if any. */
  step?: number;
  stepColor?: ColorValue;
  label: string;
};

/** The frosted label in a card's top-left corner ("1 write it down", "✦ today's thought"). */
export function CardPill({ step, stepColor, label }: CardPillProps) {
  return (
    <View style={[styles.pill, step !== undefined && styles.pillWithStep]}>
      {step !== undefined && (
        <View style={styles.step}>
          <Text style={[styles.stepText, { color: stepColor }]}>{step}</Text>
        </View>
      )}
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

type CardHeadingProps = {
  /** Where the heading starts, as a share of the card's height. */
  top: number;
  eyebrow: string;
  title: string;
  style?: ComponentProps<typeof Animated.View>['style'];
};

/** The small line and big question in the middle of a card. */
export function CardHeading({ top, eyebrow, title, style }: CardHeadingProps) {
  return (
    <Animated.View style={[styles.heading, { top: `${top * 100}%` }, style]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title} accessibilityRole="header">
        {title}
      </Text>
    </Animated.View>
  );
}

/** Shared frosted-glass look for buttons and bubbles on a card. */
export const glass = (alpha: number) => ({ backgroundColor: `rgba(255, 255, 255, ${alpha})` });

const styles = StyleSheet.create({
  card: {
    borderRadius: 40,
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
  },
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0.34), rgba(0,0,0,0.24) 45%, rgba(0,0,0,0.4))',
  },
  glow: {
    position: 'absolute',
  },
  pill: {
    position: 'absolute',
    left: 22,
    top: 24,
    height: 40,
    paddingHorizontal: 16,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  pillWithStep: {
    paddingLeft: 12,
  },
  step: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
  },
  pillText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  heading: {
    position: 'absolute',
    left: 24,
    right: 24,
    gap: 10,
  },
  eyebrow: {
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 19,
    color: '#fff',
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 36,
    lineHeight: 39,
    letterSpacing: -1.3,
    color: '#fff',
  },
});
