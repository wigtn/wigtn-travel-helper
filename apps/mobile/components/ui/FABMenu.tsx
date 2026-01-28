// Travel Helper v2.0 - FABMenu Component (Speed Dial Style)
// 박스형 팝업 메뉴 - FAB 버튼 주위에 옵션이 나타남

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  Modal,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../lib/theme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

export interface FABMenuItem {
  id: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  description?: string;
  onPress: () => void;
  keepOpen?: boolean; // 메뉴를 닫지 않고 유지
}

interface FABMenuProps {
  items: FABMenuItem[];
  icon?: keyof typeof MaterialIcons.glyphMap;
  closeIcon?: keyof typeof MaterialIcons.glyphMap;
  // Controlled mode
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function FABMenu({
  items,
  icon = 'add',
  closeIcon = 'close',
  isOpen: controlledIsOpen,
  onOpenChange,
}: FABMenuProps) {
  const { colors, spacing, typography, borderRadius, shadows } = useTheme();
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // Controlled vs uncontrolled mode
  const isControlled = controlledIsOpen !== undefined;
  const isOpen = isControlled ? controlledIsOpen : internalIsOpen;
  const setIsOpen = (value: boolean) => {
    if (isControlled) {
      onOpenChange?.(value);
    } else {
      setInternalIsOpen(value);
    }
  };

  // 애니메이션 값들
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;
  const menuAnim = useRef(new Animated.Value(0)).current;

  // Controlled mode에서 isOpen 변경 시 애니메이션 실행
  useEffect(() => {
    if (isControlled) {
      if (controlledIsOpen) {
        runOpenAnimation();
      } else {
        runCloseAnimation();
      }
    }
  }, [controlledIsOpen, isControlled]);

  const runOpenAnimation = () => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 100,
        friction: 8,
      }),
      Animated.timing(backdropAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.spring(menuAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 10,
      }),
    ]).start();
  };

  const runCloseAnimation = () => {
    Animated.parallel([
      Animated.spring(rotateAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 100,
        friction: 10,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(menuAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const toggleMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  };

  const openMenu = () => {
    setIsOpen(true);
    runOpenAnimation();
  };

  const closeMenu = () => {
    runCloseAnimation();
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  const handleItemPress = (item: FABMenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (item.keepOpen) {
      // 메뉴 열린 상태 유지하면서 바로 액션 실행
      item.onPress();
    } else {
      // 메뉴 닫고 액션 실행
      closeMenu();
      setTimeout(() => {
        item.onPress();
      }, 150);
    }
  };

  // FAB 회전 애니메이션
  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '45deg'],
  });

  // 메뉴 박스 애니메이션
  const menuTranslateY = menuAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [20, 0],
  });

  return (
    <>
      {/* 메뉴가 열렸을 때 오버레이 */}
      {isOpen && (
        <Modal
          transparent
          visible={isOpen}
          animationType="none"
          onRequestClose={closeMenu}
        >
          <View style={styles.modalContainer}>
            {/* 배경 오버레이 */}
            <Animated.View
              style={[
                styles.backdrop,
                {
                  opacity: backdropAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, 0.5],
                  }),
                },
              ]}
            >
              <Pressable style={styles.backdropPressable} onPress={closeMenu} />
            </Animated.View>

            {/* 메뉴 박스 */}
            <Animated.View
              style={[
                styles.menuContainer,
                {
                  opacity: menuAnim,
                  transform: [
                    { translateY: menuTranslateY },
                    { scale: scaleAnim },
                  ],
                },
              ]}
            >
              <View
                style={[
                  styles.menuBox,
                  {
                    backgroundColor: colors.background,
                    borderRadius: borderRadius.xl,
                    ...shadows.lg,
                  },
                ]}
              >
                {items.map((item, index) => (
                  <TouchableOpacity
                    key={item.id}
                    style={[
                      styles.menuItem,
                      {
                        borderBottomWidth: index < items.length - 1 ? 1 : 0,
                        borderBottomColor: colors.divider,
                      },
                    ]}
                    onPress={() => handleItemPress(item)}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.menuItemIcon,
                        { backgroundColor: colors.primaryLight },
                      ]}
                    >
                      <MaterialIcons
                        name={item.icon}
                        size={24}
                        color={colors.primary}
                      />
                    </View>
                    <View style={styles.menuItemText}>
                      <Text style={[typography.titleSmall, { color: colors.text }]}>
                        {item.label}
                      </Text>
                      {item.description && (
                        <Text
                          style={[
                            typography.bodySmall,
                            { color: colors.textSecondary, marginTop: 2 },
                          ]}
                        >
                          {item.description}
                        </Text>
                      )}
                    </View>
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={colors.textTertiary}
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* FAB 버튼 - 항상 같은 위치에 고정 */}
      <TouchableOpacity
        style={[
          styles.fab,
          {
            backgroundColor: colors.primary,
            ...shadows.lg,
          },
        ]}
        onPress={toggleMenu}
        activeOpacity={0.8}
      >
        <Animated.View style={{ transform: [{ rotate: rotateInterpolate }] }}>
          <MaterialIcons name={icon} size={24} color={colors.textInverse} />
        </Animated.View>
      </TouchableOpacity>
    </>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#000',
  },
  backdropPressable: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 76, // FAB(bottom:32 + height:56) 바로 위 + 8px 간격
    right: 16,
    width: SCREEN_WIDTH - 32,
    maxWidth: 320,
    alignItems: 'flex-end',
  },
  menuBox: {
    width: '100%',
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItemText: {
    flex: 1,
    marginLeft: 12,
  },
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 16,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
