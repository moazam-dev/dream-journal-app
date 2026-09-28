import { StyleSheet, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { BrandColors, NightColors } from '@/constants/theme';

type ProgressBarProps = {
  /** How many onboarding steps there are. */
  steps: number;
  /** The step on screen now (1-based). Earlier steps are full, this one fills in. */
  current: number;
  reduceMotion: boolean;
};

const FILL = {
  from: { transform: [{ scaleX: 0 }] },
  to: { transform: [{ scaleX: 1 }] },
};

/** Onboarding progress: one thin segment per step, the current one filling from the left. */
export function ProgressBar({ steps, current, reduceMotion }: ProgressBarProps) {
  return (
    <View
      style={styles.row}
      accessible
      accessibilityRole="progressbar"
      accessibilityLabel={`Step ${current} of ${steps}`}>
      {Array.from({ length: steps }, (_, k) => {
        const step = k + 1;
        return (
          <View key={step} style={styles.segment}>
            {step <= current && (
              <Animated.View
                style={[
                  styles.fill,
                  step === current &&
                    !reduceMotion && {
                      animationName: FILL,
                      animationDuration: 800,
                      animationDelay: 300,
                      animationTimingFunction: cubicBezier(0.6, 0, 0.2, 1),
                      animationFillMode: 'both',
                    },
                ]}
              />
            )}
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
  },
  segment: {
    flex: 1,
    height: 3,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: NightColors.track,
  },
  fill: {
    flex: 1,
    backgroundColor: BrandColors.lime,
    transformOrigin: 'left',
  },
});
