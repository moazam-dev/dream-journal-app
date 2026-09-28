import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceOrb } from '@/components/voice-orb';
import { VoiceTranscript } from '@/components/voice-transcript';
import { Radius, Spacing, VoiceColors } from '@/constants/theme';
import { useVoiceAgent } from '@/hooks/use-voice-agent';
import type { DreamContext } from '@/lib/deepgram/types';
import { isLiveStatus, statusLabel } from '@/lib/deepgram/voice-state';
import { fetchDreamById } from '@/services/dreams';

/**
 * Voice companion screen ("/voice", or "/voice?dreamId=<id>" to talk about a saved dream).
 * Real-time conversation with the Deepgram Voice Agent. Needs the native development build.
 */
export default function VoiceScreen() {
  const { dreamId } = useLocalSearchParams<{ dreamId?: string }>();
  const { dream, loadingDream } = useDreamContext(dreamId);
  const { state, inputLevel, outputLevel, start, end, toggleMute } = useVoiceAgent(dream);

  const live = isLiveStatus(state.status);
  const busy = live || state.status === 'connecting';
  const canStart = !busy && !loadingDream && state.error?.kind !== 'unsupported';

  function handleClose() {
    end();
    router.back();
  }

  return (
    <SafeAreaView style={styles.screen} edges={['top', 'bottom', 'left', 'right']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable onPress={handleClose} hitSlop={12} accessibilityRole="button" accessibilityLabel="Close">
          <Text style={styles.close}>✕</Text>
        </Pressable>
        <View style={styles.headerText}>
          <Text style={styles.title}>Dream Companion</Text>
          {!!dream?.title && (
            <Text style={styles.subtitle} numberOfLines={1}>
              {dream.title}
            </Text>
          )}
        </View>
        <View style={styles.headerSpacer} />
      </View>

      <Pressable
        style={styles.orbArea}
        onPress={canStart ? start : undefined}
        accessibilityRole="button"
        accessibilityLabel={canStart ? 'Start conversation' : statusLabel(state)}>
        <VoiceOrb
          status={state.status}
          muted={state.muted}
          inputLevel={inputLevel}
          outputLevel={outputLevel}
        />
        <View style={styles.statusRow}>
          {state.status === 'connecting' && <ActivityIndicator color={VoiceColors.textSecondary} />}
          <Text
            style={[styles.status, state.status === 'error' && styles.statusError]}
            accessibilityLiveRegion="polite">
            {loadingDream ? 'Getting your dream…' : statusLabel(state)}
          </Text>
        </View>
        {state.status === 'idle' && !loadingDream && (
          <Text style={styles.hint}>
            {dream ? 'Talk it through out loud. You can interrupt anytime.' : 'Tell your companion about a dream, out loud.'}
          </Text>
        )}
      </Pressable>

      <View style={styles.transcript}>
        <VoiceTranscript entries={state.transcript} />
      </View>

      <View style={styles.controls}>
        {busy ? (
          <>
            <ControlButton
              label={state.muted ? 'Unmute' : 'Mute'}
              onPress={toggleMute}
              disabled={!live}
              variant={state.muted ? 'active' : 'plain'}
            />
            <ControlButton label="End conversation" onPress={end} variant="danger" wide />
          </>
        ) : state.status === 'error' && state.error?.kind === 'unsupported' ? (
          <ControlButton label="Back" onPress={handleClose} wide />
        ) : state.status === 'error' && state.error?.kind === 'permission' ? (
          <>
            <ControlButton label="Open Settings" onPress={() => Linking.openSettings()} />
            <ControlButton label="Try again" onPress={start} variant="primary" wide />
          </>
        ) : (
          <ControlButton
            label={
              state.status === 'error'
                ? state.transcript.length > 0
                  ? 'Reconnect'
                  : 'Try again'
                : state.status === 'ended'
                  ? 'Start a new conversation'
                  : 'Start conversation'
            }
            onPress={start}
            disabled={!canStart}
            variant="primary"
            wide
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** Loads the selected dream (only the fields the companion needs), if one was passed. */
function useDreamContext(dreamId: string | undefined) {
  const [dream, setDream] = useState<DreamContext | null>(null);
  const [loadingDream, setLoadingDream] = useState(!!dreamId);

  useEffect(() => {
    if (!dreamId) return;
    let active = true;
    fetchDreamById(dreamId)
      .then((row) => {
        if (!active || !row) return;
        setDream({
          dreamText: row.dream_text,
          title: row.title,
          mood: row.mood,
          themes: row.themes,
          summary: row.summary,
        });
      })
      .catch((error) => console.warn('Could not load dream for the voice companion:', error))
      // If it fails, the companion still works; it just starts without the dream.
      .finally(() => {
        if (active) setLoadingDream(false);
      });
    return () => {
      active = false;
    };
  }, [dreamId]);

  return { dream, loadingDream };
}

type ControlButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'plain' | 'primary' | 'danger' | 'active';
  disabled?: boolean;
  wide?: boolean;
};

function ControlButton({ label, onPress, variant = 'plain', disabled = false, wide = false }: ControlButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        wide && styles.buttonWide,
        variant === 'primary' && styles.buttonPrimary,
        variant === 'danger' && styles.buttonDanger,
        variant === 'active' && styles.buttonActive,
        pressed && styles.buttonPressed,
        disabled && styles.buttonDisabled,
      ]}>
      <Text style={[styles.buttonText, variant === 'active' && styles.buttonTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: VoiceColors.background,
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
  },
  close: {
    fontSize: 20,
    color: VoiceColors.textSecondary,
    width: 32,
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: VoiceColors.text,
  },
  subtitle: {
    fontSize: 13,
    color: VoiceColors.textSecondary,
  },
  orbArea: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Spacing.md,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: -Spacing.xl,
    minHeight: 24,
  },
  status: {
    fontSize: 17,
    fontWeight: '600',
    color: VoiceColors.text,
    textAlign: 'center',
  },
  statusError: {
    color: VoiceColors.error,
    fontSize: 15,
    fontWeight: '500',
  },
  hint: {
    marginTop: Spacing.xs,
    fontSize: 14,
    color: VoiceColors.textSecondary,
    textAlign: 'center',
  },
  transcript: {
    flex: 1,
    marginTop: Spacing.md,
  },
  controls: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  button: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Radius.lg,
    backgroundColor: VoiceColors.surface,
    alignItems: 'center',
  },
  buttonWide: {
    flex: 1,
  },
  buttonPrimary: {
    backgroundColor: VoiceColors.listening,
  },
  buttonDanger: {
    backgroundColor: VoiceColors.error,
  },
  buttonActive: {
    backgroundColor: VoiceColors.text,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonDisabled: {
    opacity: 0.4,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: VoiceColors.text,
  },
  buttonTextActive: {
    color: VoiceColors.background,
  },
});
