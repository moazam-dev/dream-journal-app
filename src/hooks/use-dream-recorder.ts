import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Keyboard } from 'react-native';

import { transcribeDreamRecording } from '@/services/dreams';
import { getErrorMessage } from '@/utils/errors';

/** What the voice input is doing right now. */
export type RecorderPhase = 'idle' | 'recording' | 'transcribing';

/** Recordings shorter than this are almost always accidental taps. */
const MIN_RECORDING_MS = 1000;

/** Turn recording mode off again, so later audio (e.g. the spoken reflection) uses the loudspeaker. */
function leaveRecordingMode() {
  return setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
}

/**
 * Records the user speaking their dream and turns it into text.
 *
 * start()             → asks for microphone permission (first time only) and starts recording
 * stopAndTranscribe() → stops, sends the recording to the server, calls `onTranscribed(text)`
 * cancel()            → stops and throws the recording away
 */
export function useDreamRecorder(onTranscribed: (text: string) => void) {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [phase, setPhase] = useState<RecorderPhase>('idle');
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    Keyboard.dismiss();

    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('Microphone access is off. You can turn it on in Settings › Expo Go › Microphone.');
      return;
    }

    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setPhase('recording');
    } catch (err) {
      console.warn('Could not start recording:', err);
      setError('Recording couldn’t start. Please try again.');
      await leaveRecordingMode();
    }
  }

  async function stopAndTranscribe() {
    const recordedMs = recorderState.durationMillis;
    setPhase('transcribing');
    try {
      await recorder.stop();
      await leaveRecordingMode();

      if (recordedMs < MIN_RECORDING_MS) {
        setError('That was very short. Tap the mic, describe your dream, then tap Stop.');
        return;
      }
      if (!recorder.uri) {
        throw new Error('The recording couldn’t be saved. Please try again.');
      }

      const text = await transcribeDreamRecording(recorder.uri);
      if (text === '') {
        setError('We didn’t catch any words. Try again a little closer to the phone.');
      } else {
        onTranscribed(text);
      }
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setPhase('idle');
    }
  }

  async function cancel() {
    try {
      await recorder.stop();
    } finally {
      await leaveRecordingMode();
      setPhase('idle');
    }
  }

  // If the user leaves the screen while recording, switch the microphone off.
  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          if (recorder.isRecording) {
            recorder.stop().catch(() => {});
            leaveRecordingMode();
          }
        } catch {
          // The recorder may already be released while the screen closes.
        }
      };
    }, [recorder])
  );

  return {
    phase,
    durationMillis: recorderState.durationMillis,
    error,
    start,
    stopAndTranscribe,
    cancel,
  };
}
