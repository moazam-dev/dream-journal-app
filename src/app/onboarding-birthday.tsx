import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { BirthMoon } from '@/components/onboarding/birth-moon';
import { DateRuler } from '@/components/onboarding/date-ruler';
import { entrance } from '@/components/onboarding/motion';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { StarDust } from '@/components/onboarding/star-dust';
import { loadProfileName, saveProfileBirthday } from '@/lib/profile';
import { daysInMonth, moonPhase } from '@/utils/moon';

/** Onboarding has 5 steps; this is the second. */
const STEPS = 5;

const FIRST_YEAR = 1940;
const LAST_YEAR = 2012;
const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
const MONTHS_LONG = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december',
];
const YEARS = Array.from({ length: LAST_YEAR - FIRST_YEAR + 1 }, (_, i) => String(FIRST_YEAR + i));
const QUESTION = ['what', 'moon', 'were', 'you', 'born', 'under?'];

type Part = 'month' | 'day' | 'year';

const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 10 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };
const UP = {
  from: { opacity: 0, transform: [{ translateY: 16 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};

/**
 * Onboarding step 2 ("/onboarding-birthday"), after the name, from the
 * Afterdream Onboarding Birthday design: "what moon were you born under?"
 * Pick month, day and year on a ruler; the moon above shows its phase on that date.
 */
export default function OnboardingBirthdayScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [name] = useState(loadProfileName);
  // Starts on 14 April 2000, like the design. `day` is 0-based.
  const [month, setMonth] = useState(3);
  const [day, setDay] = useState(13);
  const [yearIndex, setYearIndex] = useState(60);
  const [part, setPart] = useState<Part>('month');
  const [touched, setTouched] = useState(false);
  const [done, setDone] = useState(false);
  // Coming back from the gender screen: let them continue again.
  useFocusEffect(useCallback(() => setDone(false), []));

  const year = FIRST_YEAR + yearIndex;
  const dayCount = daysInMonth(year, month);
  // Keep the day in range when the month or year gets shorter (31 Mar → Feb).
  const safeDay = Math.min(day, dayCount - 1);
  const phase = moonPhase(year, month, safeDay + 1);

  const ruler: Record<Part, { labels: string[]; index: number; set: (i: number) => void }> = {
    month: { labels: MONTHS, index: month, set: setMonth },
    day: { labels: Array.from({ length: dayCount }, (_, i) => String(i + 1)), index: safeDay, set: setDay },
    year: { labels: YEARS, index: yearIndex, set: setYearIndex },
  };
  const tabs: { part: Part; label: string }[] = [
    { part: 'month', label: MONTHS_LONG[month] },
    { part: 'day', label: String(safeDay + 1) },
    { part: 'year', label: String(year) },
  ];

  function handleRulerChange(i: number) {
    ruler[part].set(i);
    setTouched(true);
    setDone(false);
  }

  function handleNext() {
    if (!touched || done) return;
    setDone(true);
    saveProfileBirthday(year, month, safeDay + 1);
    // `push` so the gender screen's back button returns here.
    router.push('/onboarding-gender');
  }

  /** Skips only this question. */
  function handleSkip() {
    router.push('/onboarding-gender');
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/onboarding-name');
  }

  function animate(style: object) {
    return entrance(reduceMotion, style);
  }

  const greeting = name ? `hey ${name},` : 'hey you,';

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />
      <StarDust top={insets.top} reduceMotion={reduceMotion} />

      <View style={[styles.topBar, { top: insets.top + 6 }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={handleBack} hitSlop={4}>
          {({ pressed }) => (
            <View style={[styles.back, pressed && styles.backPressed]}>
              <Text style={styles.backText}>←</Text>
            </View>
          )}
        </Pressable>
        <ProgressBar steps={STEPS} current={2} reduceMotion={reduceMotion} />
        <Pressable accessibilityRole="button" onPress={handleSkip} hitSlop={8} style={styles.skip}>
          {({ pressed }) => <Text style={[styles.skipText, pressed && styles.skipPressed]}>skip</Text>}
        </Pressable>
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 70, paddingBottom: insets.bottom + 24 }]}>
        {/* Each word floats up in turn; screen readers hear the whole question at once. */}
        <View
          style={styles.title}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${greeting} ${QUESTION.join(' ')}`}>
          <Animated.Text
            style={[styles.titleText, animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: 400, animationTimingFunction: 'ease' })]}>
            {greeting}
          </Animated.Text>
          <View style={styles.lineBreak} />
          {QUESTION.map((word, k) => (
            <Animated.Text
              key={word}
              style={[
                styles.titleText,
                styles.accent,
                animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: 700 + k * 100, animationTimingFunction: 'ease' }),
              ]}>
              {word}
            </Animated.Text>
          ))}
        </View>

        <View style={styles.moonArea}>
          <BirthMoon cycle={phase.cycle} reduceMotion={reduceMotion} />
          <Animated.Text
            accessibilityLiveRegion="polite"
            style={[styles.phaseName, animate({ animationName: FADE, animationDuration: 600, animationDelay: 1600, animationTimingFunction: 'ease' })]}>
            born under {phase.name}
          </Animated.Text>
        </View>

        <Animated.View
          style={[styles.tabs, animate({ animationName: UP, animationDuration: 700, animationDelay: 1300, animationTimingFunction: 'ease' })]}>
          {tabs.map((tab) => {
            const on = tab.part === part;
            return (
              <Pressable
                key={tab.part}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                accessibilityLabel={`${tab.part}, ${tab.label}`}
                onPress={() => setPart(tab.part)}>
                <Animated.Text
                  style={[
                    styles.tabText,
                    {
                      color: on ? BrandColors.lime : NightColors.text,
                      borderBottomColor: on ? BrandColors.lime : 'transparent',
                      transitionProperty: ['color', 'borderBottomColor'],
                      transitionDuration: reduceMotion ? 0 : 250,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  {tab.label}
                </Animated.Text>
              </Pressable>
            );
          })}
        </Animated.View>

        <Animated.View
          style={[styles.rulerWrap, animate({ animationName: UP, animationDuration: 700, animationDelay: 1500, animationTimingFunction: 'ease' })]}>
          {/* A fresh ruler per part, so it starts centred on that part's value. */}
          <DateRuler
            key={part}
            labels={ruler[part].labels}
            index={ruler[part].index}
            onChange={handleRulerChange}
            accessibilityLabel={`Birth ${part}`}
            reduceMotion={reduceMotion}
          />
        </Animated.View>

        <Animated.View
          style={animate({ animationName: UP, animationDuration: 700, animationDelay: 1700, animationTimingFunction: cubicBezier(0.2, 0.8, 0.2, 1) })}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !touched }}
            accessibilityHint={touched ? undefined : 'Pick your birthday on the ruler first'}
            disabled={!touched || done}
            onPress={handleNext}>
            {({ pressed }) => (
              <Animated.View
                style={[
                  styles.next,
                  {
                    backgroundColor: touched ? BrandColors.lime : NightColors.pillOff,
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
                      color: touched ? BrandColors.ink : NightColors.buttonOffText,
                      transitionProperty: 'color',
                      transitionDuration: reduceMotion ? 0 : 350,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  {done ? 'written in the stars ✦' : 'next'}
                </Animated.Text>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

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
    paddingHorizontal: 24,
  },
  title: {
    paddingHorizontal: 4,
    flexDirection: 'row',
    flexWrap: 'wrap',
    columnGap: 9,
  },
  lineBreak: {
    width: '100%',
    height: 0,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 32,
    lineHeight: 36,
    letterSpacing: -1.1,
    color: NightColors.text,
  },
  accent: {
    color: BrandColors.lime,
  },
  // Takes the space between the question and the picker; the moon floats in its middle.
  moonArea: {
    flex: 1,
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  phaseName: {
    fontFamily: BrandFonts.medium,
    fontSize: 15,
    letterSpacing: 0.3,
    color: '#BDBDBD',
  },
  tabs: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 14,
  },
  tabText: {
    paddingTop: 4,
    paddingHorizontal: 2,
    paddingBottom: 8,
    borderBottomWidth: 2,
    fontFamily: BrandFonts.medium,
    fontSize: 38,
    lineHeight: 42,
    letterSpacing: -1.4,
  },
  rulerWrap: {
    marginTop: 30,
    marginBottom: 56,
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
