import Svg, { Circle, Path, Rect } from 'react-native-svg';

// Icons from the Afterdream Settings design (24×24 viewBox, drawn at 22px in the list).

type IconProps = { size?: number; color?: string };

export function BackIcon({ size = 20, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M19 12H5M11 6l-6 6 6 6" />
    </Svg>
  );
}

/** The cog on the Patterns header that opens settings. */
export function GearIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <Circle cx={12} cy={12} r={3} />
      <Path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </Svg>
  );
}

export function BellIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 3a6 6 0 0 0-6 6v4l-2 3h16l-2-3V9a6 6 0 0 0-6-6zm-2.5 15a2.5 2.5 0 0 0 5 0z" />
    </Svg>
  );
}

export function PasscodeIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={5} cy={5} r={2} />
      <Circle cx={12} cy={5} r={2} />
      <Circle cx={19} cy={5} r={2} />
      <Circle cx={5} cy={12} r={2} />
      <Circle cx={12} cy={12} r={2} />
      <Circle cx={19} cy={12} r={2} />
      <Circle cx={12} cy={19} r={2} />
    </Svg>
  );
}

export function FaceIdIcon({ size = 22, color = '#fff', strokeWidth = 2 }: IconProps & { strokeWidth?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round">
      <Path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M9 9v1M15 9v1M9 15c1.5 1.3 4.5 1.3 6 0" />
    </Svg>
  );
}

export function ExportIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Rect x={5} y={3} width={4} height={18} rx={1} />
      <Rect x={10} y={3} width={9} height={18} rx={2} />
    </Svg>
  );
}

export function DownloadIcon({ size = 18, color = '#111' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
    </Svg>
  );
}

export function DeleteIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M4 4h16l-3 6H7z" />
      <Circle cx={12} cy={17} r={4} />
    </Svg>
  );
}

export function FeedbackIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M5 3h14a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-4l-3 4-3-4H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <Path d="M8.5 10c1.8 2 5.2 2 7 0" stroke="#000" strokeWidth={1.8} fill="none" strokeLinecap="round" />
    </Svg>
  );
}

export function TermsIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5z" />
      <Path d="M8.5 12l2.5 2.5 4.5-5" stroke="#000" strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

export function PrivacyIcon({ size = 22, color = '#fff' }: IconProps) {
  const petals: [number, number][] = [
    [12, 3.5],
    [12, 20.5],
    [3.5, 12],
    [20.5, 12],
    [6, 6],
    [18, 6],
    [6, 18],
    [18, 18],
  ];
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
      <Circle cx={12} cy={12} r={7} />
      {petals.map(([cx, cy]) => (
        <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={2.5} />
      ))}
    </Svg>
  );
}

export function InstagramIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4}>
      <Rect x={3} y={3} width={18} height={18} rx={5} />
      <Circle cx={12} cy={12} r={4} />
    </Svg>
  );
}

export function TikTokIcon({ size = 22, color = '#fff' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.6} strokeLinecap="round">
      <Path d="M13 3v12a4 4 0 1 1-4-4M13 3c.5 3 2.5 5 6 5" />
    </Svg>
  );
}
