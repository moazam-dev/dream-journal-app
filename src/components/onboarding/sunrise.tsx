import { StyleSheet } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BrandColors } from '@/constants/theme';

type SunriseProps = {
  /** 0 = barely there, 1 = fully risen. */
  progress: number;
  /** Rises a little higher to celebrate. */
  done: boolean;
  reduceMotion: boolean;
};

/** Height of the glow (pt). It sits on the horizon line, just above the keyboard. */
const HEIGHT = 300;

/**
 * A soft lime glow rising from the horizon, like the sun coming up.
 * It grows as `progress` goes up (the design: "the sun rises a little with every letter").
 */
export function Sunrise({ progress, done, reduceMotion }: SunriseProps) {
  const opacity = done ? 1 : 0.18 + progress * 0.62;
  const scaleY = done ? 1.25 : 0.45 + progress * 0.55;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.glow,
        {
          opacity,
          transform: [{ scaleY }],
          transitionProperty: ['opacity', 'transform'],
          transitionDuration: reduceMotion ? 0 : 700,
          transitionTimingFunction: ['ease', cubicBezier(0.3, 0.9, 0.3, 1)],
        },
      ]}>
      {/* The design's radial-gradient(60% 100% at 50% 100%, …): an oval centred on the horizon. */}
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id="sunrise" cx="50%" cy="100%" rx="60%" ry="100%" fx="50%" fy="100%">
            <Stop offset="0" stopColor={BrandColors.lime} stopOpacity={0.55} />
            <Stop offset="0.45" stopColor={BrandColors.lime} stopOpacity={0.12} />
            <Stop offset="0.75" stopColor={BrandColors.lime} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#sunrise)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    left: -40,
    right: -40,
    bottom: 0,
    height: HEIGHT,
    transformOrigin: 'bottom',
  },
});
