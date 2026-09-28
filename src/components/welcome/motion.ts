import { useEffect } from 'react';
import {
  Easing,
  useSharedValue,
  withDelay,
  withTiming,
  type WithTimingConfig,
} from 'react-native-reanimated';

/**
 * Timing curves from the Afterdream welcome design (its CSS `cubic-bezier(...)` values),
 * so the app moves exactly like the design prototype.
 */
export const WelcomeEasing = {
  /** Eyelids opening and blinking. */
  lid: Easing.bezier(0.7, 0, 0.2, 1),
  /** Logo and title coming into focus. */
  focus: Easing.bezier(0.2, 0.7, 0.2, 1),
  /** Small divider line drawing out from the middle. */
  line: Easing.bezier(0.6, 0, 0.2, 1),
  /** Main button rising into place. */
  rise: Easing.bezier(0.2, 0.8, 0.2, 1),
  /** CSS `ease`. */
  ease: Easing.bezier(0.25, 0.1, 0.25, 1),
  /** CSS `ease-in-out`. */
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
};

/**
 * A 0 → 1 progress value that starts after `delay` ms and runs for `duration` ms.
 * With reduced motion it is 1 from the start, so everything simply appears.
 */
export function useEntrance(delay: number, duration: number, easing: WithTimingConfig['easing'], reduceMotion: boolean) {
  const progress = useSharedValue(reduceMotion ? 1 : 0);

  useEffect(() => {
    if (reduceMotion) return;
    progress.set(withDelay(delay, withTiming(1, { duration, easing })));
  }, [reduceMotion, delay, duration, easing, progress]);

  return progress;
}
