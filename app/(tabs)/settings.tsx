import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { Card } from '../../components/ui/Card';

export default function SettingsScreen() {
  const { colors, isDark } = useTheme();
  const { trips, activeTrip } = useTripStore();
  const { lastUpdated, loadRates } = useExchangeRateStore();

  const handleRefreshRates = async () => {
    await loadRates();
    Alert.alert('완료', '환율이 업데이트되었습니다');
  };

  const formatLastUpdated = () => {
    if (!lastUpdated) return '없음';
    const date = new Date(lastUpdated);
    return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      {/* 여행 관리 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>여행 관리</Text>
      <Card style={styles.card}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/trip/new')}
        >
          <View style={styles.menuLeft}>
            <MaterialIcons name="add" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>새 여행 만들기</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>

        {trips.length > 0 && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[styles.subTitle, { color: colors.textSecondary }]}>여행 목록</Text>
            {trips.map((trip) => (
              <TouchableOpacity
                key={trip.id}
                style={styles.tripItem}
                onPress={() => router.push(`/trip/${trip.id}`)}
              >
                <View style={styles.tripInfo}>
                  <Text style={[styles.tripName, { color: colors.text }]}>
                    {trip.name}
                  </Text>
                  <Text style={[styles.tripDates, { color: colors.textSecondary }]}>
                    {trip.startDate} ~ {trip.endDate}
                  </Text>
                </View>
                {activeTrip?.id === trip.id && (
                  <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                    <Text style={styles.activeBadgeText}>활성</Text>
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </>
        )}
      </Card>

      {/* 환율 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>환율</Text>
      <Card style={styles.card}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <MaterialIcons name="currency-exchange" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.menuText, { color: colors.text }]}>환율 정보</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                마지막 업데이트: {formatLastUpdated()}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.menuItem} onPress={handleRefreshRates}>
          <View style={styles.menuLeft}>
            <MaterialIcons name="refresh" size={24} color={colors.primary} />
            <Text style={[styles.menuText, { color: colors.text }]}>환율 새로고침</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </Card>

      {/* 앱 정보 */}
      <Text style={[styles.sectionTitle, { color: colors.text }]}>앱 정보</Text>
      <Card style={styles.card}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <MaterialIcons name="info" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.menuText, { color: colors.text }]}>버전</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>1.0.0</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <MaterialIcons name="palette" size={24} color={colors.primary} />
            <View>
              <Text style={[styles.menuText, { color: colors.text }]}>테마</Text>
              <Text style={[styles.menuSubtext, { color: colors.textSecondary }]}>
                {isDark ? '다크 모드' : '라이트 모드'} (시스템 설정)
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* 도움말 */}
      <Card style={StyleSheet.flatten([styles.helpCard, { backgroundColor: colors.surface }])}>
        <MaterialIcons name="lightbulb" size={24} color={colors.warning} />
        <Text style={[styles.helpText, { color: colors.textSecondary }]}>
          환율은 하루에 한 번 자동으로 업데이트됩니다.{'\n'}
          오프라인에서도 캐시된 환율로 사용할 수 있어요.
        </Text>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
    marginLeft: 4,
  },
  card: {
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  menuLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuText: {
    fontSize: 16,
  },
  menuSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginLeft: 52,
  },
  subTitle: {
    fontSize: 12,
    marginLeft: 16,
    marginTop: 8,
    marginBottom: 4,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 52,
  },
  tripInfo: {
    flex: 1,
  },
  tripName: {
    fontSize: 16,
  },
  tripDates: {
    fontSize: 12,
    marginTop: 2,
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 24,
  },
  helpText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
});
