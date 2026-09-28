import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef, useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BrandColors } from '@/constants/theme';
import { Eyelids } from '@/components/welcome/eyelids';
import { WelcomeActions } from '@/components/welcome/welcome-actions';
import { WelcomeHero } from '@/components/welcome/welcome-hero';

/** The design was drawn for a 390 × 844 pt phone; positions scale from that. */
const DESIGN_HEIGHT = 844;
/** Where the logo starts in the design (pt from the top). */
const HERO_TOP = 250;
/** When the eyelids have opened and the status bar should switch to dark text. */
const EYES_OPEN_MS = 1300;
/** Pause on "Good morning" before moving on. */
const GREETING_PAUSE_MS = 650;

/**
 * Welcome screen ("/", the first screen), from the Afterdream Welcome v2 design:
 * black eyelids open onto a lime screen, the logo and "afterdream" come into focus,
 * "Dreams fade. Words stay." rises in, then the buttons. The eyes blink now and then.
 */
export default function WelcomeScreen() {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [eyesOpen, setEyesOpen] = useState(reduceMotion);
  const [greeting, setGreeting] = useState(false);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setEyesOpen(true), reduceMotion ? 0 : EYES_OPEN_MS);
    return () => {
      clearTimeout(timer);
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, [reduceMotion]);

  function handleStart() {
    // The design greets you before moving on to the agreement screen.
    setGreeting(true);
    // `replace` (not `push`) so "back" doesn't return here.
    leaveTimer.current = setTimeout(() => router.replace('/agreement'), GREETING_PAUSE_MS);
  }

  function handleExistingAccount() {
    // There are no accounts yet, so this simply continues to your journal.
    router.replace('/home');
  }

  const heroTop = Math.max(insets.top + 24, height * (HERO_TOP / DESIGN_HEIGHT));

  return (
    <View style={styles.screen}>
      {/* Light status bar over the closed eyelids, dark once the lime screen shows. */}
      <StatusBar style={eyesOpen ? 'dark' : 'light'} />

      <View style={[styles.hero, { top: heroTop }]}>
        <WelcomeHero word="afterdream" reduceMotion={reduceMotion} />
      </View>

      <View style={[styles.actions, { bottom: Math.max(insets.bottom, 16) + 12 }]}>
        <WelcomeActions
          primaryLabel={greeting ? 'Good morning' : 'Begin'}
          onPrimary={handleStart}
          secondaryLabel="I have an account"
          onSecondary={handleExistingAccount}
          disabled={greeting}
          reduceMotion={reduceMotion}
        />
      </View>

      <Eyelids width={width} height={height} blink reduceMotion={reduceMotion} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: BrandColors.lime,
  },
  hero: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  actions: {
    position: 'absolute',
    left: 28,
    right: 28,
  },
});
