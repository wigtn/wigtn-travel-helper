// Main Screen Revamp - 여행 카드 컴포넌트
// PRD FR-106, FR-107, FR-108: 여행 리스트 카드 + 강조 표시

import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Trip, TripStatus, Destination } from '../../lib/types';
import { useTheme } from '../../lib/theme';
import { formatDisplayDate, getDaysBetween } from '../../lib/utils/date';
import { getCountryFlag } from '../../lib/utils/constants';

interface TripCardProps {
  trip: Trip;
  destinations: Destination[];
  status: TripStatus;
  onPress: () => void;
}

// D-Day 또는 Day N 계산
function getTripDayInfo(trip: Trip, status: TripStatus): string {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (status === 'upcoming') {
    const startDate = new Date(trip.startDate);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = startDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `D-${diffDays}`;
  }

  if (status === 'active') {
    const startDate = new Date(trip.startDate);
    startDate.setHours(0, 0, 0, 0);
    const diffTime = today.getTime() - startDate.getTime();
    const dayIndex = Math.floor(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return `Day ${dayIndex} 진행 중`;
  }

  return '완료';
}

export function TripCard({ trip, destinations, status, onPress }: TripCardProps) {
  const { colors, spacing, typography, borderRadius } = useTheme();

  // 여행의 목적지 국기들
  const flags = destinations
    .filter((d) => d.tripId === trip.id)
    .map((d) => getCountryFlag(d.country))
    .filter(Boolean)
    .slice(0, 4) // 최대 4개
    .join('');

  const dayInfo = getTripDayInfo(trip, status);
  const tripDays = getDaysBetween(trip.startDate, trip.endDate);

  const isActive = status === 'active';

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.7}
      style={[
        styles.container,
        {
          backgroundColor: colors.surface,
          borderRadius: borderRadius.lg,
          borderColor: isActive ? colors.primary : colors.border,
          borderWidth: isActive ? 2 : 1,
        },
      ]}
    >
      <View style={styles.content}>
        {/* 국기 아이콘 */}
        <Text style={styles.flags}>{flags || '✈️'}</Text>

        {/* 여행 정보 */}
        <View style={styles.info}>
          <Text
            style={[typography.titleSmall, { color: colors.text }]}
            numberOfLines={1}
          >
            {trip.name}
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
            {formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)} · {tripDays}일
          </Text>
        </View>

        {/* 상태 배지 */}
        <View style={styles.rightSection}>
          <Text
            style={[
              typography.labelSmall,
              {
                color: isActive ? colors.primary : colors.textTertiary,
                fontWeight: isActive ? '600' : '400',
              },
            ]}
          >
            {dayInfo}
          </Text>
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={colors.textTertiary}
          />
        </View>
      </View>

      {/* Active 배지 */}
      {isActive && (
        <View
          style={[
            styles.activeBadge,
            { backgroundColor: colors.primary },
          ]}
        >
          <Text style={[typography.labelSmall, { color: 'white', fontSize: 10 }]}>
            NOW
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    marginBottom: 8,
    position: 'relative',
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flags: {
    fontSize: 28,
    minWidth: 40,
  },
  info: {
    flex: 1,
    gap: 2,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeBadge: {
    position: 'absolute',
    top: 8,
    right: -20,
    paddingHorizontal: 24,
    paddingVertical: 2,
    transform: [{ rotate: '45deg' }],
  },
});

export default TripCard;
