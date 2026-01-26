// Travel Helper v1.1 - Currency Toggle Component
// PRD FR-007: 원화/현지통화 토글 버튼

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { CurrencyDisplayMode } from '../../lib/types';

interface CurrencyToggleProps {
  compact?: boolean;
  variant?: 'default' | 'compact';
}

export function CurrencyToggle({ compact = false, variant }: CurrencyToggleProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const { currencyDisplayMode, toggleCurrencyDisplayMode, hapticEnabled } = useSettingsStore();

  const handleToggle = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    toggleCurrencyDisplayMode();
  };

  const isKRW = currencyDisplayMode === 'krw';
  const isCompact = compact || variant === 'compact';

  if (isCompact) {
    return (
      <Pressable
        style={[
          styles.compactContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            borderRadius: borderRadius.full,
          },
        ]}
        onPress={handleToggle}
      >
        <Text style={[typography.labelMedium, { color: colors.text }]}>
          {isKRW ? '₩' : '¤'}
        </Text>
      </Pressable>
    );
  }

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          padding: spacing.xs,
        },
      ]}
    >
      <Pressable
        style={[
          styles.option,
          {
            backgroundColor: isKRW ? colors.primary : 'transparent',
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
        onPress={() => {
          if (!isKRW) handleToggle();
        }}
      >
        <Text
          style={[
            typography.labelMedium,
            { color: isKRW ? colors.textInverse : colors.textSecondary },
          ]}
        >
          원화
        </Text>
      </Pressable>
      <Pressable
        style={[
          styles.option,
          {
            backgroundColor: !isKRW ? colors.primary : 'transparent',
            borderRadius: borderRadius.md,
            paddingHorizontal: spacing.md,
            paddingVertical: spacing.sm,
          },
        ]}
        onPress={() => {
          if (isKRW) handleToggle();
        }}
      >
        <Text
          style={[
            typography.labelMedium,
            { color: !isKRW ? colors.textInverse : colors.textSecondary },
          ]}
        >
          현지통화
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignSelf: 'flex-start',
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactContainer: {
    width: 36,
    height: 36,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
