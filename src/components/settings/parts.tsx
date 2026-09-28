import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';
import Animated, { useReducedMotion } from 'react-native-reanimated';

import type { Shape } from '@/components/settings/content';
import { BrandFonts as F, SettingsColors as C } from '@/constants/theme';

/** The design's switch: lime and to the right when on, dark grey when off. */
export function Toggle({ on, onPress, label }: { on: boolean; onPress: () => void; label: string }) {
  const reduceMotion = useReducedMotion();
  return (
    <Pressable accessibilityRole="switch" accessibilityState={{ checked: on }} accessibilityLabel={label} onPress={onPress} hitSlop={6}>
      <Animated.View
        style={[
          styles.track,
          { backgroundColor: on ? C.lime : C.chip },
          !reduceMotion && { transitionProperty: 'backgroundColor', transitionDuration: 200 },
        ]}>
        <Animated.View
          style={[
            styles.knob,
            { transform: [{ translateX: on ? 24 : 0 }] },
            !reduceMotion && { transitionProperty: 'transform', transitionDuration: 200 },
          ]}
        />
      </Animated.View>
    </Pressable>
  );
}

/** A rounded dark panel (the design's 32px cards). */
export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

/** Small grey label above a group of choices. */
export function Label({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={style}>
      <Text style={styles.label}>{children}</Text>
    </View>
  );
}

/** A card with a title, a line under it and a switch on the right. */
export function ToggleCard({ title, note, on, onPress }: { title: string; note: string; on: boolean; onPress: () => void }) {
  return (
    <Card style={styles.toggleCard}>
      <View style={styles.toggleText}>
        <Text style={styles.toggleTitle}>{title}</Text>
        <Text style={styles.toggleNote}>{note}</Text>
      </View>
      <Toggle on={on} onPress={onPress} label={title} />
    </Card>
  );
}

type ButtonProps = {
  title: string;
  onPress?: () => void;
  /** `fill` is a solid pill (lime by default), `outline` a thin grey ring. */
  kind?: 'fill' | 'outline';
  color?: string;
  textColor?: string;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
};

/** The wide pill buttons at the bottom of each page. */
export function PillButton({ title, onPress, kind = 'fill', color = C.lime, textColor = C.ink, disabled = false, style }: ButtonProps) {
  const outline = kind === 'outline';
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled }}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        outline ? styles.outline : [styles.fill, { backgroundColor: color }],
        pressed && !disabled && styles.pressed,
        style,
      ]}>
      <Text style={[outline ? styles.outlineText : styles.fillText, { color: outline ? C.text : textColor }]}>{title}</Text>
    </Pressable>
  );
}

/** A rounded chip that is white or lime when picked. */
export function Chip({
  title,
  selected,
  onPress,
  selectedColor = C.lime,
  style,
}: {
  title: string;
  selected: boolean;
  onPress: () => void;
  selectedColor?: string;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, { backgroundColor: selected ? selectedColor : C.chip }, style]}>
      <Text style={[styles.chipText, { color: selected ? C.ink : C.text }]}>{title}</Text>
    </Pressable>
  );
}

/** The design's CSS border-radius shapes, for a square of `size`. */
export function shapeStyle(shape: Shape, size: number): ViewStyle {
  const half = size / 2;
  switch (shape) {
    case 'circle':
      return { borderRadius: half };
    case 'dome':
      return { borderTopLeftRadius: half, borderTopRightRadius: half };
    case 'rounded':
      return { borderRadius: 12 };
    case 'soft':
      return { borderRadius: 4 };
    case 'leaf':
      return { borderTopRightRadius: half, borderBottomRightRadius: half, borderBottomLeftRadius: half };
    case 'drop':
      return { borderTopLeftRadius: half, borderTopRightRadius: half, borderBottomLeftRadius: half };
  }
}

export const settingsStyles = StyleSheet.create({
  /** Column of cards under the page title. */
  stack: { gap: 8, paddingHorizontal: 8 },
  /** Body copy on black. */
  body: { fontFamily: F.regular, fontSize: 15, lineHeight: 22, color: C.soft },
  /** Big title under a hero card. */
  heading: { fontFamily: F.medium, fontSize: 26, lineHeight: 29, letterSpacing: -0.8, color: C.text },
  /** Title and copy under a hero card. */
  intro: { paddingTop: 14, paddingHorizontal: 14, gap: 10 },
});

const styles = StyleSheet.create({
  track: { width: 56, height: 32, borderRadius: 16, justifyContent: 'center' },
  knob: { position: 'absolute', left: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: '#fff' },
  card: { borderRadius: 32, backgroundColor: C.card, padding: 22 },
  label: { fontFamily: F.medium, fontSize: 15, lineHeight: 18, color: 'rgba(255, 255, 255, 0.7)' },
  toggleCard: { paddingVertical: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
  toggleText: { flex: 1, gap: 4 },
  toggleTitle: { fontFamily: F.medium, fontSize: 18, lineHeight: 22, color: C.text },
  toggleNote: { fontFamily: F.regular, fontSize: 13, lineHeight: 17, color: 'rgba(255, 255, 255, 0.6)' },
  fill: { marginTop: 12, marginHorizontal: 6, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  fillText: { fontFamily: F.semibold, fontSize: 17, lineHeight: 21 },
  outline: {
    marginHorizontal: 6,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: { fontFamily: F.medium, fontSize: 16, lineHeight: 20 },
  pressed: { opacity: 0.8 },
  chip: { height: 44, paddingHorizontal: 16, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  chipText: { fontFamily: F.medium, fontSize: 16, lineHeight: 20 },
});
