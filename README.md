# AI Dream Journal

An Expo React Native (TypeScript, Expo Router) app for recording dreams and reflecting on them with AI.

| Feature | How it works |
| --- | --- |
| Record a dream | Type it, or speak it (Groq Whisper speech-to-text via `transcribe-dream`) |
| AI reflection | Groq LLM writes a title, mood, themes, summary and reflection (`analyze-dream`) |
| Dream image | Cloudflare Workers AI (FLUX.1 schnell) paints the dream (`generate-dream-image`) |
| Listen to reflection | Groq text-to-speech reads the reflection aloud (`generate-dream-audio`) |
| Talk to your dreams | Real-time voice conversation with the Deepgram Voice Agent (`deepgram-token`) |

All AI keys live in **Supabase Edge Function secrets**. The app only holds the Supabase URL and
publishable key.

## Project layout

```
src/app/            Screens (Expo Router: every file is a route)
src/components/     Reusable UI
src/hooks/          Screen logic (data loading, recording, audio, voice agent)
src/lib/            Supabase client and the Deepgram voice agent core (src/lib/deepgram)
src/services/       Calls to Supabase (database and Edge Functions)
supabase/functions/ Edge Functions (server side)
supabase/migrations SQL to run in the Supabase SQL Editor, in order
```

## Setup

1. `npm install`
2. Copy `.env.example` to `.env.local` and fill in your Supabase URL and publishable key.
3. In Supabase **SQL Editor**, run every file in `supabase/migrations/` in date order.
4. In Supabase **Edge Functions → Secrets**, add:

   | Secret | Used by |
   | --- | --- |
   | `GROQ_API_KEY` | reflection, image prompt, spoken reflection, speech-to-text |
   | `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` | dream image |
   | `DEEPGRAM_API_KEY` | voice companion (key needs at least **Member** permission) |

5. Deploy the Edge Functions:

   ```bash
   npx supabase login
   npx supabase functions deploy --project-ref <your-project-ref> --use-api --no-verify-jwt
   ```

6. Run the app: `npx expo start` (Expo Go works for everything except the voice companion).

Tests: `npm test` (Edge Function logic and the voice agent core, no API keys needed).

## Real-Time Voice Agent

"Talk to your dreams" (Home) and "Talk about this dream" (Dream Detail) open `/voice`, a live,
hands-free voice conversation with a calm dream companion. You can interrupt it while it speaks.

### How it works

```
iPhone microphone (16 kHz, 16-bit mono PCM, echo-cancelled)
  → WebSocket  wss://agent.deepgram.com/v1/agent/converse
  → Deepgram Voice Agent: speech-to-text (flux-general-en) → LLM (gpt-4o-mini, hosted by Deepgram)
                          → voice (aura-2-vesta-en)
  → agent audio (16 kHz PCM) streamed back → paced playback queue → speaker
```

- **Deepgram Voice Agent API** does speech-to-text, the LLM and text-to-speech over one WebSocket.
  The app sends a `Settings` message (audio formats, models, system prompt, greeting), streams
  microphone audio as binary frames, and sends `KeepAlive` every 8 seconds.
- **Supabase token function** (`supabase/functions/deepgram-token`): the app asks it for a
  temporary token; it calls Deepgram's `POST /v1/auth/grant` with the permanent
  `DEEPGRAM_API_KEY` and returns a 30-second token. The token is only needed to open the
  WebSocket (`Authorization: Bearer <token>`); the conversation continues after it expires.
- **Interruptions (barge-in)**: when Deepgram sends `UserStartedSpeaking`, the app clears its
  playback queue. The queue only hands the native player ~250 ms of audio at a time, so the agent
  goes quiet almost immediately.
- **Dream context**: from Dream Detail, only the dream text, title, mood, themes and summary are
  added to the system prompt.
- **Transcript**: shown live, kept only in memory for the session. Nothing is stored.
- **Reconnect**: after a dropped connection, "Reconnect" opens a new session and sends the earlier
  turns as history so the conversation continues.

Code: `src/app/voice.tsx` (screen), `src/hooks/use-voice-agent.ts` (session orchestration),
`src/lib/deepgram/` (`client.ts` WebSocket, `messages.ts` settings/prompt/parsing,
`playback-queue.ts` + `pcm.ts` audio, `voice-state.ts` state machine, `native-audio.ts`).

### Native audio dependency

Real-time streaming needs native audio code, provided by
[`@speechmatics/expo-two-way-audio`](https://github.com/speechmatics/expo-two-way-audio):
microphone PCM at 16 kHz with **acoustic echo cancellation** (iOS voice processing /
Android `AcousticEchoCanceler`) and PCM playback. Echo cancellation is what stops the companion
from hearing its own voice through the speaker and interrupting itself.
(`react-native-audio-api` was considered, but it does not enable voice processing on iOS.)

**Expo Go is not expected to support this.** The module isn't part of Expo Go; there the voice
screen shows a message instead of crashing. Everything else in the app still works in Expo Go.

### Microphone permissions

- iOS: `NSMicrophoneUsageDescription` is set through the `expo-audio` config plugin in `app.json`.
- Android: `RECORD_AUDIO` and `MODIFY_AUDIO_SETTINGS` in `app.json`.
- If permission is denied, the screen offers **Open Settings** and **Try again**.

### Running the native development build (iPhone, on a Mac)

Requirements: a Mac with Xcode, an iPhone with a cable, and an Apple ID
(a free Apple ID works for installing on your own phone; builds signed that way expire after 7 days).

```bash
cd dream-journal
npm install
npx expo install expo-dev-client   # not installed on Windows on purpose (see below)
npx expo run:ios --device
```

`expo-dev-client` is left out while developing on Windows with Expo Go: once it's installed,
`npx expo start` shows a development-build QR code that Expo Go can't open.

1. Pick your iPhone when asked. The first build takes several minutes.
2. If Xcode reports a signing error, open `ios/*.xcworkspace` in Xcode, select the app target →
   **Signing & Capabilities**, choose your Team (your Apple ID), and run again. If the bundle ID
   `com.moazamdev.aidreamjournal` is taken, change `ios.bundleIdentifier` in `app.json`.
3. On the iPhone: **Settings → General → VPN & Device Management** → trust your developer profile.
4. Afterwards, day to day: `npx expo start --dev-client` and open the installed app.

Cloud alternative (needs a paid Apple Developer account): `npx eas-cli build --profile development --platform ios`.
`ios/` and `android/` are generated and ignored by Git; never edit them by hand.

### Testing the voice agent

Automated: `npm test` covers message parsing, settings, state transitions, PCM handling,
the playback queue (including interruption) and WebSocket handling with a fake socket.

On the phone:

1. Home → **Talk to your dreams** → **Start conversation** → allow the microphone.
2. The greeting plays: "Hey, tell me about your dream. What's the first thing you remember?"
3. Speak; the transcript shows your words and the companion replies aloud.
4. Talk over it while it's speaking: it stops and listens.
5. Continue several turns; try **Mute** / **Unmute**.
6. **End conversation**, then start another one.
7. From a dream: Dream Detail → **Talk about this dream** (the greeting mentions the dream).
8. Deny microphone permission (Settings → Dream Journal → Microphone off) → friendly message.
9. Turn on Airplane Mode mid-conversation → "connection was lost" → **Reconnect**.
