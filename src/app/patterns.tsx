import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Linking, Pressable, ScrollView, Share, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MoodCard, QuestionCard, SymbolsCard, ThemesCard, ThreadCard, VividCard } from '@/components/patterns/deep';
import { DOT, forever, up } from '@/components/patterns/motion';
import { CastCard, HeroCard, LogCard, ReportCard, StatsGrid, type Kpi } from '@/components/patterns/overview';
import { GearIcon } from '@/components/settings/icons';
import { animate, FADE, TOAST } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { PatternColors as C, PatternFonts as F } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { usePatternReading } from '@/hooks/use-pattern-reading';
import { loadProfileName } from '@/lib/profile';
import { nightStreak, weekDays } from '@/utils/entries';
import {
  bestStreak,
  localCast,
  MAX_READ_DREAMS,
  MIN_READING_DREAMS,
  monthDreams,
  monthHeadline,
  monthLabel,
  monthReport,
  moodHeadline,
  moodMix,
  patternsDate,
  pickCast,
  pickSymbols,
  readingLines,
  recentDreams,
  reportShareText,
  reportStats,
  topThemes,
  vividNights,
  vividNote,
  weekCount,
} from '@/utils/patterns';

type PatternsView = 'overview' | 'deep';

const TOAST_MS = 1800;

/**
 * Patterns ("/patterns"), from the Afterdream Patterns v3 design. The overview has the
 * streaks, the dream cast and a shareable monthly report. "Dive deeper" has the thread
 * Groq reads through the dreams, recurring themes, the mood mix, symbols and what they
 * might mean, the most vivid nights and a question to sit with.
 */
export default function PatternsScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { dreams, loading, error, reload } = useDreams();
  const [now] = useState(() => new Date());
  const [name] = useState(loadProfileName);
  const [view, setView] = useState<PatternsView>('overview');
  const [castPick, setCastPick] = useState(0);
  const [symbolPick, setSymbolPick] = useState(0);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useRef<ScrollView>(null);

  const tooFew = dreams.length < MIN_READING_DREAMS;
  const readingKey = loading || tooFew ? null : `${dreams.length}:${dreams[0]?.id ?? ''}`;
  const reading = usePatternReading(readingKey);
  const { status: readingStatus, start: startReading, markSeen } = reading;
  const ready = readingStatus === 'ready' ? reading.reading : null;
  const deep = view === 'deep';

  // The reading fills in the cast and the report title, so it starts as soon as there are dreams.
  useEffect(() => {
    if (readingStatus === 'idle') startReading();
  }, [readingStatus, startReading]);

  useEffect(() => {
    if (deep) markSeen();
  }, [deep, markSeen]);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  // "Lately" means the last 30 nights, unless nothing was told in them.
  const recent = useMemo(() => recentDreams(dreams, now), [dreams, now]);
  const lately = recent.length > 0 ? recent : dreams;
  const month = useMemo(() => monthDreams(dreams, now), [dreams, now]);
  const report = useMemo(() => monthReport(month), [month]);
  const cast = useMemo(() => pickCast(ready, localCast(lately)), [ready, lately]);
  const themes = useMemo(() => topThemes(lately), [lately]);
  const moods = useMemo(() => moodMix(lately), [lately]);
  const moodTitle = useMemo(() => moodHeadline(lately, moods), [lately, moods]);
  const symbols = useMemo(() => pickSymbols(ready, lately, themes.map((theme) => theme.name)), [ready, lately, themes]);
  const vivid = useMemo(() => vividNights(lately), [lately]);
  const vividLine = useMemo(() => vividNote(lately), [lately]);

  const streak = nightStreak(dreams, now);
  const kpis: Kpi[] = [
    { label: 'Current streak', value: String(streak), unit: streak === 1 ? 'night' : 'nights', color: C.rust },
    { label: 'This week', value: String(weekCount(dreams, now)), unit: weekCount(dreams, now) === 1 ? 'entry' : 'entries', color: C.sky },
    { label: 'Record streak', value: String(bestStreak(dreams)), unit: bestStreak(dreams) === 1 ? 'night' : 'nights', color: C.mustard },
  ];
  const monthName = monthLabel(now);
  const headline = monthHeadline(report, ready);
  const shareText = reportShareText(monthName, report, headline);
  // The reading counts people from the dream text, so its cast wins over the saved names.
  const visitor = (ready ? cast[0]?.name.toLowerCase() : null) ?? report.topPerson ?? cast[0]?.name.toLowerCase() ?? null;
  const footer = [
    ...(visitor ? [{ text: 'Most visited by ' }, { text: visitor, bold: true }] : []),
    ...(visitor && report.calmestDay ? [{ text: ' · ' }] : []),
    ...(report.calmestDay ? [{ text: visitor ? 'calmest night was a ' : 'Calmest night was a ' }, { text: report.calmestDay, bold: true }] : []),
  ];

  const tabBarBottom = Math.max(insets.bottom, 8);

  function go(next: PatternsView) {
    setView(next);
    scroll.current?.scrollTo({ y: 0, animated: false });
  }

  function flash(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  async function shareWhatsApp() {
    try {
      await Linking.openURL(`https://wa.me/?text=${encodeURIComponent(shareText)}`);
    } catch {
      flash('WhatsApp isn’t available here');
    }
  }

  async function shareMore() {
    try {
      await Share.share({ title: 'My dream report', message: shareText });
    } catch {
      flash('Sharing isn’t available here');
    }
  }

  async function copyReport() {
    try {
      await Clipboard.setStringAsync(shareText);
      flash('Report copied');
    } catch {
      flash('Couldn’t copy the report');
    }
  }

  function pickTab(tab: Tab) {
    openTab(tab, 'patterns');
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {loading && dreams.length === 0 ? (
        <View style={styles.status}>
          <Animated.Text style={[styles.statusText, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
            Looking for patterns…
          </Animated.Text>
        </View>
      ) : error && dreams.length === 0 ? (
        <View style={styles.status}>
          <Text style={styles.statusTitle}>Couldn’t reach your dreams</Text>
          <Text style={styles.statusText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
            <Text style={styles.statusButtonText}>Try again</Text>
          </Pressable>
        </View>
      ) : dreams.length === 0 ? (
        <View style={styles.status}>
          <Text style={styles.statusTitle}>
            No patterns <Text style={styles.italic}>yet</Text>
          </Text>
          <Text style={styles.statusText}>Tell Afterdream a few dreams, and the themes, moods and people that keep coming back will show here.</Text>
          <Pressable accessibilityRole="button" onPress={() => openTab('today', 'patterns')} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
            <Text style={styles.statusButtonText}>Log a dream</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scroll}
          style={[styles.scroll, { marginTop: insets.top, marginBottom: TAB_BAR_HEIGHT + tabBarBottom }]}
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, up(reduceMotion, 0)]}>
            <View style={styles.headerText}>
              <Text style={styles.date}>{patternsDate(now)}</Text>
              <Text style={styles.title} accessibilityRole="header">
                Patterns
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="settings"
              onPress={() => router.push('/settings')}
              hitSlop={6}
              style={({ pressed }) => [styles.badge, pressed && styles.pressed]}>
              <GearIcon color={C.cream} />
            </Pressable>
          </Animated.View>

          <View style={styles.switchRow}>
            <View style={styles.switch} accessibilityRole="tablist">
              <SwitchTab label="Overview" selected={!deep} onPress={() => go('overview')} />
              <SwitchTab label="Dive deeper" selected={deep} fresh={reading.fresh && !deep} reduceMotion={reduceMotion} onPress={() => go('deep')} />
            </View>
          </View>

          {deep ? (
            <View key="deep" style={styles.cards}>
              <ThreadCard
                status={reading.status}
                reading={ready}
                error={reading.error}
                dreamCount={dreams.length}
                readingLine={readingLines(Math.min(dreams.length, MAX_READ_DREAMS))[0]}
                onRetry={startReading}
                reduceMotion={reduceMotion}
              />
              {themes.length > 0 && <ThemesCard themes={themes} reduceMotion={reduceMotion} />}
              {moodTitle && <MoodCard headline={moodTitle} moods={moods} reduceMotion={reduceMotion} />}
              {symbols.length > 0 && (
                <SymbolsCard symbols={symbols} selected={symbolPick} onSelect={setSymbolPick} status={reading.status} reduceMotion={reduceMotion} />
              )}
              <VividCard nights={vivid} note={vividLine} reduceMotion={reduceMotion} />
              {ready && <QuestionCard question={ready.question} reduceMotion={reduceMotion} />}
            </View>
          ) : (
            <View key="overview" style={styles.cards}>
              <HeroCard reduceMotion={reduceMotion} />
              <StatsGrid kpis={kpis} week={weekDays(dreams, now)} reduceMotion={reduceMotion} />
              <CastCard
                cast={cast}
                selected={castPick}
                onSelect={setCastPick}
                searching={!tooFew && (readingStatus === 'reading' || readingStatus === 'idle')}
                reduceMotion={reduceMotion}
              />
              <ReportCard
                month={monthName}
                owner={name ? `${name}’s month in dreams` : 'Your month in dreams'}
                headline={headline}
                stats={reportStats(report)}
                footer={footer}
                onWhatsApp={shareWhatsApp}
                onShare={shareMore}
                onCopy={copyReport}
                reduceMotion={reduceMotion}
              />
              <LogCard onLog={() => openTab('today', 'patterns')} reduceMotion={reduceMotion} />
            </View>
          )}
        </ScrollView>
      )}

      {toast && (
        <Animated.View
          key={toast.id}
          pointerEvents="none"
          style={[
            styles.toast,
            { bottom: TAB_BAR_HEIGHT + tabBarBottom + 16 },
            animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' }),
          ]}
          accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{toast.text}</Text>
        </Animated.View>
      )}

      <View style={styles.tabBar}>
        <TabBar current="patterns" bottomInset={tabBarBottom} onPick={pickTab} background={C.background} />
      </View>
    </View>
  );
}

type SwitchTabProps = {
  label: string;
  selected: boolean;
  /** Shows the breathing rust dot: something new is waiting there. */
  fresh?: boolean;
  reduceMotion?: boolean;
  onPress: () => void;
};

function SwitchTab({ label, selected, fresh = false, reduceMotion = false, onPress }: SwitchTabProps) {
  return (
    <Pressable
      accessibilityRole="tab"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.switchTab, { borderBottomColor: selected ? C.cream : 'transparent' }]}>
      {fresh && <Animated.View style={[styles.freshDot, forever(reduceMotion, DOT, 1600)]} />}
      <Text style={[styles.switchText, { color: selected ? C.cream : C.muted }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: C.background },
  scroll: { flex: 1 },
  italic: { fontFamily: F.serifItalic },
  pressed: { opacity: 0.8 },
  header: { paddingTop: 10, paddingHorizontal: 22, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  headerText: { gap: 2 },
  date: { fontFamily: F.sansMedium, fontSize: 13, lineHeight: 16, letterSpacing: 1.2, textTransform: 'uppercase', color: C.muted },
  title: { fontFamily: F.serif, fontSize: 56, lineHeight: 60, letterSpacing: -1, color: C.cream },
  badge: { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5, borderColor: C.cream, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  switchRow: { paddingVertical: 14, paddingHorizontal: 16, backgroundColor: C.background },
  switch: { flexDirection: 'row', borderBottomWidth: 1.5, borderBottomColor: C.line },
  switchTab: { flex: 1, height: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderBottomWidth: 2, marginBottom: -1.5 },
  switchText: { fontFamily: F.sansMedium, fontSize: 16, lineHeight: 19 },
  freshDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: C.rust },
  cards: { gap: 12, paddingTop: 4, paddingHorizontal: 16, paddingBottom: 28 },
  status: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 32, paddingBottom: TAB_BAR_HEIGHT + 40 },
  statusTitle: { fontFamily: F.serif, fontSize: 34, lineHeight: 38, color: C.cream, textAlign: 'center' },
  statusText: { fontFamily: F.sans, fontSize: 15, lineHeight: 21, color: C.muted, textAlign: 'center' },
  statusButton: { marginTop: 8, height: 50, paddingHorizontal: 22, borderRadius: 25, backgroundColor: C.cream, justifyContent: 'center' },
  statusButtonText: { fontFamily: F.sansSemibold, fontSize: 15, lineHeight: 18, color: C.ink },
  toast: { position: 'absolute', alignSelf: 'center', height: 40, paddingHorizontal: 18, borderRadius: 20, backgroundColor: C.cream, justifyContent: 'center' },
  toastText: { fontFamily: F.sansSemibold, fontSize: 14, lineHeight: 17, color: C.ink },
  tabBar: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopWidth: 1.5, borderTopColor: C.line, backgroundColor: C.background },
});
