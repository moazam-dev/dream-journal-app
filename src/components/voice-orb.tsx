import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { VoiceColors } from '@/constants/theme';
import type { VoiceStatus } from '@/lib/deepgram/types';

type VoiceOrbProps = {
  status: VoiceStatus;
  muted: boolean;
  /** Microphone level 0–1 (makes the orb react while you talk). */
  inputLevel: SharedValue<number>;
  /** Agent voice level 0–1 (makes the orb pulse while the companion talks). */
  outputLevel: SharedValue<number>;
  size?: number;
};

/** How fast the orb "breathes" in each state (ms per breath). 0 = still. */
const BREATH_MS: Record<VoiceStatus, number> = {
  idle: 3200,
  connecting: 1400,
  listening: 2600,
  thinking: 1100,
  speaking: 1800,
  error: 0,
  ended: 3200,
};

/** Which audio level drives the orb: none, the microphone, or the agent's voice. */
const LEVEL_SOURCE = { none: 0, input: 1, output: 2 } as const;

function orbColor(status: VoiceStatus, muted: boolean) {
  if (status === 'listening' && muted) return VoiceColors.muted;
  if (status === 'ended') return VoiceColors.idle;
  return VoiceColors[status];
}

/** The glowing, breathing orb at the centre of the voice screen. */
export function VoiceOrb({ status, muted, inputLevel, outputLevel, size = 170 }: VoiceOrbProps) {
  const breath = useSharedValue(0);
  const levelSource = useSharedValue<number>(LEVEL_SOURCE.none);

  // Restart the breathing loop at the speed that fits the current state.
  useEffect(() => {
    const duration = BREATH_MS[status];
    cancelAnimation(breath);
    if (duration === 0) {
      breath.set(withTiming(0, { duration: 400 }));
      return;
    }
    breath.set(0);
    breath.set(
      withRepeat(withTiming(1, { duration, easing: Easing.inOut(Easing.sin) }), -1, true)
    );
  }, [status, breath]);

  useEffect(() => {
    if (status === 'speaking') levelSource.set(LEVEL_SOURCE.output);
    else if (status === 'listening' && !muted) levelSource.set(LEVEL_SOURCE.input);
    else levelSource.set(LEVEL_SOURCE.none);
  }, [status, muted, levelSource]);

  // Smoothed live audio level, so the orb moves softly instead of jittering.
  const level = useDerivedValue(() => {
    const source = levelSource.get();
    const raw =
      source === LEVEL_SOURCE.output
        ? outputLevel.get()
        : source === LEVEL_SOURCE.input
          ? inputLevel.get()
          : 0;
    return withTiming(Math.min(1, raw * 1.6), { duration: 120 });
  });

  const coreStyle = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + breath.get() * 0.05 + level.get() * 0.18 }],
  }));
  const innerGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + breath.get() * 0.15 + level.get() * 0.3,
    transform: [{ scale: 1.18 + breath.get() * 0.08 + level.get() * 0.3 }],
  }));
  const outerGlowStyle = useAnimatedStyle(() => ({
    opacity: 0.12 + breath.get() * 0.1 + level.get() * 0.25,
    transform: [{ scale: 1.45 + breath.get() * 0.12 + level.get() * 0.45 }],
  }));

  const color = orbColor(status, muted);
  const circle = { width: size, height: size, borderRadius: size / 2 };

  return (
    // The glow grows beyond the orb, so leave room around it.
    <View style={[styles.container, { width: size * 1.8, height: size * 1.8 }]} pointerEvents="none">
      <Animated.View style={[styles.layer, circle, { backgroundColor: color }, outerGlowStyle]} />
      <Animated.View style={[styles.layer, circle, { backgroundColor: color }, innerGlowStyle]} />
      <Animated.View style={[styles.layer, circle, styles.core, { backgroundColor: color }, coreStyle]}>
        {/* A soft highlight gives the orb some depth. */}
        <View
          style={[
            styles.highlight,
            { width: size * 0.55, height: size * 0.55, borderRadius: size * 0.275 },
          ]}
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  layer: {
    position: 'absolute',
  },
  core: {
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#FFFFFF',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 0 },
  },
  highlight: {
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    transform: [{ translateX: -18 }, { translateY: -22 }],
  },
});
