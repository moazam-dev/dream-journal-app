import { useEffect, useState } from 'react';

/** Longest a count takes, in steps, however big the number. */
const MAX_STEPS = 16;

/**
 * Counts up (or down) to `target`, one step every `stepMs`, like the numbers ticking up on
 * the Patterns screen. With `skip` (reduced motion) it shows the target straight away.
 */
export function useCountUp(target: number, stepMs: number, skip: boolean): number {
  const [value, setValue] = useState(0);

  useEffect(() => {
    if (skip || value === target) return;
    const timer = setTimeout(() => {
      setValue((current) => {
        const left = target - current;
        const step = Math.max(1, Math.ceil(Math.abs(left) / MAX_STEPS));
        return current + Math.sign(left) * Math.min(step, Math.abs(left));
      });
    }, stepMs);
    return () => clearTimeout(timer);
  }, [value, target, stepMs, skip]);

  return skip ? target : value;
}
