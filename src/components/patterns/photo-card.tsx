import { Image } from 'expo-image';
import type { ReactNode } from 'react';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

import { ZOOM } from '@/components/today/motion';
import { BrandFonts } from '@/constants/theme';

import { forever, SPIN } from './motion';

type PhotoCardProps = {
  /** Blurred behind everything; `base` shows while it loads or if there is none. */
  photo: string | null;
  base: string;
  radius?: number;
  /** CSS gradient laid over the photo so white text stays readable. */
  shade?: string;
  /** Slowly zooms the photo, like the hero cards. */
  zoom?: boolean;
  blur?: number;
  reduceMotion: boolean;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
};

const SHADE = 'linear-gradient(180deg, rgba(0,0,0,0.4), rgba(0,0,0,0.5))';

/** A rounded card on the Patterns screen: a blurred photo, darkened, under its content. */
export function PhotoCard({ photo, base, radius = 36, shade = SHADE, zoom = false, blur = 26, reduceMotion, style, children }: PhotoCardProps) {
  return (
    <Animated.View style={[styles.card, { borderRadius: radius, backgroundColor: base }, style]}>
      {photo && (
        <Animated.View style={[styles.photo, zoom && forever(reduceMotion, ZOOM, 24000, 'ease-in-out')]}>
          <Image source={{ uri: photo }} style={StyleSheet.absoluteFill} contentFit="cover" blurRadius={blur} transition={600} />
        </Animated.View>
      )}
      <View style={[StyleSheet.absoluteFill, { experimental_backgroundImage: shade }]} />
      {children}
    </Animated.View>
  );
}

/** The frosted label at the top of a card ("◉ on your mind lately"). */
export function Pill({ label, style }: { label: string; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.pill, style]}>
      <Text style={styles.pillText}>{label}</Text>
    </View>
  );
}

/**
 * The spinning rainbow of light behind the month's number and the "reading…" moment.
 * The design uses a blurred conic gradient; four soft radial glows turn the same way.
 */
export function Swirl({ size, reduceMotion, duration }: { size: number; reduceMotion: boolean; duration: number }) {
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          experimental_backgroundImage: [
            'radial-gradient(circle at 30% 28%, #E2EB98 0%, rgba(226,235,152,0) 58%)',
            'radial-gradient(circle at 74% 32%, #A8D8F0 0%, rgba(168,216,240,0) 58%)',
            'radial-gradient(circle at 70% 74%, #C9B8F2 0%, rgba(201,184,242,0) 58%)',
            'radial-gradient(circle at 26% 70%, #F2B8A0 0%, rgba(242,184,160,0) 58%)',
          ].join(', '),
        },
        forever(reduceMotion, SPIN, duration),
      ]}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    borderCurve: 'continuous',
    overflow: 'hidden',
  },
  photo: {
    position: 'absolute',
    top: -50,
    left: -50,
    right: -50,
    bottom: -50,
  },
  pill: {
    alignSelf: 'flex-start',
    height: 38,
    paddingHorizontal: 14,
    borderRadius: 19,
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.14)',
  },
  pillText: {
    fontFamily: BrandFonts.medium,
    fontSize: 14,
    lineHeight: 17,
    color: '#fff',
  },
});
