import { StyleSheet, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

type BirthMoonProps = {
  /** Position in the lunar cycle: 0 = new moon, 0.5 = full moon, back to 1 = new moon. */
  cycle: number;
  reduceMotion: boolean;
};

const SIZE = 188;

// Keyframes and timings from the design's CSS (@keyframes bMoon, bFloat).
const MOON_IN = {
  from: { opacity: 0, transform: [{ translateY: 40 }, { scale: 0.85 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
const FLOAT = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -6 }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const EASE_OUT = cubicBezier(0.3, 0.9, 0.3, 1);

/** Craters as fractions of the moon's size, from the design. */
const CRATERS = [
  { left: 0.34, top: 0.52, size: 22, opacity: 0.28 },
  { left: 0.58, top: 0.28, size: 14, opacity: 0.24 },
  { left: 0.62, top: 0.64, size: 10, opacity: 0.22 },
];

/**
 * A lime moon lit to match a phase. A dark disc the size of the moon slides across it:
 * right on top at new moon, off to the left while waxing, gone at full moon,
 * and back in from the right while waning.
 */
export function BirthMoon({ cycle, reduceMotion }: BirthMoonProps) {
  const shadowX = cycle < 0.5 ? -cycle * 2 * SIZE : (1 - cycle) * 2 * SIZE;

  function animate(style: object) {
    return reduceMotion ? null : { animationFillMode: 'both' as const, ...style };
  }

  return (
    <Animated.View
      style={animate({ animationName: MOON_IN, animationDuration: 1100, animationDelay: 1000, animationTimingFunction: EASE_OUT })}>
      <Animated.View
        style={[
          styles.glow,
          animate({
            animationName: FLOAT,
            animationDuration: 7000,
            animationDelay: 2100,
            animationIterationCount: 'infinite',
            animationTimingFunction: 'ease-in-out',
          }),
        ]}>
        <View style={styles.body}>
          {/* The design's radial-gradient(circle at 38% 34%, …) reaching the far corner. */}
          <Svg width={SIZE} height={SIZE} style={StyleSheet.absoluteFill}>
            <Defs>
              <RadialGradient id="moonLight" cx="38%" cy="34%" r="90.5%" fx="38%" fy="34%">
                <Stop offset="0" stopColor="#F3F7CF" />
                <Stop offset="0.55" stopColor="#E2EB98" />
                <Stop offset="1" stopColor="#CBD47A" />
              </RadialGradient>
            </Defs>
            <Rect width={SIZE} height={SIZE} fill="url(#moonLight)" />
          </Svg>
          {CRATERS.map((c) => (
            <View
              key={`${c.left}-${c.top}`}
              style={[
                styles.crater,
                {
                  left: c.left * SIZE,
                  top: c.top * SIZE,
                  width: c.size,
                  height: c.size,
                  borderRadius: c.size / 2,
                  backgroundColor: `rgba(160, 170, 80, ${c.opacity})`,
                },
              ]}
            />
          ))}
          <Animated.View
            style={[
              styles.shadow,
              {
                transform: [{ translateX: shadowX }],
                transitionProperty: 'transform',
                transitionDuration: reduceMotion ? 0 : 800,
                transitionTimingFunction: EASE_OUT,
              },
            ]}
          />
        </View>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // The halo sits outside the clipped body so it isn't cut off.
  glow: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    boxShadow: '0 0 0 1px rgba(226, 235, 152, 0.22), 0 0 110px 8px rgba(226, 235, 152, 0.16)',
  },
  body: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    overflow: 'hidden',
  },
  crater: {
    position: 'absolute',
  },
  shadow: {
    position: 'absolute',
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: SIZE / 2 + 1,
    backgroundColor: '#070707',
  },
});
