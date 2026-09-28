import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { animate } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { Figure, HeadlinePart, MoodKey, MoodNight, Tally, Theme, WeekNight } from '@/utils/patterns';

import { BOUNCE, CAP, FLOAT, forever, GROW, OPEN, up, WORD } from './motion';
import { Pill, PhotoCard } from './photo-card';

// Theme words shrink with their rank, from the design.
const WORD_SIZES = [58, 40, 32, 28, 24];
const WORD_TRACKING = [-2.6, -1.6, -1.2, -1, -0.8];

type RhythmCardProps = {
  streak: number;
  best: number;
  bestLine: string;
  week: WeekNight[];
  weekLabel: string;
  photo: string | null;
  reduceMotion: boolean;
};

/** The streak, the best streak ever, and this week's nights as bars. */
export function RhythmCard({ streak, best, bestLine, week, weekLabel, photo, reduceMotion }: RhythmCardProps) {
  return (
    <PhotoCard photo={photo} base="#141d3a" shade="rgba(0,0,0,0.4)" reduceMotion={reduceMotion} style={up(reduceMotion, 100)}>
      <View style={styles.rhythm}>
        <View style={styles.tiles}>
          <Tile label="streak" value={streak} note={streak === 1 ? 'night so far' : 'nights in a row'} />
          <Tile label="best ever" value={best} note={bestLine} />
        </View>
        <View style={styles.week}>
          <View style={styles.weekHead}>
            <Text style={styles.weekTitle}>this week</Text>
            <Text style={styles.weekCount}>{weekLabel}</Text>
          </View>
          <View style={styles.bars}>
            {week.map((night, i) => (
              <View key={night.key} style={styles.barColumn}>
                <Animated.View
                  style={[
                    styles.bar,
                    {
                      height: night.height,
                      backgroundColor: !night.caught ? 'rgba(255,255,255,0.18)' : night.best ? BrandColors.lime : 'rgba(255,255,255,0.85)',
                    },
                    night.best && styles.barGlow,
                    animate(reduceMotion, { animationName: GROW, animationDuration: 800, animationDelay: 300 + i * 60, animationTimingFunction: BOUNCE }),
                  ]}
                />
                <Text style={styles.barDay}>{night.day}</Text>
              </View>
            ))}
          </View>
        </View>
      </View>
    </PhotoCard>
  );
}

function Tile({ label, value, note }: { label: string; value: number; note: string }) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileLabel}>{label}</Text>
      <Text style={styles.tileValue}>{value}</Text>
      <Text style={styles.tileNote} numberOfLines={1}>
        {note}
      </Text>
    </View>
  );
}

type ThemesCardProps = {
  themes: Theme[];
  /** The theme opened to read its note, or -1. */
  open: number;
  onToggle: (index: number) => void;
  photo: string | null;
  reduceMotion: boolean;
};

/** "◉ on your mind lately": the themes as words sized by how often they come up. */
export function ThemesCard({ themes, open, onToggle, photo, reduceMotion }: ThemesCardProps) {
  const opened = themes[open];
  return (
    <PhotoCard photo={photo} base="#3a2a20" reduceMotion={reduceMotion} style={up(reduceMotion, 160)}>
      <View style={styles.body}>
        <Pill label="◉ on your mind lately" />
        <View style={styles.words}>
          {themes.map((theme, i) => {
            const on = open === i;
            const color = on ? theme.color : '#fff';
            const opacity = open < 0 || on ? 1 : 0.55;
            return (
              <Pressable
                key={theme.name}
                accessibilityRole="button"
                accessibilityState={{ expanded: on }}
                accessibilityLabel={`${theme.name}, ${theme.count} dreams`}
                onPress={() => onToggle(on ? -1 : i)}>
                <Animated.View
                  style={[
                    styles.word,
                    animate(reduceMotion, { animationName: WORD, animationDuration: 700, animationDelay: 200 + i * 100, animationTimingFunction: 'ease' }),
                  ]}>
                  <Animated.Text
                    style={[
                      styles.wordText,
                      { fontSize: WORD_SIZES[i], lineHeight: Math.round(WORD_SIZES[i] * 1.06), letterSpacing: WORD_TRACKING[i], color, opacity },
                      fade(reduceMotion),
                    ]}>
                    {theme.name}
                  </Animated.Text>
                  <Animated.Text style={[styles.wordCount, { color, opacity }, fade(reduceMotion)]}>{theme.count}</Animated.Text>
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
        {opened && (
          <Animated.View
            key={opened.name}
            style={[styles.note, animate(reduceMotion, { animationName: OPEN, animationDuration: 350, animationTimingFunction: 'ease' })]}>
            <Text style={[styles.noteLabel, { color: opened.color }]}>
              {opened.name} · {opened.count} dream{opened.count === 1 ? '' : 's'}
            </Text>
            <Text style={styles.noteText}>{opened.note}</Text>
          </Animated.View>
        )}
      </View>
    </PhotoCard>
  );
}

type MoodCardProps = {
  headline: HeadlinePart[];
  nights: MoodNight[];
  legend: MoodKey[];
  /** The first night on the chart ("aug 31"). */
  from: string;
  photo: string | null;
  reduceMotion: boolean;
};

/** "✺ you've been feeling": the mood of each of the last 28 nights, and the moods' shares. */
export function MoodCard({ headline, nights, legend, from, photo, reduceMotion }: MoodCardProps) {
  return (
    <PhotoCard photo={photo} base="#5a2a12" reduceMotion={reduceMotion} style={up(reduceMotion, 220)}>
      <View style={styles.body}>
        <Pill label="✺ you’ve been feeling" />
        <Text style={styles.moodHeadline}>
          {headline.map((part, i) => (
            <Text key={i} style={part.color ? { color: part.color } : null}>
              {part.text}
            </Text>
          ))}
        </Text>
        <View style={styles.moodBars} accessibilityLabel="moods over the last 28 nights">
          {nights.map((night, i) => (
            <Animated.View
              key={night.key}
              style={[
                styles.moodBar,
                { height: night.height, backgroundColor: night.color },
                animate(reduceMotion, { animationName: CAP, animationDuration: 500, animationDelay: 200 + i * 25, animationTimingFunction: BOUNCE }),
              ]}
            />
          ))}
        </View>
        <View style={styles.axis}>
          <Text style={styles.axisText}>{from}</Text>
          <Text style={styles.axisText}>last {nights.length} nights</Text>
          <Text style={styles.axisText}>today</Text>
        </View>
        <View style={styles.legend}>
          {legend.map((mood) => (
            <View key={mood.name} style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: mood.color }]} />
              <Text style={styles.legendName} numberOfLines={1}>
                {mood.name}
              </Text>
              <Text style={[styles.legendPct, { color: mood.color }]}>{mood.pct}%</Text>
            </View>
          ))}
        </View>
      </View>
    </PhotoCard>
  );
}

type CastCardProps = {
  people: Figure[];
  symbols: Tally[];
  photo: string | null;
  reduceMotion: boolean;
};

/** "☾ who and what shows up": the people who come back, and the places and things. */
export function CastCard({ people, symbols, photo, reduceMotion }: CastCardProps) {
  return (
    <PhotoCard photo={photo} base="#2d3d25" reduceMotion={reduceMotion} style={up(reduceMotion, 280)}>
      <View style={styles.body}>
        <Pill label="☾ who and what shows up" />
        {people.length > 0 && (
          <View style={styles.people}>
            {people.map((person, i) => (
              <Animated.View key={person.name} style={[styles.person, forever(reduceMotion, FLOAT, 4000, 'ease-in-out', i * 600)]}>
                <View style={[styles.face, { backgroundColor: person.color, boxShadow: `0 0 30px ${person.color}66` }]}>
                  <Text style={styles.faceText}>{person.initial}</Text>
                </View>
                <Text style={styles.personName} numberOfLines={1}>
                  {person.name}
                </Text>
                <Text style={styles.personCount}>{person.label}</Text>
              </Animated.View>
            ))}
          </View>
        )}
        {symbols.length > 0 && (
          <View style={styles.symbols}>
            {symbols.map((symbol) => (
              <View key={symbol.name} style={styles.symbol}>
                <Text style={styles.symbolText}>
                  {symbol.name}
                  <Text style={styles.symbolCount}> ×{symbol.count}</Text>
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    </PhotoCard>
  );
}

const glass = { backgroundColor: 'rgba(255,255,255,0.12)' };

/** A theme's colour and dimming ease in and out when another theme is opened. */
function fade(reduceMotion: boolean) {
  return reduceMotion ? null : { transitionProperty: ['color', 'opacity'], transitionDuration: '300ms', transitionTimingFunction: 'ease' as const };
}

const styles = StyleSheet.create({
  body: {
    padding: 22,
    gap: 18,
  },
  rhythm: {
    padding: 20,
    gap: 20,
  },
  tiles: {
    flexDirection: 'row',
    gap: 10,
  },
  tile: {
    flex: 1,
    borderRadius: 24,
    padding: 16,
    gap: 6,
    ...glass,
  },
  tileLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  tileValue: {
    fontFamily: BrandFonts.semibold,
    fontSize: 44,
    lineHeight: 46,
    letterSpacing: -2,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  tileNote: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  week: {
    gap: 12,
  },
  weekHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  weekTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#fff',
  },
  weekCount: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: BrandColors.lime,
  },
  bars: {
    height: 118,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 4,
  },
  barColumn: {
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    width: 30,
    borderRadius: 15,
    transformOrigin: 'bottom',
  },
  barGlow: {
    boxShadow: '0 0 20px rgba(226,235,152,0.6)',
  },
  barDay: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: '#fff',
  },
  words: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-end',
    columnGap: 14,
    rowGap: 2,
  },
  word: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 3,
  },
  wordText: {
    fontFamily: BrandFonts.medium,
  },
  wordCount: {
    marginTop: 6,
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
  },
  note: {
    borderRadius: 22,
    padding: 16,
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  noteLabel: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  noteText: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#fff',
  },
  moodHeadline: {
    fontFamily: BrandFonts.medium,
    fontSize: 26,
    lineHeight: 29,
    letterSpacing: -0.8,
    color: '#fff',
  },
  moodBars: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 3,
  },
  moodBar: {
    flex: 1,
    borderRadius: 6,
    transformOrigin: 'bottom',
  },
  axis: {
    marginTop: -8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  axisText: {
    fontFamily: BrandFonts.medium,
    fontSize: 11,
    lineHeight: 13,
    color: 'rgba(255,255,255,0.8)',
  },
  legend: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  legendItem: {
    flexBasis: '47%',
    flexGrow: 1,
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 22,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    ...glass,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendName: {
    flex: 1,
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  legendPct: {
    fontFamily: BrandFonts.semibold,
    fontSize: 13,
    lineHeight: 16,
  },
  people: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  person: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  face: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  faceText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 22,
    lineHeight: 26,
    color: '#111',
  },
  personName: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  personCount: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.85)',
  },
  symbols: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  symbol: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: 18,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  symbolText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  symbolCount: {
    color: BrandColors.lime,
  },
});
