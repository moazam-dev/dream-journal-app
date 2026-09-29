import { memo, useEffect } from 'react';
import Animated, { useAnimatedProps, useFrameCallback, useSharedValue, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, Path, RadialGradient, Stop } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

/** Height of the visual, and where its middle sits inside it (the design's 390×420 canvas). */
export const VISUAL_HEIGHT = 420;
const CENTRE_Y = 210;

/** Afterdream's colours, and yours. The whole picture crossfades between them as the turn changes. */
const AFTERDREAM = ['#E2EB98', '#b9c46a', '#EEF2C8'] as const;
const YOU = ['#8e9fd6', '#EEF2C8', '#ffffff'] as const;

/**
 * Points around the blob. The design's canvas walks 120 straight segments; here they are the
 * control points of a closed Catmull-Rom spline instead, so a third of them draw a curve with
 * no flat spots at all — smoother than the original, and cheaper to rebuild every frame.
 */
const ORB_STEPS = 44;
/** A little larger than the design's 78, so the orb carries the screen. */
const BASE_RADIUS = 96;
const HALO_RADIUS = 215;

/**
 * How fast the picture catches up, per second. Converted to a per-frame amount from the real
 * frame time, so it settles at the same rate on a 60 Hz phone and a 120 Hz one — the design's
 * fixed 0.14 and 0.06 per frame would run at double speed on ProMotion.
 */
const LEVEL_RATE = 9;
const MIX_RATE = 3.7;

/** What the picture is doing, which decides how loud it moves and whose colours it wears. */
export type VisualMode = 'idle' | 'afterdream' | 'you' | 'thinking';

const IDLE = 0;
const AFTERDREAM_TURN = 1;
const YOUR_TURN = 2;
const THINKING = 3;
const MODE_CODE: Record<VisualMode, number> = {
  idle: IDLE,
  afterdream: AFTERDREAM_TURN,
  you: YOUR_TURN,
  thinking: THINKING,
};

/**
 * The mode as a number, to be kept in a shared value by whoever owns the conversation.
 *
 * The picture is driven entirely through shared values rather than props on purpose. Reanimated
 * re-registers a frame callback whenever the component renders — and a fresh registration starts
 * its clock over, which jolts every sine in the orb. Nothing here re-renders, so that never
 * happens; the elapsed time is also counted up by hand below, belt and braces.
 */
export function visualModeCode(mode: VisualMode) {
  return MODE_CODE[mode];
}

/**
 * One layer of the blob: a circle pushed in and out by three summed sines (the design's shape),
 * drawn as a closed Catmull-Rom spline so the outline is round rather than faceted.
 */
function orbPath(centreX: number, t: number, level: number, layer: number) {
  'worklet';
  const radius = BASE_RADIUS * (1 + level * 0.18);
  const swell = 4 + level * 26;

  const xs: number[] = [];
  const ys: number[] = [];
  for (let i = 0; i < ORB_STEPS; i++) {
    const a = (i / ORB_STEPS) * Math.PI * 2;
    const wobble =
      Math.sin(a * 3 + t * 1.7 + layer * 2) +
      Math.sin(a * 5 - t * 2.3 + layer) * 0.6 +
      Math.sin(a * 2 + t * 0.9 + layer * 3) * 0.8;
    const r = radius - layer * 6 + (swell * wobble) / 2.4;
    xs.push(centreX + Math.cos(a) * r);
    ys.push(CENTRE_Y + Math.sin(a) * r);
  }

  // Each segment's two control points come from its neighbours, wrapping all the way round
  // so the join back to the first point is as smooth as every other.
  const n = ORB_STEPS;
  let d = `M${xs[0].toFixed(1)} ${ys[0].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = (i - 1 + n) % n;
    const p1 = i;
    const p2 = (i + 1) % n;
    const p3 = (i + 2) % n;
    const c1x = xs[p1] + (xs[p2] - xs[p0]) / 6;
    const c1y = ys[p1] + (ys[p2] - ys[p0]) / 6;
    const c2x = xs[p2] - (xs[p3] - xs[p1]) / 6;
    const c2y = ys[p2] - (ys[p3] - ys[p1]) / 6;
    d += `C${c1x.toFixed(1)} ${c1y.toFixed(1)} ${c2x.toFixed(1)} ${c2y.toFixed(1)} ${xs[p2].toFixed(1)} ${ys[p2].toFixed(1)}`;
  }
  return `${d}Z`;
}

type VoiceVisualProps = {
  /** The current mode as a number, from `visualModeCode`. */
  mode: SharedValue<number>;
  muted: SharedValue<boolean>;
  /** Your microphone, 0–1, straight off the native audio engine. */
  inputLevel: SharedValue<number>;
  /** Afterdream's voice, 0–1. */
  outputLevel: SharedValue<number>;
  width: number;
  reduceMotion: boolean;
};

/**
 * The living picture at the centre of the voice screen, from the Afterdream Voice Agent design:
 * a soft halo and a three-layer blob that wobbles and swells with whoever is talking. The
 * design's `visual` prop offers the orb, the sound waves, or both; this is the orb on its own,
 * so nothing cuts across the screen behind it.
 *
 * The design draws this on a 2D canvas every frame. Here the same maths runs in one Reanimated
 * frame callback on the UI thread, writing three SVG paths into shared values, so the
 * JavaScript thread never touches the animation.
 */
export const VoiceVisual = memo(function VoiceVisual({
  mode: modeCode,
  muted: isMuted,
  inputLevel,
  outputLevel,
  width,
  reduceMotion,
}: VoiceVisualProps) {
  const centreX = width / 2;

  // Smoothed loudness (the design's `lv`) and whose turn it is (`mix`: 1 afterdream, 0 you).
  const level = useSharedValue(0.08);
  const mix = useSharedValue(1);
  // Our own clock. Reanimated's `timeSinceFirstFrame` restarts whenever the callback is
  // re-registered; this only ever goes up, so the wobble never jumps.
  const elapsed = useSharedValue(0);

  // One path per blob layer, filled in by the frame callback below.
  const orb0 = useSharedValue('');
  const orb1 = useSharedValue('');
  const orb2 = useSharedValue('');

  const frame = useFrameCallback((info) => {
    'worklet';
    // Clamped so a stall (a dropped frame, coming back from the background, the callback being
    // re-registered) eases in rather than snapping the whole way in one step.
    const dt = Math.min((info.timeSincePreviousFrame ?? 16.7) / 1000, 0.05);
    elapsed.value += dt;
    const t = elapsed.value;
    const code = modeCode.value;

    // How loud the picture should be right now. Real audio levels win; the design's
    // synthetic wobble fills in before any sound has arrived.
    let target = 0.06 + Math.sin(t * 1.3) * 0.03;
    if (code === THINKING) {
      target = 0.3 + Math.sin(t * 3) * 0.1;
    } else if (code === AFTERDREAM_TURN) {
      const out = outputLevel.value;
      target = out > 0.01 ? 0.3 + out * 0.65 : 0.3 + 0.55 * Math.abs(Math.sin(t * 8.5) * Math.sin(t * 2.7 + 1));
    } else if (code === YOUR_TURN) {
      if (isMuted.value) {
        target = 0.03;
      } else {
        const mic = inputLevel.value;
        target = mic > 0.01 ? 0.1 + mic * 0.9 : 0.12 + 0.1 * Math.abs(Math.sin(t * 6.1));
      }
    }
    level.value += (target - level.value) * (1 - Math.exp(-LEVEL_RATE * dt));
    mix.value += ((code === YOUR_TURN ? 0 : 1) - mix.value) * (1 - Math.exp(-MIX_RATE * dt));

    const lv = level.value;
    orb0.value = orbPath(centreX, t, lv, 0);
    orb1.value = orbPath(centreX, t, lv, 1);
    orb2.value = orbPath(centreX, t, lv, 2);
  }, false);

  // Reduced motion: one still frame instead of the loop.
  useEffect(() => {
    frame.setActive(!reduceMotion);
    if (!reduceMotion) return;
    orb0.set(orbPath(centreX, 0, 0, 0));
    orb1.set(orbPath(centreX, 0, 0, 1));
    orb2.set(orbPath(centreX, 0, 0, 2));
  }, [reduceMotion, centreX, frame, orb0, orb1, orb2]);

  const afterdreamGroup = useAnimatedProps(() => ({ opacity: mix.value }));
  const youGroup = useAnimatedProps(() => ({ opacity: 1 - mix.value }));
  const haloProps = useAnimatedProps(() => ({ opacity: 0.18 + level.value * 0.25 }));
  const orbProps0 = useAnimatedProps(() => ({ d: orb0.value }));
  const orbProps1 = useAnimatedProps(() => ({ d: orb1.value }));
  const orbProps2 = useAnimatedProps(() => ({ d: orb2.value }));
  const orbProps = [orbProps0, orbProps1, orbProps2];

  /** One whole picture in one palette. Two of these are stacked and crossfaded on `mix`. */
  function palette(name: string, colours: readonly string[]) {
    return (
      <>
        <AnimatedCircle cx={centreX} cy={CENTRE_Y} r={HALO_RADIUS} fill={`url(#halo-${name})`} animatedProps={haloProps} />
        {orbProps.map((props, layer) => (
          <AnimatedPath key={layer} animatedProps={props} fill={`url(#orb-${name}-${layer})`} opacity={0.55} />
        ))}
      </>
    );
  }

  /** What each palette paints with: a white hot spot up and to the left, fading out. */
  function gradients(name: string, colours: readonly string[]) {
    return (
      <>
        <RadialGradient id={`halo-${name}`} cx={centreX} cy={CENTRE_Y} r={HALO_RADIUS} gradientUnits="userSpaceOnUse">
          <Stop offset="0" stopColor={colours[0]} stopOpacity="1" />
          <Stop offset="1" stopColor={colours[0]} stopOpacity="0" />
        </RadialGradient>
        {colours.map((colour, layer) => (
          <RadialGradient
            key={layer}
            id={`orb-${name}-${layer}`}
            cx={centreX}
            cy={CENTRE_Y}
            r={BASE_RADIUS * 1.3}
            fx={centreX - 20}
            fy={CENTRE_Y - 25}
            gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#ffffff" stopOpacity="0.95" />
            <Stop offset="0.45" stopColor={colour} stopOpacity="0.8" />
            <Stop offset="1" stopColor={colour} stopOpacity="0.05" />
          </RadialGradient>
        ))}
      </>
    );
  }

  return (
    <Svg width={width} height={VISUAL_HEIGHT} pointerEvents="none">
      <Defs>
        {gradients('a', AFTERDREAM)}
        {gradients('y', YOU)}
      </Defs>
      <AnimatedG animatedProps={afterdreamGroup}>{palette('a', AFTERDREAM)}</AnimatedG>
      <AnimatedG animatedProps={youGroup}>{palette('y', YOU)}</AnimatedG>
    </Svg>
  );
});
