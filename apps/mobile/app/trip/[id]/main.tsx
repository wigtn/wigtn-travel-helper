// Trip Main Screen - Main Screen Revamp
// PRD FR-201~FR-409: 여행 메인 화면 + 계산기 FAB

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
import { Card, CurrencyToggle } from '../../../components/ui';
import { BudgetSummaryCard, TodayExpenseTable } from '../../../components/trip';
import { formatDisplayDate, getDaysBetween } from '../../../lib/utils/date';
import { getCountryFlag } from '../../../lib/utils/constants';
import { getTripStatus } from '../../../lib/types';

export default function TripMainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { trips, destinations, loadDestinations, setActiveTrip } = useTripStore();
  const { expenses, loadExpenses, getStats } = useExpenseStore();
  const { hapticEnabled, currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  const trip = trips.find((t) => t.id === id) || null;
  const tripDestinations = destinations.filter((d) => d.tripId === id);
  const tripStatus = trip ? getTripStatus(trip) : 'past';
  const stats = trip ? getStats(trip.id) : null;

  // Day N calculation
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

  // Expenses for selected date
  const dateExpenses = useMemo(() => {
    return expenses.filter((e) => e.date === selectedDate);
  }, [expenses, selectedDate]);

  // Current destination
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

  // Reset to today when trip changes
  useEffect(() => {
    if (trip) {
      const today = new Date().toISOString().split('T')[0];
      // Clamp to trip date range
      if (today >= trip.startDate && today <= trip.endDate) {
        setSelectedDate(today);
      } else if (today < trip.startDate) {
        setSelectedDate(trip.startDate);
      } else {
        setSelectedDate(trip.endDate);
      }
    }
  }, [trip?.id]);

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

  const handleCalculatorPress = () => {
    triggerHaptic();
    router.push('/calculator');
  };

  const handleExpensePress = (expenseId: string) => {
    router.push(`/expense/${expenseId}`);
  };

  const handleReceiptPress = (expenseId: string) => {
    router.push(`/expense/${expenseId}/receipt`);
  };

  const handleDateChange = (date: string) => {
    setSelectedDate(date);
  };

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
          title: '',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => {
                triggerHaptic();
                router.replace('/(tabs)');
              }}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              accessibilityLabel="홈으로 이동"
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
                accessibilityLabel="여행 설정"
              >
                <MaterialIcons name="settings" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
          ),
        }}
      />

      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView
          style={styles.scrollView}
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
          {/* Trip Header */}
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

            {/* Day Badge */}
            {tripStatus === 'active' && (
              <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
                <Text style={[typography.labelLarge, { color: 'white' }]}>
                  Day {dayInfo.dayIndex} / {dayInfo.totalDays}
                </Text>
              </View>
            )}
          </View>

          {/* Current Destination */}
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

          {/* Budget Summary Card */}
          <View style={{ marginTop: spacing.md }}>
            <BudgetSummaryCard
              budget={trip.budget}
              totalSpent={stats?.totalKRW || 0}
            />
          </View>

          {/* Today's Expenses Table with Date Navigation */}
          <View style={{ marginTop: spacing.lg }}>
            <View style={[styles.sectionHeader, { marginBottom: spacing.sm }]}>
              <View style={styles.sectionTitleRow}>
                <MaterialIcons name="receipt-long" size={20} color={colors.primary} />
                <Text style={[typography.titleMedium, { color: colors.text, marginLeft: 8 }]}>
                  지출 내역
                </Text>
              </View>
            </View>

            <TodayExpenseTable
              date={selectedDate}
              expenses={dateExpenses}
              destinations={tripDestinations}
              showInKRW={showInKRW}
              onExpensePress={handleExpensePress}
              onReceiptPress={handleReceiptPress}
              onDateChange={handleDateChange}
              tripStartDate={trip.startDate}
              tripEndDate={trip.endDate}
            />
          </View>
        </ScrollView>

        {/* FAB Container */}
        <View style={[styles.fabContainer, { bottom: spacing.xl, right: spacing.base }]}>
          {/* Calculator FAB */}
          <TouchableOpacity
            style={[
              styles.fabSecondary,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={handleCalculatorPress}
            accessibilityLabel="계산기 열기"
          >
            <MaterialIcons name="calculate" size={24} color={colors.primary} />
          </TouchableOpacity>

          {/* Add Expense FAB */}
          <TouchableOpacity
            style={[styles.fabPrimary, { backgroundColor: colors.primary }]}
            onPress={handleAddExpense}
            accessibilityLabel="지출 추가"
          >
            <MaterialIcons name="add" size={28} color="white" />
          </TouchableOpacity>
        </View>
      </View>
    </>
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
    paddingBottom: 120,
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
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fabContainer: {
    position: 'absolute',
    alignItems: 'center',
    gap: 12,
  },
  fabSecondary: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  fabPrimary: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
});
