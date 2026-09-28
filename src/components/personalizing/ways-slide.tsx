import { memo, useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { steps } from 'react-native-reanimated';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';

import { animate, EASE_OUT, FADE, POP, SLIDE_IN, useFitScale, WORD_IN } from './motion';

type WaysSlideProps = {
  reduceMotion: boolean;
};

const BUBBLE = 76;
/** Three rows and the gaps between them, at full size. */
const LIST_HEIGHT = BUBBLE * 3 + 30 * 2;

const PEACH = '#F2B8A0';
const LILAC = '#C9B8F2';

const BAR = {
  '0%': { transform: [{ scaleY: 0.35 }] },
  '50%': { transform: [{ scaleY: 1 }] },
  '100%': { transform: [{ scaleY: 0.35 }] },
};
const CARET = {
  '0%': { opacity: 1 },
  '49%': { opacity: 1 },
  '50%': { opacity: 0 },
  '100%': { opacity: 0 },
};
const BOB = {
  '0%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
  '50%': { transform: [{ translateY: -6 }, { rotate: '8deg' }] },
  '100%': { transform: [{ translateY: 0 }, { rotate: '0deg' }] },
};

const TITLE_WORDS = [
  { word: 'catch', delay: 100 },
  { word: 'a', delay: 200 },
  { word: 'dream', delay: 300 },
  { word: 'however', delay: 450, accent: true },
  { word: 'it', delay: 550, accent: true },
  { word: 'comes.', delay: 650, accent: true },
];

/** Slide 2: the three ways to log a dream — spill (type), yap (talk) and vibe (mood). */
export const WaysSlide = memo(function WaysSlide({ reduceMotion }: WaysSlideProps) {
  const { scale, onLayout } = useFitScale(LIST_HEIGHT);

  function rowIn(delay: number) {
    return animate(reduceMotion, { animationName: SLIDE_IN, animationDuration: 600, animationDelay: delay, animationTimingFunction: EASE_OUT });
  }

  return (
    <View style={styles.slide}>
      <View style={styles.intro}>
        <View accessible accessibilityRole="header" accessibilityLabel="catch a dream however it comes." style={styles.title}>
          {TITLE_WORDS.map(({ word, delay, accent }) => (
            <Animated.Text
              key={word}
              style={[
                styles.titleText,
                accent && styles.titleAccent,
                animate(reduceMotion, { animationName: WORD_IN, animationDuration: 700, animationDelay: delay, animationTimingFunction: 'ease' }),
              ]}>
              {word}
            </Animated.Text>
          ))}
        </View>
        <Animated.Text
          style={[styles.subtitle, animate(reduceMotion, { animationName: FADE, animationDuration: 800, animationDelay: 800, animationTimingFunction: 'ease' })]}>
          half-asleep at 6am? on the bus? still in bed? perfect timing.
        </Animated.Text>
      </View>

      <View style={styles.listArea} onLayout={onLayout}>
        <View style={[styles.list, { transform: [{ scale }] }]}>
          <Animated.View style={[styles.row, rowIn(900)]} accessible accessibilityLabel="spill: type it out">
            <View style={[styles.bubble, { backgroundColor: BrandColors.lime }]}>
              <Text style={styles.bubbleGlyph}>✎</Text>
            </View>
            <TypedWord word="spill" reduceMotion={reduceMotion} />
          </Animated.View>

          <Animated.View style={[styles.row, rowIn(1100)]} accessible accessibilityLabel="yap: say it out loud">
            <View style={[styles.bubble, styles.bars, { backgroundColor: PEACH }]}>
              {[0, 150, 300, 450].map((delay) => (
                <Animated.View
                  key={delay}
                  style={[
                    styles.bar,
                    animate(reduceMotion, {
                      animationName: BAR,
                      animationDuration: 900,
                      animationDelay: delay,
                      animationTimingFunction: 'ease-in-out',
                      animationIterationCount: 'infinite',
                    }),
                  ]}
                />
              ))}
            </View>
            <Text style={[styles.word, { color: PEACH }]}>yap</Text>
          </Animated.View>

          <Animated.View style={[styles.row, rowIn(1300)]} accessible accessibilityLabel="vibe: pick the mood">
            <View style={[styles.bubble, { backgroundColor: LILAC }]}>
              <Animated.Text
                style={[
                  styles.bubbleGlyph,
                  styles.moonGlyph,
                  animate(reduceMotion, {
                    animationName: BOB,
                    animationDuration: 2400,
                    animationTimingFunction: 'ease-in-out',
                    animationIterationCount: 'infinite',
                  }),
                ]}>
                ☾
              </Animated.Text>
            </View>
            <Text style={[styles.word, { color: LILAC }]}>vibe</Text>
            <View style={styles.moods}>
              <Animated.Text
                style={[styles.mood, styles.moodOn, animate(reduceMotion, { animationName: POP, animationDuration: 500, animationDelay: 1800, animationTimingFunction: 'ease' })]}>
                lowkey calm
              </Animated.Text>
              <Animated.Text
                style={[styles.mood, styles.moodOff, animate(reduceMotion, { animationName: POP, animationDuration: 500, animationDelay: 2000, animationTimingFunction: 'ease' })]}>
                kinda unhinged
              </Animated.Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );
});

type TypedWordProps = {
  word: string;
  reduceMotion: boolean;
};

/** The word types itself out, a few letters at a time, with a blinking caret after it. */
function TypedWord({ word, reduceMotion }: TypedWordProps) {
  // The full word is measured off-screen first, so the reveal knows how wide to grow.
  const [width, setWidth] = useState(0);
  const typing = useMemo(() => ({ from: { width: 0 }, to: { width } }), [width]);

  return (
    <View style={styles.typed}>
      <Text style={[styles.word, styles.measure]} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {word}
      </Text>
      <Animated.View
        style={[
          styles.typedClip,
          !reduceMotion && { width: 0 },
          width > 0 &&
            animate(reduceMotion, { animationName: typing, animationDuration: 700, animationDelay: 1300, animationTimingFunction: steps(4) }),
        ]}>
        <Text style={[styles.word, { color: BrandColors.lime }]} numberOfLines={1}>
          {word}
        </Text>
      </Animated.View>
      <Animated.View
        style={[
          styles.caret,
          animate(reduceMotion, { animationName: CARET, animationDuration: 1000, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }),
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  intro: {
    gap: 12,
  },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 10,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 37,
    letterSpacing: -1.2,
    color: NightColors.text,
  },
  titleAccent: {
    color: BrandColors.lime,
  },
  subtitle: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255, 255, 255, 0.65)',
  },
  listArea: {
    flex: 1,
    justifyContent: 'center',
  },
  list: {
    marginLeft: 28,
    marginRight: 12,
    gap: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 22,
  },
  bubble: {
    width: BUBBLE,
    height: BUBBLE,
    borderRadius: BUBBLE / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bubbleGlyph: {
    fontFamily: BrandFonts.medium,
    fontSize: 28,
    lineHeight: 34,
    color: BrandColors.ink,
  },
  moonGlyph: {
    fontFamily: BrandFonts.regular,
  },
  bars: {
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    width: 4,
    height: 26,
    borderRadius: 2,
    backgroundColor: BrandColors.ink,
  },
  word: {
    fontFamily: BrandFonts.medium,
    fontSize: 40,
    lineHeight: 46,
    letterSpacing: -1,
  },
  typed: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  measure: {
    position: 'absolute',
    opacity: 0,
  },
  typedClip: {
    overflow: 'hidden',
  },
  caret: {
    width: 3,
    height: 36,
    marginLeft: 3,
    backgroundColor: BrandColors.lime,
  },
  moods: {
    flexShrink: 1,
    gap: 6,
    // Sits a little closer to "vibe" than the row's gap, so both chips fit on narrow phones.
    marginLeft: -8,
  },
  mood: {
    alignSelf: 'flex-start',
    overflow: 'hidden',
    borderRadius: 14,
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
  },
  moodOn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: LILAC,
    color: BrandColors.ink,
  },
  moodOff: {
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderWidth: 1,
    borderColor: 'rgba(201, 184, 242, 0.6)',
    color: LILAC,
  },
});
