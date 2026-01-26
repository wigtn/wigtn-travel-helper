// Travel Helper v1.1 - Settings Screen
// PRD v1.1 기준 - 지갑 기능 제거

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Card, CurrencyToggle } from '../../components/ui';
import { formatDisplayDate } from '../../lib/utils/date';

export default function SettingsScreen() {
  const { colors, spacing, typography, isDark } = useTheme();
  const { trips, activeTrip, destinations } = useTripStore();
  const { lastUpdated, loadRates } = useExchangeRateStore();
  const { hapticEnabled, setHapticEnabled, currencyDisplayMode } = useSettingsStore();

  const handleRefreshRates = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
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
      contentContainerStyle={[styles.content, { padding: spacing.base }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 통화 표시 설정 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm }]}>
        표시 설정
      </Text>
      <Card style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <MaterialIcons name="currency-exchange" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>통화 표시</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {currencyDisplayMode === 'krw' ? '원화(KRW)' : '현지 통화'}로 표시 중
              </Text>
            </View>
          </View>
          <CurrencyToggle />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
              <MaterialIcons name="vibration" size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>햅틱 피드백</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                터치 시 진동 피드백
              </Text>
            </View>
          </View>
          <Switch
            value={hapticEnabled}
            onValueChange={setHapticEnabled}
            trackColor={{ false: colors.border, true: colors.primaryLight }}
            thumbColor={hapticEnabled ? colors.primary : colors.textTertiary}
          />
        </View>
      </Card>

      {/* 여행 관리 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        여행 관리
      </Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.menuItem}
          onPress={() => router.push('/trip/new')}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <MaterialIcons name="add" size={20} color={colors.primary} />
            </View>
            <Text style={[typography.bodyMedium, { color: colors.text }]}>새 여행 만들기</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
        </TouchableOpacity>

        {trips.length > 0 && (
          <>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <Text style={[typography.caption, { color: colors.textSecondary, marginLeft: spacing.base, marginTop: spacing.sm }]}>
              여행 목록
            </Text>
            {trips.map((trip, index) => (
              <TouchableOpacity
                key={trip.id}
                style={[
                  styles.tripItem,
                  index < trips.length - 1 && { borderBottomColor: colors.border, borderBottomWidth: 1 },
                ]}
                onPress={() => router.push(`/trip/${trip.id}`)}
              >
                <View style={styles.tripInfo}>
                  <Text style={[typography.bodyMedium, { color: colors.text }]}>
                    {trip.name}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {formatDisplayDate(trip.startDate)} - {formatDisplayDate(trip.endDate)}
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
      <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        환율
      </Text>
      <Card style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
              <MaterialIcons name="currency-exchange" size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>환율 정보</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                마지막 업데이트: {formatLastUpdated()}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity style={styles.menuItem} onPress={handleRefreshRates}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accentLight }]}>
              <MaterialIcons name="refresh" size={20} color={colors.accent} />
            </View>
            <Text style={[typography.bodyMedium, { color: colors.text }]}>환율 새로고침</Text>
          </View>
          <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
        </TouchableOpacity>
      </Card>

      {/* 앱 정보 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        앱 정보
      </Text>
      <Card style={styles.menuCard}>
        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="info" size={20} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>버전</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>1.1.0</Text>
            </View>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <View style={styles.menuItem}>
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="palette" size={20} color={colors.textSecondary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>테마</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {isDark ? '다크 모드' : '라이트 모드'} (시스템 설정)
              </Text>
            </View>
          </View>
        </View>
      </Card>

      {/* 도움말 */}
      <Card style={[styles.helpCard, { backgroundColor: colors.surface, marginTop: spacing.lg }]}>
        <MaterialIcons name="lightbulb" size={24} color={colors.warning} />
        <View style={{ flex: 1, marginLeft: spacing.sm }}>
          <Text style={[typography.bodySmall, { color: colors.text, fontWeight: '600' }]}>
            알고 계셨나요?
          </Text>
          <Text style={[typography.caption, { color: colors.textSecondary, marginTop: 4 }]}>
            환율은 하루에 한 번 자동으로 업데이트됩니다.{'\n'}
            통화 토글은 앱 전체에 적용되며, 각 화면에서도 변경할 수 있어요.
          </Text>
        </View>
      </Card>

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
  menuCard: {
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
    flex: 1,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    height: 1,
    marginLeft: 64,
  },
  tripItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingLeft: 64,
  },
  tripInfo: {
    flex: 1,
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
    padding: 16,
  },
});
