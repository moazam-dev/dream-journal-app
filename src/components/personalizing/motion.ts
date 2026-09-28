import { useState } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { cubicBezier } from 'react-native-reanimated';

// Keyframes shared by the personalizing slides, from the design's CSS (@keyframes pWord, pFade, …).
export const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 16 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const SOFT_IN = {
  from: { opacity: 0, transform: [{ translateY: 20 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const ROW_IN = {
  from: { opacity: 0, transform: [{ translateY: 24 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const CENTER_IN = {
  from: { opacity: 0, transform: [{ translateY: 60 }, { scale: 0.9 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
export const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };
export const POP = {
  '0%': { opacity: 0, transform: [{ scale: 0.6 }] },
  '70%': { opacity: 1, transform: [{ scale: 1.05 }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }] },
};
/** Slow, endless swell of a card. */
export const BREATHE = {
  '0%': { transform: [{ scale: 1 }] },
  '50%': { transform: [{ scale: 1.025 }] },
  '100%': { transform: [{ scale: 1 }] },
};
/** An eye closing for a moment every few seconds. */
export const BLINK = {
  '0%': { transform: [{ scaleY: 1 }] },
  '92%': { transform: [{ scaleY: 1 }] },
  '96%': { transform: [{ scaleY: 0.1 }] },
  '100%': { transform: [{ scaleY: 1 }] },
};

/**
 * The design's wobbling blob (@keyframes pMorph). The CSS uses elliptical percentage radii,
 * which React Native doesn't have, so each corner gets a round radius picked for `size`.
 */
export function morph(width: number, height: number) {
  const side = Math.min(width, height);
  const corners = (tl: number, tr: number, br: number, bl: number, rotate: string) => ({
    borderTopLeftRadius: side * tl,
    borderTopRightRadius: side * tr,
    borderBottomRightRadius: side * br,
    borderBottomLeftRadius: side * bl,
    transform: [{ rotate }],
  });
  return {
    '0%': corners(0.53, 0.45, 0.46, 0.48, '0deg'),
    '50%': corners(0.44, 0.5, 0.43, 0.5, '25deg'),
    '100%': corners(0.53, 0.45, 0.46, 0.48, '0deg'),
  };
}

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
