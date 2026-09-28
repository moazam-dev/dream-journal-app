import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { useCapsuleRecorder } from '@/hooks/use-capsule-recorder';
import { capsuleLine, formatClock, LOCK_OPTIONS } from '@/utils/today';

import { ease } from './motion';
import { CardHeading, CardPill, TodayCard } from './today-card';

const RED = '#e05a5a';

type FutureCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  name: string;
  capsuleCount: number;
  /** A finished note, with the index of the chosen lock time in `LOCK_OPTIONS`. */
  onSeal: (recording: { uri: string; seconds: number }, lock: number) => void;
  onOpenCapsule: () => void;
};

/**
 * Card 4: a voice note to future you. Pick how long it stays locked, tap to start
 * recording, tap again to seal it into the time capsule (kept on the phone).
 */
export function FutureCard({ height, active, reduceMotion, name, capsuleCount, onSeal, onOpenCapsule }: FutureCardProps) {
  const [lock, setLock] = useState(2);
  const note = useCapsuleRecorder();
  const holding = note.recording;

  async function toggle() {
    if (!holding) {
      await note.start();
      return;
    }
    const recording = await note.stop();
    if (recording) onSeal(recording, lock);
  }

  return (
    <TodayCard
      height={height}
      active={active}
      reduceMotion={reduceMotion}
      label="note to future you"
      base="#2d3d25"
      gradient="radial-gradient(60% 35% at 72% 20%, #e3d7a6, transparent 70%), radial-gradient(70% 40% at 30% 40%, #8ea56a, transparent 70%)"
      photo="https://picsum.photos/id/1018/600/900"
      glow={{ left: 60, top: 60, width: 260, height: 200, color: '#f0e6b8', opacity: 0.4, drift: 'out', duration: 17000 }}>
      <CardPill label="⧗ note to future you" />
      <CardHeading top={130 / 610} eyebrow="hopes, fears, what you're hoping for." title={`record a message for future ${name}.`} />

      <View style={styles.bottom}>
        <View style={styles.lockGroup}>
          <Text style={styles.small}>unlocks in</Text>
          <View style={styles.segments} accessibilityRole="radiogroup">
            {LOCK_OPTIONS.map(({ label }, i) => {
              const picked = lock === i;
              return (
                <Pressable
                  key={label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: picked, disabled: holding }}
                  disabled={holding}
                  onPress={() => setLock(i)}
                  style={styles.segmentHit}>
                  <Animated.View style={[styles.segment, picked && styles.segmentOn, ease(reduceMotion, ['backgroundColor'], 250)]}>
                    <Text style={[styles.segmentText, { color: picked ? '#111' : '#fff' }]}>{label}</Text>
                  </Animated.View>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={holding ? 'Seal the message' : 'Record a message for later'}
          onPress={toggle}
          style={({ pressed }) => pressed && styles.pressed}>
          <Animated.View style={[styles.hold, { backgroundColor: holding ? '#fff' : 'rgba(255, 255, 255, 0.2)' }, ease(reduceMotion, ['backgroundColor'])]}>
            <Text style={[styles.holdText, { color: holding ? '#111' : '#fff' }]}>
              {holding ? `recording · ${formatClock(note.seconds)} · tap to seal` : 'hold a thought for later'}
            </Text>
            <Animated.View style={[styles.dot, { backgroundColor: holding ? RED : 'rgba(255, 255, 255, 0.28)' }, ease(reduceMotion, ['backgroundColor'])]}>
              <Animated.View
                style={[
                  styles.dotIcon,
                  holding ? { width: 16, height: 16, borderRadius: 4 } : { width: 18, height: 18, borderRadius: 9 },
                  ease(reduceMotion, ['width', 'height', 'borderRadius']),
                ]}
              />
            </Animated.View>
          </Animated.View>
        </Pressable>

        {note.error ? (
          <Text style={[styles.small, styles.capsules]} accessibilityLiveRegion="polite">
            {note.error}
          </Text>
        ) : (
          <Pressable accessibilityRole="link" onPress={onOpenCapsule} hitSlop={8}>
            <Text style={[styles.small, styles.capsules, styles.link]}>{capsuleLine(capsuleCount)}</Text>
          </Pressable>
        )}
      </View>
    </TodayCard>
  );
}

const styles = StyleSheet.create({
  bottom: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 22,
    gap: 12,
  },
  lockGroup: {
    gap: 8,
  },
  small: {
    paddingLeft: 6,
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  segments: {
    flexDirection: 'row',
    gap: 6,
    padding: 4,
    borderRadius: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
  },
  segmentHit: {
    flex: 1,
  },
  segment: {
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  segmentOn: {
    backgroundColor: '#fff',
  },
  segmentText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
  },
  hold: {
    height: 64,
    borderRadius: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingLeft: 22,
    paddingRight: 8,
  },
  holdText: {
    flex: 1,
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 20,
  },
  dot: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotIcon: {
    backgroundColor: '#fff',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  capsules: {
    fontFamily: BrandFonts.regular,
    lineHeight: 17,
  },
  link: {
    textDecorationLine: 'underline',
  },
});
