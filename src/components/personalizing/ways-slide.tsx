import { memo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';

import { animate, EASE_OUT, morph, ROW_IN, useFitScale } from './motion';
import { SlideTitle } from './slide-title';

type WaysSlideProps = {
  reduceMotion: boolean;
};

const ROW_HEIGHT = 122;
const ROW_GAP = 10;
/** Three rows and the gaps between them, at full size. */
const LIST_HEIGHT = ROW_HEIGHT * 3 + ROW_GAP * 2;

const LILAC = '#C9B8F2';
const ORANGE = '#FF8A1F';
const PINK = '#F2A8E0';
const MOSS = '#1F3316';

const BAR = {
  '0%': { transform: [{ scaleY: 0.35 }] },
  '50%': { transform: [{ scaleY: 1 }] },
  '100%': { transform: [{ scaleY: 0.35 }] },
};
const VIBE_MORPH = morph(150, 140);

/** Lime streaks across the spill row, like lines of writing. */
const STREAKS = [
  { right: -30, top: 16, width: 150, height: 22 },
  { right: -10, top: 52, width: 120, height: 20 },
  { right: -40, top: 86, width: 150, height: 22 },
];

/** Slide 2: the three ways to log a dream — spill (type), yap (talk) and vibe (mood). */
export const WaysSlide = memo(function WaysSlide({ reduceMotion }: WaysSlideProps) {
  const { scale, onLayout } = useFitScale(LIST_HEIGHT);

  function rowIn(delay: number) {
    return animate(reduceMotion, { animationName: ROW_IN, animationDuration: 600, animationDelay: delay, animationTimingFunction: EASE_OUT });
  }

  return (
    <View style={styles.slide}>
      <SlideTitle
        words={['catch', 'it', 'your', 'way.']}
        subtitle="however you wake up, there's a way in."
        subtitleDelay={600}
        reduceMotion={reduceMotion}
      />

      <View style={styles.art} onLayout={onLayout}>
        <View style={[styles.list, { transform: [{ scale }] }]}>
          <Row color={LILAC} label="spill" hint="type it out, messy is fine" style={rowIn(700)}>
            {STREAKS.map((s) => (
              <View key={s.top} style={[styles.streak, s, { borderRadius: s.height / 2 }]} />
            ))}
          </Row>

          <Row color={ORANGE} label="yap" hint="just talk, we'll listen" style={rowIn(900)}>
            <View style={styles.bars}>
              {[0, 150, 300, 450, 600].map((delay) => (
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
          </Row>

          <Row color={PINK} label="vibe" hint="no words? pick a feeling" style={rowIn(1100)}>
            <Animated.View
              style={[
                styles.vibeBlob,
                animate(reduceMotion, {
                  animationName: VIBE_MORPH,
                  animationDuration: 9000,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                }),
              ]}
            />
            <View style={styles.vibeEyes}>
              <View style={styles.vibeEye} />
              <View style={styles.vibeEye} />
            </View>
          </Row>
        </View>
      </View>
    </View>
  );
});

type RowProps = {
  color: string;
  label: string;
  hint: string;
  style: object | null;
  /** The artwork on the right of the row. */
  children: ReactNode;
};

function Row({ color, label, hint, style, children }: RowProps) {
  return (
    <Animated.View style={[styles.row, { backgroundColor: color }, style]} accessible accessibilityLabel={`${label}: ${hint}`}>
      <View style={StyleSheet.absoluteFill} importantForAccessibility="no-hide-descendants" accessibilityElementsHidden>
        {children}
      </View>
      <View style={styles.rowText}>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowHint}>{hint}</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  art: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  list: {
    gap: ROW_GAP,
  },
  row: {
    height: ROW_HEIGHT,
    borderRadius: 30,
    overflow: 'hidden',
  },
  rowText: {
    position: 'absolute',
    left: 22,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
    gap: 6,
  },
  rowLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 32,
    lineHeight: 34,
    letterSpacing: -1,
    color: BrandColors.ink,
  },
  rowHint: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 17,
    color: BrandColors.ink,
  },
  streak: {
    position: 'absolute',
    backgroundColor: BrandColors.lime,
    transform: [{ rotate: '-10deg' }],
  },
  bars: {
    position: 'absolute',
    right: 24,
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  bar: {
    width: 8,
    height: 60,
    borderRadius: 4,
    backgroundColor: BrandColors.ink,
    transform: [{ scaleY: 0.35 }],
  },
  vibeBlob: {
    position: 'absolute',
    right: -30,
    top: -10,
    width: 150,
    height: 140,
    borderRadius: 70,
    backgroundColor: MOSS,
  },
  vibeEyes: {
    position: 'absolute',
    right: 52,
    top: 46,
    flexDirection: 'row',
    gap: 10,
  },
  vibeEye: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: PINK,
  },
});
