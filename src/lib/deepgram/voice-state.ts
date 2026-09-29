/**
 * The voice screen's state machine, as a React `useReducer` reducer.
 * Plain TypeScript, so every transition can be unit tested.
 */
import type { TranscriptEntry, VoiceErrorKind, VoiceStatus } from './types';

export type VoiceState = {
  status: VoiceStatus;
  muted: boolean;
  transcript: TranscriptEntry[];
  error: { kind: VoiceErrorKind; message: string } | null;
  /** Deepgram has sent all audio for the current reply (it may still be playing). */
  agentAudioDone: boolean;
  nextTranscriptId: number;
};

export type VoiceAction =
  | { type: 'connect' }
  | { type: 'ready' }
  | { type: 'userStartedSpeaking' }
  | { type: 'agentThinking' }
  | { type: 'agentStartedSpeaking' }
  | { type: 'agentAudioDone' }
  | { type: 'playbackDrained' }
  | { type: 'transcript'; role: 'user' | 'assistant'; text: string }
  | { type: 'toggleMute' }
  | { type: 'error'; kind: VoiceErrorKind; message: string }
  | { type: 'disconnected' }
  | { type: 'ended' };

export const initialVoiceState: VoiceState = {
  status: 'idle',
  muted: false,
  transcript: [],
  error: null,
  agentAudioDone: false,
  nextTranscriptId: 1,
};

export const CONNECTION_LOST_MESSAGE = 'The connection to your dream companion was lost.';

/** Statuses in which a live conversation is running. */
export function isLiveStatus(status: VoiceStatus) {
  return status === 'listening' || status === 'thinking' || status === 'speaking';
}

export function voiceReducer(state: VoiceState, action: VoiceAction): VoiceState {
  const live = isLiveStatus(state.status);

  switch (action.type) {
    case 'connect':
      // Keep the transcript: a reconnect continues the same conversation.
      return { ...state, status: 'connecting', error: null, agentAudioDone: false };

    case 'ready':
      return state.status === 'connecting' ? { ...state, status: 'listening' } : state;

    case 'userStartedSpeaking':
      // Barge-in: whatever the agent was doing, the user now has the floor.
      return live ? { ...state, status: 'listening', agentAudioDone: false } : state;

    case 'agentThinking':
      return live ? { ...state, status: 'thinking' } : state;

    case 'agentStartedSpeaking':
      return live ? { ...state, status: 'speaking', agentAudioDone: false } : state;

    case 'agentAudioDone':
      return live ? { ...state, agentAudioDone: true } : state;

    case 'playbackDrained':
      // Only return to listening once Deepgram is done AND the last audio has played.
      return state.status === 'speaking' && state.agentAudioDone
        ? { ...state, status: 'listening', agentAudioDone: false }
        : state;

    case 'transcript': {
      const text = action.text.trim();
      if (!text) return state;
      const last = state.transcript[state.transcript.length - 1];
      // Several messages in a row from the same speaker read better as one bubble.
      if (last && last.role === action.role) {
        // The greeting is put in the transcript as soon as it is sent, and Deepgram sends it
        // back as a ConversationText too. Don't say the same thing twice.
        if (last.text === text || last.text.endsWith(text)) return state;
        const merged = { ...last, text: `${last.text} ${text}` };
        return { ...state, transcript: [...state.transcript.slice(0, -1), merged] };
      }
      return {
        ...state,
        transcript: [...state.transcript, { id: state.nextTranscriptId, role: action.role, text }],
        nextTranscriptId: state.nextTranscriptId + 1,
      };
    }

    case 'toggleMute':
      return { ...state, muted: !state.muted };

    case 'error':
      return { ...state, status: 'error', error: { kind: action.kind, message: action.message } };

    case 'disconnected':
      // An unexpected close during a live or connecting session.
      return live || state.status === 'connecting'
        ? { ...state, status: 'error', error: { kind: 'connection', message: CONNECTION_LOST_MESSAGE } }
        : state;

    case 'ended':
      return { ...state, status: 'ended', muted: false, agentAudioDone: false };
  }
}

/** The label under the orb. */
export function statusLabel(state: VoiceState) {
  switch (state.status) {
    case 'idle':
      return 'Tap to start';
    case 'connecting':
      return 'Connecting…';
    case 'listening':
      return state.muted ? 'Muted' : 'Listening';
    case 'thinking':
      return 'Thinking…';
    case 'speaking':
      return 'Speaking';
    case 'error':
      return state.error?.message ?? 'Something went wrong.';
    case 'ended':
      return 'Conversation ended';
  }
}
