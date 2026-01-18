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
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useExpenseStore } from '../../lib/stores/expenseStore';
import { useExchangeRateStore } from '../../lib/stores/exchangeRateStore';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { CATEGORIES, Category } from '../../lib/utils/constants';
import { formatKRW, getCurrencySymbol } from '../../lib/utils/currency';
import { formatDate, formatFullDate } from '../../lib/utils/date';
import { Expense } from '../../lib/types';

export default function EditExpenseScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useTheme();
  const { expenses, updateExpense, deleteExpense } = useExpenseStore();
  const { getRate, convert } = useExchangeRateStore();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState<Category>('food');
  const [memo, setMemo] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const found = expenses.find((e) => e.id === id);
    if (found) {
      setExpense(found);
      setAmount(found.amount.toString());
      setCategory(found.category);
      setMemo(found.memo || '');
      setDate(new Date(found.date));
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
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCategory(cat);
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
      });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
            router.back();
          }
        },
      },
    ]);
  };

  if (!expense) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.textSecondary }]}>
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
            <TouchableOpacity onPress={handleDelete}>
              <MaterialIcons name="delete" size={24} color={colors.error} />
            </TouchableOpacity>
          ),
        }}
      />
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
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
          title="수정하기"
          onPress={handleSubmit}
          loading={loading}
          disabled={!amount || parseFloat(amount) <= 0}
          size="large"
          style={styles.submitButton}
        />
      </ScrollView>
    </>
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
