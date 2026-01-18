import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { formatKRW, getCurrencyFlag, formatCurrency } from '../../lib/utils/currency';
import { formatFullDate, getDaysBetween } from '../../lib/utils/date';
import { CATEGORIES } from '../../lib/utils/constants';
import { Trip } from '../../lib/types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { trips, deleteTrip, setActiveTrip } = useTripStore();
  const { expenses, loadExpenses, getStats } = useExpenseStore();
  const [trip, setTrip] = useState<Trip | null>(null);

  useEffect(() => {
    const foundTrip = trips.find((t) => t.id === id);
    if (foundTrip) {
      setTrip(foundTrip);
      loadExpenses(foundTrip.id);
    }
  }, [id, trips]);

  const stats = trip ? getStats(trip.id) : null;

  const handleDelete = () => {
    Alert.alert(
      '여행 삭제',
      '이 여행을 삭제하시겠습니까? 모든 지출 내역도 함께 삭제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            if (id) {
              await deleteTrip(id);
              router.back();
            }
          },
        },
      ]
    );
  };

  const handleSetActive = () => {
    if (trip) {
      setActiveTrip(trip);
      router.replace('/(tabs)');
    }
  };

  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          여행을 찾을 수 없습니다
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: trip.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete}>
              <MaterialIcons name="delete" size={24} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
      >
        {/* 여행 정보 */}
        <Card style={styles.infoCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.flag}>{getCurrencyFlag(trip.currency)}</Text>
            <View style={styles.tripInfo}>
              <Text style={[styles.tripName, { color: colors.text }]}>{trip.name}</Text>
              <Text style={[styles.dates, { color: colors.textSecondary }]}>
                {formatFullDate(trip.startDate)} - {formatFullDate(trip.endDate)}
              </Text>
              <Text style={[styles.duration, { color: colors.textSecondary }]}>
                {getDaysBetween(trip.startDate, trip.endDate)}일간의 여행
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                총 지출
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {formatKRW(stats?.totalKRW || 0)}
              </Text>
            </View>
            {trip.budget && (
              <View style={styles.statItem}>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                  예산
                </Text>
                <Text style={[styles.statValue, { color: colors.success }]}>
                  {formatKRW(trip.budget)}
                </Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                지출 건수
              </Text>
              <Text style={[styles.statValue, { color: colors.text }]}>
                {expenses.length}건
              </Text>
            </View>
          </View>
        </Card>

        {/* 카테고리별 지출 */}
        {stats && Object.keys(stats.byCategory).length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              카테고리별 지출
            </Text>
            {CATEGORIES.map((category) => {
              const amount = stats.byCategory[category.id] || 0;
              if (amount === 0) return null;
              const percentage = Math.round((amount / stats.totalKRW) * 100);
              return (
                <Card key={category.id} style={styles.categoryCard}>
                  <View style={styles.categoryRow}>
                    <View style={styles.categoryInfo}>
                      <View
                        style={[styles.categoryDot, { backgroundColor: category.color }]}
                      />
                      <Text style={[styles.categoryLabel, { color: colors.text }]}>
                        {category.label}
                      </Text>
                    </View>
                    <View style={styles.categoryAmount}>
                      <Text style={[styles.amountText, { color: colors.text }]}>
                        {formatKRW(amount)}
                      </Text>
                      <Text style={[styles.percentText, { color: colors.textSecondary }]}>
                        {percentage}%
                      </Text>
                    </View>
                  </View>
                </Card>
              );
            })}
          </View>
        )}

        {/* 최근 지출 */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            지출 내역
          </Text>
          {expenses.length > 0 ? (
            expenses.map((expense) => (
              <TouchableOpacity
                key={expense.id}
                onPress={() => router.push(`/expense/${expense.id}`)}
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
                      <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>
                        {formatFullDate(expense.date)}
                      </Text>
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
            ))
          ) : (
            <Card style={styles.emptyCard}>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                아직 지출 내역이 없습니다
              </Text>
            </Card>
          )}
        </View>

        <Button
          title="이 여행으로 지출 기록하기"
          onPress={handleSetActive}
          style={styles.actionButton}
        />
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  infoCard: {
    marginBottom: 24,
  },
  tripHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  flag: {
    fontSize: 48,
    marginRight: 16,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 24,
    fontWeight: '700',
  },
  dates: {
    fontSize: 14,
    marginTop: 4,
  },
  duration: {
    fontSize: 14,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  categoryCard: {
    marginBottom: 8,
    padding: 12,
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
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  categoryLabel: {
    fontSize: 16,
  },
  categoryAmount: {
    alignItems: 'flex-end',
  },
  amountText: {
    fontSize: 16,
    fontWeight: '600',
  },
  percentText: {
    fontSize: 12,
    marginTop: 2,
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
  expenseDate: {
    fontSize: 12,
    marginTop: 4,
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
  emptyCard: {
    alignItems: 'center',
    padding: 24,
  },
  emptyText: {
    fontSize: 14,
  },
  actionButton: {
    marginTop: 8,
  },
});
