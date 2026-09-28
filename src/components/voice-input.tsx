import { StyleSheet, Text, View } from 'react-native';

import { AppButton } from '@/components/app-button';
import { Colors, Radius, Spacing } from '@/constants/theme';
import type { RecorderPhase } from '@/hooks/use-dream-recorder';

type VoiceInputProps = {
  phase: RecorderPhase;
  durationMillis: number;
  error: string | null;
  disabled?: boolean;
  onStart: () => void;
  onStop: () => void;
  onCancel: () => void;
};

/** "Speak your dream" control on the Record Dream screen. */
export function VoiceInput({
  phase,
  durationMillis,
  error,
  disabled = false,
  onStart,
  onStop,
  onCancel,
}: VoiceInputProps) {
  if (phase === 'recording') {
    return (
      <View style={styles.card}>
        <View style={styles.recordingRow}>
          <View style={styles.dot} />
          <Text style={styles.recordingText}>Recording… {formatDuration(durationMillis)}</Text>
        </View>
        <Text style={styles.muted}>Describe your dream out loud. Tap Stop when you’re done.</Text>
        <View style={styles.buttons}>
          <View style={styles.mainButton}>
            <AppButton title="Stop" onPress={onStop} />
          </View>
          <AppButton title="Cancel" variant="secondary" onPress={onCancel} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.idle}>
      <AppButton
        title={phase === 'transcribing' ? 'Turning your words into text…' : '🎙  Speak your dream'}
        variant="secondary"
        onPress={onStart}
        loading={phase === 'transcribing'}
        disabled={disabled}
      />
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

/** 75_400 ms → "1:15" */
function formatDuration(ms: number) {
  const seconds = Math.floor(ms / 1000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

const styles = StyleSheet.create({
  idle: {
    gap: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.primary,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  recordingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.danger,
  },
  recordingText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    fontVariant: ['tabular-nums'],
  },
  muted: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.textSecondary,
  },
  error: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.danger,
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  mainButton: {
    flex: 1,
  },
});
