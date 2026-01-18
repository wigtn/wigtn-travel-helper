import { useColorScheme } from 'react-native';
import { COLORS } from '../utils/constants';

export function useTheme() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const colors = isDark ? COLORS.dark : COLORS.light;

  return {
    isDark,
    colors,
  };
}
