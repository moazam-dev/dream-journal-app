import { cubicBezier } from 'react-native-reanimated';

import { animate } from '@/components/today/motion';

// Motion for the Afterdream Patterns v3 screen: cards rise into place, the "new" dot breathes.

export const UP = {
  from: { opacity: 0, transform: [{ translateY: 18 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const DOT = {
  '0%': { opacity: 0.35 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.35 },
};
export const FADE_IN = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

export const OUT = cubicBezier(0.2, 0.8, 0.2, 1);

/** Rises into place, `delay` ms in. */
export function up(reduceMotion: boolean, delay = 0, duration = 560) {
  return animate(reduceMotion, { animationName: UP, animationDuration: duration, animationDelay: delay, animationTimingFunction: OUT });
}

/** Fades in, `delay` ms in (text that arrives once the reading is ready). */
export function fadeIn(reduceMotion: boolean, delay = 0, duration = 500) {
  return animate(reduceMotion, { animationName: FADE_IN, animationDuration: duration, animationDelay: delay, animationTimingFunction: 'ease' });
}

/** An endless animation (the breathing dot). */
export function forever(reduceMotion: boolean, name: object, duration: number, easing: object | string = 'ease-in-out') {
  return animate(reduceMotion, {
    animationName: name,
    animationDuration: duration,
    animationTimingFunction: easing,
    animationIterationCount: 'infinite',
  });
}
