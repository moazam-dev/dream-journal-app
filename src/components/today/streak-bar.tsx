import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { BrandColors, BrandFonts } from '@/constants/theme';
import type { WeekDay } from '@/utils/entries';

/** Soft slate for the count and the days not yet logged. */
const SLATE = '#8FA3B5';

/** Height of the streak row, which floats over the top of the Today feed. */
export const STREAK_BAR_HEIGHT = 52;

type StreakBarProps = {
  /** Nights in a row with a dream. */
  streak: number;
  week: WeekDay[];
};

/** Row above the Today feed: a lime flame with the streak, and this week's days (logged ones as lime dots). */
export function StreakBar({ streak, week }: StreakBarProps) {
  const logged = week.filter((day) => day.logged).length;

  return (
    <View style={styles.row}>
      <View
        style={styles.streak}
        accessible
        accessibilityLabel={`${streak} night${streak === 1 ? '' : 's'} in a row`}>
        <Svg width={20} height={26} viewBox="0 0 20 26">
          <Path
            d="M10 0.5c0.9 3.6 3.4 5.9 5.6 8.5 2.4 2.8 4 5.6 4 9 0 4.6-4.3 7.8-9.6 7.8S0.4 22.6 0.4 18c0-3.1 1.4-5.4 3.4-7.3 0.2 1.9 1.1 3.3 2.6 3.9-0.6-5.7 1.3-10.4 3.6-14.1z"
            fill={BrandColors.lime}
          />
        </Svg>
        <Text style={styles.count}>{streak}</Text>
      </View>

      <View style={styles.week} accessible accessibilityLabel={`${logged} of 7 days logged this week`}>
        {week.map((day, i) => (
          <View key={i} style={styles.day}>
            {day.logged ? <View style={styles.dot} /> : <Text style={[styles.letter, day.today && styles.today]}>{day.letter}</Text>}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    height: STREAK_BAR_HEIGHT,
    paddingLeft: 34,
    paddingRight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  count: {
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 22,
    color: SLATE,
    fontVariant: ['tabular-nums'],
  },
  week: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  day: {
    width: 22,
    alignItems: 'center',
  },
  letter: {
    fontFamily: BrandFonts.semibold,
    fontSize: 15,
    lineHeight: 18,
    color: SLATE,
  },
  today: {
    color: '#FFFFFF',
  },
  dot: {
    width: 15,
    height: 15,
    borderRadius: 7.5,
    backgroundColor: BrandColors.lime,
  },
});
