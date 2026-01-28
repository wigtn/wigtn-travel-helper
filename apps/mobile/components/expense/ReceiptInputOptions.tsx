// Travel Helper - Receipt Input Options
// PRD receipt-expense-input: FR-002

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { ReceiptInputSource } from '../../lib/types';

interface Props {
  onSelect: (source: ReceiptInputSource) => void;
  onBack: () => void;
}

export function ReceiptInputOptions({ onSelect, onBack }: Props) {
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityLabel="뒤로가기"
        accessibilityRole="button"
      >
        <MaterialIcons name="arrow-back" size={24} color={colors.text} />
      </TouchableOpacity>

      <Text style={[typography.titleMedium, styles.title, { color: colors.text }]}>
        영수증을 어떻게 가져올까요?
      </Text>

      <TouchableOpacity
        style={[
          styles.optionCard,
          { backgroundColor: colors.surface, borderRadius: borderRadius.lg },
          shadows.sm,
        ]}
        onPress={() => onSelect('camera')}
        accessibilityLabel="카메라로 영수증 촬영하기"
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <MaterialIcons name="photo-camera" size={32} color={colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={[typography.titleSmall, { color: colors.text }]}>
            카메라로 촬영
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
            지금 바로 영수증 촬영
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
        onPress={() => onSelect('gallery')}
        accessibilityLabel="갤러리에서 영수증 사진 선택하기"
        accessibilityRole="button"
      >
        <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
          <MaterialIcons name="photo-library" size={32} color={colors.primary} />
        </View>
        <View style={styles.optionText}>
          <Text style={[typography.titleSmall, { color: colors.text }]}>
            갤러리에서 선택
          </Text>
          <Text style={[typography.bodySmall, { color: colors.textSecondary, marginTop: 4 }]}>
            저장된 사진에서 선택
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
    paddingTop: 16,
  },
  backButton: {
    padding: 8,
    marginBottom: 16,
    alignSelf: 'flex-start',
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
