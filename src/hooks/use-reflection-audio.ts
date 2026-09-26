import { setAudioModeAsync, useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useState, type Dispatch, type SetStateAction } from 'react';

import { generateDreamAudio } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';

/** If the audio file hasn't loaded after this long, show an error instead of spinning forever. */
const LOAD_TIMEOUT_MS = 20_000;

/**
 * Everything the "Listen to reflection" player needs:
 * - makes the audio on the server the first time the user taps Listen (never on screen open),
 * - reuses the saved audio afterwards,
 * - plays / pauses / resumes / stops it with expo-audio.
 */
export function useReflectionAudio(
  dream: Dream | null,
  setDream: Dispatch<SetStateAction<Dream | null>>
) {
  const audioUrl = dream?.audio_status === 'completed' ? dream.audio_url : null;

  // expo-audio creates a new player when the source changes, and releases it
  // automatically when the screen closes (which also stops the sound).
  const player = useAudioPlayer(audioUrl ? { uri: audioUrl } : null);
  const status = useAudioPlayerStatus(player);

  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // "Play as soon as the file has loaded" (after generating, or on a first tap).
  const [wantsToPlay, setWantsToPlay] = useState(false);

  // iPhone: play through the speaker even when the silent switch is on.
  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  }, []);

  // Start playing once the audio file is ready.
  // (`wantsToPlay` is cleared by pause/stop/play below, so this only fires when asked.)
  useEffect(() => {
    if (wantsToPlay && status.isLoaded) player.play();
  }, [wantsToPlay, status.isLoaded, player]);

  // Don't spin forever if the file can't be downloaded (e.g. no internet).
  useEffect(() => {
    if (!wantsToPlay || status.isLoaded) return;
    const timer = setTimeout(() => {
      setWantsToPlay(false);
      setError('The audio couldn’t be loaded. Check your connection and try again.');
    }, LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [wantsToPlay, status.isLoaded]);

  // Pause when the user leaves this screen.
  useFocusEffect(
    useCallback(() => {
      return () => {
        try {
          player.pause();
        } catch {
          // The player may already be released while the screen closes; nothing to stop.
        }
      };
    }, [player])
  );

  const duration = status.duration || 0;
  const position = Math.min(status.currentTime || 0, duration || Infinity);
  const isAtEnd = status.didJustFinish || (duration > 0 && position >= duration - 0.1);
  const hasStarted = position > 0.05 && !isAtEnd;

  /** "Listen to reflection" / "Resume" / "Listen again" / "Try again". */
  async function play() {
    setError(null);

    if (audioUrl) {
      if (isAtEnd) await player.seekTo(0);
      if (status.isLoaded) {
        setWantsToPlay(false);
        player.play();
      } else {
        setWantsToPlay(true);
      }
      return;
    }

    // No audio yet: ask the server to create it (only happens once per dream).
    if (!dream) return;
    setGenerating(true);
    try {
      const updatedDream = await generateDreamAudio(dream.id);
      setDream(updatedDream);
      setWantsToPlay(true);
    } catch (err) {
      setError(getErrorMessage(err));
      // The server has marked it 'failed' too.
      setDream((current) => (current ? { ...current, audio_status: 'failed' } : current));
    } finally {
      setGenerating(false);
    }
  }

  function pause() {
    setWantsToPlay(false);
    player.pause();
  }

  /** Stop and go back to the start. */
  async function stop() {
    setWantsToPlay(false);
    player.pause();
    await player.seekTo(0);
  }

  return {
    hasAudio: !!audioUrl,
    generating,
    loading: wantsToPlay && !status.isLoaded,
    playing: status.playing,
    hasStarted,
    isAtEnd,
    position,
    duration,
    error,
    play,
    pause,
    stop,
  };
}
