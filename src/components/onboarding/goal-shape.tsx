import { StyleSheet, View, type ViewStyle } from 'react-native';
import Animated, { type CSSTransitionProperties } from 'react-native-reanimated';

import type { GoalShape as Shape } from '@/utils/goals';

type GoalShapeProps = {
  shape: Shape;
  color: string;
  /** Seconds into the bob, so the tiles don't all bob together. */
  bobDelay: number;
  reduceMotion: boolean;
};

const SIZE = 56;

const BOB = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -4 }] },
  '100%': { transform: [{ translateY: 0 }] },
};
const SPIN = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

/** The little drawing on a goal tile. It bobs gently; the ring also spins. */
export function GoalShape({ shape, color, bobDelay, reduceMotion }: GoalShapeProps) {
  // Colour swaps (tile picked / un-picked) ease rather than snap.
  const fade = (...props: (keyof ViewStyle)[]): CSSTransitionProperties<ViewStyle> => ({
    transitionProperty: props,
    transitionDuration: reduceMotion ? 0 : 350,
    transitionTimingFunction: 'ease',
  });
  const fill = [{ backgroundColor: color }, fade('backgroundColor')];

  return (
    <Animated.View
      importantForAccessibility="no-hide-descendants"
      style={[
        styles.box,
        !reduceMotion && {
          animationName: BOB,
          animationDuration: 5000,
          animationDelay: bobDelay * 1000,
          animationIterationCount: 'infinite',
          animationTimingFunction: 'ease-in-out',
        },
      ]}>
      {shape === 'circle' && <Animated.View style={[styles.circle, fill]} />}
      {shape === 'dome' && <Animated.View style={[styles.dome, fill]} />}
      {shape === 'ring' && (
        <Animated.View
          style={[
            styles.ring,
            // Three sides coloured, the right one open, like a "C" turning.
            { borderTopColor: color, borderLeftColor: color, borderBottomColor: color },
            fade('borderTopColor', 'borderLeftColor', 'borderBottomColor'),
            !reduceMotion && {
              animationName: SPIN,
              animationDuration: 8000,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'linear',
            },
          ]}
        />
      )}
      {shape === 'bars' && (
        <View style={styles.bars}>
          {BAR_HEIGHTS.map((height, k) => (
            <Animated.View key={k} style={[styles.bar, { height }, fill]} />
          ))}
        </View>
      )}
      {shape === 'pair' && (
        <>
          <Animated.View style={[styles.pairSolid, fill]} />
          <Animated.View style={[styles.pairOutline, { borderColor: color }, fade('borderColor')]} />
        </>
      )}
      {shape === 'diamond' && <Animated.View style={[styles.diamond, fill]} />}
    </Animated.View>
  );
}

const BAR_HEIGHTS = [28, 44, 20];

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 16,
    top: 16,
    width: SIZE,
    height: SIZE,
  },
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
  },
  dome: {
    width: SIZE,
    height: SIZE / 2,
    marginTop: SIZE / 2,
    borderTopLeftRadius: SIZE / 2,
    borderTopRightRadius: SIZE / 2,
  },
  ring: {
    width: SIZE,
    height: SIZE,
    borderRadius: SIZE / 2,
    borderWidth: 9,
    borderRightColor: 'transparent',
  },
  bars: {
    height: SIZE,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
  },
  bar: {
    width: 14,
    borderRadius: 7,
  },
  pairSolid: {
    position: 'absolute',
    left: 0,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  pairOutline: {
    position: 'absolute',
    right: 0,
    top: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 3,
  },
  diamond: {
    width: 40,
    height: 40,
    margin: 8,
    borderRadius: 10,
    transform: [{ rotate: '45deg' }],
  },
});
