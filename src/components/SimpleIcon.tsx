import React from 'react';
import Svg, { Path } from 'react-native-svg';

interface SimpleIconProps {
  path: string;
  size?: number;
  color?: string;
}

/**
 * Renders a Simple Icons SVG path (24×24 viewBox) using react-native-svg.
 */
export const SimpleIcon = ({ path, size = 24, color = '#000' }: SimpleIconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill={color}>
    <Path d={path} />
  </Svg>
);
