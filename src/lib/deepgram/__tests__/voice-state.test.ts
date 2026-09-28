/** Voice screen state transitions. Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  CONNECTION_LOST_MESSAGE,
  initialVoiceState,
  statusLabel,
  voiceReducer,
  type VoiceAction,
  type VoiceState,
} from '../voice-state.ts';

const run = (actions: VoiceAction[], start: VoiceState = initialVoiceState) =>
  actions.reduce(voiceReducer, start);

describe('voiceReducer', () => {
  it('follows a normal conversation turn', () => {
    const states = [
      { type: 'connect' },
      { type: 'ready' },
      { type: 'agentStartedSpeaking' }, // greeting
      { type: 'agentAudioDone' },
      { type: 'playbackDrained' },
      { type: 'userStartedSpeaking' },
      { type: 'agentThinking' },
      { type: 'agentStartedSpeaking' },
    ].reduce<VoiceState[]>(
      (list, action) => [...list, voiceReducer(list[list.length - 1], action as VoiceAction)],
      [initialVoiceState]
    );
    assert.deepEqual(
      states.map((state) => state.status),
      ['idle', 'connecting', 'listening', 'speaking', 'speaking', 'listening', 'listening', 'thinking', 'speaking']
    );
  });

  it('stays "speaking" until Deepgram is done AND the audio has finished playing', () => {
    const speaking = run([{ type: 'connect' }, { type: 'ready' }, { type: 'agentStartedSpeaking' }]);
    assert.equal(voiceReducer(speaking, { type: 'playbackDrained' }).status, 'speaking', 'a gap in the stream is not the end');
    const done = voiceReducer(speaking, { type: 'agentAudioDone' });
    assert.equal(done.status, 'speaking');
    assert.equal(voiceReducer(done, { type: 'playbackDrained' }).status, 'listening');
  });

  it('barge-in: the user speaking switches straight back to listening', () => {
    const speaking = run([{ type: 'connect' }, { type: 'ready' }, { type: 'agentStartedSpeaking' }]);
    const interrupted = voiceReducer(speaking, { type: 'userStartedSpeaking' });
    assert.equal(interrupted.status, 'listening');
    assert.equal(interrupted.agentAudioDone, false);
  });

  it('builds a transcript, merging consecutive lines from the same speaker', () => {
    const state = run([
      { type: 'transcript', role: 'assistant', text: 'Hey, tell me about your dream.' },
      { type: 'transcript', role: 'user', text: 'I was in a city.' },
      { type: 'transcript', role: 'user', text: '  It was empty. ' },
      { type: 'transcript', role: 'user', text: '   ' },
      { type: 'transcript', role: 'assistant', text: 'How did that feel?' },
    ]);
    assert.deepEqual(state.transcript, [
      { id: 1, role: 'assistant', text: 'Hey, tell me about your dream.' },
      { id: 2, role: 'user', text: 'I was in a city. It was empty.' },
      { id: 3, role: 'assistant', text: 'How did that feel?' },
    ]);
  });

  it('keeps the transcript across a reconnect', () => {
    const talked = run([{ type: 'connect' }, { type: 'ready' }, { type: 'transcript', role: 'user', text: 'Hi' }]);
    const reconnecting = run([{ type: 'disconnected' }, { type: 'connect' }], talked);
    assert.equal(reconnecting.status, 'connecting');
    assert.equal(reconnecting.transcript.length, 1);
  });

  it('turns an unexpected disconnect into a connection error, but not after ending', () => {
    const live = run([{ type: 'connect' }, { type: 'ready' }]);
    const lost = voiceReducer(live, { type: 'disconnected' });
    assert.equal(lost.status, 'error');
    assert.deepEqual(lost.error, { kind: 'connection', message: CONNECTION_LOST_MESSAGE });

    const ended = run([{ type: 'ended' }, { type: 'disconnected' }], live);
    assert.equal(ended.status, 'ended');
  });

  it('ignores late agent events once the session is over', () => {
    const ended = run([{ type: 'connect' }, { type: 'ready' }, { type: 'ended' }]);
    for (const action of ['agentThinking', 'agentStartedSpeaking', 'userStartedSpeaking', 'ready'] as const) {
      assert.equal(voiceReducer(ended, { type: action }).status, 'ended');
    }
  });

  it('records errors with their kind so the screen can offer the right action', () => {
    const state = voiceReducer(initialVoiceState, { type: 'error', kind: 'permission', message: 'Mic off' });
    assert.equal(state.status, 'error');
    assert.equal(state.error?.kind, 'permission');
  });
});

describe('statusLabel', () => {
  it('shows each state, and "Muted" while listening muted', () => {
    const listening = run([{ type: 'connect' }, { type: 'ready' }]);
    assert.equal(statusLabel(initialVoiceState), 'Tap to start');
    assert.equal(statusLabel(run([{ type: 'connect' }])), 'Connecting…');
    assert.equal(statusLabel(listening), 'Listening');
    assert.equal(statusLabel(voiceReducer(listening, { type: 'toggleMute' })), 'Muted');
    assert.equal(statusLabel(voiceReducer(listening, { type: 'agentThinking' })), 'Thinking…');
    assert.equal(statusLabel(voiceReducer(listening, { type: 'agentStartedSpeaking' })), 'Speaking');
    assert.equal(statusLabel(voiceReducer(listening, { type: 'ended' })), 'Conversation ended');
  });
});
