import { cubicBezier } from 'react-native-reanimated';

// Keyframes from the Afterdream Today design's CSS (@keyframes tDrift, tZoom, …).
export const DRIFT = {
  '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
  '50%': { transform: [{ translateX: 24 }, { translateY: -18 }, { scale: 1.12 }] },
  '100%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1 }] },
};
export const DRIFT_BACK = {
  '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.05 }] },
  '50%': { transform: [{ translateX: -28 }, { translateY: 20 }, { scale: 0.95 }] },
  '100%': { transform: [{ translateX: 0 }, { translateY: 0 }, { scale: 1.05 }] },
};
export const ZOOM = {
  '0%': { transform: [{ scale: 1.1 }, { translateX: 0 }, { translateY: 0 }] },
  '50%': { transform: [{ scale: 1.22 }, { translateX: -10 }, { translateY: 8 }] },
  '100%': { transform: [{ scale: 1.1 }, { translateX: 0 }, { translateY: 0 }] },
};
export const RISE = {
  from: { opacity: 0, transform: [{ translateY: 18 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const BAR = {
  '0%': { transform: [{ scaleY: 0.3 }] },
  '50%': { transform: [{ scaleY: 1 }] },
  '100%': { transform: [{ scaleY: 0.3 }] },
};
export const PULSE = {
  from: { opacity: 0.5, transform: [{ scale: 1 }] },
  to: { opacity: 0, transform: [{ scale: 1.7 }] },
};
export const CARET = {
  '0%': { opacity: 1 },
  '49%': { opacity: 1 },
  '50%': { opacity: 0 },
  '100%': { opacity: 0 },
};
export const TOAST = {
  '0%': { opacity: 0, transform: [{ translateY: 10 }] },
  '15%': { opacity: 1, transform: [{ translateY: 0 }] },
  '85%': { opacity: 1, transform: [{ translateY: 0 }] },
  '100%': { opacity: 0, transform: [{ translateY: 10 }] },
};
export const BUBBLE_IN = {
  from: { opacity: 0, transform: [{ translateY: 10 }, { scale: 0.9 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};

export const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };
export const ORB = {
  '0%': { opacity: 0.9, transform: [{ scale: 1 }] },
  '50%': { opacity: 1, transform: [{ scale: 1.18 }] },
  '100%': { opacity: 0.9, transform: [{ scale: 1 }] },
};
export const RING = {
  from: { opacity: 0.6, transform: [{ scale: 0.6 }] },
  to: { opacity: 0, transform: [{ scale: 2.2 }] },
};
export const LOCK = {
  '0%': { opacity: 0, transform: [{ scale: 0.4 }, { rotate: '-20deg' }] },
  '60%': { opacity: 1, transform: [{ scale: 1.1 }, { rotate: '4deg' }] },
  '100%': { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }] },
};
export const SPIN = {
  from: { transform: [{ rotate: '0deg' }] },
  to: { transform: [{ rotate: '360deg' }] },
};

export const EASE_OUT = cubicBezier(0.2, 0.8, 0.2, 1);
export const SPRING = cubicBezier(0.3, 1.5, 0.5, 1);

/** Rises into place after `delay` ms (the design's `tUp .6s ease <delay> both`). */
export function rise(reduceMotion: boolean, delay: number, duration = 600) {
  return animate(reduceMotion, { animationName: RISE, animationDuration: duration, animationDelay: delay, animationTimingFunction: 'ease' });
}

/** The design's animation, or nothing with reduced motion (everything simply shows). */
export function animate(reduceMotion: boolean, style: object) {
  return reduceMotion ? null : { animationFillMode: 'both' as const, ...style };
}

/** A slow, endless, back-and-forth animation (the drifting glows and zooming photos). */
export function loop(reduceMotion: boolean, name: object, duration: number) {
  return animate(reduceMotion, {
    animationName: name,
    animationDuration: duration,
    animationTimingFunction: 'ease-in-out',
    animationIterationCount: 'infinite',
  });
}

/** Smoothly changes colours and sizes, like the design's `transition: … .3s ease`. */
export function ease(reduceMotion: boolean, properties: string[], duration = 300) {
  return reduceMotion
    ? null
    : { transitionProperty: properties, transitionDuration: duration, transitionTimingFunction: 'ease' as const };
}
