import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useState } from 'react';
import { Keyboard, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { cubicBezier, useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { entrance } from '@/components/onboarding/motion';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { StarDust } from '@/components/onboarding/star-dust';
import { loadProfileName, saveProfileGender } from '@/lib/profile';
import { GENDER_CHIPS, GENDERS, genderSlot, MAX_GENDER_WORDS_LENGTH, type Gender } from '@/utils/gender';

/** Onboarding has 5 steps; this is the third. */
const STEPS = 5;

const PLACEHOLDER_DASHES = 15;
/** Chip springs up a little when picked (overshoots, then settles). */
const SPRING = cubicBezier(0.3, 1.6, 0.5, 1);

const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 10 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const SWAP_IN = {
  from: { opacity: 0, transform: [{ translateY: 12 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const UP = {
  from: { opacity: 0, transform: [{ translateY: 16 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const OPEN = {
  from: { opacity: 0, transform: [{ translateY: -8 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const BLINK = {
  '0%': { opacity: 0.25 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.25 },
};

/**
 * Onboarding step 3 ("/onboarding-gender"), after the birthday and before dream recall, from the
 * Afterdream Onboarding Gender design: "in the story of Sam, the dreamer is ___".
 * Picking a chip fills in the blank; "self-describe" opens a field for their own words.
 */
export default function OnboardingGenderScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [name] = useState(loadProfileName);
  const [gender, setGender] = useState<Gender | null>(null);
  const [ownWords, setOwnWords] = useState('');
  const [done, setDone] = useState(false);
  // Coming back from a later step: let them continue again.
  useFocusEffect(useCallback(() => setDone(false), []));

  const slot = genderSlot(gender, ownWords);
  const ready = slot.length > 0;
  const selfDescribe = gender === 'self-describe';
  const who = name ?? 'you';

  function handlePick(next: Gender) {
    if (next !== 'self-describe') Keyboard.dismiss();
    setGender(next);
    setDone(false);
  }

  function handleWords(text: string) {
    setOwnWords(text);
    setDone(false);
  }

  function handleNext() {
    if (!gender || !ready || done) return;
    Keyboard.dismiss();
    setDone(true);
    saveProfileGender(gender, ownWords);
    router.push('/onboarding-frequency');
  }

  function handleSkip() {
    router.push('/onboarding-frequency');
  }

  function handleBack() {
    if (router.canGoBack()) router.back();
    else router.replace('/onboarding-birthday');
  }

  function animate(style: object) {
    return entrance(reduceMotion, style);
  }

  const titleWords = [
    { word: 'in', soft: false },
    { word: 'the', soft: false },
    { word: 'story', soft: false },
    { word: 'of', soft: false },
    { word: `${who},`, soft: false },
    { word: 'the', soft: true },
    { word: 'dreamer', soft: true },
    { word: 'is', soft: true },
  ];
  // The grey words wait a beat after the name.
  const wordDelay = (k: number) => 400 + k * 100 + (k >= 5 ? 100 : 0);

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
        <ProgressBar steps={STEPS} current={3} reduceMotion={reduceMotion} />
        <Pressable accessibilityRole="button" onPress={handleSkip} hitSlop={8} style={styles.skip}>
          {({ pressed }) => <Text style={[styles.skipText, pressed && styles.skipPressed]}>skip</Text>}
        </Pressable>
      </View>

      <View style={[styles.content, { paddingTop: insets.top + 96, paddingBottom: insets.bottom + 24 }]}>
        {/* Each word floats up in turn; screen readers hear the whole sentence at once. */}
        <View
          accessible
          accessibilityRole="header"
          accessibilityLiveRegion="polite"
          accessibilityLabel={`in the story of ${who}, the dreamer is ${slot || 'blank'}`}>
          <View style={styles.title}>
            {titleWords.map(({ word, soft }, k) => (
              <Animated.Text
                key={k}
                style={[
                  styles.titleText,
                  soft && styles.soft,
                  animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: wordDelay(k), animationTimingFunction: 'ease' }),
                ]}>
                {word}
              </Animated.Text>
            ))}
          </View>

          <Animated.View
            style={[styles.slotLine, animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: 1350, animationTimingFunction: 'ease' })]}>
            {ready ? (
              // Keyed by the pick so each new chip swaps in, but typing doesn't replay it.
              <Animated.Text
                key={gender}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.6}
                style={[
                  styles.slot,
                  animate({ animationName: SWAP_IN, animationDuration: 450, animationTimingFunction: cubicBezier(0.3, 0.9, 0.3, 1) }),
                ]}>
                {slot}
              </Animated.Text>
            ) : (
              <Animated.View
                style={[
                  styles.blank,
                  reduceMotion
                    ? styles.blankStill
                    : { animationName: BLINK, animationDuration: 1800, animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' },
                ]}>
                {/* A row of dashes: RN can't dash just one border reliably. */}
                {Array.from({ length: PLACEHOLDER_DASHES }, (_, k) => (
                  <View key={k} style={styles.dash} />
                ))}
              </Animated.View>
            )}
          </Animated.View>
        </View>

        <View style={styles.answers}>
          <View style={styles.chips} accessibilityRole="radiogroup" accessibilityLabel="Gender">
            {GENDERS.map((option, k) => {
              const on = option === gender;
              return (
                <Animated.View
                  key={option}
                  style={animate({ animationName: UP, animationDuration: 600, animationDelay: 1500 + k * 70, animationTimingFunction: 'ease' })}>
                  <Pressable
                    accessibilityRole="radio"
                    accessibilityState={{ selected: on }}
                    onPress={() => handlePick(option)}>
                    {({ pressed }) => (
                      <Animated.View
                        style={[
                          styles.chip,
                          {
                            backgroundColor: on ? BrandColors.lime : CHIP_OFF,
                            borderColor: on ? BrandColors.lime : NightColors.track,
                            transform: [{ scale: pressed ? 0.95 : on ? 1.04 : 1 }],
                            transitionProperty: ['backgroundColor', 'borderColor', 'transform'],
                            transitionDuration: reduceMotion ? 0 : [300, 300, 250],
                            transitionTimingFunction: ['ease', 'ease', SPRING],
                          },
                        ]}>
                        <Animated.Text
                          style={[
                            styles.chipText,
                            {
                              color: on ? BrandColors.ink : NightColors.text,
                              transitionProperty: 'color',
                              transitionDuration: reduceMotion ? 0 : 300,
                              transitionTimingFunction: 'ease',
                            },
                          ]}>
                          {GENDER_CHIPS[option]}
                        </Animated.Text>
                      </Animated.View>
                    )}
                  </Pressable>
                </Animated.View>
              );
            })}
          </View>

          {selfDescribe && (
            <Animated.View
              style={[styles.field, animate({ animationName: OPEN, animationDuration: 350, animationTimingFunction: 'ease' })]}>
              <TextInput
                autoFocus
                value={ownWords}
                onChangeText={handleWords}
                onSubmitEditing={handleNext}
                placeholder="in your own words"
                placeholderTextColor={NightColors.dot}
                maxLength={MAX_GENDER_WORDS_LENGTH}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                selectionColor={BrandColors.lime}
                cursorColor={BrandColors.lime}
                accessibilityLabel="Describe yourself in your own words"
                style={styles.fieldInput}
              />
            </Animated.View>
          )}
        </View>

        <Animated.View
          style={animate({ animationName: UP, animationDuration: 700, animationDelay: 2000, animationTimingFunction: cubicBezier(0.2, 0.8, 0.2, 1) })}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ disabled: !ready }}
            accessibilityHint={ready ? undefined : 'Pick an answer first'}
            disabled={!ready || done}
            onPress={handleNext}>
            {({ pressed }) => (
              <Animated.View
                style={[
                  styles.next,
                  {
                    backgroundColor: ready ? BrandColors.lime : NightColors.pillOff,
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
                      color: ready ? BrandColors.ink : NightColors.buttonOffText,
                      transitionProperty: 'color',
                      transitionDuration: reduceMotion ? 0 : 350,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  {done ? 'noted ✦' : 'next'}
                </Animated.Text>
              </Animated.View>
            )}
          </Pressable>
        </Animated.View>
      </View>
    </View>
  );
}

/** Unpicked chip: a hair lighter than the black screen. */
const CHIP_OFF = '#0F0F0F';

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
    columnGap: 10,
  },
  titleText: {
    fontFamily: BrandFonts.medium,
    fontSize: 38,
    lineHeight: 43,
    letterSpacing: -1.4,
    color: NightColors.text,
  },
  soft: {
    color: NightColors.hint,
  },
  slotLine: {
    minHeight: 58,
    marginTop: 6,
    paddingHorizontal: 4,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  slot: {
    flexShrink: 1,
    paddingBottom: 2,
    borderBottomWidth: 2,
    borderBottomColor: BrandColors.lime,
    fontFamily: BrandFonts.semibold,
    fontSize: 48,
    lineHeight: 53,
    letterSpacing: -2,
    color: BrandColors.lime,
  },
  blank: {
    width: 150,
    height: 48,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  blankStill: {
    opacity: 0.6,
  },
  dash: {
    width: 6,
    height: 2,
    backgroundColor: '#3A3A3A',
  },
  answers: {
    flex: 1,
    marginTop: 48,
    gap: 14,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chip: {
    height: 52,
    paddingHorizontal: 22,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipText: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
  },
  field: {
    height: 56,
    paddingHorizontal: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: BrandColors.lime,
    justifyContent: 'center',
  },
  fieldInput: {
    padding: 0,
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    color: NightColors.text,
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
