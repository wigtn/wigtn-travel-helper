// Travel Helper v1.1 - Root Layout

import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTheme } from '../lib/theme';
import { useExchangeRateStore } from '../lib/stores/exchangeRateStore';
import { useTripStore } from '../lib/stores/tripStore';
import { useExpenseStore } from '../lib/stores/expenseStore';

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const loadRates = useExchangeRateStore((state) => state.loadRates);
  const loadTrips = useTripStore((state) => state.loadTrips);
  const loadActiveTrips = useTripStore((state) => state.loadActiveTrips);
  const activeTrip = useTripStore((state) => state.activeTrip);
  const loadExpenses = useExpenseStore((state) => state.loadExpenses);

  useEffect(() => {
    const initApp = async () => {
      // 앱 시작 시 데이터 로드
      await loadRates();
      await loadTrips();
      await loadActiveTrips();
    };

    initApp();
  }, []);

  // 활성 여행이 변경되면 지출 로드
  useEffect(() => {
    if (activeTrip) {
      loadExpenses(activeTrip.id);
    }
  }, [activeTrip?.id]);

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
            title: '새 여행 만들기',
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
