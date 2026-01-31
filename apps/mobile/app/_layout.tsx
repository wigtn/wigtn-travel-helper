// Travel Helper v2.0 - Root Layout (with Auth & Sync)

import { useEffect } from "react";
import {
  View,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import { useTheme } from "../lib/theme";
import { useExchangeRateStore } from "../lib/stores/exchangeRateStore";
import { useTripStore } from "../lib/stores/tripStore";
import { useExpenseStore } from "../lib/stores/expenseStore";
import { useAuthStore } from "../lib/stores/authStore";
import { useSyncStore } from "../lib/stores/syncStore";
import { cleanupOldReceiptCache } from "../lib/utils/image";

function SplashScreen() {
  const { colors } = useTheme();
  return (
    <View style={[styles.splash, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default function RootLayout() {
  const { colors, isDark } = useTheme();
  const navigation = useRouter();
  const segments = useSegments();

  // Auth state
  const {
    isAuthenticated,
    isInitialized,
    initialize: initAuth,
  } = useAuthStore();

  // Sync state
  const { initialize: initSync } = useSyncStore();

  // Data stores
  const loadRates = useExchangeRateStore((state) => state.loadRates);
  const loadTrips = useTripStore((state) => state.loadTrips);
  const loadAllDestinations = useTripStore(
    (state) => state.loadAllDestinations,
  );
  const activeTrip = useTripStore((state) => state.activeTrip);
  const loadExpenses = useExpenseStore((state) => state.loadExpenses);

  // Initialize auth on app start (run once)
  useEffect(() => {
    initAuth();
    // Clean up old receipt cache (24+ hours old)
    cleanupOldReceiptCache();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Handle auth-based routing
  useEffect(() => {
    if (!isInitialized) return;

    const inAuthGroup = segments[0] === "(auth)";

    if (!isAuthenticated && !inAuthGroup) {
      // Not logged in, redirect to login
      navigation.replace("/(auth)/login");
    } else if (isAuthenticated && inAuthGroup) {
      // Logged in but on auth screen, redirect to main app
      navigation.replace("/(tabs)");
    }
  }, [isAuthenticated, isInitialized, segments, navigation]);

  // Initialize data when authenticated
  useEffect(() => {
    if (!isAuthenticated) return;

    const initData = async () => {
      try {
        // Initialize sync
        await initSync();
        // Load exchange rates
        await loadRates();
        // Load trips from server
        await loadTrips();
        // Load all destinations for global home screen map
        await loadAllDestinations();
      } catch (error) {
        console.error('Failed to initialize data:', error);
      }
    };
    initData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // Load expenses when active trip changes
  useEffect(() => {
    if (!activeTrip?.id || !isAuthenticated) return;

    loadExpenses(activeTrip.id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTrip?.id, isAuthenticated]);

  // Show splash while initializing
  if (!isInitialized) {
    return <SplashScreen />;
  }

  return (
    <>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: colors.background,
          },
          headerTintColor: colors.text,
          headerTitleStyle: {
            fontWeight: "600",
          },
          contentStyle: {
            backgroundColor: colors.background,
          },
        }}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false, headerBackTitle: '' }} />
        <Stack.Screen
          name="trip/new"
          options={{
            title: "새 여행 만들기",
            presentation: "modal",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.back()}
                style={{
                  padding: 4,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="trip/[id]"
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="expense/new"
          options={{
            title: "지출 입력",
            presentation: "modal",
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => navigation.back()}
                style={{
                  padding: 4,
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            ),
          }}
        />
        <Stack.Screen
          name="calculator"
          options={{
            headerShown: false,
            presentation: "modal",
          }}
        />
      </Stack>
    </>
  );
}
