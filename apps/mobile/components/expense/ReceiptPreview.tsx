// Travel Helper - Receipt Preview Component
// PRD receipt-expense-input: FR-005, FR-007

import { View, Text, StyleSheet, TouchableOpacity, Image, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../lib/theme';
import { ReceiptImage } from '../../lib/types';

interface Props {
  image: ReceiptImage;
  onRetake: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const PREVIEW_WIDTH = SCREEN_WIDTH - 48;
const PREVIEW_MAX_HEIGHT = 200;

export function ReceiptPreview({ image, onRetake }: Props) {
  const { colors, spacing, typography, borderRadius } = useTheme();

  // 이미지 비율 계산
  const aspectRatio = image.width / image.height;
  const previewHeight = Math.min(PREVIEW_WIDTH / aspectRatio, PREVIEW_MAX_HEIGHT);
  const previewWidth = previewHeight * aspectRatio;

  const retakeLabel = image.type === 'camera' ? '다시 촬영' : '다시 선택';

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: image.uri }}
          style={[
            styles.image,
            {
              width: previewWidth,
              height: previewHeight,
              borderRadius: borderRadius.md,
            },
          ]}
          resizeMode="contain"
          accessibilityLabel="촬영된 영수증 이미지"
        />
      </View>

      <TouchableOpacity
        style={[styles.retakeButton, { borderColor: colors.border, borderRadius: borderRadius.sm }]}
        onPress={onRetake}
        accessibilityLabel={retakeLabel}
        accessibilityRole="button"
      >
        <MaterialIcons
          name={image.type === 'camera' ? 'camera-alt' : 'photo-library'}
          size={18}
          color={colors.textSecondary}
        />
        <Text style={[typography.labelMedium, { color: colors.textSecondary, marginLeft: 6 }]}>
          {retakeLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: 16,
  },
  imageContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  image: {
    backgroundColor: '#F5F5F5',
  },
  retakeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
  },
});
