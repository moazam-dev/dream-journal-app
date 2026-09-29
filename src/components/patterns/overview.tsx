import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

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
        <Text style={styles.heroText}>What your dreams repeat</Text>
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
  /** True while the reading is still looking through the dream text for people. */
  searching: boolean;
  reduceMotion: boolean;
};

/** "Your dream cast": who keeps showing up, and in how many dreams. */
export function CastCard({ cast, searching, reduceMotion }: CastCardProps) {
  const pairs = [cast.slice(0, 2), cast.slice(2, 4)].filter((pair) => pair.length > 0);
  return (
    <Animated.View style={[styles.cast, up(reduceMotion, 160)]}>
      <Text style={styles.castTitle} accessibilityRole="header">
        Your dream cast
      </Text>
      {cast.length === 0 ? (
        <Text style={styles.castEmpty}>{searching ? 'Finding faces…' : 'No one yet'}</Text>
      ) : (
        <View style={styles.castGrid}>
          {pairs.map((pair, row) => (
            <View key={row} style={styles.row}>
              {pair.map((member, col) => (
                <View key={member.name} style={styles.person} accessibilityLabel={`${member.name}, ${castLine(member)}`}>
                  <CastArt index={row * 2 + col} />
                  <View style={styles.personText}>
                    <Text style={styles.personName} numberOfLines={1}>
                      {member.name}
                    </Text>
                    <Text style={styles.personLine}>×{member.count}</Text>
                  </View>
                </View>
              ))}
              {pair.length === 1 && <View style={styles.personSpacer} />}
            </View>
          ))}
        </View>
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
  headline: string;
  stats: { value: string; label: string }[];
  onWhatsApp: () => void;
  onShare: () => void;
  onCopy: () => void;
  reduceMotion: boolean;
};

const STRIPES = [C.sky, C.mustard, C.rust];

/** "Monthly report": a shareable card for the month in dreams. */
export function ReportCard({ month, headline, stats, onWhatsApp, onShare, onCopy, reduceMotion }: ReportCardProps) {
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
          <Text style={styles.paperHeadline}>
            {title.plain}
            <Text style={styles.italic}>{title.italic}</Text>
          </Text>
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
        </View>
      </View>
      <Pressable accessibilityRole="button" onPress={onWhatsApp} style={({ pressed }) => [styles.whatsapp, pressed && styles.pressed]}>
        <WhatsAppIcon />
        <Text style={styles.whatsappText}>WhatsApp</Text>
      </Pressable>
      <View style={styles.row}>
        <Pressable accessibilityRole="button" onPress={onShare} style={({ pressed }) => [styles.outline, pressed && styles.pressed]}>
          <Text style={styles.outlineText}>More</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={onCopy} style={({ pressed }) => [styles.outline, pressed && styles.pressed]}>
          <Text style={styles.outlineText}>Copy</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/** WhatsApp's speech-bubble phone mark. */
function WhatsAppIcon() {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24">
      <Path
        fill={C.whatsappInk}
        d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91C21.95 6.45 17.5 2 12.04 2zm0 18.15c-1.48 0-2.93-.4-4.2-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.24-8.24 4.54 0 8.24 3.7 8.24 8.24 0 4.54-3.7 8.24-8.23 8.24zm4.52-6.16c-.25-.12-1.47-.72-1.7-.81-.23-.08-.39-.12-.56.12-.17.25-.64.81-.78.97-.14.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.02-.38.11-.51.11-.11.25-.29.37-.43.12-.14.17-.25.25-.41.08-.17.04-.31-.02-.43-.06-.12-.56-1.34-.76-1.84-.2-.48-.41-.42-.56-.43h-.48c-.17 0-.43.06-.66.31-.23.25-.86.85-.86 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.14-1.18-.06-.11-.22-.17-.47-.29z"
      />
    </Svg>
  );
}

const PHASES: [number, 'flex-end' | 'flex-start'][] = [
  [0, 'flex-end'],
  [35, 'flex-end'],
  [100, 'flex-end'],
  [35, 'flex-start'],
  [0, 'flex-start'],
];

type LogCardProps = { onYap: () => void; onType: () => void; reduceMotion: boolean };

/** "Had another dream?": moon phases, then yap it or type it. */
export function LogCard({ onYap, onType, reduceMotion }: LogCardProps) {
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
        <Text style={styles.logTitle} accessibilityRole="header">
          Had another dream?
        </Text>
        <View style={styles.row}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Yap: say your dream out loud"
            onPress={onYap}
            style={({ pressed }) => [styles.logButton, pressed && styles.pressed]}>
            <WaveIcon />
            <Text style={styles.logButtonText}>Yap</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Type your dream"
            onPress={onType}
            style={({ pressed }) => [styles.logButton, styles.logButtonOutline, pressed && styles.pressed]}>
            <PenIcon />
            <Text style={[styles.logButtonText, styles.inkText]}>Type</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

/** Sound wave, for yapping. */
function WaveIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M2 12h3.2l2.3-4.5 3.2 11L14 3.5l2.9 13.5 1.9-5H22" stroke={C.cream} strokeWidth={2.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

/** Pencil, for typing. */
function PenIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24">
      <Path
        d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
        fill={C.ink}
      />
    </Svg>
  );
}

const styles = StyleSheet.create({
  italic: { fontFamily: F.serifItalic },
  inkText: { color: C.ink },
  pressed: { opacity: 0.8 },
  row: { flexDirection: 'row', gap: 12 },

  hero: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.rust },
  heroSky: { height: 180, alignItems: 'center', justifyContent: 'flex-end', backgroundColor: C.mustard },
  arch: { borderTopLeftRadius: 999, borderTopRightRadius: 999, alignItems: 'center', justifyContent: 'flex-end' },
  heroBody: { paddingTop: 26, paddingHorizontal: 24, paddingBottom: 30, gap: 8 },
  heroTitle: { fontFamily: F.serif, fontSize: 32, lineHeight: 34, letterSpacing: -0.8, color: C.cream },
  heroText: { fontFamily: F.sans, fontSize: 14, lineHeight: 18, color: C.cream, opacity: 0.85 },

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

  cast: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.forest, paddingTop: 26 },
  castTitle: { paddingHorizontal: 24, fontFamily: F.serif, fontSize: 24, lineHeight: 26, letterSpacing: -0.6, color: C.cream },
  castEmpty: { fontFamily: F.sans, fontSize: 13, lineHeight: 16, color: C.mint, paddingHorizontal: 24, paddingTop: 14, paddingBottom: 30 },
  castGrid: { gap: 12, paddingTop: 20, paddingHorizontal: 16, paddingBottom: 18 },
  person: { flex: 1, borderRadius: 20, paddingVertical: 20, paddingHorizontal: 16, gap: 14, borderWidth: 1.5, borderColor: 'rgba(243,238,228,0.2)' },
  personSpacer: { flex: 1 },
  personText: { gap: 2 },
  personName: { fontFamily: F.serif, fontSize: 18, lineHeight: 21, color: C.cream },
  personLine: { fontFamily: F.sansMedium, fontSize: 12, lineHeight: 15, color: C.mint },
  art: { width: 56, height: 56, borderRadius: 28, overflow: 'hidden' },
  artRow: { flexDirection: 'row' },
  artCenter: { alignItems: 'center', justifyContent: 'center' },
  ring: { borderRadius: 999, alignItems: 'center', justifyContent: 'center' },

  report: { borderRadius: 28, overflow: 'hidden', backgroundColor: C.plum, padding: 16, gap: 14 },
  reportHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8, paddingHorizontal: 8 },
  reportTitle: { fontFamily: F.serif, fontSize: 24, lineHeight: 26, letterSpacing: -0.6, color: C.cream },
  reportMonth: { fontFamily: F.sansMedium, fontSize: 12, lineHeight: 15, color: C.lilac },
  paper: { borderRadius: 20, backgroundColor: C.cream, overflow: 'hidden' },
  stripes: { height: 88, flexDirection: 'row', overflow: 'hidden' },
  stripeGroup: { flexDirection: 'row' },
  paperBody: { paddingTop: 22, paddingHorizontal: 20, paddingBottom: 12, gap: 16 },
  paperHeadline: { fontFamily: F.serif, fontSize: 24, lineHeight: 27, letterSpacing: -0.6, color: C.ink },
  paperStats: { flexDirection: 'row', borderTopWidth: 1.5, borderColor: C.paperLine },
  paperStat: { flex: 1, minWidth: 0, paddingVertical: 14, gap: 4 },
  paperStatLine: { borderLeftWidth: 1.5, borderColor: C.paperLine, paddingLeft: 12 },
  paperValue: { fontFamily: F.serif, fontSize: 22, lineHeight: 24, color: C.ink },
  paperLabel: { fontFamily: F.sans, fontSize: 11, lineHeight: 14, color: C.paperMuted },
  whatsapp: { height: 54, borderRadius: 27, backgroundColor: C.whatsapp, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  whatsappText: { fontFamily: F.sansSemibold, fontSize: 15, lineHeight: 18, color: C.whatsappInk },
  outline: { flex: 1, height: 48, borderRadius: 24, borderWidth: 1.5, borderColor: C.lilac, alignItems: 'center', justifyContent: 'center' },
  outlineText: { fontFamily: F.sansSemibold, fontSize: 14, lineHeight: 17, color: C.cream },

  log: { minHeight: 300, borderRadius: 28, overflow: 'hidden', backgroundColor: C.mustard, justifyContent: 'space-between' },
  phases: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 32, paddingHorizontal: 24 },
  moon: { width: 44, height: 44, borderRadius: 22, backgroundColor: C.ink, overflow: 'hidden', flexDirection: 'row' },
  logBody: { paddingTop: 36, paddingHorizontal: 20, paddingBottom: 22, gap: 22 },
  logTitle: { paddingHorizontal: 4, fontFamily: F.serif, fontSize: 28, lineHeight: 30, letterSpacing: -0.8, color: C.ink },
  logButton: { flex: 1, height: 56, borderRadius: 28, backgroundColor: C.ink, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  logButtonOutline: { backgroundColor: 'transparent', borderWidth: 1.5, borderColor: C.ink },
  logButtonText: { fontFamily: F.sansSemibold, fontSize: 15, lineHeight: 18, color: C.cream },
});
