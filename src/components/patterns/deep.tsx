import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { DOT, fadeIn, forever, up } from '@/components/patterns/motion';
import { PatternColors as C, PatternFonts as F } from '@/constants/theme';
import type { ReadingStatus } from '@/hooks/use-pattern-reading';
import {
  MIN_READING_DREAMS,
  threadLabel,
  type MoodShare,
  type PatternReading,
  type RankedTheme,
  type SymbolChip,
  type VividNight,
} from '@/utils/patterns';

const RINGS = [C.sky, C.mustard, C.rust];

type ThreadCardProps = {
  status: ReadingStatus;
  reading: PatternReading | null;
  error: string | null;
  /** How many dreams there are, when there are too few to read. */
  dreamCount: number;
  /** The line shown while reading ("Reading 12 dreams side by side…"). */
  readingLine: string;
  onRetry: () => void;
  reduceMotion: boolean;
};

/** "The thread": the one pattern running through the most dreams, read by Groq. */
export function ThreadCard({ status, reading, error, dreamCount, readingLine, onRetry, reduceMotion }: ThreadCardProps) {
  const tooFew = dreamCount < MIN_READING_DREAMS;
  let label = 'The thread';
  let body: ReactNode;

  if (tooFew) {
    const left = MIN_READING_DREAMS - dreamCount;
    body = (
      <>
        <Text style={styles.threadTitle}>
          The thread appears after <Text style={styles.italic}>a few more dreams</Text>
        </Text>
        <Text style={styles.threadBody}>
          Tell Afterdream {left} more dream{left === 1 ? '' : 's'} and it will read them side by side to find what keeps coming back.
        </Text>
      </>
    );
  } else if (status === 'ready' && reading) {
    label = threadLabel(reading.dreamCount);
    body = (
      <Animated.View style={[styles.threadText, fadeIn(reduceMotion)]}>
        <Text style={styles.threadTitle}>{reading.thread.title}</Text>
        <Text style={styles.threadBody}>{reading.thread.body}</Text>
      </Animated.View>
    );
  } else if (status === 'failed') {
    body = (
      <>
        <Text style={styles.threadTitle}>Couldn’t read your dreams just now</Text>
        <Text style={styles.threadBody}>{error ?? 'Please try again.'}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
          <Text style={styles.retryText}>Try again</Text>
        </Pressable>
      </>
    );
  } else {
    label = 'The thread · reading';
    body = (
      <View style={styles.readingRow} accessibilityLiveRegion="polite">
        <Animated.View style={[styles.readingDot, forever(reduceMotion, DOT, 1200)]} />
        <Text style={styles.threadBody}>{readingLine}</Text>
      </View>
    );
  }

  return (
    <Animated.View style={[styles.card, styles.darkCard, up(reduceMotion, 0)]}>
      <View style={styles.rings}>
        {RINGS.map((color) => (
          <View key={color} style={[styles.ring, { width: 92, height: 92, borderColor: color }]}>
            <View style={[styles.ring, { width: 62, height: 62, borderColor: color }]}>
              <View style={{ width: 32, height: 32, borderRadius: 16, backgroundColor: color }} />
            </View>
          </View>
        ))}
      </View>
      <View style={styles.threadText}>
        <Text style={styles.overline}>{label}</Text>
        {body}
      </View>
    </Animated.View>
  );
}

/** "Recurring themes": ranked, with a dot per dream. */
export function ThemesCard({ themes, reduceMotion }: { themes: RankedTheme[]; reduceMotion: boolean }) {
  return (
    <Animated.View style={[styles.card, styles.darkCard, styles.padded, up(reduceMotion, 80)]}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        Recurring themes
      </Text>
      <View>
        {themes.map((theme, i) => (
          <View key={theme.name} style={[styles.themeRow, i > 0 && styles.themeLine]} accessibilityLabel={`${theme.rank}. ${theme.name}, ${theme.count} dreams`}>
            <Text style={styles.themeRank}>{theme.rank}</Text>
            <Text style={styles.themeName} numberOfLines={1}>
              {theme.name}
            </Text>
            <View style={styles.themeDots}>
              {Array.from({ length: theme.dots }, (_, k) => (
                <View key={k} style={[styles.themeDot, { backgroundColor: theme.color }]} />
              ))}
            </View>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

type MoodCardProps = { headline: { plain: string; italic: string }; moods: MoodShare[]; reduceMotion: boolean };

/** "Mostly calm, with uneasy Sundays": the mood mix as one bar and a legend. */
export function MoodCard({ headline, moods, reduceMotion }: MoodCardProps) {
  const pairs = [moods.slice(0, 2), moods.slice(2, 4)].filter((pair) => pair.length > 0);
  return (
    <Animated.View style={[styles.card, styles.padded, styles.moodCard, up(reduceMotion, 160)]}>
      <Text style={[styles.cardTitle, styles.inkText]} accessibilityRole="header">
        {headline.plain}
        <Text style={styles.italic}>{headline.italic}</Text>
      </Text>
      <View style={styles.moodBar}>
        {moods.map((mood) => (
          <View key={mood.name} style={[styles.moodPart, { flex: Math.max(mood.pct, 1), backgroundColor: mood.color }]} />
        ))}
      </View>
      <View style={styles.legend}>
        {pairs.map((pair, row) => (
          <View key={row} style={styles.legendRow}>
            {pair.map((mood) => (
              <View key={mood.name} style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: mood.color }]} />
                <Text style={styles.legendName} numberOfLines={1}>
                  {mood.name}
                </Text>
                <Text style={styles.legendPct}>{mood.pct}%</Text>
              </View>
            ))}
            {pair.length === 1 && <View style={styles.legendItem} />}
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

type SymbolsCardProps = {
  symbols: SymbolChip[];
  selected: number;
  onSelect: (index: number) => void;
  status: ReadingStatus;
  reduceMotion: boolean;
};

/** "Symbols & meanings": tap a symbol to read what it might mean. */
export function SymbolsCard({ symbols, selected, onSelect, status, reduceMotion }: SymbolsCardProps) {
  const index = Math.min(selected, symbols.length - 1);
  const current = symbols[index];
  let meaning = current?.meaning;
  if (current && !meaning) {
    meaning =
      status === 'reading' || status === 'idle'
        ? 'Reading what this might mean…'
        : `Shows up in ${current.count} dream${current.count === 1 ? '' : 's'}. Its meaning appears once your dreams have been read.`;
  }
  return (
    <Animated.View style={[styles.card, styles.padded, styles.symbolsCard, up(reduceMotion, 240)]}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        Symbols &amp; meanings
      </Text>
      <View style={styles.chips}>
        {symbols.map((symbol, i) => {
          const on = i === index;
          return (
            <Pressable
              key={symbol.name}
              accessibilityRole="button"
              accessibilityState={{ selected: on }}
              onPress={() => onSelect(i)}
              style={({ pressed }) => [styles.chip, on && styles.chipOn, pressed && styles.pressed]}>
              <Text style={[styles.chipText, on && styles.chipTextOn]}>{symbol.name}</Text>
              <Text style={[styles.chipText, styles.chipCount, on && styles.chipTextOn]}>×{symbol.count}</Text>
            </Pressable>
          );
        })}
      </View>
      {meaning && (
        <Animated.Text key={current?.name} style={[styles.symbolMeaning, fadeIn(reduceMotion, 0, 300)]}>
          {meaning}
        </Animated.Text>
      )}
    </Animated.View>
  );
}

/** "Your most vivid nights": how much was dreamed on each weekday. */
export function VividCard({ nights, note, reduceMotion }: { nights: VividNight[]; note: string; reduceMotion: boolean }) {
  const tallest = Math.max(1, ...nights.map((night) => night.dots));
  return (
    <Animated.View style={[styles.card, styles.darkCard, styles.padded, up(reduceMotion, 320)]}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        Your most vivid nights
      </Text>
      <View style={styles.vivid}>
        {nights.map((night) => (
          <View key={night.key} style={[styles.vividDay, { height: tallest * 20 + 20 }]}>
            {Array.from({ length: night.dots }, (_, k) => (
              <View key={k} style={[styles.vividDot, { backgroundColor: night.color }]} />
            ))}
            <Text style={styles.vividLetter}>{night.day}</Text>
          </View>
        ))}
      </View>
      {note ? <Text style={styles.darkNote}>{note}</Text> : null}
    </Animated.View>
  );
}

/** "A question to sit with", from the reading. */
export function QuestionCard({ question, reduceMotion }: { question: PatternReading['question']; reduceMotion: boolean }) {
  // Put the end of the question in italics, like "What are you *getting ready for?*".
  const words = question.title.split(' ');
  const cut = Math.max(1, Math.ceil(words.length / 2));
  return (
    <Animated.View style={[styles.card, styles.questionCard, up(reduceMotion, 400)]}>
      <View style={styles.hills}>
        <View style={[styles.hill, { height: 32, backgroundColor: C.forest }]} />
        <View style={[styles.hill, { height: 48, backgroundColor: C.cream }]} />
        <View style={[styles.hill, { height: 24, backgroundColor: C.forest }]} />
      </View>
      <View style={styles.questionBody}>
        <Text style={[styles.overline, styles.inkText]}>A question to sit with</Text>
        <Text style={[styles.questionTitle]}>
          {words.slice(0, cut).join(' ')} <Text style={styles.italic}>{words.slice(cut).join(' ')}</Text>
        </Text>
        <Text style={styles.questionText}>{question.body}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  italic: { fontFamily: F.serifItalic },
  pressed: { opacity: 0.8 },
  inkText: { color: C.ink },
  card: { borderRadius: 28, overflow: 'hidden' },
  darkCard: { backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line },
  padded: { padding: 22, gap: 14 },
  cardTitle: { fontFamily: F.serif, fontSize: 28, lineHeight: 30, color: C.cream },
  overline: { fontFamily: F.sansSemibold, fontSize: 11, lineHeight: 13, letterSpacing: 1.6, textTransform: 'uppercase', color: C.mustard },

  rings: { height: 120, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ring: { borderRadius: 999, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  threadText: { paddingTop: 4, paddingHorizontal: 22, paddingBottom: 26, gap: 10 },
  threadTitle: { fontFamily: F.serif, fontSize: 32, lineHeight: 34, color: C.cream },
  threadBody: { fontFamily: F.sans, fontSize: 14, lineHeight: 21, color: C.paperLine },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.mustard },
  retry: { alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: C.cream, justifyContent: 'center' },
  retryText: { fontFamily: F.sansSemibold, fontSize: 15, lineHeight: 18, color: C.ink },

  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 12 },
  themeLine: { borderTopWidth: 1.5, borderTopColor: C.line },
  themeRank: { width: 22, fontFamily: F.serif, fontSize: 20, lineHeight: 22, color: C.muted },
  themeName: { flex: 1, fontFamily: F.sansMedium, fontSize: 16, lineHeight: 19, color: C.cream },
  themeDots: { flexDirection: 'row', gap: 3 },
  themeDot: { width: 9, height: 9, borderRadius: 4.5 },

  moodCard: { backgroundColor: C.sky, gap: 16 },
  moodBar: { flexDirection: 'row', height: 40, gap: 4 },
  moodPart: { height: '100%', borderRadius: 20 },
  legend: { gap: 8 },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontFamily: F.sansMedium, fontSize: 14, lineHeight: 17, color: C.ink },
  legendPct: { fontFamily: F.sansSemibold, fontSize: 14, lineHeight: 17, color: C.ink },

  symbolsCard: { backgroundColor: C.rust },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.cream, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipOn: { backgroundColor: C.cream },
  chipText: { fontFamily: F.sansMedium, fontSize: 14, lineHeight: 17, color: C.cream },
  chipTextOn: { color: C.ink },
  chipCount: { opacity: 0.7 },
  symbolMeaning: { fontFamily: F.sans, fontSize: 15, lineHeight: 22, color: C.cream },

  vivid: { flexDirection: 'row', gap: 6 },
  vividDay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  vividDot: { width: 16, height: 16, borderRadius: 8 },
  vividLetter: { marginTop: 4, fontFamily: F.sansMedium, fontSize: 11, lineHeight: 13, color: C.muted },
  darkNote: { fontFamily: F.sans, fontSize: 14, lineHeight: 20, color: C.paperLine },

  questionCard: { backgroundColor: C.sage },
  hills: { height: 64, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 22 },
  hill: { width: 64, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  questionBody: { padding: 22, gap: 8, backgroundColor: C.sageLight },
  questionTitle: { fontFamily: F.serif, fontSize: 30, lineHeight: 32, color: C.ink },
  questionText: { fontFamily: F.sans, fontSize: 14, lineHeight: 20, color: C.ink },
});
