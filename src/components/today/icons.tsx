import Svg, { Path, Rect } from 'react-native-svg';

type IconProps = {
  size?: number;
  color?: string;
};

/** Arrow rising out of a tray: the usual "share" mark. */
export function ShareIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M12 14.5V3.5M7.5 8 12 3.5 16.5 8" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M8 11H6.5A1.5 1.5 0 0 0 5 12.5v7A1.5 1.5 0 0 0 6.5 21h11a1.5 1.5 0 0 0 1.5-1.5v-7a1.5 1.5 0 0 0-1.5-1.5H16" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Two overlapping sheets, for copying text. */
export function CopyIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={8.5} y={8.5} width={12} height={12} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M15.5 5.5v-.5A1.5 1.5 0 0 0 14 3.5H5A1.5 1.5 0 0 0 3.5 5v9A1.5 1.5 0 0 0 5 15.5h.5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

/** Closed padlock, for sealed messages. */
export function LockIcon({ size = 16, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x={4.5} y={10.5} width={15} height={10.5} rx={2.5} stroke={color} strokeWidth={2} />
      <Path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
