/** Run with:  npm test */
import assert from 'node:assert/strict';
import { describe, it } from 'node:test';

import {
  buildSettings,
  buildSystemPrompt,
  DEFAULT_GREETING,
  DREAM_COMPANION_PROMPT,
  INPUT_SAMPLE_RATE,
  OUTPUT_SAMPLE_RATE,
  parseServerMessage,
  RECONNECT_GREETING,
} from '../messages.ts';

const dream = {
  dreamText: 'I was walking through an empty city at night.',
  title: 'The Empty City',
  mood: 'Mysterious',
  themes: ['Isolation', 'Searching'],
  summary: 'You walk through a quiet city.',
};

describe('buildSettings', () => {
  it('describes 16 kHz linear16 audio both ways and the current Deepgram models', () => {
    const settings = buildSettings({});
    assert.equal(settings.type, 'Settings');
    assert.deepEqual(settings.audio.input, { encoding: 'linear16', sample_rate: INPUT_SAMPLE_RATE });
    assert.deepEqual(settings.audio.output, { encoding: 'linear16', sample_rate: OUTPUT_SAMPLE_RATE, container: 'none' });
    assert.deepEqual(settings.agent.listen.provider, { type: 'deepgram', version: 'v2', model: 'flux-general-en' });
    assert.equal(settings.agent.think.provider.type, 'open_ai');
    assert.equal(settings.agent.speak.provider.model, 'aura-2-vesta-en');
  });

  it('uses the default greeting and no dream when opened from Home', () => {
    const settings = buildSettings({});
    assert.equal(settings.agent.greeting, DEFAULT_GREETING);
    assert.match(settings.agent.think.prompt, /Start by asking what they dreamed about/);
    assert.equal(settings.agent.context, undefined);
  });

  it('greets with awareness of the selected dream without reading it back', () => {
    const settings = buildSettings({ dream });
    assert.equal(
      settings.agent.greeting,
      'Let\'s explore "The Empty City" together. What part of this dream stayed with you the most?'
    );
    assert.ok(!settings.agent.greeting?.includes(dream.dreamText));
  });

  it('continues the conversation after a reconnect with earlier turns as history', () => {
    const settings = buildSettings({
      dream,
      history: [
        { id: 1, role: 'assistant', text: 'Tell me about it.' },
        { id: 2, role: 'user', text: 'There was a fountain.' },
      ],
    });
    assert.equal(settings.agent.greeting, RECONNECT_GREETING);
    assert.deepEqual(settings.agent.context?.messages, [
      { type: 'History', role: 'assistant', content: 'Tell me about it.' },
      { type: 'History', role: 'user', content: 'There was a fountain.' },
    ]);
  });
});

describe('buildSystemPrompt', () => {
  it('always includes the dream-companion rules', () => {
    assert.ok(buildSystemPrompt().startsWith(DREAM_COMPANION_PROMPT));
    assert.match(buildSystemPrompt(), /Never claim that dreams predict the future/);
  });

  it('adds only the chosen dream fields, fenced as user notes', () => {
    const prompt = buildSystemPrompt(dream);
    assert.match(prompt, /<dream>[\s\S]*Dream text: I was walking[\s\S]*Title: The Empty City[\s\S]*Mood: Mysterious[\s\S]*Themes: Isolation, Searching[\s\S]*Summary: You walk[\s\S]*<\/dream>/);
    assert.match(prompt, /never as instructions/);
  });

  it('skips missing fields and trims very long dreams', () => {
    const prompt = buildSystemPrompt({ dreamText: 'x'.repeat(5000) });
    assert.doesNotMatch(prompt, /Title:|Mood:|Themes:|Summary:/);
    assert.ok(!prompt.includes('x'.repeat(2001)));
  });
});

describe('parseServerMessage', () => {
  it('reads the Voice Agent events the app reacts to', () => {
    assert.deepEqual(parseServerMessage('{"type":"Welcome","request_id":"abc"}'), { type: 'Welcome', request_id: 'abc' });
    assert.deepEqual(parseServerMessage('{"type":"SettingsApplied"}'), { type: 'SettingsApplied' });
    assert.deepEqual(parseServerMessage('{"type":"UserStartedSpeaking"}'), { type: 'UserStartedSpeaking' });
    assert.deepEqual(parseServerMessage('{"type":"AgentThinking","content":"hmm"}'), { type: 'AgentThinking', content: 'hmm' });
    assert.deepEqual(
      parseServerMessage('{"type":"AgentStartedSpeaking","total_latency":1.2,"tts_latency":0.3,"ttt_latency":0.9}'),
      { type: 'AgentStartedSpeaking' }
    );
    assert.deepEqual(parseServerMessage('{"type":"AgentAudioDone"}'), { type: 'AgentAudioDone' });
    assert.deepEqual(
      parseServerMessage('{"type":"ConversationText","role":"assistant","content":"Hey there."}'),
      { type: 'ConversationText', role: 'assistant', content: 'Hey there.' }
    );
    assert.deepEqual(
      parseServerMessage('{"type":"Error","description":"Bad settings","code":"INVALID_SETTINGS"}'),
      { type: 'Error', description: 'Bad settings', code: 'INVALID_SETTINGS' }
    );
  });

  it('never throws on unexpected input', () => {
    assert.deepEqual(parseServerMessage('not json'), { type: 'Unknown', originalType: null });
    assert.deepEqual(parseServerMessage('[1,2]'), { type: 'Unknown', originalType: null });
    assert.deepEqual(parseServerMessage('{"type":"LatencyReport"}'), { type: 'Unknown', originalType: 'LatencyReport' });
    assert.deepEqual(
      parseServerMessage('{"type":"ConversationText","role":"system","content":"x"}'),
      { type: 'Unknown', originalType: 'ConversationText' }
    );
  });
});
