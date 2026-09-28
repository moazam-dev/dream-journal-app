import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Circle, Defs, LinearGradient, Stop } from 'react-native-svg';

import { animate, SPIN } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { isSeen, monthGrid, monthName, moodColor } from '@/utils/entries';
import { dreamMood } from '@/utils/visualize';

import { FILL, MOON, up } from './motion';

const WEEKDAYS = ['s', 'm', 't', 'w', 't', 'f', 's'];
const NIGHT = 38;
/** The calendar card's colour, so the "written" crescent can be cut out of a circle. */
const CARD = '#111114';

type NightCalendarProps = {
  month: Date;
  today: Date;
  byDay: Map<number, Dream>;
  selectedId: string | null;
  paintingId: string | null;
  justPaintedId: string | null;
  reduceMotion: boolean;
  onPick: (dream: Dream) => void;
};

/**
 * The month as a sky of nights: a night with a painted dream shows its picture, a night
 * with a written one shows a crescent in the dream's mood colour, the rest are just numbers.
 */
export function NightCalendar({ month, today, byDay, selectedId, paintingId, justPaintedId, reduceMotion, onPick }: NightCalendarProps) {
  const { lead, days } = monthGrid(month.getFullYear(), month.getMonth());
  const thisMonth = today.getFullYear() === month.getFullYear() && today.getMonth() === month.getMonth();

  return (
    <Animated.View style={[styles.card, up(reduceMotion, 300)]}>
      <View style={styles.head}>
        <Text style={styles.heading}>{monthName(month)} nights</Text>
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <Svg width={9} height={9}>
              <Defs>
                <LinearGradient id="seenDot" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor="#8e9fd6" />
                  <Stop offset="1" stopColor="#d8a585" />
                </LinearGradient>
              </Defs>
              <Circle cx={4.5} cy={4.5} r={4.5} fill="url(#seenDot)" />
            </Svg>
            <Text style={styles.legendText}>seen</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={styles.writtenDot}>
              <View style={styles.writtenDotFill} />
            </View>
            <Text style={styles.legendText}>written</Text>
          </View>
        </View>
      </View>

      <View style={styles.grid}>
        {WEEKDAYS.map((day, i) => (
          <View key={`w${i}`} style={styles.cell}>
            <Text style={styles.weekday}>{day}</Text>
          </View>
        ))}
        {Array.from({ length: lead }, (_, i) => (
          <View key={`b${i}`} style={styles.cell} />
        ))}
        {Array.from({ length: days }, (_, i) => {
          const day = i + 1;
          const dream = byDay.get(day);
          const future = thisMonth ? day > today.getDate() : month > today;
          const isToday = thisMonth && day === today.getDate();
          return (
            <View key={day} style={styles.cell}>
              <Night
                day={day}
                dream={dream}
                future={future}
                isToday={isToday}
                selected={!!dream && dream.id === selectedId}
                painting={!!dream && dream.id === paintingId}
                justPainted={!!dream && dream.id === justPaintedId}
                label={`${monthName(month)} ${day}`}
                reduceMotion={reduceMotion}
                onPick={onPick}
              />
            </View>
          );
        })}
      </View>
    </Animated.View>
  );
}

type NightProps = {
  day: number;
  dream: Dream | undefined;
  future: boolean;
  isToday: boolean;
  selected: boolean;
  painting: boolean;
  justPainted: boolean;
  label: string;
  reduceMotion: boolean;
  onPick: (dream: Dream) => void;
};

function Night({ day, dream, future, isToday, selected, painting, justPainted, label, reduceMotion, onPick }: NightProps) {
  const seen = !!dream && isSeen(dream);
  const numberColor = dream ? '#fff' : future ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.45)';
  const ring = selected ? BrandColors.lime : isToday ? 'rgba(255,255,255,0.25)' : 'transparent';

  return (
    <Animated.View style={animate(reduceMotion, { animationName: MOON, animationDuration: 400, animationDelay: 300 + day * 12, animationTimingFunction: 'ease' })}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityState={{ selected, disabled: !dream }}
        disabled={!dream}
        onPress={() => dream && onPick(dream)}
        style={styles.night}>
        {seen && (
          <Animated.View
            style={[
              styles.picture,
              justPainted && animate(reduceMotion, { animationName: FILL, animationDuration: 1000, animationTimingFunction: 'ease' }),
            ]}>
            <Image source={{ uri: dream.image_url ?? undefined }} style={styles.fill} contentFit="cover" />
          </Animated.View>
        )}
        {dream && !seen && (
          <View style={styles.written}>
            <View style={[styles.fill, { backgroundColor: moodColor(dreamMood(dream)) }]} />
            <View style={styles.cutout} />
          </View>
        )}
        {painting && (
          <Animated.View
            style={[
              styles.spinner,
              animate(reduceMotion, { animationName: SPIN, animationDuration: 800, animationTimingFunction: 'linear', animationIterationCount: 'infinite' }),
            ]}
          />
        )}
        <Text style={[styles.number, { color: numberColor }, seen && styles.numberOnPicture]}>{day}</Text>
        <View pointerEvents="none" style={[styles.ring, { borderColor: ring }]} />
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: 18,
    marginHorizontal: 16,
    borderRadius: 30,
    paddingTop: 18,
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  heading: {
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 21,
    letterSpacing: -0.4,
    color: '#fff',
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  legendText: {
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.75)',
  },
  writtenDot: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1,
    borderColor: 'rgba(226,235,152,0.5)',
    overflow: 'hidden',
  },
  writtenDotFill: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    backgroundColor: BrandColors.lime,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    rowGap: 10,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  weekday: {
    fontFamily: BrandFonts.medium,
    fontSize: 10,
    lineHeight: 12,
    letterSpacing: 0.8,
    color: 'rgba(255,255,255,0.5)',
  },
  night: {
    width: NIGHT,
    height: NIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  picture: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: NIGHT / 2,
    overflow: 'hidden',
  },
  written: {
    position: 'absolute',
    top: 3,
    left: 3,
    right: 3,
    bottom: 3,
    borderRadius: NIGHT / 2,
    borderWidth: 1,
    borderColor: 'rgba(226,235,152,0.45)',
    overflow: 'hidden',
  },
  // Covers all but a thin crescent on the left of the mood colour.
  cutout: {
    position: 'absolute',
    top: -1,
    bottom: -1,
    left: 7,
    width: NIGHT - 6,
    borderRadius: NIGHT / 2,
    backgroundColor: CARD,
  },
  spinner: {
    position: 'absolute',
    top: -3,
    left: -3,
    right: -3,
    bottom: -3,
    borderRadius: NIGHT,
    borderWidth: 2,
    borderColor: 'transparent',
    borderTopColor: BrandColors.lime,
  },
  number: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
  },
  numberOnPicture: {
    textShadowColor: 'rgba(0,0,0,0.9)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
  },
  ring: {
    position: 'absolute',
    top: -4,
    left: -4,
    right: -4,
    bottom: -4,
    borderRadius: NIGHT,
    borderWidth: 1.5,
  },
});
