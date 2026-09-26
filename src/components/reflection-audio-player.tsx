import type { Dispatch, SetStateAction } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useReflectionAudio } from '@/hooks/use-reflection-audio';
import type { Dream } from '@/types/dream';

type ReflectionAudioPlayerProps = {
  dream: Dream;
  setDream: Dispatch<SetStateAction<Dream | null>>;
};

/** "Listen to reflection" card: creates the spoken reflection on first tap, then plays it. */
export function ReflectionAudioPlayer({ dream, setDream }: ReflectionAudioPlayerProps) {
  const audio = useReflectionAudio(dream, setDream);

  // Nothing to read aloud until the Groq reflection exists.
  if (dream.analysis_status !== 'completed') return null;

  const failed = !audio.generating && (!!audio.error || (!audio.hasAudio && dream.audio_status === 'failed'));

  function mainButtonTitle() {
    if (audio.generating) return 'Creating audio reflection…';
    if (audio.loading) return 'Loading audio…';
    if (audio.playing) return 'Pause';
    if (failed) return 'Try again';
    if (audio.hasStarted) return 'Resume';
    if (audio.isAtEnd) return 'Listen again';
    return 'Listen to reflection';
  }

  const showProgress = audio.hasAudio && audio.duration > 0;
  const showStop = audio.hasAudio && (audio.playing || audio.hasStarted);

  return (
    <View style={styles.card}>
      <Text style={styles.heading}>Audio Reflection</Text>

      {failed ? (
        <Text style={styles.muted}>
          {audio.error ?? 'We couldn’t create the audio this time.'} Your dream and reflection are safely saved.
        </Text>
      ) : (
        <Text style={styles.muted}>
          {audio.generating
            ? 'Turning your reflection into a calm spoken version. This takes a few seconds.'
            : 'Hear your reflection read aloud.'}
        </Text>
      )}

      {showProgress && (
        <View style={styles.progressRow}>
          <View style={styles.track}>
            <View style={[styles.fill, { width: `${(audio.position / audio.duration) * 100}%` }]} />
          </View>
          <Text style={styles.time}>
            {formatTime(audio.position)} / {formatTime(audio.duration)}
          </Text>
        </View>
      )}

      <View style={styles.buttons}>
        <View style={styles.mainButton}>
          <AppButton
            title={mainButtonTitle()}
            onPress={audio.playing ? audio.pause : audio.play}
            loading={audio.generating || audio.loading}
            variant={failed ? 'secondary' : 'primary'}
          />
        </View>
        {showStop && <AppButton title="Stop" variant="secondary" onPress={audio.stop} />}
      </View>
    </View>
  );
}

/** 75.4 → "1:15" */
function formatTime(seconds: number) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  heading: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  muted: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.textSecondary,
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  track: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    backgroundColor: Colors.primary,
  },
  time: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontVariant: ['tabular-nums'],
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mainButton: {
    flex: 1,
  },
});
