// Main Screen Revamp - 글로벌 홈 화면
// PRD FR-101~FR-109: 지도 + 여행 리스트 + 자동 전환

import { useEffect, useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { Trip, TripStatus, getTripStatus } from '../../lib/types';
import { TripMapView } from '../../components/map';
import { TripCard } from '../../components/home';
import { Card, EmptyState, HomeScreenSkeleton } from '../../components/ui';

// 앱 실행 중 한 번만 자동 전환 (모듈 레벨 플래그)
let hasAutoNavigated = false;

export default function GlobalHomeScreen() {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const {
    trips,
    destinations,
    isLoading,
    loadTrips,
    loadAllDestinations,
  } = useTripStore();

  const [refreshing, setRefreshing] = useState(false);

  // 여행을 상태별로 분류
  const categorizedTrips = useMemo(() => {
    const active: Trip[] = [];
    const upcoming: Trip[] = [];
    const past: Trip[] = [];

    for (const trip of trips) {
      const status = getTripStatus(trip);
      if (status === 'active') active.push(trip);
      else if (status === 'upcoming') upcoming.push(trip);
      else past.push(trip);
    }

    // 정렬: active는 시작일 순, upcoming은 시작일 순, past는 종료일 역순
    active.sort((a, b) => a.startDate.localeCompare(b.startDate));
    upcoming.sort((a, b) => a.startDate.localeCompare(b.startDate));
    past.sort((a, b) => b.endDate.localeCompare(a.endDate));

    return { active, upcoming, past };
  }, [trips]);

  // 앱 실행 시 자동 여행 모드 전환 (앱 실행 중 1회만)
  useEffect(() => {
    if (!hasAutoNavigated && !isLoading && categorizedTrips.active.length > 0) {
      const activeTrip = categorizedTrips.active[0];
      hasAutoNavigated = true;
      // 자동 전환 - 여행 메인 화면으로 이동
      router.replace(`/trip/${activeTrip.id}/main`);
    }
  }, [isLoading, categorizedTrips.active]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadTrips();
    await loadAllDestinations();
    setRefreshing(false);
  }, [loadTrips, loadAllDestinations]);

  const handleTripPress = (tripId: string) => {
    router.push(`/trip/${tripId}/main`);
  };

  const handleMarkerPress = (tripId: string) => {
    router.push(`/trip/${tripId}/main`);
  };

  const handleCreateTrip = () => {
    router.push('/trip/new');
  };

  // 초기 로딩 중
  if (isLoading && trips.length === 0) {
    return <HomeScreenSkeleton />;
  }

  const hasTrips = trips.length > 0;
  const hasActiveOrUpcoming = categorizedTrips.active.length > 0 || categorizedTrips.upcoming.length > 0;

  // 섹션 헤더 컴포넌트
  const SectionHeader = ({
    title,
    icon,
    iconColor,
    count
  }: {
    title: string;
    icon: string;
    iconColor: string;
    count: number;
  }) => (
    <View style={[styles.sectionHeader, { marginTop: spacing.lg, marginBottom: spacing.sm }]}>
      <View style={styles.sectionTitleRow}>
        <View style={[styles.sectionIcon, { backgroundColor: iconColor + '20' }]}>
          <MaterialIcons name={icon as any} size={16} color={iconColor} />
        </View>
        <Text style={[typography.titleMedium, { color: colors.text }]}>{title}</Text>
      </View>
      <Text style={[typography.labelSmall, { color: colors.textTertiary }]}>{count}개</Text>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* 앱 헤더 */}
        <View style={styles.header}>
          <Text style={[typography.headlineLarge, { color: colors.text }]}>
            WIGEX
          </Text>
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            내 여행 경비 관리
          </Text>
        </View>

        {hasTrips ? (
          <>
            {/* 지도 영역 */}
            <Card variant="outlined" style={{ marginTop: spacing.lg, padding: 0, overflow: 'hidden' }}>
              <TripMapView
                trips={trips}
                destinations={destinations}
                onMarkerPress={handleMarkerPress}
                style={{ height: 200 }}
              />
            </Card>

            {/* 현재 여행 섹션 */}
            {categorizedTrips.active.length > 0 && (
              <>
                <SectionHeader
                  title="현재 여행"
                  icon="flight-takeoff"
                  iconColor={colors.primary}
                  count={categorizedTrips.active.length}
                />
                {categorizedTrips.active.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    destinations={destinations}
                    status="active"
                    onPress={() => handleTripPress(trip.id)}
                  />
                ))}
              </>
            )}

            {/* 예정된 여행 섹션 */}
            {categorizedTrips.upcoming.length > 0 && (
              <>
                <SectionHeader
                  title="예정된 여행"
                  icon="event"
                  iconColor="#4DABF7"
                  count={categorizedTrips.upcoming.length}
                />
                {categorizedTrips.upcoming.map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    destinations={destinations}
                    status="upcoming"
                    onPress={() => handleTripPress(trip.id)}
                  />
                ))}
              </>
            )}

            {/* 과거 여행 섹션 */}
            {categorizedTrips.past.length > 0 && (
              <>
                <SectionHeader
                  title="과거 여행"
                  icon="history"
                  iconColor={colors.textTertiary}
                  count={categorizedTrips.past.length}
                />
                {categorizedTrips.past.slice(0, 5).map((trip) => (
                  <TripCard
                    key={trip.id}
                    trip={trip}
                    destinations={destinations}
                    status="past"
                    onPress={() => handleTripPress(trip.id)}
                  />
                ))}
                {categorizedTrips.past.length > 5 && (
                  <TouchableOpacity
                    style={[styles.showMoreButton, { borderColor: colors.border }]}
                    onPress={() => {/* TODO: 전체 여행 목록 화면 */}}
                  >
                    <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
                      더보기 ({categorizedTrips.past.length - 5}개)
                    </Text>
                  </TouchableOpacity>
                )}
              </>
            )}

            {/* 새 여행 만들기 버튼 */}
            <TouchableOpacity
              style={[
                styles.createTripButton,
                {
                  backgroundColor: colors.primaryLight,
                  borderRadius: borderRadius.lg,
                  marginTop: spacing.xl,
                },
              ]}
              onPress={handleCreateTrip}
            >
              <MaterialIcons name="add" size={24} color={colors.primary} />
              <Text style={[typography.labelLarge, { color: colors.primary }]}>
                새 여행 만들기
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* 여행이 없을 때 */
          <EmptyState
            icon="flight-takeoff"
            title="여행을 시작해보세요"
            description="새 여행을 만들고 지출을 기록하세요"
            action={{
              label: '새 여행 만들기',
              onPress: handleCreateTrip,
            }}
          />
        )}
      </ScrollView>
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
  header: {
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createTripButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
  },
  showMoreButton: {
    alignItems: 'center',
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    marginTop: 8,
  },
});
