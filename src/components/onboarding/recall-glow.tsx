import { StyleSheet, View } from 'react-native';
import Animated from 'react-native-reanimated';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';

import { BrandColors } from '@/constants/theme';

type RecallGlowProps = {
  /** Accent of the picked answer, or `null` before anything is picked. */
  color: string | null;
  /** Every accent the glow can take, so each one's layer is ready to fade in. */
  colors: readonly string[];
  top: number;
  reduceMotion: boolean;
};

const FADE_MS = 800;

/**
 * A soft glow at the top of the screen that takes on the picked answer's colour.
 * SVG gradients can't blend between colours, so there's one layer per colour and they cross-fade.
 */
export function RecallGlow({ color, colors, top, reduceMotion }: RecallGlowProps) {
  return (
    <View pointerEvents="none" style={[styles.glow, { top }]}>
      {/* Before a pick: a faint lime haze. */}
      <Layer id="glow-idle" color={BrandColors.lime} strength={0.2} opacity={color === null ? 0.5 : 0} reduceMotion={reduceMotion} />
      {colors.map((c, k) => (
        <Layer key={c} id={`glow-${k}`} color={c} strength={0.33} opacity={c === color ? 0.9 : 0} reduceMotion={reduceMotion} />
      ))}
    </View>
  );
}

type LayerProps = {
  id: string;
  color: string;
  /** Opacity at the centre of the gradient. */
  strength: number;
  opacity: number;
  reduceMotion: boolean;
};

function Layer({ id, color, strength, opacity, reduceMotion }: LayerProps) {
  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          opacity,
          transitionProperty: 'opacity',
          transitionDuration: reduceMotion ? 0 : FADE_MS,
          transitionTimingFunction: 'ease',
        },
      ]}>
      {/* The design's radial-gradient(50% 50% at 50% 50%, colour, transparent 70%). */}
      <Svg width="100%" height="100%">
        <Defs>
          <RadialGradient id={id} cx="50%" cy="50%" rx="50%" ry="50%" fx="50%" fy="50%">
            <Stop offset="0" stopColor={color} stopOpacity={strength} />
            <Stop offset="0.7" stopColor={color} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill={`url(#${id})`} />
      </Svg>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  glow: {
    position: 'absolute',
    left: -60,
    right: -60,
    height: 520,
  },
});
