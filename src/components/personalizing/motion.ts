import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { cubicBezier } from 'react-native-reanimated';

// Keyframes shared by the personalizing slides, from the design's CSS (@keyframes pWord, pFade, …).
export const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 12 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };
export const POP = {
  '0%': { opacity: 0, transform: [{ scale: 0.3 }] },
  '70%': { opacity: 1, transform: [{ scale: 1.08 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
export const SLIDE_IN = {
  from: { opacity: 0, transform: [{ translateX: -24 }] },
  to: { opacity: 1, transform: [{ translateX: 0 }] },
};
export const SPIN = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

/** Overshoots a little, then settles (pops and springs in the design). */
export const SPRING = cubicBezier(0.3, 1.4, 0.5, 1);
export const EASE_OUT = cubicBezier(0.2, 0.8, 0.2, 1);

/** The design's animation, or nothing with reduced motion (everything simply shows). */
export function animate(reduceMotion: boolean, style: object) {
  return reduceMotion ? null : { animationFillMode: 'both' as const, ...style };
}

/**
 * The slides are drawn at the design's size (a 390 × 844 phone). On shorter phones the
 * artwork shrinks to fit: put `onLayout` on the space it may fill and scale it by `scale`.
 */
export function useFitScale(designHeight: number) {
  const [scale, setScale] = useState(1);

  function onLayout(event: LayoutChangeEvent) {
    const next = Math.min(1, event.nativeEvent.layout.height / designHeight);
    setScale((current) => (Math.abs(current - next) < 0.01 ? current : next));
  }

  return { scale, onLayout };
}
