// Trip Main Screen - Main Screen Revamp
// PRD FR-201~FR-409: 여행 메인 화면 + 커스텀 헤더 + 하단바

import { useEffect, useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Modal,
  Pressable,
  Animated,
  Alert,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../../lib/theme';
import { useTripStore } from '../../../lib/stores/tripStore';
import { useExpenseStore } from '../../../lib/stores/expenseStore';
import { useSettingsStore } from '../../../lib/stores/settingsStore';
import { Card, CurrencyToggle } from '../../../components/ui';
import { BudgetSummaryCard, TodayExpenseTable } from '../../../components/trip';
import { formatDisplayDate, getDaysBetween } from '../../../lib/utils/date';
import { getTripStatus } from '../../../lib/types';
import { requestGalleryPermission } from '../../../lib/utils/image';

export default function TripMainScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();
  const { trips, destinations, loadDestinations, setActiveTrip } = useTripStore();
  const { expenses, loadExpenses, getStats } = useExpenseStore();
  const { hapticEnabled, currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);

  // FAB Menu states
  const [showFabMenu, setShowFabMenu] = useState(false);
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [fabRotation] = useState(new Animated.Value(0));

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (trip) {
      const today = new Date().toISOString().split('T')[0];
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

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  // FAB Menu handlers
  const toggleFabMenu = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const toValue = showFabMenu ? 0 : 1;
    Animated.spring(fabRotation, {
      toValue,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    setShowFabMenu(!showFabMenu);
  };

  const closeFabMenu = () => {
    Animated.spring(fabRotation, {
      toValue: 0,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
    setShowFabMenu(false);
  };

  const handleManualInput = () => {
    triggerHaptic();
    closeFabMenu();
    if (trip) {
      setActiveTrip(trip);
      router.push('/expense/new?mode=manual');
    }
  };

  const handleReceiptInput = () => {
    triggerHaptic();
    closeFabMenu();
    setShowReceiptOptions(true);
  };

  const handleCameraInput = () => {
    triggerHaptic();
    setShowReceiptOptions(false);
    if (trip) {
      setActiveTrip(trip);
      router.push('/expense/new?mode=receipt&source=camera');
    }
  };

  const handleGalleryInput = async () => {
    triggerHaptic();
    setShowReceiptOptions(false);

    const permission = await requestGalleryPermission();
    if (permission === 'never_ask_again') {
      Alert.alert('권한 필요', '설정에서 사진 접근 권한을 허용해주세요.');
      return;
    }

    if (trip) {
      setActiveTrip(trip);
      router.push('/expense/new?mode=receipt&source=gallery');
    }
  };

  const handleCalculatorPress = () => {
    triggerHaptic();
    if (trip) {
      setActiveTrip(trip);
    }
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

  const handleBack = () => {
    triggerHaptic();
    router.replace('/(tabs)');
  };

  const fabRotateInterpolate = fabRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  if (!trip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
          여행을 찾을 수 없습니다
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 커스텀 헤더 */}
      <View style={[styles.header, { paddingTop: insets.top + 8, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={handleBack}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="뒤로가기"
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>

        <View style={styles.headerCenter}>
          <Text style={[typography.titleMedium, { color: colors.text }]} numberOfLines={1}>
            {trip.name}
          </Text>
        </View>

        <View style={[styles.headerRight, { gap: spacing.xs }]}>
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
      </View>

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
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            {formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}
          </Text>

          {tripStatus === 'active' && (
            <View style={[styles.dayBadge, { backgroundColor: colors.primary }]}>
              <Text style={[typography.labelLarge, { color: 'white' }]}>
                Day {dayInfo.dayIndex} / {dayInfo.totalDays}
              </Text>
            </View>
          )}
        </View>

        {currentDestination && (
          <Card style={{ marginTop: spacing.md, padding: spacing.sm }}>
            <View style={styles.currentDestRow}>
              <MaterialIcons name="location-on" size={20} color={colors.primary} />
              <Text style={[typography.labelMedium, { color: colors.textSecondary, marginLeft: 4 }]}>
                현재 위치
              </Text>
              <Text style={[typography.titleSmall, { color: colors.text, marginLeft: spacing.sm }]}>
                {currentDestination.city || currentDestination.country}
              </Text>
            </View>
          </Card>
        )}

        <View style={{ marginTop: spacing.md }}>
          <BudgetSummaryCard
            budget={trip.budget}
            totalSpent={stats?.totalKRW || 0}
          />
        </View>

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

      {/* 하단 탭바 */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 8, backgroundColor: colors.background, borderTopColor: colors.border }]}>
        <TouchableOpacity style={styles.bottomBarItem} onPress={handleBack}>
          <MaterialIcons name="home" size={24} color={colors.textSecondary} />
          <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 2 }]}>홈</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/(tabs)/calendar')}>
          <MaterialIcons name="calendar-today" size={24} color={colors.textSecondary} />
          <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 2 }]}>캘린더</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/(tabs)/stats')}>
          <MaterialIcons name="pie-chart" size={24} color={colors.textSecondary} />
          <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 2 }]}>통계</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.bottomBarItem} onPress={() => router.push('/(tabs)/settings')}>
          <MaterialIcons name="settings" size={24} color={colors.textSecondary} />
          <Text style={[typography.labelSmall, { color: colors.textSecondary, marginTop: 2 }]}>설정</Text>
        </TouchableOpacity>
      </View>

      {/* 우측 하단 FAB 영역 - 설정 탭 위 */}
      <View style={[styles.fabWrapper, { bottom: insets.bottom + 70 }]}>
        <TouchableOpacity
          style={[styles.calcFab, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={handleCalculatorPress}
        >
          <MaterialIcons name="calculate" size={22} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.mainFab, { backgroundColor: colors.primary }]}
          onPress={toggleFabMenu}
        >
          <Animated.View style={{ transform: [{ rotate: fabRotateInterpolate }] }}>
            <MaterialIcons name="add" size={28} color="white" />
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* FAB Menu Modal - 지출 추가 옵션 */}
      <Modal transparent visible={showFabMenu} animationType="fade" onRequestClose={closeFabMenu}>
        <Pressable style={[styles.modalOverlay, styles.fabMenuOverlay, { paddingBottom: insets.bottom + 140 }]} onPress={closeFabMenu}>
          <View style={[styles.fabMenuBox, { backgroundColor: colors.background, borderRadius: borderRadius.xl, ...shadows.lg }]}>
            <TouchableOpacity style={styles.fabMenuItem} onPress={handleManualInput}>
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="edit" size={24} color={colors.primary} />
              </View>
              <View style={styles.fabMenuText}>
                <Text style={[typography.titleSmall, { color: colors.text }]}>직접 입력</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>금액과 카테고리 직접 입력</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[styles.fabMenuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity style={styles.fabMenuItem} onPress={handleReceiptInput}>
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="receipt-long" size={24} color={colors.primary} />
              </View>
              <View style={styles.fabMenuText}>
                <Text style={[typography.titleSmall, { color: colors.text }]}>영수증 촬영</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>영수증 사진으로 자동 입력</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Receipt Options Modal - 카메라/갤러리 선택 */}
      <Modal transparent visible={showReceiptOptions} animationType="fade" onRequestClose={() => setShowReceiptOptions(false)}>
        <Pressable style={[styles.modalOverlay, styles.fabMenuOverlay, { paddingBottom: insets.bottom + 140 }]} onPress={() => setShowReceiptOptions(false)}>
          <View style={[styles.fabMenuBox, { backgroundColor: colors.background, borderRadius: borderRadius.xl, ...shadows.lg }]}>
            <TouchableOpacity style={styles.fabMenuItem} onPress={handleCameraInput}>
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="camera-alt" size={24} color={colors.primary} />
              </View>
              <View style={styles.fabMenuText}>
                <Text style={[typography.titleSmall, { color: colors.text }]}>카메라로 촬영</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>지금 영수증 사진 찍기</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>

            <View style={[styles.fabMenuDivider, { backgroundColor: colors.divider }]} />

            <TouchableOpacity style={styles.fabMenuItem} onPress={handleGalleryInput}>
              <View style={[styles.fabMenuIcon, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons name="photo-library" size={24} color={colors.primary} />
              </View>
              <View style={styles.fabMenuText}>
                <Text style={[typography.titleSmall, { color: colors.text }]}>갤러리에서 선택</Text>
                <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>저장된 영수증 사진 불러오기</Text>
              </View>
              <MaterialIcons name="chevron-right" size={20} color={colors.textTertiary} />
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingBottom: 120,
  },
  tripHeader: {
    marginBottom: 8,
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
  bottomBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
  },
  bottomBarItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
  },
  fabWrapper: {
    position: 'absolute',
    right: 16,
    flexDirection: 'column',
    alignItems: 'center',
    gap: 12,
  },
  calcFab: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  mainFab: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  fabMenuOverlay: {
    justifyContent: 'flex-end',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  fabMenuBox: {
    width: 280,
    overflow: 'hidden',
  },
  fabMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  fabMenuIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fabMenuText: {
    flex: 1,
    marginLeft: 12,
  },
  fabMenuDivider: {
    height: 1,
    marginHorizontal: 16,
  },
});
