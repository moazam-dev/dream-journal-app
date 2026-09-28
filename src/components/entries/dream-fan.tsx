import { Image } from 'expo-image';
import { useEffect, useEffectEvent, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withTiming, type SharedValue } from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { animate } from '@/components/today/motion';
import { BrandColors, BrandFonts } from '@/constants/theme';
import type { Dream } from '@/types/dream';
import { clampFan, entryDate, fanCard } from '@/utils/entries';

import { DEAL, OUT } from './motion';

const CARD_WIDTH = 180;
const CARD_HEIGHT = 250;
export const FAN_HEIGHT = 360;
/** Dragging this far moves the fan by one card. */
const DRAG_PER_CARD = 70;
/** Cards turn around a point this far below their top, so they spread like a hand of cards. */
const PIVOT = 900;
const SETTLE = { duration: 500, easing: Easing.bezier(0.2, 0.8, 0.2, 1) };

type DreamFanProps = {
  dreams: Dream[];
  /** The card in the middle. */
  current: number;
  width: number;
  reduceMotion: boolean;
  /** Dragged or tapped to another card. */
  onChange: (index: number) => void;
  /** Tapped the middle card. */
  onPick: (dream: Dream) => void;
};

/**
 * The dreams that have been seen (painted), fanned out like a hand of cards.
 * Drag sideways to spread through them; tap a card to bring it to the middle,
 * and tap the middle one to read it.
 */
export function DreamFan({ dreams, current, width, reduceMotion, onChange, onPick }: DreamFanProps) {
  const offset = useSharedValue(current);
  // How many cards there are, read by the drag handlers when they run.
  const count = useSharedValue(dreams.length);
  // Where the last drag came to rest; telling the parent happens in an effect below.
  const [rested, setRested] = useState<{ index: number } | null>(null);
  const notify = useEffectEvent(onChange);

  useEffect(() => {
    count.set(dreams.length);
  }, [dreams.length, count]);

  useEffect(() => {
    if (rested) notify(rested.index);
  }, [rested]);

  useEffect(() => {
    offset.set(reduceMotion ? current : withTiming(current, SETTLE));
  }, [current, reduceMotion, offset]);

  const [responder] = useState(() => {
    let start = 0;
    const settle = () => {
      const settled = Math.round(clampFan(offset.get(), count.get()));
      offset.set(withTiming(settled, SETTLE));
      setRested({ index: settled });
    };
    return PanResponder.create({
      // Only sideways drags belong to the fan; up and down still scroll the page.
      onMoveShouldSetPanResponderCapture: (_, g) => Math.abs(g.dx) > 6 && Math.abs(g.dx) > Math.abs(g.dy),
      onPanResponderGrant: () => {
        start = offset.get();
      },
      onPanResponderMove: (_, g) => {
        offset.set(clampFan(start - g.dx / DRAG_PER_CARD, count.get(), 0.4));
      },
      onPanResponderRelease: settle,
      onPanResponderTerminate: settle,
      onPanResponderTerminationRequest: () => false,
    });
  });

  return (
    <View style={styles.fan} {...responder.panHandlers}>
      {dreams.map((dream, i) => (
        <FanCard
          key={dream.id}
          dream={dream}
          index={i}
          offset={offset}
          left={(width - CARD_WIDTH) / 2}
          selected={i === current}
          reduceMotion={reduceMotion}
          onPress={() => (i === current ? onPick(dream) : onChange(i))}
        />
      ))}
    </View>
  );
}

type FanCardProps = {
  dream: Dream;
  index: number;
  offset: SharedValue<number>;
  left: number;
  selected: boolean;
  reduceMotion: boolean;
  onPress: () => void;
};

function FanCard({ dream, index, offset, left, selected, reduceMotion, onPress }: FanCardProps) {
  const place = useAnimatedStyle(() => {
    const card = fanCard(index - offset.value);
    return {
      opacity: card.opacity,
      zIndex: card.z,
      transform: [{ rotate: `${card.rotate}deg` }, { translateY: card.lift }, { scale: card.scale }],
    };
  });
  const dim = useAnimatedStyle(() => ({ opacity: fanCard(index - offset.value).dim }));

  return (
    <Animated.View style={[styles.slot, { left }, place]}>
      <Animated.View
        style={[
          styles.fill,
          animate(reduceMotion, { animationName: DEAL, animationDuration: 800, animationDelay: 150 + Math.min(index, 5) * 70, animationTimingFunction: OUT }),
        ]}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${dream.title ?? 'a dream'}, ${entryDate(dream)}`}
          accessibilityState={{ selected }}
          onPress={onPress}
          style={styles.card}>
          <Image source={{ uri: dream.image_url ?? undefined }} style={styles.fill} contentFit="cover" transition={200} />
          <Svg style={styles.fill} width="100%" height="100%" preserveAspectRatio="none" pointerEvents="none">
            <Defs>
              <LinearGradient id="fanShade" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0.55" stopColor="#000" stopOpacity={0} />
                <Stop offset="1" stopColor="#000" stopOpacity={0.75} />
              </LinearGradient>
            </Defs>
            <Rect width="100%" height="100%" fill="url(#fanShade)" />
          </Svg>
          <Animated.View pointerEvents="none" style={[styles.fill, styles.dim, dim]} />
          <Text style={styles.date}>{entryDate(dream)}</Text>
          {selected && <View pointerEvents="none" style={styles.ring} />}
        </Pressable>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fan: {
    height: FAN_HEIGHT,
    marginTop: 28,
  },
  slot: {
    position: 'absolute',
    top: 60,
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transformOrigin: ['50%', PIVOT, 0],
  },
  fill: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  card: {
    flex: 1,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: '#111',
    boxShadow: '0 20px 40px -10px rgba(0,0,0,0.9)',
  },
  dim: {
    backgroundColor: '#000',
  },
  date: {
    position: 'absolute',
    left: 12,
    bottom: 12,
    fontFamily: BrandFonts.semibold,
    fontSize: 12,
    lineHeight: 14,
    color: '#fff',
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: `${BrandColors.lime}E6`,
  },
});
