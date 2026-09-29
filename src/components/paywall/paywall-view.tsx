import { useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatureIcon } from '@/components/paywall/feature-icons';
import { PaywallAurora } from '@/components/paywall/paywall-aurora';
import { animate, rise, TOAST } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { PAID_FEATURES, PLANS, type PaidFeature, type PlanId } from '@/utils/subscription';

/** The design was drawn for a 390 × 844 phone; the glow scales from that. */
const DESIGN_WIDTH = 390;
/** Where the dawn's bottom edge lands, from PaywallAurora's box (hung at -420, 640 tall). */
const GLOW_BOTTOM = 220;
/** The gap between the dawn and the title. */
const CLEARANCE = 26;
/** Room the title, the promises, the plans and the buttons need below. */
const BODY_ROOM = 600;
const TOAST_MS = 2200;

/** What each paid feature promises, in the order the design lists them. */
const LINES: Record<PaidFeature, string> = {
  voice: 'talk it through the voice agent',
  garden: 'grow your dream garden',
  visualize: 'see every dream visualized',
  patterns: 'patterns across weeks of sleep',
  capsules: 'time capsules for future you',
};

type PaywallViewProps = {
  /** What tapping ✕ does. Null hides the close button (there is no way past this paywall). */
  onClose: (() => void) | null;
  /** They took the free week. */
  onTrial: (plan: PlanId) => void;
  /** They paid now, on `plan`. */
  onSubscribe: (plan: PlanId) => void;
  /** Line above the title when they got here by tapping something locked. */
  headline?: string | null;
};

/**
 * The paywall, from the Afterdream Paywall design: a dawn over the top of a black screen,
 * everything the subscription opens, the two plans, then the free week or paying now.
 */
export function PaywallView({ onClose, onTrial, onSubscribe, headline = null }: PaywallViewProps) {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [plan, setPlan] = useState<PlanId>(PLANS[0].id);
  const [toast, setToast] = useState<string | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  function showToast(message: string) {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_MS);
  }

  const scale = width / DESIGN_WIDTH;
  // The design starts the title 168 pt down a screen whose status bar is 54 pt, which puts it
  // over the lit part of the dawn on a tall phone. Start it below the glow instead, on the
  // black — unless the screen is too short to spare the room, where the design's place stands.
  const belowGlow = GLOW_BOTTOM * scale + CLEARANCE;
  const topPadding = Math.max(insets.top + 114 * scale, Math.min(belowGlow, height - BODY_ROOM));

  return (
    <View style={styles.screen}>
      <PaywallAurora scale={scale} />
      {/* Black rises over the glow, so the words below it sit on nothing. */}
      <View pointerEvents="none" style={[styles.fade, { height: 420 * scale }]} />

      {onClose && (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          hitSlop={10}
          onPress={onClose}
          style={({ pressed }) => [styles.close, { top: insets.top + 10 }, pressed && styles.pressed]}>
          <Text style={styles.closeMark}>✕</Text>
        </Pressable>
      )}

      <View style={[styles.body, { paddingTop: topPadding, paddingBottom: Math.max(insets.bottom + 6, 24) }]}>
        {headline && (
          <Animated.Text style={[styles.headline, rise(reduceMotion, 0)]} numberOfLines={2}>
            {headline}
          </Animated.Text>
        )}
        <Animated.Text accessibilityRole="header" style={[styles.title, rise(reduceMotion, 0)]}>
          unlock the whole dreamworld
        </Animated.Text>

        <Animated.View style={[styles.features, rise(reduceMotion, 100)]}>
          {PAID_FEATURES.map((feature) => (
            <View key={feature} style={styles.feature}>
              <FeatureIcon feature={feature} />
              <Text style={styles.featureText}>{LINES[feature]}</Text>
            </View>
          ))}
        </Animated.View>

        <View style={styles.spacer} />

        <Animated.View style={[styles.plans, rise(reduceMotion, 200)]}>
          {PLANS.map((option) => {
            const picked = option.id === plan;
            return (
              <Pressable
                key={option.id}
                accessibilityRole="radio"
                accessibilityState={{ selected: picked }}
                accessibilityLabel={`${option.name}, ${option.price}, ${option.week}`}
                onPress={() => setPlan(option.id)}
                style={({ pressed }) => [
                  styles.plan,
                  picked ? styles.planPicked : styles.planPlain,
                  pressed && styles.pressed,
                ]}>
                <View style={styles.planNames}>
                  <Text style={styles.planName}>{option.name}</Text>
                  <Text style={styles.planPrice}>{option.price}</Text>
                </View>
                <Text style={styles.planWeek}>{option.week}</Text>
                {option.badge && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{option.badge}</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </Animated.View>

        <Animated.View style={[styles.actions, rise(reduceMotion, 300)]}>
          <Pressable
            accessibilityRole="button"
            onPress={() => onTrial(plan)}
            style={({ pressed }) => [styles.trial, pressed && styles.pressed]}>
            <Text style={styles.trialText}>try 7 days free</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => onSubscribe(plan)}
            style={({ pressed }) => [styles.pay, pressed && styles.pressed]}>
            <Text style={styles.payText}>pay now</Text>
          </Pressable>
          <View style={styles.links}>
            {(['terms', 'restore', 'privacy'] as const).map((link) => (
              <Pressable
                key={link}
                accessibilityRole="link"
                hitSlop={8}
                onPress={() => showToast(`${link} is coming soon ✦`)}>
                <Text style={styles.link}>{link}</Text>
              </Pressable>
            ))}
          </View>
        </Animated.View>
      </View>

      {toast && (
        <View pointerEvents="none" style={[styles.toastRow, { bottom: Math.max(insets.bottom, 16) + 104 }]}>
          <Animated.Text
            style={[styles.toast, animate(reduceMotion, { animationName: TOAST, animationDuration: TOAST_MS, animationTimingFunction: 'ease' })]}>
            {toast}
          </Animated.Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: '#000000',
  },
  fade: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    experimental_backgroundImage: 'linear-gradient(180deg, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 56%, #000 100%)',
  },
  close: {
    position: 'absolute',
    left: 20,
    zIndex: 3,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  closeMark: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    color: '#FFFFFF',
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.97 }],
  },
  body: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 26,
  },
  headline: {
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 18,
    letterSpacing: 0.2,
    color: BrandColors.lime,
  },
  title: {
    textAlign: 'center',
    fontFamily: BrandFonts.medium,
    fontSize: 34,
    lineHeight: 36,
    letterSpacing: -1.3,
    color: '#FFFFFF',
  },
  features: {
    gap: 15,
    paddingHorizontal: 26,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  featureText: {
    flex: 1,
    fontFamily: BrandFonts.regular,
    fontSize: 17,
    lineHeight: 21,
    color: '#FFFFFF',
  },
  spacer: {
    flex: 1,
    minHeight: 8,
  },
  plans: {
    gap: 10,
  },
  plan: {
    height: 66,
    borderRadius: 22,
    borderWidth: 1.5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  planPicked: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: '#FFFFFF',
  },
  planPlain: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderColor: 'transparent',
  },
  planNames: {
    gap: 5,
  },
  planName: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    color: '#FFFFFF',
  },
  planPrice: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  planWeek: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    color: '#FFFFFF',
  },
  badge: {
    position: 'absolute',
    top: -10,
    right: 18,
    height: 20,
    paddingHorizontal: 9,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: BrandColors.lime,
  },
  badgeText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
    letterSpacing: 0.3,
    color: BrandColors.ink,
  },
  actions: {
    gap: 10,
  },
  trial: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  trialText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
    color: BrandColors.ink,
  },
  pay: {
    height: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  payText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    color: '#FFFFFF',
  },
  links: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingTop: 4,
  },
  link: {
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  toastRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 6,
  },
  toast: {
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 22,
    overflow: 'hidden',
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    color: BrandColors.ink,
    backgroundColor: '#FFFFFF',
  },
});
