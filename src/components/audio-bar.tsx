import type { Dispatch, SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { animate, BAR, SPIN } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';
import { useReflectionAudio } from '@/hooks/use-reflection-audio';
import type { Dream } from '@/types/dream';
import { formatClock } from '@/utils/today';

/** Height of the bar, for the space screens leave above or below it. */
export const AUDIO_BAR_HEIGHT = 64;
/** How often expo-audio reports the position: the progress eases across each gap. */
const TICK_MS = 500;

type AudioBarProps = {
  dream: Dream;
  setDream: Dispatch<SetStateAction<Dream | null>>;
  reduceMotion: boolean;
};

/**
 * The rounded white player at the bottom of a dream's reading: play/pause, a progress line
 * that fills as it plays, and the time. The reading is read aloud on the server the first
 * time it's played, then kept. Shows nothing until the dream has been read.
 */
export function AudioBar({ dream, setDream, reduceMotion }: AudioBarProps) {
  const audio = useReflectionAudio(dream, setDream);

  if (dream.analysis_status !== 'completed') return null;

  const busy = audio.generating || audio.loading;
  const failed = !busy && (!!audio.error || (!audio.hasAudio && dream.audio_status === 'failed'));
  const progress = audio.duration > 0 ? Math.min(1, audio.position / audio.duration) : 0;

  let label = 'listen to your reflection';
  if (audio.generating) label = 'finding the right voice…';
  else if (audio.loading) label = 'getting it ready…';
  else if (failed) label = 'couldn’t play it — tap to try again';

  let time = '';
  if (audio.duration > 0) time = audio.hasStarted || audio.playing ? `${formatClock(audio.position)} / ${formatClock(audio.duration)}` : formatClock(audio.duration);

  return (
    <View style={styles.bar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={audio.playing ? 'Pause reflection' : 'Play reflection'}
        accessibilityState={{ busy, disabled: busy }}
        disabled={busy}
        hitSlop={6}
        onPress={audio.playing ? audio.pause : audio.play}
        style={({ pressed }) => [styles.play, pressed && styles.pressed]}>
        {busy && (
          <Animated.View
            style={[
              styles.spinner,
              animate(reduceMotion, { animationName: SPIN, animationDuration: 900, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }),
            ]}
          />
        )}
        {audio.playing ? <PauseIcon /> : <PlayIcon dim={busy} />}
      </Pressable>

      <View style={styles.middle}>
        <View style={styles.titleRow}>
          <Text style={[styles.label, failed && styles.labelFailed]} numberOfLines={1} accessibilityLiveRegion="polite">
            {label}
          </Text>
          {audio.playing && <Equalizer reduceMotion={reduceMotion} />}
        </View>
        <View
          style={styles.track}
          accessibilityRole="progressbar"
          accessibilityValue={{ min: 0, max: Math.round(audio.duration), now: Math.round(audio.position) }}>
          <Animated.View
            style={[
              styles.fill,
              { width: `${progress * 100}%` },
              // Linear across each position report, so the line glides instead of stepping.
              !reduceMotion && audio.playing && { transitionProperty: 'width', transitionDuration: TICK_MS, transitionTimingFunction: 'linear' },
            ]}
          />
        </View>
      </View>

      {!!time && <Text style={styles.time}>{time}</Text>}
    </View>
  );
}

/** Three little bars bouncing while it plays. */
function Equalizer({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View style={styles.eq} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {[0, 180, 360].map((delay) => (
        <Animated.View
          key={delay}
          style={[
            styles.eqBar,
            animate(reduceMotion, {
              animationName: BAR,
              animationDuration: 800,
              animationDelay: delay,
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }),
          ]}
        />
      ))}
    </View>
  );
}

function PlayIcon({ dim }: { dim: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" opacity={dim ? 0.35 : 1}>
      <Path d="M5 3.2v11.6c0 .8.9 1.3 1.6.9l9-5.8c.6-.4.6-1.3 0-1.7l-9-5.8C5.9 1.9 5 2.4 5 3.2z" fill="#fff" />
    </Svg>
  );
}

function PauseIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <Rect x={3.5} y={2.5} width={4} height={13} rx={1.4} fill="#fff" />
      <Rect x={10.5} y={2.5} width={4} height={13} rx={1.4} fill="#fff" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: AUDIO_BAR_HEIGHT,
    borderRadius: AUDIO_BAR_HEIGHT / 2,
    borderCurve: 'continuous',
    paddingLeft: 8,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: '#fff',
    boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
  },
  play: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  pressed: {
    transform: [{ scale: 0.92 }],
  },
  spinner: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: 21,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.15)',
    borderTopColor: '#fff',
  },
  middle: {
    flex: 1,
    gap: 9,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    flexShrink: 1,
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  labelFailed: {
    color: '#B4412F',
  },
  eq: {
    height: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  eqBar: {
    width: 3,
    height: 12,
    borderRadius: 1.5,
    backgroundColor: '#111',
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(0,0,0,0.1)',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
    backgroundColor: '#111',
  },
  time: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(0,0,0,0.55)',
    fontVariant: ['tabular-nums'],
  },
});
