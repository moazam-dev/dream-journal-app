import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';
import { useKeyboardOverlap } from '@/hooks/use-keyboard-overlap';
import { askNextFragment } from '@/services/dreams';
import { getErrorMessage } from '@/utils/errors';
import { FIRST_ASK, fragmentsHint, MAX_ASKS, type Ask, type Fragment } from '@/utils/today';

import { animate, BUBBLE_IN, ease } from './motion';
import { CardHeading, CardPill, glass, TodayCard } from './today-card';

const DOT_BLINK = {
  '0%': { opacity: 0.3 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.3 },
};

type TalkCardProps = {
  height: number;
  active: boolean;
  reduceMotion: boolean;
  /** While typing an answer, the feed stops scrolling so the card stays above the keyboard. */
  onWritingChange: (writing: boolean) => void;
  /** Called with every question and answer once they stop, or the limit is reached. */
  onSubmit: (fragments: Fragment[]) => void;
  /** Opens the voice companion; `null` when it isn't available (Expo Go). */
  onTalkOutLoud: (() => void) | null;
};

/**
 * Card 2: for dreams they only remember bits of. Afterdream asks a question, they tap an
 * answer or type their own, and the AI asks the next question based on that answer. They
 * can stop whenever they like ("that's it"); after MAX_ASKS answers it stops by itself.
 * The answers are then pieced together into one dream and interpreted.
 */
export function TalkCard({ height, active, reduceMotion, onWritingChange, onSubmit, onTalkOutLoud }: TalkCardProps) {
  const card = useRef<View>(null);
  const input = useRef<TextInput>(null);
  const [fragments, setFragments] = useState<Fragment[]>([]);
  const [ask, setAsk] = useState<Ask | null>(FIRST_ASK);
  const [thinking, setThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  // Each question request gets a number; answers to an older request are ignored.
  const request = useRef(0);
  const keyboardOverlap = useKeyboardOverlap(card);

  const count = fragments.length;
  const last = fragments.at(-1);
  const pop = (delay: number) => animate(reduceMotion, { animationName: BUBBLE_IN, animationDuration: 350, animationDelay: delay, animationTimingFunction: 'ease' });

  function setWriting(next: boolean) {
    setTyping(next);
    onWritingChange(next);
  }

  async function fetchNext(list: Fragment[]) {
    const id = ++request.current;
    setThinking(true);
    setError(null);
    try {
      const next = await askNextFragment(list);
      if (id === request.current) setAsk(next);
    } catch (err) {
      if (id === request.current) setError(getErrorMessage(err));
    } finally {
      if (id === request.current) setThinking(false);
    }
  }

  function answer(text: string) {
    const clean = text.trim();
    if (!ask || !clean) return;
    const next = [...fragments, { question: ask.question, answer: clean }];
    setDraft('');
    input.current?.blur();
    if (next.length >= MAX_ASKS) {
      finish(next);
      return;
    }
    setFragments(next);
    setAsk(null);
    fetchNext(next);
  }

  /** Hands the answers over and starts the card again for next time. */
  function finish(list: Fragment[]) {
    request.current++;
    input.current?.blur();
    onSubmit(list);
    setFragments([]);
    setAsk(FIRST_ASK);
    setThinking(false);
    setError(null);
    setDraft('');
  }

  const chatBottom = Math.max(22, keyboardOverlap + 12);

  return (
    <TodayCard
      ref={card}
      height={height}
      active={active}
      reduceMotion={reduceMotion}
      label="talk it through"
      base="#1c1a12"
      gradient="radial-gradient(60% 30% at 70% 18%, #7fc4a0, transparent 70%), radial-gradient(70% 30% at 20% 36%, #2f8a5a, transparent 70%)"
      photo="https://picsum.photos/id/1022/600/900"
      glow={{ left: 40, top: 90, width: 280, height: 120, color: '#58b08a', opacity: 0.45, rotate: '-20deg', drift: 'out', duration: 18000 }}>
      <CardPill step={2} stepColor="#1c1a12" label="talk it through" />
      <View style={styles.dots} accessible accessibilityLabel={`${count} of up to ${MAX_ASKS} answered`}>
        {Array.from({ length: MAX_ASKS }, (_, i) => (
          <Animated.View key={i} style={[styles.dot, { backgroundColor: i < count ? '#fff' : 'rgba(255, 255, 255, 0.3)' }, ease(reduceMotion, ['backgroundColor'])]} />
        ))}
      </View>
      <CardHeading
        top={150 / 610}
        eyebrow="only remember bits?"
        title="let afterdream ask. you just answer."
        style={[{ opacity: typing || count > 0 ? 0 : 1 }, ease(reduceMotion, ['opacity'])]}
      />

      <View style={[styles.chat, { bottom: chatBottom }]}>
        {last && (
          <Animated.Text key={`a${count}`} style={[styles.answer, pop(0)]} numberOfLines={3}>
            {last.answer}
          </Animated.Text>
        )}

        {thinking && <Thinking reduceMotion={reduceMotion} />}
        {!thinking && error && (
          <Animated.View style={[styles.errorRow, pop(0)]}>
            <Text style={[styles.question, glass(0.16)]} accessibilityLiveRegion="polite">
              {error.toLowerCase()}
            </Text>
            <Pressable accessibilityRole="button" onPress={() => fetchNext(fragments)} style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
              <Text style={styles.chipText}>ask again</Text>
            </Pressable>
          </Animated.View>
        )}
        {!thinking && !error && ask && (
          <Animated.Text key={`q${count}`} style={[styles.question, glass(0.16), pop(0)]} accessibilityLiveRegion="polite">
            {ask.question}
          </Animated.Text>
        )}

        {!thinking && !error && ask &&
          (typing ? (
            <View style={styles.typeRow}>
              <TextInput
                ref={input}
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => answer(draft)}
                onBlur={() => setWriting(false)}
                autoFocus
                submitBehavior="submit"
                returnKeyType="send"
                placeholder="in your own words…"
                placeholderTextColor="rgba(255, 255, 255, 0.55)"
                selectionColor={BrandColors.lime}
                cursorColor={BrandColors.lime}
                maxLength={300}
                style={styles.typeInput}
                accessibilityLabel="Your answer"
              />
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Send answer"
                disabled={!draft.trim()}
                onPress={() => answer(draft)}
                style={[styles.send, { backgroundColor: draft.trim() ? BrandColors.lime : 'rgba(255, 255, 255, 0.25)' }]}>
                <Text style={styles.sendGlyph}>↑</Text>
              </Pressable>
            </View>
          ) : (
            <View style={styles.replies}>
              {ask.suggestions.map((label, i) => (
                <Animated.View key={`${count}-${label}`} style={pop(i * 60)}>
                  <Pressable accessibilityRole="button" onPress={() => answer(label)} style={({ pressed }) => [styles.chip, pressed && styles.chipPressed]}>
                    <Text style={styles.chipText}>{label}</Text>
                  </Pressable>
                </Animated.View>
              ))}
              <Animated.View style={pop(ask.suggestions.length * 60)}>
                <Pressable accessibilityRole="button" accessibilityLabel="Type your own answer" onPress={() => setWriting(true)} style={({ pressed }) => [styles.chip, styles.ownChip, pressed && styles.chipPressed]}>
                  <Text style={[styles.chipText, styles.ownText]}>✎ my own words</Text>
                </Pressable>
              </Animated.View>
            </View>
          ))}

        <View style={styles.footer}>
          <Text style={styles.hint} numberOfLines={1}>
            {fragmentsHint(count)}
          </Text>
          {count > 0 ? (
            <Pressable accessibilityRole="button" accessibilityLabel="That's it, piece the dream together" onPress={() => finish(fragments)} style={({ pressed }) => [styles.done, pressed && styles.pressed]}>
              <Text style={styles.doneText}>that’s it ✦</Text>
            </Pressable>
          ) : (
            onTalkOutLoud && (
              <Pressable accessibilityRole="button" onPress={onTalkOutLoud} hitSlop={8}>
                <Text style={styles.hint}>or say it out loud ›</Text>
              </Pressable>
            )
          )}
        </View>
      </View>
    </TodayCard>
  );
}

/** "…" while the next question is on its way. */
function Thinking({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <View style={[styles.thinking, glass(0.16)]} accessible accessibilityLabel="Afterdream is thinking of the next question">
      {[0, 200, 400].map((delay) => (
        <Animated.View
          key={delay}
          style={[
            styles.thinkingDot,
            animate(reduceMotion, { animationName: DOT_BLINK, animationDuration: 1000, animationDelay: delay, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }),
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  dots: {
    position: 'absolute',
    right: 22,
    top: 40,
    flexDirection: 'row',
    gap: 5,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chat: {
    position: 'absolute',
    left: 18,
    right: 18,
    gap: 8,
  },
  answer: {
    alignSelf: 'flex-end',
    maxWidth: '78%',
    paddingVertical: 9,
    paddingHorizontal: 14,
    overflow: 'hidden',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderBottomRightRadius: 6,
    borderBottomLeftRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#111',
  },
  question: {
    alignSelf: 'flex-start',
    maxWidth: '86%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    overflow: 'hidden',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 21,
    color: '#fff',
  },
  errorRow: {
    gap: 8,
  },
  thinking: {
    alignSelf: 'flex-start',
    height: 44,
    paddingHorizontal: 18,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderBottomRightRadius: 20,
    borderBottomLeftRadius: 6,
  },
  thinkingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#fff',
  },
  replies: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-end',
    gap: 6,
  },
  chip: {
    alignSelf: 'flex-end',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.55)',
    justifyContent: 'center',
  },
  chipPressed: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  chipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  ownChip: {
    borderStyle: 'dashed',
  },
  ownText: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeInput: {
    flex: 1,
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 23,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    color: '#fff',
  },
  send: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendGlyph: {
    fontFamily: BrandFonts.semibold,
    fontSize: 18,
    lineHeight: 22,
    color: '#111',
  },
  footer: {
    marginTop: 4,
    minHeight: 40,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  hint: {
    flexShrink: 1,
    paddingLeft: 4,
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  done: {
    height: 40,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  doneText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
});
