import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DreamFan, FAN_HEIGHT } from '@/components/entries/dream-fan';
import { EntryDetail } from '@/components/entries/entry-detail';
import { TWINKLE, up } from '@/components/entries/motion';
import { NightCalendar } from '@/components/entries/night-calendar';
import { NOTE_WIDTH, NoteCard } from '@/components/entries/note-card';
import { animate, FADE, TOAST } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { analyzeDream, generateDreamImage } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';
import { dreamsByDay, entryDate, isSeen, MAX_FAN, MAX_NOTES, monthStats, nightStreak, notesLabel, streakLabel } from '@/utils/entries';
import { dreamMood } from '@/utils/visualize';

const NIGHT_SKY = '#050508';
const TOAST_MS = 2200;
const NOTE_GAP = 10;

/**
 * Entries ("/entries"), from the Afterdream Entries design: every dream told, under a
 * starry sky. Painted dreams are fanned out like cards; written ones wait in a row of
 * notes; the month's calendar shows which nights had a dream. Picking one opens it
 * below, where a written dream can be painted.
 */
export default function EntriesScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const reduceMotion = useReducedMotion();
  const { dreams: loaded, loading, error, reload } = useDreams();

  const [now] = useState(() => new Date());
  // Dreams painted on this screen, until the next reload brings them from the server.
  const [changed, setChanged] = useState<Record<string, Dream>>({});
  const [fanId, setFanId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [paintingId, setPaintingId] = useState<string | null>(null);
  const [justPaintedId, setJustPaintedId] = useState<string | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scroll = useRef<ScrollView>(null);
  const detailY = useRef(0);

  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const dreams = useMemo(() => loaded.map((dream) => changed[dream.id] ?? dream), [loaded, changed]);
  const fan = useMemo(() => dreams.filter(isSeen).slice(0, MAX_FAN), [dreams]);
  const notes = useMemo(() => dreams.filter((dream) => !isSeen(dream)).slice(0, MAX_NOTES), [dreams]);
  const byDay = useMemo(() => dreamsByDay(dreams, now.getFullYear(), now.getMonth()), [dreams, now]);
  const streak = streakLabel(nightStreak(dreams, now));

  const fanIndex = Math.max(0, fan.findIndex((dream) => dream.id === fanId));
  const fanDream = fan[fanIndex];
  // Until something is picked, open the newest written dream (or else the newest painted one).
  const selected = dreams.find((dream) => dream.id === selectedId) ?? notes[0] ?? fan[0] ?? null;

  const tabBarBottom = Math.max(insets.bottom, 8);

  function showToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  function pick(dream: Dream, { scrollTo = false } = {}) {
    setSelectedId(dream.id);
    if (isSeen(dream)) setFanId(dream.id);
    if (scrollTo) setTimeout(() => scroll.current?.scrollTo({ y: Math.max(0, detailY.current - 120), animated: true }), 60);
  }

  function save(dream: Dream) {
    setChanged((current) => ({ ...current, [dream.id]: dream }));
  }

  /** Reads the dream first if that never finished (the picture is painted from the reading). */
  async function paint(dream: Dream) {
    if (paintingId) return;
    setPaintingId(dream.id);
    try {
      let current = dream;
      if (current.analysis_status !== 'completed') {
        current = await analyzeDream(current.id);
        save(current);
      }
      current = await generateDreamImage(current.id);
      save(current);
      if (isSeen(current)) {
        setJustPaintedId(current.id);
        setFanId(current.id);
        showToast('painted ✦ added to your fan');
      } else {
        showToast('couldn’t paint it — try again');
      }
    } catch (err) {
      console.warn('Could not paint the dream', getErrorMessage(err));
      showToast('couldn’t paint it — try again');
    } finally {
      setPaintingId(null);
    }
  }

  function pickTab(tab: Tab) {
    if (!openTab(tab, 'entries')) showToast(`${tab} is coming soon ✦`);
  }

  function openInVisualize(dream: Dream) {
    router.push({ pathname: '/visualize', params: { id: dream.id } });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Stars width={width} reduceMotion={reduceMotion} />

      {loading && loaded.length === 0 ? (
        <View style={styles.status}>
          <Animated.Text style={[styles.statusText, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
            gathering your nights…
          </Animated.Text>
        </View>
      ) : error && loaded.length === 0 ? (
        <View style={styles.status}>
          <Text style={styles.statusTitle}>couldn’t reach your dreams.</Text>
          <Text style={styles.statusText}>{error}</Text>
          <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
            <Text style={styles.statusButtonText}>try again</Text>
          </Pressable>
        </View>
      ) : dreams.length === 0 ? (
        <View style={styles.status}>
          <Text style={styles.statusTitle}>no entries yet.</Text>
          <Text style={styles.statusText}>tell afterdream a dream tonight, and your nights will start filling in here.</Text>
          <Pressable accessibilityRole="button" onPress={() => openTab('today', 'entries')} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
            <Text style={styles.statusButtonText}>back to today</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView
          ref={scroll}
          style={[styles.scroll, { marginTop: insets.top, marginBottom: TAB_BAR_HEIGHT + tabBarBottom }]}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}>
          <Animated.View style={[styles.header, up(reduceMotion)]}>
            <View style={styles.headerText}>
              <Text style={styles.title} accessibilityRole="header">
                entries
              </Text>
              <Text style={styles.stats}>{monthStats(dreams, now)}</Text>
            </View>
            {streak && <Text style={styles.streak}>{streak}</Text>}
          </Animated.View>

          {fan.length > 0 ? (
            <>
              <DreamFan
                dreams={fan}
                current={fanIndex}
                width={width}
                reduceMotion={reduceMotion}
                onChange={(index) => setFanId(fan[index]?.id ?? null)}
                onPick={(dream) => pick(dream, { scrollTo: true })}
              />
              <View style={styles.caption}>
                {fanDream && (
                  <Animated.View key={fanDream.id} style={[styles.captionInner, up(reduceMotion, 0, 400)]}>
                    <Text style={styles.captionTitle}>{fanDream.title ?? 'a dream'}</Text>
                    <Text style={styles.captionMeta}>
                      {[dreamMood(fanDream), entryDate(fanDream), 'drag the fan'].filter(Boolean).join(' · ')}
                    </Text>
                  </Animated.View>
                )}
              </View>
            </>
          ) : (
            <Animated.View style={[styles.emptyFan, up(reduceMotion, 150)]}>
              <Text style={styles.emptyFanTitle}>nothing painted yet.</Text>
              <Text style={styles.emptyFanText}>pick a note below and visualize it — it’ll join your fan ✦</Text>
            </Animated.View>
          )}

          <Animated.View style={[styles.section, up(reduceMotion, 250)]}>
            <View style={styles.sectionHead}>
              <Text style={styles.sectionTitle}>written, not yet seen</Text>
              {notes.length > 0 && <Text style={styles.sectionCount}>{notesLabel(notes.length)}</Text>}
            </View>
            {notes.length > 0 ? (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                snapToInterval={NOTE_WIDTH + NOTE_GAP}
                decelerationRate="fast"
                contentContainerStyle={styles.notes}>
                {notes.map((dream) => (
                  <NoteCard
                    key={dream.id}
                    dream={dream}
                    selected={dream.id === selected?.id}
                    reduceMotion={reduceMotion}
                    onPress={() => pick(dream, { scrollTo: true })}
                  />
                ))}
              </ScrollView>
            ) : (
              <Text style={styles.allSeen}>every dream has been seen ✦</Text>
            )}
          </Animated.View>

          <NightCalendar
            month={now}
            today={now}
            byDay={byDay}
            selectedId={selected?.id ?? null}
            paintingId={paintingId}
            justPaintedId={justPaintedId}
            reduceMotion={reduceMotion}
            onPick={(dream) => pick(dream)}
          />

          {selected && (
            <EntryDetail
              key={`${selected.id}-${isSeen(selected) ? 'seen' : 'written'}`}
              dream={selected}
              painting={paintingId === selected.id}
              reduceMotion={reduceMotion}
              onLayout={(event) => {
                detailY.current = event.nativeEvent.layout.y;
              }}
              onOpen={openInVisualize}
              onVisualize={paint}
            />
          )}
        </ScrollView>
      )}

      <View style={styles.tabBar}>
        <TabBar current="entries" bottomInset={tabBarBottom} onPick={pickTab} background={NIGHT_SKY} />
      </View>

      {toast && (
        <View pointerEvents="none" style={[styles.toastRow, { bottom: TAB_BAR_HEIGHT + tabBarBottom + 20 }]}>
          <Animated.Text
            key={toast.id}
            accessibilityLiveRegion="polite"
            style={[styles.toast, animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' })]}>
            {toast.text}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

/** Faint stars twinkling behind everything. */
function Stars({ width, reduceMotion }: { width: number; reduceMotion: boolean }) {
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: 26 }, (_, i) => (
        <Animated.View
          key={i}
          style={[
            styles.star,
            { left: (i * 97 + 11) % Math.max(1, width), top: 60 + ((i * 131) % 380) },
            reduceMotion
              ? { opacity: 0.4 }
              : animate(false, {
                  animationName: TWINKLE,
                  animationDuration: (2.5 + (i % 5)) * 1000,
                  animationDelay: ((i * 0.37) % 4) * 1000,
                  animationTimingFunction: 'ease-in-out',
                  animationIterationCount: 'infinite',
                }),
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NIGHT_SKY,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingTop: 8,
    paddingBottom: 30,
  },
  star: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 22,
  },
  headerText: {
    flexShrink: 1,
    gap: 6,
  },
  title: {
    fontFamily: BrandFonts.medium,
    fontSize: 36,
    lineHeight: 38,
    letterSpacing: -1.4,
    color: '#fff',
  },
  stats: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.7)',
  },
  streak: {
    fontFamily: BrandFonts.semibold,
    fontSize: 13,
    lineHeight: 16,
    color: BrandColors.lime,
  },
  caption: {
    minHeight: 74,
    paddingHorizontal: 30,
    alignItems: 'center',
  },
  captionInner: {
    alignItems: 'center',
    gap: 8,
  },
  captionTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 24,
    letterSpacing: -0.6,
    color: '#fff',
    textAlign: 'center',
  },
  captionMeta: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.75)',
    textAlign: 'center',
  },
  emptyFan: {
    height: FAN_HEIGHT / 2,
    marginTop: 28,
    marginHorizontal: 16,
    borderRadius: 28,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 30,
  },
  emptyFanTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 20,
    lineHeight: 24,
    color: '#fff',
  },
  emptyFanText: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 19,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  section: {
    marginTop: 22,
    gap: 12,
  },
  sectionHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 22,
  },
  sectionTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 21,
    letterSpacing: -0.4,
    color: '#fff',
  },
  sectionCount: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  notes: {
    gap: NOTE_GAP,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
  },
  allSeen: {
    paddingHorizontal: 22,
    paddingVertical: 20,
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.7)',
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
  toastRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 6,
    alignItems: 'center',
  },
  toast: {
    overflow: 'hidden',
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 22,
    backgroundColor: '#fff',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
});
