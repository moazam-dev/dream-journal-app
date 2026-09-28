import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { GoalShape } from '@/components/onboarding/goal-shape';
import { entrance } from '@/components/onboarding/motion';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { saveProfileGoals } from '@/lib/profile';
import { GOAL_TILES, GOALS, goalsSubtitle, toggleGoal, type Goal } from '@/utils/goals';

/** Onboarding has 5 steps; this is the last. */
const STEPS = 5;
/** Tiles show two to a row. */
const ROWS = [GOALS.slice(0, 2), GOALS.slice(2, 4), GOALS.slice(4, 6)];

/** A picked tile springs a little (overshoots, then settles). */
const SPRING = cubicBezier(0.3, 1.5, 0.5, 1);
const EASE_OUT = cubicBezier(0.2, 0.8, 0.2, 1);

const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 10 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const TILE_IN = {
  from: { opacity: 0, transform: [{ translateY: 24 }, { scale: 0.92 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
};
const UP = {
  from: { opacity: 0, transform: [{ translateY: 16 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const FADE = {
  from: { opacity: 0 },
  to: { opacity: 1 },
};

const TITLE_WORDS = [
  { word: 'last', delay: 400 },
  { word: 'one.', delay: 500 },
  { word: 'what', delay: 650 },
  { word: 'do', delay: 750 },
  { word: 'you', delay: 850 },
  { word: 'want', delay: 1000, accent: true },
  { word: 'from', delay: 1100, accent: true },
  { word: 'your', delay: 1200, accent: true },
  { word: 'nights?', delay: 1300, accent: true },
];

/**
 * Onboarding step 5 ("/onboarding-vision"), after dream recall, from the
 * Afterdream Onboarding Vision design: "last one. what do you want from your nights?".
 * Tap any number of goal tiles; each fills with its own colour.
 */
export default function OnboardingVisionScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [picked, setPicked] = useState<Goal[]>([]);
  const [done, setDone] = useState(false);
  // Coming back to this screen: let them finish again.
  useFocusEffect(useCallback(() => setDone(false), []));

  const count = picked.length;
  // Tile text eases between white and ink as it's picked.
  const colorFade = { transitionProperty: 'color', transitionDuration: reduceMotion ? 0 : 350, transitionTimingFunction: 'ease' } as const;

  function handleToggle(goal: Goal) {
    setDone(false);
    setPicked((current) => toggleGoal(current, goal));
  }

  function handleFinish() {
    if (!count || done) return;
    setDone(true);
    saveProfileGoals(picked);
    leaveOnboarding();
  }

  function handleSkip() {
    leaveOnboarding();
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/onboarding-frequency');
  }

  function animate(style: object) {
    return entrance(reduceMotion, style);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={handleBack} hitSlop={4}>
          {({ pressed }) => (
            <View style={[styles.back, pressed && styles.backPressed]}>
              <Text style={styles.backText}>←</Text>
            </View>
          )}
        </Pressable>
        <ProgressBar steps={STEPS} current={5} reduceMotion={reduceMotion} />
        <Pressable accessibilityRole="button" onPress={handleSkip} hitSlop={8} style={styles.skip}>
          {({ pressed }) => <Text style={[styles.skipText, pressed && styles.skipPressed]}>skip</Text>}
        </Pressable>
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 64, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.intro}>
          {/* Each word floats up in turn; screen readers hear the whole question at once. */}
          <View accessible accessibilityRole="header" accessibilityLabel="last one. what do you want from your nights?" style={styles.title}>
            {TITLE_WORDS.map(({ word, delay, accent }) => (
              <Animated.Text
                key={word}
                style={[
                  styles.titleText,
                  accent && styles.titleAccent,
                  animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: delay, animationTimingFunction: 'ease' }),
                ]}>
                {word}
              </Animated.Text>
            ))}
          </View>
          <Animated.Text
            accessibilityLiveRegion="polite"
            style={[styles.subtitle, animate({ animationName: FADE, animationDuration: 700, animationDelay: 1400, animationTimingFunction: 'ease' })]}>
            {goalsSubtitle(count)}
          </Animated.Text>
        </View>

        <View style={styles.grid} accessibilityLabel="What you want from your nights">
          {ROWS.map((row, r) => (
            <View key={r} style={styles.row}>
              {row.map((goal) => {
                const k = GOALS.indexOf(goal);
                const on = picked.includes(goal);
                const { label, color, shape } = GOAL_TILES[goal];
                return (
                  <Animated.View
                    key={goal}
                    style={[
                      styles.tileSlot,
                      animate({ animationName: TILE_IN, animationDuration: 600, animationDelay: 1300 + k * 70, animationTimingFunction: EASE_OUT }),
                    ]}>
                    <Pressable
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: on }}
                      accessibilityLabel={label}
                      onPress={() => handleToggle(goal)}
                      style={styles.tileSlot}>
                      {({ pressed }) => (
                        <Animated.View
                          style={[
                            styles.tile,
                            {
                              backgroundColor: on ? color : TILE_OFF,
                              borderColor: on ? color : TILE_BORDER,
                              transform: [{ scale: pressed ? 0.95 : on ? 0.98 : 1 }],
                              transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
                              transitionDuration: reduceMotion ? 0 : [350, 350, 300],
                              transitionTimingFunction: ['ease', 'ease', SPRING],
                            },
                          ]}>
                          <Animated.View
                            style={[
                              styles.checkBadge,
                              {
                                borderColor: on ? BrandColors.ink : CHECK_RING_OFF,
                                backgroundColor: on ? BrandColors.ink : 'transparent',
                              },
                              {
                                transitionProperty: 'backgroundColor',
                                transitionDuration: reduceMotion ? 0 : 350,
                                transitionTimingFunction: 'ease',
                              },
                            ]}>
                            <Animated.Text style={[styles.checkText, { color: on ? color : 'transparent', ...colorFade }]}>✓</Animated.Text>
                          </Animated.View>
                          <GoalShape shape={shape} color={on ? BrandColors.ink : color} bobDelay={k * 0.6} reduceMotion={reduceMotion} />
                          <Animated.Text style={[styles.tileText, { color: on ? BrandColors.ink : NightColors.text, ...colorFade }]}>
                            {label}
                          </Animated.Text>
                        </Animated.View>
                      )}
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          ))}
        </View>

        <Animated.View style={animate({ animationName: UP, animationDuration: 700, animationDelay: 1900, animationTimingFunction: EASE_OUT })}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !count }}
            accessibilityHint={count ? undefined : 'Pick at least one first'}
            disabled={!count || done}
            onPress={handleFinish}>
            {({ pressed }) => (
              <Animated.View
                style={[
                  styles.finish,
                  {
                    backgroundColor: count ? BrandColors.lime : NightColors.pillOff,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    transitionProperty: ['backgroundColor', 'transform'],
                    transitionDuration: reduceMotion ? 0 : [350, 200],
                    transitionTimingFunction: 'ease',
                  },
                ]}>
                <Animated.Text
                  style={[
                    styles.finishText,
                    {
                      color: count ? BrandColors.ink : NightColors.buttonOffText,
                      transitionProperty: 'color',
                      transitionDuration: reduceMotion ? 0 : 350,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  {done ? "let's dream ✦" : 'finish'}
                </Animated.Text>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

/** Onboarding is done (or skipped): on to the "personalizing" reveal, which then takes them Home. */
function leaveOnboarding() {
  router.push('/personalizing');
}

/** Unpicked tile: a hair lighter than the black screen. */
const TILE_OFF = '#0E0E0E';
const TILE_BORDER = '#1F1F1F';
const CHECK_RING_OFF = '#333333';

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: NightColors.background,
  },
  topBar: {
    position: 'absolute',
    zIndex: 1,
    left: 16,
    right: 20,
    height: 40,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: NightColors.pillOff,
  },
  backPressed: {
    backgroundColor: '#262626',
  },
  backText: {
    fontFamily: BrandFonts.regular,
    fontSize: 18,
    color: NightColors.text,
  },
  skip: {
    paddingVertical: 8,
    paddingHorizontal: 2,
  },
  skipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    color: NightColors.hint,
  },
  skipPressed: {
    color: NightColors.text,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    gap: 20,
  },
  intro: {
    paddingHorizontal: 6,
    gap: 8,
  },
  title: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 30,
    lineHeight: 33,
    letterSpacing: -1.1,
    color: NightColors.text,
  },
  titleAccent: {
    color: BrandColors.lime,
  },
  subtitle: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: NightColors.hint,
  },
  grid: {
    flex: 1,
    minHeight: 0,
    gap: 10,
  },
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: 10,
  },
  tileSlot: {
    flex: 1,
  },
  tile: {
    flex: 1,
    overflow: 'hidden',
    padding: 16,
    borderRadius: 26,
    borderWidth: 1,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  checkBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 11,
  },
  tileText: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    lineHeight: 20,
    letterSpacing: -0.3,
  },
  finish: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 17,
  },
});
