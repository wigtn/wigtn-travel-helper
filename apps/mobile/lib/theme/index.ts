// Travel Helper v2.0 - Theme System

import { useColorScheme } from 'react-native';
import { lightColors, darkColors, chartColors, Colors } from './colors';
import { typography, Typography } from './typography';
import { spacing, borderRadius, iconSize, componentSpacing, Spacing, BorderRadius } from './spacing';
import { shadows, Shadows } from './shadows';
import { animation, animationPatterns, Animation } from './animation';
import { useSettingsStore } from '../stores/settingsStore';

export interface Theme {
  colors: Colors;
  typography: Typography;
  spacing: Spacing;
  borderRadius: BorderRadius;
  iconSize: typeof iconSize;
  componentSpacing: typeof componentSpacing;
  shadows: Shadows;
  chartColors: string[];
  animation: Animation;
  animationPatterns: typeof animationPatterns;
  isDark: boolean;
}

export function useTheme(): Theme {
  const systemColorScheme = useColorScheme();
  const themeMode = useSettingsStore((state) => state.themeMode);

  // 테마 모드에 따라 다크 모드 여부 결정
  const isDark =
    themeMode === 'system'
      ? systemColorScheme === 'dark'
      : themeMode === 'dark';

  return {
    colors: isDark ? darkColors : lightColors,
    typography,
    spacing,
    borderRadius,
    iconSize,
    componentSpacing,
    shadows: isDark ? shadows.dark : shadows.light,
    chartColors: isDark ? chartColors.dark : chartColors.light,
    animation,
    animationPatterns,
    isDark,
  };
}

// Re-export for convenience
export { lightColors, darkColors, chartColors } from './colors';
export { typography } from './typography';
export { spacing, borderRadius, iconSize, componentSpacing } from './spacing';
export { shadows } from './shadows';
export { animation, animationPatterns } from './animation';
