// Travel Helper v1.1 - Currency Toggle Component
// PRD FR-007: 원화/현지통화 토글 버튼

import React from 'react';
import { View, Text, StyleSheet, Pressable, TouchableOpacity } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useSettingsStore } from '../../lib/stores/settingsStore';

interface CurrencyToggleProps {
  compact?: boolean;
  variant?: 'default' | 'compact';
}

export function CurrencyToggle({ compact = false, variant }: CurrencyToggleProps) {
  const { colors, typography, spacing, borderRadius } = useTheme();
  const currencyDisplayMode = useSettingsStore((s) => s.currencyDisplayMode);
  const toggleCurrencyDisplayMode = useSettingsStore((s) => s.toggleCurrencyDisplayMode);
  const hapticEnabled = useSettingsStore((s) => s.hapticEnabled);

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
      <TouchableOpacity
        style={[
          styles.compactContainer,
          {
            backgroundColor: isKRW ? colors.primaryLight : colors.surface,
            borderColor: isKRW ? colors.primary : colors.border,
            borderRadius: borderRadius.md,
          },
        ]}
        onPress={handleToggle}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
        accessibilityLabel={isKRW ? '원화로 표시 중, 탭하여 현지통화로 전환' : '현지통화로 표시 중, 탭하여 원화로 전환'}
        accessibilityRole="button"
      >
        <Text style={[typography.labelSmall, { color: isKRW ? colors.primary : colors.textSecondary, fontWeight: '600' }]}>
          {isKRW ? '₩' : '현지'}
        </Text>
      </TouchableOpacity>
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
    minWidth: 44,
    height: 32,
    paddingHorizontal: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
