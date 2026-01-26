// Travel Helper v1.1 - Country Layer Component
// PRD FR-008: 국가별 지출 레이어 카드

import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../lib/theme';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { DayExpenseGroup, Expense } from '../../lib/types';
import { getCurrencyInfo, CATEGORIES } from '../../lib/utils/constants';
import { formatCurrency, formatKRW } from '../../lib/utils/currency';
import { Card, CategoryIcon } from '../ui';

interface CountryLayerProps {
  group: DayExpenseGroup;
  showDate?: boolean;
}

export function CountryLayer({ group, showDate = false }: CountryLayerProps) {
  const { colors, typography, spacing, borderRadius, isDark } = useTheme();
  const { currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const currencyInfo = getCurrencyInfo(group.destination.currency);
  const flag = currencyInfo?.flag || '';
  const countryName = group.destination.countryName || group.destination.country;

  // 소계 표시
  const subtotalDisplay = showInKRW
    ? formatKRW(group.totalKRW)
    : formatCurrency(group.totalLocal, group.destination.currency);

  return (
    <View style={[styles.container, { marginBottom: spacing.md }]}>
      {/* 국가 헤더 */}
      <View style={[styles.header, { marginBottom: spacing.sm }]}>
        <View style={styles.countryInfo}>
          <Text style={styles.flag}>{flag}</Text>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {countryName}
          </Text>
        </View>
        <Text style={[typography.titleSmall, { color: colors.primary }]}>
          {subtotalDisplay}
        </Text>
      </View>

      {/* 지출 목록 */}
      <Card variant="outlined">
        {group.expenses.map((expense, index) => (
          <ExpenseItem
            key={expense.id}
            expense={expense}
            showDivider={index < group.expenses.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}

interface ExpenseItemProps {
  expense: Expense;
  showDivider?: boolean;
}

function ExpenseItem({ expense, showDivider = false }: ExpenseItemProps) {
  const { colors, typography, spacing, isDark } = useTheme();
  const { currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const categoryInfo = CATEGORIES.find((c) => c.id === expense.category);
  const amountDisplay = showInKRW
    ? formatKRW(expense.amountKRW)
    : formatCurrency(expense.amount, expense.currency);

  const handlePress = () => {
    router.push(`/expense/${expense.id}`);
  };

  return (
    <Pressable onPress={handlePress}>
      <View style={[styles.expenseItem, { paddingVertical: spacing.md }]}>
        <CategoryIcon category={expense.category} size="small" />
        <View style={[styles.expenseInfo, { marginLeft: spacing.sm }]}>
          <Text style={[typography.bodyMedium, { color: colors.text }]}>
            {categoryInfo?.label}
          </Text>
          {expense.memo && (
            <Text
              style={[typography.bodySmall, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {expense.memo}
            </Text>
          )}
        </View>
        <Text style={[typography.titleSmall, { color: colors.text }]}>
          {amountDisplay}
        </Text>
      </View>
      {showDivider && (
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {},
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  countryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  flag: {
    fontSize: 24,
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  divider: {
    height: 1,
    marginLeft: 40,
  },
});
