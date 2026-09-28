import { useRef, useState, type ReactNode } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDreamRecorder } from '@/hooks/use-dream-recorder';
import { useKeyboardOverlap } from '@/hooks/use-keyboard-overlap';
import { formatClock, wordCount, writeHint } from '@/utils/today';

import { ease, EASE_OUT, PULSE, rise } from './motion';
import { CardHeading, CardPill, TodayCard } from './today-card';

/** Box and heading positions from the design (a 610 pt card). */
const BOX_CLOSED = 124;
const BOX_OPEN = 290;
const TITLE_OPEN_TOP = 96;
/** Room the heading needs above the open box: its top, the two lines, and a gap. */
const HEADING_ROOM = 215;
const OPEN_PLACEHOLDER = 'start anywhere — a place, a face, a feeling…';

/** The big yap button in the middle, and the small type / speak buttons either side. */
const YAP_SIZE = 72;
const SMALL_SIZE = 48;
const COLUMN_GAP = 12;
/** Room the heading takes (greeting plus two lines of title), to centre it in the card. */
const HEADING_HEIGHT = 110;
const RED = '#e05a5a';

type WriteCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  greeting: string;
  /** While typing, the feed stops scrolling so the card stays put above the keyboard. */
  onWritingChange: (writing: boolean) => void;
  /** Called with the written dream. */
  onSubmit: (text: string) => void;
  /** Called with what they said (once it has been turned into text) and how long they talked. */
  onYap: (text: string, seconds: number) => void;
  /** Opens the live voice companion. */
  onSpeak: () => void;
};

/**
 * Card 1: "what did you dream about last night?", centred, with three buttons along the
 * bottom: type (opens a writing space, where ↑ sends the dream), yap (the big one: say it
 * out loud, stopping sends it to be interpreted) and speak (the live voice companion).
 */
export function WriteCard({ height, active, reduceMotion, greeting, onWritingChange, onSubmit, onYap, onSpeak }: WriteCardProps) {
  const card = useRef<View>(null);
  const [draft, setDraft] = useState('');
  const [writing, setWriting] = useState(false);
  // How far the keyboard reaches up into the card, so the box can sit just above it.
  const keyboardOverlap = useKeyboardOverlap(card);

  // How long the last recording ran, read when it stops (the recorder resets after).
  const spoken = useRef(0);
  const voice = useDreamRecorder((text) => onYap(text, spoken.current));
  const recording = voice.phase === 'recording';
  const busy = voice.phase === 'transcribing';

  const hasDraft = wordCount(draft) > 0;
  const open = writing || hasDraft;
  const boxBottom = Math.max(22, keyboardOverlap + 12);
  const boxHeight = Math.max(BOX_CLOSED, Math.min(BOX_OPEN, height - boxBottom - HEADING_ROOM));
  const titleTop = open ? TITLE_OPEN_TOP : Math.round((height - HEADING_HEIGHT) / 2);

  function startWriting() {
    setWriting(true);
    onWritingChange(true);
  }

  function stopWriting() {
    onWritingChange(false);
    // Nothing written: go back to the mic.
    if (!hasDraft) setWriting(false);
  }

  function submit() {
    if (!hasDraft) return;
    const text = draft.trim();
    Keyboard.dismiss();
    setDraft('');
    setWriting(false);
    onSubmit(text);
  }

  function stopRecording() {
    spoken.current = voice.durationMillis / 1000;
    voice.stopAndTranscribe();
  }

  function yapLabel() {
    if (recording) return formatClock(voice.durationMillis / 1000);
    if (busy) return '…';
    return 'yap';
  }

  return (
    <TodayCard
      ref={card}
      height={height}
      active={active}
      reduceMotion={reduceMotion}
      label="tell your dream"
      base="#6f8290"
      gradient="radial-gradient(70% 45% at 75% 78%, #d8a585, transparent 70%), radial-gradient(90% 60% at 40% 10%, #5e7383, transparent 70%)"
      photo="https://picsum.photos/id/1015/600/900"
      glow={{ left: 160, top: 330, width: 260, height: 260, color: '#b8805e', opacity: 0.3, drift: 'out', duration: 14000 }}>
      {/* Tapping the card around the box puts the keyboard away. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} accessible={false} />
      <CardPill icon={<EyeIcon />} label="your dream" />
      <CardHeading
        top={0}
        eyebrow={greeting}
        title="what did you dream about last night?"
        titleStyle={styles.title}
        style={[{ top: titleTop }, !reduceMotion && { transitionProperty: 'top', transitionDuration: 500, transitionTimingFunction: EASE_OUT }]}
      />

      {open ? (
        <Animated.View style={[styles.box, { bottom: boxBottom, height: boxHeight }, rise(reduceMotion, 0, 400)]}>
          <View style={styles.field}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              onFocus={() => onWritingChange(true)}
              onBlur={stopWriting}
              autoFocus
              multiline
              style={styles.input}
              placeholder={OPEN_PLACEHOLDER}
              placeholderTextColor="rgba(255, 255, 255, 0.7)"
              selectionColor={BrandColors.lime}
              cursorColor={BrandColors.lime}
              textAlignVertical="top"
              accessibilityLabel="Write your dream"
              accessibilityHint="Then press interpret"
            />
          </View>
          <View style={styles.footer}>
            <Text style={styles.hint}>{writeHint(draft, true)}</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Interpret"
              accessibilityState={{ disabled: !hasDraft }}
              disabled={!hasDraft}
              onPress={submit}
              hitSlop={6}>
              <Animated.View
                style={[
                  styles.send,
                  { backgroundColor: hasDraft ? BrandColors.lime : 'rgba(255, 255, 255, 0.25)', transform: [{ scale: hasDraft ? 1 : 0.9 }] },
                  !reduceMotion && { transitionProperty: ['backgroundColor', 'transform'], transitionDuration: 300 },
                ]}>
                <Text style={[styles.sendGlyph, { color: hasDraft ? '#111' : 'rgba(255, 255, 255, 0.7)' }]}>↑</Text>
              </Animated.View>
            </Pressable>
          </View>
        </Animated.View>
      ) : (
        <Animated.View style={[styles.controls, rise(reduceMotion, 0, 400)]}>
          <SideButton label="type" hidden={recording || busy} onPress={startWriting} reduceMotion={reduceMotion} accessibilityLabel="Type your dream">
            <PenIcon />
          </SideButton>

          <View style={styles.column}>
            <View style={styles.slot}>
              {recording && !reduceMotion && (
                <Animated.View
                  style={[
                    styles.ring,
                    { animationName: PULSE, animationDuration: 1600, animationTimingFunction: 'ease-out', animationIterationCount: 'infinite' },
                  ]}
                />
              )}
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={recording ? 'Stop recording' : 'Yap: say your dream out loud'}
                accessibilityState={{ busy }}
                disabled={busy}
                onPress={recording ? stopRecording : voice.start}
                style={({ pressed }) => pressed && styles.pressed}>
                <Animated.View
                  style={[styles.yap, { backgroundColor: recording ? '#fff' : 'rgba(255, 255, 255, 0.26)' }, ease(reduceMotion, ['backgroundColor'])]}>
                  {recording ? <View style={styles.stop} /> : <WaveIcon dim={busy} />}
                </Animated.View>
              </Pressable>
            </View>
            <Text style={styles.label} accessibilityLiveRegion="polite">
              {yapLabel()}
            </Text>
          </View>

          <SideButton label="speak" hidden={recording || busy} onPress={onSpeak} reduceMotion={reduceMotion} accessibilityLabel="Speak with your dream companion">
            <MicIcon />
          </SideButton>
        </Animated.View>
      )}
    </TodayCard>
  );
}

type SideButtonProps = {
  label: string;
  accessibilityLabel: string;
  /** Faded out and untouchable while a recording is going. */
  hidden: boolean;
  onPress: () => void;
  reduceMotion: boolean;
  children: ReactNode;
};

/** Small round button with a one-word label under it. */
function SideButton({ label, accessibilityLabel, hidden, onPress, reduceMotion, children }: SideButtonProps) {
  return (
    <Animated.View style={[styles.column, { opacity: hidden ? 0 : 1, pointerEvents: hidden ? 'none' : 'auto' }, ease(reduceMotion, ['opacity'])]}>
      <View style={styles.slot}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={accessibilityLabel}
          onPress={onPress}
          hitSlop={8}
          style={({ pressed }) => pressed && styles.pressed}>
          <View style={styles.small}>{children}</View>
        </Pressable>
      </View>
      <Text style={styles.label}>{label}</Text>
    </Animated.View>
  );
}

/** Sound wave, for yapping. */
function WaveIcon({ dim }: { dim: boolean }) {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24" fill="none" opacity={dim ? 0.4 : 1}>
      <Path
        d="M2 12h3.2l2.3-4.5 3.2 11L14 3.5l2.9 13.5 1.9-5H22"
        stroke="#fff"
        strokeWidth={2.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** Microphone, for speaking with the companion. */
function MicIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={9} y={3} width={6} height={11} rx={3} stroke="#fff" strokeWidth={2} />
      <Path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3" stroke="#fff" strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Pencil, for typing. */
function PenIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill="#fff"
      />
    </Svg>
  );
}

/** Open eye, for the card's label. */
function EyeIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" stroke="#fff" strokeWidth={2} strokeLinejoin="round" />
      <Path d="M12 9.2a2.8 2.8 0 1 1 0 5.6 2.8 2.8 0 0 1 0-5.6z" fill="#fff" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 18,
    right: 18,
    borderRadius: 28,
    borderCurve: 'continuous',
    paddingTop: 18,
    paddingRight: 18,
    paddingBottom: 14,
    paddingLeft: 20,
    gap: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  field: {
    flex: 1,
  },
  input: {
    flex: 1,
    padding: 0,
    fontFamily: BrandFonts.regular,
    fontSize: 17,
    lineHeight: 24,
    color: '#fff',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  hint: {
    flexShrink: 1,
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  send: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGlyph: {
    fontFamily: BrandFonts.semibold,
    fontSize: 18,
    lineHeight: 22,
  },
  title: {
    fontFamily: BrandFonts.regular,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -0.8,
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 34,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: COLUMN_GAP,
  },
  column: {
    width: YAP_SIZE,
    alignItems: 'center',
    gap: 8,
  },
  /** Same height for every button, so the small ones line up with the big one's middle. */
  slot: {
    width: YAP_SIZE,
    height: YAP_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: YAP_SIZE / 2,
    backgroundColor: '#fff',
  },
  yap: {
    width: YAP_SIZE,
    height: YAP_SIZE,
    borderRadius: YAP_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  small: {
    width: SMALL_SIZE,
    height: SMALL_SIZE,
    borderRadius: SMALL_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  stop: {
    width: 22,
    height: 22,
    borderRadius: 5,
    backgroundColor: RED,
  },
  pressed: {
    transform: [{ scale: 0.95 }],
  },
  label: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 18,
    color: 'rgba(255, 255, 255, 0.65)',
    fontVariant: ['tabular-nums'],
  },
});
