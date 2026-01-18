import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { Link, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatKRW, getCurrencyFlag } from '../../lib/utils/currency';
import { formatDisplayDate, getDaysBetween } from '../../lib/utils/date';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { activeTrip, trips, loadTrips, loadActiveTrip } = useTripStore();
  const { expenses, loadExpenses, getTodayTotal, getTotalByTrip } = useExpenseStore();
  const [todayTotal, setTodayTotal] = useState(0);
  const [tripTotal, setTripTotal] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
      loadTotals();
    }
  }, [activeTrip]);

  const loadTotals = async () => {
    if (activeTrip) {
      const today = await getTodayTotal(activeTrip.id);
      const total = await getTotalByTrip(activeTrip.id);
      setTodayTotal(today);
      setTripTotal(total);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    await loadActiveTrip();
    if (activeTrip) {
      await loadExpenses(activeTrip.id);
      await loadTotals();
    }
    setRefreshing(false);
  };

  const recentExpenses = expenses.slice(0, 5);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {activeTrip ? (
          <>
            {/* 현재 여행 카드 */}
            <Card style={styles.tripCard}>
              <View style={styles.tripHeader}>
                <Text style={styles.tripFlag}>{getCurrencyFlag(activeTrip.currency)}</Text>
                <View style={styles.tripInfo}>
                  <Text style={[styles.tripName, { color: colors.text }]}>
                    {activeTrip.name}
                  </Text>
                  <Text style={[styles.tripDates, { color: colors.textSecondary }]}>
                    {formatDisplayDate(activeTrip.startDate)} - {formatDisplayDate(activeTrip.endDate)}
                    {' '}({getDaysBetween(activeTrip.startDate, activeTrip.endDate)}일)
                  </Text>
                </View>
              </View>

              <View style={styles.tripStats}>
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    오늘 지출
                  </Text>
                  <Text style={[styles.statValue, { color: colors.primary }]}>
                    {formatKRW(todayTotal)}
                  </Text>
                </View>
                <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                <View style={styles.statItem}>
                  <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                    총 지출
                  </Text>
                  <Text style={[styles.statValue, { color: colors.text }]}>
                    {formatKRW(tripTotal)}
                  </Text>
                </View>
                {activeTrip.budget && (
                  <>
                    <View style={[styles.statDivider, { backgroundColor: colors.border }]} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                        예산
                      </Text>
                      <Text style={[styles.statValue, { color: colors.success }]}>
                        {formatKRW(activeTrip.budget)}
                      </Text>
                    </View>
                  </>
                )}
              </View>
            </Card>

            {/* 최근 지출 */}
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                최근 지출
              </Text>
              {recentExpenses.length > 0 ? (
                recentExpenses.map((expense) => (
                  <TouchableOpacity
                    key={expense.id}
                    onPress={() => router.push(`/expense/${expense.id}`)}
                  >
                    <Card style={styles.expenseCard}>
                      <View style={styles.expenseRow}>
                        <View style={styles.expenseInfo}>
                          <Text style={[styles.expenseCategory, { color: colors.text }]}>
                            {expense.category === 'food' && '식비'}
                            {expense.category === 'transport' && '교통'}
                            {expense.category === 'shopping' && '쇼핑'}
                            {expense.category === 'lodging' && '숙박'}
                            {expense.category === 'activity' && '관광'}
                            {expense.category === 'etc' && '기타'}
                          </Text>
                          {expense.memo && (
                            <Text style={[styles.expenseMemo, { color: colors.textSecondary }]}>
                              {expense.memo}
                            </Text>
                          )}
                        </View>
                        <View style={styles.expenseAmount}>
                          <Text style={[styles.amountKRW, { color: colors.text }]}>
                            {formatKRW(expense.amountKRW)}
                          </Text>
                        </View>
                      </View>
                    </Card>
                  </TouchableOpacity>
                ))
              ) : (
                <Card style={styles.emptyCard}>
                  <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                    아직 지출 내역이 없습니다
                  </Text>
                </Card>
              )}
            </View>
          </>
        ) : (
          <View style={styles.noTrip}>
            <MaterialIcons name="flight" size={64} color={colors.textSecondary} />
            <Text style={[styles.noTripTitle, { color: colors.text }]}>
              여행을 시작해보세요
            </Text>
            <Text style={[styles.noTripDesc, { color: colors.textSecondary }]}>
              새 여행을 만들고 지출을 기록하세요
            </Text>
            <Button
              title="새 여행 만들기"
              onPress={() => router.push('/trip/new')}
              style={styles.newTripButton}
            />

            {trips.length > 0 && (
              <View style={styles.pastTrips}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                  지난 여행
                </Text>
                {trips.slice(0, 3).map((trip) => (
                  <TouchableOpacity
                    key={trip.id}
                    onPress={() => router.push(`/trip/${trip.id}`)}
                  >
                    <Card style={styles.pastTripCard}>
                      <Text style={styles.pastTripFlag}>{getCurrencyFlag(trip.currency)}</Text>
                      <Text style={[styles.pastTripName, { color: colors.text }]}>
                        {trip.name}
                      </Text>
                    </Card>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* FAB - 빠른 지출 입력 */}
      {activeTrip && (
        <TouchableOpacity
          style={[styles.fab, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/expense/new')}
        >
          <MaterialIcons name="add" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  tripCard: {
    marginBottom: 24,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  tripFlag: {
    fontSize: 40,
    marginRight: 12,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 20,
    fontWeight: '700',
  },
  tripDates: {
    fontSize: 14,
    marginTop: 4,
  },
  tripStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  statDivider: {
    width: 1,
    height: 40,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  expenseCard: {
    marginBottom: 8,
    padding: 12,
  },
  expenseRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  amountKRW: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
  },
  noTrip: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  noTripTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 16,
  },
  noTripDesc: {
    fontSize: 16,
    marginTop: 8,
    textAlign: 'center',
  },
  newTripButton: {
    marginTop: 24,
    minWidth: 200,
  },
  pastTrips: {
    width: '100%',
    marginTop: 40,
  },
  pastTripCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 12,
  },
  pastTripFlag: {
    fontSize: 24,
    marginRight: 12,
  },
  pastTripName: {
    fontSize: 16,
    fontWeight: '500',
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
});
