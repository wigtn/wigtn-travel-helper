// Travel Helper v3.0 - Network Status Indicator (Server-only mode)

import { View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useSyncStore } from '../../lib/stores/syncStore';
import { useTheme } from '../../lib/theme';

export function SyncStatusIndicator() {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { isOnline } = useSyncStore();

  const config = isOnline
    ? {
        icon: 'cloud-done' as const,
        color: colors.success,
        text: '연결됨',
      }
    : {
        icon: 'cloud-off' as const,
        color: colors.textTertiary,
        text: '오프라인',
      };

  const styles = StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      backgroundColor: colors.surface,
      borderRadius: borderRadius.sm,
      gap: spacing.xs,
    },
    text: {
      ...typography.bodySmall,
      color: config.color,
    },
  });

  return (
    <View style={styles.container}>
      <MaterialIcons name={config.icon} size={16} color={config.color} />
      <Text style={styles.text}>{config.text}</Text>
    </View>
  );
}
