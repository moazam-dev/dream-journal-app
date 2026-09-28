import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { animate, ease, FADE, SPRING, TOAST } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { DreamPicture } from '@/components/visualize/dream-scene';
import { PROGRESS, TICK } from '@/components/visualize/motion';
import { SwipeArea, SwipeHint, type SwipeDirection } from '@/components/visualize/swipe-area';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { isHintDone, markHintDone } from '@/lib/hints';
import type { Dream } from '@/types/dream';
import { dreamDay, LOOKS, pickDreams, wrapIndex } from '@/utils/visualize';

const TOAST_MS = 1800;
/** While playing, each picture stays this long once it's up. */
const PLAY_MS = 5000;
/** Pressing play on a picture that's already up moves on a little sooner. */
const PLAY_NOW_MS = 4000;

type Show = { index: number; key: number; fast: boolean };

/**
 * Visualize ("/visualize"), from the Afterdream Visualize design: the dreamer's recent
 * dreams as full-screen pictures. Each dream is spelled out, its words blow away like
 * dust, and the picture develops in their place. Swipe up for the next dream and down
 * for the one before (or tap right and left), change the look, or press play.
 *
 * `?id=<dream id>` starts on that dream (from "see it visualized" after a reading).
 */
export default function VisualizeScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const { dreams, loading, error, reload } = useDreams();

  const [now] = useState(() => new Date());
  // Picked once: coming back to the screen reloads `dreams`, but shouldn't reshuffle the pictures.
  const [list, setList] = useState<Dream[] | null>(null);
  const [show, setShow] = useState<Show>({ index: 0, key: 0, fast: false });
  const [look, setLook] = useState(0);
  const [settled, setSettled] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState<{ key: number; ms: number } | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [hintDone, setHintDone] = useState(() => isHintDone('visualizeSwipe'));
  const [nudgeKey, setNudgeKey] = useState(0);

  // Once the dreams arrive, pick the ones to show (during render, so there's no blank frame).
  if (!list && !loading && !error) {
    const picked = pickDreams(dreams, id);
    setList(picked.list);
    setShow({ index: picked.start, key: 0, fast: false });
  }

  useEffect(
    () => () => {
      if (advanceTimer.current) clearTimeout(advanceTimer.current);
      if (toastTimer.current) clearTimeout(toastTimer.current);
    },
    []
  );

  const count = list?.length ?? 0;
  const tabBarBottom = Math.max(insets.bottom, 8);
  const pictureBottom = TAB_BAR_HEIGHT + tabBarBottom;

  function stopQueue() {
    if (advanceTimer.current) clearTimeout(advanceTimer.current);
    advanceTimer.current = null;
    setProgress(null);
  }

  function goTo(index: number, fast = false) {
    stopQueue();
    setSettled(false);
    setShow((current) => ({ index: wrapIndex(index, count), key: current.key + 1, fast }));
  }

  /** While playing, moves to the next dream after `ms`, with a bar filling up meanwhile. */
  function queueNext(ms: number) {
    stopQueue();
    setProgress((current) => ({ key: (current?.key ?? 0) + 1, ms }));
    advanceTimer.current = setTimeout(() => {
      advanceTimer.current = null;
      setProgress(null);
      setSettled(false);
      setShow((current) => ({ index: wrapIndex(current.index + 1, count), key: current.key + 1, fast: false }));
    }, ms);
  }

  function onSettled() {
    setSettled(true);
    if (playing) queueNext(PLAY_MS);
    // Until they've swiped once, the first picture of each visit nudges up to show it can be swiped.
    if (!hintDone && count > 1 && nudgeKey === 0) setNudgeKey(1);
  }

  function onSwipe(direction: SwipeDirection) {
    goTo(show.index + direction);
    if (!hintDone) {
      setHintDone(true);
      markHintDone('visualizeSwipe');
    }
  }

  function togglePlay() {
    if (playing) {
      stopQueue();
      setPlaying(false);
      return;
    }
    setPlaying(true);
    // If the picture is still coming, `onSettled` starts the timer once it's up.
    if (settled) queueNext(PLAY_NOW_MS);
  }

  function restyle() {
    const next = (look + 1) % LOOKS.length;
    setLook(next);
    showToast(`repainted · ${LOOKS[next].label}`);
    goTo(show.index, true);
  }

  function showToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  const updateDream = useCallback((dreamId: string, change: SetStateAction<Dream | null>) => {
    setList((current) =>
      current?.map((dream) => (dream.id === dreamId ? ((typeof change === 'function' ? change(dream) : change) ?? dream) : dream)) ?? current
    );
  }, []);

  function pickTab(tab: Tab) {
    if (!openTab(tab, 'visualize')) showToast(`${tab} is coming soon ✦`);
  }

  const dream = list?.[show.index];
  const showHint = !!dream && settled && !hintDone && count > 1;
  const header = !dream ? 'visualize' : settled ? 'visualize' : 'turning your words into a picture…';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      {dream ? (
        <SwipeArea style={StyleSheet.absoluteFill} reduceMotion={reduceMotion} onSwipe={onSwipe} nudgeKey={nudgeKey}>
          {/* Tap zones sit under the picture's own buttons (like "try again"). */}
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="previous dream"
            onPress={() => goTo(show.index - 1)}
            style={[styles.prev, { top: insets.top + 56, bottom: pictureBottom + 106 }]}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="next dream"
            onPress={() => goTo(show.index + 1)}
            style={[styles.next, { top: insets.top + 56, bottom: pictureBottom + 106 }]}
          />
          <DreamPicture
            key={dream.id}
            dream={dream}
            onChange={updateDream}
            showKey={show.key}
            fast={show.fast}
            look={look}
            reduceMotion={reduceMotion}
            bottom={pictureBottom}
            now={now}
            onSettled={onSettled}
          />
        </SwipeArea>
      ) : (
        <Status loading={loading || (!list && !error)} error={error} empty={!!list && count === 0} reduceMotion={reduceMotion} onRetry={reload} />
      )}

      <View style={[styles.header, { top: insets.top + 8 }]} pointerEvents="none">
        <Text style={styles.headerText}>{header}</Text>
        {count > 0 && <Text style={styles.count}>{`${show.index + 1} / ${count}`}</Text>}
      </View>

      {showHint && (
        <View pointerEvents="none" style={[styles.hintRow, { top: insets.top + 40 }]}>
          <SwipeHint reduceMotion={reduceMotion} />
        </View>
      )}

      {dream && (
        <View style={[styles.controls, { bottom: pictureBottom + 16 }]} pointerEvents="box-none">
          <View style={styles.ticks}>
            {list!.map((item, i) => {
              const current = i === show.index;
              return (
                <Pressable
                  key={item.id}
                  accessibilityRole="button"
                  accessibilityLabel={dreamDay(new Date(item.created_at), now)}
                  accessibilityState={{ selected: current }}
                  onPress={() => goTo(i)}
                  hitSlop={{ top: 10, bottom: 10 }}
                  style={styles.tickButton}>
                  <Animated.View
                    style={[
                      styles.tick,
                      { height: current ? 22 : 10, backgroundColor: current ? BrandColors.lime : 'rgba(255,255,255,0.45)' },
                      animate(reduceMotion, { animationName: TICK, animationDuration: 500, animationDelay: 200 + i * 50, animationTimingFunction: 'ease' }),
                      !reduceMotion && {
                        transitionProperty: ['height', 'backgroundColor'],
                        transitionDuration: [400, 300],
                        transitionTimingFunction: [SPRING, 'ease'],
                      },
                    ]}
                  />
                </Pressable>
              );
            })}
          </View>
          <View style={styles.buttons}>
            <Pressable accessibilityRole="button" accessibilityLabel={`look: ${LOOKS[look].label}, tap to repaint`} onPress={restyle} hitSlop={8}>
              <Text style={styles.look}>{`✧ ${LOOKS[look].label}`}</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={playing ? 'pause' : 'play'}
              onPress={togglePlay}
              style={[
                styles.play,
                { backgroundColor: playing ? BrandColors.lime : 'rgba(255,255,255,0.16)' },
                ease(reduceMotion, ['backgroundColor']),
              ]}>
              <Text style={[styles.playIcon, { color: playing ? '#111' : '#fff' }]}>{playing ? '❚❚' : '▶'}</Text>
            </Pressable>
          </View>
        </View>
      )}

      {playing && progress && (
        <View style={[styles.progressTrack, { bottom: pictureBottom }]} pointerEvents="none">
          <Animated.View
            key={progress.key}
            style={[
              styles.progressFill,
              animate(reduceMotion, { animationName: PROGRESS, animationDuration: progress.ms, animationTimingFunction: 'linear' }),
            ]}
          />
        </View>
      )}

      {/* Everything above is positioned absolutely, so the tab bar is pinned to the bottom too. */}
      <View style={styles.tabBar}>
        <TabBar current="visualize" bottomInset={tabBarBottom} onPick={pickTab} />
      </View>

      {toast && (
        <View pointerEvents="none" style={[styles.toastRow, { top: insets.top + 46 }]}>
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

type StatusProps = { loading: boolean; error: string | null; empty: boolean; reduceMotion: boolean; onRetry: () => void };

/** What shows before there's a picture: loading, an error, or no dreams yet. */
function Status({ loading, error, empty, reduceMotion, onRetry }: StatusProps) {
  if (loading) {
    return (
      <View style={styles.status}>
        <Animated.Text style={[styles.statusText, animate(reduceMotion, { animationName: FADE, animationDuration: 600, animationDelay: 300 })]}>
          gathering your dreams…
        </Animated.Text>
      </View>
    );
  }
  if (error) {
    return (
      <View style={styles.status}>
        <Text style={styles.statusTitle}>couldn’t reach your dreams.</Text>
        <Text style={styles.statusText}>{error}</Text>
        <Pressable accessibilityRole="button" onPress={onRetry} style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
          <Text style={styles.statusButtonText}>try again</Text>
        </Pressable>
      </View>
    );
  }
  if (empty) {
    return (
      <View style={styles.status}>
        <Text style={styles.statusTitle}>nothing to picture yet.</Text>
        <Text style={styles.statusText}>tell afterdream a dream, and it will show up here as a picture.</Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => openTab('today', 'visualize')}
          style={({ pressed }) => [styles.statusButton, pressed && styles.pressed]}>
          <Text style={styles.statusButtonText}>back to today</Text>
        </Pressable>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  prev: {
    position: 'absolute',
    left: 0,
    width: '35%',
  },
  next: {
    position: 'absolute',
    right: 0,
    width: '65%',
  },
  header: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  headerText: {
    flexShrink: 1,
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  count: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.8)',
  },
  controls: {
    position: 'absolute',
    left: 24,
    right: 24,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 16,
  },
  ticks: {
    height: 22,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 7,
  },
  tickButton: {
    width: 14,
    height: 22,
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  tick: {
    width: 2,
    borderRadius: 1,
    transformOrigin: 'bottom',
  },
  buttons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 18,
  },
  look: {
    paddingVertical: 6,
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
  play: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playIcon: {
    fontFamily: BrandFonts.semibold,
    fontSize: 13,
    lineHeight: 16,
  },
  progressTrack: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  progressFill: {
    height: '100%',
    backgroundColor: BrandColors.lime,
    transformOrigin: 'left',
  },
  status: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
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
  hintRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
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
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.55)',
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
});
