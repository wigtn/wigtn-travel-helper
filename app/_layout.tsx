import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../lib/hooks/useTheme';
import { useExchangeRateStore } from '../lib/stores/exchangeRateStore';
import { useTripStore } from '../lib/stores/tripStore';

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const loadRates = useExchangeRateStore((state) => state.loadRates);
  const loadTrips = useTripStore((state) => state.loadTrips);
  const loadActiveTrip = useTripStore((state) => state.loadActiveTrip);

  useEffect(() => {
    // 앱 시작 시 데이터 로드
    loadRates();
    loadTrips();
    loadActiveTrip();
  }, []);

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: '600',
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="trip/new"
          options={{
            title: '새 여행',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="trip/[id]"
          options={{
            title: '여행 상세',
          }}
        />
        <Stack.Screen
          name="expense/new"
          options={{
            title: '지출 입력',
            presentation: 'modal',
          }}
        />
        <Stack.Screen
          name="expense/[id]"
          options={{
            title: '지출 수정',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
