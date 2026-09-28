import { StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier } from 'react-native-reanimated';

import { BrandFonts } from '@/constants/theme';
import { dreamWeek, WEEK_DAYS } from '@/utils/recall';

type DreamWeekProps = {
  /** Dreams caught in a typical week: how many days light up. */
  nights: number;
  color: string;
  reduceMotion: boolean;
};

/** A lit day pops in (overshoots, then settles). */
const SPRING = cubicBezier(0.3, 1.6, 0.5, 1);
/** Gap between one day lighting up and the next. */
const STAGGER_MS = 60;

/** One week, Monday first: a dot per day, filled in on the days they'd remember a dream. */
export function DreamWeek({ nights, color, reduceMotion }: DreamWeekProps) {
  const week = dreamWeek(nights);
  return (
    <View style={styles.row}>
      {week.map((place, day) => {
        const on = place !== null;
        return (
          <View key={day} style={styles.day}>
            <View style={styles.dot}>
              <Animated.View
                style={[
                  styles.fill,
                  {
                    backgroundColor: color,
                    transform: [{ scale: on ? 1 : 0 }],
                    transitionProperty: ['transform', 'backgroundColor'],
                    transitionDuration: reduceMotion ? 0 : 500,
                    transitionTimingFunction: [SPRING, 'ease'],
                    transitionDelay: on && !reduceMotion ? place * STAGGER_MS : 0,
                  },
                ]}
              />
            </View>
            <Text style={styles.label}>{WEEK_DAYS[day]}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  day: {
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: 'hidden',
    backgroundColor: '#1C1C1C',
  },
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    borderRadius: 15,
  },
  label: {
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 11,
    color: '#5C5C5C',
  },
});
