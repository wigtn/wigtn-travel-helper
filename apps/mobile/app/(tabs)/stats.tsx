// Travel Helper v1.1 - Stats Screen
// PRD FR-007: 글로벌 통화 토글 연동

import { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Card, ProgressBar, CategoryIcon, EmptyState, CurrencyToggle, StatsScreenSkeleton } from '../../components/ui';
import { formatKRW, formatCurrency, getCurrencyFlag } from '../../lib/utils/currency';
import { getCountryFlag } from '../../lib/utils/constants';
import { CATEGORIES, Category } from '../../lib/utils/constants';
import { getDaysBetween, formatDisplayDate } from '../../lib/utils/date';

type TabType = 'category' | 'currency' | 'destination';

export default function StatsScreen() {
  const { colors, spacing, typography, borderRadius, isDark } = useTheme();
  const { activeTrip, destinations, isLoading, trips } = useTripStore();
  const { expenses, loadExpenses, getStats } = useExpenseStore();
  const { currencyDisplayMode } = useSettingsStore();
  const showInKRW = currencyDisplayMode === 'krw';

  const [activeTab, setActiveTab] = useState<TabType>('category');

  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
    }
  }, [activeTrip]);

  const stats = activeTrip ? getStats(activeTrip.id) : null;

  // 주요 통화 (가장 많이 사용된 통화)
  const mainCurrency = useMemo(() => {
    if (!stats || Object.keys(stats.byCurrency).length === 0) return 'KRW';
    const sorted = Object.entries(stats.byCurrency).sort((a, b) => b[1].amountKRW - a[1].amountKRW);
    return sorted[0][0];
  }, [stats]);

  // 통화가 여러 개인지 확인
  const hasMultipleCurrencies = useMemo(() => {
    if (!stats) return false;
    return Object.keys(stats.byCurrency).length > 1;
  }, [stats]);

  // 일별 평균
  const dailyAverage = useMemo(() => {
    if (!activeTrip || !stats) return { krw: 0, local: 0 };
    const today = new Date().toISOString().split('T')[0];
    const endDate = activeTrip.endDate < today ? activeTrip.endDate : today;
    const days = getDaysBetween(activeTrip.startDate, endDate);
    const avgKRW = Math.round(stats.totalKRW / Math.max(1, days));
    const avgLocal = stats.byCurrency[mainCurrency]
      ? Math.round(stats.byCurrency[mainCurrency].amount / Math.max(1, days))
      : 0;
    return { krw: avgKRW, local: avgLocal };
  }, [activeTrip, stats, mainCurrency]);

  // 가장 많이 쓴 카테고리
  const topCategory = useMemo(() => {
    if (!stats) return null;
    const entries = Object.entries(stats.byCategory) as [Category, number][];
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    const categoryInfo = CATEGORIES.find((c) => c.id === sorted[0][0]);
    return categoryInfo ? { ...categoryInfo, amount: sorted[0][1] } : null;
  }, [stats]);

  // 가장 많이 쓴 날
  const topDay = useMemo(() => {
    if (!stats) return null;
    const entries = Object.entries(stats.byDate);
    if (entries.length === 0) return null;
    const sorted = entries.sort((a, b) => b[1] - a[1]);
    return { date: sorted[0][0], amount: sorted[0][1] };
  }, [stats]);

  // 통화별 지출 정렬
  const sortedCurrencies = useMemo(() => {
    if (!stats) return [];
    return Object.entries(stats.byCurrency)
      .sort((a, b) => b[1].amountKRW - a[1].amountKRW)
      .map(([currency, data]) => ({
        currency,
        amount: data.amount,
        amountKRW: data.amountKRW,
      }));
  }, [stats]);

  // 방문지별 지출 정렬
  const sortedDestinations = useMemo(() => {
    if (!stats || !destinations || !expenses) return [];

    const destStats: Record<string, { amountKRW: number; localAmounts: Record<string, number> }> = {};

    for (const expense of expenses) {
      if (!expense.destinationId) continue;
      if (!destStats[expense.destinationId]) {
        destStats[expense.destinationId] = { amountKRW: 0, localAmounts: {} };
      }
      destStats[expense.destinationId].amountKRW += expense.amountKRW;
      destStats[expense.destinationId].localAmounts[expense.currency] =
        (destStats[expense.destinationId].localAmounts[expense.currency] || 0) + expense.amount;
    }

    return Object.entries(destStats)
      .map(([destId, data]) => {
        const dest = destinations.find(d => d.id === destId);
        const primaryAmount = dest ? data.localAmounts[dest.currency] || 0 : 0;
        return {
          destination: dest,
          amountKRW: data.amountKRW,
          localAmount: primaryAmount,
          localAmounts: data.localAmounts,
        };
      })
      .filter(item => item.destination)
      .sort((a, b) => b.amountKRW - a.amountKRW);
  }, [stats, destinations, expenses]);

  // 카테고리별 지출 정렬
  const sortedCategories = useMemo(() => {
    if (!stats || !expenses) return [];

    const categoryLocalAmounts: Record<Category, Record<string, number>> = {} as Record<Category, Record<string, number>>;

    for (const expense of expenses) {
      if (!categoryLocalAmounts[expense.category]) {
        categoryLocalAmounts[expense.category] = {};
      }
      categoryLocalAmounts[expense.category][expense.currency] =
        (categoryLocalAmounts[expense.category][expense.currency] || 0) + expense.amount;
    }

    return CATEGORIES.filter((cat) => stats.byCategory[cat.id] > 0)
      .map(cat => {
        const localAmounts = categoryLocalAmounts[cat.id] || {};
        const mainAmount = localAmounts[mainCurrency] || 0;
        return {
          ...cat,
          amountKRW: stats.byCategory[cat.id],
          localAmount: mainAmount,
          localAmounts,
          percentage: Math.round((stats.byCategory[cat.id] / stats.totalKRW) * 100),
        };
      })
      .sort((a, b) => b.amountKRW - a.amountKRW);
  }, [stats, expenses, mainCurrency]);

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'category', label: '카테고리', icon: 'category' },
    { id: 'currency', label: '통화', icon: 'attach-money' },
    { id: 'destination', label: '방문지', icon: 'place' },
  ];

  // 초기 로딩 중일 때 Skeleton 표시
  if (isLoading && trips.length === 0) {
    return <StatsScreenSkeleton />;
  }

  if (!activeTrip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="pie-chart"
          title="여행을 선택해주세요"
          description="여행을 선택하면 통계를 볼 수 있어요"
        />
      </View>
    );
  }

  if (!stats || stats.totalKRW === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <EmptyState
          icon="insert-chart"
          title="지출 내역이 없어요"
          description="지출을 기록하면 통계를 볼 수 있어요"
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.base }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 통화 토글 (FR-007 글로벌 연동) */}
      <View style={styles.toggleRow}>
        <CurrencyToggle />
        {hasMultipleCurrencies && (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            {getCurrencyFlag(mainCurrency)} 외 {Object.keys(stats.byCurrency).length - 1}개 통화
          </Text>
        )}
      </View>

      {/* 총 지출 카드 */}
      <Card style={[styles.totalCard, { marginTop: spacing.md }]}>
        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          {activeTrip.name} 총 지출
        </Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          {showInKRW || hasMultipleCurrencies
            ? formatKRW(stats.totalKRW)
            : formatCurrency(stats.byCurrency[mainCurrency]?.amount || 0, mainCurrency)}
        </Text>
        {!showInKRW && !hasMultipleCurrencies && (
          <Text style={[typography.caption, { color: colors.textSecondary }]}>
            = {formatKRW(stats.totalKRW)}
          </Text>
        )}

        {/* 예산 진행률 */}
        {activeTrip.budget && (
          <View style={[styles.budgetSection, { marginTop: spacing.md }]}>
            <ProgressBar
              progress={Math.min(stats.totalKRW / activeTrip.budget, 1)}
              color={stats.totalKRW > activeTrip.budget ? colors.error : colors.primary}
              height={8}
            />
            <View style={styles.budgetLabels}>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                예산 {formatKRW(activeTrip.budget)}
              </Text>
              <Text
                style={[
                  typography.labelSmall,
                  { color: stats.totalKRW > activeTrip.budget ? colors.error : colors.primary },
                ]}
              >
                {Math.round((stats.totalKRW / activeTrip.budget) * 100)}%
              </Text>
            </View>
          </View>
        )}
      </Card>

      {/* 요약 카드들 */}
      <View style={[styles.summaryGrid, { marginTop: spacing.md }]}>
        <Card style={styles.summaryCard}>
          <MaterialIcons name="today" size={24} color={colors.secondary} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            일 평균
          </Text>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {showInKRW || hasMultipleCurrencies
              ? formatKRW(dailyAverage.krw)
              : formatCurrency(dailyAverage.local, mainCurrency)}
          </Text>
        </Card>

        <Card style={styles.summaryCard}>
          <MaterialIcons name="receipt-long" size={24} color={colors.accent} />
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
            지출 건수
          </Text>
          <Text style={[typography.titleMedium, { color: colors.text }]}>
            {expenses.length}건
          </Text>
        </Card>

        {topCategory && (
          <Card style={styles.summaryCard}>
            <CategoryIcon category={topCategory.id} size="small" />
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              최다 지출
            </Text>
            <Text style={[typography.titleMedium, { color: colors.text }]}>
              {topCategory.label}
            </Text>
          </Card>
        )}

        {topDay && (
          <Card style={styles.summaryCard}>
            <MaterialIcons name="trending-up" size={24} color={colors.error} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginTop: spacing.xs }]}>
              최대 지출일
            </Text>
            <Text style={[typography.titleMedium, { color: colors.text }]}>
              {formatDisplayDate(topDay.date)}
            </Text>
          </Card>
        )}
      </View>

      {/* 탭 */}
      <View style={[styles.tabContainer, { marginTop: spacing.lg, backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab.id}
            style={[
              styles.tab,
              activeTab === tab.id && {
                backgroundColor: colors.primary,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => setActiveTab(tab.id)}
          >
            <MaterialIcons
              name={tab.icon as keyof typeof MaterialIcons.glyphMap}
              size={18}
              color={activeTab === tab.id ? '#FFFFFF' : colors.textSecondary}
            />
            <Text
              style={[
                typography.labelSmall,
                {
                  color: activeTab === tab.id ? '#FFFFFF' : colors.textSecondary,
                  marginLeft: 4,
                },
              ]}
            >
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 카테고리별 */}
      {activeTab === 'category' && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md }]}>
            카테고리별 지출
          </Text>
          {sortedCategories.map((category, index) => (
            <View
              key={category.id}
              style={[
                styles.detailRow,
                index < sortedCategories.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={styles.detailLeft}>
                <CategoryIcon category={category.id} size="small" />
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>
                    {category.label}
                  </Text>
                  <ProgressBar
                    progress={category.amountKRW / stats.totalKRW}
                    color={isDark ? category.darkColor : category.lightColor}
                    height={4}
                    style={{ width: 100, marginTop: 4 }}
                  />
                </View>
              </View>
              <View style={styles.detailRight}>
                <Text style={[typography.titleSmall, { color: colors.text }]}>
                  {showInKRW || hasMultipleCurrencies
                    ? formatKRW(category.amountKRW)
                    : formatCurrency(category.localAmount, mainCurrency)}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {category.percentage}%
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* 통화별 */}
      {activeTab === 'currency' && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md }]}>
            통화별 지출
          </Text>
          {sortedCurrencies.map((item, index) => (
            <View
              key={item.currency}
              style={[
                styles.detailRow,
                index < sortedCurrencies.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
              ]}
            >
              <View style={styles.detailLeft}>
                <Text style={styles.currencyFlag}>{getCurrencyFlag(item.currency)}</Text>
                <View style={{ marginLeft: spacing.sm }}>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>
                    {item.currency}
                  </Text>
                  <Text style={[typography.titleSmall, { color: colors.primary }]}>
                    {formatCurrency(item.amount, item.currency)}
                  </Text>
                </View>
              </View>
              <View style={styles.detailRight}>
                <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                  = {formatKRW(item.amountKRW)}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {Math.round((item.amountKRW / stats.totalKRW) * 100)}%
                </Text>
              </View>
            </View>
          ))}
        </Card>
      )}

      {/* 방문지별 */}
      {activeTab === 'destination' && (
        <Card style={{ marginTop: spacing.md }}>
          <Text style={[typography.titleSmall, { color: colors.text, marginBottom: spacing.md }]}>
            방문지별 지출
          </Text>
          {sortedDestinations.length === 0 ? (
            <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', padding: spacing.lg }]}>
              방문지별 지출 데이터가 없습니다
            </Text>
          ) : (
            sortedDestinations.map((item, index) => (
              <View
                key={item.destination?.id}
                style={[
                  styles.detailRow,
                  index < sortedDestinations.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
              >
                <View style={styles.detailLeft}>
                  <Text style={styles.currencyFlag}>
                    {item.destination ? getCountryFlag(item.destination.country) : '🌍'}
                  </Text>
                  <View style={{ marginLeft: spacing.sm }}>
                    <Text style={[typography.bodyMedium, { color: colors.text }]}>
                      {item.destination?.countryName || item.destination?.country}
                    </Text>
                    <Text style={[typography.titleSmall, { color: colors.primary }]}>
                      {formatCurrency(item.localAmount, item.destination?.currency || 'USD')}
                    </Text>
                  </View>
                </View>
                <View style={styles.detailRight}>
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
                    = {formatKRW(item.amountKRW)}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {Math.round((item.amountKRW / stats.totalKRW) * 100)}%
                  </Text>
                </View>
              </View>
            ))
          )}
        </Card>
      )}

      {/* 하단 여백 */}
      <View style={{ height: 100 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  totalCard: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
    marginTop: 4,
  },
  budgetSection: {
    width: '100%',
  },
  budgetLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  summaryCard: {
    width: '47%',
    alignItems: 'center',
    paddingVertical: 16,
  },
  tabContainer: {
    flexDirection: 'row',
    padding: 4,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  detailLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  detailRight: {
    alignItems: 'flex-end',
  },
  currencyFlag: {
    fontSize: 28,
  },
});
