import { cubicBezier } from 'react-native-reanimated';

import { animate } from '@/components/today/motion';

// Keyframes from the Afterdream Patterns design's CSS (@keyframes pUp, pSpin, pBar, …).

export const UP = {
  from: { opacity: 0, transform: [{ translateY: 20 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const SPIN = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};
export const SPIN_BACK = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '-360deg' }] },
};
export const BREATHE = {
  '0%': { transform: [{ scale: 1 }] },
  '50%': { transform: [{ scale: 1.07 }] },
  '100%': { transform: [{ scale: 1 }] },
};
/** A bar growing up from the bottom. */
export const GROW = {
  from: { transform: [{ scaleY: 0 }] },
  to: { transform: [{ scaleY: 1 }] },
};
/** A mood bar growing and fading in. */
export const CAP = {
  from: { opacity: 0, transform: [{ scaleY: 0 }] },
  to: { opacity: 1, transform: [{ scaleY: 1 }] },
};
/** A theme word drifting up into place (the design also unblurs it). */
export const WORD = {
  from: { opacity: 0, transform: [{ translateY: 14 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const OPEN = {
  from: { opacity: 0, transform: [{ translateY: -6 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const SCAN = {
  from: { transform: [{ translateX: '-100%' }] },
  to: { transform: [{ translateX: '250%' }] },
};
export const DOT = {
  '0%': { opacity: 0.3 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.3 },
};
export const FLOAT = {
  '0%': { transform: [{ translateY: 0 }] },
  '50%': { transform: [{ translateY: -6 }] },
  '100%': { transform: [{ translateY: 0 }] },
};

export const OUT = cubicBezier(0.2, 0.8, 0.2, 1);
/** Bars overshoot a little as they grow. */
export const BOUNCE = cubicBezier(0.3, 1.4, 0.5, 1);
/** The sliding white pill in the overview / dive deeper switch. */
export const SLIDE = cubicBezier(0.3, 1.2, 0.4, 1);

/** Rises into place (`pUp`), `delay` ms in. */
export function up(reduceMotion: boolean, delay = 0, duration = 600, easing: object | string = 'ease') {
  return animate(reduceMotion, { animationName: UP, animationDuration: duration, animationDelay: delay, animationTimingFunction: easing });
}

/** An endless animation (spins, breathing, floating). */
export function forever(reduceMotion: boolean, name: object, duration: number, easing: object | string = 'linear', delay = 0) {
  return animate(reduceMotion, {
    animationName: name,
    animationDuration: duration,
    animationDelay: delay,
    animationTimingFunction: easing,
    animationIterationCount: 'infinite',
  });
}
