import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, Vibration, View, type LayoutChangeEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { SPRING } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { colorFill, dreamColor, dreamHeadline, rowDate } from '@/utils/entries';
import { dreamMood } from '@/utils/visualize';

/** How long a dream is held before its options open (the design's 450ms). */
const HOLD_MS = 450;

type EntryRowProps = {
  dream: Dream;
  /** Ringed in white: just jumped to from the calendar, or its options are open. */
  ringed: boolean;
  reduceMotion: boolean;
  onPress: (dream: Dream) => void;
  onHold: (dream: Dream) => void;
  onLayout?: (event: LayoutChangeEvent) => void;
};

/** One dream in the Entries history: a coloured card with its date, mood and headline. Hold it for options. */
export function EntryRow({ dream, ringed, reduceMotion, onPress, onHold, onLayout }: EntryRowProps) {
  const [pressing, setPressing] = useState(false);
  const mood = dreamMood(dream);
  const date = rowDate(dream);
  const headline = dreamHeadline(dream);

  return (
    <Pressable
      onLayout={onLayout}
      accessibilityRole="button"
      accessibilityLabel={`${date}: ${headline}${mood ? `, ${mood}` : ''}`}
      accessibilityHint="Opens the dream. Hold for colour and delete."
      accessibilityActions={[{ name: 'longpress', label: 'Dream options' }]}
      onAccessibilityAction={(event) => event.nativeEvent.actionName === 'longpress' && onHold(dream)}
      delayLongPress={HOLD_MS}
      onPressIn={() => setPressing(true)}
      onPressOut={() => setPressing(false)}
      onLongPress={() => {
        setPressing(false);
        // A short tick where the platform allows it (iOS only has one long buzz).
        if (Platform.OS === 'android') Vibration.vibrate(10);
        onHold(dream);
      }}
      onPress={() => onPress(dream)}>
      <Animated.View
        style={[
          styles.card,
          colorFill(dreamColor(dream)),
          {
            outlineWidth: ringed ? 2 : 0,
            transform: [{ scale: pressing ? 0.96 : 1 }],
          },
          !reduceMotion && { transitionProperty: 'transform', transitionDuration: 250, transitionTimingFunction: SPRING },
        ]}>
        <View style={styles.top}>
          <Text style={styles.date}>{date}</Text>
          {mood && (
            <View style={styles.chip}>
              <Text style={styles.chipText}>{mood}</Text>
            </View>
          )}
        </View>
        <Text style={styles.headline} numberOfLines={1}>
          {headline}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    height: 108,
    borderRadius: 26,
    paddingVertical: 16,
    paddingHorizontal: 18,
    justifyContent: 'space-between',
    outlineColor: '#fff',
    outlineStyle: 'solid',
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  date: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#111',
    opacity: 0.75,
  },
  chip: {
    height: 22,
    paddingHorizontal: 9,
    borderRadius: 11,
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  chipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: '#fff',
  },
  headline: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 25,
    letterSpacing: -0.6,
    color: '#111',
  },
});
