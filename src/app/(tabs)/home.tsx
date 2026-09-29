import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  BackHandler,
  ScrollView,
  StyleSheet,
  View,
  type LayoutChangeEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { CARD_BACKGROUNDS } from '@/components/today/backgrounds';
import { CapsuleVault, type JustSealed } from '@/components/today/capsule-vault';
import { CardOverlay, OVERLAY_MS, type CardRect } from '@/components/today/card-overlay';
import { DreamFlow, DreamTabs, type DreamTab } from '@/components/today/dream-flow';
import { FutureCard } from '@/components/today/future-card';
import { animate, TOAST } from '@/components/today/motion';
import { QuoteCard } from '@/components/today/quote-card';
import { ShareFlow } from '@/components/today/share-flow';
import { StreakBar } from '@/components/today/streak-bar';
import { openTab, TAB_BAR_HEIGHT, TabBar, type Tab } from '@/components/today/tab-bar';
import { TalkCard } from '@/components/today/talk-card';
import { WriteCard } from '@/components/today/write-card';
import { BrandFonts } from '@/constants/theme';
import { useDreams } from '@/hooks/use-dreams';
import { loadCapsules, sealCapsule } from '@/lib/capsules';
import { isVoiceAgentAvailable } from '@/lib/deepgram/native-audio';
import { loadProfileName } from '@/lib/profile';
import { weekDays } from '@/utils/entries';
import { currentStreak } from '@/utils/garden';
import {
  activeCard,
  formatClock,
  LOCK_OPTIONS,
  longDate,
  quoteOfDay,
  shortDate,
  todayGreeting,
  unlockDate,
  type DreamSource,
  type Fragment,
} from '@/utils/today';

const CARD_COUNT = 4;
const GAP = 10;
/** Space above the first card, and below the last. */
const EDGE = 6;
/** Space between the cards and the sides of the screen, so they read as cards. */
const SIDE = 12;
/** Just the top of the next card peeks out under the one in view. */
const PEEK = 40;
/** Cards never get shorter than this, even on very small phones. */
const MIN_CARD = 520;
const TOAST_MS = 2200;

/** What an opened card shows. */
type OverlayContent =
  | { kind: 'dream'; source: DreamSource; text?: string; fragments?: Fragment[] }
  | { kind: 'share' }
  | { kind: 'vault'; justSealed: JustSealed | null };

type Overlay = OverlayContent & { card: number; rect: CardRect; pill: string; open: boolean };

/**
 * Home ("/home"), from the Afterdream Today design: a vertical feed of four full-height
 * cards (yap or write, talk, today's quote, a note to future you) that snap into place,
 * above a black tab bar. A dream, the quote or the time capsule opens its card into
 * a full screen.
 */
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  // Read once: the name doesn't change while the screen is up.
  const [name] = useState(loadProfileName);
  // "Now" moves on whenever Home comes back into view or the app is reopened, so a new
  // day brings a new quote even if the app was left open overnight.
  const [now, setNow] = useState(() => new Date());
  const refreshNow = useCallback(() => setNow(new Date()), []);
  useFocusEffect(refreshNow);
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshNow();
    });
    return () => sub.remove();
  }, [refreshNow]);
  const quote = useMemo(() => quoteOfDay(now), [now]);
  // Told dreams, for the streak and this week's days (reloads whenever Home comes back into view).
  const { dreams } = useDreams();
  const streak = useMemo(() => currentStreak(dreams, now), [dreams, now]);
  const week = useMemo(() => weekDays(dreams, now), [dreams, now]);

  const [screen, setScreen] = useState({ width: 0, height: 0 });
  // The feed's height before any keyboard shrank it, so cards keep their size while typing.
  const [areaHeight, setAreaHeight] = useState(0);
  const [active, setActive] = useState(0);
  const [writing, setWriting] = useState(false);
  const [saved, setSaved] = useState(false);
  const [capsules, setCapsules] = useState(loadCapsules);
  const [overlay, setOverlay] = useState<Overlay | null>(null);
  // The dream reading's tabs, shown in the top bar once the reading is ready.
  const [dreamTab, setDreamTab] = useState<DreamTab>('analysis');
  const [dreamReady, setDreamReady] = useState(false);
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cards = useRef<(View | null)[]>([]);
  const feed = useRef<ScrollView>(null);
  // Patterns' "Had another dream?" lands here asking to yap or type straight away.
  const { start } = useLocalSearchParams<{ start?: string }>();
  const startWith = start === 'yap' || start === 'type' ? start : undefined;

  const cardHeight = Math.max(MIN_CARD, areaHeight - PEEK);
  const interval = cardHeight + GAP;
  const contentHeight = EDGE * 2 + CARD_COUNT * cardHeight + (CARD_COUNT - 1) * GAP;
  const maxScroll = Math.max(0, contentHeight - areaHeight);
  // The last card can't scroll all the way up, so it snaps to the end instead.
  const snaps = Array.from({ length: CARD_COUNT }, (_, i) => Math.min(i * interval, maxScroll));
  const tabBarBottom = Math.max(insets.bottom, 8);
  const displayName = name ?? 'you';

  function onFeedLayout(event: LayoutChangeEvent) {
    const { height } = event.nativeEvent.layout;
    setAreaHeight((current) => (writing ? current : height));
  }

  function onScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const next = activeCard(event.nativeEvent.contentOffset.y, interval, CARD_COUNT);
    if (next !== active) setActive(next);
  }

  function showToast(text: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast((current) => ({ id: (current?.id ?? 0) + 1, text }));
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  /** Grows the card at `index` into a full screen showing `content`. */
  function openCard(index: number, pill: string, content: OverlayContent) {
    const card = cards.current[index];
    if (!card) return;
    card.measureInWindow((x, y, width, height) => {
      setOverlay({ ...content, card: index, pill, rect: { x, y, width, height }, open: true });
    });
  }

  const closeCard = useCallback(() => {
    setOverlay((current) => (current ? { ...current, open: false } : current));
    setTimeout(() => setOverlay((current) => (current && !current.open ? null : current)), OVERLAY_MS + 20);
  }, []);

  // Android's back button closes an opened card instead of leaving the app.
  useFocusEffect(
    useCallback(() => {
      if (!overlay) return;
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        closeCard();
        return true;
      });
      return () => sub.remove();
    }, [overlay, closeCard])
  );

  function interpret(card: number, pill: string, dream: { source: DreamSource; text?: string; fragments?: Fragment[] }) {
    setDreamTab('analysis');
    setDreamReady(false);
    openCard(card, pill, { kind: 'dream', ...dream });
  }

  function seal(recording: { uri: string; seconds: number }, lock: number) {
    const option = LOCK_OPTIONS[lock];
    const opens = unlockDate(new Date(), option.months);
    try {
      setCapsules(sealCapsule(recording.uri, recording.seconds, opens));
    } catch (error) {
      console.warn('Could not keep the capsule recording', error);
      showToast('couldn’t keep that note — try again');
      return;
    }
    openCard(3, '⧗ time capsule', { kind: 'vault', justSealed: { lockLabel: option.label, unlockDate: longDate(opens) } });
  }

  function toggleSave() {
    setSaved(!saved);
    if (!saved) showToast('saved to your thoughts');
  }

  function pickTab(tab: Tab) {
    if (!openTab(tab, 'today')) showToast(`${tab} is coming soon ✦`);
  }

  function renderOverlay(current: Overlay) {
    switch (current.kind) {
      case 'dream':
        return (
          <DreamFlow
            source={current.source}
            text={current.text}
            fragments={current.fragments}
            tab={dreamTab}
            onReady={() => setDreamReady(true)}
            onToast={showToast}
            reduceMotion={reduceMotion}
            bottomInset={insets.bottom}
            onVisualize={(id) => {
              router.push({ pathname: '/visualize', params: { id } });
              closeCard();
            }}
            onDone={(wasSaved) => {
              closeCard();
              if (wasSaved) showToast('saved to entries ✦');
            }}
          />
        );
      case 'share':
        return (
          <ShareFlow
            quote={quote}
            date={shortDate(now)}
            photo={CARD_BACKGROUNDS[2]}
            reduceMotion={reduceMotion}
            bottomInset={insets.bottom}
            onToast={showToast}
          />
        );
      case 'vault':
        return (
          <CapsuleVault
            capsules={capsules}
            justSealed={current.justSealed}
            name={displayName}
            reduceMotion={reduceMotion}
            bottomInset={insets.bottom}
            onToast={showToast}
            onClose={closeCard}
          />
        );
    }
  }

  return (
    <View style={styles.screen} onLayout={(e) => setScreen({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}>
      <StatusBar style="light" />
      <View style={{ marginTop: insets.top }}>
        <StreakBar streak={streak} week={week} />
      </View>
      <View style={styles.area} onLayout={onFeedLayout}>
        {areaHeight > 0 && (
          <ScrollView
            ref={feed}
            style={StyleSheet.absoluteFill}
            contentContainerStyle={styles.feed}
            showsVerticalScrollIndicator={false}
            snapToOffsets={snaps}
            decelerationRate="fast"
            scrollEnabled={!writing}
            keyboardShouldPersistTaps="handled"
            scrollEventThrottle={32}
            onScroll={onScroll}>
            <View ref={(view) => void (cards.current[0] = view)} collapsable={false}>
              <WriteCard
                height={cardHeight}
                active={active === 0}
                reduceMotion={reduceMotion}
                greeting={todayGreeting(name, now.getHours())}
                onWritingChange={setWriting}
                onSubmit={(text) => interpret(0, '✎ from your words', { source: 'write', text })}
                onYap={(text, seconds) => interpret(0, `◉ ${formatClock(Math.max(1, seconds))} of yapping`, { source: 'yap', text })}
                onSpeak={() => (isVoiceAgentAvailable() ? router.push('/voice') : showToast('speaking needs the full app build ✦'))}
                start={startWith}
                onStarted={() => {
                  feed.current?.scrollTo({ y: 0, animated: true });
                  router.setParams({ start: undefined });
                }}
              />
            </View>
            <View ref={(view) => void (cards.current[1] = view)} collapsable={false}>
              <TalkCard
                height={cardHeight}
                active={active === 1}
                reduceMotion={reduceMotion}
                onWritingChange={setWriting}
                onSubmit={(fragments) => interpret(1, `✦ ${fragments.length} fragment${fragments.length > 1 ? 's' : ''}`, { source: 'talk', fragments })}
                onTalkOutLoud={isVoiceAgentAvailable() ? () => router.push('/voice') : null}
              />
            </View>
            <View ref={(view) => void (cards.current[2] = view)} collapsable={false}>
              <QuoteCard
                height={cardHeight}
                active={active === 2}
                reduceMotion={reduceMotion}
                quote={quote}
                date={shortDate(now)}
                saved={saved}
                onShare={() => openCard(2, 'share today’s thought', { kind: 'share' })}
                onToggleSave={toggleSave}
              />
            </View>
            <View ref={(view) => void (cards.current[3] = view)} collapsable={false}>
              <FutureCard
                height={cardHeight}
                active={active === 3}
                reduceMotion={reduceMotion}
                name={displayName}
                capsuleCount={capsules.length}
                onSeal={seal}
                onOpenCapsule={() => openCard(3, '⧗ time capsule', { kind: 'vault', justSealed: null })}
              />
            </View>
          </ScrollView>
        )}
      </View>

      <TabBar current="today" bottomInset={tabBarBottom} onPick={pickTab} />

      {overlay && screen.width > 0 && (
        <CardOverlay
          from={overlay.rect}
          screen={screen}
          open={overlay.open}
          reduceMotion={reduceMotion}
          // The dream reading is plain dark, so the words stand out; the others keep their card's photo.
          photo={overlay.kind === 'dream' ? undefined : CARD_BACKGROUNDS[overlay.card]}
          pill={overlay.pill}
          headerRight={overlay.kind === 'dream' && dreamReady ? <DreamTabs tab={dreamTab} onChange={setDreamTab} /> : undefined}
          topInset={insets.top}
          onClose={closeCard}>
          {renderOverlay(overlay)}
        </CardOverlay>
      )}

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

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000',
  },
  area: {
    flex: 1,
  },
  feed: {
    paddingTop: EDGE,
    paddingBottom: EDGE,
    paddingHorizontal: SIDE,
    gap: GAP,
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
