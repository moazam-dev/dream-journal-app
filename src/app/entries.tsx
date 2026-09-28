import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { EntryCalendar } from '@/components/entries/entry-calendar';
import { EntryRow } from '@/components/entries/entry-row';
import { EntrySheet } from '@/components/entries/entry-sheet';
import { BrandBar } from '@/components/today/brand-bar';
import { animate, FADE, TOAST } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { deleteDream, updateDreamColor } from '@/services/dreams';
import type { Dream } from '@/types/dream';
import { getErrorMessage } from '@/utils/errors';
import { calendarMonth, calendarWeek, monthName, monthStats, nightStreak, type DreamColor } from '@/utils/entries';

/** The toast's whole life (the design's 3.2s), which is also how long a delete can be undone. */
const TOAST_MS = 3200;
/** How long a dream jumped to from the calendar stays ringed. */
const FOCUS_MS = 1400;

type Toast = { id: number; text: string; undo?: () => void };

/**
 * Entries ("/entries"), from the Afterdream Entries (rows) design: this week's calendar
 * (or the whole month), then every dream as a coloured row, newest first. Tapping a row
 * opens the dream's page; holding one lets the dreamer recolour or delete it.
 */
export default function EntriesScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { dreams: loaded, loading, error, reload } = useDreams();

  const [now] = useState(() => new Date());
  // Colours picked on this screen, until the next reload brings them from the server.
  const [changed, setChanged] = useState<Record<string, Dream>>({});
  // Dreams deleted on this screen (still undoable, or gone for good).
  const [deleted, setDeleted] = useState<ReadonlySet<string>>(() => new Set());
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [sheetDream, setSheetDream] = useState<Dream | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [focusId, setFocusId] = useState<string | null>(null);
  const [toast, setToast] = useState<Toast | null>(null);

  const scroll = useRef<ScrollView>(null);
  const historyY = useRef(0);
  const rowY = useRef(new Map<string, number>());
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const focusTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The delete waiting out its undo time; it reaches the server when the toast goes.
  const pendingDelete = useRef<{ id: string; timer: ReturnType<typeof setTimeout> } | null>(null);

  const dreams = useMemo(
    () => loaded.filter((dream) => !deleted.has(dream.id)).map((dream) => changed[dream.id] ?? dream),
    [loaded, changed, deleted]
  );
  const month = useMemo(() => calendarMonth(dreams, now), [dreams, now]);
  const week = useMemo(() => calendarWeek(dreams, now), [dreams, now]);
  const streak = useMemo(() => nightStreak(dreams, now), [dreams, now]);
  // The sheet shows the latest version of its dream (a new colour shows straight away).
  const shownInSheet = sheetDream ? (dreams.find((dream) => dream.id === sheetDream.id) ?? sheetDream) : null;

  const tabBarBottom = Math.max(insets.bottom, 8);

  const showToast = useCallback((text: string, undo?: () => void) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text, undo }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }, []);

  const commitDelete = useCallback(
    (id: string) => {
      deleteDream(id).catch((err) => {
        console.warn('Could not delete the dream', getErrorMessage(err));
        setDeleted((current) => without(current, id));
        showToast('couldn’t delete it — try again');
      });
    },
    [showToast]
  );

  // Leaving the screen ends the undo time: send any waiting delete, and stop the timers.
  useEffect(
    () => () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (focusTimer.current) clearTimeout(focusTimer.current);
      const pending = pendingDelete.current;
      if (pending) {
        clearTimeout(pending.timer);
        deleteDream(pending.id).catch((err) => console.warn('Could not delete the dream', getErrorMessage(err)));
      }
    },
    []
  );

  const closeSheet = useCallback(() => setSheetOpen(false), []);

  function openSheet(dream: Dream) {
    setSheetDream(dream);
    setSheetOpen(true);
  }

  /** Scrolls to a dream picked in the calendar and rings it for a moment. */
  function jumpTo(dream: Dream) {
    setFocusId(dream.id);
    if (focusTimer.current) clearTimeout(focusTimer.current);
    focusTimer.current = setTimeout(() => setFocusId(null), FOCUS_MS);
    const y = rowY.current.get(dream.id);
    if (y !== undefined) scroll.current?.scrollTo({ y: Math.max(0, historyY.current + y - 20), animated: !reduceMotion });
  }

  async function recolor(dream: Dream, color: DreamColor) {
    const before = changed[dream.id];
    setChanged((current) => ({ ...current, [dream.id]: { ...dream, color } }));
    try {
      const saved = await updateDreamColor(dream.id, color);
      setChanged((current) => ({ ...current, [dream.id]: saved }));
    } catch (err) {
      console.warn('Could not save the colour', getErrorMessage(err));
      setChanged((current) => {
        const next = { ...current };
        if (before) next[dream.id] = before;
        else delete next[dream.id];
        return next;
      });
      showToast('couldn’t save the colour');
    }
  }

  function remove(dream: Dream) {
    setSheetOpen(false);
    // Only one delete waits at a time: an earlier one goes through now.
    const earlier = pendingDelete.current;
    if (earlier) {
      clearTimeout(earlier.timer);
      commitDelete(earlier.id);
    }
    setDeleted((current) => new Set(current).add(dream.id));
    const timer = setTimeout(() => {
      pendingDelete.current = null;
      commitDelete(dream.id);
    }, TOAST_MS);
    pendingDelete.current = { id: dream.id, timer };

    showToast('dream deleted', () => {
      if (pendingDelete.current?.id !== dream.id) return;
      clearTimeout(pendingDelete.current.timer);
      pendingDelete.current = null;
      setDeleted((current) => without(current, dream.id));
      if (toastTimer.current) clearTimeout(toastTimer.current);
      setToast(null);
    });
  }

  function pickTab(tab: Tab) {
    if (!openTab(tab, 'entries')) showToast(`${tab} is coming soon ✦`);
  }

  function openDream(dream: Dream) {
    router.push({ pathname: '/dream/[id]', params: { id: dream.id } });
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={{ marginTop: insets.top }}>
        <BrandBar streak={streak} />
      </View>

      <ScrollView
        ref={scroll}
        style={[styles.scroll, { marginBottom: TAB_BAR_HEIGHT + tabBarBottom }]}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title} accessibilityRole="header">
            entries
          </Text>
          <Text style={styles.stats}>{monthStats(dreams, now)}</Text>
        </View>

        <EntryCalendar
          monthLabel={monthName(now)}
          month={month}
          week={week}
          open={calendarOpen}
          reduceMotion={reduceMotion}
          onToggle={() => setCalendarOpen((open) => !open)}
          onPick={jumpTo}
        />

        <View
          style={styles.history}
          onLayout={(event) => {
            historyY.current = event.nativeEvent.layout.y;
          }}>
          <View style={styles.historyHead}>
            <Text style={styles.historyTitle}>history</Text>
            {dreams.length > 0 && <Text style={styles.historyHint}>hold a dream for options</Text>}
          </View>

          {loading && loaded.length === 0 ? (
            <Animated.Text style={[styles.note, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
              gathering your nights…
            </Animated.Text>
          ) : error && loaded.length === 0 ? (
            <View style={styles.problem}>
              <Text style={styles.note}>couldn’t reach your dreams. {error}</Text>
              <Pressable accessibilityRole="button" onPress={reload} style={({ pressed }) => [styles.retry, pressed && styles.pressed]}>
                <Text style={styles.retryText}>try again</Text>
              </Pressable>
            </View>
          ) : dreams.length === 0 ? (
            <Text style={styles.note}>no dreams yet — tell afterdream about tonight.</Text>
          ) : (
            dreams.map((dream) => (
              <EntryRow
                key={dream.id}
                dream={dream}
                ringed={dream.id === focusId || (sheetOpen && dream.id === sheetDream?.id)}
                reduceMotion={reduceMotion}
                onPress={openDream}
                onHold={openSheet}
                onLayout={(event) => {
                  rowY.current.set(dream.id, event.nativeEvent.layout.y);
                }}
              />
            ))
          )}
        </View>
      </ScrollView>

      <View style={styles.tabBar}>
        <TabBar current="entries" bottomInset={tabBarBottom} onPick={pickTab} />
      </View>

      <EntrySheet
        dream={shownInSheet}
        open={sheetOpen}
        bottomInset={insets.bottom}
        reduceMotion={reduceMotion}
        onClose={closeSheet}
        onColor={recolor}
        onDelete={remove}
      />

      {toast && (
        <View pointerEvents="box-none" style={[styles.toastRow, { bottom: TAB_BAR_HEIGHT + tabBarBottom + 20 }]}>
          <Animated.View
            key={toast.id}
            accessibilityLiveRegion="polite"
            style={[
              styles.toast,
              toast.undo && styles.toastWithUndo,
              animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' }),
            ]}>
            <Text style={styles.toastText}>{toast.text}</Text>
            {toast.undo && (
              <Pressable accessibilityRole="button" onPress={toast.undo} hitSlop={8} style={({ pressed }) => [styles.undo, pressed && styles.pressed]}>
                <Text style={styles.undoText}>undo</Text>
              </Pressable>
            )}
          </Animated.View>
        </View>
      )}
    </View>
  );
}

function without(set: ReadonlySet<string>, id: string): ReadonlySet<string> {
  const next = new Set(set);
  next.delete(id);
  return next;
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
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 22,
  },
  header: {
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
  history: {
    gap: 10,
  },
  historyHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
    paddingBottom: 4,
  },
  historyTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 18,
    lineHeight: 21,
    letterSpacing: -0.4,
    color: '#fff',
  },
  historyHint: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 15,
    color: 'rgba(255,255,255,0.55)',
  },
  note: {
    paddingVertical: 10,
    paddingHorizontal: 2,
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255,255,255,0.65)',
  },
  problem: {
    alignItems: 'flex-start',
    gap: 4,
  },
  retry: {
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 20,
    backgroundColor: BrandColors.lime,
  },
  retryText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
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
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  toastRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 12,
    alignItems: 'center',
  },
  toast: {
    height: 44,
    borderRadius: 22,
    paddingHorizontal: 18,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  toastWithUndo: {
    paddingRight: 8,
  },
  toastText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#111',
  },
  undo: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    justifyContent: 'center',
    backgroundColor: '#111',
  },
  undoText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: BrandColors.lime,
  },
});
