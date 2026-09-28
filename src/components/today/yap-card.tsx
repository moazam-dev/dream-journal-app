import { useRef } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { useDreamRecorder } from '@/hooks/use-dream-recorder';
import { formatClock } from '@/utils/today';

import { animate, BAR, ease, PULSE } from './motion';
import { CardHeading, CardPill, TodayCard } from './today-card';

const BARS = Array.from({ length: 22 }, (_, i) => ((i * 37) % 10) * 100);
const RED = '#e05a5a';

type YapCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  /** Called with what they said (once it has been turned into text) and how long they talked. */
  onSubmit: (text: string, seconds: number) => void;
};

/** Card 2: one big button to say the dream out loud. Stopping sends it to be interpreted. */
export function YapCard({ height, active, reduceMotion, onSubmit }: YapCardProps) {
  // How long the last recording ran, read when it stops (the recorder resets after).
  const spoken = useRef(0);
  const voice = useDreamRecorder((text) => onSubmit(text, spoken.current));
  const recording = voice.phase === 'recording';
  const busy = voice.phase === 'transcribing';

  function stop() {
    spoken.current = voice.durationMillis / 1000;
    voice.stopAndTranscribe();
  }

  function label() {
    if (recording) return `recording · ${formatClock(voice.durationMillis / 1000)} · tap to stop`;
    if (busy) return 'catching your words…';
    return voice.error ?? 'tap and talk';
  }

  return (
    <TodayCard
      height={height}
      active={active}
      reduceMotion={reduceMotion}
      label="just yap"
      base="#141d3a"
      gradient="radial-gradient(55% 35% at 78% 22%, #8e9fd6, transparent 70%), radial-gradient(80% 50% at 25% 45%, #34477f, transparent 70%)"
      photo="https://picsum.photos/id/1036/600/900"
      glow={{ left: -40, top: 120, width: 220, height: 220, color: '#4b5fa6', opacity: 0.6, drift: 'back', duration: 16000 }}>
      <CardPill step={2} stepColor="#141d3a" label="just yap" />
      <CardHeading top={180 / 610} eyebrow="still half asleep? same." title="say it out loud before it slips away." />

      <View style={styles.controls}>
        <View style={[styles.wave, { opacity: recording ? 1 : 0.3 }, ease(reduceMotion, ['opacity'])]}>
          {BARS.map((delay, i) => (
            <Animated.View
              key={i}
              style={[
                styles.bar,
                animate(reduceMotion, {
                  animationName: BAR,
                  animationDuration: 1000,
                  animationDelay: delay,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                  animationPlayState: recording ? 'running' : 'paused',
                }),
              ]}
            />
          ))}
        </View>

        <View style={styles.micWrap}>
          {recording && !reduceMotion && (
            <Animated.View
              style={[
                styles.ring,
                { animationName: PULSE, animationDuration: 1600, animationTimingFunction: 'ease-out', animationIterationCount: 'infinite' },
              ]}
            />
          )}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={recording ? 'Stop recording' : 'Record your dream'}
            accessibilityState={{ busy }}
            disabled={busy}
            onPress={recording ? stop : voice.start}
            style={({ pressed }) => pressed && styles.pressed}>
            <Animated.View
              style={[styles.mic, { backgroundColor: recording ? '#fff' : 'rgba(255, 255, 255, 0.22)' }, ease(reduceMotion, ['backgroundColor'])]}>
              <Animated.View
                style={[
                  recording
                    ? { width: 26, height: 26, borderRadius: 6, backgroundColor: RED }
                    : { width: 30, height: 30, borderRadius: 15, backgroundColor: '#fff' },
                  busy && styles.busy,
                  ease(reduceMotion, ['width', 'height', 'borderRadius', 'backgroundColor', 'opacity']),
                ]}
              />
            </Animated.View>
          </Pressable>
        </View>

        <Text style={styles.label} accessibilityLiveRegion="polite">
          {label()}
        </Text>
      </View>
    </TodayCard>
  );
}

const styles = StyleSheet.create({
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    alignItems: 'center',
    gap: 18,
  },
  wave: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  bar: {
    width: 4,
    height: 40,
    borderRadius: 2,
    backgroundColor: '#fff',
    transform: [{ scaleY: 0.3 }],
  },
  micWrap: {
    width: 96,
    height: 96,
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 48,
    backgroundColor: '#fff',
  },
  mic: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  busy: {
    opacity: 0.4,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  label: {
    marginHorizontal: 24,
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#fff',
  },
});
