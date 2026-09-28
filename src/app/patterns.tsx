import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DeepReading, type ChatTurn } from '@/components/patterns/deep-reading';
import { MonthHero } from '@/components/patterns/month-hero';
import { DOT, forever, SLIDE, up } from '@/components/patterns/motion';
import { CastCard, MoodCard, RhythmCard, ThemesCard } from '@/components/patterns/overview-cards';
import { animate, FADE } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useCountUp } from '@/hooks/use-count-up';
import { useDreams } from '@/hooks/use-dreams';
import { usePatternReading } from '@/hooks/use-pattern-reading';
import { askDreamPatterns } from '@/services/dreams';
import { isSeen, nightStreak } from '@/utils/entries';
import {
  bestLine,
  bestStreak,
  dreamPeople,
  dreamSymbols,
  MAX_READ_DREAMS,
  MIN_READING_DREAMS,
  moodHeadline,
  moodNights,
  patternsDate,
  recentDreams,
  topThemes,
  weekLabel,
  weekNights,
} from '@/utils/patterns';

/** Backdrops from the design, used until enough dreams have been painted. */
const PHOTOS = [1022, 1036, 1015, 1016, 1018].map((id) => `https://picsum.photos/id/${id}/600/900`);

type PatternsView = 'overview' | 'deep';

/**
 * Patterns ("/patterns"), from the Afterdream Patterns design. The overview counts the
 * month's dreams, the streak, the themes, moods and people that keep coming back. "Dive
 * deeper" has Groq read the dreams side by side and answer questions about them.
 */
export default function PatternsScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { dreams, loading, error, reload } = useDreams();
  const [now] = useState(() => new Date());
  const [view, setView] = useState<PatternsView>('overview');
  const [openTheme, setOpenTheme] = useState(0);
  const [chat, setChat] = useState<ChatTurn[]>([]);
  const [switchWidth, setSwitchWidth] = useState(0);
  const scroll = useRef<ScrollView>(null);

  const recent = useMemo(() => recentDreams(dreams, now), [dreams, now]);
  // "Lately" means this month, unless nothing was told this month.
  const lately = recent.length > 0 ? recent : dreams;
  const themes = useMemo(() => topThemes(lately), [lately]);
  const week = useMemo(() => weekNights(dreams, now), [dreams, now]);
  const moods = useMemo(() => moodNights(dreams, now), [dreams, now]);
  const headline = moodHeadline(moods.nights, moods.legend);
  const people = useMemo(() => dreamPeople(lately), [lately]);
  const symbols = useMemo(() => dreamSymbols(lately, themes.map((t) => t.name)), [lately, themes]);
  const streak = nightStreak(dreams, now);
  const best = useMemo(() => bestStreak(dreams), [dreams]);
  // The dreamer's own paintings make the backdrops, newest first; the design's photos fill in.
  const photos = useMemo(() => {
    const painted = dreams.filter(isSeen).map((dream) => dream.image_url as string);
    return PHOTOS.map((photo, i) => painted[i] ?? photo);
  }, [dreams]);

  const tooFew = dreams.length < MIN_READING_DREAMS;
  const readingKey = loading || tooFew ? null : `${dreams.length}:${dreams[0]?.id ?? ''}`;
  const reading = usePatternReading(readingKey);
  const { status: readingStatus, start: startReading } = reading;

  // Opening "dive deeper" (or new dreams arriving while it is open) starts a reading.
  useEffect(() => {
    if (view === 'deep' && readingStatus === 'idle') startReading();
  }, [view, readingStatus, startReading]);

  const count = useCountUp(recent.length, 80, reduceMotion);
  const streakShown = useCountUp(streak, 160, reduceMotion);

  const tabBarBottom = Math.max(insets.bottom, 8);
  const deep = view === 'deep';
  const pillWidth = Math.max(0, (switchWidth - 8) / 2);

  function goDeep() {
    setView('deep');
    scroll.current?.scrollTo({ y: 0, animated: !reduceMotion });
  }

  async function ask(question: string) {
    setChat((current) => [...current.filter((turn) => !(turn.failed && turn.question === question)), { question, answer: null, failed: false }]);
    const settle = (answer: string | null) =>
      setChat((current) => current.map((turn) => (turn.question === question && turn.answer === null && !turn.failed ? { ...turn, answer, failed: answer === null } : turn)));
    try {
      settle(await askDreamPatterns(question));
    } catch (err) {
      console.warn('Could not answer the pattern question', err);
      settle(null);
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
            looking for patterns…
          </Animated.Text>
        </View>
      ) : error && dreams.length === 0 ? (
        <View style={styles.status}>
          <Text style={styles.statusTitle}>couldn’t reach your dreams.</Text>
          <Text style={styles.statusText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
            <Text style={styles.statusButtonText}>try again</Text>
          </Pressable>
        </View>
      ) : dreams.length === 0 ? (
        <View style={styles.status}>
          <Text style={styles.statusTitle}>no patterns yet.</Text>
          <Text style={styles.statusText}>tell afterdream a few dreams, and what keeps coming back will start to show here.</Text>
          <Pressable accessibilityRole="button" onPress={() => openTab('today', 'patterns')} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
            <Text style={styles.statusButtonText}>back to today</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scroll}
          style={[styles.scroll, { marginTop: insets.top, marginBottom: TAB_BAR_HEIGHT + tabBarBottom }]}
          contentContainerStyle={styles.content}
          stickyHeaderIndices={[1]}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, up(reduceMotion)]}>
            <Text style={styles.date}>{patternsDate(now)}</Text>
            <Text style={styles.title} accessibilityRole="header">
              patterns
            </Text>
          </Animated.View>

          <View style={styles.switchRow}>
            <View style={styles.switch} accessibilityRole="tablist" onLayout={(event) => setSwitchWidth(event.nativeEvent.layout.width)}>
              <Animated.View
                style={[
                  styles.switchPill,
                  { width: pillWidth, transform: [{ translateX: deep ? pillWidth : 0 }] },
                  !reduceMotion && { transitionProperty: 'transform', transitionDuration: 400, transitionTimingFunction: SLIDE },
                ]}
              />
              <SwitchButton label="overview" selected={!deep} reduceMotion={reduceMotion} onPress={() => setView('overview')} />
              <SwitchButton label="dive deeper" selected={deep} reduceMotion={reduceMotion} fresh={reading.fresh} onPress={goDeep} />
            </View>
          </View>

          {deep ? (
            <View style={styles.cards}>
              <DeepReading
                status={reading.status}
                reading={reading.reading}
                error={reading.error}
                dreamCount={Math.min(dreams.length, MAX_READ_DREAMS)}
                tooFew={tooFew}
                photos={[photos[0], photos[1], photos[3], photos[4]]}
                chat={chat}
                onAsk={ask}
                onRetry={startReading}
                reduceMotion={reduceMotion}
              />
            </View>
          ) : (
            <View style={styles.cards}>
              <MonthHero count={count} theme={themes[0]?.name ?? null} photo={photos[0]} reduceMotion={reduceMotion} onDeep={goDeep} />
              <RhythmCard
                streak={streakShown}
                best={best}
                bestLine={bestLine(streak, best)}
                week={week.nights}
                weekLabel={weekLabel(week.caught, week.elapsed)}
                photo={photos[1]}
                reduceMotion={reduceMotion}
              />
              {themes.length > 0 && (
                <ThemesCard themes={themes} open={openTheme} onToggle={setOpenTheme} photo={photos[2]} reduceMotion={reduceMotion} />
              )}
              {headline && (
                <MoodCard headline={headline} nights={moods.nights} legend={moods.legend} from={moods.from} photo={photos[3]} reduceMotion={reduceMotion} />
              )}
              {(people.length > 0 || symbols.length > 0) && (
                <CastCard people={people} symbols={symbols} photo={photos[4]} reduceMotion={reduceMotion} />
              )}
            </View>
          )}
        </ScrollView>
      )}

      <View style={styles.tabBar}>
        <TabBar current="patterns" bottomInset={tabBarBottom} onPick={pickTab} />
      </View>
    </View>
  );
}

type SwitchButtonProps = {
  label: string;
  selected: boolean;
  /** Shows the pulsing lime dot: something new is waiting there. */
  fresh?: boolean;
  reduceMotion: boolean;
  onPress: () => void;
};

function SwitchButton({ label, selected, fresh = false, reduceMotion, onPress }: SwitchButtonProps) {
  return (
    <Pressable accessibilityRole="tab" accessibilityState={{ selected }} onPress={onPress} style={styles.switchButton}>
      {fresh && !selected && <Animated.View style={[styles.freshDot, forever(reduceMotion, DOT, 1400, 'ease-in-out')]} />}
      <Animated.Text
        style={[
          styles.switchText,
          { color: selected ? '#111' : 'rgba(255,255,255,0.8)' },
          !reduceMotion && { transitionProperty: 'color', transitionDuration: 300, transitionTimingFunction: 'ease' },
        ]}>
        {label}
      </Animated.Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
  },
  header: {
    paddingHorizontal: 22,
    gap: 4,
  },
  date: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.7)',
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 52,
    lineHeight: 55,
    letterSpacing: -2.4,
    color: '#fff',
  },
  switchRow: {
    paddingVertical: 12,
    paddingHorizontal: 10,
    experimental_backgroundImage: 'linear-gradient(180deg, #000 70%, rgba(0,0,0,0))',
  },
  switch: {
    height: 50,
    borderRadius: 25,
    backgroundColor: '#1a1a1a',
    flexDirection: 'row',
    padding: 4,
  },
  switchPill: {
    position: 'absolute',
    top: 4,
    bottom: 4,
    left: 4,
    borderRadius: 21,
    backgroundColor: '#fff',
  },
  switchButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  switchText: {
    fontFamily: BrandFonts.medium,
    fontSize: 16,
    lineHeight: 19,
  },
  freshDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: BrandColors.lime,
  },
  cards: {
    gap: 10,
    paddingTop: 2,
    paddingHorizontal: 8,
    paddingBottom: 28,
  },
  status: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
    paddingBottom: TAB_BAR_HEIGHT + 40,
  },
  statusTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 27,
    color: '#fff',
    textAlign: 'center',
  },
  statusText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: 'rgba(255,255,255,0.65)',
    textAlign: 'center',
  },
  statusButton: {
    marginTop: 8,
    paddingVertical: 12,
    paddingHorizontal: 22,
    borderRadius: 24,
    backgroundColor: BrandColors.lime,
  },
  statusButtonText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#111',
  },
  pressed: {
    opacity: 0.8,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
