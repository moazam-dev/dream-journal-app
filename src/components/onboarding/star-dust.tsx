import { StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandColors } from '@/constants/theme';

const TWINKLE = {
  '0%': { opacity: 0.15 },
  '50%': { opacity: 0.8 },
  '100%': { opacity: 0.15 },
};
const TWINKLE_MS = 3400;

type StarDustProps = {
  top: number;
  reduceMotion: boolean;
  /** How many specks. */
  count?: number;
  /** Height of the band (pt) they're scattered over. */
  spread?: number;
  color?: string;
};

/** Scattered the same way every time (from the design), so the sky doesn't jump between visits. */
function stars(count: number, spread: number) {
  return Array.from({ length: count }, (_, i) => ({
    x: (i * 83 + 17) % 380,
    y: 110 + ((i * 131) % spread),
    delay: ((i * 0.41) % 3.4) * 1000,
  }));
}

const LIME_STARS = stars(22, 400);

/** Tiny specks (lime unless told otherwise) twinkling in the background. With reduced motion they hold still. */
export function StarDust({ top, reduceMotion, count, spread, color }: StarDustProps) {
  const list = count === undefined && spread === undefined ? LIME_STARS : stars(count ?? 22, spread ?? 400);
  return (
    <>
      {list.map((s) => (
        <Animated.View
          key={`${s.x}-${s.y}`}
          pointerEvents="none"
          style={[
            styles.star,
            { left: s.x, top: top + s.y },
            color !== undefined && { backgroundColor: color },
            reduceMotion
              ? styles.still
              : {
                  animationName: TWINKLE,
                  animationDuration: TWINKLE_MS,
                  animationDelay: s.delay,
                  animationIterationCount: 'infinite',
                  animationTimingFunction: 'ease-in-out',
                  animationFillMode: 'both',
                },
          ]}
        />
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: BrandColors.lime,
  },
  still: {
    opacity: 0.4,
  },
});
