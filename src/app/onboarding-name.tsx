import { router, useFocusEffect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, {
  cubicBezier,
  useAnimatedKeyboard,
  useAnimatedStyle,
  useReducedMotion,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { ProgressBar } from '@/components/onboarding/progress-bar';
import { Sunrise } from '@/components/onboarding/sunrise';
import { saveProfileName } from '@/lib/profile';
import { getGreeting } from '@/utils/date';

/** Onboarding has 5 steps; this is the first. */
const STEPS = 5;
const MAX_NAME_LENGTH = 18;
/** The glow is fully risen at this many letters. */
const FULL_GLOW_LETTERS = 8;
/** Time to enjoy "good morning, …" before moving on. */
const DONE_PAUSE_MS = 1400;

const LINE_ONE = ['hey,', 'night', 'owl.'];
const LINE_TWO = ['what', 'should', 'we', 'call', 'you?'];

const WORD_IN = {
  from: { opacity: 0, transform: [{ translateY: 10 }] },
  to: { opacity: 1, transform: [{ translateY: 0 }] },
};
const FADE = { from: { opacity: 0 }, to: { opacity: 1 } };
const HORIZON = {
  from: { transform: [{ scaleX: 0 }] },
  to: { transform: [{ scaleX: 1 }] },
};
const PULSE = {
  '0%': { opacity: 0.35 },
  '50%': { opacity: 1 },
  '100%': { opacity: 0.35 },
};

/**
 * Onboarding step 1 ("/onboarding-name"), shown after "You're in", from the
 * Afterdream Onboarding Name design: "hey, night owl. what should we call you?"
 * A glow rises over the horizon (just above the keyboard) with every letter typed.
 */
export default function OnboardingNameScreen() {
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();
  // Deprecated in favour of react-native-keyboard-controller, but that needs a new native
  // build; this keeps the horizon glued to the top of the keyboard with what's installed.
  const keyboard = useAnimatedKeyboard();

  const [name, setName] = useState('');
  const [done, setDone] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  // Coming back from the birthday screen: let them continue again.
  useFocusEffect(useCallback(() => setDone(false), []));

  const trimmed = name.trim();
  const hasName = trimmed.length > 0;
  const firstName = trimmed.split(/\s+/)[0];
  const progress = Math.min(trimmed.length / FULL_GLOW_LETTERS, 1);

  const hint = done
    ? `${getGreeting().toLowerCase()}, ${firstName}.`
    : hasName
      ? 'the sun rises a little with every letter.'
      : 'a first name or a nickname — anything works.';

  function handleChange(text: string) {
    // No double spaces or leading space, like the design's keyboard.
    setName(text.replace(/^\s+/, '').replace(/\s{2,}/g, ' '));
    setDone(false);
  }

  function handleContinue() {
    if (!hasName || done) return;
    setDone(true);
    saveProfileName(trimmed);
    // `push` so the birthday screen's back button returns here.
    leaveTimer.current = setTimeout(() => router.push('/onboarding-birthday'), DONE_PAUSE_MS);
  }

  /** Skips only this question. */
  function handleSkip() {
    router.push('/onboarding-birthday');
  }

  // Everything around the horizon sits on top of the keyboard and follows it up and down.
  const minBottom = insets.bottom + 16;
  const dockStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -Math.max(keyboard.height.get(), minBottom) }],
  }));

  function animate(style: object) {
    return reduceMotion ? null : { animationFillMode: 'both' as const, ...style };
  }

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <Animated.View style={[styles.dock, dockStyle]} pointerEvents="box-none">
        <Sunrise progress={progress} done={done} reduceMotion={reduceMotion} />
        <Animated.View
          style={[
            styles.horizon,
            animate({ animationName: HORIZON, animationDuration: 1200, animationDelay: 500, animationTimingFunction: cubicBezier(0.6, 0, 0.2, 1) }),
          ]}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ disabled: !hasName }}
          disabled={!hasName || done}
          onPress={handleContinue}
          style={styles.continueWrap}>
          <Animated.View
            style={[
              styles.continue,
              {
                backgroundColor: hasName ? BrandColors.lime : NightColors.pillOff,
                transform: [{ scale: hasName ? 1 : 0.94 }],
                transitionProperty: ['backgroundColor', 'transform'],
                transitionDuration: reduceMotion ? 0 : [350, 300],
                transitionTimingFunction: ['ease', cubicBezier(0.3, 1.6, 0.5, 1)],
              },
            ]}>
            <Animated.Text
              style={[
                styles.continueText,
                {
                  color: hasName ? BrandColors.ink : NightColors.pillOffText,
                  transitionProperty: 'color',
                  transitionDuration: reduceMotion ? 0 : 350,
                  transitionTimingFunction: 'ease',
                },
              ]}>
              continue →
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </Animated.View>

      <View style={[styles.topBar, { top: insets.top + 8 }]}>
        <ProgressBar steps={STEPS} current={1} reduceMotion={reduceMotion} />
        <Pressable accessibilityRole="button" onPress={handleSkip} hitSlop={8} style={styles.skip}>
          {({ pressed }) => <Text style={[styles.skipText, pressed && styles.skipPressed]}>skip</Text>}
        </Pressable>
      </View>

      <View style={[styles.header, { top: insets.top + 82 }]}>
        <Animated.View
          style={[styles.brand, animate({ animationName: FADE, animationDuration: 500, animationDelay: 400, animationTimingFunction: 'ease' })]}>
          <Animated.View
            style={[
              styles.brandDot,
              animate({ animationName: PULSE, animationDuration: 2000, animationIterationCount: 'infinite', animationTimingFunction: 'ease-in-out' }),
            ]}
          />
          <Text style={styles.brandText}>afterdream</Text>
        </Animated.View>

        {/* Each word floats up in turn; screen readers hear the whole question at once. */}
        <View
          style={styles.title}
          accessible
          accessibilityRole="header"
          accessibilityLabel={`${LINE_ONE.join(' ')} ${LINE_TWO.join(' ')}`}>
          {LINE_ONE.map((word, k) => (
            <Animated.Text
              key={word}
              style={[styles.titleText, animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: 600 + k * 120, animationTimingFunction: 'ease' })]}>
              {word}
            </Animated.Text>
          ))}
          <View style={styles.lineBreak} />
          {LINE_TWO.map((word, k) => (
            <Animated.Text
              key={word}
              style={[
                styles.titleText,
                styles.accent,
                animate({ animationName: WORD_IN, animationDuration: 600, animationDelay: 1200 + k * 120, animationTimingFunction: 'ease' }),
              ]}>
              {word}
            </Animated.Text>
          ))}
        </View>
      </View>

      <Animated.View
        style={[
          styles.field,
          { top: insets.top + 276 },
          animate({ animationName: FADE, animationDuration: 600, animationDelay: 1900, animationTimingFunction: 'ease' }),
        ]}>
        <TextInput
          value={name}
          onChangeText={handleChange}
          onSubmitEditing={handleContinue}
          submitBehavior="submit"
          placeholder="type your name"
          placeholderTextColor={NightColors.placeholder}
          maxLength={MAX_NAME_LENGTH}
          autoFocus
          autoCapitalize="words"
          autoCorrect={false}
          autoComplete="given-name"
          textContentType="givenName"
          returnKeyType="done"
          keyboardAppearance="dark"
          selectionColor={BrandColors.lime}
          cursorColor={BrandColors.lime}
          accessibilityLabel="Your name"
          accessibilityHint={hint}
          style={styles.input}
        />
        <Text style={styles.hint} accessibilityLiveRegion="polite">
          {hint}
        </Text>
      </Animated.View>
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
    left: 24,
    right: 20,
    height: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
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
  header: {
    position: 'absolute',
    left: 28,
    right: 28,
    gap: 18,
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: BrandColors.lime,
  },
  brandText: {
    fontFamily: BrandFonts.medium,
    fontSize: 13,
    letterSpacing: 0.4,
    color: NightColors.hint,
  },
  title: {
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
    fontSize: 36,
    lineHeight: 40,
    letterSpacing: -1.3,
    color: NightColors.text,
  },
  accent: {
    color: BrandColors.lime,
  },
  field: {
    position: 'absolute',
    left: 28,
    right: 28,
    gap: 10,
  },
  input: {
    padding: 0,
    fontFamily: BrandFonts.medium,
    fontSize: 44,
    lineHeight: 50,
    letterSpacing: -1.6,
    color: NightColors.text,
  },
  hint: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: NightColors.hint,
  },
  // The keyboard's top edge. Children are placed relative to its bottom.
  dock: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 380,
  },
  horizon: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: NightColors.horizon,
  },
  continueWrap: {
    position: 'absolute',
    right: 20,
    bottom: 18,
  },
  continue: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: 25,
    justifyContent: 'center',
  },
  continueText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 16,
  },
});
