import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { animate, FADE } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import type { AnalysisState } from '@/utils/entries';
import { LOADING_LINES } from '@/utils/today';
import { dreamMood } from '@/utils/visualize';

type DreamAnalysisProps = {
  dream: Dream;
  state: AnalysisState;
  reduceMotion: boolean;
  onRead: () => void;
};

/** The dream page's "analysis" tab: afterdream's reading of the dream, or a way to ask for one. */
export function DreamAnalysis({ dream, state, reduceMotion, onRead }: DreamAnalysisProps) {
  if (state === 'reading') {
    return (
      <View style={styles.waiting}>
        {LOADING_LINES.map((line, i) => (
          <Animated.Text
            key={line}
            style={[styles.waitingLine, animate(reduceMotion, { animationName: FADE, animationDuration: 700, animationDelay: i * 900 })]}>
            {line}
          </Animated.Text>
        ))}
      </View>
    );
  }

  if (state !== 'ready') {
    const failed = state === 'failed';
    return (
      <View style={styles.waiting}>
        <Text style={styles.emptyTitle}>{failed ? 'the reading didn’t come through.' : 'not read yet.'}</Text>
        <Text style={styles.emptyText}>
          {failed ? 'afterdream lost the thread. give it another go.' : 'afterdream can look for the mood, the themes and what it might be saying.'}
        </Text>
        <Pressable accessibilityRole="button" onPress={onRead} style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
          <Text style={styles.buttonText}>{failed ? 'try again' : 'read my dream'}</Text>
        </Pressable>
      </View>
    );
  }

  const mood = dreamMood(dream);
  const themes = dream.themes ?? [];

  return (
    <View style={styles.reading}>
      {!!dream.summary && (
        <View style={styles.block}>
          <Text style={styles.label}>in short</Text>
          <Text style={styles.summary}>{dream.summary}</Text>
        </View>
      )}

      {(mood || themes.length > 0) && (
        <View style={styles.block}>
          <Text style={styles.label}>what ran through it</Text>
          <View style={styles.chips}>
            {mood && (
              <View style={[styles.chip, styles.moodChip]}>
                <Text style={[styles.chipText, styles.moodChipText]}>{mood}</Text>
              </View>
            )}
            {themes.map((theme) => (
              <View key={theme} style={styles.chip}>
                <Text style={styles.chipText}>{theme.toLowerCase()}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {!!dream.reflection && (
        <View style={styles.block}>
          <Text style={styles.label}>reflection</Text>
          <Text style={styles.body}>{dream.reflection}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  reading: {
    gap: 26,
  },
  block: {
    gap: 10,
  },
  label: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.55)',
  },
  summary: {
    fontFamily: BrandFonts.medium,
    fontSize: 21,
    lineHeight: 27,
    letterSpacing: -0.4,
    color: '#fff',
  },
  body: {
    fontFamily: BrandFonts.regular,
    fontSize: 16,
    lineHeight: 25,
    color: 'rgba(255,255,255,0.85)',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    height: 32,
    paddingHorizontal: 14,
    borderRadius: 16,
    justifyContent: 'center',
    backgroundColor: '#1a1a1a',
  },
  chipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  moodChip: {
    backgroundColor: BrandColors.lime,
  },
  moodChipText: {
    color: '#111',
  },
  waiting: {
    paddingTop: 8,
    gap: 10,
    alignItems: 'flex-start',
  },
  waitingLine: {
    fontFamily: BrandFonts.regular,
    fontSize: 17,
    lineHeight: 24,
    color: 'rgba(255,255,255,0.7)',
  },
  emptyTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 21,
    lineHeight: 26,
    color: '#fff',
  },
  emptyText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255,255,255,0.65)',
  },
  button: {
    marginTop: 6,
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 22,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  buttonText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  pressed: {
    opacity: 0.8,
  },
});
