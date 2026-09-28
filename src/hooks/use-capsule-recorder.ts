import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

/** Notes shorter than this are almost always accidental taps. */
const MIN_RECORDING_MS = 1000;

function leaveRecordingMode() {
  return setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => {});
}

/**
 * Records a note to future you. Unlike the dream recorder, nothing is sent anywhere:
 * `stop()` hands back the file on the phone, for the time capsule to keep.
 */
export function useCapsuleRecorder() {
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(recorder, 250);
  const [recording, setRecording] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function start() {
    setError(null);
    const permission = await requestRecordingPermissionsAsync();
    if (!permission.granted) {
      setError('microphone access is off — turn it on in settings.');
      return;
    }
    try {
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      setRecording(true);
    } catch (err) {
      console.warn('Could not start the capsule recording:', err);
      setError('recording couldn’t start. try again.');
      await leaveRecordingMode();
    }
  }

  /** Stops and returns the recording, or `null` if it was too short or couldn't be saved. */
  async function stop(): Promise<{ uri: string; seconds: number } | null> {
    const ms = recorderState.durationMillis;
    setRecording(false);
    try {
      await recorder.stop();
    } finally {
      await leaveRecordingMode();
    }
    if (ms < MIN_RECORDING_MS) {
      setError('that was very short — hold a thought, then tap to seal.');
      return null;
    }
    if (!recorder.uri) {
      setError('the recording couldn’t be saved. try again.');
      return null;
    }
    return { uri: recorder.uri, seconds: ms / 1000 };
  }

  // Leaving the screen switches the microphone off (the unfinished note is dropped).
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
        setRecording(false);
      };
    }, [recorder])
  );

  return { recording, seconds: recorderState.durationMillis / 1000, error, start, stop };
}
