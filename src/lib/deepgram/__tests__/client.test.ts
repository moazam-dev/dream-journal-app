/** WebSocket handling, with a fake socket. Run with:  npm test */
import assert from 'node:assert/strict';
import { afterEach, beforeEach, describe, it, mock } from 'node:test';

import { VoiceAgentClient, type CloseInfo, type SocketLike } from '../client.ts';
import { buildSettings, KEEP_ALIVE_MESSAGE, VOICE_AGENT_URL } from '../messages.ts';
import type { ServerMessage } from '../types';

class FakeSocket implements SocketLike {
  readyState = 0;
  binaryType = 'blob';
  sent: (string | ArrayBuffer | ArrayBufferView)[] = [];
  closedWith: number | null = null;
  onopen: SocketLike['onopen'] = null;
  onmessage: SocketLike['onmessage'] = null;
  onerror: SocketLike['onerror'] = null;
  onclose: SocketLike['onclose'] = null;

  send(data: string | ArrayBuffer | ArrayBufferView) {
    this.sent.push(data);
  }
  close(code = 1000) {
    this.closedWith = code;
    this.readyState = 3;
  }
  // Helpers that play the part of the server:
  serverOpens() {
    this.readyState = 1;
    this.onopen?.({});
  }
  serverSends(data: unknown) {
    this.onmessage?.({ data });
  }
  serverCloses(code: number) {
    this.readyState = 3;
    this.onclose?.({ code, reason: '' });
  }
}

function setup() {
  const socket = new FakeSocket();
  const created: { url: string; token: string }[] = [];
  const messages: ServerMessage[] = [];
  const audio: Uint8Array[] = [];
  const closes: CloseInfo[] = [];
  const settings = buildSettings({});
  const client = new VoiceAgentClient({
    token: 'temp-token',
    settings,
    keepAliveMs: 8000,
    connectTimeoutMs: 10_000,
    createSocket: (url, token) => {
      created.push({ url, token });
      return socket;
    },
    handlers: {
      onMessage: (message) => messages.push(message),
      onAudio: (chunk) => audio.push(chunk),
      onClose: (info) => closes.push(info),
    },
  });
  return { socket, created, messages, audio, closes, settings, client };
}

describe('VoiceAgentClient', () => {
  beforeEach(() => mock.timers.enable({ apis: ['setInterval', 'setTimeout'] }));
  afterEach(() => mock.timers.reset());

  it('connects to the Voice Agent endpoint with the temporary token and sends Settings first', () => {
    const { socket, created, settings, client } = setup();
    client.connect();
    assert.deepEqual(created, [{ url: VOICE_AGENT_URL, token: 'temp-token' }]);
    assert.equal(socket.binaryType, 'arraybuffer');
    assert.equal(socket.sent.length, 0, 'nothing is sent before the socket opens');

    socket.serverOpens();
    assert.deepEqual(JSON.parse(socket.sent[0] as string), settings);
  });

  it('routes JSON frames to onMessage and binary frames to onAudio', () => {
    const { socket, messages, audio, client } = setup();
    client.connect();
    socket.serverOpens();
    socket.serverSends('{"type":"UserStartedSpeaking"}');
    socket.serverSends(new Uint8Array([1, 2, 3, 4]).buffer);
    assert.deepEqual(messages, [{ type: 'UserStartedSpeaking' }]);
    assert.deepEqual(Array.from(audio[0]), [1, 2, 3, 4]);
  });

  it('sends microphone audio only while connected', () => {
    const { socket, client } = setup();
    client.connect();
    client.sendAudio(new Uint8Array([1, 2]));
    assert.equal(socket.sent.length, 0);
    socket.serverOpens();
    client.sendAudio(new Uint8Array([1, 2]));
    assert.ok(socket.sent[1] instanceof Uint8Array);
  });

  it('sends a KeepAlive every 8 seconds', () => {
    const { socket, client } = setup();
    client.connect();
    socket.serverOpens();
    mock.timers.tick(8000);
    mock.timers.tick(8000);
    assert.deepEqual(socket.sent.slice(1), [KEEP_ALIVE_MESSAGE, KEEP_ALIVE_MESSAGE]);
  });

  it('reports an unexpected server close once, and stops the keep-alive', () => {
    const { socket, closes, client } = setup();
    client.connect();
    socket.serverOpens();
    socket.serverCloses(1011);
    mock.timers.tick(20_000);
    assert.deepEqual(closes, [{ code: 1011, reason: '', closedByApp: false }]);
    assert.equal(socket.sent.length, 1, 'no KeepAlive after the close');
  });

  it('marks its own close as closedByApp and reports it only once', () => {
    const { socket, closes, client } = setup();
    client.connect();
    socket.serverOpens();
    client.close();
    client.close();
    assert.equal(socket.closedWith, 1000);
    assert.deepEqual(closes, [{ code: 1000, reason: 'Conversation ended', closedByApp: true }]);
  });

  it('gives up if the connection does not open in time', () => {
    const { socket, closes, client } = setup();
    client.connect();
    mock.timers.tick(10_000);
    assert.deepEqual(closes, [{ code: 4000, reason: 'Connection timed out', closedByApp: false }]);
    assert.notEqual(socket.closedWith, null);
  });
});
