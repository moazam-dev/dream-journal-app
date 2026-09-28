// Keyframes from the Afterdream Garden v2 design's CSS (@keyframes gUp, gPop, …).
export const UP = {
  from: { opacity: 0, transform: [{ translateY: 24 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
export const POP = {
  from: { opacity: 0, transform: [{ translateY: -8 }, { scale: 0.96 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
export const BANNER = {
  '0%': { opacity: 0, transform: [{ translateY: 12 }, { scale: 0.94 }] },
  '14%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  '82%': { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
  '100%': { opacity: 0, transform: [{ translateY: -8 }, { scale: 1 }] },
};
export const TOAST = {
  '0%': { opacity: 0, transform: [{ translateY: 10 }] },
  '12%': { opacity: 1, transform: [{ translateY: 0 }] },
  '86%': { opacity: 1, transform: [{ translateY: 0 }] },
  '100%': { opacity: 0, transform: [{ translateY: 10 }] },
};
export const BREATH = {
  '0%': { opacity: 0.55 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.55 },
};
