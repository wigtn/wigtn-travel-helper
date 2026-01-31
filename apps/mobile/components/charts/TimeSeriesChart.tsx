// Travel Helper v1.1 - Time Series Chart Component
// 일별 지출 추이를 라인 차트로 표시

import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { LineChart } from 'react-native-chart-kit';
import { useTheme } from '../../lib/theme';
import { formatKRW } from '../../lib/utils/currency';

interface TimeSeriesData {
  date: string; // YYYY-MM-DD
  amount: number; // Amount in display currency
}

interface TimeSeriesChartProps {
  data: TimeSeriesData[];
  height?: number;
}

const { width: screenWidth } = Dimensions.get('window');

export function TimeSeriesChart({ data, height = 200 }: TimeSeriesChartProps) {
  const { colors, isDark, spacing, typography } = useTheme();

  // 빈 데이터일 경우
  if (data.length === 0) {
    return null;
  }

  // 차트에 표시할 데이터 가공
  const chartData = React.useMemo(() => {
    // 날짜 정렬
    const sorted = [...data].sort((a, b) => a.date.localeCompare(b.date));

    // 최대 7일까지만 표시 (더 많으면 마지막 7일)
    const displayData = sorted.length > 7 ? sorted.slice(-7) : sorted;

    // 레이블 (MM/DD 형식)
    const labels = displayData.map((item) => {
      const parts = item.date.split('-');
      return `${parseInt(parts[1])}/${parseInt(parts[2])}`;
    });

    // 금액 데이터
    const amounts = displayData.map((item) => item.amount);

    return { labels, amounts };
  }, [data]);

  // 데이터가 1개뿐이면 차트가 이상하게 보이므로 처리
  if (chartData.amounts.length < 2) {
    return (
      <View style={[styles.singleDataContainer, { padding: spacing.md }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center' }]}>
          데이터가 더 많아지면 지출 추이를 확인할 수 있어요
        </Text>
      </View>
    );
  }

  // 차트 너비 계산 (카드 패딩 고려)
  const chartWidth = screenWidth - 32 - 32; // 화면 - 좌우 마진 - 카드 패딩

  return (
    <View style={styles.container}>
      <LineChart
        data={{
          labels: chartData.labels,
          datasets: [
            {
              data: chartData.amounts,
              color: (opacity = 1) => colors.primary,
              strokeWidth: 2,
            },
          ],
        }}
        width={chartWidth}
        height={height}
        yAxisLabel=""
        yAxisSuffix=""
        yAxisInterval={1}
        formatYLabel={(value) => {
          const num = parseInt(value);
          if (num >= 1000000) {
            return `${(num / 1000000).toFixed(1)}M`;
          }
          if (num >= 1000) {
            return `${Math.round(num / 1000)}K`;
          }
          return value;
        }}
        chartConfig={{
          backgroundColor: colors.surface,
          backgroundGradientFrom: colors.surface,
          backgroundGradientTo: colors.surface,
          decimalPlaces: 0,
          color: (opacity = 1) => colors.primary,
          labelColor: (opacity = 1) => colors.textSecondary,
          style: {
            borderRadius: 16,
          },
          propsForDots: {
            r: '4',
            strokeWidth: '2',
            stroke: colors.primary,
            fill: isDark ? colors.surface : '#FFFFFF',
          },
          propsForBackgroundLines: {
            stroke: colors.border,
            strokeDasharray: '4, 4',
          },
          propsForLabels: {
            fontSize: 11,
          },
        }}
        bezier
        style={styles.chart}
        withInnerLines={true}
        withOuterLines={false}
        withVerticalLines={false}
        withHorizontalLines={true}
        withVerticalLabels={true}
        withHorizontalLabels={true}
        segments={4}
        fromZero={true}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginHorizontal: -16, // 카드 패딩 상쇄
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  singleDataContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
});
