import { cubicBezier } from 'react-native-reanimated';

import { animate } from '@/components/today/motion';

// Keyframes from the Afterdream Entries design's CSS (@keyframes eUp, eDeal, eMoon, …).

export const UP = {
  from: { opacity: 0, transform: [{ translateY: 16 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
/** A fan card dealt up from below. */
export const DEAL = {
  from: { opacity: 0, transform: [{ translateY: 160 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
/** A calendar night popping in. */
export const MOON = {
  from: { opacity: 0, transform: [{ scale: 0.3 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
};
/** A night's picture spreading out from the middle once it has just been painted. */
export const FILL = {
  from: { opacity: 0.3, transform: [{ scale: 0 }] },
  to: { opacity: 1, transform: [{ scale: 1 }] },
};
export const SHIMMER = {
  from: { transform: [{ translateX: '-100%' }] },
  to: { transform: [{ translateX: '250%' }] },
};
export const TWINKLE = {
  '0%': { opacity: 0.15 },
  '50%': { opacity: 0.7 },
  '100%': { opacity: 0.15 },
};

export const OUT = cubicBezier(0.2, 0.8, 0.2, 1);

/** Rises into place (`eUp`), `delay` ms in. */
export function up(reduceMotion: boolean, delay = 0, duration = 600, easing: object | string = 'ease') {
  return animate(reduceMotion, { animationName: UP, animationDuration: duration, animationDelay: delay, animationTimingFunction: easing });
}
