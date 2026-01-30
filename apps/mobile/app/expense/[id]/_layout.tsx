// Expense Detail Layout - Nested route container
import { Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme';

export default function ExpenseLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
        presentation: 'modal',
      }}
    />
  );
}
