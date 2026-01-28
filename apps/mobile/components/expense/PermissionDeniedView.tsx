// Travel Helper - Permission Denied View Component
// PRD receipt-expense-input: FR-012

import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { openAppSettings } from '../../lib/utils/image';

interface Props {
  type: 'camera' | 'gallery';
  onBack: () => void;
}

export function PermissionDeniedView({ type, onBack }: Props) {
  const { colors, typography, borderRadius } = useTheme();

  const isCamera = type === 'camera';
  const title = isCamera ? '카메라 권한이 필요합니다' : '갤러리 권한이 필요합니다';
  const description = isCamera
    ? '영수증 촬영을 위해\n설정에서 카메라 권한을 허용해주세요.'
    : '영수증 사진 선택을 위해\n설정에서 갤러리 권한을 허용해주세요.';
  const icon = isCamera ? 'no-photography' : 'photo-library';

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.iconContainer, { backgroundColor: colors.surface }]}>
        <MaterialIcons name={icon} size={48} color={colors.textTertiary} />
      </View>

      <Text style={[typography.titleMedium, styles.title, { color: colors.text }]}>
        {title}
      </Text>

      <Text style={[typography.bodyMedium, styles.description, { color: colors.textSecondary }]}>
        {description}
      </Text>

      <TouchableOpacity
        style={[styles.settingsButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
        onPress={openAppSettings}
        accessibilityLabel="설정으로 이동"
        accessibilityRole="button"
      >
        <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>
          설정으로 이동
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        accessibilityLabel="나중에 하기"
        accessibilityRole="button"
      >
        <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
          나중에 하기
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  settingsButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 16,
  },
  backButton: {
    padding: 12,
  },
});
