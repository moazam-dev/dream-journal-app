import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';

type SignInSheetProps = {
  agreed: boolean;
  onToggle: () => void;
  signing: boolean;
  onContinue: () => void;
  /** Space kept clear at the bottom (home indicator). */
  bottomPadding: number;
  reduceMotion: boolean;
};

/** Apple logo from the design (17 × 20 viewBox). */
const APPLE_PATH =
  'M14.1 10.6c0-2.6 2.1-3.8 2.2-3.9-1.2-1.8-3.1-2-3.7-2-1.6-.2-3.1.9-3.9.9-.8 0-2-.9-3.4-.9-1.7 0-3.3 1-4.2 2.6-1.8 3.1-.5 7.7 1.3 10.2.9 1.2 1.9 2.6 3.2 2.6 1.3-.1 1.8-.8 3.3-.8 1.6 0 2 .8 3.4.8 1.4 0 2.3-1.3 3.1-2.5 1-1.4 1.4-2.8 1.4-2.9 0 0-2.7-1-2.7-4.1zM11.6 3c.7-.9 1.2-2 1-3.2-1 0-2.3.7-3 1.6-.7.8-1.2 2-1.1 3.1 1.2.1 2.3-.6 3.1-1.5z';

/** The check pops in slightly too big, then settles. */
const CHECK_POP = {
  '0%': { transform: [{ scale: 0.4 }] },
  '60%': { transform: [{ scale: 1.15 }] },
  '100%': { transform: [{ scale: 1 }] },
};

/** Grey of the empty checkbox and the locked button text. */
const MUTED = NightColors.buttonOffText;

/**
 * Black sheet at the bottom of the Welcome Ghost screen: "I agree to the Terms…"
 * round checkbox, and "Continue with Apple", which turns white once agreed.
 */
export function SignInSheet({ agreed, onToggle, signing, onContinue, bottomPadding, reduceMotion }: SignInSheetProps) {
  const motion = reduceMotion ? 0 : 1;
  const buttonText = agreed ? '#000000' : MUTED;
  const colorTransition = {
    transitionProperty: 'color' as const,
    transitionDuration: 350 * motion,
    transitionTimingFunction: 'ease' as const,
  };

  return (
    <View style={[styles.sheet, { paddingBottom: bottomPadding }]}>
      <Pressable
        accessibilityRole="checkbox"
        accessibilityState={{ checked: agreed }}
        onPress={onToggle}
        style={styles.row}>
        <Animated.View
          style={[
            styles.box,
            {
              borderColor: agreed ? BrandColors.lime : MUTED,
              backgroundColor: agreed ? BrandColors.lime : 'transparent',
              transitionProperty: ['borderColor', 'backgroundColor'],
              transitionDuration: 250 * motion,
              transitionTimingFunction: 'ease',
            },
          ]}>
          {agreed && (
            <Animated.View
              style={{ animationName: CHECK_POP, animationDuration: 350 * motion, animationTimingFunction: 'ease' }}>
              <Svg width={13} height={13} viewBox="0 0 14 14">
                <Path
                  d="M2.5 7.5l3 3 6-7"
                  fill="none"
                  stroke={BrandColors.ink}
                  strokeWidth={2.4}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            </Animated.View>
          )}
        </Animated.View>
        {/* TODO: link these once the Terms of Service and Privacy Policy pages exist. */}
        <Text style={styles.label}>
          I agree to the <Text style={styles.link}>Terms</Text> and <Text style={styles.link}>Privacy Policy</Text>
        </Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        accessibilityState={{ disabled: !agreed || signing }}
        onPress={onContinue}
        disabled={!agreed || signing}
        style={({ pressed }) => [pressed && styles.pressed]}>
        <Animated.View
          style={[
            styles.button,
            {
              backgroundColor: agreed ? '#FFFFFF' : NightColors.buttonOff,
              transitionProperty: 'backgroundColor',
              transitionDuration: 350 * motion,
              transitionTimingFunction: 'ease',
            },
          ]}>
          <Svg width={17} height={20} viewBox="0 0 17 20">
            <Path d={APPLE_PATH} fill={buttonText} />
          </Svg>
          <Animated.Text style={[styles.buttonText, { color: buttonText }, colorTransition]}>
            {signing ? 'Signing in…' : 'Continue with Apple'}
          </Animated.Text>
        </Animated.View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    paddingTop: 26,
    paddingHorizontal: 24,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    backgroundColor: NightColors.background,
    gap: 20,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 8,
  },
  box: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: '#B5B5B5',
  },
  link: {
    color: NightColors.text,
    textDecorationLine: 'underline',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  button: {
    height: 58,
    borderRadius: 29,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontSize: 17,
    fontWeight: '600',
  },
});
