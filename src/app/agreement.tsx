import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { useReducedMotion } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { NightColors } from '@/constants/theme';
import { AGREEMENT_HERO_HEIGHT, AgreementHero } from '@/components/agreement/agreement-hero';
import { Consent } from '@/components/agreement/consent';
import { SlideCarousel } from '@/components/agreement/slide-carousel';

/** The design was drawn for a 390 × 844 pt phone; positions scale from that. */
const DESIGN_HEIGHT = 844;
/** Where the hero starts in the design (pt from the top). */
const HERO_TOP = 120;
/** Gap between the hero and the slides in the design. */
const SLIDES_GAP = 53;
/**
 * Height the slides, dots and bottom block need no matter what (pt).
 * Whatever is left over is shared by the hero and its gaps.
 */
const FIXED_HEIGHT = 306;

/**
 * Agreement screen ("/agreement"), shown after the welcome screen, from the
 * Afterdream Agreement design: the lime logo rises out of a line above its own
 * reflection, three lines about the app take turns, and "Continue with Apple"
 * unlocks once the Terms and Privacy Policy are accepted.
 */
export default function AgreementScreen() {
  const { height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const reduceMotion = useReducedMotion();

  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  function handleContinue() {
    if (!agreed) return;
    setSigning(true);
    // There is no Sign in with Apple yet, so this goes straight to the "You're in" screen.
    // `replace` (not `push`) so "back" doesn't return here.
    router.replace('/welcome-in');
  }

  // Shrink the hero on short phones so the slides never run into the button.
  const scale = Math.min(1, Math.max(0.6, (height - FIXED_HEIGHT) / (HERO_TOP + AGREEMENT_HERO_HEIGHT + SLIDES_GAP)));
  const heroTop = Math.max(insets.top + 8, height * (HERO_TOP / DESIGN_HEIGHT) * scale);
  const slidesTop = heroTop + (AGREEMENT_HERO_HEIGHT + SLIDES_GAP) * scale;

  return (
    <View style={styles.screen}>
      <StatusBar style="light" />

      <View style={[styles.hero, { top: heroTop }]}>
        <AgreementHero scale={scale} reduceMotion={reduceMotion} />
      </View>

      <View style={[styles.slides, { top: slidesTop }]}>
        <SlideCarousel reduceMotion={reduceMotion} />
      </View>

      <View style={[styles.consent, { bottom: Math.max(insets.bottom + 6, 24) }]}>
        <Consent
          agreed={agreed}
          onToggle={() => setAgreed((a) => !a)}
          signing={signing}
          onContinue={handleContinue}
          reduceMotion={reduceMotion}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: NightColors.background,
  },
  hero: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  slides: {
    position: 'absolute',
    left: 32,
    right: 32,
  },
  consent: {
    position: 'absolute',
    left: 24,
    right: 24,
  },
});
