import { useCallback, useEffect, useReducer, useRef } from 'react';
import { AppState } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { VoiceAgentClient } from '@/lib/deepgram/client';
import { buildSettings, OUTPUT_SAMPLE_RATE } from '@/lib/deepgram/messages';
import { loadNativeAudio, type NativeAudio } from '@/lib/deepgram/native-audio';
import { PlaybackQueue } from '@/lib/deepgram/playback-queue';
import type { DreamContext, ServerMessage, TranscriptEntry } from '@/lib/deepgram/types';
import { initialVoiceState, voiceReducer } from '@/lib/deepgram/voice-state';
import { fetchDeepgramToken } from '@/services/voice-agent';
import { getErrorMessage } from '@/utils/errors';

const UNSUPPORTED_MESSAGE =
  'The voice companion needs the app’s development build. It doesn’t run in Expo Go.';
const PERMISSION_MESSAGE = 'Microphone access is off, so your dream companion can’t hear you.';
const AUDIO_START_MESSAGE = 'Couldn’t start the microphone or speaker. Please try again.';
const AGENT_ERROR_MESSAGE = 'Your dream companion ran into a problem. Please try again.';

type Subscription = { remove: () => void };

/** Everything that belongs to one connection, so it can all be cleaned up together. */
type Session = {
  audio: NativeAudio;
  client: VoiceAgentClient | null;
  queue: PlaybackQueue | null;
  subscriptions: Subscription[];
  cancelled: boolean;
};

/**
 * Runs a real-time voice conversation with the Deepgram Voice Agent.
 *
 * Microphone (16 kHz PCM, echo-cancelled) → WebSocket → Deepgram (speech-to-text + LLM + voice)
 * → agent audio → paced playback queue → speaker.
 *
 * `dream` (optional) is the selected dream's context for the companion.
 */
export function useVoiceAgent(dream: DreamContext | null) {
  const [state, dispatch] = useReducer(voiceReducer, initialVoiceState);
  // Live audio levels (0–1) for the orb animation; updated without re-rendering.
  const inputLevel = useSharedValue(0);
  const outputLevel = useSharedValue(0);

  const sessionRef = useRef<Session | null>(null);
  const mutedRef = useRef(false);
  const audioReadyRef = useRef(false);
  // Latest transcript, read when reconnecting so the conversation can continue.
  const transcriptRef = useRef<TranscriptEntry[]>([]);
  useEffect(() => {
    transcriptRef.current = state.transcript;
  }, [state.transcript]);

  /** Closes the socket, stops the mic, drops queued audio and removes every listener. */
  const stopSession = useCallback(() => {
    const session = sessionRef.current;
    sessionRef.current = null;
    if (!session) return;
    session.cancelled = true;
    session.subscriptions.forEach((subscription) => subscription.remove());
    session.queue?.dispose();
    session.client?.close();
    try {
      session.audio.toggleRecording(false);
    } catch {
      // Audio engine already torn down.
    }
    inputLevel.set(0);
    outputLevel.set(0);
  }, [inputLevel, outputLevel]);

  const start = useCallback(async () => {
    stopSession();
    dispatch({ type: 'connect' });

    const audio = loadNativeAudio();
    if (!audio) {
      dispatch({ type: 'error', kind: 'unsupported', message: UNSUPPORTED_MESSAGE });
      return;
    }

    const session: Session = { audio, client: null, queue: null, subscriptions: [], cancelled: false };
    sessionRef.current = session;
    // Ignore callbacks from a session the user has already ended or replaced.
    const isCurrent = () => sessionRef.current === session && !session.cancelled;
    const fail = (kind: 'permission' | 'connection' | 'agent', message: string) => {
      if (!isCurrent()) return;
      stopSession();
      dispatch({ type: 'error', kind, message });
    };

    // 1. Microphone permission and the native audio engine (echo cancellation on).
    try {
      const permission = await audio.requestMicrophonePermissionsAsync();
      if (!isCurrent()) return;
      if (!permission.granted) {
        fail('permission', PERMISSION_MESSAGE);
        return;
      }
      if (!audioReadyRef.current) {
        await audio.initialize();
        audioReadyRef.current = true;
      }
    } catch (error) {
      console.warn('Voice audio setup failed:', error);
      fail('agent', AUDIO_START_MESSAGE);
      return;
    }
    if (!isCurrent()) return;

    // 2. A temporary Deepgram token from our Edge Function.
    let token: string;
    try {
      token = await fetchDeepgramToken();
    } catch (error) {
      fail('connection', getErrorMessage(error));
      return;
    }
    if (!isCurrent()) return;

    // 3. Playback of the agent's voice, clearable when the user interrupts.
    const queue = new PlaybackQueue({
      sampleRate: OUTPUT_SAMPLE_RATE,
      play: (chunk) => audio.playPCMData(chunk),
      onDrained: () => {
        if (isCurrent()) dispatch({ type: 'playbackDrained' });
      },
    });
    session.queue = queue;

    const handleMessage = (message: ServerMessage) => {
      switch (message.type) {
        case 'SettingsApplied':
          // Deepgram is ready: start streaming the microphone.
          audio.toggleRecording(!mutedRef.current);
          dispatch({ type: 'ready' });
          // The greeting is spoken, not sent back as a ConversationText on every model, so
          // put it in the transcript here. The reducer drops it if Deepgram does send it.
          if (greeting) dispatch({ type: 'transcript', role: 'assistant', text: greeting });
          break;
        case 'UserStartedSpeaking':
          // Barge-in: stop the agent's voice right away.
          queue.clear();
          dispatch({ type: 'userStartedSpeaking' });
          break;
        case 'AgentThinking':
          dispatch({ type: 'agentThinking' });
          break;
        case 'AgentStartedSpeaking':
          dispatch({ type: 'agentStartedSpeaking' });
          break;
        case 'AgentAudioDone':
          dispatch({ type: 'agentAudioDone' });
          if (queue.isIdle) dispatch({ type: 'playbackDrained' });
          break;
        case 'ConversationText':
          dispatch({ type: 'transcript', role: message.role, text: message.content });
          break;
        case 'Error':
          console.warn('Deepgram Voice Agent error:', message.code, message.description);
          fail('agent', AGENT_ERROR_MESSAGE);
          break;
        case 'Warning':
          console.warn('Deepgram Voice Agent warning:', message.code, message.description);
          break;
      }
    };

    // 4. The WebSocket to Deepgram.
    const settings = buildSettings({ dream, history: transcriptRef.current });
    const greeting = settings.agent.greeting;
    const client = new VoiceAgentClient({
      token,
      settings,
      handlers: {
        onMessage: (message) => {
          if (isCurrent()) handleMessage(message);
        },
        onAudio: (chunk) => {
          if (isCurrent()) queue.enqueue(chunk);
        },
        onClose: ({ closedByApp, code, reason }) => {
          if (closedByApp || !isCurrent()) return;
          console.warn('Voice Agent connection closed:', code, reason);
          stopSession();
          dispatch({ type: 'disconnected' });
        },
      },
    });
    session.client = client;

    // 5. Microphone → Deepgram, and audio levels → orb.
    session.subscriptions.push(
      audio.addExpoTwoWayAudioEventListener('onMicrophoneData', (event) => {
        if (isCurrent() && !mutedRef.current) client.sendAudio(event.data);
      }),
      audio.addExpoTwoWayAudioEventListener('onInputVolumeLevelData', (event) => {
        inputLevel.set(event.data);
      }),
      audio.addExpoTwoWayAudioEventListener('onOutputVolumeLevelData', (event) => {
        outputLevel.set(event.data);
      }),
      // A phone call or Siri takes over the audio: end the conversation cleanly.
      audio.addExpoTwoWayAudioEventListener('onAudioInterruption', (event) => {
        // iOS sends 'began', Android sends 'blocked'.
        if (isCurrent() && (event.data === 'began' || event.data === 'blocked')) {
          stopSession();
          dispatch({ type: 'ended' });
        }
      })
    );

    client.connect();
  }, [dream, stopSession, inputLevel, outputLevel]);

  const end = useCallback(() => {
    stopSession();
    dispatch({ type: 'ended' });
  }, [stopSession]);

  /**
   * Cuts the companion off mid-sentence and hands the floor back. Same thing that happens when
   * the user simply talks over it, but on purpose: the design's "skip" button and tapping the
   * orb while afterdream is speaking.
   */
  const interrupt = useCallback(() => {
    const session = sessionRef.current;
    if (!session || session.cancelled) return;
    session.queue?.clear();
    dispatch({ type: 'userStartedSpeaking' });
  }, []);

  const toggleMute = useCallback(() => {
    mutedRef.current = !mutedRef.current;
    const session = sessionRef.current;
    if (session?.client?.isOpen) {
      // Actually switch the microphone off while muted (the KeepAlive keeps the call open).
      session.audio.toggleRecording(!mutedRef.current);
    }
    if (mutedRef.current) inputLevel.set(0);
    dispatch({ type: 'toggleMute' });
  }, [inputLevel]);

  // Leaving the app: end the conversation so the microphone never runs in the background.
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (appState) => {
      if (appState === 'background' && sessionRef.current) {
        stopSession();
        dispatch({ type: 'ended' });
      }
    });
    return () => subscription.remove();
  }, [stopSession]);

  // Leaving the screen: clean up everything, including the native audio engine.
  useEffect(() => {
    return () => {
      stopSession();
      if (audioReadyRef.current) {
        try {
          loadNativeAudio()?.tearDown();
        } catch {
          // Already torn down.
        }
        audioReadyRef.current = false;
      }
    };
  }, [stopSession]);

  return { state, inputLevel, outputLevel, start, end, interrupt, toggleMute };
}
