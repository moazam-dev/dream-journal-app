import { Image } from 'expo-image';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle } from 'react-native-svg';

import { animate, EASE_OUT, loop } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { reminderHeadline, reminderNote } from '@/utils/subscription';

const GHOST = require('@/assets/images/ghost-body.png');

/** The design's card (390 pt phone): hung off the bottom, 12 pt clear of each side. */
const CARD_HEIGHT = 300;
const SIDE = 12;

/** The ghost, leaning out of the bottom-left corner. */
const GHOST_SIZE = 210;

/** Slides up from below, the design's `transform .5s cubic-bezier(.2,.8,.2,1)`. */
const SLIDE = {
  from: { transform: [{ translateY: 420 }] },
  to: { transform: [{ translateY: 0 }] },
};

/** The ghost drifts and rights itself every 7 s (`rFloat`). */
const FLOAT = {
  '0%': { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '-6deg' }] },
  '50%': { transform: [{ translateX: 6 }, { translateY: -8 }, { rotate: '-2deg' }] },
  '100%': { transform: [{ translateX: 0 }, { translateY: 0 }, { rotate: '-6deg' }] },
};

type TrialReminderProps = {
  /** Set while a paid feature is being nudged about; null hides the card. */
  feature: unknown;
  daysLeft: number;
  /** The day the week runs out, as the design writes it ("mar 15"). */
  endsOn: string;
  /** "not now": through to the feature, quiet until the app is opened again. */
  onContinue: () => void;
  /** "upgrade": on to the full paywall. */
  onSubscribe: () => void;
};

/**
 * The nudge on the way into a paid feature during the free trial, from the Afterdream
 * Today · Trial Reminder v2 design: the ghost leaning in from the bottom-left over a
 * fading dot field, the days left large on the right, and two small buttons.
 *
 * Deliberately not a second paywall: no plans, no pricing, nothing but the countdown.
 * "not now" always carries on into the feature.
 */
export function TrialReminder({ feature, daysLeft, endsOn, onContinue, onSubscribe }: TrialReminderProps) {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  if (!feature) return null;

  return (
    <Modal visible transparent animationType="fade" onRequestClose={onContinue} statusBarTranslucent>
      <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" style={styles.scrim} onPress={onContinue} />
      <View style={[styles.dock, { paddingBottom: Math.max(insets.bottom, SIDE) }]} pointerEvents="box-none">
        <Animated.View
          style={[
            styles.card,
            animate(reduceMotion, { animationName: SLIDE, animationDuration: 500, animationTimingFunction: EASE_OUT }),
          ]}>
          <DotField />

          <Animated.View style={[styles.ghost, loop(reduceMotion, FLOAT, 7000)]}>
            <Image source={GHOST} style={styles.ghostImage} tintColor={BrandColors.lime} contentFit="contain" />
          </Animated.View>

          <View style={styles.body}>
            <View style={styles.words}>
              <Text style={styles.eyebrow}>free trial</Text>
              <Text style={styles.headline} accessibilityRole="header">
                {reminderHeadline(daysLeft)}
              </Text>
              <Text style={styles.note} numberOfLines={1} adjustsFontSizeToFit>
                {reminderNote(endsOn)}
              </Text>
            </View>

            <View style={styles.buttons}>
              <Pressable
                accessibilityRole="button"
                onPress={onContinue}
                style={({ pressed }) => [styles.later, pressed && styles.pressedSoft]}>
                <Text style={styles.laterText}>not now</Text>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                onPress={onSubscribe}
                style={({ pressed }) => [styles.upgrade, pressed && styles.pressed]}>
                <Text style={styles.upgradeText}>upgrade</Text>
              </Pressable>
            </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

/** Field size, dot spacing and radius from the design's 14 pt repeating dot background. */
const FIELD = { width: 190, height: 170, step: 14, radius: 1.3 };
/** The design fades the field out with `radial-gradient(circle at 0 0, #000 20%, transparent 75%)`. */
const FADE_FROM = 0.2;
const FADE_TO = 0.75;
const DOT_OPACITY = 0.35;

/**
 * The dot field in the card's top-left corner, densest at the corner and gone by the middle.
 * CSS does this with a repeating background and a mask; here each dot carries its own
 * opacity, worked out from how far it sits from the corner.
 */
function DotField() {
  // `circle at 0 0` with no size reaches the far corner, which is what the fade is measured against.
  const reach = Math.hypot(FIELD.width, FIELD.height);
  const dots = [];
  for (let x = FIELD.step / 2; x < FIELD.width; x += FIELD.step) {
    for (let y = FIELD.step / 2; y < FIELD.height; y += FIELD.step) {
      const spread = (Math.hypot(x, y) / reach - FADE_FROM) / (FADE_TO - FADE_FROM);
      const opacity = DOT_OPACITY * (1 - Math.min(1, Math.max(0, spread)));
      if (opacity > 0.01) dots.push(<Circle key={`${x}-${y}`} cx={x} cy={y} r={FIELD.radius} fill="#EEF2C8" opacity={opacity} />);
    }
  }
  return (
    <View pointerEvents="none" style={styles.field}>
      <Svg width={FIELD.width} height={FIELD.height}>{dots}</Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  dock: {
    ...StyleSheet.absoluteFill,
    justifyContent: 'flex-end',
    paddingHorizontal: SIDE,
  },
  card: {
    height: CARD_HEIGHT,
    borderRadius: 36,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.07)',
    backgroundColor: '#101114',
    boxShadow: '0 20px 60px rgba(0, 0, 0, 0.5)',
  },
  field: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  ghost: {
    position: 'absolute',
    left: -24,
    bottom: -26,
    width: GHOST_SIZE,
    height: GHOST_SIZE,
  },
  ghostImage: {
    width: '100%',
    height: '100%',
  },
  body: {
    flex: 1,
    alignItems: 'flex-end',
    paddingTop: 34,
    paddingRight: 24,
    paddingBottom: 24,
    paddingLeft: 110,
  },
  words: {
    width: '100%',
    alignItems: 'flex-end',
    gap: 8,
  },
  eyebrow: {
    fontFamily: BrandFonts.semibold,
    fontSize: 13,
    color: BrandColors.lime,
  },
  headline: {
    width: '100%',
    textAlign: 'right',
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 35,
    letterSpacing: -1.3,
    color: '#FFFFFF',
  },
  note: {
    width: '100%',
    textAlign: 'right',
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  buttons: {
    marginTop: 'auto',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  later: {
    height: 40,
    paddingHorizontal: 14,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laterText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  upgrade: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  upgradeText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 14,
    color: BrandColors.ink,
  },
  pressed: {
    transform: [{ scale: 0.96 }],
  },
  pressedSoft: {
    opacity: 0.6,
  },
});
