import { Image } from 'expo-image';
import type { ComponentProps, ReactNode, Ref } from 'react';
import { StyleSheet, Text, View, type ColorValue } from 'react-native';
import Animated from 'react-native-reanimated';

import { BalancedText } from '@/components/balanced-text';
import { BrandFonts } from '@/constants/theme';

import { DRIFT, DRIFT_BACK, loop, ZOOM } from './motion';

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
  /** Height of the card's content, between the two insets. */
  height: number;
  /** Space kept clear at the top of the page (status bar and the streak row). */
  insetTop: number;
  /** Space kept clear at the bottom of the page (the tab bar). */
  insetBottom: number;
  /** The card filling the screen right now. Only it runs its slow picture and glow loops. */
  active: boolean;
  reduceMotion: boolean;
  /** Layered radial gradients (CSS syntax), shown while the picture loads or if it can't. */
  gradient: string;
  base: ColorValue;
  /** Bundled background picture (`require(...)`), from CARD_BACKGROUNDS. */
  photo: number;
  glow: Glow;
  label: string;
  children: ReactNode;
  ref?: Ref<View>;
};

/**
 * One page of the Today feed, the full size of the screen: a slowly zooming northern-lights
 * picture over a gradient, edge to edge, with a drifting glow and whatever the card holds.
 * The picture runs under the status bar and the tab bar; the card's own text and buttons stay
 * inside the insets, so they read exactly as they did when this was a card.
 */
export function TodayCard({ height, insetTop, insetBottom, active, reduceMotion, gradient, base, photo, glow, label, children, ref }: TodayCardProps) {
  const still = reduceMotion || !active;
  return (
    <Animated.View
      accessibilityLabel={label}
      style={[styles.card, { height: insetTop + height + insetBottom, backgroundColor: base, experimental_backgroundImage: gradient }]}>
      <Animated.View style={[styles.photo, loop(still, ZOOM, 24000)]}>
        <Image source={photo} style={StyleSheet.absoluteFill} contentFit="cover" transition={300} />
      </Animated.View>
      <View style={styles.shade} />
      <View ref={ref} style={[styles.content, { top: insetTop, bottom: insetBottom }]}>
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
            loop(still, glow.drift === 'out' ? DRIFT : DRIFT_BACK, glow.duration),
          ]}
        />
        {children}
      </View>
    </Animated.View>
  );
}

type CardHeadingProps = {
  /** Where the heading starts, as a share of the card's height. */
  top: number;
  eyebrow: string;
  title: string;
  style?: ComponentProps<typeof Animated.View>['style'];
  titleStyle?: ComponentProps<typeof Text>['style'];
};

/** The small line and big question in the middle of a card, centred. */
export function CardHeading({ top, eyebrow, title, style, titleStyle }: CardHeadingProps) {
  return (
    <Animated.View style={[styles.heading, { top: `${top * 100}%` }, style]}>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <BalancedText style={[styles.title, titleStyle]} accessibilityRole="header">
        {title}
      </BalancedText>
    </Animated.View>
  );
}

/** Shared frosted-glass look for buttons and bubbles on a card. */
export const glass = (alpha: number) => ({ backgroundColor: `rgba(255, 255, 255, ${alpha})` });

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
  },
  /** Where the card's text and buttons live: the screen, minus the status bar and the tab bar. */
  content: {
    position: 'absolute',
    left: 0,
    right: 0,
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
    textAlign: 'center',
    color: '#fff',
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 36,
    lineHeight: 39,
    letterSpacing: -1.3,
    textAlign: 'center',
    color: '#fff',
  },
});
