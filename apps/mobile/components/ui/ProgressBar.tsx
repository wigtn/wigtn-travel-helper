// Travel Helper v2.0 - ProgressBar Component

import React from 'react';
import { View, StyleSheet, ViewStyle, Text } from 'react-native';
import { useTheme } from '../../lib/theme';

interface ProgressBarProps {
  progress: number; // 0 to 1
  variant?: 'default' | 'wallet' | 'budget';
  showLabel?: boolean;
  height?: number;
  color?: string;  // Custom color override
  style?: ViewStyle;
}

export function ProgressBar({
  progress,
  variant = 'default',
  showLabel = false,
  height = 8,
  color,
  style,
}: ProgressBarProps) {
  const { colors, borderRadius } = useTheme();

  const clampedProgress = Math.min(Math.max(progress, 0), 1);
  const percentage = Math.round(clampedProgress * 100);

  const getFillColor = () => {
    // Custom color override
    if (color) return color;

    switch (variant) {
      case 'wallet':
        if (clampedProgress <= 0.1) return colors.error;
        if (clampedProgress <= 0.3) return colors.warning;
        return colors.primary;
      case 'budget':
        if (clampedProgress > 1) return colors.error;
        if (clampedProgress >= 0.8) return colors.warning;
        return colors.secondary;
      default:
        return colors.primary;
    }
  };

  return (
    <View style={style}>
      <View
        style={[
          styles.track,
          {
            height,
            backgroundColor: colors.borderLight,
            borderRadius: borderRadius.sm,
          },
        ]}
      >
        <View
          style={[
            styles.fill,
            {
              width: `${Math.min(percentage, 100)}%`,
              backgroundColor: getFillColor(),
              borderRadius: borderRadius.sm,
            },
          ]}
        />
      </View>
      {showLabel && (
        <Text style={[styles.label, { color: colors.textSecondary }]}>
          {percentage}%
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
  },
  label: {
    fontSize: 12,
    marginTop: 4,
    textAlign: 'right',
  },
});
