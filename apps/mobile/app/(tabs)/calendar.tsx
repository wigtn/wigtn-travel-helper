// Travel Helper v1.1 - Calendar Screen
// PRD FR-007: 글로벌 통화 토글 적용

import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  LayoutAnimation,
  UIManager,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Card, CategoryIcon, EmptyState, CurrencyToggle } from '../../components/ui';
import { formatKRW, formatCurrency, getCurrencyFlag } from '../../lib/utils/currency';
import { getDaysInMonth, getFirstDayOfMonth, formatDate, formatDisplayDate } from '../../lib/utils/date';
import { CATEGORIES, getCurrencyInfo } from '../../lib/utils/constants';
import { Expense } from '../../lib/types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarScreen() {
  const { colors, spacing, typography } = useTheme();
  const { activeTrip, destinations } = useTripStore();
  const { expenses, loadExpenses } = useExpenseStore();
  const { currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDate, setExpandedDate] = useState<string | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
    }
  }, [activeTrip]);

  // 날짜별 지출 그룹화
  const expensesByDate = useMemo(() => {
    const map: Record<string, { total: number; totalKRW: number; expenses: Expense[] }> = {};
    for (const expense of expenses) {
      const date = expense.date;
      if (!map[date]) {
        map[date] = { total: 0, totalKRW: 0, expenses: [] };
      }
      map[date].total += expense.amount;
      map[date].totalKRW += expense.amountKRW;
      map[date].expenses.push(expense);
    }
    return map;
  }, [expenses]);

  // 이번 달 총 지출
  const monthlyTotal = useMemo(() => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return Object.entries(expensesByDate)
      .filter(([date]) => date.startsWith(prefix))
      .reduce((sum, [, data]) => sum + data.totalKRW, 0);
  }, [expensesByDate, year, month]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
    setExpandedDate(null);
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
    setExpandedDate(null);
  };

  const handleDayPress = (day: number) => {
    const dateStr = formatDate(new Date(year, month, day));
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedDate(expandedDate === dateStr ? null : dateStr);
  };

  const getDestinationInfo = (destinationId?: string) => {
    if (!destinationId) return null;
    return destinations.find(d => d.id === destinationId);
  };

  // 통화 토글에 따른 금액 표시
  const formatAmount = (expense: Expense) => {
    if (showInKRW) {
      return formatKRW(expense.amountKRW);
    }
    return formatCurrency(expense.amount, expense.currency);
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const rows: React.ReactElement[] = [];
    let cells: React.ReactElement[] = [];

    // 빈 칸
    for (let i = 0; i < firstDay; i++) {
      cells.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(year, month, day));
      const dayData = expensesByDate[dateStr];
      const isToday = formatDate(new Date()) === dateStr;
      const isInTrip =
        activeTrip && dateStr >= activeTrip.startDate && dateStr <= activeTrip.endDate;
      const isExpanded = expandedDate === dateStr;
      const hasExpense = dayData && dayData.expenses.length > 0;

      cells.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && { backgroundColor: colors.primaryLight },
            isInTrip && !isToday && { backgroundColor: colors.surface },
            isExpanded && { backgroundColor: colors.primary + '15' },
          ]}
          onPress={() => handleDayPress(day)}
        >
          <Text
            style={[
              typography.bodyMedium,
              { color: colors.text },
              isToday && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {day}
          </Text>
          {hasExpense && (
            <View
              style={[
                styles.expenseDot,
                { backgroundColor: isToday ? colors.primary : colors.error },
              ]}
            />
          )}
        </TouchableOpacity>
      );

      // 7일마다 또는 마지막 날에 행 추가
      if ((firstDay + day) % 7 === 0 || day === daysInMonth) {
        rows.push(
          <View key={`row-${day}`}>
            <View style={styles.weekRow}>{cells}</View>

            {/* 확장된 날짜의 지출 리스트 */}
            {expandedDate && cells.some(cell => {
              const keyStr = cell.key?.toString() || '';
              if (keyStr.startsWith('empty')) return false;
              const cellDay = parseInt(keyStr, 10);
              if (isNaN(cellDay) || cellDay < 1) return false;
              const cellDateStr = formatDate(new Date(year, month, cellDay));
              return cellDateStr === expandedDate;
            }) && expensesByDate[expandedDate] && (
              <View style={[styles.expandedSection, { backgroundColor: colors.surface }]}>
                <View style={styles.expandedHeader}>
                  <Text style={[typography.labelMedium, { color: colors.text }]}>
                    {formatDisplayDate(expandedDate)}
                  </Text>
                  <Text style={[typography.titleSmall, { color: colors.primary }]}>
                    {formatKRW(expensesByDate[expandedDate].totalKRW)}
                  </Text>
                </View>
                {expensesByDate[expandedDate].expenses.map((expense) => {
                  const dest = getDestinationInfo(expense.destinationId);
                  return (
                    <TouchableOpacity
                      key={expense.id}
                      style={[
                        styles.expenseItem,
                        { borderBottomColor: colors.border },
                      ]}
                      onPress={() => router.push(`/expense/${expense.id}`)}
                    >
                      <CategoryIcon category={expense.category} size="small" />
                      <View style={styles.expenseInfo}>
                        <View style={styles.expenseTopRow}>
                          <Text style={[typography.bodyMedium, { color: colors.text }]}>
                            {CATEGORIES.find((c) => c.id === expense.category)?.label}
                          </Text>
                          {dest && (
                            <Text style={[typography.caption, { color: colors.textSecondary }]}>
                              {getCurrencyInfo(dest.currency)?.flag}
                            </Text>
                          )}
                        </View>
                        {expense.memo && (
                          <Text
                            style={[typography.caption, { color: colors.textSecondary }]}
                            numberOfLines={1}
                          >
                            {expense.memo}
                          </Text>
                        )}
                      </View>
                      <View style={styles.expenseAmount}>
                        <Text style={[typography.titleSmall, { color: colors.text }]}>
                          {formatAmount(expense)}
                        </Text>
                        {!showInKRW && (
                          <Text style={[typography.caption, { color: colors.textSecondary }]}>
                            {formatKRW(expense.amountKRW)}
                          </Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}
          </View>
        );
        cells = [];
      }
    }

    return rows;
  };

  if (!activeTrip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="calendar-today"
          title="여행을 선택해주세요"
          description="여행을 선택하면 캘린더를 볼 수 있어요"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 월 네비게이션 */}
      <View style={[styles.header, { paddingHorizontal: spacing.base }]}>
        <TouchableOpacity
          onPress={goToPrevMonth}
          style={[styles.navButton, { backgroundColor: colors.surface }]}
        >
          <MaterialIcons name="chevron-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.monthInfo}>
          <Text style={[typography.headlineSmall, { color: colors.text }]}>
            {year}년 {month + 1}월
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {activeTrip.name}
          </Text>
        </View>
        <TouchableOpacity
          onPress={goToNextMonth}
          style={[styles.navButton, { backgroundColor: colors.surface }]}
        >
          <MaterialIcons name="chevron-right" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 통화 토글 */}
      <View style={[styles.toggleContainer, { paddingHorizontal: spacing.base }]}>
        <CurrencyToggle />
      </View>

      {/* 이번 달 요약 */}
      <Card style={[styles.summaryCard, { margin: spacing.base }]}>
        <View style={styles.summaryRow}>
          <View>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {month + 1}월 총 지출
            </Text>
            <Text style={[typography.headlineMedium, { color: colors.text }]}>
              {formatKRW(monthlyTotal)}
            </Text>
          </View>
          <View style={[styles.expenseCount, { backgroundColor: colors.primaryLight }]}>
            <Text style={[typography.titleSmall, { color: colors.primary }]}>
              {Object.entries(expensesByDate)
                .filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
                .reduce((sum, [, data]) => sum + data.expenses.length, 0)}건
            </Text>
          </View>
        </View>
      </Card>

      {/* 요일 헤더 */}
      <View style={[styles.weekdayRow, { paddingHorizontal: spacing.sm }]}>
        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                typography.labelSmall,
                {
                  color:
                    index === 0 ? colors.error : index === 6 ? colors.secondary : colors.textSecondary,
                },
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 캘린더 그리드 */}
      <View style={[styles.calendarGrid, { paddingHorizontal: spacing.sm }]}>
        {renderCalendar()}
      </View>

      {/* 하단 여백 */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthInfo: {
    alignItems: 'center',
  },
  toggleContainer: {
    marginBottom: 8,
  },
  summaryCard: {
    padding: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCount: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarGrid: {
    marginBottom: 16,
  },
  weekRow: {
    flexDirection: 'row',
  },
  dayCell: {
    flex: 1,
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    margin: 2,
  },
  expenseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  expandedSection: {
    marginHorizontal: 4,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  expandedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  expenseInfo: {
    flex: 1,
    marginLeft: 12,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
});
