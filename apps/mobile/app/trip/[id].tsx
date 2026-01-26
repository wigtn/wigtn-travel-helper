// Travel Helper v1.1 - Trip Detail Screen
// PRD v1.1: 여행 상세 화면

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
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Card, Button, CategoryIcon, CurrencyToggle } from '../../components/ui';
import { formatKRW, getCurrencyFlag, formatCurrency } from '../../lib/utils/currency';
import { formatFullDate, getDaysBetween, formatDisplayDate } from '../../lib/utils/date';
import { CATEGORIES, getCurrencyInfo } from '../../lib/utils/constants';
import { Trip, Destination } from '../../lib/types';

export default function TripDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { trips, destinations, deleteTrip, setActiveTrip, loadDestinations } = useTripStore();
  const { expenses, loadExpenses, getStats } = useExpenseStore();
  const { hapticEnabled, currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [trip, setTrip] = useState<Trip | null>(null);
  const [tripDestinations, setTripDestinations] = useState<Destination[]>([]);

  // 햅틱 피드백 헬퍼
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  useEffect(() => {
    const foundTrip = trips.find((t) => t.id === id);
    if (foundTrip) {
      setTrip(foundTrip);
      loadExpenses(foundTrip.id);
      loadDestinations(foundTrip.id);
    }
  }, [id, trips]);

  useEffect(() => {
    if (trip) {
      setTripDestinations(destinations.filter(d => d.tripId === trip.id));
    }
  }, [destinations, trip]);

  const stats = trip ? getStats(trip.id) : null;

  // 첫 번째 방문지의 통화 플래그
  const primaryFlag = tripDestinations.length > 0
    ? getCurrencyFlag(tripDestinations[0].currency)
    : '🌍';

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
              if (hapticEnabled) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              }
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
      triggerHaptic();
      router.replace('/(tabs)');
    }
  };

  // 금액 표시 (통화 토글 반영)
  const formatAmount = (expense: { amount: number; currency: string; amountKRW: number }) => {
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

  return (
    <>
      <Stack.Screen
        options={{
          title: trip.name,
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={{ padding: spacing.xs }}>
              <MaterialIcons name="delete" size={24} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* 여행 정보 */}
        <Card style={styles.infoCard}>
          <View style={styles.tripHeader}>
            <Text style={styles.flag}>{primaryFlag}</Text>
            <View style={styles.tripInfo}>
              <Text style={[typography.headlineSmall, { color: colors.text }]}>{trip.name}</Text>
              <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
                {formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 2 }]}>
                {getDaysBetween(trip.startDate, trip.endDate)}일간의 여행
              </Text>
            </View>
          </View>

          {/* 방문지 목록 */}
          {tripDestinations.length > 0 && (
            <View style={[styles.destinationsRow, { marginTop: spacing.md }]}>
              {tripDestinations.map((dest, index) => {
                const currencyInfo = getCurrencyInfo(dest.currency);
                return (
                  <View
                    key={dest.id}
                    style={[
                      styles.destinationChip,
                      { backgroundColor: colors.surface, borderRadius: borderRadius.sm },
                    ]}
                  >
                    <Text style={{ fontSize: 14 }}>{currencyInfo?.flag}</Text>
                    <Text style={[typography.caption, { color: colors.text, marginLeft: 4 }]}>
                      {dest.city || dest.country}
                    </Text>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.md }]} />

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                총 지출
              </Text>
              <Text style={[typography.titleMedium, { color: colors.text }]}>
                {formatKRW(stats?.totalKRW || 0)}
              </Text>
            </View>
            {trip.budget && (
              <View style={styles.statItem}>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  예산
                </Text>
                <Text style={[typography.titleMedium, { color: colors.success }]}>
                  {formatKRW(trip.budget)}
                </Text>
              </View>
            )}
            <View style={styles.statItem}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                지출 건수
              </Text>
              <Text style={[typography.titleMedium, { color: colors.text }]}>
                {expenses.length}건
              </Text>
            </View>
          </View>
        </Card>

        {/* 통화 토글 */}
        <View style={[styles.toggleRow, { marginBottom: spacing.md }]}>
          <Text style={[typography.labelMedium, { color: colors.text }]}>금액 표시</Text>
          <CurrencyToggle variant="compact" />
        </View>

        {/* 카테고리별 지출 */}
        {stats && Object.keys(stats.byCategory).length > 0 && (
          <View style={{ marginBottom: spacing.lg }}>
            <Text style={[typography.titleMedium, { color: colors.text, marginBottom: spacing.sm }]}>
              카테고리별 지출
            </Text>
            {CATEGORIES.map((category) => {
              const amount = stats.byCategory[category.id] || 0;
              if (amount === 0) return null;
              const percentage = Math.round((amount / stats.totalKRW) * 100);
              return (
                <Card key={category.id} style={{ marginBottom: spacing.xs, padding: spacing.sm }}>
                  <View style={styles.categoryRow}>
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
                </Card>
              );
            })}
          </View>
        )}

        {/* 지출 내역 */}
        <View style={{ marginBottom: spacing.lg }}>
          <Text style={[typography.titleMedium, { color: colors.text, marginBottom: spacing.sm }]}>
            지출 내역
          </Text>
          {expenses.length > 0 ? (
            expenses.map((expense) => {
              const dest = tripDestinations.find(d => d.id === expense.destinationId);
              return (
                <TouchableOpacity
                  key={expense.id}
                  onPress={() => router.push(`/expense/${expense.id}`)}
                >
                  <Card style={{ marginBottom: spacing.xs, padding: spacing.sm }}>
                    <View style={styles.expenseRow}>
                      <CategoryIcon category={expense.category} size="small" />
                      <View style={[styles.expenseInfo, { marginLeft: spacing.sm }]}>
                        <View style={styles.expenseTopRow}>
                          <Text style={[typography.bodyMedium, { color: colors.text }]}>
                            {CATEGORIES.find((c) => c.id === expense.category)?.label}
                          </Text>
                          {dest && (
                            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.xs }]}>
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
                        <Text style={[typography.caption, { color: colors.textTertiary }]}>
                          {formatDisplayDate(expense.date)}
                        </Text>
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
                    </View>
                  </Card>
                </TouchableOpacity>
              );
            })
          ) : (
            <Card style={{ alignItems: 'center', padding: spacing.xl }}>
              <MaterialIcons name="receipt-long" size={48} color={colors.textTertiary} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                아직 지출 내역이 없습니다
              </Text>
            </Card>
          )}
        </View>

        <Button
          title="이 여행으로 지출 기록하기"
          onPress={handleSetActive}
          fullWidth
          style={{ marginBottom: spacing.xl }}
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
    paddingBottom: 40,
  },
  infoCard: {
    marginBottom: 16,
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
  destinationsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  destinationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  divider: {
    height: 1,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  expenseRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseInfo: {
    flex: 1,
  },
  expenseTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseAmount: {
    alignItems: 'flex-end',
  },
});
