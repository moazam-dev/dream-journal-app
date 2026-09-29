import { StyleSheet } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import Svg, { Defs, Ellipse, RadialGradient, Stop } from 'react-native-svg';

import { loop } from '@/components/today/motion';

/** The design's glow: a 690 × 640 ellipse hung off the top-left corner (390 × 844 phone). */
const BOX_WIDTH = 690;
const BOX_HEIGHT = 640;
const BOX_LEFT = -150;
const BOX_TOP = -420;

/** Navy at the core out to lime at the rim, the same ramp the Voice Agent screen glows with. */
const STOPS = [
  { offset: 0, color: '#0b1240', opacity: 1 },
  { offset: 0.45, color: '#1b2a8f', opacity: 1 },
  { offset: 0.68, color: '#3f55e0', opacity: 1 },
  { offset: 0.82, color: '#8e9fd6', opacity: 1 },
  { offset: 0.9, color: '#EEF2C8', opacity: 1 },
  { offset: 1, color: '#EEF2C8', opacity: 0 },
] as const;

/** Breathes in and out every 8 s, like the design's `pGlow`. */
const BREATHE = {
  '0%': { transform: [{ scale: 1 }], opacity: 1 },
  '50%': { transform: [{ scale: 1.04 }], opacity: 0.88 },
  '100%': { transform: [{ scale: 1 }], opacity: 1 },
} as const;

/**
 * The dawn over the top of the paywall. Only its bottom edge shows: the black fade
 * the screen lays over it swallows the rest by 42% down.
 */
export function PaywallAurora({ scale }: { scale: number }) {
  const reduceMotion = useReducedMotion();
  const width = BOX_WIDTH * scale;
  const height = BOX_HEIGHT * scale;

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.aurora,
        { left: BOX_LEFT * scale, top: BOX_TOP * scale, width, height },
        loop(reduceMotion, BREATHE, 8000),
      ]}>
      <Svg width={width} height={height}>
        <Defs>
          <RadialGradient id="paywall-dawn" cx="50%" cy="50%" rx="50%" ry="50%">
            {STOPS.map((stop) => (
              <Stop key={stop.offset} offset={stop.offset} stopColor={stop.color} stopOpacity={stop.opacity} />
            ))}
          </RadialGradient>
        </Defs>
        <Ellipse cx={width / 2} cy={height / 2} rx={width / 2} ry={height / 2} fill="url(#paywall-dawn)" />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  aurora: {
    position: 'absolute',
  },
});
