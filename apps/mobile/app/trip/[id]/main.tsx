// Trip Main Screen - Main Screen Revamp
// PRD FR-201~FR-209: 여행 메인 화면 (진행 중 여행)

import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../../lib/theme';
import { useTripStore } from '../../../lib/stores/tripStore';
import { useExpenseStore } from '../../../lib/stores/expenseStore';
import { useSettingsStore } from '../../../lib/stores/settingsStore';
import { Card, CategoryIcon, CurrencyToggle } from '../../../components/ui';
import { formatKRW, formatCurrency } from '../../../lib/utils/currency';
import { formatDisplayDate, getDaysBetween } from '../../../lib/utils/date';
import { CATEGORIES, getCountryFlag } from '../../../lib/utils/constants';
import { Trip, Destination, Expense, getTripStatus } from '../../../lib/types';

export default function TripMainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { trips, destinations, loadDestinations, setActiveTrip } = useTripStore();
  const { expenses, loadExpenses, getStats } = useExpenseStore();
  const { hapticEnabled, currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [refreshing, setRefreshing] = useState(false);

  const trip = trips.find((t) => t.id === id) || null;
  const tripDestinations = destinations.filter((d) => d.tripId === id);
  const tripStatus = trip ? getTripStatus(trip) : 'past';
  const stats = trip ? getStats(trip.id) : null;

  // Day N 계산
  const dayInfo = useMemo(() => {
    if (!trip) return { dayIndex: 0, totalDays: 0 };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(trip.startDate);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    const totalDays = getDaysBetween(trip.startDate, trip.endDate);
    return { dayIndex: Math.max(1, dayIndex), totalDays };
  }, [trip]);

  // 오늘 지출 내역
  const todayExpenses = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    return expenses.filter((e) => e.date === today);
  }, [expenses]);

  // 오늘 총 지출
  const todayTotal = useMemo(() => {
    return todayExpenses.reduce((sum, e) => sum + e.amountKRW, 0);
  }, [todayExpenses]);

  // 현재 방문지
  const currentDestination = useMemo(() => {
    if (tripDestinations.length === 0) return null;
    const today = new Date().toISOString().split('T')[0];
    const current = tripDestinations.find(
      (d) => d.startDate && d.endDate && d.startDate <= today && d.endDate >= today
    );
    return current || tripDestinations[0];
  }, [tripDestinations]);

  useEffect(() => {
    if (id) {
      loadExpenses(id);
      loadDestinations(id);
    }
  }, [id]);

  const onRefresh = async () => {
    setRefreshing(true);
    if (id) {
      await loadExpenses(id);
      await loadDestinations(id);
    }
    setRefreshing(false);
  };

  const handleAddExpense = () => {
    if (trip) {
      setActiveTrip(trip);
      router.push('/expense/new');
    }
  };

  const handleExpensePress = (expenseId: string) => {
    router.push(`/expense/${expenseId}`);
  };

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const formatAmount = (expense: Expense) => {
    if (showInKRW) {
      return formatKRW(expense.amountKRW);
    }
    return formatCurrency(expense.amount, expense.currency);
  };

  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
          여행을 찾을 수 없습니다
        </Text>
      </View>
    );
  }

  const budgetRemaining = trip.budget ? trip.budget - (stats?.totalKRW || 0) : null;
  const budgetPercentage = trip.budget ? Math.round(((stats?.totalKRW || 0) / trip.budget) * 100) : 0;

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                router.replace('/(tabs)');
              }}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="home" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
          headerRight: () => (
            <View style={styles.headerRightRow}>
              <CurrencyToggle variant="compact" />
              <TouchableOpacity
                onPress={() => router.push(`/trip/${id}`)}
                style={styles.headerButton}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="settings" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
      >
        {/* 여행 헤더 */}
        <View style={styles.tripHeader}>
          <View style={styles.tripTitleRow}>
            <Text style={styles.flags}>
              {tripDestinations.map((d) => getCountryFlag(d.country)).join('') || '✈️'}
            </Text>
            <View style={styles.tripTitleInfo}>
              <Text style={[typography.headlineMedium, { color: colors.text }]}>
                {trip.name}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                {formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}
              </Text>
            </View>
          </View>

          {/* 현재 상태 배지 */}
          {tripStatus === 'active' && (
            <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
              <Text style={[typography.labelLarge, { color: 'white' }]}>
                Day {dayInfo.dayIndex} / {dayInfo.totalDays}
              </Text>
            </View>
          )}
        </View>

        {/* 현재 방문지 */}
        {currentDestination && (
          <Card style={{ marginTop: spacing.md, padding: spacing.sm }}>
            <View style={styles.currentDestRow}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <Text style={[typography.labelMedium, { color: colors.textSecondary, marginLeft: 4 }]}>
                현재 위치
              </Text>
              <Text style={[typography.titleSmall, { color: colors.text, marginLeft: spacing.sm }]}>
                {getCountryFlag(currentDestination.country)} {currentDestination.city || currentDestination.country}
              </Text>
            </View>
          </Card>
        )}

        {/* 예산 요약 카드 */}
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[typography.titleMedium, { color: colors.text, marginBottom: spacing.sm }]}>
            예산 현황
          </Text>

          <View style={styles.budgetRow}>
            <View style={styles.budgetItem}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>총 지출</Text>
              <Text style={[typography.headlineSmall, { color: colors.text }]}>
                {formatKRW(stats?.totalKRW || 0)}
              </Text>
            </View>

            {trip.budget && (
              <>
                <View style={[styles.budgetDivider, { backgroundColor: colors.border }]} />
                <View style={styles.budgetItem}>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>남은 예산</Text>
                  <Text
                    style={[
                      typography.headlineSmall,
                      { color: budgetRemaining! >= 0 ? colors.success : colors.error },
                    ]}
                  >
                    {formatKRW(budgetRemaining!)}
                  </Text>
                </View>
              </>
            )}
          </View>

          {trip.budget && (
            <View style={[styles.progressContainer, { marginTop: spacing.sm }]}>
              <View style={[styles.progressBar, { backgroundColor: colors.borderLight }]}>
                <View
                  style={[
                    styles.progressFill,
                    {
                      backgroundColor: budgetPercentage > 100 ? colors.error : colors.primary,
                      width: `${Math.min(budgetPercentage, 100)}%`,
                    },
                  ]}
                />
              </View>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
                {budgetPercentage}% 사용
              </Text>
            </View>
          )}
        </Card>

        {/* 오늘의 지출 */}
        <View style={{ marginTop: spacing.lg }}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleRow}>
              <MaterialIcons name="today" size={20} color={colors.primary} />
              <Text style={[typography.titleMedium, { color: colors.text, marginLeft: 8 }]}>
                오늘의 지출
              </Text>
            </View>
            <Text style={[typography.titleSmall, { color: colors.primary }]}>
              {formatKRW(todayTotal)}
            </Text>
          </View>

          {todayExpenses.length > 0 ? (
            <Card style={{ marginTop: spacing.sm, padding: 0 }}>
              {todayExpenses.map((expense, index) => {
                const dest = tripDestinations.find((d) => d.id === expense.destinationId);
                const category = CATEGORIES.find((c) => c.id === expense.category);
                return (
                  <TouchableOpacity
                    key={expense.id}
                    onPress={() => handleExpensePress(expense.id)}
                    style={[
                      styles.expenseRow,
                      {
                        padding: spacing.sm,
                        borderBottomWidth: index < todayExpenses.length - 1 ? 1 : 0,
                        borderBottomColor: colors.border,
                      },
                    ]}
                  >
                    <CategoryIcon category={expense.category} size="small" />
                    <View style={[styles.expenseInfo, { marginLeft: spacing.sm }]}>
                      <Text style={[typography.bodyMedium, { color: colors.text }]}>
                        {category?.label}
                      </Text>
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
            </Card>
          ) : (
            <Card style={{ marginTop: spacing.sm, alignItems: 'center', padding: spacing.lg }}>
              <MaterialIcons name="receipt-long" size={40} color={colors.textTertiary} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                오늘 기록된 지출이 없습니다
              </Text>
            </Card>
          )}
        </View>

        {/* 카테고리별 지출 요약 */}
        {stats && Object.keys(stats.byCategory).length > 0 && (
          <View style={{ marginTop: spacing.lg }}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="pie-chart" size={20} color={colors.primary} />
                <Text style={[typography.titleMedium, { color: colors.text, marginLeft: 8 }]}>
                  카테고리별 지출
                </Text>
              </View>
            </View>

            <Card style={{ marginTop: spacing.sm, padding: spacing.sm }}>
              {CATEGORIES.map((category) => {
                const amount = stats.byCategory[category.id] || 0;
                if (amount === 0) return null;
                const percentage = Math.round((amount / stats.totalKRW) * 100);
                return (
                  <View
                    key={category.id}
                    style={[styles.categoryRow, { paddingVertical: spacing.xs }]}
                  >
                    <View style={styles.categoryInfo}>
                      <CategoryIcon category={category.id} size="small" />
                      <Text style={[typography.bodyMedium, { color: colors.text, marginLeft: spacing.sm }]}>
                        {category.label}
                      </Text>
                    </View>
                    <View style={styles.categoryAmount}>
                      <Text style={[typography.titleSmall, { color: colors.text }]}>
                        {formatKRW(amount)}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {percentage}%
                      </Text>
                    </View>
                  </View>
                );
              })}
            </Card>
          </View>
        )}

        {/* 지출 추가 버튼 */}
        <TouchableOpacity
          style={[
            styles.addButton,
            {
              backgroundColor: colors.primary,
              borderRadius: borderRadius.lg,
              marginTop: spacing.xl,
            },
          ]}
          onPress={handleAddExpense}
        >
          <MaterialIcons name="add" size={24} color="white" />
          <Text style={[typography.labelLarge, { color: 'white', marginLeft: 8 }]}>
            지출 추가하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 100,
  },
  headerButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  tripHeader: {
    marginBottom: 8,
  },
  tripTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flags: {
    fontSize: 32,
    marginRight: 12,
  },
  tripTitleInfo: {
    flex: 1,
  },
  dayBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginTop: 8,
  },
  currentDestRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  budgetItem: {
    flex: 1,
    alignItems: 'center',
  },
  budgetDivider: {
    width: 1,
    height: 40,
    marginHorizontal: 16,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
});
