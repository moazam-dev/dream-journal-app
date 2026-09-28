import { useEffect, useRef, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';
import { useKeyboardOverlap } from '@/hooks/use-keyboard-overlap';
import { SAMPLE_LINES, TYPEWRITER_START, typewriterStep, typewriterText, wordCount, writeHint } from '@/utils/today';

import { EASE_OUT } from './motion';
import { CardHeading, CardPill, TodayCard } from './today-card';

const TYPE_MS = 70;
/** Box and heading positions from the design (a 610 pt card). */
const BOX_CLOSED = 124;
const BOX_OPEN = 290;
const TITLE_OPEN_TOP = 96;
/** Room the heading needs above the open box: its top, the two lines, and a gap. */
const HEADING_ROOM = 215;
const OPEN_PLACEHOLDER = 'start anywhere — a place, a face, a feeling…';

type WriteCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  greeting: string;
  /** While typing, the feed stops scrolling so the card stays put above the keyboard. */
  onWritingChange: (writing: boolean) => void;
  onSubmit: (text: string) => void;
};

/**
 * Card 1: "what did you dream about last night?" The box types sample dreams until it is
 * tapped; then it grows into a writing space, and ↑ sends the dream to be interpreted.
 */
export function WriteCard({ height, active, reduceMotion, greeting, onWritingChange, onSubmit }: WriteCardProps) {
  const card = useRef<View>(null);
  const input = useRef<TextInput>(null);
  const [draft, setDraft] = useState('');
  const [focused, setFocused] = useState(false);
  // How far the keyboard reaches up into the card, so the box can sit just above it.
  const keyboardOverlap = useKeyboardOverlap(card);

  const hasDraft = wordCount(draft) > 0;
  const open = focused || hasDraft;
  const scale = height / 610;
  const boxBottom = Math.max(22, keyboardOverlap + 12);
  const boxHeight = open ? Math.max(BOX_CLOSED, Math.min(BOX_OPEN, height - boxBottom - HEADING_ROOM)) : BOX_CLOSED;
  const titleTop = open ? TITLE_OPEN_TOP : Math.round(230 * scale);

  function setWriting(next: boolean) {
    setFocused(next);
    onWritingChange(next);
  }

  function submit() {
    if (!hasDraft) return;
    const text = draft.trim();
    Keyboard.dismiss();
    setDraft('');
    onSubmit(text);
  }

  return (
    <TodayCard
      ref={card}
      height={height}
      active={active}
      reduceMotion={reduceMotion}
      label="write it down"
      base="#6f8290"
      gradient="radial-gradient(70% 45% at 75% 78%, #d8a585, transparent 70%), radial-gradient(90% 60% at 40% 10%, #5e7383, transparent 70%)"
      photo="https://picsum.photos/id/1015/600/900"
      glow={{ left: 160, top: 330, width: 260, height: 260, color: '#b8805e', opacity: 0.3, drift: 'out', duration: 14000 }}>
      {/* Tapping the card around the box puts the keyboard away. */}
      <Pressable style={StyleSheet.absoluteFill} onPress={Keyboard.dismiss} accessible={false} />
      <CardPill step={1} stepColor="#44525c" label="write it down" />
      <CardHeading top={0} eyebrow={greeting} title="what did you dream about last night?" style={[{ top: titleTop }, !reduceMotion && { transitionProperty: 'top', transitionDuration: 500, transitionTimingFunction: EASE_OUT }]} />

      <Animated.View
        style={[
          styles.box,
          { bottom: boxBottom, height: boxHeight, backgroundColor: open ? 'rgba(255, 255, 255, 0.2)' : 'rgba(255, 255, 255, 0.16)' },
          !reduceMotion && { transitionProperty: ['height', 'bottom', 'backgroundColor'], transitionDuration: 500, transitionTimingFunction: EASE_OUT },
        ]}>
        <View style={styles.field}>
          <TextInput
            ref={input}
            value={draft}
            onChangeText={setDraft}
            onFocus={() => setWriting(true)}
            onBlur={() => setWriting(false)}
            multiline
            style={styles.input}
            placeholder={open ? OPEN_PLACEHOLDER : ''}
            placeholderTextColor="rgba(255, 255, 255, 0.7)"
            selectionColor={BrandColors.lime}
            cursorColor={BrandColors.lime}
            textAlignVertical="top"
            accessibilityLabel="Write your dream"
            accessibilityHint="Then press interpret"
          />
          {!open && (
            // Until they tap in, sample dreams type themselves where the text will go.
            <Pressable style={StyleSheet.absoluteFill} onPress={() => input.current?.focus()} accessibilityRole="button" accessibilityLabel="Start writing your dream">
              <TypedSample reduceMotion={reduceMotion} />
            </Pressable>
          )}
        </View>
        <View style={styles.footer}>
          <Text style={styles.hint}>{writeHint(draft, open)}</Text>
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
    </TodayCard>
  );
}

/** Sample dreams typing and erasing themselves (the design shows them as the placeholder). */
function TypedSample({ reduceMotion }: { reduceMotion: boolean }) {
  const [state, setState] = useState(TYPEWRITER_START);

  useEffect(() => {
    if (reduceMotion) return;
    const timer = setInterval(() => setState(typewriterStep), TYPE_MS);
    return () => clearInterval(timer);
  }, [reduceMotion]);

  return (
    <Text style={[styles.input, styles.sample]} numberOfLines={2} importantForAccessibility="no">
      {reduceMotion ? SAMPLE_LINES[0] : typewriterText(state)}
    </Text>
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
  sample: {
    color: 'rgba(255, 255, 255, 0.7)',
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
});
