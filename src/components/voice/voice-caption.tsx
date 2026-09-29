import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { ease } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';

/** How long each word waits before it lights up (the design's pacing). */
const AFTERDREAM_MS = 210;
const YOU_MS = 290;

/** Height of the caption block, from the design. Two lines of 23/1.25 plus the speaker label. */
export const CAPTION_HEIGHT = 128;

const SPEAKER_COLOUR = { afterdream: '#E2EB98', you: '#EEF2C8' } as const;

type VoiceCaptionProps = {
  /** The transcript line this caption is showing. A new id starts the reveal over. */
  id: number;
  who: 'afterdream' | 'you';
  text: string;
  /** The line is still being spoken, so the words light up one at a time. Once it is over
   *  they are all lit, however far the reveal had got. */
  speaking: boolean;
  reduceMotion: boolean;
};

/**
 * The line being spoken right now, from the Afterdream Voice Agent design: who is talking,
 * then their words lighting up one by one. Afterdream's words wait at a third of full
 * brightness before they are said; yours only appear once they are heard.
 */
export function VoiceCaption({ id, who, text, speaking, reduceMotion }: VoiceCaptionProps) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const shown = useWordReveal(id, words.length, speaking, who, reduceMotion);

  return (
    <View style={styles.block} pointerEvents="none">
      <Animated.Text style={[styles.who, { color: SPEAKER_COLOUR[who] }]} accessibilityLiveRegion="polite">
        {who}
      </Animated.Text>
      <View style={styles.words}>
        {words.map((word, i) => (
          <Animated.Text
            key={`${i}-${word}`}
            style={[
              styles.word,
              { opacity: i < shown ? 1 : who === 'afterdream' ? 0.3 : 0 },
              ease(reduceMotion, ['opacity'], 250),
            ]}>
            {word}
          </Animated.Text>
        ))}
      </View>
    </View>
  );
}

/**
 * Walks a counter up to the number of words, starting over whenever a new line begins.
 * A line that grows as more of it is heard keeps its place instead of restarting.
 * Once the line is no longer being spoken every word is lit, however far the reveal had got.
 */
function useWordReveal(id: number, total: number, speaking: boolean, who: 'afterdream' | 'you', reduceMotion: boolean) {
  const [shown, setShown] = useState(0);
  // React's own way to reset state when a prop changes: adjust during render, not in an effect.
  const [lineId, setLineId] = useState(id);
  if (id !== lineId) {
    setLineId(id);
    setShown(0);
  }

  useEffect(() => {
    if (reduceMotion || !speaking || shown >= total) return;
    const step = who === 'afterdream' ? AFTERDREAM_MS : YOU_MS;
    const timer = setTimeout(() => setShown((n) => n + 1), step);
    return () => clearTimeout(timer);
  }, [shown, total, speaking, who, reduceMotion]);

  return reduceMotion || !speaking ? total : shown;
}

const styles = StyleSheet.create({
  block: {
    height: CAPTION_HEIGHT,
    gap: 10,
    overflow: 'hidden',
  },
  who: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 6,
    rowGap: 2,
  },
  word: {
    fontFamily: BrandFonts.regular,
    fontSize: 23,
    lineHeight: 29,
    letterSpacing: -0.4,
    color: '#fff',
  },
});
