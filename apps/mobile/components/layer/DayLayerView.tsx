// Travel Helper v1.1 - Day Layer View Component
// PRD FR-008: 일별 다중 국가 레이어 뷰

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTheme } from '../../lib/theme';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { DayExpenseGroup } from '../../lib/types';
import { formatKRW } from '../../lib/utils/currency';
import { formatDisplayDate, getDayOfWeek } from '../../lib/utils/date';
import { CountryLayer } from './CountryLayer';
import { CurrencyToggle } from '../ui/CurrencyToggle';

interface DayLayerViewProps {
  date: string;
  groups: DayExpenseGroup[];
  showHeader?: boolean;
}

export function DayLayerView({ date, groups, showHeader = true }: DayLayerViewProps) {
  const { colors, typography, spacing } = useTheme();
  const { currencyDisplayMode } = useSettingsStore();

  // 전체 일 합계 (원화)
  const dayTotalKRW = groups.reduce((sum, g) => sum + g.totalKRW, 0);

  // 날짜 표시
  const displayDate = formatDisplayDate(date);
  const dayOfWeek = getDayOfWeek(date);

  if (groups.length === 0) {
    return (
      <View style={[styles.emptyContainer, { padding: spacing.xl }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
          이 날은 지출 기록이 없어요
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={[styles.header, { marginBottom: spacing.lg }]}>
          <View>
            <Text style={[typography.titleLarge, { color: colors.text }]}>
              {displayDate} ({dayOfWeek})
            </Text>
          </View>
          <CurrencyToggle />
        </View>
      )}

      {/* 국가별 레이어 */}
      {groups.map((group) => (
        <CountryLayer key={group.destination.id} group={group} />
      ))}

      {/* 일 합계 */}
      {groups.length > 1 && (
        <View
          style={[
            styles.dayTotal,
            {
              borderTopColor: colors.divider,
              paddingTop: spacing.md,
              marginTop: spacing.sm,
            },
          ]}
        >
          <Text style={[typography.titleMedium, { color: colors.textSecondary }]}>
            {displayDate} 총계
          </Text>
          <Text style={[typography.titleLarge, { color: colors.primary }]}>
            {formatKRW(dayTotalKRW)}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dayTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
