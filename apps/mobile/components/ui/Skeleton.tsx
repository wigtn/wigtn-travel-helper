// Travel Helper v2.0 - Skeleton Loading Component
// Using React Native Animated API (no reanimated dependency)

import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { useTheme } from '../../lib/theme';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function Skeleton({
  width = '100%',
  height = 20,
  borderRadius = 8,
  style,
}: SkeletonProps) {
  const { colors, isDark } = useTheme();
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, []);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  const baseColor = isDark ? colors.surface : colors.border;

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: baseColor,
          opacity,
        },
        style,
      ]}
    />
  );
}

// 홈 화면용 Skeleton
export function HomeScreenSkeleton() {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.base }]}>
      {/* 여행 헤더 */}
      <Skeleton width="60%" height={32} borderRadius={8} />
      <Skeleton width="45%" height={16} borderRadius={4} style={{ marginTop: spacing.xs }} />

      {/* 토글 영역 */}
      <View style={[styles.toggleRow, { marginTop: spacing.base, marginBottom: spacing.md }]}>
        <Skeleton width={140} height={36} borderRadius={borderRadius.lg} />
        <Skeleton width={80} height={24} borderRadius={4} />
      </View>

      {/* 지출 카드 */}
      <View
        style={[
          styles.expenseCard,
          { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
        ]}
      >
        <Skeleton width="30%" height={14} borderRadius={4} />
        <Skeleton width="50%" height={40} borderRadius={8} style={{ marginTop: spacing.sm }} />
        <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.md }]} />
        <Skeleton width="25%" height={14} borderRadius={4} />
        <Skeleton width="40%" height={28} borderRadius={8} style={{ marginTop: spacing.sm }} />
        {/* 예산 진행률 */}
        <View style={{ marginTop: spacing.md }}>
          <View style={styles.budgetRow}>
            <Skeleton width={80} height={12} borderRadius={4} />
            <Skeleton width={30} height={12} borderRadius={4} />
          </View>
          <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: spacing.xs }} />
        </View>
      </View>

      {/* 오늘의 지출 */}
      <View style={{ marginTop: spacing.xl }}>
        <Skeleton width="35%" height={20} borderRadius={4} style={{ marginBottom: spacing.md }} />
        <View
          style={[
            styles.expenseCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
          ]}
        >
          {/* 국가 헤더 */}
          <View style={styles.countryRow}>
            <Skeleton width={32} height={32} borderRadius={16} />
            <Skeleton width="30%" height={18} borderRadius={4} style={{ marginLeft: spacing.sm }} />
            <View style={{ flex: 1 }} />
            <Skeleton width={60} height={18} borderRadius={4} />
          </View>
          {/* 지출 아이템들 */}
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.expenseItem, { marginTop: spacing.md }]}>
              <Skeleton width={36} height={36} borderRadius={10} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Skeleton width="40%" height={16} borderRadius={4} />
                <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <Skeleton width={70} height={18} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// 캘린더 화면용 Skeleton
export function CalendarScreenSkeleton() {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.base }]}>
      {/* 월 네비게이션 */}
      <View style={styles.monthNav}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width={120} height={24} borderRadius={8} />
        <Skeleton width={32} height={32} borderRadius={16} />
      </View>

      {/* 요일 헤더 */}
      <View style={[styles.weekRow, { marginTop: spacing.md }]}>
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <Skeleton key={i} width={36} height={16} borderRadius={4} />
        ))}
      </View>

      {/* 달력 그리드 */}
      {[1, 2, 3, 4, 5].map((week) => (
        <View key={week} style={[styles.weekRow, { marginTop: spacing.sm }]}>
          {[1, 2, 3, 4, 5, 6, 7].map((day) => (
            <Skeleton key={day} width={36} height={44} borderRadius={8} />
          ))}
        </View>
      ))}

      {/* 일별 지출 */}
      <View style={{ marginTop: spacing.xl }}>
        <Skeleton width="40%" height={20} borderRadius={4} style={{ marginBottom: spacing.md }} />
        <View
          style={[
            styles.expenseCard,
            { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
          ]}
        >
          {[1, 2].map((i) => (
            <View key={i} style={[styles.expenseItem, i > 1 && { marginTop: spacing.md }]}>
              <Skeleton width={36} height={36} borderRadius={10} />
              <View style={{ flex: 1, marginLeft: spacing.sm }}>
                <Skeleton width="35%" height={16} borderRadius={4} />
                <Skeleton width="50%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
              </View>
              <Skeleton width={60} height={18} borderRadius={4} />
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

// 통계 화면용 Skeleton
export function StatsScreenSkeleton() {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background, padding: spacing.base }]}>
      {/* 탭 */}
      <View style={styles.tabRow}>
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} width={80} height={36} borderRadius={18} />
        ))}
      </View>

      {/* 총 지출 카드 */}
      <View
        style={[
          styles.expenseCard,
          { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg, marginTop: spacing.lg },
        ]}
      >
        <Skeleton width="25%" height={14} borderRadius={4} />
        <Skeleton width="45%" height={36} borderRadius={8} style={{ marginTop: spacing.sm }} />
      </View>

      {/* 차트 영역 */}
      <View
        style={[
          styles.chartArea,
          { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginTop: spacing.lg },
        ]}
      >
        <Skeleton width="100%" height={200} borderRadius={borderRadius.lg} />
      </View>

      {/* 카테고리별 */}
      <Skeleton width="40%" height={20} borderRadius={4} style={{ marginTop: spacing.xl, marginBottom: spacing.md }} />
      {[1, 2, 3, 4].map((i) => (
        <View
          key={i}
          style={[
            styles.categoryItem,
            { backgroundColor: colors.surface, borderRadius: borderRadius.md, padding: spacing.md, marginBottom: spacing.sm },
          ]}
        >
          <Skeleton width={36} height={36} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Skeleton width="30%" height={16} borderRadius={4} />
          </View>
          <View style={{ alignItems: 'flex-end' }}>
            <Skeleton width={70} height={18} borderRadius={4} />
            <Skeleton width={30} height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

// 지출 목록용 부분 Skeleton (오늘의 지출 섹션)
export function ExpenseListSkeleton() {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.expenseCard,
        { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
      ]}
    >
      {/* 국가 헤더 */}
      <View style={styles.countryRow}>
        <Skeleton width={32} height={32} borderRadius={16} />
        <Skeleton width="30%" height={18} borderRadius={4} style={{ marginLeft: spacing.sm }} />
        <View style={{ flex: 1 }} />
        <Skeleton width={60} height={18} borderRadius={4} />
      </View>
      {/* 지출 아이템들 */}
      {[1, 2, 3].map((i) => (
        <View key={i} style={[styles.expenseItem, { marginTop: spacing.md }]}>
          <Skeleton width={36} height={36} borderRadius={10} />
          <View style={{ flex: 1, marginLeft: spacing.sm }}>
            <Skeleton width="40%" height={16} borderRadius={4} />
            <Skeleton width="60%" height={12} borderRadius={4} style={{ marginTop: 4 }} />
          </View>
          <Skeleton width={70} height={18} borderRadius={4} />
        </View>
      ))}
    </View>
  );
}

// 지출 카드용 Skeleton (오늘/총 지출)
export function ExpenseCardSkeleton() {
  const { colors, spacing, borderRadius } = useTheme();

  return (
    <View
      style={[
        styles.expenseCard,
        { backgroundColor: colors.surface, borderRadius: borderRadius.lg, padding: spacing.lg },
      ]}
    >
      <Skeleton width="30%" height={14} borderRadius={4} />
      <Skeleton width="50%" height={40} borderRadius={8} style={{ marginTop: spacing.sm }} />
      <View style={[styles.divider, { backgroundColor: colors.border, marginVertical: spacing.md }]} />
      <Skeleton width="25%" height={14} borderRadius={4} />
      <Skeleton width="40%" height={28} borderRadius={8} style={{ marginTop: spacing.sm }} />
      {/* 예산 진행률 */}
      <View style={{ marginTop: spacing.md }}>
        <View style={styles.budgetRow}>
          <Skeleton width={80} height={12} borderRadius={4} />
          <Skeleton width={30} height={12} borderRadius={4} />
        </View>
        <Skeleton width="100%" height={6} borderRadius={3} style={{ marginTop: spacing.xs }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  skeleton: {},
  container: {
    flex: 1,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  expenseCard: {},
  divider: {
    height: 1,
  },
  budgetRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  expenseItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  monthNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  tabRow: {
    flexDirection: 'row',
    gap: 12,
  },
  chartArea: {
    overflow: 'hidden',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
