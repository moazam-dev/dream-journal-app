import { Image } from 'expo-image';
import type { Dispatch, SetStateAction } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';

import { animate } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import { useDreamImage } from '@/hooks/use-dream-image';
import type { Dream } from '@/types/dream';
import { dreamHeadline } from '@/utils/entries';
import { cardMeta } from '@/utils/visualize';

/** The design's soft cream for everything written on the Visualize screen. */
export const CREAM = '#EEF2C8';
export const COLUMN_WIDTH = 220;

const BREATHE = { from: { opacity: 0.45 }, to: { opacity: 1 } };

type ColumnProps = {
  /** Height the column fills (the gallery's height). */
  height: number;
  /** Side of the square picture (smaller on short phones). */
  size: number;
};

type PaintingProps = ColumnProps & {
  dream: Dream;
  reduceMotion: boolean;
  onChange: (id: string, change: SetStateAction<Dream | null>) => void;
  onOpen: (dream: Dream) => void;
};

/**
 * One dream in the Visualize gallery: its date, mood and title over its picture. Paints
 * the picture on the server if it has none yet (and checks back while it's painting).
 */
export function Painting({ dream, height, size, reduceMotion, onChange, onOpen }: PaintingProps) {
  const setDream: Dispatch<SetStateAction<Dream | null>> = (change) => onChange(dream.id, change);
  const image = useDreamImage(dream, setDream);
  const title = dreamHeadline(dream);
  const ready = dream.image_status === 'completed' && !!dream.image_url;
  const failed = dream.image_status === 'failed' && !image.generating;

  function press() {
    if (failed) image.retry();
    else onOpen(dream);
  }

  return (
    <Column
      height={height}
      size={size}
      meta={cardMeta(dream)}
      title={title}
      label={ready ? `${title}. See it full screen.` : failed ? `${title}. Couldn’t paint it; try again.` : `${title}, still painting.`}
      background="#1a1a1a"
      onPress={press}>
      {ready ? (
        <Image source={{ uri: dream.image_url! }} style={StyleSheet.absoluteFill} contentFit="cover" transition={400} accessibilityIgnoresInvertColors />
      ) : failed ? (
        <Text style={styles.status}>couldn’t paint it.{'\n'}tap to try again.</Text>
      ) : (
        <Animated.Text
          style={[
            styles.status,
            animate(reduceMotion, {
              animationName: BREATHE,
              animationDuration: 1200,
              animationDirection: 'alternate',
              animationIterationCount: 'infinite',
              animationTimingFunction: 'ease-in-out',
            }),
          ]}>
          painting…
        </Animated.Text>
      )}
    </Column>
  );
}

/** The last column: tonight's dream, still to come. */
export function NextDream({ height, size, onPress }: ColumnProps & { onPress: () => void }) {
  return (
    <Column height={height} size={size} meta="tonight • ?" title="your next dream" label="Tell afterdream a new dream" background={BrandColors.lime} onPress={onPress}>
      <Text style={styles.hint}>tell afterdream what you saw and we’ll paint it here.</Text>
    </Column>
  );
}

type ColumnBaseProps = ColumnProps & {
  meta: string;
  title: string;
  label: string;
  background: string;
  onPress: () => void;
  children: React.ReactNode;
};

function Column({ height, size, meta, title, label, background, onPress, children }: ColumnBaseProps) {
  return (
    <View style={[styles.column, { height }]}>
      <View style={styles.head}>
        <Text style={styles.meta}>{meta}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {title}
        </Text>
      </View>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        style={({ pressed }) => [styles.frame, { width: size, height: size, backgroundColor: background }, pressed && styles.pressed]}>
        {children}
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  column: {
    width: COLUMN_WIDTH,
    gap: 16,
  },
  head: {
    gap: 12,
  },
  meta: {
    fontFamily: BrandFonts.regular,
    fontSize: 14,
    lineHeight: 17,
    color: CREAM,
  },
  title: {
    fontFamily: BrandFonts.regular,
    fontSize: 40,
    lineHeight: 41,
    letterSpacing: -1.4,
    color: CREAM,
  },
  frame: {
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  pressed: {
    transform: [{ scale: 0.98 }],
  },
  status: {
    margin: 18,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: CREAM,
  },
  hint: {
    margin: 18,
    fontFamily: BrandFonts.regular,
    fontSize: 15,
    lineHeight: 20,
    color: '#111',
  },
});
