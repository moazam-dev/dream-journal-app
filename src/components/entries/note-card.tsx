import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { SPRING } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { entryDate, moodColor } from '@/utils/entries';
import { dreamMood } from '@/utils/visualize';

export const NOTE_WIDTH = 168;

type NoteCardProps = {
  dream: Dream;
  selected: boolean;
  reduceMotion: boolean;
  onPress: () => void;
};

/** A dream that was written down but hasn't been painted yet: a small note to tap and read. */
export function NoteCard({ dream, selected, reduceMotion, onPress }: NoteCardProps) {
  const mood = dreamMood(dream);
  const color = moodColor(mood);

  return (
    <Animated.View
      style={[
        styles.note,
        { borderColor: selected ? BrandColors.lime : 'rgba(255,255,255,0.1)', transform: [{ translateY: selected ? -4 : 0 }] },
        !reduceMotion && {
          transitionProperty: ['borderColor', 'transform'],
          transitionDuration: 300,
          transitionTimingFunction: ['ease', SPRING],
        },
      ]}>
      <Pressable accessibilityRole="button" accessibilityState={{ selected }} onPress={onPress} style={styles.press}>
        {/* The mood's colour, glowing softly in the corner. */}
        <Svg style={styles.glow} width={130} height={130} pointerEvents="none">
          <Defs>
            <RadialGradient id={`noteGlow-${dream.id}`} cx="50%" cy="50%" r="50%">
              <Stop offset="0" stopColor={color} stopOpacity={0.4} />
              <Stop offset="1" stopColor={color} stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Circle cx={65} cy={65} r={65} fill={`url(#noteGlow-${dream.id})`} />
        </Svg>
        <Text style={styles.date}>{entryDate(dream)}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {dream.title ?? 'a dream, unread'}
        </Text>
        <Text style={styles.text} numberOfLines={3}>
          “{dream.dream_text.trim()}”
        </Text>
        <View style={styles.spacer} />
        {mood && (
          <View style={[styles.pill, { backgroundColor: color }]}>
            <Text style={styles.pillText}>{mood}</Text>
          </View>
        )}
      </Pressable>
    </Animated.View>
  );
}

/** The mood tag used on notes and in the detail card. */
export function MoodPill({ mood }: { mood: string }) {
  return (
    <View style={[styles.pill, { backgroundColor: moodColor(mood) }]}>
      <Text style={styles.pillText}>{mood}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  note: {
    width: NOTE_WIDTH,
    height: 200,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  press: {
    flex: 1,
    padding: 16,
    gap: 10,
  },
  glow: {
    position: 'absolute',
    right: -46,
    top: -46,
  },
  date: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: -0.3,
    color: '#fff',
  },
  text: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.75)',
  },
  spacer: {
    flex: 1,
  },
  pill: {
    alignSelf: 'flex-start',
    height: 24,
    paddingHorizontal: 10,
    borderRadius: 12,
    justifyContent: 'center',
  },
  pillText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    color: '#111',
  },
});
