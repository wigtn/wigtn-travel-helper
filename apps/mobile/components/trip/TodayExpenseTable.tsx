// Main Screen Revamp - Today's Expense Table with Date Navigation
// PRD FR-303~307: 테이블 형식 지출 + 영수증 아이콘

import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { Card, CategoryIcon } from '../ui';
import { Expense, Destination } from '../../lib/types';
import { CATEGORIES } from '../../lib/utils/constants';
import { formatKRW, formatCurrency } from '../../lib/utils/currency';
import { formatDisplayDate } from '../../lib/utils/date';

interface TodayExpenseTableProps {
  date: string;
  expenses: Expense[];
  destinations: Destination[];
  showInKRW?: boolean;
  onExpensePress?: (expenseId: string) => void;
  onReceiptPress?: (expenseId: string) => void;
  onDateChange?: (date: string) => void;
  tripStartDate: string;
  tripEndDate: string;
}

export function TodayExpenseTable({
  date,
  expenses,
  destinations,
  showInKRW = false,
  onExpensePress,
  onReceiptPress,
  onDateChange,
  tripStartDate,
  tripEndDate,
}: TodayExpenseTableProps) {
  const { colors, spacing, typography, borderRadius } = useTheme();

  // Calculate totals
  const totalLocal: Record<string, number> = {};
  let totalKRW = 0;

  for (const expense of expenses) {
    totalLocal[expense.currency] = (totalLocal[expense.currency] || 0) + expense.amount;
    totalKRW += expense.amountKRW;
  }

  // Date navigation helpers
  const today = new Date().toISOString().split('T')[0];
  const isToday = date === today;
  const canGoBack = date > tripStartDate;
  const canGoForward = date < tripEndDate;

  const goToPrevDay = () => {
    const prevDate = new Date(date);
    prevDate.setDate(prevDate.getDate() - 1);
    const newDate = prevDate.toISOString().split('T')[0];
    if (newDate >= tripStartDate) {
      onDateChange?.(newDate);
    }
  };

  const goToNextDay = () => {
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    const newDate = nextDate.toISOString().split('T')[0];
    if (newDate <= tripEndDate) {
      onDateChange?.(newDate);
    }
  };

  const goToToday = () => {
    if (today >= tripStartDate && today <= tripEndDate) {
      onDateChange?.(today);
    }
  };

  const formatAmount = (expense: Expense) => {
    if (showInKRW) {
      return formatKRW(expense.amountKRW);
    }
    return formatCurrency(expense.amount, expense.currency);
  };

  return (
    <View>
      {/* Date Navigation Header */}
      <View style={[styles.dateHeader, { marginBottom: spacing.sm }]}>
        <TouchableOpacity
          onPress={goToPrevDay}
          disabled={!canGoBack}
          style={[styles.navButton, !canGoBack && styles.navButtonDisabled]}
          accessibilityLabel="이전 날짜"
        >
          <MaterialIcons
            name="chevron-left"
            size={28}
            color={canGoBack ? colors.text : colors.textTertiary}
          />
        </TouchableOpacity>

        <TouchableOpacity onPress={goToToday} style={styles.dateCenter}>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {formatDisplayDate(date)}
          </Text>
          {isToday && (
            <View style={[styles.todayBadge, { backgroundColor: colors.primary }]}>
              <Text style={[typography.labelSmall, { color: 'white', fontSize: 10 }]}>
                오늘
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          onPress={goToNextDay}
          disabled={!canGoForward}
          style={[styles.navButton, !canGoForward && styles.navButtonDisabled]}
          accessibilityLabel="다음 날짜"
        >
          <MaterialIcons
            name="chevron-right"
            size={28}
            color={canGoForward ? colors.text : colors.textTertiary}
          />
        </TouchableOpacity>
      </View>

      {/* Expense Table */}
      {expenses.length > 0 ? (
        <Card style={{ padding: 0, overflow: 'hidden' }}>
          {/* Table Header */}
          <View
            style={[
              styles.tableHeader,
              { backgroundColor: colors.surface, borderBottomColor: colors.border },
            ]}
          >
            <Text style={[typography.labelSmall, styles.colCategory, { color: colors.textSecondary }]}>
              카테고리
            </Text>
            <Text style={[typography.labelSmall, styles.colMemo, { color: colors.textSecondary }]}>
              내용
            </Text>
            <Text style={[typography.labelSmall, styles.colAmount, { color: colors.textSecondary }]}>
              금액
            </Text>
          </View>

          {/* Table Rows */}
          <ScrollView style={{ maxHeight: 300 }}>
            {expenses.map((expense, index) => {
              const category = CATEGORIES.find((c) => c.id === expense.category);
              const dest = destinations.find((d) => d.id === expense.destinationId);
              const hasReceipt = !!expense.receiptId || expense.inputMethod === 'receipt';

              return (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => onExpensePress?.(expense.id)}
                  style={[
                    styles.tableRow,
                    {
                      borderBottomWidth: index < expenses.length - 1 ? 1 : 0,
                      borderBottomColor: colors.border,
                    },
                  ]}
                  accessibilityLabel={`${category?.label} ${expense.memo || ''} ${formatAmount(expense)}`}
                >
                  {/* Category */}
                  <View style={styles.colCategory}>
                    <CategoryIcon category={expense.category} size="small" />
                    <Text
                      style={[typography.bodySmall, { color: colors.text, marginLeft: 6 }]}
                      numberOfLines={1}
                    >
                      {category?.label}
                    </Text>
                  </View>

                  {/* Memo */}
                  <View style={styles.colMemo}>
                    <Text
                      style={[typography.bodySmall, { color: colors.text }]}
                      numberOfLines={1}
                    >
                      {expense.memo || '-'}
                    </Text>
                    {hasReceipt && (
                      <TouchableOpacity
                        onPress={() => onReceiptPress?.(expense.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        accessibilityLabel="영수증 보기"
                      >
                        <MaterialIcons
                          name="receipt"
                          size={16}
                          color={colors.primary}
                          style={{ marginLeft: 4 }}
                        />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Amount */}
                  <View style={styles.colAmount}>
                    <Text style={[typography.titleSmall, { color: colors.text, textAlign: 'right' }]}>
                      {formatAmount(expense)}
                    </Text>
                    {!showInKRW && (
                      <Text style={[typography.caption, { color: colors.textTertiary, textAlign: 'right' }]}>
                        ≈ {formatKRW(expense.amountKRW)}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </ScrollView>

          {/* Total Row */}
          <View
            style={[
              styles.totalRow,
              { backgroundColor: colors.surface, borderTopColor: colors.border },
            ]}
          >
            <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
              합계
            </Text>
            <View style={{ alignItems: 'flex-end' }}>
              {Object.entries(totalLocal).map(([currency, amount]) => (
                <Text key={currency} style={[typography.titleSmall, { color: colors.text }]}>
                  {formatCurrency(amount, currency)}
                </Text>
              ))}
              <Text style={[typography.bodySmall, { color: colors.primary, marginTop: 2 }]}>
                ≈ {formatKRW(totalKRW)}
              </Text>
            </View>
          </View>
        </Card>
      ) : (
        <Card style={{ alignItems: 'center', padding: spacing.xl }}>
          <MaterialIcons name="receipt-long" size={40} color={colors.textTertiary} />
          <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
            이 날짜에 기록된 지출이 없습니다
          </Text>
        </Card>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  dateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  navButton: {
    padding: 4,
  },
  navButtonDisabled: {
    opacity: 0.3,
  },
  dateCenter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  todayBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 12,
    alignItems: 'center',
  },
  colCategory: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
  },
  colMemo: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  colAmount: {
    flex: 2,
    alignItems: 'flex-end',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderTopWidth: 1,
  },
});

export default TodayExpenseTable;
