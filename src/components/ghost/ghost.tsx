import { Image, StyleSheet, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { BrandColors } from '@/constants/theme';

/** Where the star's centre sits inside the ghost picture (fractions of its size). */
export const STAR_CENTER = { x: 0.907, y: 0.207 };

/** Floats up and down with a slight tilt, forever. */
const FLOAT = {
  '0%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
  '50%': { transform: [{ translateY: -12 }, { rotate: '-2.5deg' }] },
  '100%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
};
/** The shadow shrinks and fades while the ghost floats up. */
const SHADOW = {
  '0%': { opacity: 0.22, transform: [{ scaleX: 1 }] },
  '50%': { opacity: 0.12, transform: [{ scaleX: 0.78 }] },
  '100%': { opacity: 0.22, transform: [{ scaleX: 1 }] },
};
/** The eyes close for a moment near the end of each loop. */
const BLINK = {
  '0%': { transform: [{ scaleY: 0 }] },
  '88%': { transform: [{ scaleY: 0 }] },
  '92%': { transform: [{ scaleY: 1 }] },
  '94%': { transform: [{ scaleY: 1 }] },
  '100%': { transform: [{ scaleY: 0 }] },
};
/** The star shrinks, spins and sparkles near the end of each loop. */
const TWINKLE = {
  '0%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
  '80%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
  '88%': { transform: [{ scale: 0.55 }, { rotate: '45deg' }] },
  '94%': { transform: [{ scale: 1.15 }, { rotate: '90deg' }] },
  '100%': { transform: [{ scale: 1 }, { rotate: '0deg' }] },
};

/** Timing curves from the design's CSS. */
const Ease = {
  springy: cubicBezier(0.2, 1.3, 0.4, 1),
  star: cubicBezier(0.3, 1.5, 0.5, 1),
  hop: cubicBezier(0.3, 1.6, 0.5, 1),
  exit: cubicBezier(0.5, 0, 0.3, 1),
};

type GhostProps = {
  /** Width and height of the ghost picture (pt). */
  size: number;
  /** The star has popped in. */
  starIn: boolean;
  /** The lime has flooded the screen, so the star turns black. */
  starDark: boolean;
  /** The ghost's body has risen into view. */
  bodyIn: boolean;
  /** Terms accepted: the star grows a little and flips round. */
  agreed: boolean;
  /** A little jump when the terms are accepted. */
  hop: boolean;
  /** Signing in: the ghost flies off the top of the screen. */
  leaving: boolean;
  reduceMotion: boolean;
};

/**
 * The Afterdream ghost from the Welcome Ghost design: a black ghost with a
 * sparkle star beside it. It floats, blinks, and the star twinkles.
 */
export function Ghost({ size, starIn, starDark, bodyIn, agreed, hop, leaving, reduceMotion }: GhostProps) {
  const motion = reduceMotion ? 0 : 1;

  // Loops start once the intro has played (3.2 s in the design).
  function loop(name: object, duration: number, delay: number, timing: 'linear' | 'ease-in-out') {
    if (reduceMotion) return null;
    return {
      animationName: name,
      animationDuration: duration,
      animationDelay: delay,
      animationTimingFunction: timing,
      animationIterationCount: 'infinite' as const,
      animationFillMode: 'both' as const,
    };
  }

  const shadowHeight = size * 0.075;

  return (
    <View style={{ width: size, height: size, pointerEvents: 'none' }}>
      {/* Soft shadow under the ghost. */}
      <Animated.View
        style={[
          styles.shadowWrap,
          {
            bottom: -size * 0.025,
            height: shadowHeight,
            opacity: bodyIn ? 1 : 0,
            transitionProperty: 'opacity',
            transitionDuration: 600 * motion,
            transitionTimingFunction: 'ease',
          },
        ]}>
        <Animated.View
          style={[
            styles.shadow,
            { borderRadius: shadowHeight },
            reduceMotion ? { opacity: 0.22 } : loop(SHADOW, 5000, 3200, 'ease-in-out'),
          ]}
        />
      </Animated.View>

      {/* Flies off when signing in. */}
      <Animated.View
        style={[
          StyleSheet.absoluteFill,
          {
            opacity: leaving ? 0 : 1,
            transform: [{ translateY: leaving ? -520 : 0 }],
            transitionProperty: ['transform', 'opacity'],
            transitionDuration: [900 * motion, 600 * motion],
            transitionTimingFunction: [Ease.exit, 'ease'],
          },
        ]}>
        <Animated.View style={[StyleSheet.absoluteFill, loop(FLOAT, 5000, 3200, 'ease-in-out')]}>
          <Animated.View
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ translateY: hop ? -22 : 0 }],
                transitionProperty: 'transform',
                transitionDuration: 450 * motion,
                transitionTimingFunction: Ease.hop,
              },
            ]}>
            {/* Body rises up and straightens out. */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                {
                  opacity: bodyIn ? 1 : 0,
                  transform: [{ translateY: bodyIn ? 0 : 160 }, { rotate: bodyIn ? '0deg' : '14deg' }],
                  transitionProperty: ['transform', 'opacity'],
                  transitionDuration: [1000 * motion, 700 * motion],
                  transitionTimingFunction: [Ease.springy, 'ease'],
                },
              ]}>
              <Image source={require('@/assets/images/ghost-body.png')} style={styles.fill} />
              <Animated.View style={[styles.eyelid, loop(BLINK, 4200, 2400, 'linear')]} />
            </Animated.View>

            {/* Star: pops in, then grows and flips when the terms are accepted. */}
            <Animated.View
              style={[
                StyleSheet.absoluteFill,
                styles.starOrigin,
                {
                  transform: [
                    { scale: starIn ? (agreed ? 1.25 : 1) : 0 },
                    { rotate: starIn ? (agreed ? '180deg' : '0deg') : '-120deg' },
                  ],
                  transitionProperty: 'transform',
                  transitionDuration: 700 * motion,
                  transitionTimingFunction: Ease.star,
                },
              ]}>
              <Animated.View style={[StyleSheet.absoluteFill, styles.starOrigin, loop(TWINKLE, 3600, 3500, 'ease-in-out')]}>
                <Image
                  source={require('@/assets/images/ghost-star.png')}
                  tintColor={BrandColors.lime}
                  style={styles.fill}
                />
                <Animated.Image
                  source={require('@/assets/images/ghost-star.png')}
                  tintColor={BrandColors.ink}
                  style={[
                    styles.fill,
                    {
                      opacity: starDark ? 1 : 0,
                      transitionProperty: 'opacity',
                      transitionDuration: 900 * motion,
                      transitionTimingFunction: 'ease',
                    },
                  ]}
                />
              </Animated.View>
            </Animated.View>
          </Animated.View>
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  shadowWrap: {
    position: 'absolute',
    left: '18%',
    right: '26%',
  },
  shadow: {
    flex: 1,
    backgroundColor: BrandColors.ink,
  },
  /** Black patch over the eyes; it drops down from the top to blink. */
  eyelid: {
    position: 'absolute',
    left: '47.6%',
    top: '34.2%',
    width: '24.2%',
    height: '13.8%',
    backgroundColor: '#000000',
    borderRadius: 999,
    transformOrigin: ['50%', 0, 0],
    transform: [{ scaleY: 0 }],
  },
  starOrigin: {
    // Array form: React Native can't parse decimal percentages in the string form.
    transformOrigin: [`${(STAR_CENTER.x * 100).toFixed(1)}%`, `${(STAR_CENTER.y * 100).toFixed(1)}%`, 0],
  },
});
