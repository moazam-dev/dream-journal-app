/**
 * Types for the real-time voice companion (Deepgram Voice Agent API).
 * Message shapes follow Deepgram's official Voice Agent v1 schema.
 */

// ---------------------------------------------------------------------------
// Messages Deepgram sends to the app (JSON text frames). Audio arrives as binary frames.
// ---------------------------------------------------------------------------

export type ServerMessage =
  | { type: 'Welcome'; request_id: string }
  | { type: 'SettingsApplied' }
  | { type: 'ConversationText'; role: 'user' | 'assistant'; content: string }
  | { type: 'UserStartedSpeaking' }
  | { type: 'AgentThinking'; content: string }
  | { type: 'AgentStartedSpeaking' }
  | { type: 'AgentAudioDone' }
  | { type: 'Error'; description: string; code: string }
  | { type: 'Warning'; description: string; code: string }
  /** Anything we don't act on (e.g. LatencyReport, History) or couldn't read. */
  | { type: 'Unknown'; originalType: string | null };

// ---------------------------------------------------------------------------
// The Settings message the app sends right after connecting.
// ---------------------------------------------------------------------------

export type HistoryMessage = { type: 'History'; role: 'user' | 'assistant'; content: string };

export type AgentSettings = {
  type: 'Settings';
  audio: {
    input: { encoding: 'linear16'; sample_rate: number };
    output: { encoding: 'linear16'; sample_rate: number; container: 'none' };
  };
  agent: {
    context?: { messages: HistoryMessage[] };
    listen: { provider: { type: 'deepgram'; version: 'v2'; model: string } };
    think: {
      provider: { type: 'open_ai'; model: string; temperature?: number };
      prompt: string;
    };
    speak: { provider: { type: 'deepgram'; model: string } };
    greeting?: string;
  };
};

// ---------------------------------------------------------------------------
// App-side types.
// ---------------------------------------------------------------------------

/** The parts of a dream the companion may know about (nothing else is shared). */
export type DreamContext = {
  dreamText: string;
  title?: string | null;
  mood?: string | null;
  themes?: string[] | null;
  summary?: string | null;
};

export type TranscriptEntry = {
  id: number;
  role: 'user' | 'assistant';
  text: string;
};

/** What the voice screen is doing. "Muted" is shown when `muted` is true while listening. */
export type VoiceStatus =
  | 'idle'
  | 'connecting'
  | 'listening'
  | 'thinking'
  | 'speaking'
  | 'error'
  | 'ended';

/** Why a session failed, so the screen can offer the right button. */
export type VoiceErrorKind = 'unsupported' | 'permission' | 'connection' | 'agent';
