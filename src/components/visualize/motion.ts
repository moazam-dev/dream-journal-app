import { cubicBezier } from 'react-native-reanimated';

import { animate } from '@/components/today/motion';

// Keyframes from the Afterdream Visualize design's CSS (@keyframes vDevelop, vChar, …),
// made quicker so the picture comes up fast and then stays still.

/** The picture fades up out of the dark. It doesn't move, so it ends sharp and still. */
export const DEVELOP = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};
/**
 * The design also blurs, brightens and greys the picture as it develops (a CSS filter).
 * Phones can't filter an image like that, so a blurred copy, a white wash and a grey
 * layer sit on top and fade away instead.
 */
export const UNBLUR = {
  '0%': { opacity: 1 },
  '45%': { opacity: 0.6 },
  '100%': { opacity: 0 },
};
export const WASH = {
  '0%': { opacity: 0.55 },
  '45%': { opacity: 0.2 },
  '100%': { opacity: 0 },
};
export const CHAR_IN = { from: { opacity: 0 }, to: { opacity: 1 } };
export const UP = {
  from: { opacity: 0, transform: [{ translateY: 14 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const TICK = { from: { transform: [{ scaleY: 0 }] }, to: { transform: [{ scaleY: 1 }] } };
export const PROGRESS = { from: { transform: [{ scaleX: 0 }] }, to: { transform: [{ scaleX: 1 }] } };
export const BREATHE = {
  '0%': { opacity: 0.35 },
  '50%': { opacity: 0.85 },
  '100%': { opacity: 0.35 },
};

export const DEVELOP_MS = 900;
export const DEVELOP_EASE = cubicBezier(0.4, 0, 0.2, 1);
const DUST_EASE = cubicBezier(0.5, 0, 0.7, 0.4);

/** The keyframes for one letter blowing away as dust, towards (`dx`, `dy`). */
export function dust(dx: number, dy: number) {
  return {
    from: { opacity: 1, transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
    to: { opacity: 0, transform: [{ translateX: dx }, { translateY: dy }, { scale: 0.4 }] },
  };
}

/** One letter's fade in (the design's `vChar`), starting `delay` seconds in. */
export function charIn(reduceMotion: boolean, delay: number) {
  return animate(reduceMotion, { animationName: CHAR_IN, animationDuration: 180, animationDelay: delay * 1000, animationTimingFunction: 'ease' });
}

/** One letter drifting away (quicker than the design's `vDust 1.1s`), starting `delay` seconds in. */
export function dustOut(reduceMotion: boolean, keyframes: object, delay: number) {
  return animate(reduceMotion, { animationName: keyframes, animationDuration: 600, animationDelay: delay * 1000, animationTimingFunction: DUST_EASE });
}

/** Rises into place after `delay` ms (the design's `vUp`). */
export function up(reduceMotion: boolean, delay: number, duration: number) {
  return animate(reduceMotion, { animationName: UP, animationDuration: duration, animationDelay: delay, animationTimingFunction: 'ease' });
}
