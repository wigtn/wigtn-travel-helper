import React, { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { Card } from '../../components/ui/Card';
import { formatKRW, formatCurrency } from '../../lib/utils/currency';
import { getDaysInMonth, getFirstDayOfMonth, formatDate, formatDisplayDate } from '../../lib/utils/date';
import { CATEGORIES } from '../../lib/utils/constants';
import { Expense } from '../../lib/types';

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

export default function CalendarScreen() {
  const { colors } = useTheme();
  const activeTrip = useTripStore((state) => state.activeTrip);
  const { expenses, loadExpenses } = useExpenseStore();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
    }
  }, [activeTrip]);

  // 날짜별 지출 합계 계산
  const expensesByDate = useMemo(() => {
    const map: Record<string, number> = {};
    for (const expense of expenses) {
      const date = expense.date;
      map[date] = (map[date] || 0) + expense.amountKRW;
    }
    return map;
  }, [expenses]);

  const selectedExpenses = useMemo(() => {
    if (!selectedDate) return [];
    return expenses.filter((e) => e.date === selectedDate);
  }, [selectedDate, expenses]);

  const goToPrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleDayPress = (day: number) => {
    const dateStr = formatDate(new Date(year, month, day));
    setSelectedDate(dateStr);
    if (expensesByDate[dateStr]) {
      setModalVisible(true);
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = getFirstDayOfMonth(year, month);
    const days: React.ReactElement[] = [];

    // 빈 칸
    for (let i = 0; i < firstDay; i++) {
      days.push(<View key={`empty-${i}`} style={styles.dayCell} />);
    }

    // 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = formatDate(new Date(year, month, day));
      const expense = expensesByDate[dateStr];
      const isToday = formatDate(new Date()) === dateStr;
      const isInTrip =
        activeTrip && dateStr >= activeTrip.startDate && dateStr <= activeTrip.endDate;

      days.push(
        <TouchableOpacity
          key={day}
          style={[
            styles.dayCell,
            isToday && { backgroundColor: colors.primary + '20' },
            isInTrip && { backgroundColor: colors.surface },
          ]}
          onPress={() => handleDayPress(day)}
        >
          <Text
            style={[
              styles.dayNumber,
              { color: colors.text },
              isToday && { color: colors.primary, fontWeight: '700' },
            ]}
          >
            {day}
          </Text>
          {expense && (
            <Text
              style={[
                styles.dayExpense,
                { color: colors.error },
              ]}
              numberOfLines={1}
            >
              {expense >= 10000
                ? `${Math.floor(expense / 10000)}만`
                : expense >= 1000
                ? `${Math.floor(expense / 1000)}천`
                : expense}
            </Text>
          )}
        </TouchableOpacity>
      );
    }

    return days;
  };

  if (!activeTrip) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="calendar-today" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          여행을 선택하면{'\n'}캘린더를 볼 수 있어요
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 월 네비게이션 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goToPrevMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-left" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.monthTitle, { color: colors.text }]}>
          {year}년 {month + 1}월
        </Text>
        <TouchableOpacity onPress={goToNextMonth} style={styles.navButton}>
          <MaterialIcons name="chevron-right" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 요일 헤더 */}
      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((day, index) => (
          <View key={day} style={styles.weekdayCell}>
            <Text
              style={[
                styles.weekdayText,
                { color: index === 0 ? colors.error : index === 6 ? colors.primary : colors.textSecondary },
              ]}
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {/* 캘린더 그리드 */}
      <View style={styles.calendarGrid}>{renderCalendar()}</View>

      {/* 이번 달 총 지출 */}
      <Card style={styles.summaryCard}>
        <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>
          {month + 1}월 총 지출
        </Text>
        <Text style={[styles.summaryValue, { color: colors.text }]}>
          {formatKRW(
            Object.entries(expensesByDate)
              .filter(([date]) => date.startsWith(`${year}-${String(month + 1).padStart(2, '0')}`))
              .reduce((sum, [, amount]) => sum + amount, 0)
          )}
        </Text>
      </Card>

      {/* 날짜 상세 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {selectedDate && formatDisplayDate(selectedDate)} 지출
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll}>
              {selectedExpenses.map((expense) => (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => {
                    setModalVisible(false);
                    router.push(`/expense/${expense.id}`);
                  }}
                >
                  <Card style={styles.expenseCard}>
                    <View style={styles.expenseRow}>
                      <View style={styles.expenseInfo}>
                        <Text style={[styles.expenseCategory, { color: colors.text }]}>
                          {CATEGORIES.find((c) => c.id === expense.category)?.label}
                        </Text>
                        {expense.memo && (
                          <Text style={[styles.expenseMemo, { color: colors.textSecondary }]}>
                            {expense.memo}
                          </Text>
                        )}
                      </View>
                      <View style={styles.expenseAmount}>
                        <Text style={[styles.localAmount, { color: colors.textSecondary }]}>
                          {formatCurrency(expense.amount, expense.currency)}
                        </Text>
                        <Text style={[styles.krwAmount, { color: colors.text }]}>
                          {formatKRW(expense.amountKRW)}
                        </Text>
                      </View>
                    </View>
                  </Card>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>합계</Text>
              <Text style={[styles.totalValue, { color: colors.primary }]}>
                {formatKRW(selectedExpenses.reduce((sum, e) => sum + e.amountKRW, 0))}
              </Text>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  navButton: {
    padding: 8,
  },
  monthTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  weekdayRow: {
    flexDirection: 'row',
    paddingHorizontal: 8,
  },
  weekdayCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 8,
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    padding: 4,
  },
  dayNumber: {
    fontSize: 16,
  },
  dayExpense: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
  summaryCard: {
    margin: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 14,
  },
  summaryValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalScroll: {
    padding: 16,
  },
  expenseCard: {
    marginBottom: 8,
    padding: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseCategory: {
    fontSize: 16,
    fontWeight: '500',
  },
  expenseMemo: {
    fontSize: 14,
    marginTop: 2,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  localAmount: {
    fontSize: 12,
  },
  krwAmount: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 2,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  totalLabel: {
    fontSize: 14,
  },
  totalValue: {
    fontSize: 20,
    fontWeight: '700',
  },
});
