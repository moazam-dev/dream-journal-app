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
  /** How many dreams there are, when there are too few to read. */
  dreamCount: number;
  /** The line shown while reading ("Reading 12 dreams side by side…"). */
  readingLine: string;
  onRetry: () => void;
  reduceMotion: boolean;
};

/** "The thread": the one pattern running through the most dreams, read by Groq. */
export function ThreadCard({ status, reading, dreamCount, readingLine, onRetry, reduceMotion }: ThreadCardProps) {
  const tooFew = dreamCount < MIN_READING_DREAMS;
  let label = 'The thread';
  let body: ReactNode;

  if (tooFew) {
    const left = MIN_READING_DREAMS - dreamCount;
    body = (
      <>
        <Text style={styles.threadTitle}>
          {left} more dream{left === 1 ? '' : 's'} <Text style={styles.italic}>to go</Text>
        </Text>
      </>
    );
  } else if (status === 'ready' && reading) {
    label = threadLabel(reading.dreamCount);
    body = (
      <Animated.View style={fadeIn(reduceMotion)}>
        <Text style={styles.threadTitle}>{reading.thread.title}</Text>
      </Animated.View>
    );
  } else if (status === 'failed') {
    body = (
      <>
        <Text style={styles.threadTitle}>Couldn’t read your dreams</Text>
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

/** "Symbols": the images that keep coming back, with how often. */
export function SymbolsCard({ symbols, reduceMotion }: { symbols: SymbolChip[]; reduceMotion: boolean }) {
  return (
    <Animated.View style={[styles.card, styles.padded, styles.symbolsCard, up(reduceMotion, 240)]}>
      <Text style={styles.cardTitle} accessibilityRole="header">
        Symbols
      </Text>
      <View style={styles.chips}>
        {symbols.map((symbol) => (
          <View key={symbol.name} style={styles.chip} accessibilityLabel={`${symbol.name}, ${symbol.count} dreams`}>
            <Text style={styles.chipText}>{symbol.name}</Text>
            <Text style={[styles.chipText, styles.chipCount]}>×{symbol.count}</Text>
          </View>
        ))}
      </View>
    </Animated.View>
  );
}

/** "Your most vivid nights": how much was dreamed on each weekday. */
export function VividCard({ nights, reduceMotion }: { nights: VividNight[]; reduceMotion: boolean }) {
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
  padded: { paddingTop: 26, paddingHorizontal: 24, paddingBottom: 28, gap: 20 },
  cardTitle: { fontFamily: F.serif, fontSize: 24, lineHeight: 27, letterSpacing: -0.6, color: C.cream },
  overline: { fontFamily: F.sansSemibold, fontSize: 10, lineHeight: 12, letterSpacing: 1.6, textTransform: 'uppercase', color: C.mustard },

  rings: { height: 160, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
  ring: { borderRadius: 999, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  threadText: { paddingTop: 4, paddingHorizontal: 24, paddingBottom: 32, gap: 10 },
  threadTitle: { fontFamily: F.serif, fontSize: 26, lineHeight: 29, letterSpacing: -0.6, color: C.cream },
  threadBody: { fontFamily: F.sans, fontSize: 13, lineHeight: 18, color: C.paperLine },
  readingRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  readingDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: C.mustard },
  retry: { alignSelf: 'flex-start', height: 44, paddingHorizontal: 20, borderRadius: 22, backgroundColor: C.cream, justifyContent: 'center' },
  retryText: { fontFamily: F.sansSemibold, fontSize: 14, lineHeight: 17, color: C.ink },

  themeRow: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 14 },
  themeLine: { borderTopWidth: 1.5, borderTopColor: C.line },
  themeRank: { width: 22, fontFamily: F.serif, fontSize: 18, lineHeight: 20, color: C.muted },
  themeName: { flex: 1, fontFamily: F.sansMedium, fontSize: 14, lineHeight: 17, color: C.cream },
  themeDots: { flexDirection: 'row', gap: 3 },
  themeDot: { width: 9, height: 9, borderRadius: 4.5 },

  moodCard: { backgroundColor: C.sky },
  moodBar: { flexDirection: 'row', height: 48, gap: 4 },
  moodPart: { height: '100%', borderRadius: 24 },
  legend: { gap: 10 },
  legendRow: { flexDirection: 'row', gap: 16 },
  legendItem: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendName: { flex: 1, fontFamily: F.sansMedium, fontSize: 13, lineHeight: 16, color: C.ink },
  legendPct: { fontFamily: F.sansSemibold, fontSize: 13, lineHeight: 16, color: C.ink },

  symbolsCard: { backgroundColor: C.rust },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { height: 40, paddingHorizontal: 16, borderRadius: 20, borderWidth: 1.5, borderColor: C.cream, flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { fontFamily: F.sansMedium, fontSize: 13, lineHeight: 16, color: C.cream },
  chipCount: { opacity: 0.7 },

  vivid: { flexDirection: 'row', gap: 6 },
  vividDay: { flex: 1, alignItems: 'center', justifyContent: 'flex-end', gap: 4 },
  vividDot: { width: 16, height: 16, borderRadius: 8 },
  vividLetter: { marginTop: 4, fontFamily: F.sansMedium, fontSize: 11, lineHeight: 13, color: C.muted },

  questionCard: { backgroundColor: C.sage },
  hills: { height: 88, flexDirection: 'row', alignItems: 'flex-end', gap: 8, paddingHorizontal: 24 },
  hill: { width: 64, borderTopLeftRadius: 32, borderTopRightRadius: 32 },
  questionBody: { paddingTop: 26, paddingHorizontal: 24, paddingBottom: 32, gap: 10, backgroundColor: C.sageLight },
  questionTitle: { fontFamily: F.serif, fontSize: 26, lineHeight: 29, letterSpacing: -0.6, color: C.ink },
});
