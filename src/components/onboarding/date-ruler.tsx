import { useRef, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  type AccessibilityActionEvent,
  type NativeScrollEvent,
  type NativeSyntheticEvent,
} from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { BrandColors, BrandFonts, NightColors } from '@/constants/theme';

type DateRulerProps = {
  /** One label per stop on the ruler, e.g. month names or years. */
  labels: string[];
  /** Selected label (0-based). */
  index: number;
  onChange: (index: number) => void;
  /** Read out by screen readers, e.g. "month". */
  accessibilityLabel: string;
  reduceMotion: boolean;
};

/** Width of one stop on the ruler (pt). */
const ITEM_WIDTH = 72;
const HEIGHT = 96;
/** The edges fade out over this share of the ruler's width, like the design's mask. */
const FADE_SHARE = 0.25;

/**
 * A ruler you drag sideways: the label under the lime line in the middle is the one chosen.
 * Tapping a label scrolls it to the middle. Remount it (with a new `key`) to swap labels.
 */
export function DateRuler({ labels, index, onChange, accessibilityLabel, reduceMotion }: DateRulerProps) {
  const scroller = useRef<ScrollView>(null);
  // Scroll events are ignored until the ruler has jumped to the starting label.
  const ready = useRef(false);
  const [width, setWidth] = useState(0);
  const last = labels.length - 1;
  const selected = Math.min(index, last);
  // Side padding so the first and last labels can reach the middle.
  const side = Math.max(0, (width - ITEM_WIDTH) / 2);

  function jumpToSelected() {
    if (ready.current) return;
    scroller.current?.scrollTo({ x: selected * ITEM_WIDTH, animated: false });
    requestAnimationFrame(() => {
      ready.current = true;
    });
  }

  function handleScroll(event: NativeSyntheticEvent<NativeScrollEvent>) {
    if (!ready.current) return;
    const i = Math.round(event.nativeEvent.contentOffset.x / ITEM_WIDTH);
    const clamped = Math.max(0, Math.min(last, i));
    if (clamped !== selected) onChange(clamped);
  }

  function pick(i: number) {
    onChange(i);
    scroller.current?.scrollTo({ x: i * ITEM_WIDTH, animated: !reduceMotion });
  }

  function handleAccessibilityAction(event: AccessibilityActionEvent) {
    const step = event.nativeEvent.actionName === 'increment' ? 1 : -1;
    const next = selected + step;
    if (next >= 0 && next <= last) pick(next);
  }

  return (
    <View
      style={styles.ruler}
      onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
      accessible
      accessibilityRole="adjustable"
      accessibilityLabel={accessibilityLabel}
      accessibilityValue={{ text: labels[selected] }}
      accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
      onAccessibilityAction={handleAccessibilityAction}>
      {width > 0 && (
        <ScrollView
          ref={scroller}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={ITEM_WIDTH}
          decelerationRate="fast"
          scrollEventThrottle={16}
          onScroll={handleScroll}
          onContentSizeChange={jumpToSelected}
          contentContainerStyle={{ paddingHorizontal: side }}>
          {labels.map((label, i) => {
            const on = i === selected;
            const near = Math.abs(i - selected) === 1;
            return (
              <Pressable key={label} onPress={() => pick(i)} style={styles.item} importantForAccessibility="no">
                <Animated.Text
                  numberOfLines={1}
                  style={[
                    styles.label,
                    {
                      color: on ? NightColors.text : near ? NightColors.hint : RulerColors.far,
                      transitionProperty: 'color',
                      transitionDuration: reduceMotion ? 0 : 200,
                      transitionTimingFunction: 'ease',
                    },
                  ]}>
                  {label}
                </Animated.Text>
                <View style={styles.ticks}>
                  <View style={styles.tick} />
                  <View style={styles.tick} />
                  <Animated.View
                    style={[
                      styles.centerTick,
                      {
                        backgroundColor: on ? BrandColors.lime : RulerColors.centerTick,
                        transform: [{ scaleY: on ? 1 : 18 / 30 }],
                        transitionProperty: ['backgroundColor', 'transform'],
                        transitionDuration: reduceMotion ? 0 : 200,
                        transitionTimingFunction: 'ease',
                      },
                    ]}
                  />
                  <View style={styles.tick} />
                  <View style={styles.tick} />
                </View>
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Fade both ends into the black background (the design masks them). */}
      <Svg style={[styles.fade, styles.fadeLeft]} pointerEvents="none">
        <Defs>
          <LinearGradient id="rulerFadeLeft" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={NightColors.background} stopOpacity={1} />
            <Stop offset="1" stopColor={NightColors.background} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#rulerFadeLeft)" />
      </Svg>
      <Svg style={[styles.fade, styles.fadeRight]} pointerEvents="none">
        <Defs>
          <LinearGradient id="rulerFadeRight" x1="1" y1="0" x2="0" y2="0">
            <Stop offset="0" stopColor={NightColors.background} stopOpacity={1} />
            <Stop offset="1" stopColor={NightColors.background} stopOpacity={0} />
          </LinearGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#rulerFadeRight)" />
      </Svg>

      <View style={styles.needle} pointerEvents="none" />
    </View>
  );
}

/** Greys only the ruler uses. */
const RulerColors = {
  far: '#4A4A4A',
  tick: '#3A3A3A',
  centerTick: '#5A5A5A',
} as const;

const styles = StyleSheet.create({
  ruler: {
    height: HEIGHT,
  },
  item: {
    width: ITEM_WIDTH,
    height: HEIGHT,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    paddingBottom: 4,
  },
  label: {
    fontFamily: BrandFonts.medium,
    fontSize: 17,
    lineHeight: 20,
  },
  ticks: {
    width: ITEM_WIDTH,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tick: {
    width: 1,
    height: 10,
    backgroundColor: RulerColors.tick,
  },
  centerTick: {
    width: 1.5,
    height: 30,
    transformOrigin: 'bottom',
  },
  fade: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: `${FADE_SHARE * 100}%`,
  },
  fadeLeft: {
    left: 0,
  },
  fadeRight: {
    right: 0,
  },
  // The lime line marking the chosen label.
  needle: {
    position: 'absolute',
    left: '50%',
    top: 0,
    bottom: 0,
    width: 2,
    marginLeft: -1,
    borderRadius: 1,
    backgroundColor: BrandColors.lime,
  },
});
