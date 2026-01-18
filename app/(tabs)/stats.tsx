import { useEffect, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, Dimensions } from 'react-native';
import { PieChart } from 'react-native-chart-kit';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { Card } from '../../components/ui/Card';
import { formatKRW } from '../../lib/utils/currency';
import { CATEGORIES, Category } from '../../lib/utils/constants';
import { getDaysBetween } from '../../lib/utils/date';

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const { colors, isDark } = useTheme();
  const activeTrip = useTripStore((state) => state.activeTrip);
  const { expenses, loadExpenses, getStats } = useExpenseStore();

  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
    }
  }, [activeTrip]);

  const stats = activeTrip ? getStats(activeTrip.id) : null;

  // 파이차트 데이터
  const pieData = useMemo(() => {
    if (!stats) return [];
    return CATEGORIES.filter((cat) => stats.byCategory[cat.id] > 0).map((cat) => ({
      name: cat.label,
      amount: stats.byCategory[cat.id],
      color: cat.color,
      legendFontColor: colors.text,
      legendFontSize: 12,
    }));
  }, [stats, colors.text]);

  // 일별 평균
  const dailyAverage = useMemo(() => {
    if (!activeTrip || !stats) return 0;
    const days = getDaysBetween(activeTrip.startDate, activeTrip.endDate);
    return Math.round(stats.totalKRW / days);
  }, [activeTrip, stats]);

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

  if (!activeTrip) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="pie-chart" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          여행을 선택하면{'\n'}통계를 볼 수 있어요
        </Text>
      </View>
    );
  }

  if (!stats || stats.totalKRW === 0) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="insert-chart" size={64} color={colors.textSecondary} />
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          지출을 기록하면{'\n'}통계를 볼 수 있어요
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* 총 지출 */}
      <Card style={styles.totalCard}>
        <Text style={[styles.totalLabel, { color: colors.textSecondary }]}>
          {activeTrip.name} 총 지출
        </Text>
        <Text style={[styles.totalValue, { color: colors.text }]}>
          {formatKRW(stats.totalKRW)}
        </Text>
        {activeTrip.budget && (
          <View style={styles.budgetRow}>
            <View
              style={[
                styles.budgetBar,
                { backgroundColor: colors.border },
              ]}
            >
              <View
                style={[
                  styles.budgetFill,
                  {
                    backgroundColor:
                      stats.totalKRW > activeTrip.budget ? colors.error : colors.primary,
                    width: `${Math.min((stats.totalKRW / activeTrip.budget) * 100, 100)}%`,
                  },
                ]}
              />
            </View>
            <Text style={[styles.budgetText, { color: colors.textSecondary }]}>
              예산 {formatKRW(activeTrip.budget)} 중{' '}
              {Math.round((stats.totalKRW / activeTrip.budget) * 100)}%
            </Text>
          </View>
        )}
      </Card>

      {/* 카테고리별 파이차트 */}
      <Card style={styles.chartCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          카테고리별 지출
        </Text>
        {pieData.length > 0 && (
          <PieChart
            data={pieData}
            width={screenWidth - 64}
            height={200}
            chartConfig={{
              color: () => colors.text,
              labelColor: () => colors.text,
            }}
            accessor="amount"
            backgroundColor="transparent"
            paddingLeft="0"
            absolute
          />
        )}
      </Card>

      {/* 통계 카드들 */}
      <View style={styles.statsGrid}>
        <Card style={styles.statCard}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            일 평균
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatKRW(dailyAverage)}
          </Text>
        </Card>

        <Card style={styles.statCard}>
          <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
            지출 건수
          </Text>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {expenses.length}건
          </Text>
        </Card>

        {topCategory && (
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              가장 많이 쓴 곳
            </Text>
            <Text style={[styles.statValue, { color: topCategory.color }]}>
              {topCategory.label}
            </Text>
            <Text style={[styles.statSubValue, { color: colors.textSecondary }]}>
              {formatKRW(topCategory.amount)}
            </Text>
          </Card>
        )}

        {topDay && (
          <Card style={styles.statCard}>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              가장 많이 쓴 날
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {topDay.date.split('-').slice(1).join('/')}
            </Text>
            <Text style={[styles.statSubValue, { color: colors.textSecondary }]}>
              {formatKRW(topDay.amount)}
            </Text>
          </Card>
        )}
      </View>

      {/* 카테고리별 상세 */}
      <Card style={styles.detailCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          카테고리별 상세
        </Text>
        {CATEGORIES.map((category) => {
          const amount = stats.byCategory[category.id] || 0;
          if (amount === 0) return null;
          const percentage = Math.round((amount / stats.totalKRW) * 100);
          return (
            <View key={category.id} style={styles.categoryRow}>
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
          );
        })}
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  totalCard: {
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  totalValue: {
    fontSize: 36,
    fontWeight: '700',
  },
  budgetRow: {
    width: '100%',
    marginTop: 16,
  },
  budgetBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  budgetFill: {
    height: '100%',
    borderRadius: 4,
  },
  budgetText: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  chartCard: {
    marginBottom: 16,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16,
  },
  statCard: {
    width: '47%',
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
  statSubValue: {
    fontSize: 12,
    marginTop: 4,
  },
  detailCard: {
    marginBottom: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
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
});
