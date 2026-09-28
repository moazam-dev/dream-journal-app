/**
 * The WebSocket connection to Deepgram's Voice Agent API.
 *
 * - Authenticates with a temporary token (`Authorization: Bearer <token>` header).
 * - Sends the Settings message as soon as the socket opens.
 * - Sends a KeepAlive every few seconds so the connection stays open while the mic is muted.
 * - JSON text frames → `onMessage`, binary frames (agent audio) → `onAudio`.
 *
 * The socket is created by `createSocket`, so tests can pass in a fake one.
 */
import { KEEP_ALIVE_MESSAGE, parseServerMessage, VOICE_AGENT_URL } from './messages.ts';
import { toUint8Array } from './pcm.ts';
import type { AgentSettings, ServerMessage } from './types';

/** The small part of the WebSocket API we use (React Native's WebSocket matches it). */
export type SocketLike = {
  readyState: number;
  binaryType: string;
  onopen: ((event: unknown) => void) | null;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((event: unknown) => void) | null;
  onclose: ((event: { code: number; reason: string }) => void) | null;
  send(data: string | ArrayBuffer | ArrayBufferView): void;
  close(code?: number, reason?: string): void;
};

export type CloseInfo = { code: number; reason: string; closedByApp: boolean };

export type VoiceAgentHandlers = {
  onMessage: (message: ServerMessage) => void;
  onAudio: (chunk: Uint8Array) => void;
  onClose: (info: CloseInfo) => void;
};

export type VoiceAgentClientOptions = {
  token: string;
  settings: AgentSettings;
  handlers: VoiceAgentHandlers;
  url?: string;
  createSocket?: (url: string, token: string) => SocketLike;
  keepAliveMs?: number;
  connectTimeoutMs?: number;
};

const OPEN = 1;

/** React Native's WebSocket accepts custom headers as a third argument (browsers don't). */
function createNativeSocket(url: string, token: string): SocketLike {
  const NativeWebSocket = WebSocket as unknown as new (
    url: string,
    protocols: string[] | null,
    options: { headers: Record<string, string> }
  ) => SocketLike;
  return new NativeWebSocket(url, null, { headers: { Authorization: `Bearer ${token}` } });
}

export class VoiceAgentClient {
  private socket: SocketLike | null = null;
  private keepAliveTimer: ReturnType<typeof setInterval> | null = null;
  private connectTimer: ReturnType<typeof setTimeout> | null = null;
  private closedByApp = false;
  private closeReported = false;
  private readonly options: VoiceAgentClientOptions;

  constructor(options: VoiceAgentClientOptions) {
    this.options = options;
  }

  get isOpen() {
    return this.socket?.readyState === OPEN;
  }

  connect() {
    const { url = VOICE_AGENT_URL, token, settings, handlers } = this.options;
    const createSocket = this.options.createSocket ?? createNativeSocket;
    const socket = createSocket(url, token);
    this.socket = socket;
    socket.binaryType = 'arraybuffer';

    // Give up if Deepgram doesn't answer in time (bad network, blocked host, …).
    this.connectTimer = setTimeout(() => {
      if (!this.isOpen) this.fail(4000, 'Connection timed out');
    }, this.options.connectTimeoutMs ?? 10_000);

    socket.onopen = () => {
      this.clearConnectTimer();
      socket.send(JSON.stringify(settings));
      this.keepAliveTimer = setInterval(() => {
        if (this.isOpen) socket.send(KEEP_ALIVE_MESSAGE);
      }, this.options.keepAliveMs ?? 8000);
    };

    socket.onmessage = (event) => {
      if (typeof event.data === 'string') {
        handlers.onMessage(parseServerMessage(event.data));
      } else if (event.data instanceof ArrayBuffer || ArrayBuffer.isView(event.data)) {
        handlers.onAudio(toUint8Array(event.data));
      }
    };

    // An error is always followed by a close event, which is where we report it.
    socket.onerror = () => {};

    socket.onclose = (event) => {
      this.stopTimers();
      this.reportClose(event.code, event.reason);
    };
  }

  /** Sends one chunk of microphone audio (16-bit PCM). Ignored while not connected. */
  sendAudio(chunk: Uint8Array) {
    if (this.isOpen) this.socket?.send(chunk);
  }

  /** Ends the session on purpose (the app's own close is reported with closedByApp: true). */
  close() {
    this.closedByApp = true;
    this.stopTimers();
    try {
      this.socket?.close(1000, 'Conversation ended');
    } catch {
      // Already closed.
    }
    this.reportClose(1000, 'Conversation ended');
  }

  private fail(code: number, reason: string) {
    this.stopTimers();
    try {
      this.socket?.close();
    } catch {
      // Ignore: we're reporting the failure below either way.
    }
    this.reportClose(code, reason);
  }

  private reportClose(code: number, reason: string) {
    if (this.closeReported) return;
    this.closeReported = true;
    if (this.socket) {
      this.socket.onopen = null;
      this.socket.onmessage = null;
      this.socket.onerror = null;
      this.socket.onclose = null;
    }
    this.options.handlers.onClose({ code, reason, closedByApp: this.closedByApp });
  }

  private clearConnectTimer() {
    if (this.connectTimer !== null) clearTimeout(this.connectTimer);
    this.connectTimer = null;
  }

  private stopTimers() {
    this.clearConnectTimer();
    if (this.keepAliveTimer !== null) clearInterval(this.keepAliveTimer);
    this.keepAliveTimer = null;
  }
}
