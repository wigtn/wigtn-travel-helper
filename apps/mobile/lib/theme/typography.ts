// Travel Helper v2.0 - Typography System

import { Platform, TextStyle } from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

export const typography = {
  // Display - 메인 금액
  displayLarge: {
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    fontFamily,
  },
  displayMedium: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700' as TextStyle['fontWeight'],
    letterSpacing: -0.5,
    fontFamily,
  },

  // Headline - 섹션 타이틀
  headlineLarge: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.3,
    fontFamily,
  },
  headlineMedium: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.2,
    fontFamily,
  },
  headlineSmall: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as TextStyle['fontWeight'],
    letterSpacing: -0.1,
    fontFamily,
  },

  // Title - 카드 타이틀
  titleLarge: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily,
  },
  titleMedium: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily,
  },
  titleSmall: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '600' as TextStyle['fontWeight'],
    fontFamily,
  },

  // Body - 본문
  bodyLarge: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily,
  },
  bodyMedium: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily,
  },
  bodySmall: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily,
  },

  // Label - 라벨, 버튼
  labelLarge: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontFamily,
  },
  labelMedium: {
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontFamily,
  },
  labelSmall: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '500' as TextStyle['fontWeight'],
    fontFamily,
  },

  // Caption - 보조 텍스트
  caption: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400' as TextStyle['fontWeight'],
    fontFamily,
  },
};

export type Typography = typeof typography;
