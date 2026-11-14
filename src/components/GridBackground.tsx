import { StyleSheet } from 'react-native';
import Svg, { Defs, Path, Pattern, Rect } from 'react-native-svg';

import { useColors } from '@/theme';

/** Sfondo a quadretti in stile carta millimetrata Y2K. */
export function GridBackground() {
  const C = useColors();
  return (
    <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
      <Defs>
        <Pattern id="grid" width={28} height={28} patternUnits="userSpaceOnUse">
          <Path d="M 28 0 L 0 0 0 28" fill="none" stroke={C.grid} strokeWidth={1.5} />
        </Pattern>
      </Defs>
      <Rect width="100%" height="100%" fill="url(#grid)" />
    </Svg>
  );
}
