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
} from 'react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CATEGORIES, Category } from '../../lib/utils/constants';
import { formatKRW, getCurrencySymbol, getCurrencyFlag } from '../../lib/utils/currency';
import { formatDate, formatFullDate, getToday } from '../../lib/utils/date';

export default function NewExpenseScreen() {
  const { colors } = useTheme();
  const activeTrip = useTripStore((state) => state.activeTrip);
  const createExpense = useExpenseStore((state) => state.createExpense);
  const { getRate, convert } = useExchangeRateStore();

  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const currencySymbol = activeTrip ? getCurrencySymbol(activeTrip.currency) : '';
  const currencyFlag = activeTrip ? getCurrencyFlag(activeTrip.currency) : '';
  const exchangeRate = activeTrip ? getRate(activeTrip.currency) : 1;
  const amountKRW = amount ? convert(parseFloat(amount), activeTrip?.currency || 'USD') : 0;

  const handleAmountChange = (text: string) => {
    // 숫자와 소수점만 허용
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handleCategorySelect = (cat: Category) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(cat);
  };

  const handleSubmit = async () => {
    if (!activeTrip) {
      Alert.alert('알림', '활성화된 여행이 없습니다');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('알림', '금액을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      await createExpense({
        tripId: activeTrip.id,
        amount: parseFloat(amount),
        currency: activeTrip.currency,
        amountKRW,
        exchangeRate,
        category,
        memo: memo.trim() || undefined,
        date: formatDate(date),
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
    } catch (error) {
      console.log(error);
      
      Alert.alert('오류', '지출 저장에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  if (!activeTrip) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
          먼저 여행을 선택해주세요
        </Text>
        <Button
          title="여행 만들기"
          onPress={() => {
            router.back();
            router.push('/trip/new');
          }}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 여행 정보 */}
      <View style={styles.tripInfo}>
        <Text style={styles.tripFlag}>{currencyFlag}</Text>
        <Text style={[styles.tripName, { color: colors.text }]}>
          {activeTrip.name}
        </Text>
      </View>

      {/* 금액 입력 */}
      <Card style={styles.amountCard}>
        <View style={styles.amountInputRow}>
          <Text style={[styles.currencySymbol, { color: colors.text }]}>
            {currencySymbol}
          </Text>
          <TextInput
            style={[styles.amountInput, { color: colors.text }]}
            value={amount}
            onChangeText={handleAmountChange}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="decimal-pad"
            autoFocus
          />
        </View>
        <View style={[styles.krwRow, { borderTopColor: colors.border }]}>
          <Text style={[styles.krwLabel, { color: colors.textSecondary }]}>
            원화 환산
          </Text>
          <Text style={[styles.krwValue, { color: colors.primary }]}>
            {formatKRW(amountKRW)}
          </Text>
        </View>
      </Card>

      {/* 카테고리 선택 */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>카테고리</Text>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[
              styles.categoryItem,
              {
                backgroundColor: category === cat.id ? cat.color : colors.surface,
                borderColor: category === cat.id ? cat.color : colors.border,
              },
            ]}
            onPress={() => handleCategorySelect(cat.id)}
          >
            <Text
              style={[
                styles.categoryLabel,
                { color: category === cat.id ? '#FFFFFF' : colors.text },
              ]}
            >
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* 날짜 선택 */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>날짜</Text>
      <TouchableOpacity
        style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
        onPress={() => setShowDatePicker(true)}
      >
        <Text style={[styles.dateText, { color: colors.text }]}>
          {formatFullDate(date)}
        </Text>
      </TouchableOpacity>

      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, selectedDate) => {
            if (Platform.OS === 'android') {
              setShowDatePicker(false);
            }
            if (selectedDate) {
              setDate(selectedDate);
              setShowDatePicker(false);
            }
          }}
        />
      )}

      {/* 메모 */}
      <Text style={[styles.sectionLabel, { color: colors.text }]}>메모 (선택)</Text>
      <TextInput
        style={[
          styles.memoInput,
          { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text },
        ]}
        value={memo}
        onChangeText={setMemo}
        placeholder="어디서 뭘 샀는지..."
        placeholderTextColor={colors.textSecondary}
        multiline
      />

      {/* 저장 버튼 */}
      <Button
        title="저장하기"
        onPress={handleSubmit}
        loading={loading}
        disabled={!amount || parseFloat(amount) <= 0}
        size="large"
        style={styles.submitButton}
      />
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
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
  tripInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  tripFlag: {
    fontSize: 32,
    marginRight: 8,
  },
  tripName: {
    fontSize: 18,
    fontWeight: '600',
  },
  amountCard: {
    marginBottom: 24,
    padding: 0,
    overflow: 'hidden',
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  currencySymbol: {
    fontSize: 32,
    fontWeight: '300',
    marginRight: 8,
  },
  amountInput: {
    flex: 1,
    fontSize: 48,
    fontWeight: '700',
    padding: 0,
  },
  krwRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderTopWidth: 1,
  },
  krwLabel: {
    fontSize: 14,
  },
  krwValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  categoryItem: {
    width: '31%',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  dateButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  dateText: {
    fontSize: 16,
  },
  memoInput: {
    minHeight: 80,
    borderRadius: 12,
    borderWidth: 1,
    padding: 12,
    fontSize: 16,
    textAlignVertical: 'top',
    marginBottom: 24,
  },
  submitButton: {
    marginTop: 8,
  },
});
