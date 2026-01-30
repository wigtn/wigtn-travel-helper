// Main Screen Revamp - Receipt Detail Page
// PRD FR-305, FR-306: 영수증 상세 페이지

import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../lib/theme';
import { useExpenseStore } from '../../../lib/stores/expenseStore';
import { useTripStore } from '../../../lib/stores/tripStore';
import { Card, CategoryIcon } from '../../../components/ui';
import { formatKRW, formatCurrency } from '../../../lib/utils/currency';
import { formatDisplayDate } from '../../../lib/utils/date';
import { CATEGORIES, getCountryFlag } from '../../../lib/utils/constants';
import { Expense, Destination } from '../../../lib/types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function ReceiptDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { getExpenseById } = useExpenseStore();
  const { destinations } = useTripStore();

  const [expense, setExpense] = useState<Expense | null>(null);
  const [loading, setLoading] = useState(true);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    const loadExpense = async () => {
      if (id) {
        const data = await getExpenseById(id);
        setExpense(data);
        setLoading(false);
      }
    };
    loadExpense();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!expense) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <MaterialIcons name="error-outline" size={48} color={colors.textTertiary} />
        <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
          지출 정보를 찾을 수 없습니다
        </Text>
      </View>
    );
  }

  const category = CATEGORIES.find((c) => c.id === expense.category);
  const destination = destinations.find((d) => d.id === expense.destinationId);
  const hasReceiptImage = expense.receiptId; // In real implementation, this would load from storage

  return (
    <>
      <Stack.Screen
        options={{
          title: '영수증 상세',
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.headerButton}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />

      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={[styles.content, { padding: spacing.base }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Receipt Image Section */}
        <Card style={{ padding: 0, overflow: 'hidden', marginBottom: spacing.lg }}>
          {hasReceiptImage && !imageError ? (
            <View style={styles.imageContainer}>
              {/* Placeholder for receipt image - in production, load from receiptId */}
              <View style={[styles.imagePlaceholder, { backgroundColor: colors.surface }]}>
                <MaterialIcons name="receipt" size={64} color={colors.textTertiary} />
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                  영수증 이미지
                </Text>
                <Text style={[typography.caption, { color: colors.textTertiary, marginTop: 4 }]}>
                  ID: {expense.receiptId?.slice(0, 8)}...
                </Text>
              </View>
            </View>
          ) : (
            <View style={[styles.noImage, { backgroundColor: colors.surface }]}>
              <MaterialIcons name="image-not-supported" size={48} color={colors.textTertiary} />
              <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginTop: spacing.sm }]}>
                영수증 이미지 없음
              </Text>
            </View>
          )}
        </Card>

        {/* Expense Details */}
        <Card>
          <Text style={[typography.titleMedium, { color: colors.text, marginBottom: spacing.md }]}>
            지출 정보
          </Text>

          {/* Category & Amount */}
          <View style={[styles.detailRow, { marginBottom: spacing.md }]}>
            <View style={styles.categoryBadge}>
              <CategoryIcon category={expense.category} size="medium" />
              <Text style={[typography.titleSmall, { color: colors.text, marginLeft: 8 }]}>
                {category?.label}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[typography.headlineSmall, { color: colors.text }]}>
                {formatCurrency(expense.amount, expense.currency)}
              </Text>
              <Text style={[typography.bodySmall, { color: colors.primary }]}>
                ≈ {formatKRW(expense.amountKRW)}
              </Text>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Details List */}
          <View style={{ gap: spacing.sm }}>
            {/* Date */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="event" size={18} color={colors.textSecondary} />
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 8 }]}>
                  날짜
                </Text>
              </View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>
                {formatDisplayDate(expense.date)}
                {expense.time && ` ${expense.time}`}
              </Text>
            </View>

            {/* Location */}
            {destination && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <MaterialIcons name="location-on" size={18} color={colors.textSecondary} />
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 8 }]}>
                    위치
                  </Text>
                </View>
                <Text style={[typography.bodyMedium, { color: colors.text }]}>
                  {getCountryFlag(destination.country)} {destination.city || destination.country}
                </Text>
              </View>
            )}

            {/* Memo */}
            {expense.memo && (
              <View style={styles.infoRow}>
                <View style={styles.infoLabel}>
                  <MaterialIcons name="notes" size={18} color={colors.textSecondary} />
                  <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 8 }]}>
                    메모
                  </Text>
                </View>
                <Text
                  style={[typography.bodyMedium, { color: colors.text, flex: 1, textAlign: 'right' }]}
                  numberOfLines={2}
                >
                  {expense.memo}
                </Text>
              </View>
            )}

            {/* Exchange Rate */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="currency-exchange" size={18} color={colors.textSecondary} />
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 8 }]}>
                  환율
                </Text>
              </View>
              <Text style={[typography.bodyMedium, { color: colors.text }]}>
                1 {expense.currency} = ₩{expense.exchangeRate.toFixed(2)}
              </Text>
            </View>

            {/* Input Method */}
            <View style={styles.infoRow}>
              <View style={styles.infoLabel}>
                <MaterialIcons name="input" size={18} color={colors.textSecondary} />
                <Text style={[typography.bodyMedium, { color: colors.textSecondary, marginLeft: 8 }]}>
                  입력 방식
                </Text>
              </View>
              <View style={[styles.methodBadge, { backgroundColor: colors.primaryLight }]}>
                <MaterialIcons
                  name={expense.inputMethod === 'receipt' ? 'receipt' : 'edit'}
                  size={14}
                  color={colors.primary}
                />
                <Text style={[typography.labelSmall, { color: colors.primary, marginLeft: 4 }]}>
                  {expense.inputMethod === 'receipt' ? '영수증 스캔' : '수동 입력'}
                </Text>
              </View>
            </View>
          </View>
        </Card>

        {/* Edit Button */}
        <TouchableOpacity
          style={[
            styles.editButton,
            { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.lg },
          ]}
          onPress={() => router.push(`/expense/${expense.id}`)}
        >
          <MaterialIcons name="edit" size={20} color={colors.text} />
          <Text style={[typography.labelLarge, { color: colors.text, marginLeft: 8 }]}>
            지출 수정하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerButton: {
    padding: 4,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImage: {
    width: '100%',
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    marginVertical: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  infoLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  methodBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderWidth: 1,
    marginTop: 24,
  },
});
