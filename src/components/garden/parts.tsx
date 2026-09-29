import { useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, View, type AccessibilityActionEvent, type GestureResponderEvent } from 'react-native';
import Animated from 'react-native-reanimated';

import { HeaderButton } from '@/components/today/brand-bar';
import { animate, EASE_OUT, FADE } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { FULL_GROWTH, GARDEN_RULES, gardenGoal, goalCaption, STAGES, stageName, type PickCard } from '@/utils/garden';

import { BANNER, BREATH, POP, TOAST, UP } from './motion';

/** The sheets' dark card colour. */
const SHEET = '#1c1b20';

type ActionsProps = {
  demoPlaying: boolean;
  onDemo: () => void;
  onRules: () => void;
};

/** The garden's buttons in the shared top bar: what the garden is, and the full demo. */
export function GardenActions({ demoPlaying, onDemo, onRules }: ActionsProps) {
  return (
    <>
      <HeaderButton label="What is this?" onPress={onRules}>
        <Text style={styles.helpText}>?</Text>
      </HeaderButton>
      <HeaderButton label={demoPlaying ? 'Stop demo' : 'Play full demo'} onPress={onDemo}>
        {demoPlaying ? <View style={styles.stop} /> : <View style={styles.play} />}
      </HeaderButton>
    </>
  );
}

/** "planting your garden…", breathing, until the 3D garden is ready. */
export function Planting({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <Animated.Text
      style={[
        styles.planting,
        animate(reduceMotion, {
          animationName: BREATH,
          animationDuration: 1600,
          animationTimingFunction: 'ease-in-out',
          animationIterationCount: 'infinite',
        }),
      ]}>
      planting your garden…
    </Animated.Text>
  );
}

type PickProps = { card: PickCard; reduceMotion: boolean; onClose: () => void; onReread: () => void };

/** The glass card for a tapped plant: when it grew, and the dream that grew it. */
export function PickSheet({ card, reduceMotion, onClose, onReread }: PickProps) {
  return (
    <Animated.View
      style={[
        styles.pick,
        animate(reduceMotion, { animationName: POP, animationDuration: 350, animationTimingFunction: EASE_OUT }),
      ]}>
      <View style={styles.pickRow}>
        <Text style={styles.eyebrow}>{card.when}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}>
          <Text style={styles.closeText}>✕</Text>
        </Pressable>
      </View>
      <Text style={styles.pickTitle} numberOfLines={3}>
        {card.title}
      </Text>
      <View style={styles.pickRow}>
        <View style={styles.kind}>
          <Text style={styles.kindText}>{card.kind}</Text>
        </View>
        <Pressable accessibilityRole="link" hitSlop={8} onPress={onReread}>
          <Text style={styles.reread}>reread this dream →</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

/**
 * The top of the garden: the stage it's at, a bar with a notch for every night of this
 * stage, and how many more nights until the next one.
 */
export function GardenHeading({ growth, reduceMotion }: { growth: number; reduceMotion: boolean }) {
  const goal = gardenGoal(growth);
  const caption = goalCaption(goal, growth);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.heading, animate(reduceMotion, { animationName: FADE, animationDuration: 500, animationTimingFunction: 'ease' })]}>
      <Text style={styles.headingCap}>
        stage {goal.stageNumber} of {STAGES.length}
      </Text>
      <Text style={styles.headingTitle} accessibilityRole="header">
        {goal.stage}
      </Text>
      <View
        style={styles.notches}
        accessible
        accessibilityRole="progressbar"
        accessibilityLabel={caption}
        accessibilityValue={{ min: 0, max: goal.span, now: goal.done }}>
        {Array.from({ length: goal.span }, (_, i) => (
          <View key={i} style={[styles.notch, i < goal.done && styles.notchOn]} />
        ))}
      </View>
      <View style={styles.headingRow}>
        <Text style={styles.headingNote}>
          {growth} night{growth === 1 ? '' : 's'} grown
        </Text>
        <Text style={[styles.headingNote, styles.headingNext]} numberOfLines={1}>
          {caption}
        </Text>
      </View>
    </Animated.View>
  );
}

/** Size of the scrubber's round handle. */
const THUMB = 22;
/** Height of the scrubber's touch area. */
const SCRUB_HEIGHT = 44;

type ScrubberProps = {
  day: number;
  playing: boolean;
  reduceMotion: boolean;
  onPlayPause: () => void;
  /** A finger went down on the bar (the demo stops advancing on its own). */
  onScrubStart: () => void;
  /** The night under the finger, 0 to FULL_GROWTH. */
  onScrub: (day: number) => void;
};

/**
 * While the demo plays, in place of the heading: the night it's on, big, and a bar to drag
 * through all 60 nights of growth (the garden follows the finger).
 */
export function DemoScrubber({ day, playing, reduceMotion, onPlayPause, onScrubStart, onScrub }: ScrubberProps) {
  const [width, setWidth] = useState(0);
  // Where the finger went down: on the bar, and on the screen.
  const start = useRef({ x: 0, pageX: 0 });

  function dayAt(x: number) {
    return width > 0 ? Math.round(Math.min(1, Math.max(0, x / width)) * FULL_GROWTH) : 0;
  }

  function onGrant(event: GestureResponderEvent) {
    // The bar's children ignore touches, so locationX is measured from the bar's left edge.
    start.current = { x: event.nativeEvent.locationX, pageX: event.nativeEvent.pageX };
    onScrubStart();
    onScrub(dayAt(start.current.x));
  }

  function onMove(event: GestureResponderEvent) {
    onScrub(dayAt(start.current.x + event.nativeEvent.pageX - start.current.pageX));
  }

  function onAction(event: AccessibilityActionEvent) {
    const name = event.nativeEvent.actionName;
    const step = name === 'increment' ? 1 : name === 'decrement' ? -1 : 0;
    if (!step) return;
    onScrubStart();
    onScrub(Math.min(FULL_GROWTH, Math.max(0, day + step)));
  }

  const fraction = day / FULL_GROWTH;
  return (
    <Animated.View
      style={[styles.demo, animate(reduceMotion, { animationName: FADE, animationDuration: 400, animationTimingFunction: 'ease' })]}>
      <Text style={styles.demoCap}>day</Text>
      <Text style={styles.demoDay} accessibilityLiveRegion="polite">
        {day}
      </Text>
      <Text style={styles.demoStage}>
        of {FULL_GROWTH} · {stageName(day)}
      </Text>
      <View style={styles.scrubRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Pause demo' : 'Play demo'}
          hitSlop={8}
          onPress={onPlayPause}
          style={({ pressed }) => [styles.playPause, pressed && styles.primaryPressed]}>
          {playing ? (
            <View style={styles.pauseBars}>
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          ) : (
            <View style={[styles.play, styles.playDark]} />
          )}
        </Pressable>
        <View
          style={styles.scrub}
          onLayout={(event) => setWidth(event.nativeEvent.layout.width)}
          accessible
          accessibilityRole="adjustable"
          accessibilityLabel="Demo night"
          accessibilityValue={{ min: 0, max: FULL_GROWTH, now: day, text: `night ${day} of ${FULL_GROWTH}, ${stageName(day)}` }}
          accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
          onAccessibilityAction={onAction}
          onStartShouldSetResponder={() => true}
          onMoveShouldSetResponder={() => true}
          onResponderTerminationRequest={() => false}
          onResponderGrant={onGrant}
          onResponderMove={onMove}>
          <View pointerEvents="none" style={styles.scrubTrack}>
            <View style={[styles.scrubFill, { width: `${fraction * 100}%` }]} />
          </View>
          {STAGES.slice(1, -1).map(([night]) => (
            <View
              key={night}
              pointerEvents="none"
              style={[styles.scrubTick, { left: (night / FULL_GROWTH) * width - 1 }, night <= day && styles.scrubTickOn]}
            />
          ))}
          <View pointerEvents="none" style={[styles.scrubThumb, { left: fraction * width - THUMB / 2 }]} />
        </View>
      </View>
    </Animated.View>
  );
}

/** "new stage unlocked" and the stage's name, for three seconds. */
export function StageBanner({ name, reduceMotion }: { name: string; reduceMotion: boolean }) {
  return (
    <Animated.View
      pointerEvents="none"
      accessibilityLiveRegion="polite"
      style={[styles.banner, animate(reduceMotion, { animationName: BANNER, animationDuration: 3000, animationTimingFunction: 'ease' })]}>
      <Text style={styles.bannerCap}>new stage unlocked</Text>
      <Text style={styles.bannerName}>{name}</Text>
    </Animated.View>
  );
}

export function GardenToast({ text, reduceMotion }: { text: string; reduceMotion: boolean }) {
  return (
    <Animated.Text
      accessibilityLiveRegion="polite"
      style={[styles.toast, animate(reduceMotion, { animationName: TOAST, animationDuration: 2600, animationTimingFunction: 'ease' })]}>
      {text}
    </Animated.Text>
  );
}

type WiltProps = {
  body: string;
  streak: string;
  growth: string;
  lost: string[];
  bottomInset: number;
  reduceMotion: boolean;
  onRevive: () => void;
  onClose: () => void;
};

/** "your garden wilted.": what a missed night cost, and the way back. */
export function WiltSheet({ body, streak, growth, lost, bottomInset, reduceMotion, onRevive, onClose }: WiltProps) {
  return (
    <Animated.View style={[styles.scrim, animate(reduceMotion, { animationName: FADE, animationDuration: 400, animationTimingFunction: 'ease' })]}>
      <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        accessibilityViewIsModal
        style={[
          styles.wilt,
          { bottom: 12 + bottomInset },
          animate(reduceMotion, { animationName: UP, animationDuration: 500, animationDelay: 100, animationTimingFunction: EASE_OUT }),
        ]}>
        <View style={styles.gap10}>
          <Text style={styles.eyebrowSoft}>you missed a night</Text>
          <Text style={styles.wiltTitle} accessibilityRole="header">
            your garden wilted.
          </Text>
          <Text style={styles.body}>{body}</Text>
        </View>
        <View style={styles.stats}>
          <Stat label="streak" value={streak} />
          <Stat label="growth" value={growth} />
        </View>
        {lost.length > 0 && (
          <View style={styles.gap8}>
            <Text style={styles.statLabel}>faded away</Text>
            <View style={styles.chips}>
              {lost.map((item) => (
                <View key={item} style={styles.chip}>
                  <Text style={styles.chipText}>{item}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        <View style={styles.gap10}>
          <Pressable accessibilityRole="button" onPress={onRevive} style={({ pressed }) => [styles.primary, styles.revive, pressed && styles.primaryPressed]}>
            <Text style={styles.primaryText}>revive it with tonight’s dream</Text>
          </Pressable>
          <Text style={styles.footnote}>every 7 nights in a row earns a dewdrop — it protects one missed night.</Text>
        </View>
      </Animated.View>
    </Animated.View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

/** "this garden grows with your dreams.": the rules, from the "?" button. */
export function RulesSheet({ reduceMotion, onClose }: { reduceMotion: boolean; onClose: () => void }) {
  return (
    <Animated.View
      style={[styles.scrim, styles.center, animate(reduceMotion, { animationName: FADE, animationDuration: 300, animationTimingFunction: 'ease' })]}>
      <Pressable accessibilityLabel="Close" style={StyleSheet.absoluteFill} onPress={onClose} />
      <Animated.View
        accessibilityViewIsModal
        style={[styles.rules, animate(reduceMotion, { animationName: POP, animationDuration: 350, animationTimingFunction: EASE_OUT })]}>
        <Text style={styles.rulesTitle} accessibilityRole="header">
          this garden grows with your dreams.
        </Text>
        <View style={styles.gap12}>
          {GARDEN_RULES.map((rule) => (
            <View key={rule.text} style={styles.rule}>
              <View style={[styles.ruleDot, { backgroundColor: rule.grows ? BrandColors.lime : 'rgba(255,255,255,0.5)' }]} />
              <Text style={styles.ruleText}>{rule.text}</Text>
            </View>
          ))}
        </View>
        <Pressable accessibilityRole="button" onPress={onClose} style={({ pressed }) => [styles.primary, styles.gotIt, pressed && styles.primaryPressed]}>
          <Text style={[styles.primaryText, styles.gotItText]}>got it</Text>
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  helpText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 19,
    color: '#fff',
  },
  play: {
    width: 0,
    height: 0,
    marginLeft: 3,
    borderStyle: 'solid',
    borderTopWidth: 6,
    borderBottomWidth: 6,
    borderLeftWidth: 10,
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderLeftColor: '#fff',
  },
  stop: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#fff',
  },
  planting: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    lineHeight: 18,
    color: '#fff',
  },
  pick: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 4,
    paddingVertical: 16,
    paddingLeft: 18,
    paddingRight: 16,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.14)',
    backgroundColor: 'rgba(20,16,40,0.72)',
    gap: 10,
  },
  pickRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 10,
  },
  eyebrow: {
    flexShrink: 1,
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.8)',
  },
  close: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  closeText: {
    fontFamily: BrandFonts.regular,
    fontSize: 12,
    lineHeight: 14,
    color: '#fff',
  },
  pickTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 20,
    lineHeight: 23,
    letterSpacing: -0.5,
    color: '#fff',
  },
  kind: {
    height: 28,
    paddingHorizontal: 12,
    borderRadius: 14,
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  kindText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: '#111',
  },
  reread: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
    textDecorationLine: 'underline',
  },
  heading: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 4,
    alignItems: 'center',
  },
  headingCap: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: BrandColors.lime,
  },
  headingTitle: {
    marginTop: 6,
    fontFamily: BrandFonts.medium,
    fontSize: 40,
    lineHeight: 44,
    letterSpacing: -1.5,
    color: '#fff',
    textAlign: 'center',
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
  notches: {
    alignSelf: 'stretch',
    marginTop: 16,
    flexDirection: 'row',
    gap: 4,
  },
  notch: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  notchOn: {
    backgroundColor: BrandColors.lime,
  },
  headingRow: {
    alignSelf: 'stretch',
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  headingNote: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: 'rgba(255,255,255,0.8)',
    fontVariant: ['tabular-nums'],
  },
  headingNext: {
    flexShrink: 1,
    color: '#fff',
  },
  demo: {
    position: 'absolute',
    left: 24,
    right: 24,
    zIndex: 4,
    alignItems: 'center',
  },
  demoCap: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: BrandColors.lime,
  },
  demoDay: {
    fontFamily: BrandFonts.medium,
    fontSize: 64,
    lineHeight: 68,
    letterSpacing: -2.5,
    color: '#fff',
    fontVariant: ['tabular-nums'],
    textShadowColor: 'rgba(0,0,0,0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 24,
  },
  demoStage: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: 'rgba(255,255,255,0.85)',
  },
  scrubRow: {
    alignSelf: 'stretch',
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  playPause: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  playDark: {
    borderLeftColor: '#111',
  },
  pauseBars: {
    flexDirection: 'row',
    gap: 3,
  },
  pauseBar: {
    width: 3,
    height: 11,
    borderRadius: 1,
    backgroundColor: '#111',
  },
  scrub: {
    flex: 1,
    height: SCRUB_HEIGHT,
    justifyContent: 'center',
  },
  scrubTrack: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.25)',
  },
  scrubFill: {
    height: '100%',
    backgroundColor: BrandColors.lime,
  },
  scrubTick: {
    position: 'absolute',
    top: SCRUB_HEIGHT / 2 - 6,
    width: 2,
    height: 12,
    borderRadius: 1,
    backgroundColor: 'rgba(255,255,255,0.35)',
  },
  scrubTickOn: {
    backgroundColor: 'rgba(17,17,17,0.35)',
  },
  scrubThumb: {
    position: 'absolute',
    top: (SCRUB_HEIGHT - THUMB) / 2,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    backgroundColor: '#fff',
    borderWidth: 3,
    borderColor: BrandColors.lime,
  },
  banner: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 4,
    alignItems: 'center',
    gap: 8,
  },
  bannerCap: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: BrandColors.lime,
  },
  bannerName: {
    fontFamily: BrandFonts.medium,
    fontSize: 38,
    lineHeight: 40,
    letterSpacing: -1.4,
    color: '#fff',
    textShadowColor: 'rgba(0,0,0,0.35)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 30,
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
  scrim: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    zIndex: 8,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  wilt: {
    position: 'absolute',
    left: 12,
    right: 12,
    borderRadius: 40,
    paddingTop: 26,
    paddingHorizontal: 22,
    paddingBottom: 20,
    backgroundColor: SHEET,
    gap: 18,
  },
  gap8: { gap: 8 },
  gap10: { gap: 10 },
  gap12: { gap: 12 },
  eyebrowSoft: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    lineHeight: 13,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.75)',
  },
  wiltTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.3,
    color: '#fff',
  },
  body: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 22,
    color: '#fff',
  },
  stats: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    borderRadius: 22,
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.07)',
    gap: 8,
  },
  statLabel: {
    fontFamily: BrandFonts.medium,
    fontSize: 12,
    lineHeight: 14,
    color: 'rgba(255,255,255,0.75)',
  },
  statValue: {
    fontFamily: BrandFonts.medium,
    fontSize: 22,
    lineHeight: 24,
    color: '#fff',
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    height: 30,
    paddingHorizontal: 12,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    lineHeight: 16,
    color: '#fff',
  },
  primary: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  primaryPressed: {
    transform: [{ scale: 0.97 }],
  },
  revive: {
    height: 56,
    borderRadius: 28,
  },
  primaryText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    lineHeight: 19,
    color: '#111',
  },
  footnote: {
    paddingHorizontal: 10,
    textAlign: 'center',
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 18,
    color: 'rgba(255,255,255,0.8)',
  },
  rules: {
    width: '100%',
    borderRadius: 32,
    paddingTop: 26,
    paddingHorizontal: 24,
    paddingBottom: 22,
    backgroundColor: SHEET,
    gap: 18,
  },
  rulesTitle: {
    fontFamily: BrandFonts.medium,
    fontSize: 26,
    lineHeight: 29,
    letterSpacing: -0.9,
    color: '#fff',
  },
  rule: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  ruleDot: {
    width: 6,
    height: 6,
    marginTop: 8,
    borderRadius: 3,
  },
  ruleText: {
    flex: 1,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#fff',
  },
  gotIt: {
    height: 50,
    borderRadius: 25,
  },
  gotItText: {
    fontSize: 15,
    lineHeight: 18,
  },
});
