import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { BrandColors } from '@/constants/theme';

import { WelcomeEasing } from './motion';

type EyelidsProps = {
  width: number;
  height: number;
  /** Keep blinking every 7 s after the eyes open. */
  blink: boolean;
  reduceMotion: boolean;
};

/** Each lid covers 52% of the screen, so the two overlap when closed. */
const LID_HEIGHT = 0.52;
/** The lids stick out 10% past each side, so the curve reaches past the screen edge. */
const OVERHANG = 0.1;
/** How deep the curved edge of a lid is (fraction of the lid's height). */
const CURVE = 0.18;

/** The opening lasts 1.3 s: closed for the first 25%, then the lids pull apart. */
const OPEN_HOLD_MS = 325;
const OPEN_MS = 975;

/** Blinks start at 6 s and repeat every 7 s: open for 92%, shut at 95.5%, open again. */
const BLINK_START_MS = 6000;
const BLINK_OPEN_MS = 6440;
const BLINK_CLOSE_MS = 245;
const BLINK_REOPEN_MS = 315;

/**
 * Two black eyelids: closed when the screen appears, they open to reveal the lime
 * screen, then blink now and then.
 */
export function Eyelids({ width, height, blink, reduceMotion }: EyelidsProps) {
  // 1 = shut, 0 = open. The lids follow whichever is more closed.
  const opening = useSharedValue(reduceMotion ? 0 : 1);
  const blinking = useSharedValue(0);

  useEffect(() => {
    if (reduceMotion) return;
    opening.set(withDelay(OPEN_HOLD_MS, withTiming(0, { duration: OPEN_MS, easing: WelcomeEasing.lid })));
  }, [reduceMotion, opening]);

  useEffect(() => {
    if (reduceMotion || !blink) return;
    const ease = WelcomeEasing.easeInOut;
    blinking.set(
      withDelay(
        BLINK_START_MS,
        withRepeat(
          withSequence(
            withDelay(BLINK_OPEN_MS, withTiming(1, { duration: BLINK_CLOSE_MS, easing: ease })),
            withTiming(0, { duration: BLINK_REOPEN_MS, easing: ease })
          ),
          -1,
          false
        )
      )
    );
  }, [reduceMotion, blink, blinking]);

  if (reduceMotion) return null;

  const lidWidth = width * (1 + OVERHANG * 2);
  const lidHeight = height * LID_HEIGHT;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Lid edge="top" width={lidWidth} height={lidHeight} left={-width * OVERHANG} opening={opening} blinking={blinking} />
      <Lid edge="bottom" width={lidWidth} height={lidHeight} left={-width * OVERHANG} opening={opening} blinking={blinking} />
    </View>
  );
}

type LidProps = {
  edge: 'top' | 'bottom';
  width: number;
  height: number;
  left: number;
  opening: SharedValue<number>;
  blinking: SharedValue<number>;
};

/** One lid: a black shape with a rounded inner edge that folds away towards its screen edge. */
function Lid({ edge, width, height, left, opening, blinking }: LidProps) {
  const style = useAnimatedStyle(() => ({
    transform: [{ scaleY: Math.max(opening.get(), blinking.get()) }],
  }));

  // The inner edge is two quarter-ellipses meeting in the middle
  // (the design's `border-radius: 50% / 18%` on the inner corners).
  const rx = width / 2;
  const ry = height * CURVE;
  const d =
    edge === 'top'
      ? `M0,0 H${width} V${height - ry} A${rx},${ry} 0 0 1 ${rx},${height} A${rx},${ry} 0 0 1 0,${height - ry} Z`
      : `M0,${ry} A${rx},${ry} 0 0 1 ${rx},0 A${rx},${ry} 0 0 1 ${width},${ry} V${height} H0 Z`;

  return (
    <Animated.View
      style={[
        styles.lid,
        { width, height, left, transformOrigin: edge },
        edge === 'top' ? styles.top : styles.bottom,
        style,
      ]}>
      <Svg width={width} height={height}>
        <Path d={d} fill={BrandColors.ink} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  lid: {
    position: 'absolute',
  },
  top: {
    top: 0,
  },
  bottom: {
    bottom: 0,
  },
});
