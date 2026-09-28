import { useEffect, useEffectEvent, useState, type ReactNode } from 'react';
import { PanResponder, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withSequence, withSpring, withTiming } from 'react-native-reanimated';

import { animate } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';

import { up } from './motion';

/** A drag this far up or down (or a quick flick) changes the dream. */
const SWIPE_DISTANCE = 60;
const SWIPE_SPEED = 0.6;
/** The picture follows the finger, but only part of the way. */
const FOLLOW = 0.35;
/** A new dream slides in from this far away. */
const ENTER = 90;

export type SwipeDirection = 1 | -1;

type SwipeAreaProps = {
  style: StyleProp<ViewStyle>;
  reduceMotion: boolean;
  /** 1 for the next dream (swiped up), -1 for the previous one (swiped down). */
  onSwipe: (direction: SwipeDirection) => void;
  /** Changes whenever the picture should nudge up, showing that it can be swiped. */
  nudgeKey: number;
  children: ReactNode;
};

/**
 * Where the dreams are swiped through, like a feed: up for the next dream, down for the
 * one before. The picture follows the finger a little, and the new one slides in.
 * Taps still reach the buttons inside; only up-and-down drags are taken.
 */
export function SwipeArea({ style, reduceMotion, onSwipe, nudgeKey, children }: SwipeAreaProps) {
  const drag = useSharedValue(0);
  // The last swipe; telling the screen happens in an effect below.
  const [swiped, setSwiped] = useState<{ direction: SwipeDirection } | null>(null);
  const changeDream = useEffectEvent((direction: SwipeDirection) => {
    onSwipe(direction);
    if (reduceMotion) {
      drag.set(0);
      return;
    }
    // Swiping up brings the next dream in from below; down brings the last one from above.
    drag.set(direction * ENTER);
    drag.set(withTiming(0, { duration: 420, easing: Easing.bezier(0.2, 0.8, 0.2, 1) }));
  });

  useEffect(() => {
    if (swiped) changeDream(swiped.direction);
  }, [swiped]);

  useEffect(() => {
    if (nudgeKey === 0 || reduceMotion) return;
    drag.set(
      withDelay(
        500,
        withSequence(
          withTiming(-28, { duration: 320, easing: Easing.out(Easing.quad) }),
          withSpring(0, { damping: 9, stiffness: 140 }),
          withTiming(-14, { duration: 260, easing: Easing.out(Easing.quad) }),
          withSpring(0, { damping: 12, stiffness: 160 })
        )
      )
    );
  }, [nudgeKey, reduceMotion, drag]);

  const [responder] = useState(() => {
    const release = (dy: number, vy: number) => {
      if (dy < -SWIPE_DISTANCE || vy < -SWIPE_SPEED) setSwiped({ direction: 1 });
      else if (dy > SWIPE_DISTANCE || vy > SWIPE_SPEED) setSwiped({ direction: -1 });
      else drag.set(withSpring(0, { damping: 16, stiffness: 180 }));
    };
    return PanResponder.create({
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dy) > 10 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        drag.set(g.dy * FOLLOW);
      },
      onPanResponderRelease: (_, g) => release(g.dy, g.vy),
      onPanResponderTerminate: () => drag.set(withSpring(0)),
      onPanResponderTerminationRequest: () => false,
    });
  });

  const follow = useAnimatedStyle(() => ({
    opacity: 1 - Math.min(Math.abs(drag.get()) / 300, 0.35),
    transform: [{ translateY: drag.get() }],
  }));

  return (
    <View style={[style, styles.clip]} {...responder.panHandlers}>
      <Animated.View style={[StyleSheet.absoluteFill, follow]}>{children}</Animated.View>
    </View>
  );
}

const DOT = {
  '0%': { opacity: 0, transform: [{ translateY: 9 }] },
  '25%': { opacity: 1 },
  '75%': { opacity: 1, transform: [{ translateY: -9 }] },
  '100%': { opacity: 0, transform: [{ translateY: -11 }] },
};

/** A small tip: a finger-dot sliding up a track, and what swiping does. */
export function SwipeHint({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <Animated.View style={[styles.hint, up(reduceMotion, 300, 500)]} accessibilityLiveRegion="polite">
      <View style={styles.track}>
        <Animated.View
          style={[
            styles.dot,
            animate(reduceMotion, { animationName: DOT, animationDuration: 1600, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }),
          ]}
        />
      </View>
      <Text style={styles.hintText}>swipe up for your next dream</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: 'hidden',
  },
  hint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 9,
    paddingLeft: 12,
    paddingRight: 16,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
  },
  track: {
    width: 14,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: BrandColors.lime,
  },
  hintText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
});
