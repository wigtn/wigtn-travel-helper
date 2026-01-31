// Travel Helper v3.0 - Trip Store (Server-only)

import { create } from 'zustand';
import { getCountryCode } from '../utils/constants';
import { Trip, Destination, CurrentLocation } from '../types';
import { tripApi, CreateTripDto, TripResponse } from '../api/trip';

interface TripState {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTrips: Trip[];
  isLoading: boolean;
  error: string | null;
  hasAutoNavigatedToTrip: boolean;

  // 현재 여행의 방문지들
  destinations: Destination[];
  currentDestination: Destination | null;

  // 액션들
  loadTrips: () => Promise<void>;
  loadDestinations: (tripId: string) => Promise<void>;
  loadAllDestinations: () => Promise<void>;
  createTrip: (
    trip: Omit<Trip, 'id' | 'createdAt'>,
    destinations?: Omit<Destination, 'id' | 'tripId' | 'createdAt'>[]
  ) => Promise<Trip>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;
  clearError: () => void;

  // 방문지 액션들
  addDestination: (
    destination: Omit<Destination, 'id' | 'createdAt'>
  ) => Promise<Destination>;
  updateDestination: (destination: Destination) => Promise<void>;
  deleteDestination: (id: string, tripId: string) => Promise<void>;
  getCurrentLocation: (tripId: string) => CurrentLocation;

  // 자동 네비게이션 상태
  setHasAutoNavigatedToTrip: (value: boolean) => void;
}

// Helper: Convert date to YYYY-MM-DD format (로컬 타임존 기준)
function toDateString(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// Helper: Convert API response to local Trip type
function toTrip(response: TripResponse): Trip {
  return {
    id: response.id,
    name: response.name,
    startDate: toDateString(response.startDate),
    endDate: toDateString(response.endDate),
    budget: response.budget,
    createdAt: response.createdAt,
  };
}

// Helper: Convert API response destinations to local type
function toDestination(dest: any, tripId: string): Destination {
  return {
    id: dest.id,
    tripId,
    country: dest.country,
    countryName: dest.countryName,
    city: dest.city,
    currency: dest.currency,
    startDate: dest.startDate ? toDateString(dest.startDate) : undefined,
    endDate: dest.endDate ? toDateString(dest.endDate) : undefined,
    orderIndex: dest.orderIndex,
    createdAt: dest.createdAt,
  };
}

// Helper: Get active trips from trips array
function filterActiveTrips(trips: Trip[]): Trip[] {
  const today = toDateString(new Date());
  return trips.filter((t) => t.startDate <= today && t.endDate >= today);
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  activeTrip: null,
  activeTrips: [],
  destinations: [],
  currentDestination: null,
  isLoading: false,
  error: null,
  hasAutoNavigatedToTrip: false,

  loadTrips: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await tripApi.getAll();
      const trips: Trip[] = [];
      let allDestinations: Destination[] = [];

      for (const tripResponse of data) {
        const trip = toTrip(tripResponse);
        trips.push(trip);

        if (tripResponse.destinations) {
          for (const dest of tripResponse.destinations) {
            allDestinations.push(toDestination(dest, trip.id));
          }
        }
      }

      const activeTrips = filterActiveTrips(trips);
      const activeTrip = activeTrips.length > 0 ? activeTrips[0] : null;

      set({
        trips,
        activeTrips,
        activeTrip,
        destinations: allDestinations,
        isLoading: false,
      });

      // Set current destination if active trip exists
      if (activeTrip) {
        const tripDestinations = allDestinations.filter(d => d.tripId === activeTrip.id);
        const today = toDateString(new Date());
        const currentDest = tripDestinations.find(
          d => d.startDate && d.endDate && d.startDate <= today && d.endDate >= today
        ) || tripDestinations[0] || null;
        set({ currentDestination: currentDest });
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : '여행 목록을 불러오는데 실패했습니다';
      console.error('Failed to load trips:', error);
      set({ isLoading: false, error: message });
    }
  },

  loadDestinations: async (tripId) => {
    try {
      const { data } = await tripApi.getById(tripId);
      if (data.destinations) {
        const destinations = data.destinations.map((d: any) => toDestination(d, tripId));
        const today = toDateString(new Date());
        const currentDest = destinations.find(
          (d: Destination) => d.startDate && d.endDate && d.startDate <= today && d.endDate >= today
        ) || destinations[0] || null;

        set((state) => ({
          destinations: [
            ...state.destinations.filter(d => d.tripId !== tripId),
            ...destinations,
          ],
          currentDestination: currentDest,
        }));
      }
    } catch (error) {
      console.error('Failed to load destinations:', error);
    }
  },

  loadAllDestinations: async () => {
    // Destinations are already loaded with trips, just trigger a refresh
    await get().loadTrips();
  },

  createTrip: async (tripData, destinationsData = []) => {
    const dto: CreateTripDto = {
      name: tripData.name,
      startDate: tripData.startDate,
      endDate: tripData.endDate,
      budget: tripData.budget,
      destinations: destinationsData.map((d, i) => ({
        country: d.country,
        countryCode: getCountryCode(d.country),
        city: d.city,
        currency: d.currency,
        startDate: d.startDate,
        endDate: d.endDate,
        orderIndex: i,
      })),
    };

    const { data } = await tripApi.create(dto);
    const trip = toTrip(data);

    // Convert destinations
    const newDestinations: Destination[] = [];
    if (data.destinations) {
      for (const dest of data.destinations) {
        newDestinations.push(toDestination(dest, trip.id));
      }
    }

    set((state) => ({
      trips: [trip, ...state.trips],
      destinations: [...state.destinations, ...newDestinations],
    }));

    // Update active trips if applicable
    const today = toDateString(new Date());
    if (trip.startDate <= today && trip.endDate >= today) {
      set((state) => ({
        activeTrip: trip,
        activeTrips: [trip, ...state.activeTrips],
        currentDestination: newDestinations[0] || null,
      }));
    }

    return trip;
  },

  updateTrip: async (trip) => {
    await tripApi.update(trip.id, {
      name: trip.name,
      startDate: trip.startDate,
      endDate: trip.endDate,
      budget: trip.budget,
    });

    set((state) => ({
      trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
      activeTrip: state.activeTrip?.id === trip.id ? trip : state.activeTrip,
      activeTrips: state.activeTrips.map((t) => (t.id === trip.id ? trip : t)),
    }));
  },

  deleteTrip: async (id) => {
    await tripApi.delete(id);

    set((state) => {
      const newActiveTrips = state.activeTrips.filter((t) => t.id !== id);
      const newActiveTrip =
        state.activeTrip?.id === id
          ? newActiveTrips.length > 0
            ? newActiveTrips[0]
            : null
          : state.activeTrip;

      return {
        trips: state.trips.filter((t) => t.id !== id),
        activeTrips: newActiveTrips,
        activeTrip: newActiveTrip,
        destinations: state.destinations.filter((d) => d.tripId !== id),
        currentDestination:
          state.activeTrip?.id === id ? null : state.currentDestination,
      };
    });
  },

  setActiveTrip: (trip) => {
    set({ activeTrip: trip });
    if (trip) {
      // Set current destination from existing destinations
      const tripDestinations = get().destinations.filter(d => d.tripId === trip.id);
      const today = toDateString(new Date());
      const currentDest = tripDestinations.find(
        d => d.startDate && d.endDate && d.startDate <= today && d.endDate >= today
      ) || tripDestinations[0] || null;
      set({ currentDestination: currentDest });
    } else {
      set({ currentDestination: null });
    }
  },

  clearError: () => set({ error: null }),

  // 방문지 관련
  addDestination: async (destData) => {
    const { data } = await tripApi.addDestination(destData.tripId, {
      country: destData.country,
      countryCode: getCountryCode(destData.country),
      city: destData.city,
      currency: destData.currency,
      startDate: destData.startDate,
      endDate: destData.endDate,
      orderIndex: destData.orderIndex,
    });

    const destination = toDestination(data, destData.tripId);

    set((state) => ({
      destinations: [...state.destinations, destination].sort(
        (a, b) => a.orderIndex - b.orderIndex
      ),
    }));

    return destination;
  },

  updateDestination: async (destination) => {
    // Backend doesn't have a direct update destination endpoint
    // For now, just update local state
    set((state) => ({
      destinations: state.destinations.map((d) =>
        d.id === destination.id ? destination : d
      ),
      currentDestination:
        state.currentDestination?.id === destination.id
          ? destination
          : state.currentDestination,
    }));
  },

  deleteDestination: async (id, tripId) => {
    await tripApi.removeDestination(tripId, id);

    set((state) => ({
      destinations: state.destinations.filter((d) => d.id !== id),
      currentDestination:
        state.currentDestination?.id === id ? null : state.currentDestination,
    }));
  },

  getCurrentLocation: (tripId) => {
    const destinations = get().destinations.filter(d => d.tripId === tripId);
    const today = toDateString(new Date());
    const currentDest = destinations.find(
      d => d.startDate && d.endDate && d.startDate <= today && d.endDate >= today
    ) || destinations[0] || null;

    const trip = get().trips.find((t) => t.id === tripId) || get().activeTrip;

    let dayIndex = 1;
    if (trip) {
      const start = new Date(trip.startDate);
      const todayDate = new Date();
      dayIndex = Math.floor(
        (todayDate.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
      ) + 1;
    }

    set({ currentDestination: currentDest });

    return {
      destination: currentDest,
      dayIndex: Math.max(1, dayIndex),
    };
  },

  setHasAutoNavigatedToTrip: (value) => {
    set({ hasAutoNavigatedToTrip: value });
  },
}));

// 하위 호환성을 위한 alias
export const loadTripsFromServer = () => useTripStore.getState().loadTrips();
