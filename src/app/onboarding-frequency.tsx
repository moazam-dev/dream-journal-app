import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { DreamWeek } from '@/components/onboarding/dream-week';
import { entrance } from '@/components/onboarding/motion';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { StarDust } from '@/components/onboarding/star-dust';
import { saveProfileRecall } from '@/lib/profile';
import { RECALL_ANSWERS, RECALLS, type Recall } from '@/utils/recall';

/** Onboarding has 5 steps; this is the fourth. */
const STEPS = 5;

/** A picked answer springs up a little (overshoots, then settles). */
const SPRING = cubicBezier(0.3, 1.6, 0.5, 1);

const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 10 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
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
  { word: 'how', delay: 400 },
  { word: 'often', delay: 500 },
  { word: 'do', delay: 600 },
  { word: 'you', delay: 700 },
  { word: 'remember', delay: 850, accent: true },
  { word: 'your', delay: 950 },
  { word: 'dreams?', delay: 1050 },
];

/**
 * Onboarding step 4 ("/onboarding-frequency"), after gender, from the
 * Afterdream Onboarding Frequency design: "how often do you remember your dreams?".
 * Each answer tints the question and lights up that many nights of a sample week.
 */
export default function OnboardingFrequencyScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [recall, setRecall] = useState<Recall | null>(null);
  const [done, setDone] = useState(false);
  // Coming back from a later step: let them continue again.
  useFocusEffect(useCallback(() => setDone(false), []));

  const answer = recall ? RECALL_ANSWERS[recall] : null;
  const accent = answer?.color ?? BrandColors.lime;

  function handlePick(next: Recall) {
    setRecall(next);
    setDone(false);
  }

  function handleNext() {
    if (!recall || done) return;
    setDone(true);
    saveProfileRecall(recall);
    goToVision();
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/onboarding-gender');
  }

  function animate(style: object) {
    return entrance(reduceMotion, style);
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <StarDust top={insets.top} reduceMotion={reduceMotion} count={16} spread={170} color={NightColors.text} />

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={handleBack} hitSlop={4}>
          {({ pressed }) => (
            <View style={[styles.back, pressed && styles.backPressed]}>
              <Text style={styles.backText}>←</Text>
            </View>
          )}
        </Pressable>
        <ProgressBar steps={STEPS} current={4} reduceMotion={reduceMotion} />
        <Pressable accessibilityRole="button" onPress={goToVision} hitSlop={8} style={styles.skip}>
          {({ pressed }) => <Text style={[styles.skipText, pressed && styles.skipPressed]}>skip</Text>}
        </Pressable>
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 96, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.intro}>
          {/* Each word floats up in turn; screen readers hear the whole question at once. */}
          <View accessible accessibilityRole="header" accessibilityLabel="how often do you remember your dreams?" style={styles.title}>
            {TITLE_WORDS.map(({ word, delay, accent: tinted }) => (
              <Animated.Text
                key={word}
                style={[
                  styles.titleText,
                  tinted && {
                    color: accent,
                    transitionProperty: 'color',
                    transitionDuration: reduceMotion ? 0 : 500,
                    transitionTimingFunction: 'ease',
                  },
                  animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: delay, animationTimingFunction: 'ease' }),
                ]}>
                {word}
              </Animated.Text>
            ))}
          </View>
          <Animated.Text
            style={[styles.subtitle, animate({ animationName: FADE, animationDuration: 700, animationDelay: 1300, animationTimingFunction: 'ease' })]}>
            Most dreams fade within minutes. Let&apos;s help you keep yours.
          </Animated.Text>
        </View>

        <Animated.View
          accessible
          accessibilityLabel={answer ? `Your dream week: ${answer.caption}` : 'Your dream week'}
          style={[styles.week, animate({ animationName: UP, animationDuration: 700, animationDelay: 1200, animationTimingFunction: 'ease' })]}>
          <DreamWeek nights={answer?.nights ?? 0} color={accent} reduceMotion={reduceMotion} />
        </Animated.View>
        <Animated.Text
          importantForAccessibility="no"
          style={[styles.caption, animate({ animationName: FADE, animationDuration: 600, animationDelay: 1500, animationTimingFunction: 'ease' })]}>
          {answer?.caption ?? 'your dream week'}
        </Animated.Text>

        <View style={styles.options} accessibilityRole="radiogroup" accessibilityLabel="How often you remember your dreams">
          {RECALLS.map((option, k) => {
            const on = option === recall;
            const { label, color } = RECALL_ANSWERS[option];
            return (
              <Animated.View
                key={option}
                style={animate({ animationName: UP, animationDuration: 600, animationDelay: 1400 + k * 70, animationTimingFunction: 'ease' })}>
                <Pressable accessibilityRole="radio" accessibilityState={{ selected: on }} accessibilityLabel={label} onPress={() => handlePick(option)}>
                  {({ pressed }) => (
                    <Animated.View
                      style={[
                        styles.option,
                        {
                          backgroundColor: on ? color : OPTION_OFF,
                          borderColor: on ? color : OPTION_BORDER,
                          transform: [{ scale: pressed ? 0.97 : on ? 1.02 : 1 }],
                          transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
                          transitionDuration: reduceMotion ? 0 : [300, 300, 250],
                          transitionTimingFunction: ['ease', 'ease', SPRING],
                        },
                      ]}>
                      <Animated.View
                        style={[
                          styles.optionDot,
                          {
                            backgroundColor: on ? BrandColors.ink : color,
                            transitionProperty: 'backgroundColor',
                            transitionDuration: reduceMotion ? 0 : 300,
                            transitionTimingFunction: 'ease',
                          },
                        ]}
                      />
                      <Animated.Text
                        style={[
                          styles.optionText,
                          {
                            color: on ? BrandColors.ink : NightColors.text,
                            transitionProperty: 'color',
                            transitionDuration: reduceMotion ? 0 : 300,
                            transitionTimingFunction: 'ease',
                          },
                        ]}>
                        {label}
                      </Animated.Text>
                      <Animated.Text
                        style={[
                          styles.check,
                          {
                            opacity: on ? 1 : 0,
                            transitionProperty: 'opacity',
                            transitionDuration: reduceMotion ? 0 : 300,
                            transitionTimingFunction: 'ease',
                          },
                        ]}>
                        ✓
                      </Animated.Text>
                    </Animated.View>
                  )}
                </Pressable>
              </Animated.View>
            );
          })}
        </View>

        <Animated.View
          style={animate({ animationName: UP, animationDuration: 700, animationDelay: 1900, animationTimingFunction: cubicBezier(0.2, 0.8, 0.2, 1) })}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !answer }}
            accessibilityHint={answer ? undefined : 'Pick an answer first'}
            disabled={!answer || done}
            onPress={handleNext}>
            {({ pressed }) => (
              <Animated.View
                style={[
                  styles.next,
                  {
                    backgroundColor: answer ? accent : NightColors.pillOff,
                    transform: [{ scale: pressed ? 0.97 : 1 }],
                    transitionProperty: ['backgroundColor', 'transform'],
                    transitionDuration: reduceMotion ? 0 : [350, 200],
                    transitionTimingFunction: 'ease',
                  },
                ]}>
                <Animated.Text
                  style={[
                    styles.nextText,
                    {
                      color: answer ? BrandColors.ink : NightColors.buttonOffText,
                      transitionProperty: 'color',
                      transitionDuration: reduceMotion ? 0 : 350,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  {done ? 'got it ✦' : 'next'}
                </Animated.Text>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

function goToVision() {
  router.push('/onboarding-vision');
}

/** Unpicked answer: a hair lighter than the black screen. */
const OPTION_OFF = '#0F0F0F';
const OPTION_BORDER = '#232323';

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
    gap: 14,
  },
  intro: {
    paddingHorizontal: 8,
    gap: 10,
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
    letterSpacing: -1.2,
    color: NightColors.text,
  },
  subtitle: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 21,
    color: '#9A9A9A',
  },
  week: {
    height: 84,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#1E1E1E',
    backgroundColor: '#0D0D0D',
    justifyContent: 'center',
  },
  caption: {
    marginTop: -4,
    fontFamily: BrandFonts.regular,
    fontSize: 13,
    lineHeight: 16,
    textAlign: 'center',
    color: NightColors.hint,
  },
  options: {
    flex: 1,
    gap: 8,
  },
  option: {
    height: 50,
    paddingHorizontal: 18,
    borderRadius: 18,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  optionDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  optionText: {
    flex: 1,
    fontFamily: BrandFonts.medium,
    fontSize: 17,
  },
  check: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    color: BrandColors.ink,
  },
  next: {
    height: 58,
    borderRadius: 29,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nextText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 17,
  },
});
