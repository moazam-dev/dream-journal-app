import Svg, { Circle, Path } from 'react-native-svg';

/** The Face ID mark: four corner brackets around two eyes and a smile. */
export function FaceIdMark({ size = 22, color = '#000000' }: { size?: number; color?: string }) {
  const stroke = { stroke: color, strokeWidth: 1.6, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path d="M3 8V5.5A2.5 2.5 0 0 1 5.5 3H8" {...stroke} />
      <Path d="M16 3h2.5A2.5 2.5 0 0 1 21 5.5V8" {...stroke} />
      <Path d="M21 16v2.5a2.5 2.5 0 0 1-2.5 2.5H16" {...stroke} />
      <Path d="M8 21H5.5A2.5 2.5 0 0 1 3 18.5V16" {...stroke} />
      <Circle cx={9} cy={10} r={0.9} fill={color} />
      <Circle cx={15} cy={10} r={0.9} fill={color} />
      <Path d="M12 9.6v3.2h-1" {...stroke} />
      <Path d="M9.2 15.4c1.7 1.3 3.9 1.3 5.6 0" {...stroke} />
    </Svg>
  );
}
