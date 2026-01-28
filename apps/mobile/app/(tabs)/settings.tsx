// Travel Helper v2.0 - Settings Screen
// 아코디언 UI 적용: 계정, 테마, 여행 목록

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { useAuthStore } from '../../lib/stores/authStore';
import { useSyncStore } from '../../lib/stores/syncStore';
import { Card, CurrencyToggle } from '../../components/ui';
import { formatDisplayDate } from '../../lib/utils/date';
import { ThemeMode } from '../../lib/types';

// Android에서 LayoutAnimation 활성화
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

export default function SettingsScreen() {
  const { colors, spacing, typography, borderRadius, isDark } = useTheme();
  const { trips, activeTrip } = useTripStore();
  const { lastUpdated, loadRates } = useExchangeRateStore();
  const { hapticEnabled, setHapticEnabled, currencyDisplayMode, themeMode, setThemeMode } = useSettingsStore();
  const { user, logout, isLoading: isAuthLoading } = useAuthStore();
  const { status: syncStatus, pendingChanges } = useSyncStore();

  // 아코디언 상태
  const [expandedSections, setExpandedSections] = useState<{
    account: boolean;
    theme: boolean;
    trips: boolean;
  }>({
    account: false,
    theme: false,
    trips: false,
  });

  const toggleSection = (section: 'account' | 'theme' | 'trips') => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRefreshRates = async () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    await loadRates();
    Alert.alert('완료', '환율이 업데이트되었습니다');
  };

  const handleLogout = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    if (pendingChanges > 0) {
      Alert.alert(
        '로그아웃',
        `동기화되지 않은 변경사항이 ${pendingChanges}개 있습니다.\n로그아웃하면 이 변경사항이 사라질 수 있습니다.\n\n정말 로그아웃하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: performLogout },
        ]
      );
    } else {
      Alert.alert(
        '로그아웃',
        '정말 로그아웃하시겠습니까?',
        [
          { text: '취소', style: 'cancel' },
          { text: '로그아웃', style: 'destructive', onPress: performLogout },
        ]
      );
    }
  };

  const performLogout = async () => {
    try {
      await logout();
      router.replace('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
      Alert.alert('오류', '로그아웃 중 오류가 발생했습니다.');
    }
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
      {/* 계정 정보 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm }]}>
        계정
      </Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('account')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <MaterialIcons name="person" size={20} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>
                {user?.name || '사용자'}
              </Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {user?.email}
              </Text>
            </View>
            {syncStatus === 'syncing' && (
              <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
            )}
            {syncStatus === 'offline' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.textTertiary, marginRight: 8 }]}>
                <Text style={styles.statusBadgeText}>오프라인</Text>
              </View>
            )}
            {pendingChanges > 0 && syncStatus !== 'syncing' && (
              <View style={[styles.statusBadge, { backgroundColor: colors.warning, marginRight: 8 }]}>
                <Text style={styles.statusBadgeText}>{pendingChanges}개 대기</Text>
              </View>
            )}
          </View>
          <MaterialIcons
            name={expandedSections.account ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {expandedSections.account && (
          <View style={[styles.accordionContent, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={styles.menuItem}
              onPress={handleLogout}
              disabled={isAuthLoading}
            >
              <View style={styles.menuLeft}>
                <View style={[styles.iconContainer, { backgroundColor: colors.error + '20' }]}>
                  <MaterialIcons name="logout" size={20} color={colors.error} />
                </View>
                <Text style={[typography.bodyMedium, { color: colors.error }]}>
                  로그아웃
                </Text>
              </View>
              {isAuthLoading ? (
                <ActivityIndicator size="small" color={colors.error} />
              ) : (
                <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
              )}
            </TouchableOpacity>
          </View>
        )}
      </Card>

      {/* 여행 관리 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        여행 관리
      </Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('trips')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight }]}>
              <MaterialIcons name="flight" size={20} color={colors.secondary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>여행 목록</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {trips.length}개의 여행
              </Text>
            </View>
          </View>
          <MaterialIcons
            name={expandedSections.trips ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {expandedSections.trips && (
          <View style={[styles.accordionContent, { borderTopColor: colors.border }]}>
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
          </View>
        )}
      </Card>

      {/* 표시 설정 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
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

        {/* <View style={[styles.divider, { backgroundColor: colors.border }]} /> */}

        {/* <View style={styles.menuItem}>
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
        </View> */}
      </Card>

      {/* 테마 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
        테마
      </Text>
      <Card style={styles.menuCard}>
        <TouchableOpacity
          style={styles.accordionHeader}
          onPress={() => toggleSection('theme')}
          activeOpacity={0.7}
        >
          <View style={styles.menuLeft}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
              <MaterialIcons name="palette" size={20} color={colors.primary} />
            </View>
            <View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>테마 모드</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>
                {themeMode === 'system' ? '시스템 설정' : themeMode === 'dark' ? '다크 모드' : '라이트 모드'}
              </Text>
            </View>
          </View>
          <MaterialIcons
            name={expandedSections.theme ? 'expand-less' : 'expand-more'}
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        {expandedSections.theme && (
          <View style={[styles.accordionContent, { borderTopColor: colors.border }]}>
            <View style={styles.themeOptions}>
              {([
                { mode: 'system' as ThemeMode, label: '시스템', icon: 'phone-iphone' },
                { mode: 'light' as ThemeMode, label: '라이트', icon: 'light-mode' },
                { mode: 'dark' as ThemeMode, label: '다크', icon: 'dark-mode' },
              ] as const).map((option) => (
                <TouchableOpacity
                  key={option.mode}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: themeMode === option.mode ? colors.primaryLight : colors.surface,
                      borderColor: themeMode === option.mode ? colors.primary : colors.border,
                      borderRadius: borderRadius.md,
                    },
                  ]}
                  onPress={() => {
                    if (hapticEnabled) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setThemeMode(option.mode);
                  }}
                >
                  <MaterialIcons
                    name={option.icon as any}
                    size={24}
                    color={themeMode === option.mode ? colors.primary : colors.textSecondary}
                  />
                  <Text
                    style={[
                      typography.labelSmall,
                      { color: themeMode === option.mode ? colors.primary : colors.text, marginTop: 4 },
                    ]}
                  >
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
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

      {/* 도움말 (환율 바로 아래) */}
      <Card style={[styles.helpCard, { backgroundColor: colors.surface, marginTop: spacing.md }]}>
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
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionContent: {
    borderTopWidth: 1,
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
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
  },
  themeOptions: {
    flexDirection: 'row',
    gap: 12,
    padding: 16,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderWidth: 1,
  },
});
