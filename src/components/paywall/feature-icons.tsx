import Svg, { Path, Rect } from 'react-native-svg';

import { BrandColors } from '@/constants/theme';

import type { PaidFeature } from '@/utils/subscription';

const SIZE = 20;
const LIME = BrandColors.lime;

/** The little lime mark beside each line on the paywall, one per paid feature. */
export function FeatureIcon({ feature }: { feature: PaidFeature }) {
  return (
    <Svg width={SIZE} height={SIZE} viewBox="0 0 20 20">
      {MARKS[feature]}
    </Svg>
  );
}

const MARKS: Record<PaidFeature, React.ReactNode> = {
  // A microphone: the voice agent.
  voice: (
    <>
      <Rect x={7} y={1} width={6} height={11} rx={3} fill={LIME} />
      <Path d="M3.5 9a6.5 6.5 0 0013 0M10 15.5V19" stroke={LIME} strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </>
  ),
  // A sprig with two leaves: the dream garden.
  garden: (
    <>
      <Path d="M10 19V9" stroke={LIME} strokeWidth={1.8} strokeLinecap="round" />
      <Path d="M10 10C10 5 6.5 3 2.5 3c0 4 2.5 7 7.5 7zM10 12c0-4 3-6 7.5-6 0 3.5-2.5 6-7.5 6z" fill={LIME} />
    </>
  ),
  // A four-pointed star: dreams turned into pictures.
  visualize: <Path d="M10 1l2.2 6.8L19 10l-6.8 2.2L10 19l-2.2-6.8L1 10l6.8-2.2z" fill={LIME} />,
  // Three bars: weeks of sleep read back.
  patterns: (
    <>
      <Rect x={2} y={11} width={3.2} height={7} rx={1.6} fill={LIME} />
      <Rect x={8.4} y={4} width={3.2} height={14} rx={1.6} fill={LIME} />
      <Rect x={14.8} y={8} width={3.2} height={10} rx={1.6} fill={LIME} />
    </>
  ),
  // An hourglass: notes sealed for future you.
  capsules: (
    <Path
      d="M4 2h12M4 18h12M5 2c0 5 10 5 10 8s-10 3-10 8M15 2c0 5-10 5-10 8"
      stroke={LIME}
      strokeWidth={1.8}
      fill="none"
      strokeLinecap="round"
    />
  ),
};
