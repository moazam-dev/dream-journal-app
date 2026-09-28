import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';
import { useEntrance, WelcomeEasing } from '@/components/welcome/motion';

type ConsentProps = {
  agreed: boolean;
  onToggle: () => void;
  signing: boolean;
  onContinue: () => void;
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

/**
 * "I accept the Terms…" round checkbox and the "Continue with Apple" button,
 * which only lights up (lime) once the terms are accepted.
 */
export function Consent({ agreed, onToggle, signing, onContinue, reduceMotion }: ConsentProps) {
  const rowIn = useEntrance(1000, 700, WelcomeEasing.ease, reduceMotion);
  const buttonIn = useEntrance(1150, 700, WelcomeEasing.rise, reduceMotion);

  const rowStyle = useAnimatedStyle(() => ({
    opacity: rowIn.get(),
    transform: [{ translateY: 16 * (1 - rowIn.get()) }],
  }));
  const buttonStyle = useAnimatedStyle(() => ({
    opacity: buttonIn.get(),
    transform: [{ translateY: 16 * (1 - buttonIn.get()) }],
  }));

  const motion = reduceMotion ? 0 : 1;
  const buttonText = agreed ? BrandColors.ink : NightColors.buttonOffText;

  return (
    <View style={styles.container}>
      <Animated.View style={rowStyle}>
        <Pressable
          accessibilityRole="checkbox"
          accessibilityState={{ checked: agreed }}
          onPress={onToggle}
          style={styles.row}>
          <Animated.View
            style={[
              styles.box,
              {
                borderColor: agreed ? BrandColors.lime : NightColors.text,
                backgroundColor: agreed ? BrandColors.lime : 'transparent',
                transitionProperty: ['borderColor', 'backgroundColor'],
                transitionDuration: 250 * motion,
                transitionTimingFunction: 'ease',
              },
            ]}>
            {agreed && (
              <Animated.View
                style={{ animationName: CHECK_POP, animationDuration: 350 * motion, animationTimingFunction: 'ease' }}>
                <Svg width={14} height={14} viewBox="0 0 14 14">
                  <Path
                    d="M2.5 7.5l3 3 6-7"
                    fill="none"
                    stroke={BrandColors.ink}
                    strokeWidth={2.2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </Svg>
              </Animated.View>
            )}
          </Animated.View>
          {/* TODO: link these once the Terms of Service and Privacy Policy pages exist. */}
          <Text style={styles.label}>
            I accept the <Text style={styles.link}>Terms of Service</Text> and{' '}
            <Text style={styles.link}>Privacy Policy</Text> to continue.
          </Text>
        </Pressable>
      </Animated.View>

      <Animated.View style={buttonStyle}>
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
                backgroundColor: agreed ? BrandColors.lime : NightColors.buttonOff,
                transitionProperty: 'backgroundColor',
                transitionDuration: 350 * motion,
                transitionTimingFunction: 'ease',
              },
            ]}>
            <Svg width={18} height={21} viewBox="0 0 17 20">
              <Path d={APPLE_PATH} fill={buttonText} />
            </Svg>
            <Animated.Text
              style={[
                styles.buttonText,
                {
                  color: buttonText,
                  transitionProperty: 'color',
                  transitionDuration: 350 * motion,
                  transitionTimingFunction: 'ease',
                },
              ]}>
              {signing ? 'Signing in…' : 'Continue with Apple'}
            </Animated.Text>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 12,
  },
  box: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    flex: 1,
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 20,
    color: NightColors.textSoft,
  },
  link: {
    color: NightColors.text,
    textDecorationLine: 'underline',
  },
  pressed: {
    transform: [{ scale: 0.97 }],
  },
  button: {
    height: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  buttonText: {
    fontFamily: BrandFonts.semibold,
    fontSize: 18,
    color: NightColors.buttonOffText,
  },
});
