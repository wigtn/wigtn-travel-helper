// Main Screen Revamp - Budget Summary Card
// PRD FR-301, FR-302: 예산/총지출/잔여 예산 표시

import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../lib/theme';
import { Card } from '../ui';
import { formatKRW } from '../../lib/utils/currency';

interface BudgetSummaryCardProps {
  budget?: number | null;
  totalSpent: number;
  compact?: boolean;
}

export function BudgetSummaryCard({ budget, totalSpent, compact = false }: BudgetSummaryCardProps) {
  const { colors, spacing, typography } = useTheme();

  const remaining = budget ? budget - totalSpent : 0;
  const percentage = budget ? Math.round((totalSpent / budget) * 100) : 0;
  const isOverBudget = budget ? totalSpent > budget : false;
  const isWarning = budget ? percentage >= 80 && percentage < 100 : false;

  // Get progress bar color
  const getProgressColor = () => {
    if (isOverBudget) return colors.error;
    if (isWarning) return colors.warning;
    return colors.primary;
  };

  // No budget set - show only total spent
  if (!budget) {
    return (
      <Card style={compact ? styles.compactCard : undefined}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          총 지출
        </Text>
        <Text style={[typography.headlineMedium, { color: colors.text, marginTop: 4 }]}>
          {formatKRW(totalSpent)}
        </Text>
      </Card>
    );
  }

  // Budget set - show full summary
  return (
    <Card style={compact ? styles.compactCard : undefined}>
      <View style={styles.row}>
        <View style={styles.item}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            예산
          </Text>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {formatKRW(budget)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.item}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            총 지출
          </Text>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {formatKRW(totalSpent)}
          </Text>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.item}>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            잔여
          </Text>
          <Text
            style={[
              typography.titleMedium,
              { color: isOverBudget ? colors.error : colors.success },
            ]}
          >
            {formatKRW(remaining)}
          </Text>
        </View>
      </View>

      {/* Progress bar */}
      <View style={[styles.progressContainer, { marginTop: spacing.md }]}>
        <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: getProgressColor(),
                width: `${Math.min(percentage, 100)}%`,
              },
            ]}
          />
        </View>
        <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
          {percentage}% 사용
          {isOverBudget && ` (${percentage - 100}% 초과)`}
        </Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  compactCard: {
    padding: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: 40,
    marginHorizontal: 8,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
});

export default BudgetSummaryCard;
