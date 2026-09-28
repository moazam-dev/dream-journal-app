import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { EASE_OUT } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { colorFill, dreamColor, type CalendarDay } from '@/utils/entries';

const LETTERS = ['s', 'm', 't', 'w', 't', 'f', 's'];
const DAY = 38;
const ROW_GAP = 6;

type EntryCalendarProps = {
  /** "september" */
  monthLabel: string;
  month: (CalendarDay | null)[];
  week: CalendarDay[];
  open: boolean;
  reduceMotion: boolean;
  onToggle: () => void;
  onPick: (dream: Dream) => void;
};

/**
 * The calendar card on the Entries screen: this week, or the whole month when opened.
 * Days with a dream wear that dream's colour and jump to it in the history.
 */
export function EntryCalendar({ monthLabel, month, week, open, reduceMotion, onToggle, onPick }: EntryCalendarProps) {
  const rows = Math.ceil(month.length / 7);
  const monthHeight = rows * DAY + (rows - 1) * ROW_GAP + ROW_GAP;

  return (
    <View style={styles.card}>
      <View style={styles.head}>
        <Text style={styles.month}>{monthLabel}</Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={open ? 'Collapse calendar' : 'Expand calendar'}
          onPress={onToggle}
          hitSlop={8}
          style={({ pressed }) => [styles.toggle, pressed && styles.pressed]}>
          <Text style={styles.toggleText}>{open ? 'less' : 'month'}</Text>
          <Animated.View
            style={[
              { transform: [{ rotate: open ? '180deg' : '0deg' }] },
              !reduceMotion && { transitionProperty: 'transform', transitionDuration: 300, transitionTimingFunction: 'ease' },
            ]}>
            <Svg width={10} height={6} viewBox="0 0 10 6">
              <Path d="M1 1l4 4 4-4" stroke="#fff" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" fill="none" />
            </Svg>
          </Animated.View>
        </Pressable>
      </View>

      <View style={styles.grid} importantForAccessibility="no-hide-descendants">
        {LETTERS.map((letter, i) => (
          <View key={i} style={styles.cell}>
            <Text style={styles.letter}>{letter}</Text>
          </View>
        ))}
      </View>

      <Animated.View
        style={[
          styles.monthWrap,
          { height: open ? monthHeight : 0 },
          !reduceMotion && { transitionProperty: 'height', transitionDuration: 400, transitionTimingFunction: EASE_OUT },
        ]}>
        <View style={[styles.grid, styles.monthGrid]}>
          {month.map((day, i) => (
            <View key={day?.key ?? `blank-${i}`} style={styles.cell}>
              {day && <Day day={day} onPick={onPick} />}
            </View>
          ))}
        </View>
      </Animated.View>

      {!open && (
        <View style={styles.grid}>
          {week.map((day) => (
            <View key={day.key} style={styles.cell}>
              <Day day={day} onPick={onPick} />
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function Day({ day, onPick }: { day: CalendarDay; onPick: (dream: Dream) => void }) {
  const { dream } = day;
  const color = day.future ? 'rgba(255,255,255,0.25)' : 'rgba(255,255,255,0.55)';

  return (
    <Pressable
      disabled={!dream}
      accessibilityRole={dream ? 'button' : 'text'}
      accessibilityLabel={dream ? `${day.day}, a dream. Show it.` : `${day.day}${day.today ? ', today' : ''}`}
      onPress={() => dream && onPick(dream)}
      style={[
        styles.day,
        dream && colorFill(dreamColor(dream)),
        day.today && styles.today,
      ]}>
      <Text style={[styles.dayText, { color: dream ? '#111' : color }]}>{day.day}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 26,
    backgroundColor: '#141414',
    paddingTop: 14,
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 12,
  },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  month: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#fff',
  },
  toggle: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    backgroundColor: '#262626',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  toggleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#fff',
  },
  pressed: {
    opacity: 0.8,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  monthWrap: {
    overflow: 'hidden',
  },
  monthGrid: {
    rowGap: ROW_GAP,
    paddingBottom: ROW_GAP,
  },
  cell: {
    width: `${100 / 7}%`,
    alignItems: 'center',
  },
  letter: {
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.5)',
  },
  day: {
    width: DAY,
    height: DAY,
    borderRadius: DAY / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  today: {
    outlineWidth: 2,
    outlineColor: '#fff',
    outlineStyle: 'solid',
  },
  dayText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
  },
});
