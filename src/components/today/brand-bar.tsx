import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { BrandFonts } from '@/constants/theme';

const GHOST = require('@/assets/images/ghost-body.png');

/** Height of the bar, below the status bar. */
export const BRAND_BAR_HEIGHT = 56;

type BrandBarProps = {
  /** The page's name, next to the ghost. */
  title: string;
  streak: number;
  /** The page's own buttons (see HeaderButton), just before the streak. */
  children?: ReactNode;
};

/**
 * The top bar every tab shares (Visualize, Garden, Entries, Patterns): the white ghost and
 * the page's name on the left; the page's buttons and the streak with its flame on the right.
 */
export function BrandBar({ title, streak, children }: BrandBarProps) {
  return (
    <View style={styles.bar}>
      <View style={styles.left}>
        <Image source={GHOST} style={styles.ghost} contentFit="contain" tintColor="#fff" accessibilityLabel="afterdream" />
        <Text style={styles.title} accessibilityRole="header" numberOfLines={1}>
          {title}
        </Text>
      </View>
      <View style={styles.right}>
        {children}
        <View style={styles.streak} accessible accessibilityLabel={`${streak} night${streak === 1 ? '' : 's'} in a row`}>
          <Flame />
          <Text style={styles.count}>{streak}</Text>
        </View>
      </View>
    </View>
  );
}

type HeaderButtonProps = {
  label: string;
  onPress: () => void;
  children: ReactNode;
};

/** A round outlined button for the bar's right side, so every page's buttons look alike. */
export function HeaderButton({ label, onPress, children }: HeaderButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      onPress={onPress}
      style={({ pressed }) => [styles.button, pressed && styles.pressed]}>
      {children}
    </Pressable>
  );
}

/** The design's streak flame: red to amber, with a yellow heart. */
function Flame() {
  return (
    <Svg width={20} height={24} viewBox="0 0 16 18">
      <Defs>
        <LinearGradient id="brandFire" x1="0" y1="1" x2="0" y2="0">
          <Stop offset="0" stopColor="#FF3D1F" />
          <Stop offset="0.55" stopColor="#FF7A1A" />
          <Stop offset="1" stopColor="#FFB224" />
        </LinearGradient>
      </Defs>
      <Path
        d="M8 0c.6 3-1.8 4.4-3.3 6.3C3 8.4 2 10.2 2 12a6 6 0 0012 0c0-2.4-1.3-4.3-2.6-5.6.1 1.6-.6 2.8-1.6 3.3C10.3 6 9.9 2.6 8 0z"
        fill="url(#brandFire)"
      />
      <Path d="M8 18a3 3 0 003-3c0-1.7-1.3-2.7-2-4-.7 1.5-4 2.2-4 4a3 3 0 003 3z" fill="#FFD43B" />
    </Svg>
  );
}

const styles = StyleSheet.create({
  bar: {
    height: BRAND_BAR_HEIGHT,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  left: {
    flexShrink: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  ghost: {
    width: 36,
    height: 36,
  },
  title: {
    flexShrink: 1,
    fontFamily: BrandFonts.medium,
    fontSize: 24,
    lineHeight: 28,
    letterSpacing: -0.8,
    color: '#fff',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  button: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: {
    opacity: 0.7,
  },
  streak: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  count: {
    fontFamily: BrandFonts.semibold,
    fontSize: 17,
    lineHeight: 20,
    color: '#fff',
    fontVariant: ['tabular-nums'],
  },
});
