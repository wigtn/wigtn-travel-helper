// Travel Helper v1.1 - Edit Expense Screen
// PRD v1.1: 지출 수정/삭제 화면

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
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/theme';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { Button, Card, BottomSheet, CategoryIcon } from '../../components/ui';
import { CATEGORIES, Category } from '../../lib/utils/constants';
import { formatKRW, getCurrencySymbol, formatCurrency } from '../../lib/utils/currency';
import { formatDate, formatFullDate, formatTime } from '../../lib/utils/date';
import { Expense } from '../../lib/types';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { expenses, updateExpense, deleteExpense } = useExpenseStore();
  const { getRate, convert } = useExchangeRateStore();
  const { hapticEnabled, currencyDisplayMode } = useSettingsStore();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [time, setTime] = useState(new Date());
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

  useEffect(() => {
    const found = expenses.find((e) => e.id === id);
    if (found) {
      setExpense(found);
      setAmount(found.amount.toString());
      setCategory(found.category);
      setMemo(found.memo || '');
      setDate(new Date(found.date));
      // 시간이 있으면 파싱
      if (found.time) {
        const [hours, minutes] = found.time.split(':').map(Number);
        const timeDate = new Date();
        timeDate.setHours(hours, minutes, 0, 0);
        setTime(timeDate);
      }
    }
  }, [id, expenses]);

  const currencySymbol = expense ? getCurrencySymbol(expense.currency) : '';
  const exchangeRate = expense ? getRate(expense.currency) : 1;
  const amountKRW = amount ? convert(parseFloat(amount), expense?.currency || 'USD') : 0;

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, '');
    setAmount(cleaned);
  };

  const handleCategorySelect = (cat: Category) => {
    triggerHaptic();
    setCategory(cat);
    setShowCategorySheet(false);
  };

  const handleSubmit = async () => {
    if (!expense) return;
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('알림', '금액을 입력해주세요');
      return;
    }

    setLoading(true);
    try {
      await updateExpense({
        ...expense,
        amount: parseFloat(amount),
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
      Alert.alert('오류', '지출 수정에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    Alert.alert('지출 삭제', '이 지출을 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: async () => {
          if (id) {
            await deleteExpense(id);
            if (hapticEnabled) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            router.back();
          }
        },
      },
    ]);
  };

  // 카테고리 정보
  const getCategoryInfo = () => {
    return CATEGORIES.find(c => c.id === category) || CATEGORIES[0];
  };

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, textAlign: 'center', marginTop: 40 }]}>
          지출을 찾을 수 없습니다
        </Text>
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: '지출 수정',
          headerRight: () => (
            <TouchableOpacity onPress={handleDelete} style={{ padding: spacing.xs }}>
              <MaterialIcons name="delete" size={24} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
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
          {/* 금액 입력 */}
          <Card style={styles.amountCard}>
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
            title="수정하기"
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
