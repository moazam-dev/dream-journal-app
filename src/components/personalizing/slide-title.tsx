import { StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BrandFonts, NightColors } from '@/constants/theme';

import { animate, FADE, WORD_IN } from './motion';

type SlideTitleProps = {
  /** The heading, one word at a time, each rising in 100 ms after the last. */
  words: string[];
  subtitle: string;
  /** When the subtitle fades in, in ms. */
  subtitleDelay: number;
  reduceMotion: boolean;
};

/** The big heading and the line under it at the top of the second and third slides. */
export function SlideTitle({ words, subtitle, subtitleDelay, reduceMotion }: SlideTitleProps) {
  return (
    <View style={styles.intro}>
      <View accessible accessibilityRole="header" accessibilityLabel={words.join(' ')} style={styles.title}>
        {words.map((word, i) => (
          <Animated.Text
            key={word}
            style={[
              styles.titleText,
              animate(reduceMotion, { animationName: WORD_IN, animationDuration: 600, animationDelay: 100 + i * 100, animationTimingFunction: 'ease' }),
            ]}>
            {word}
          </Animated.Text>
        ))}
      </View>
      <Animated.View style={animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: subtitleDelay, animationTimingFunction: 'ease' })}>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: {
    paddingHorizontal: 28,
    gap: 12,
  },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 11,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 42,
    lineHeight: 43,
    letterSpacing: -1.8,
    color: NightColors.text,
  },
  subtitle: {
    fontFamily: BrandFonts.regular,
    fontSize: 17,
    lineHeight: 24,
    color: NightColors.text,
  },
});
