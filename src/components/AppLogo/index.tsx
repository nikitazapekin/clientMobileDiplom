import React from "react";
import Svg, { Circle, Line } from "react-native-svg";

interface AppLogoProps {
  size?: number;
}

const COLORS = {
  red: "#F44735",
  blue: "#4D84E5",
  green: "#3FAF58",
  yellow: "#F7C21B",
  hole: "#FFFFFF",
};

export default function AppLogo({ size = 44 }: AppLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Line x1="23" y1="20" x2="14.5" y2="28.5" stroke={COLORS.red} strokeWidth="6" strokeLinecap="round" />
      <Line x1="41" y1="28.5" x2="49.5" y2="20" stroke={COLORS.blue} strokeWidth="6" strokeLinecap="round" />
      <Line x1="41" y1="35.5" x2="49.5" y2="44" stroke={COLORS.green} strokeWidth="6" strokeLinecap="round" />
      <Line x1="23" y1="44" x2="14.5" y2="35.5" stroke={COLORS.yellow} strokeWidth="6" strokeLinecap="round" />

      <Circle cx="32" cy="14" r="10" fill={COLORS.red} />
      <Circle cx="14" cy="32" r="10" fill={COLORS.yellow} />
      <Circle cx="50" cy="32" r="10" fill={COLORS.blue} />
      <Circle cx="32" cy="50" r="10" fill={COLORS.green} />

      <Circle cx="32" cy="14" r="4.2" fill={COLORS.hole} />
      <Circle cx="14" cy="32" r="4.2" fill={COLORS.hole} />
      <Circle cx="50" cy="32" r="4.2" fill={COLORS.hole} />
      <Circle cx="32" cy="50" r="4.2" fill={COLORS.hole} />
    </Svg>
  );
}
