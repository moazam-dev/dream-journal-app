import { router, useFocusEffect, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { GardenPick, LostCounts } from '@/components/garden/garden-engine';
import GardenScene, { type SceneCommand } from '@/components/garden/garden-scene';
import {
  DemoScrubber,
  GardenActions,
  GardenHeading,
  GardenToast,
  PickSheet,
  Planting,
  RulesSheet,
  StageBanner,
  WiltSheet,
} from '@/components/garden/parts';
import { BRAND_BAR_HEIGHT, BrandBar } from '@/components/today/brand-bar';
import { ease } from '@/components/today/motion';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { useDreams } from '@/hooks/use-dreams';
import { loadGardenSeen, saveGardenSeen } from '@/lib/garden-memory';
import {
  FULL_GROWTH,
  gardenState,
  gardenVisit,
  lostLabels,
  pickCard,
  seenNow,
  stageIndex,
  wiltBody,
  type PickCard,
} from '@/utils/garden';

/** How long the garden shows last visit's growth before growing (or wilting) into today's. */
const SETTLE_MS = 700;
/** A night of the demo. */
const DEMO_NIGHT_MS = 900;
const TOAST_MS = 2600;
const BANNER_MS = 3000;

/**
 * The dream garden ("/garden"), from the Afterdream Garden v2 design: a 3D garden that grows
 * one night for every night a dream is told and wilts a little for every night missed
 * (see utils/garden). Opening it plays out what changed since last time: new growth, a new
 * stage, or the "your garden wilted" sheet. Tap a plant to see the dream that grew it.
 */
export default function GardenScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  const focused = useIsFocused();
  const { dreams, loading } = useDreams();

  const [now, setNow] = useState(() => new Date());
  const garden = useMemo(() => gardenState(dreams, now), [dreams, now]);

  const [ready, setReady] = useState(false);
  const [command, setCommand] = useState<SceneCommand>({ id: 0, growth: 0, wilted: false });
  const [pick, setPick] = useState<PickCard | null>(null);
  const [wiltOpen, setWiltOpen] = useState(false);
  const [lost, setLost] = useState<string[]>([]);
  const [rules, setRules] = useState(false);
  const [banner, setBanner] = useState<{ id: number; name: string } | null>(null);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [demoDay, setDemoDay] = useState<number | null>(null);
  const [demoPlaying, setDemoPlaying] = useState(false);

  const nextId = useRef(1);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const demoTimer = useRef<ReturnType<typeof setInterval> | null>(null);
  /** Leaves the demo a little after it reaches the end, unless the bar is touched first. */
  const demoEnd = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** The demo's night, for the timer and the scrubber (state lags a render behind). */
  const demoNight = useRef(0);

  const later = useCallback((fn: () => void, ms: number) => {
    timers.current.push(setTimeout(fn, ms));
  }, []);

  useEffect(
    () => () => {
      timers.current.forEach(clearTimeout);
      if (demoTimer.current) clearInterval(demoTimer.current);
      if (demoEnd.current) clearTimeout(demoEnd.current);
    },
    []
  );

  // A new day may have started while the app was in the background.
  useFocusEffect(useCallback(() => setNow(new Date()), []));

  const send = useCallback((change: Omit<SceneCommand, 'id'>) => {
    setCommand({ id: nextId.current++, ...change });
  }, []);

  const showToast = useCallback(
    (text: string) => {
      const id = nextId.current++;
      setToast({ id, text });
      later(() => setToast((current) => (current?.id === id ? null : current)), TOAST_MS);
    },
    [later]
  );

  // Each time fresh dreams arrive: grow (or wilt) from how the garden looked last time.
  useEffect(() => {
    if (!ready || loading || demoDay !== null) return;
    const seen = loadGardenSeen();
    const visit = gardenVisit(seen, garden);
    send({
      growth: garden.growth,
      wilted: !!garden.wilt,
      from: { growth: visit.fromGrowth, wilted: visit.fromWilted, delay: SETTLE_MS },
      burst: visit.burst,
      lost: visit.wiltSheet && garden.wilt ? [garden.wilt.fromGrowth, garden.wilt.toGrowth] : undefined,
    });
    saveGardenSeen(seenNow(garden));

    if (visit.banner) {
      const shown = { id: nextId.current++, name: visit.banner };
      later(() => setBanner(shown), SETTLE_MS);
      later(() => setBanner((current) => (current?.id === shown.id ? null : current)), SETTLE_MS + BANNER_MS);
    }
    if (visit.toast) {
      const text = visit.toast;
      later(() => showToast(text), SETTLE_MS + (visit.banner ? BANNER_MS : 300));
    }
    if (visit.wiltSheet) later(() => setWiltOpen(true), SETTLE_MS + 900);
    // Runs for new dreams (and once the scene is ready), not for every toast.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [garden, ready, loading]);

  /** Holds the demo on the night it's on. */
  function pauseDemo() {
    if (demoTimer.current) clearInterval(demoTimer.current);
    demoTimer.current = null;
    if (demoEnd.current) clearTimeout(demoEnd.current);
    demoEnd.current = null;
    setDemoPlaying(false);
  }

  function stopDemo() {
    pauseDemo();
    setDemoDay(null);
    // Straight back to their own garden.
    send({ growth: garden.growth, wilted: !!garden.wilt, from: { growth: garden.growth, wilted: !!garden.wilt, delay: 0 } });
  }

  /** Shows the demo's garden on this night; `burst` marks a newly reached stage. */
  function showDemoDay(day: number, burst: boolean) {
    const previous = demoNight.current;
    demoNight.current = day;
    setDemoDay(day);
    send({ growth: day, wilted: false, burst: burst && stageIndex(day) > stageIndex(previous) ? 'grow' : null });
  }

  /** Grows the demo a night every 0.9 s from where it is, and leaves it once it's whole. */
  function resumeDemo() {
    pauseDemo();
    setDemoPlaying(true);
    demoTimer.current = setInterval(() => {
      const day = demoNight.current + 1;
      showDemoDay(day, true);
      if (day >= FULL_GROWTH) {
        pauseDemo();
        showToast('60 days in — a whole dream world ✦');
        demoEnd.current = setTimeout(stopDemo, TOAST_MS + 800);
      }
    }, DEMO_NIGHT_MS);
  }

  /** Grows a garden from a seed to a whole dream world. */
  function playDemo() {
    if (!ready) return;
    if (demoDay !== null) return stopDemo();
    setPick(null);
    setBanner(null);
    setRules(false);
    demoNight.current = 0;
    setDemoDay(0);
    send({ growth: 0, wilted: false, from: { growth: 0, wilted: false, delay: 0 } });
    resumeDemo();
  }

  function toggleDemo() {
    if (demoPlaying) return pauseDemo();
    // From the end, play it again from the seed.
    if (demoNight.current >= FULL_GROWTH) showDemoDay(0, false);
    resumeDemo();
  }

  function scrubDemo(day: number) {
    if (day !== demoNight.current) showDemoDay(day, false);
  }

  async function onPick(picked: GardenPick | null) {
    if (demoDay !== null) return;
    if (!picked) return setPick(null);
    const card = pickCard(picked, garden, dreams, now);
    if (card) setPick(card);
    else showToast('log a dream to plant your garden ✦');
  }

  async function onDrag() {
    setPick(null);
  }

  async function onLost(counts: LostCounts) {
    setLost(lostLabels(counts));
  }

  async function onReady() {
    setReady(true);
  }

  function reread() {
    if (!pick) return;
    router.push({ pathname: '/dream/[id]', params: { id: pick.dreamId } });
  }

  function revive() {
    setWiltOpen(false);
    openTab('today', 'garden');
  }

  function pickTab(tab: Tab) {
    openTab(tab, 'garden');
  }

  const tabBarBottom = Math.max(insets.bottom, 8);
  const tabBarHeight = TAB_BAR_HEIGHT + tabBarBottom;
  const wilt = garden.wilt;
  const demo = demoDay !== null;
  // Hidden until the first visit (or demo) has put it in place.
  const settled = command.id > 0;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <Animated.View style={[StyleSheet.absoluteFill, styles.wilted, { opacity: wilt && !demo ? 1 : 0 }, ease(reduceMotion, ['opacity'], 1600)]} />

      <Animated.View style={[styles.scene, { bottom: tabBarHeight, opacity: settled ? 1 : 0 }, ease(reduceMotion, ['opacity'], 600)]}>
        <GardenScene
          command={command}
          autoSpin={!reduceMotion}
          paused={!focused}
          onReady={onReady}
          onPick={onPick}
          onDrag={onDrag}
          onLost={onLost}
          dom={{ style: styles.web, scrollEnabled: false, bounces: false, overScrollMode: 'never' }}
        />
      </Animated.View>
      <View pointerEvents="none" style={styles.shade} />
      {!settled && (
        <View pointerEvents="none" style={[styles.fill, { top: insets.top + 326 }]}>
          <Planting reduceMotion={reduceMotion} />
        </View>
      )}

      <View style={[styles.fill, { top: insets.top }]}>
        <BrandBar title="garden" streak={demo ? demoDay : garden.streak}>
          <GardenActions demoPlaying={demo} onDemo={playDemo} onRules={() => setRules(true)} />
        </BrandBar>
      </View>

      {pick && !demo && (
        <View style={[styles.fill, { top: insets.top + BRAND_BAR_HEIGHT + 6 }]}>
          <PickSheet card={pick} reduceMotion={reduceMotion} onClose={() => setPick(null)} onReread={reread} />
        </View>
      )}
      {settled && !demo && !pick && (
        <View pointerEvents="none" style={[styles.fill, { top: insets.top + BRAND_BAR_HEIGHT + 18 }]}>
          <GardenHeading growth={garden.growth} reduceMotion={reduceMotion} />
        </View>
      )}
      {demo && (
        <View pointerEvents="box-none" style={[styles.fill, { top: insets.top + BRAND_BAR_HEIGHT + 10 }]}>
          <DemoScrubber
            day={demoDay}
            playing={demoPlaying}
            reduceMotion={reduceMotion}
            onPlayPause={toggleDemo}
            onScrubStart={pauseDemo}
            onScrub={scrubDemo}
          />
        </View>
      )}
      {banner && !demo && (
        <View pointerEvents="none" style={[styles.fill, { top: insets.top + 246 }]}>
          <StageBanner key={banner.id} name={banner.name} reduceMotion={reduceMotion} />
        </View>
      )}

      <View style={styles.tabBar}>
        <TabBar current="garden" bottomInset={tabBarBottom} onPick={pickTab} />
      </View>

      {wiltOpen && wilt && (
        <WiltSheet
          body={wiltBody(wilt)}
          streak={`${wilt.fromStreak} → 0`}
          growth={`${wilt.fromGrowth} → ${wilt.toGrowth}`}
          lost={lost}
          bottomInset={insets.bottom}
          reduceMotion={reduceMotion}
          onRevive={revive}
          onClose={() => setWiltOpen(false)}
        />
      )}
      {rules && <RulesSheet reduceMotion={reduceMotion} onClose={() => setRules(false)} />}

      {toast && (
        <View pointerEvents="none" style={[styles.toastRow, { top: insets.top + 6 }]}>
          <GardenToast key={toast.id} text={toast.text} reduceMotion={reduceMotion} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#1d1838',
    experimental_backgroundImage: 'linear-gradient(180deg, #1d1838 0%, #3b2f66 36%, #7d6194 66%, #d9a3a0 100%)',
  },
  wilted: {
    experimental_backgroundImage: 'linear-gradient(180deg, #19191c 0%, #34333a 40%, #5a5550 75%, #7d7468 100%)',
  },
  scene: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  web: {
    flex: 1,
    backgroundColor: '#1d1838',
  },
  shade: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 150,
    zIndex: 1,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(10,20,50,0.35), rgba(10,20,50,0))',
  },
  fill: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
  },
  tabBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 3,
  },
  toastRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 9,
    alignItems: 'center',
  },
});
