import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

import { BrandColors, BrandFonts } from '@/constants/theme';

import { useEntrance, WelcomeEasing } from './motion';

type WelcomeActionsProps = {
  primaryLabel: string;
  onPrimary: () => void;
  secondaryLabel: string;
  onSecondary: () => void;
  disabled?: boolean;
  reduceMotion: boolean;
};

/** The welcome screen's two buttons: the main one rises in, then the text link fades in. */
export function WelcomeActions({
  primaryLabel,
  onPrimary,
  secondaryLabel,
  onSecondary,
  disabled = false,
  reduceMotion,
}: WelcomeActionsProps) {
  const primaryIn = useEntrance(2800, 800, WelcomeEasing.rise, reduceMotion);
  const secondaryIn = useEntrance(3000, 800, WelcomeEasing.ease, reduceMotion);

  const primaryStyle = useAnimatedStyle(() => ({
    opacity: primaryIn.get(),
    transform: [{ translateY: 14 * (1 - primaryIn.get()) }],
  }));
  const secondaryStyle = useAnimatedStyle(() => ({ opacity: secondaryIn.get() }));

  return (
    <View style={styles.container}>
      <Animated.View style={primaryStyle}>
        <Pressable
          accessibilityRole="button"
          onPress={onPrimary}
          disabled={disabled}
          style={({ pressed }) => [styles.primary, pressed && styles.primaryPressed]}>
          <Text style={styles.primaryText}>{primaryLabel}</Text>
        </Pressable>
      </Animated.View>
      <Animated.View style={secondaryStyle}>
        <Pressable
          accessibilityRole="button"
          onPress={onSecondary}
          disabled={disabled}
          style={({ pressed }) => [styles.secondary, pressed && styles.secondaryPressed]}>
          <Text style={styles.secondaryText}>{secondaryLabel}</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 10,
  },
  primary: {
    height: 58,
    borderRadius: 29,
    backgroundColor: BrandColors.ink,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryPressed: {
    transform: [{ scale: 0.97 }],
  },
  primaryText: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    color: BrandColors.lime,
  },
  secondary: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryPressed: {
    opacity: 0.6,
  },
  secondaryText: {
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    color: BrandColors.ink,
  },
});
