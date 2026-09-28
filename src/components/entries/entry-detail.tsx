import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { animate } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { entryDate, isSeen } from '@/utils/entries';
import { dreamMood } from '@/utils/visualize';

import { OUT, SHIMMER, up } from './motion';
import { MoodPill } from './note-card';

type EntryDetailProps = {
  dream: Dream;
  painting: boolean;
  reduceMotion: boolean;
  onLayout: (event: LayoutChangeEvent) => void;
  /** Opens a painted dream on the Visualize screen. */
  onOpen: (dream: Dream) => void;
  /** Paints a written dream's picture. */
  onVisualize: (dream: Dream) => void;
};

/**
 * The picked dream, under the calendar. A painted one shows its picture and opens in
 * Visualize; a written one shows what was said and the reading, with a button to paint it.
 */
export function EntryDetail({ dream, painting, reduceMotion, onLayout, onOpen, onVisualize }: EntryDetailProps) {
  const mood = dreamMood(dream);
  const when = entryDate(dream);
  const title = dream.title ?? 'a dream, unread';

  if (isSeen(dream)) {
    return (
      <Animated.View onLayout={onLayout} style={[styles.card, up(reduceMotion, 0, 450, OUT)]}>
        <View style={styles.seenRow}>
          <Image source={{ uri: dream.image_url ?? undefined }} style={styles.thumb} contentFit="cover" />
          <View style={styles.seenText}>
            <Text style={styles.when}>{mood ? `${when} · ${mood}` : when}</Text>
            <Text style={styles.seenTitle}>{title}</Text>
            <Pressable accessibilityRole="button" onPress={() => onOpen(dream)} style={({ pressed }) => [styles.open, pressed && styles.pressed]}>
              <Text style={styles.openText}>open in visualize →</Text>
            </Pressable>
          </View>
        </View>
      </Animated.View>
    );
  }

  return (
    <Animated.View onLayout={onLayout} style={[styles.card, styles.written, up(reduceMotion, 0, 450, OUT)]}>
      <View style={styles.writtenHead}>
        <Text style={styles.when}>{when}</Text>
        {mood && <MoodPill mood={mood} />}
      </View>
      <Text style={styles.writtenTitle}>{title}</Text>
      <Text style={styles.quote} numberOfLines={8}>
        “{dream.dream_text.trim()}”
      </Text>
      {!!dream.summary && <Text style={styles.summary}>{dream.summary}</Text>}
      <Pressable
        accessibilityRole="button"
        accessibilityState={{ busy: painting }}
        disabled={painting}
        onPress={() => onVisualize(dream)}
        style={({ pressed }) => [styles.visualize, painting && styles.visualizePainting, pressed && styles.pressed]}>
        {painting && (
          <Animated.View
            pointerEvents="none"
            style={[
              styles.shimmer,
              animate(reduceMotion, { animationName: SHIMMER, animationDuration: 1200, animationTimingFunction: 'ease-in-out', animationIterationCount: 'infinite' }),
            ]}>
            <Svg width="100%" height="100%" preserveAspectRatio="none">
              <Defs>
                <LinearGradient id="shimmer" x1="0" y1="0" x2="1" y2="0">
                  <Stop offset="0" stopColor={BrandColors.lime} stopOpacity={0} />
                  <Stop offset="0.5" stopColor={BrandColors.lime} stopOpacity={0.35} />
                  <Stop offset="1" stopColor={BrandColors.lime} stopOpacity={0} />
                </LinearGradient>
              </Defs>
              <Rect width="100%" height="100%" fill="url(#shimmer)" />
            </Svg>
          </Animated.View>
        )}
        <Text style={[styles.visualizeText, painting && styles.visualizeTextPainting]}>
          {painting ? 'painting it into the sky…' : '✧ visualize this dream'}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 12,
    marginHorizontal: 16,
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  seenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
  },
  thumb: {
    width: 72,
    height: 92,
    borderRadius: 16,
  },
  seenText: {
    flex: 1,
    gap: 6,
  },
  when: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: BrandColors.lime,
  },
  seenTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    lineHeight: 20,
    color: '#fff',
  },
  open: {
    alignSelf: 'flex-start',
    marginTop: 4,
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  openText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: '#111',
  },
  pressed: {
    opacity: 0.8,
  },
  written: {
    gap: 12,
    padding: 18,
  },
  writtenHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  writtenTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 20,
    lineHeight: 22,
    letterSpacing: -0.5,
    color: '#fff',
  },
  quote: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.9)',
  },
  summary: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
  },
  visualize: {
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  visualizePainting: {
    backgroundColor: '#1f1f22',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    width: '45%',
  },
  visualizeText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  visualizeTextPainting: {
    color: BrandColors.lime,
  },
});
