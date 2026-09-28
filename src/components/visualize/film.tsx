import { StyleSheet } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

/** Darkens only the edges (the header, the title and controls), leaving the picture clear. */
export function Shade() {
  return (
    <Svg pointerEvents="none" style={StyleSheet.absoluteFill} width="100%" height="100%" preserveAspectRatio="none">
      <Defs>
        <LinearGradient id="visualizeShade" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#000" stopOpacity={0.4} />
          <Stop offset="0.12" stopColor="#000" stopOpacity={0} />
          <Stop offset="0.62" stopColor="#000" stopOpacity={0} />
          <Stop offset="1" stopColor="#000" stopOpacity={0.75} />
        </LinearGradient>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#visualizeShade)" />
    </Svg>
  );
}
