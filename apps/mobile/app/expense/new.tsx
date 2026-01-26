// Travel Helper v1.1 - New Expense Screen
// PRD v1.1: 지갑/결제수단 기능 제거, 단순화된 지출 기록

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Button, Card, BottomSheet, CategoryIcon } from '../../components/ui';
import { CATEGORIES, Category } from '../../lib/utils/constants';
import { formatKRW, getCurrencySymbol, getCurrencyFlag } from '../../lib/utils/currency';
import { formatDate, formatFullDate, formatTime } from '../../lib/utils/date';
import { Trip, Destination } from '../../lib/types';

export default function NewExpenseScreen() {
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();
  const { activeTrip, activeTrips, destinations, setActiveTrip, loadDestinations } = useTripStore();
  const createExpense = useExpenseStore((state) => state.createExpense);
  const { getRate, convert } = useExchangeRateStore();
  const { hapticEnabled } = useSettingsStore();

  // 여행 & 방문지 선택
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [selectedDestination, setSelectedDestination] = useState<Destination | null>(null);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);

  // 입력 값들
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());

  // Picker 상태
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showCategorySheet, setShowCategorySheet] = useState(false);

  const [loading, setLoading] = useState(false);

  // 햅틱 피드백 헬퍼
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (hapticEnabled) {
      Haptics.impactAsync(style);
    }
  };

  // 초기화
  useEffect(() => {
    if (activeTrips.length > 1 && !selectedTrip) {
      setShowTripSelector(true);
    } else if (activeTrips.length === 1) {
      handleTripSelect(activeTrips[0]);
    } else if (activeTrip && !selectedTrip) {
      handleTripSelect(activeTrip);
    }
  }, [activeTrips, activeTrip]);

  // 여행 선택 시 방문지 로드
  const handleTripSelect = async (trip: Trip) => {
    setSelectedTrip(trip);
    setActiveTrip(trip);
    setShowTripSelector(false);
    triggerHaptic();

    await loadDestinations(trip.id);
  };

  // destinations가 로드되면 첫 번째 방문지 선택
  useEffect(() => {
    if (destinations.length > 0 && !selectedDestination) {
      setSelectedDestination(destinations[0]);
    }
  }, [destinations]);

  // 통화 관련 계산
  const currency = selectedDestination?.currency || 'USD';
  const currencySymbol = getCurrencySymbol(currency);
  const currencyFlag = getCurrencyFlag(currency);
  const exchangeRate = getRate(currency);
  const amountKRW = amount ? convert(parseFloat(amount), currency) : 0;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handleCategorySelect = (cat: Category) => {
    triggerHaptic();
    setCategory(cat);
    setShowCategorySheet(false);
  };

  const handleDestinationSelect = (dest: Destination) => {
    setSelectedDestination(dest);
    setShowDestinationSelector(false);
    triggerHaptic();
  };

  const handleSubmit = async () => {
    if (!selectedTrip) {
      Alert.alert('알림', '여행을 선택해주세요');
      return;
    }
    if (!selectedDestination) {
      Alert.alert('알림', '방문지를 선택해주세요');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('알림', '금액을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      await createExpense({
        tripId: selectedTrip.id,
        destinationId: selectedDestination.id,
        amount: parseFloat(amount),
        currency,
        amountKRW,
        exchangeRate,
        category,
        memo: memo.trim() || undefined,
        date: formatDate(date),
        time: formatTime(time),
      });
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '지출 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  // 카테고리 정보
  const getCategoryInfo = () => {
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  };

  if (activeTrips.length === 0) {
    return (
      <View style={[styles.emptyContainer, { backgroundColor: colors.background }]}>
        <MaterialIcons name="flight" size={64} color={colors.textTertiary} />
        <Text style={[typography.titleMedium, { color: colors.text, marginTop: spacing.md }]}>
          진행 중인 여행이 없습니다
        </Text>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          먼저 여행을 만들어주세요
        </Text>
        <Button
          title="여행 만들기"
          onPress={() => {
            router.back();
            router.push('/trip/new');
          }}
          style={{ marginTop: spacing.lg }}
        />
      </View>
    );
  }

  return (
    <>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ backgroundColor: colors.background }}
          contentContainerStyle={[styles.content, { padding: spacing.base }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* 방문지 선택 */}
          {selectedDestination && (
            <TouchableOpacity
              style={[
                styles.destinationSelector,
                { backgroundColor: colors.surface, borderRadius: borderRadius.lg },
                shadows.sm,
              ]}
              onPress={() => destinations.length > 1 && setShowDestinationSelector(true)}
              disabled={destinations.length <= 1}
            >
              <Text style={styles.destinationFlag}>{currencyFlag}</Text>
              <View style={styles.destinationInfo}>
                <Text style={[typography.titleSmall, { color: colors.text }]}>
                  {selectedDestination.city
                    ? `${selectedDestination.country} · ${selectedDestination.city}`
                    : selectedDestination.country}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {currency} 사용
                </Text>
              </View>
              {destinations.length > 1 && (
                <MaterialIcons name="expand-more" size={24} color={colors.textSecondary} />
              )}
            </TouchableOpacity>
          )}

          {/* 금액 입력 */}
          <Card style={[styles.amountCard, { marginTop: spacing.md }]}>
            <View style={styles.amountInputRow}>
              <Text style={[styles.currencySymbol, { color: colors.textSecondary }]}>
                {currencySymbol}
              </Text>
              <TextInput
                style={[styles.amountInput, { color: colors.text }]}
                value={amount}
                onChangeText={handleAmountChange}
                placeholder="0"
                placeholderTextColor={colors.textTertiary}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
            <View style={[styles.krwRow, { borderTopColor: colors.border }]}>
              <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                원화 환산
              </Text>
              <Text style={[typography.titleSmall, { color: colors.primary }]}>
                {formatKRW(amountKRW)}
              </Text>
            </View>
          </Card>

          {/* 카테고리 선택 */}
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.selector,
                { backgroundColor: colors.surface, borderRadius: borderRadius.md, flex: 1 },
              ]}
              onPress={() => setShowCategorySheet(true)}
            >
              <CategoryIcon category={category} size="small" />
              <Text style={[typography.labelMedium, { color: colors.text, marginLeft: spacing.sm }]}>
                {getCategoryInfo().label}
              </Text>
              <MaterialIcons name="expand-more" size={20} color={colors.textSecondary} style={styles.selectorIcon} />
            </TouchableOpacity>
          </View>

          {/* 날짜 & 시간 */}
          <View style={[styles.row, { marginTop: spacing.md }]}>
            <TouchableOpacity
              style={[
                styles.selector,
                { backgroundColor: colors.surface, borderRadius: borderRadius.md },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              <MaterialIcons name="calendar-today" size={20} color={colors.textSecondary} />
              <Text style={[typography.labelMedium, { color: colors.text, marginLeft: spacing.sm }]}>
                {formatFullDate(date)}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.selector,
                { backgroundColor: colors.surface, borderRadius: borderRadius.md },
              ]}
              onPress={() => setShowTimePicker(true)}
            >
              <MaterialIcons name="access-time" size={20} color={colors.textSecondary} />
              <Text style={[typography.labelMedium, { color: colors.text, marginLeft: spacing.sm }]}>
                {formatTime(time)}
              </Text>
            </TouchableOpacity>
          </View>

          {/* 메모 */}
          <Text style={[typography.labelMedium, { color: colors.text, marginTop: spacing.lg, marginBottom: spacing.sm }]}>
            메모 (선택)
          </Text>
          <TextInput
            style={[
              styles.memoInput,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                color: colors.text,
                borderRadius: borderRadius.md,
              },
            ]}
            value={memo}
            onChangeText={setMemo}
            placeholder="어디서 뭘 샀는지..."
            placeholderTextColor={colors.textTertiary}
            multiline
          />

          {/* 저장 버튼 */}
          <Button
            title="저장하기"
            onPress={handleSubmit}
            loading={loading}
            disabled={!amount || parseFloat(amount) <= 0}
            fullWidth
            style={{ marginTop: spacing.xl }}
          />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') setShowDatePicker(false);
            if (selectedDate) {
              setDate(selectedDate);
              if (Platform.OS === 'ios') setShowDatePicker(false);
            }
          }}
        />
      )}

      {/* Time Picker */}
      {showTimePicker && (
        <DateTimePicker
          value={time}
          mode="time"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedTime) => {
            if (Platform.OS === 'android') setShowTimePicker(false);
            if (selectedTime) {
              setTime(selectedTime);
              if (Platform.OS === 'ios') setShowTimePicker(false);
            }
          }}
        />
      )}

      {/* 여행 선택 모달 */}
      <BottomSheet
        visible={showTripSelector}
        onClose={() => selectedTrip && setShowTripSelector(false)}
        title="어떤 여행에 기록할까요?"
      >
        {activeTrips.map((trip) => (
          <TouchableOpacity
            key={trip.id}
            style={[
              styles.optionItem,
              {
                backgroundColor: selectedTrip?.id === trip.id ? colors.primaryLight : colors.surface,
                borderColor: selectedTrip?.id === trip.id ? colors.primary : colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => handleTripSelect(trip)}
          >
            <Text style={[typography.titleSmall, { color: colors.text }]}>
              {trip.name}
            </Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {trip.startDate} ~ {trip.endDate}
            </Text>
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* 방문지 선택 모달 */}
      <BottomSheet
        visible={showDestinationSelector}
        onClose={() => setShowDestinationSelector(false)}
        title="어디서 사용했나요?"
      >
        {destinations.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            style={[
              styles.optionItem,
              {
                backgroundColor: selectedDestination?.id === dest.id ? colors.primaryLight : colors.surface,
                borderColor: selectedDestination?.id === dest.id ? colors.primary : colors.border,
                borderRadius: borderRadius.md,
              },
            ]}
            onPress={() => handleDestinationSelect(dest)}
          >
            <View style={styles.optionItemRow}>
              <Text style={styles.optionFlag}>{getCurrencyFlag(dest.currency)}</Text>
              <View>
                <Text style={[typography.titleSmall, { color: colors.text }]}>
                  {dest.city ? `${dest.country} · ${dest.city}` : dest.country}
                </Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {dest.currency}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </BottomSheet>

      {/* 카테고리 선택 모달 */}
      <BottomSheet
        visible={showCategorySheet}
        onClose={() => setShowCategorySheet(false)}
        title="카테고리"
      >
        <View style={styles.categoryGrid}>
          {CATEGORIES.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={[
                styles.categoryItem,
                {
                  backgroundColor: category === cat.id ? colors.primaryLight : colors.surface,
                  borderColor: category === cat.id ? colors.primary : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => handleCategorySelect(cat.id)}
            >
              <CategoryIcon category={cat.id} size="medium" />
              <Text
                style={[
                  typography.labelSmall,
                  {
                    color: category === cat.id ? colors.primary : colors.text,
                    marginTop: spacing.xs,
                  },
                ]}
              >
                {cat.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  destinationSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  destinationFlag: {
    fontSize: 32,
    marginRight: 12,
  },
  destinationInfo: {
    flex: 1,
  },
  amountCard: {
    padding: 0,
    overflow: 'hidden',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '300',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 44,
    fontWeight: '700',
    padding: 0,
    height: 56,
    lineHeight: 52,
    textAlignVertical: 'center',
  },
  krwRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  selector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  selectorIcon: {
    marginLeft: 'auto',
  },
  memoInput: {
    minHeight: 80,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  optionItem: {
    padding: 16,
    borderWidth: 1,
    marginBottom: 8,
  },
  optionItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
  },
  categoryItem: {
    width: '30%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    padding: 8,
  },
});
