// Trip Detail Layout - Nested route container
// PRD Main Screen Revamp: trip/[id]/main, trip/[id]/receipt 등 nested routes

import { Stack } from 'expo-router';
import { useTheme } from '../../../lib/theme';

export default function TripLayout() {
  const { colors } = useTheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        contentStyle: { backgroundColor: colors.background },
      }}
    />
  );
}
