import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Path, Stop } from 'react-native-svg';

import { BrandFonts } from '@/constants/theme';

const GHOST = require('@/assets/images/ghost-body.png');

/** Height of the bar, below the status bar. */
export const BRAND_BAR_HEIGHT = 56;

/** Row at the top of Entries and Visualize: the white ghost, and the streak with its flame. */
export function BrandBar({ streak }: { streak: number }) {
  return (
    <View style={styles.bar}>
      <Image source={GHOST} style={styles.ghost} contentFit="contain" tintColor="#fff" accessibilityLabel="afterdream" />
      <View style={styles.streak} accessible accessibilityLabel={`${streak} night${streak === 1 ? '' : 's'} in a row`}>
        <Flame />
        <Text style={styles.count}>{streak}</Text>
      </View>
    </View>
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
  },
  ghost: {
    width: 36,
    height: 36,
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
