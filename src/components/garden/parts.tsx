import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { HeaderButton } from '@/components/today/brand-bar';
import { animate, EASE_OUT, FADE } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { FULL_GROWTH, GARDEN_RULES, type PickCard } from '@/utils/garden';

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

/** "day 12 / 60" and a thin bar, while the demo plays. */
export function DemoCounter({ day, reduceMotion }: { day: number; reduceMotion: boolean }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.counter, animate(reduceMotion, { animationName: FADE, animationDuration: 400, animationTimingFunction: 'ease' })]}>
      <Text style={styles.counterText}>
        day {day} / {FULL_GROWTH}
      </Text>
      <View style={styles.counterTrack}>
        <View style={[styles.counterFill, { width: `${Math.round((day / FULL_GROWTH) * 100)}%` }]} />
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
  counter: {
    position: 'absolute',
    left: 22,
    zIndex: 4,
    gap: 6,
  },
  counterText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    letterSpacing: 0.2,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
  counterTrack: {
    width: 64,
    height: 2,
    borderRadius: 1,
    overflow: 'hidden',
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  counterFill: {
    height: '100%',
    backgroundColor: '#fff',
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
