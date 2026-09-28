import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { animate, FADE } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { ReadingStatus } from '@/hooks/use-pattern-reading';
import { INSIGHT_LABELS, readingLines, type PatternReading } from '@/utils/patterns';

import { DOT, forever, OPEN, SCAN, up } from './motion';
import { PhotoCard, Swirl } from './photo-card';

/** How long each "reading…" line stays before the next. */
const LINE_MS = 880;
const SCAN_WIDTHS = [92, 70, 84, 60];
/** Colours and backdrops of the three insight cards, from the design. */
const INSIGHT_LOOKS = [
  { color: '#A8D8F0', base: '#141d3a' },
  { color: '#F2B8A0', base: '#5a2a12' },
  { color: '#C9B8F2', base: '#2d3d25' },
];

export type ChatTurn = { question: string; answer: string | null; failed: boolean };

type DeepReadingProps = {
  status: ReadingStatus;
  reading: PatternReading | null;
  error: string | null;
  /** How many dreams there are to read (for the "reading…" line). */
  dreamCount: number;
  /** Not enough dreams to find a pattern yet. */
  tooFew: boolean;
  /** Backdrops: the hero's first, then one per insight. */
  photos: (string | null)[];
  chat: ChatTurn[];
  onAsk: (question: string) => void;
  onRetry: () => void;
  reduceMotion: boolean;
};

/** "Dive deeper": the reading of the dreams side by side, and questions to ask about it. */
export function DeepReading({ status, reading, error, dreamCount, tooFew, photos, chat, onAsk, onRetry, reduceMotion }: DeepReadingProps) {
  if (tooFew) {
    return (
      <Message
        photo={photos[0]}
        title="a few more dreams first."
        text="patterns show up once there are at least 3 dreams to read side by side. tell afterdream tonight’s ✦"
        reduceMotion={reduceMotion}
      />
    );
  }
  if (status === 'failed') {
    return (
      <Message
        photo={photos[0]}
        title="couldn’t read your patterns."
        text={error ?? 'please try again.'}
        action="try again"
        onAction={onRetry}
        reduceMotion={reduceMotion}
      />
    );
  }
  if (status !== 'ready' || !reading) {
    return <Reading photo={photos[0]} count={dreamCount} reduceMotion={reduceMotion} />;
  }

  const asked = new Set(chat.filter((turn) => !turn.failed).map((turn) => turn.question));
  const asks = reading.questions.filter((question) => !asked.has(question));

  return (
    <View style={styles.list}>
      <PhotoCard
        photo={photos[0]}
        base="#12201a"
        radius={40}
        zoom
        blur={28}
        shade="linear-gradient(180deg, rgba(0,0,0,0.35), rgba(0,0,0,0.55))"
        reduceMotion={reduceMotion}
        style={up(reduceMotion)}>
        <View style={styles.thread}>
          <Text style={[styles.eyebrow, { color: BrandColors.lime }]}>
            the thread · {reading.dreamCount} dream{reading.dreamCount === 1 ? '' : 's'}
          </Text>
          <Text style={styles.threadTitle} accessibilityRole="header">
            {reading.thread.title}
          </Text>
          <Text style={styles.threadBody}>{reading.thread.body}</Text>
        </View>
      </PhotoCard>

      {reading.insights.map((insight, i) => {
        const look = INSIGHT_LOOKS[i % INSIGHT_LOOKS.length];
        return (
          <PhotoCard
            key={i}
            photo={photos[i + 1] ?? null}
            base={look.base}
            radius={34}
            shade="rgba(0,0,0,0.45)"
            reduceMotion={reduceMotion}
            style={up(reduceMotion, 120 + i * 120)}>
            <View style={styles.insight}>
              <View style={styles.insightHead}>
                <View style={[styles.number, { backgroundColor: look.color }]}>
                  <Text style={styles.numberText}>{i + 1}</Text>
                </View>
                <Text style={[styles.eyebrow, { color: look.color }]}>{INSIGHT_LABELS[i] ?? 'one more thing'}</Text>
              </View>
              <Text style={styles.insightTitle}>{insight.title}</Text>
              <Text style={styles.insightBody}>{insight.body}</Text>
            </View>
          </PhotoCard>
        );
      })}

      <Animated.View style={[styles.ask, up(reduceMotion, 500)]}>
        <Text style={[styles.eyebrow, { color: BrandColors.lime }]}>ask afterdream about your patterns</Text>
        {chat.map((turn, i) => (
          <View key={`${turn.question}-${i}`} style={styles.turn}>
            <Animated.Text style={[styles.question, animate(reduceMotion, { animationName: OPEN, animationDuration: 300, animationTimingFunction: 'ease' })]}>
              {turn.question}
            </Animated.Text>
            {turn.answer === null && !turn.failed ? (
              <View style={[styles.answer, styles.thinking]} accessibilityLabel="afterdream is thinking">
                {[0, 1, 2].map((dot) => (
                  <Animated.View key={dot} style={[styles.thinkingDot, forever(reduceMotion, DOT, 1400, 'ease-in-out', dot * 200)]} />
                ))}
              </View>
            ) : (
              <Animated.Text
                accessibilityLiveRegion="polite"
                style={[
                  styles.answer,
                  styles.answerText,
                  turn.failed && styles.failed,
                  animate(reduceMotion, { animationName: OPEN, animationDuration: 400, animationDelay: 150, animationTimingFunction: 'ease' }),
                ]}>
                {turn.failed ? 'couldn’t answer that just now — tap it again below.' : turn.answer}
              </Animated.Text>
            )}
          </View>
        ))}
        {asks.length > 0 && (
          <View style={styles.asks}>
            {asks.map((question) => (
              <Pressable
                key={question}
                accessibilityRole="button"
                onPress={() => onAsk(question)}
                style={({ pressed }) => [styles.askChip, pressed && styles.askChipPressed]}>
                <Text style={styles.askText}>{question}</Text>
              </Pressable>
            ))}
          </View>
        )}
      </Animated.View>
    </View>
  );
}

/** The "reading your dreams…" moment: a spinning swirl, scanning lines, changing words. */
function Reading({ photo, count, reduceMotion }: { photo: string | null; count: number; reduceMotion: boolean }) {
  const lines = readingLines(count);
  const [line, setLine] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setLine((current) => (current + 1) % lines.length), LINE_MS);
    return () => clearInterval(timer);
  }, [lines.length]);

  return (
    <PhotoCard photo={photo} base="#12201a" radius={40} zoom blur={34} shade="rgba(0,0,0,0.45)" reduceMotion={reduceMotion} style={styles.reading}>
      <View style={styles.readingInner} accessibilityLabel="reading your dreams">
        <Swirl size={120} duration={2400} reduceMotion={reduceMotion} />
        <View style={styles.scans}>
          {SCAN_WIDTHS.map((width, i) => (
            <View key={i} style={[styles.scan, { width: `${width}%` }]}>
              <Animated.View
                style={[
                  styles.scanBeam,
                  forever(reduceMotion, SCAN, 1400, 'ease-in-out', i * 180),
                ]}
              />
            </View>
          ))}
        </View>
        <Animated.Text
          key={line}
          style={[styles.readingText, animate(reduceMotion, { animationName: FADE, animationDuration: 300, animationTimingFunction: 'ease' })]}>
          {lines[line]}
        </Animated.Text>
      </View>
    </PhotoCard>
  );
}

type MessageProps = {
  photo: string | null;
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
  reduceMotion: boolean;
};

function Message({ photo, title, text, action, onAction, reduceMotion }: MessageProps) {
  return (
    <PhotoCard photo={photo} base="#12201a" radius={40} shade="rgba(0,0,0,0.5)" reduceMotion={reduceMotion} style={[styles.reading, up(reduceMotion)]}>
      <View style={styles.readingInner}>
        <Text style={styles.messageTitle}>{title}</Text>
        <Text style={styles.messageText}>{text}</Text>
        {action && onAction && (
          <Pressable accessibilityRole="button" onPress={onAction} style={({ pressed }) => [styles.messageButton, pressed && { transform: [{ scale: 0.96 }] }]}>
            <Text style={styles.messageButtonText}>{action}</Text>
          </Pressable>
        )}
      </View>
    </PhotoCard>
  );
}

const styles = StyleSheet.create({
  list: {
    gap: 10,
  },
  reading: {
    height: 520,
  },
  readingInner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 30,
    paddingHorizontal: 40,
  },
  scans: {
    width: 220,
    gap: 10,
  },
  scan: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.14)',
    overflow: 'hidden',
  },
  scanBeam: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: '50%',
    experimental_backgroundImage: 'linear-gradient(90deg, rgba(226,235,152,0), rgba(226,235,152,0.8), rgba(226,235,152,0))',
  },
  readingText: {
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 23,
    color: '#fff',
    textAlign: 'center',
  },
  messageTitle: {
    marginBottom: -18,
    fontFamily: BrandFonts.medium,
    fontSize: 26,
    lineHeight: 30,
    letterSpacing: -0.8,
    color: '#fff',
    textAlign: 'center',
  },
  messageText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.85)',
    textAlign: 'center',
  },
  messageButton: {
    height: 46,
    paddingHorizontal: 22,
    borderRadius: 23,
    backgroundColor: '#fff',
    justifyContent: 'center',
  },
  messageButtonText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 15,
    lineHeight: 18,
    color: '#111',
  },
  thread: {
    paddingVertical: 26,
    paddingHorizontal: 22,
    gap: 14,
  },
  eyebrow: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  threadTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1.2,
    color: '#fff',
  },
  threadBody: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  insight: {
    padding: 20,
    gap: 10,
  },
  insightHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  number: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numberText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: '#111',
  },
  insightTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: -0.6,
    color: '#fff',
  },
  insightBody: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 21,
    color: '#fff',
  },
  ask: {
    borderRadius: 34,
    borderCurve: 'continuous',
    backgroundColor: '#141414',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    padding: 20,
    gap: 12,
  },
  turn: {
    gap: 8,
  },
  question: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    overflow: 'hidden',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomRightRadius: 6,
    backgroundColor: '#fff',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 18,
    color: '#111',
  },
  answer: {
    alignSelf: 'flex-start',
    maxWidth: '88%',
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 18,
    borderBottomLeftRadius: 6,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  answerText: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
  },
  failed: {
    color: 'rgba(255,255,255,0.7)',
  },
  thinking: {
    flexDirection: 'row',
    gap: 5,
    paddingVertical: 16,
  },
  thinkingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#fff',
  },
  asks: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  askChip: {
    minHeight: 38,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
  },
  askChipPressed: {
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  askText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
});
