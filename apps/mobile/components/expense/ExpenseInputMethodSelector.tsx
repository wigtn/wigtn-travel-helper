// Travel Helper - Expense Input Method Selector
// PRD receipt-expense-input: FR-001

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { ExpenseInputMethod } from '../../lib/types';

interface Props {
  onSelect: (method: ExpenseInputMethod) => void;
}

export function ExpenseInputMethodSelector({ onSelect }: Props) {
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[typography.titleMedium, styles.title, { color: colors.text }]}>
        어떻게 지출을 등록할까요?
      </Text>

      <TouchableOpacity
        style={[
          styles.optionCard,
          { backgroundColor: colors.surface, borderRadius: borderRadius.lg },
          shadows.sm,
        ]}
        onPress={() => onSelect('receipt')}
        accessibilityLabel="영수증 사진으로 지출 등록"
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <MaterialIcons name="camera-alt" size={32} color={colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={[typography.titleSmall, { color: colors.text }]}>
            영수증 입력하기
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
            영수증 사진으로 빠르게 등록
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.optionCard,
          { backgroundColor: colors.surface, borderRadius: borderRadius.lg, marginTop: spacing.md },
          shadows.sm,
        ]}
        onPress={() => onSelect('manual')}
        accessibilityLabel="금액과 정보를 직접 입력하여 지출 등록"
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.secondaryLight || colors.primaryLight }]}>
          <MaterialIcons name="edit" size={32} color={colors.secondary || colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={[typography.titleSmall, { color: colors.text }]}>
            직접 입력하기
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
            금액과 정보를 직접 입력
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={24} color={colors.textTertiary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 40,
  },
  title: {
    textAlign: 'center',
    marginBottom: 32,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    marginLeft: 16,
  },
});
