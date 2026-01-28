// Travel Helper v1.1 - Home Screen
// PRD FR-007: 글로벌 통화 토글 적용
// PRD FR-008: 다중 국가 레이어 뷰 적용

import { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Card, FABMenu, FABMenuItem, ProgressBar, EmptyState, CategoryIcon, CurrencyToggle, HomeScreenSkeleton, ExpenseListSkeleton, ExpenseCardSkeleton } from '../../components/ui';
import { DayLayerView } from '../../components/layer';
import { formatKRW, formatCurrency } from '../../lib/utils/currency';
import { formatDisplayDate, getDaysBetween, getToday } from '../../lib/utils/date';
import { getCurrencyInfo, CATEGORIES, getCountryFlag } from '../../lib/utils/constants';
import { Trip, DayExpenseGroup } from '../../lib/types';

type MenuStep = 'closed' | 'main' | 'receipt';

export default function HomeScreen() {
  const { colors, spacing, typography, borderRadius, isDark } = useTheme();
  const {
    activeTrip,
    activeTrips,
    trips,
    destinations,
    currentDestination,
    isLoading,
    loadTrips,
    loadActiveTrips,
    setActiveTrip,
    getCurrentLocation,
  } = useTripStore();
  const { expenses, isLoading: isExpenseLoading, loadExpenses, getTodayTotal, getTotalByTrip, getExpensesByCurrency, getExpensesByDateGrouped } = useExpenseStore();
  const { currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [todayExpense, setTodayExpense] = useState<{ totalKRW: number; byCurrency: Record<string, number> }>({ totalKRW: 0, byCurrency: {} });
  const [totalExpense, setTotalExpense] = useState(0);
  const [expensesByCurrency, setExpensesByCurrency] = useState<Record<string, { amount: number; amountKRW: number }>>({});
  const [refreshing, setRefreshing] = useState(false);
  const [dayIndex, setDayIndex] = useState(1);
  const [todayGroups, setTodayGroups] = useState<DayExpenseGroup[]>([]);

  // FAB 메뉴 상태
  const [menuStep, setMenuStep] = useState<MenuStep>('closed');

  // 메뉴 닫고 페이지 이동 (애니메이션 완료 후)
  const closeMenuAndNavigate = (path: string) => {
    setMenuStep('closed');
    setTimeout(() => {
      router.push(path as any);
    }, 200);
  };

  // 메인 메뉴 아이템 (영수증/직접입력)
  const mainMenuItems: FABMenuItem[] = [
    {
      id: 'receipt',
      icon: 'camera-alt',
      label: '영수증 입력하기',
      description: '영수증 사진으로 빠르게 등록',
      keepOpen: true, // 메뉴 열린 상태 유지
      onPress: () => {
        setMenuStep('receipt');
      },
    },
    {
      id: 'manual',
      icon: 'edit',
      label: '직접 입력하기',
      description: '금액과 정보를 직접 입력',
      onPress: () => {
        closeMenuAndNavigate('/expense/new?mode=manual');
      },
    },
  ];

  // 영수증 소스 메뉴 아이템 (카메라/갤러리)
  const receiptMenuItems: FABMenuItem[] = [
    {
      id: 'camera',
      icon: 'photo-camera',
      label: '카메라로 촬영',
      description: '지금 바로 영수증 촬영',
      onPress: () => {
        closeMenuAndNavigate('/expense/new?mode=receipt&source=camera');
      },
    },
    {
      id: 'gallery',
      icon: 'photo-library',
      label: '갤러리에서 선택',
      description: '저장된 사진에서 선택',
      onPress: () => {
        closeMenuAndNavigate('/expense/new?mode=receipt&source=gallery');
      },
    },
  ];

  const handleMenuOpenChange = (isOpen: boolean) => {
    if (isOpen) {
      setMenuStep('main');
    } else {
      setMenuStep('closed');
    }
  };

  const currentMenuItems = menuStep === 'receipt' ? receiptMenuItems : mainMenuItems;

  const loadData = useCallback(async () => {
    if (activeTrip) {
      const today = await getTodayTotal(activeTrip.id);
      const total = await getTotalByTrip(activeTrip.id);
      const byCurrency = await getExpensesByCurrency(activeTrip.id);
      const location = await getCurrentLocation(activeTrip.id);

      setTodayExpense(today);
      setTotalExpense(total);
      setExpensesByCurrency(byCurrency);
      setDayIndex(location.dayIndex);

      // 오늘의 다중 국가 레이어
      const groups = getExpensesByDateGrouped(activeTrip.id, getToday(), destinations);
      setTodayGroups(groups);
    }
  }, [activeTrip?.id, destinations, expenses]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTrips();
    await loadActiveTrips();
    if (activeTrip) {
      await loadExpenses(activeTrip.id);
    }
    await loadData();
    setRefreshing(false);
  };

  const handleTripSelect = (trip: Trip) => {
    setActiveTrip(trip);
  };

  const primaryCurrency = currentDestination?.currency || destinations[0]?.currency;
  const todayLocalAmount = primaryCurrency ? todayExpense.byCurrency[primaryCurrency] || 0 : 0;
  const totalLocalAmount = primaryCurrency ? expensesByCurrency[primaryCurrency]?.amount || 0 : 0;

  // 통화 토글에 따른 금액 표시
  const displayTodayAmount = showInKRW
    ? formatKRW(todayExpense.totalKRW)
    : primaryCurrency
      ? formatCurrency(todayLocalAmount, primaryCurrency)
      : formatKRW(todayExpense.totalKRW);

  const displayTotalAmount = showInKRW
    ? formatKRW(totalExpense)
    : primaryCurrency
      ? formatCurrency(totalLocalAmount, primaryCurrency)
      : formatKRW(totalExpense);

  // 초기 로딩 중일 때 Skeleton 표시
  if (isLoading && trips.length === 0) {
    return <HomeScreenSkeleton />;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTrips.length > 0 && activeTrip ? (
          <>
            {/* 여행 헤더 */}
            <View style={styles.tripHeader}>
              <Text style={[typography.headlineLarge, { color: colors.text }]}>
                {activeTrip.name}
              </Text>
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {formatDisplayDate(activeTrip.startDate)} - {formatDisplayDate(activeTrip.endDate)} ({getDaysBetween(activeTrip.startDate, activeTrip.endDate)}일)
              </Text>
            </View>

            {/* 진행 중인 여행이 여러 개면 선택 탭 */}
            {activeTrips.length > 1 && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.tripTabs}
                contentContainerStyle={{ gap: spacing.sm }}
              >
                {activeTrips.map((trip) => {
                  const isSelected = activeTrip?.id === trip.id;

                  return (
                    <TouchableOpacity
                      key={trip.id}
                      onPress={() => handleTripSelect(trip)}
                      style={[
                        styles.tripTab,
                        {
                          backgroundColor: isSelected ? colors.primaryLight : colors.surface,
                          borderColor: isSelected ? colors.primary : colors.border,
                          borderRadius: borderRadius.lg,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          typography.labelMedium,
                          { color: isSelected ? colors.primary : colors.text },
                        ]}
                        numberOfLines={1}
                      >
                        {trip.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            )}

            {/* 통화 토글 + 현재 위치 */}
            <View style={[styles.toggleRow, { marginTop: spacing.base, marginBottom: spacing.md }]}>
              <CurrencyToggle />
              {currentDestination && (
                <View style={styles.locationBadge}>
                  <Text style={styles.locationFlag}>
                    {getCountryFlag(currentDestination.country)}
                  </Text>
                  <Text style={[typography.labelSmall, { color: colors.textSecondary }]}>
                    Day {dayIndex}
                  </Text>
                </View>
              )}
            </View>

            {/* 오늘/총 지출 카드 */}
            {isExpenseLoading && expenses.length === 0 ? (
              <ExpenseCardSkeleton />
            ) : (
              <Card variant="elevated">
                {/* 오늘 지출 */}
                <View style={styles.expenseSection}>
                  <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
                    오늘 지출
                  </Text>
                  <Text style={[typography.displayMedium, { color: colors.primary }]}>
                    {displayTodayAmount}
                  </Text>
                  {!showInKRW && todayExpense.totalKRW > 0 && (
                    <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
                      ≈ {formatKRW(todayExpense.totalKRW)}
                    </Text>
                  )}
                </View>

                <View style={[styles.divider, { backgroundColor: colors.divider }]} />

                {/* 총 지출 */}
                <View style={styles.expenseSection}>
                  <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
                    총 지출
                  </Text>
                  <Text style={[typography.titleLarge, { color: colors.text }]}>
                    {displayTotalAmount}
                  </Text>
                  {!showInKRW && totalExpense > 0 && (
                    <Text style={[typography.bodySmall, { color: colors.textTertiary }]}>
                      ≈ {formatKRW(totalExpense)}
                    </Text>
                  )}
                </View>

                {/* 예산 진행률 */}
                {activeTrip.budget && (
                  <View style={{ marginTop: spacing.md }}>
                    <View style={styles.budgetRow}>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        예산 {formatKRW(activeTrip.budget)}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {Math.round((totalExpense / activeTrip.budget) * 100)}%
                      </Text>
                    </View>
                    <ProgressBar
                      progress={totalExpense / activeTrip.budget}
                      variant="budget"
                      height={6}
                    />
                  </View>
                )}
              </Card>
            )}

            {/* 오늘의 지출 - 다중 국가 레이어 뷰 */}
            <View style={{ marginTop: spacing.xl }}>
              <Text style={[typography.titleMedium, { color: colors.text, marginBottom: spacing.md }]}>
                오늘의 지출
              </Text>
              {isExpenseLoading && expenses.length === 0 ? (
                <ExpenseListSkeleton />
              ) : todayGroups.length > 0 ? (
                <DayLayerView
                  date={getToday()}
                  groups={todayGroups}
                  showHeader={false}
                />
              ) : (
                <Card variant="outlined">
                  <View style={styles.emptyExpense}>
                    <MaterialIcons name="receipt-long" size={32} color={colors.textTertiary} />
                    <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                      오늘 아직 지출이 없어요
                    </Text>
                  </View>
                </Card>
              )}
            </View>
          </>
        ) : (
          // 진행 중인 여행이 없을 때
          <EmptyState
            icon="flight-takeoff"
            title="여행을 시작해보세요"
            description="새 여행을 만들고 지출을 기록하세요"
            action={{
              label: '새 여행 만들기',
              onPress: () => router.push('/trip/new'),
            }}
          />
        )}

        {/* 지난 여행 */}
        {activeTrips.length === 0 && trips.length > 0 && (
          <View style={{ marginTop: spacing['2xl'] }}>
            <Text style={[typography.titleMedium, { color: colors.text, marginBottom: spacing.md }]}>
              지난 여행
            </Text>
            {trips.slice(0, 3).map((trip) => {
              const dest = destinations.find(d => d.tripId === trip.id);
              const flag = dest ? getCountryFlag(dest.country) : '';

              return (
                <Card
                  key={trip.id}
                  variant="outlined"
                  style={{ marginBottom: spacing.sm }}
                  onPress={() => router.push(`/trip/${trip.id}`)}
                >
                  <View style={styles.pastTripRow}>
                    <Text style={styles.pastTripFlag}>{flag || '✈️'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[typography.titleSmall, { color: colors.text }]}>
                        {trip.name}
                      </Text>
                      <Text style={[typography.caption, { color: colors.textSecondary }]}>
                        {formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}
                      </Text>
                    </View>
                    <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
                  </View>
                </Card>
              );
            })}
          </View>
        )}
      </ScrollView>

      {/* FAB 메뉴 - 빠른 지출 입력 */}
      {activeTrips.length > 0 && (
        <FABMenu
          items={currentMenuItems}
          isOpen={menuStep !== 'closed'}
          onOpenChange={handleMenuOpenChange}
        />
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
    paddingBottom: 100,
  },
  tripHeader: {
    marginBottom: 8,
  },
  tripTabs: {
    marginVertical: 12,
  },
  tripTab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  locationFlag: {
    fontSize: 20,
  },
  expenseSection: {
    marginVertical: 8,
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  emptyExpense: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  pastTripRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  pastTripFlag: {
    fontSize: 28,
  },
});
