import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { up } from '@/components/patterns/motion';
import { PatternColors as C, PatternFonts as F } from '@/constants/theme';
import type { WeekDay } from '@/utils/entries';
import { castLine, splitHeadline, type CastMember } from '@/utils/patterns';

/** "Your patterns, uncovered": the sunset arch over the intro. */
export function HeroCard({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <Animated.View style={[styles.hero, up(reduceMotion, 0)]}>
      <View style={styles.heroSky}>
        <View style={[styles.arch, { width: 240, height: 120, backgroundColor: C.rust }]}>
          <View style={[styles.arch, { width: 170, height: 85, backgroundColor: C.cream }]}>
            <View style={[styles.arch, { width: 100, height: 50, backgroundColor: C.aubergine }]} />
          </View>
        </View>
      </View>
      <View style={styles.heroBody}>
        <Text style={styles.heroTitle} accessibilityRole="header">
          Your patterns, <Text style={styles.italic}>uncovered</Text>
        </Text>
        <Text style={styles.heroText}>The themes, moods and people your dreams keep returning to — they grow and shift with every entry.</Text>
      </View>
    </Animated.View>
  );
}

export type Kpi = { label: string; value: string; unit: string; color: string };

type StatsGridProps = { kpis: Kpi[]; week: WeekDay[]; reduceMotion: boolean };

/** Streaks and this week, as a 2×2 grid. */
export function StatsGrid({ kpis, week, reduceMotion }: StatsGridProps) {
  const cells = [
    ...kpis.map((kpi) => <KpiCell key={kpi.label} kpi={kpi} />),
    <View key="week" style={styles.tile}>
      <Text style={styles.tileLabel}>Your week</Text>
      <View style={styles.week}>
        {week.map((day, i) => (
          <View key={i} style={styles.weekDay} accessibilityLabel={`${day.letter}: ${day.logged ? 'dream logged' : 'no dream'}`}>
            <View style={[styles.weekDot, day.logged ? styles.weekDotOn : styles.weekDotOff]} />
            <Text style={[styles.weekLetter, day.today && styles.weekToday]}>{day.letter}</Text>
          </View>
        ))}
      </View>
    </View>,
  ];
  return (
    <Animated.View style={[styles.grid, up(reduceMotion, 80)]}>
      <View style={styles.row}>{cells.slice(0, 2)}</View>
      <View style={styles.row}>{cells.slice(2, 4)}</View>
    </Animated.View>
  );
}

function KpiCell({ kpi }: { kpi: Kpi }) {
  return (
    <View style={styles.tile} accessibilityLabel={`${kpi.label}: ${kpi.value} ${kpi.unit}`}>
      <View style={styles.tileHead}>
        <Text style={styles.tileLabel}>{kpi.label}</Text>
        <View style={[styles.kpiDot, { backgroundColor: kpi.color }]} />
      </View>
      <View style={styles.kpiValueRow}>
        <Text style={styles.kpiValue}>{kpi.value}</Text>
        <Text style={styles.kpiUnit}>{kpi.unit}</Text>
      </View>
    </View>
  );
}

type CastCardProps = {
  cast: CastMember[];
  selected: number;
  onSelect: (index: number) => void;
  /** True while the reading is still looking through the dream text for people. */
  searching: boolean;
  reduceMotion: boolean;
};

/** "Your dream cast": who keeps showing up, tap one for where and how. */
export function CastCard({ cast, selected, onSelect, searching, reduceMotion }: CastCardProps) {
  const recurring = cast.filter((member) => member.count > 1).length;
  const current = cast[Math.min(selected, cast.length - 1)];
  const pairs = [cast.slice(0, 2), cast.slice(2, 4)].filter((pair) => pair.length > 0);
  return (
    <Animated.View style={[styles.cast, up(reduceMotion, 160)]}>
      <View style={styles.castHead}>
        <Text style={styles.castTitle} accessibilityRole="header">
          Your dream cast
        </Text>
        <Text style={styles.castCount}>{recurring > 0 ? `${recurring} recurring` : `${cast.length} so far`}</Text>
      </View>
      {cast.length === 0 ? (
        <Text style={[styles.castEmpty]}>
          {searching
            ? 'Looking through your dreams for the people in them…'
            : 'Nobody else has shown up yet. When someone appears in a dream, they’ll gather here.'}
        </Text>
      ) : (
        <>
          <View style={styles.castGrid}>
            {pairs.map((pair, row) => (
              <View key={row} style={styles.row}>
                {pair.map((member, col) => {
                  const index = row * 2 + col;
                  const on = index === Math.min(selected, cast.length - 1);
                  return (
                    <Pressable
                      key={member.name}
                      accessibilityRole="button"
                      accessibilityState={{ selected: on }}
                      accessibilityLabel={`${member.name}, ${castLine(member)}`}
                      onPress={() => onSelect(index)}
                      style={({ pressed }) => [styles.person, on ? styles.personOn : styles.personOff, pressed && styles.pressed]}>
                      <CastArt index={index} />
                      <View style={styles.personText}>
                        <Text style={styles.personName} numberOfLines={1}>
                          {member.name}
                        </Text>
                        <Text style={styles.personLine} numberOfLines={1}>
                          {castLine(member)}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })}
                {pair.length === 1 && <View style={styles.personSpacer} />}
              </View>
            ))}
          </View>
          {current && (
            <View style={styles.castNote}>
              <Text style={styles.castNoteText}>
                <Text style={styles.bold}>{current.name}</Text> — {current.note || 'showing up in your dreams.'}
              </Text>
            </View>
          )}
        </>
      )}
    </Animated.View>
  );
}

/** The four abstract portraits from the design, one per cast card. */
function CastArt({ index }: { index: number }) {
  switch (index % 4) {
    case 0:
      return (
        <View style={[styles.art, styles.artRow]}>
          <View style={{ flex: 1, backgroundColor: C.mustard }} />
          <View style={{ flex: 1, backgroundColor: C.rust }} />
        </View>
      );
    case 1:
      return (
        <View style={[styles.art, styles.artCenter, { backgroundColor: C.lilac }]}>
          <View style={[styles.ring, { width: 40, height: 40, backgroundColor: C.forest }]}>
            <View style={[styles.ring, { width: 32, height: 32, backgroundColor: C.lilac }]}>
              <View style={[styles.ring, { width: 18, height: 18, backgroundColor: C.forest }]} />
            </View>
          </View>
        </View>
      );
    case 2:
      return (
        <View style={styles.art}>
          {Array.from({ length: 4 }, (_, i) => (
            <View key={i}>
              <View style={{ height: 8, backgroundColor: C.sky }} />
              <View style={{ height: 6, backgroundColor: C.cream }} />
            </View>
          ))}
        </View>
      );
    default:
      return (
        <View style={styles.art}>
          <View style={{ flex: 1, backgroundColor: C.cream }} />
          <View style={{ flex: 1, backgroundColor: C.mustard }} />
        </View>
      );
  }
}

type ReportCardProps = {
  month: string;
  owner: string;
  headline: string;
  stats: { value: string; label: string }[];
  /** "Most visited by grandma · calmest night was a Saturday", in parts (bold ones marked). */
  footer: { text: string; bold?: boolean }[];
  onWhatsApp: () => void;
  onShare: () => void;
  onCopy: () => void;
  reduceMotion: boolean;
};

const STRIPES = [C.sky, C.mustard, C.rust];

/** "Monthly report": a shareable card for the month in dreams. */
export function ReportCard({ month, owner, headline, stats, footer, onWhatsApp, onShare, onCopy, reduceMotion }: ReportCardProps) {
  const title = splitHeadline(headline);
  return (
    <Animated.View style={[styles.report, up(reduceMotion, 240)]}>
      <View style={styles.reportHead}>
        <Text style={styles.reportTitle} accessibilityRole="header">
          Monthly report
        </Text>
        <Text style={styles.reportMonth}>{month}</Text>
      </View>
      <View style={styles.paper}>
        <View style={styles.stripes}>
          {Array.from({ length: 6 }, (_, i) =>
            STRIPES.map((color) => (
              <View key={`${i}${color}`} style={styles.stripeGroup}>
                <View style={{ width: 22, backgroundColor: color }} />
                <View style={{ width: 8, backgroundColor: C.cream }} />
              </View>
            ))
          )}
        </View>
        <View style={styles.paperBody}>
          <View style={styles.paperIntro}>
            <Text style={styles.paperOwner}>{owner}</Text>
            <Text style={styles.paperHeadline}>
              {title.plain}
              <Text style={styles.italic}>{title.italic}</Text>
            </Text>
          </View>
          <View style={styles.paperStats}>
            {stats.map((stat, i) => (
              <View key={stat.label} style={[styles.paperStat, i > 0 && styles.paperStatLine]}>
                <Text style={styles.paperValue} numberOfLines={1} adjustsFontSizeToFit>
                  {stat.value}
                </Text>
                <Text style={styles.paperLabel}>{stat.label}</Text>
              </View>
            ))}
          </View>
          {footer.length > 0 && (
            <Text style={styles.paperFooter}>
              {footer.map((part, i) => (
                <Text key={i} style={part.bold ? styles.paperBold : undefined}>
                  {part.text}
                </Text>
              ))}
            </Text>
          )}
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onWhatsApp} style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}>
        <View style={styles.waIcon}>
          <View style={styles.waDot} />
        </View>
        <Text style={styles.whatsappText}>Share on WhatsApp</Text>
      </Pressable>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onShare} style={({ pressed }) => [styles.outline, pressed && styles.pressed]}>
          <Text style={styles.outlineText}>More apps</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCopy} style={({ pressed }) => [styles.outline, pressed && styles.pressed]}>
          <Text style={styles.outlineText}>Copy text</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const PHASES: [number, 'flex-end' | 'flex-start'][] = [
  [0, 'flex-end'],
  [35, 'flex-end'],
  [100, 'flex-end'],
  [35, 'flex-start'],
  [0, 'flex-start'],
];

/** "Had another dream?": moon phases and a way to log one. */
export function LogCard({ onLog, reduceMotion }: { onLog: () => void; reduceMotion: boolean }) {
  return (
    <Animated.View style={[styles.log, up(reduceMotion, 320)]}>
      <View style={styles.phases}>
        {PHASES.map(([width, side], i) => (
          <View key={i} style={[styles.moon, { justifyContent: side }]}>
            <View style={{ height: '100%', width: `${width}%`, backgroundColor: C.cream }} />
          </View>
        ))}
      </View>
      <View style={styles.logBody}>
        <View style={styles.logText}>
          <Text style={styles.logTitle} accessibilityRole="header">
            Had another dream?
          </Text>
          <Text style={styles.logNote}>Tell Afterdream while it’s still fresh — every entry sharpens your patterns.</Text>
        </View>
        <Pressable accessibilityRole="button" onPress={onLog} style={({ pressed }) => [styles.logButton, pressed && styles.pressed]}>
          <Text style={styles.logPlus}>+</Text>
          <Text style={styles.logButtonText}>Log a dream</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  italic: { fontFamily: F.serifItalic },
  bold: { fontFamily: F.sansSemibold },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', gap: 12 },

  hero: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.rust },
  heroSky: { height: 150, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: C.mustard },
  arch: { borderTopLeftRadius: 999, borderTopRightRadius: 999, alignItems: 'center', justifyContent: 'flex-end' },
  heroBody: { paddingTop: 22, paddingHorizontal: 22, paddingBottom: 24, gap: 10 },
  heroTitle: { fontFamily: F.serif, fontSize: 38, lineHeight: 40, letterSpacing: -1, color: C.cream },
  heroText: { fontFamily: F.sans, fontSize: 15, lineHeight: 22, color: C.cream },

  grid: { gap: 12 },
  tile: { flex: 1, borderRadius: 24, backgroundColor: C.card, borderWidth: 1.5, borderColor: C.line, padding: 16, gap: 14 },
  tileHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  tileLabel: { fontFamily: F.sansMedium, fontSize: 13, lineHeight: 16, color: C.muted },
  kpiDot: { width: 10, height: 10, borderRadius: 5 },
  kpiValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  kpiValue: { fontFamily: F.serif, fontSize: 54, lineHeight: 54, letterSpacing: -2, color: C.cream },
  kpiUnit: { fontFamily: F.sans, fontSize: 13, lineHeight: 16, color: C.muted },
  week: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 'auto' },
  weekDay: { alignItems: 'center', gap: 6 },
  weekDot: { width: 14, height: 14, borderRadius: 7 },
  weekDotOn: { backgroundColor: C.sage },
  weekDotOff: { borderWidth: 1.5, borderColor: '#3A362F' },
  weekLetter: { fontFamily: F.sansMedium, fontSize: 11, lineHeight: 13, color: C.muted },
  weekToday: { color: C.cream },

  cast: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.forest },
  castHead: { paddingTop: 22, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  castTitle: { fontFamily: F.serif, fontSize: 30, lineHeight: 32, letterSpacing: -0.8, color: C.cream },
  castCount: { fontFamily: F.sansMedium, fontSize: 13, lineHeight: 16, color: C.mint },
  castEmpty: { fontFamily: F.sans, fontSize: 14, lineHeight: 20, color: C.mint, paddingHorizontal: 22, paddingTop: 12, paddingBottom: 22 },
  castGrid: { gap: 10, paddingTop: 18, paddingHorizontal: 16, paddingBottom: 16 },
  person: { flex: 1, borderRadius: 20, padding: 14, gap: 12, borderWidth: 1.5 },
  personOn: { backgroundColor: 'rgba(243,238,228,0.14)', borderColor: C.cream },
  personOff: { backgroundColor: 'transparent', borderColor: 'rgba(243,238,228,0.2)' },
  personSpacer: { flex: 1 },
  personText: { gap: 4 },
  personName: { fontFamily: F.serif, fontSize: 22, lineHeight: 24, color: C.cream },
  personLine: { fontFamily: F.sans, fontSize: 12, lineHeight: 15, color: C.mint },
  art: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  artRow: { flexDirection: 'row' },
  artCenter: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },
  castNote: { marginHorizontal: 16, marginBottom: 16, borderRadius: 18, backgroundColor: 'rgba(243,238,228,0.1)', paddingVertical: 14, paddingHorizontal: 16 },
  castNoteText: { fontFamily: F.sans, fontSize: 14, lineHeight: 20, color: C.cream },

  report: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.plum, padding: 16, gap: 14 },
  reportHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6, paddingHorizontal: 6 },
  reportTitle: { fontFamily: F.serif, fontSize: 30, lineHeight: 32, letterSpacing: -0.8, color: C.cream },
  reportMonth: { fontFamily: F.sansMedium, fontSize: 13, lineHeight: 16, color: C.lilac },
  paper: { borderRadius: 20, backgroundColor: C.cream, overflow: 'hidden' },
  stripes: { height: 72, flexDirection: 'row', overflow: 'hidden' },
  stripeGroup: { flexDirection: 'row' },
  paperBody: { padding: 18, gap: 14 },
  paperIntro: { gap: 6 },
  paperOwner: { fontFamily: F.sansSemibold, fontSize: 11, lineHeight: 13, letterSpacing: 1.4, textTransform: 'uppercase', color: C.paperMuted },
  paperHeadline: { fontFamily: F.serif, fontSize: 28, lineHeight: 30, letterSpacing: -0.8, color: C.ink },
  paperStats: { flexDirection: 'row', borderTopWidth: 1.5, borderBottomWidth: 1.5, borderColor: C.paperLine },
  paperStat: { flex: 1, minWidth: 0, paddingVertical: 12, gap: 4 },
  paperStatLine: { borderLeftWidth: 1.5, borderColor: C.paperLine, paddingLeft: 12 },
  paperValue: { fontFamily: F.serif, fontSize: 24, lineHeight: 26, color: C.ink },
  paperLabel: { fontFamily: F.sans, fontSize: 12, lineHeight: 15, color: C.paperMuted },
  paperFooter: { fontFamily: F.sans, fontSize: 14, lineHeight: 20, color: C.paperText },
  paperBold: { fontFamily: F.sansSemibold, color: C.ink },
  whatsapp: { height: 52, borderRadius: 26, backgroundColor: C.whatsapp, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  waIcon: { width: 22, height: 22, borderRadius: 11, borderWidth: 2.5, borderColor: C.whatsappInk, alignItems: 'center', justifyContent: 'center' },
  waDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: C.whatsappInk },
  whatsappText: { fontFamily: F.sansSemibold, fontSize: 16, lineHeight: 19, color: C.whatsappInk },
  outline: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.lilac, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontFamily: F.sansSemibold, fontSize: 15, lineHeight: 18, color: C.cream },

  log: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.mustard },
  phases: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 24, paddingHorizontal: 22 },
  moon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.ink, overflow: 'hidden', flexDirection: 'row' },
  logBody: { padding: 22, gap: 16 },
  logText: { gap: 6 },
  logTitle: { fontFamily: F.serif, fontSize: 34, lineHeight: 36, letterSpacing: -1, color: C.ink },
  logNote: { fontFamily: F.sans, fontSize: 15, lineHeight: 21, color: C.ink },
  logButton: { alignSelf: 'flex-start', height: 50, paddingHorizontal: 22, borderRadius: 25, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', gap: 10 },
  logPlus: { fontFamily: F.sansSemibold, fontSize: 20, lineHeight: 22, color: C.cream },
  logButtonText: { fontFamily: F.sansSemibold, fontSize: 15, lineHeight: 18, color: C.cream },
});
