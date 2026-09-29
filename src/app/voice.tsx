import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion, useSharedValue } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect } from 'react-native-svg';

import { CARD_BACKGROUNDS } from '@/components/today/backgrounds';
import { animate, FADE, loop, RING, rise } from '@/components/today/motion';
import { CAPTION_HEIGHT, VoiceCaption } from '@/components/voice/voice-caption';
import { VISUAL_HEIGHT, VoiceVisual, visualModeCode, type VisualMode } from '@/components/voice/voice-visual';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useVoiceAgent } from '@/hooks/use-voice-agent';
import { saveConversation } from '@/lib/conversations';
import { canSaveTranscript, dreamTextFromTranscript } from '@/lib/deepgram/conversation';
import type { DreamContext } from '@/lib/deepgram/types';
import { isLiveStatus } from '@/lib/deepgram/voice-state';
import { analyzeDream, createDream, fetchDreamById } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { formatClock } from '@/utils/today';
import { getErrorMessage } from '@/utils/errors';

/** What the screen is doing with the conversation once the talking has stopped. */
type SaveStep = 'none' | 'saving' | 'reflecting';

/** The lines that cycle under the rings while the dream is being pieced together. */
const READING_LINES = ['piecing it together…', 'finding the symbols…', 'feeling out the mood…'];
/** And while the companion is still picking up. Usually only the first is ever seen. */
const WAKING_LINES = ['waking afterdream…', 'one moment…'];
const LINE_MS = 1400;

/** Lets the screen finish sliding in before the microphone opens. */
const AUTOSTART_DELAY_MS = 450;

/** Positions from the design's 390×844 frame, measured from the bottom so they hold on any phone. */
const CONTROLS_ABOVE_INSET = 18;
const CAPTION_ABOVE_INSET = 110;

/**
 * Voice companion screen ("/voice"), from the Afterdream Voice Agent design: a blurred night
 * photo, a living orb and sound waves that swell with whoever is talking, the line being
 * spoken as a caption underneath, and mute / end / skip along the bottom.
 *
 * Params:
 * - `dreamId` — talk about a dream that is already saved. Never creates a second one.
 * - `autostart` — connect as soon as the screen opens (home's yap button does this).
 *
 * Ending the conversation runs the design's ripple while the dream is saved in their own
 * words and read, then hands off to the Dream screen's analysis — the same place a written
 * or recorded dream lands. The whole back-and-forth is kept for its transcript tab.
 */
export default function VoiceScreen() {
  const { dreamId, autostart } = useLocalSearchParams<{ dreamId?: string; autostart?: string }>();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { dream, loadingDream } = useDreamContext(dreamId);
  const { state, inputLevel, outputLevel, start, end, interrupt, toggleMute } = useVoiceAgent(dream);
  const [saveStep, setSaveStep] = useState<SaveStep>('none');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [captions, setCaptions] = useState(true);

  const live = isLiveStatus(state.status);
  const saving = saveStep !== 'none';
  const seconds = useCallSeconds(live);
  // Only a dream being told for the first time is worth saving, and only once they said enough.
  const canSave = !dreamId && canSaveTranscript(state.transcript);
  const canStart = !live && !saving && state.status !== 'connecting' && !loadingDream && state.error?.kind !== 'unsupported';
  const latest = state.transcript[state.transcript.length - 1];
  const speaking = state.status === 'speaking';

  const mode: VisualMode = saving
    ? 'thinking'
    : state.status === 'listening'
      ? 'you'
      : state.status === 'speaking' || state.status === 'thinking'
        ? 'afterdream'
        : 'idle';

  // The picture is driven through shared values, not props: this screen re-renders several
  // times a second (the caption reveals a word at a time, the clock ticks) and every one of
  // those renders would otherwise restart the orb's animation.
  const visualMode = useSharedValue(visualModeCode(mode));
  const visualMuted = useSharedValue(state.muted);
  useEffect(() => {
    visualMode.set(visualModeCode(mode));
  }, [mode, visualMode]);
  useEffect(() => {
    visualMuted.set(state.muted);
  }, [state.muted, visualMuted]);

  // Opened from home's yap button: connect on our own, once.
  const started = useRef(false);
  useEffect(() => {
    if (autostart !== '1' || started.current || loadingDream) return;
    started.current = true;
    const timer = setTimeout(start, AUTOSTART_DELAY_MS);
    return () => clearTimeout(timer);
    // `start` changes identity with the loaded dream; only the first chance to run counts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autostart, loadingDream]);

  /** Saves what they told the companion, asks for the reading, then opens the dream. */
  async function saveDream() {
    setSaveError(null);
    setSaveStep('saving');

    // 1. Save the dream in their own words. If this fails, nothing they said is lost:
    //    the screen comes back with the conversation still on it.
    let saved: Dream;
    try {
      saved = await createDream(dreamTextFromTranscript(state.transcript));
    } catch (error) {
      setSaveError(getErrorMessage(error));
      setSaveStep('none');
      return;
    }

    // 2. Keep the conversation itself on the phone, so the Dream screen's transcript tab
    //    can show what the companion asked as well as what they answered.
    saveConversation(saved.id, state.transcript);

    // 3. Ask for the reading. If this fails the dream is still saved, and the Dream
    //    screen shows its own "try again".
    setSaveStep('reflecting');
    try {
      await analyzeDream(saved.id);
    } catch (error) {
      console.warn('AI reflection failed:', getErrorMessage(error));
    }

    // 4. Open it on the analysis tab. `replace` so "back" doesn't return to the call.
    router.replace({ pathname: '/dream/[id]', params: { id: saved.id, tab: 'analysis' } });
  }

  /** Ends the call, then turns it into a dream when there is one worth keeping. */
  function handleEnd() {
    end();
    if (canSave) void saveDream();
  }

  function handleClose() {
    // Don't walk out halfway through saving; the dream would be left without its reading.
    if (saving) return;
    end();
    if (router.canGoBack()) router.back();
    else router.replace('/home');
  }

  /** Tapping the picture while afterdream is talking cuts it off and gives you the floor. */
  function handleTapVisual() {
    if (speaking) interrupt();
    else if (canStart) start();
  }

  const controlsBottom = Math.max(insets.bottom, 34) + CONTROLS_ABOVE_INSET;
  const captionBottom = Math.max(insets.bottom, 34) + CAPTION_ABOVE_INSET;

  // The headline, the caption and the status line all live in the same place above the
  // controls, so exactly one of them is on screen at a time and they can never overlap.
  const problem = saveError ?? state.error?.message ?? null;
  const showStatus = state.status === 'connecting' || saving || !!problem;
  const showCaption = !showStatus && live && captions && !!latest;
  const showHeadline = !showStatus && !showCaption && !live;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {/* A night photo, blurred right down, under a dark wash — the design's backdrop. */}
      <Image source={CARD_BACKGROUNDS[0]} style={styles.photo} contentFit="cover" blurRadius={26} />
      <View style={styles.wash} pointerEvents="none" />

      <Pressable
        style={[styles.visual, { top: insets.top + 62 }]}
        onPress={handleTapVisual}
        accessibilityRole="button"
        accessibilityLabel={speaking ? 'Interrupt afterdream' : 'Start talking'}>
        <VoiceVisual
          mode={visualMode}
          muted={visualMuted}
          inputLevel={inputLevel}
          outputLevel={outputLevel}
          width={width}
          reduceMotion={reduceMotion}
        />
      </Pressable>

      {/* The rings that ripple out while the dream is being read. */}
      {saving && !reduceMotion && (
        <View pointerEvents="none" style={[styles.rings, { top: insets.top + 62 + VISUAL_HEIGHT / 2 - 120 }]}>
          <Animated.View style={[styles.ring, loop(reduceMotion, RING, 2000)]} />
          <Animated.View style={[styles.ring, animate(reduceMotion, { animationName: RING, animationDuration: 2000, animationDelay: 1000, animationTimingFunction: 'ease-out', animationIterationCount: 'infinite' })]} />
        </View>
      )}

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <RoundButton label="Close" onPress={handleClose} disabled={saving} size={36}>
          <Text style={styles.close}>✕</Text>
        </RoundButton>

        <View style={[styles.pill, { opacity: live ? 1 : 0 }]} pointerEvents="none">
          <Animated.View style={[styles.dot, loop(reduceMotion, PULSE_DOT, 1400)]} />
          <Text style={styles.pillText}>{formatClock(seconds)}</Text>
        </View>

        <RoundButton
          label={captions ? 'Hide captions' : 'Show captions'}
          onPress={() => setCaptions((on) => !on)}
          size={36}
          filled={captions}>
          <Text style={[styles.cc, captions && styles.ccOn]}>cc</Text>
        </RoundButton>
      </View>

      {showHeadline && (
        <Animated.View
          key="headline"
          style={[styles.headline, { bottom: captionBottom }, animate(reduceMotion, { animationName: FADE, animationDuration: 600 })]}>
          <Text style={styles.headlineText}>{dream ? 'let’s talk it through.' : 'let’s talk about last night.'}</Text>
        </Animated.View>
      )}

      {/* The line being spoken right now. */}
      {showCaption && (
        <View style={[styles.caption, { bottom: captionBottom }]}>
          <VoiceCaption
            id={latest.id}
            who={latest.role === 'user' ? 'you' : 'afterdream'}
            text={latest.text}
            speaking={speaking || state.status === 'listening'}
            reduceMotion={reduceMotion}
          />
        </View>
      )}

      {/* What the screen is doing, when it isn't a conversation: connecting, reading, or broken. */}
      {showStatus && (
        <Animated.View
          key="status"
          style={[styles.status, { bottom: captionBottom }, animate(reduceMotion, { animationName: FADE, animationDuration: 500 })]}
          pointerEvents="none">
          <Text style={[styles.statusText, !!problem && styles.statusError]} accessibilityLiveRegion="polite">
            {problem ?? (saving ? <WaitingLine key="reading" lines={READING_LINES} /> : <WaitingLine key="waking" lines={WAKING_LINES} />)}
          </Text>
        </Animated.View>
      )}

      <View style={[styles.controls, { bottom: controlsBottom }]}>
        {live ? (
          <>
            <RoundButton label={state.muted ? 'Unmute' : 'Mute'} onPress={toggleMute} size={42} filled={state.muted}>
              <MicIcon colour={state.muted ? '#111' : '#fff'} slashed={state.muted} />
            </RoundButton>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="End the conversation"
              onPress={handleEnd}
              style={({ pressed }) => [styles.end, pressed && styles.pressedHard]}>
              <View style={styles.endSquare} />
            </Pressable>

            <RoundButton label="Skip this question" onPress={interrupt} size={42}>
              <Text style={styles.skip}>↷</Text>
            </RoundButton>
          </>
        ) : saving ? null : (
          <Animated.View style={rise(reduceMotion, 0, 500)}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={canSave ? 'Keep talking' : 'Start talking'}
              accessibilityState={{ disabled: !canStart }}
              disabled={!canStart}
              onPress={start}
              style={({ pressed }) => [styles.start, pressed && styles.pressedHard, !canStart && styles.dim]}>
              <MicIcon colour="#111" slashed={false} size={17} />
            </Pressable>
          </Animated.View>
        )}
      </View>

      {/* The conversation dropped or saving failed, but there is still a dream worth keeping. */}
      {!live && !saving && canSave && (
        <Pressable
          accessibilityRole="button"
          onPress={saveDream}
          style={({ pressed }) => [styles.keep, { bottom: controlsBottom + 74 }, pressed && styles.pressed]}>
          <Text style={styles.keepText}>{saveError ? 'try keeping it again' : 'interpret it'}</Text>
        </Pressable>
      )}
    </View>
  );
}

/** The pulsing dot in the timer pill (the design's `vDot`). */
const PULSE_DOT = { '0%': { opacity: 1 }, '50%': { opacity: 0.25 }, '100%': { opacity: 1 } };

/**
 * A quiet line that changes every so often, so a wait reads as a moment rather than a stall.
 * Give it a `key` per set of lines: a new wait should start again from the first one.
 */
function WaitingLine({ lines }: { lines: readonly string[] }) {
  const [line, setLine] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => setLine((n) => (n + 1) % lines.length), LINE_MS);
    return () => clearInterval(timer);
  }, [lines]);
  return <>{lines[line]}</>;
}

/**
 * Counts the conversation up from zero, for the pill in the top bar. Measured against the
 * clock rather than counted in ticks, so it stays right if a frame is dropped.
 */
function useCallSeconds(live: boolean) {
  const [seconds, setSeconds] = useState(0);
  useEffect(() => {
    if (!live) return;
    const startedAt = Date.now();
    const timer = setInterval(() => setSeconds(Math.floor((Date.now() - startedAt) / 1000)), 500);
    return () => clearInterval(timer);
  }, [live]);
  // Back to zero the moment the call ends, without another render pass to do it.
  return live ? seconds : 0;
}

/** Loads the selected dream (only the fields the companion needs), if one was passed. */
function useDreamContext(dreamId: string | undefined) {
  const [dream, setDream] = useState<DreamContext | null>(null);
  const [loadingDream, setLoadingDream] = useState(!!dreamId);

  useEffect(() => {
    if (!dreamId) return;
    let active = true;
    fetchDreamById(dreamId)
      .then((row) => {
        if (!active || !row) return;
        setDream({
          dreamText: row.dream_text,
          title: row.title,
          mood: row.mood,
          themes: row.themes,
          summary: row.summary,
        });
      })
      .catch((error) => console.warn('Could not load dream for the voice companion:', error))
      // If it fails, the companion still works; it just starts without the dream.
      .finally(() => {
        if (active) setLoadingDream(false);
      });
    return () => {
      active = false;
    };
  }, [dreamId]);

  return { dream, loadingDream };
}

type RoundButtonProps = {
  label: string;
  onPress: () => void;
  size: number;
  filled?: boolean;
  disabled?: boolean;
  children: React.ReactNode;
};

/** The frosted circles in the top bar and along the controls. White when they are on. */
function RoundButton({ label, onPress, size, filled = false, disabled = false, children }: RoundButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled, selected: filled }}
      disabled={disabled}
      onPress={onPress}
      hitSlop={8}
      style={({ pressed }) => [
        styles.round,
        { width: size, height: size, borderRadius: size / 2 },
        filled && styles.roundOn,
        pressed && styles.pressed,
        disabled && styles.dim,
      ]}>
      {children}
    </Pressable>
  );
}

/** The microphone from the design, with a stroke through it when muted. */
function MicIcon({ colour, slashed, size = 15 }: { colour: string; slashed: boolean; size?: number }) {
  return (
    <Svg width={(size * 12) / 15} height={size} viewBox="0 0 16 20">
      <Rect x={4} y={0} width={8} height={13} rx={4} fill={colour} />
      <Path d="M1 9a7 7 0 0014 0M8 16v4" stroke={colour} strokeWidth={2} fill="none" strokeLinecap="round" />
      {slashed && <Path d="M1 1l14 18" stroke="#111" strokeWidth={2.2} strokeLinecap="round" />}
    </Svg>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#0b0f1f',
  },
  photo: {
    position: 'absolute',
    top: -60,
    left: -60,
    right: -60,
    bottom: -60,
    opacity: 0.55,
  },
  wash: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    experimental_backgroundImage:
      'linear-gradient(180deg, rgba(0,0,0,0.45), rgba(0,0,0,0.2) 40%, rgba(0,0,0,0.7))',
  },
  visual: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: VISUAL_HEIGHT,
  },
  rings: {
    position: 'absolute',
    left: '50%',
    width: 240,
    height: 240,
    marginLeft: -120,
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 120,
    borderWidth: 1.5,
    borderColor: 'rgba(226, 235, 152, 0.6)',
  },
  topBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 3,
  },
  round: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  roundOn: {
    backgroundColor: '#fff',
  },
  close: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  cc: {
    fontFamily: BrandFonts.semibold,
    fontSize: 10,
    lineHeight: 12,
    color: '#fff',
  },
  ccOn: {
    color: '#111',
  },
  pill: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#e05a5a',
  },
  pillText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  headline: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: CAPTION_HEIGHT,
    justifyContent: 'flex-start',
  },
  headlineText: {
    fontFamily: BrandFonts.medium,
    fontSize: 32,
    lineHeight: 35,
    letterSpacing: -1.2,
    color: '#fff',
    textAlign: 'center',
  },
  caption: {
    position: 'absolute',
    left: 28,
    right: 28,
  },
  status: {
    position: 'absolute',
    left: 28,
    right: 28,
    height: CAPTION_HEIGHT,
    justifyContent: 'flex-start',
  },
  statusText: {
    fontFamily: BrandFonts.regular,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.4,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
  },
  statusError: {
    fontSize: 16,
    lineHeight: 22,
    color: '#e05a5a',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 22,
  },
  start: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  end: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  endSquare: {
    width: 14,
    height: 14,
    borderRadius: 4,
    backgroundColor: '#e05a5a',
  },
  skip: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 19,
    color: '#fff',
  },
  keep: {
    position: 'absolute',
    alignSelf: 'center',
    height: 52,
    paddingHorizontal: 24,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  keepText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 20,
    color: '#111',
  },
  pressed: {
    opacity: 0.85,
  },
  pressedHard: {
    transform: [{ scale: 0.95 }],
  },
  dim: {
    opacity: 0.4,
  },
});
