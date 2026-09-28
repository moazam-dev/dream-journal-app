/**
 * The designs stagger each screen's entrance over about two seconds. Onboarding plays those
 * delays at this fraction, so the question and its button are up quickly.
 */
const DELAY_SCALE = 0.35;

type Entrance = { animationDelay?: number } & object;

/** A screen's entrance animation (delay sped up), or nothing with reduced motion (everything simply shows). */
export function entrance(reduceMotion: boolean, style: Entrance) {
  if (reduceMotion) return null;
  const { animationDelay } = style;
  return {
    animationFillMode: 'both' as const,
    ...style,
    ...(animationDelay ? { animationDelay: Math.round(animationDelay * DELAY_SCALE) } : null),
  };
}
