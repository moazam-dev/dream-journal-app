import { Platform, StyleSheet, View, type ViewStyle } from 'react-native';
import Animated from 'react-native-reanimated';

type Layer = { color: string; blend: NonNullable<ViewStyle['mixBlendMode']>; opacity: number };

/**
 * The design repaints the picture with a CSS filter per look ("cinematic", "noir", …).
 * Phones can't filter an image, so each look is a few tinted layers blended over it:
 * a grey "saturation" layer drains colour, a vivid one boosts it, "soft-light" adds contrast.
 */
const LOOK_LAYERS: readonly Layer[][] = [
  // as dreamt: a little richer.
  [{ color: '#ff0000', blend: 'saturation', opacity: 0.15 }],
  // cinematic: muted, warm and contrasty.
  [
    { color: '#808080', blend: 'saturation', opacity: 0.2 },
    { color: '#8a5a2b', blend: 'color', opacity: 0.2 },
    { color: '#000000', blend: 'soft-light', opacity: 0.35 },
  ],
  // anime: loud colour, a touch brighter.
  [
    { color: '#ff0000', blend: 'saturation', opacity: 0.55 },
    { color: '#ffffff', blend: 'soft-light', opacity: 0.2 },
  ],
  // oil paint: rich and heavy.
  [
    { color: '#ff0000', blend: 'saturation', opacity: 0.35 },
    { color: '#000000', blend: 'soft-light', opacity: 0.3 },
  ],
  // noir: black and white, hard.
  [
    { color: '#808080', blend: 'saturation', opacity: 1 },
    { color: '#000000', blend: 'soft-light', opacity: 0.45 },
  ],
];

/** Android only blends layers from Android 10; before that the tints would cover the picture. */
const CAN_BLEND = Platform.OS !== 'android' || (typeof Platform.Version === 'number' && Platform.Version >= 29);

/** The tints for look number `look`, laid over the picture below it. */
export function LookTint({ look }: { look: number }) {
  if (!CAN_BLEND) return null;
  return (
    <>
      {(LOOK_LAYERS[look] ?? []).map((layer, i) => (
        <View
          key={`${look}-${i}`}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: layer.color, mixBlendMode: layer.blend, opacity: layer.opacity }]}
        />
      ))}
    </>
  );
}

/**
 * A grey layer that drains colour, fading out as the picture develops. It animates itself:
 * wrapped in another fading view it would blend with nothing.
 */
export function Desaturate({ animation }: { animation: object | null }) {
  if (!CAN_BLEND) return null;
  return (
    <Animated.View
      pointerEvents="none"
      style={[StyleSheet.absoluteFill, { backgroundColor: '#808080', mixBlendMode: 'saturation', opacity: animation ? undefined : 0 }, animation]}
    />
  );
}
