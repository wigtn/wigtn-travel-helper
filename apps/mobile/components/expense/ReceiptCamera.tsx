// Travel Helper - Receipt Camera Component
// PRD receipt-expense-input: FR-003, FR-015

import { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';
import { useSettingsStore } from '../../lib/stores/settingsStore';
import { ReceiptImage } from '../../lib/types';
import {
  captureFromCamera,
  openAppSettings,
  getImageErrorMessage,
} from '../../lib/utils/image';

interface Props {
  onCapture: (image: ReceiptImage) => void;
  onBack: () => void;
}

export function ReceiptCamera({ onCapture, onBack }: Props) {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { hapticEnabled } = useSettingsStore();
  const cameraRef = useRef<CameraView>(null);

  const [permission, requestPermission] = useCameraPermissions();
  const [flash, setFlash] = useState<FlashMode>('auto');
  const [capturing, setCapturing] = useState(false);
  const [permissionDenied, setPermissionDenied] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    checkAndRequestPermission();
  }, []);

  const checkAndRequestPermission = async () => {
    if (permission?.granted) {
      setIsReady(true);
      return;
    }

    const result = await requestPermission();
    if (result.granted) {
      setIsReady(true);
    } else if (!result.canAskAgain) {
      setPermissionDenied(true);
    }
  };

  const triggerHaptic = () => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const toggleFlash = () => {
    triggerHaptic();
    setFlash(current => {
      switch (current) {
        case 'auto': return 'on';
        case 'on': return 'off';
        case 'off': return 'auto';
        default: return 'auto';
      }
    });
  };

  const getFlashIcon = (): keyof typeof MaterialIcons.glyphMap => {
    switch (flash) {
      case 'on': return 'flash-on';
      case 'off': return 'flash-off';
      case 'auto': return 'flash-auto';
      default: return 'flash-auto';
    }
  };

  const handleCapture = async () => {
    if (capturing) return;

    setCapturing(true);
    triggerHaptic();

    const result = await captureFromCamera(cameraRef);

    if (result.success && result.image) {
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      onCapture(result.image);
    } else {
      if (hapticEnabled) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
      Alert.alert('촬영 실패', getImageErrorMessage(result.error));
    }

    setCapturing(false);
  };

  // 권한 영구 거부 시 안내 화면
  if (permissionDenied) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <View style={[styles.permissionIcon, { backgroundColor: colors.surface }]}>
          <MaterialIcons name="no-photography" size={48} color={colors.textTertiary} />
        </View>
        <Text style={[typography.titleMedium, styles.permissionTitle, { color: colors.text }]}>
          카메라 권한이 필요합니다
        </Text>
        <Text style={[typography.bodyMedium, styles.permissionText, { color: colors.textSecondary }]}>
          영수증 촬영을 위해{'\n'}설정에서 카메라 권한을 허용해주세요.
        </Text>
        <TouchableOpacity
          style={[styles.settingsButton, { backgroundColor: colors.primary, borderRadius: borderRadius.md }]}
          onPress={openAppSettings}
        >
          <Text style={[typography.labelLarge, { color: '#FFFFFF' }]}>
            설정으로 이동
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.laterButton}
          onPress={onBack}
        >
          <Text style={[typography.labelMedium, { color: colors.textSecondary }]}>
            나중에 하기
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // 권한 대기 중
  if (!isReady) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
          카메라 권한을 확인하고 있습니다...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: '#000' }]}>
      {/* 상단 컨트롤 */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={onBack}
          accessibilityLabel="뒤로가기"
        >
          <MaterialIcons name="arrow-back" size={28} color="#FFF" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.controlButton}
          onPress={toggleFlash}
          accessibilityLabel={`플래시 ${flash}`}
        >
          <MaterialIcons name={getFlashIcon()} size={28} color="#FFF" />
          <Text style={styles.flashLabel}>{flash}</Text>
        </TouchableOpacity>
      </View>

      {/* 카메라 뷰 */}
      <CameraView
        ref={cameraRef}
        style={styles.camera}
        facing="back"
        flash={flash}
      >
        {/* 가이드 프레임 */}
        <View style={styles.guideFrame}>
          <View style={[styles.corner, styles.cornerTL]} />
          <View style={[styles.corner, styles.cornerTR]} />
          <View style={[styles.corner, styles.cornerBL]} />
          <View style={[styles.corner, styles.cornerBR]} />
        </View>
      </CameraView>

      {/* 하단 촬영 버튼 */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={[styles.captureButton, capturing && styles.captureButtonDisabled]}
          onPress={handleCapture}
          disabled={capturing}
          accessibilityLabel="영수증 촬영"
          accessibilityRole="button"
        >
          <View style={styles.captureButtonInner} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  controlButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  flashLabel: {
    color: '#FFF',
    fontSize: 12,
    marginLeft: 4,
  },
  camera: {
    flex: 1,
  },
  guideFrame: {
    flex: 1,
    margin: 24,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderColor: '#FFF',
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderTopLeftRadius: 8,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderTopRightRadius: 8,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderBottomLeftRadius: 8,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderBottomRightRadius: 8,
  },
  bottomControls: {
    alignItems: 'center',
    paddingVertical: 32,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  captureButton: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#FFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureButtonDisabled: {
    opacity: 0.5,
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    borderWidth: 3,
    borderColor: '#000',
  },
  permissionIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  permissionTitle: {
    marginBottom: 12,
    textAlign: 'center',
  },
  permissionText: {
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  settingsButton: {
    paddingHorizontal: 32,
    paddingVertical: 14,
    marginBottom: 16,
  },
  laterButton: {
    padding: 12,
  },
});
