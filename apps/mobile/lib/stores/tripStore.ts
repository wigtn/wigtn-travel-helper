// Travel Helper v1.1 - Trip Store (Simplified)
// PRD v1.1 기준 - 지갑 연동 제거

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { Trip, Destination, CurrentLocation } from '../types';
import * as queries from '../db/queries';

interface TripState {
  trips: Trip[];
  activeTrip: Trip | null;
  activeTrips: Trip[];
  isLoading: boolean;

  // 현재 여행의 방문지들
  destinations: Destination[];
  currentDestination: Destination | null;

  // 액션들
  loadTrips: () => Promise<void>;
  loadActiveTrips: () => Promise<void>;
  loadDestinations: (tripId: string) => Promise<void>;
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt'>, destinations?: Omit<Destination, 'id' | 'tripId' | 'createdAt'>[]) => Promise<Trip>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;

  // 방문지 액션들
  addDestination: (destination: Omit<Destination, 'id' | 'createdAt'>) => Promise<Destination>;
  updateDestination: (destination: Destination) => Promise<void>;
  deleteDestination: (id: string) => Promise<void>;
  getCurrentLocation: (tripId: string) => Promise<CurrentLocation>;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  activeTrip: null,
  activeTrips: [],
  destinations: [],
  currentDestination: null,
  isLoading: false,

  loadTrips: async () => {
    set({ isLoading: true });
    try {
      const trips = await queries.getAllTrips();
      set({ trips, isLoading: false });
    } catch (error) {
      console.error('Failed to load trips:', error);
      set({ isLoading: false });
    }
  },

  loadActiveTrips: async () => {
    try {
      const activeTrips = await queries.getActiveTrips();
      const activeTrip = activeTrips.length > 0 ? activeTrips[0] : null;

      set({ activeTrips, activeTrip });

      // 활성 여행이 있으면 방문지도 로드
      if (activeTrip) {
        await get().loadDestinations(activeTrip.id);
      }
    } catch (error) {
      console.error('Failed to load active trips:', error);
    }
  },

  loadDestinations: async (tripId) => {
    try {
      const destinations = await queries.getDestinationsByTripId(tripId);
      const currentDestination = await queries.getCurrentDestination(tripId);
      set({ destinations, currentDestination });
    } catch (error) {
      console.error('Failed to load destinations:', error);
    }
  },

  createTrip: async (tripData, destinationsData = []) => {
    const tripId = generateId();
    const now = new Date().toISOString();

    const trip: Trip = {
      ...tripData,
      id: tripId,
      createdAt: now,
    };

    await queries.createTrip(trip);

    // 방문지 생성
    for (let i = 0; i < destinationsData.length; i++) {
      const dest = destinationsData[i];
      const destination: Destination = {
        ...dest,
        id: generateId(),
        tripId,
        orderIndex: i,
        createdAt: now,
      };
      await queries.createDestination(destination);
    }

    set((state) => ({ trips: [trip, ...state.trips] }));

    // 활성 여행 업데이트
    const today = new Date().toISOString().split('T')[0];
    if (trip.startDate <= today && trip.endDate >= today) {
      set((state) => ({
        activeTrip: trip,
        activeTrips: [trip, ...state.activeTrips],
      }));
      await get().loadDestinations(tripId);
    }

    return trip;
  },

  updateTrip: async (trip) => {
    await queries.updateTrip(trip);
    set((state) => ({
      trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
      activeTrip: state.activeTrip?.id === trip.id ? trip : state.activeTrip,
      activeTrips: state.activeTrips.map((t) => (t.id === trip.id ? trip : t)),
    }));
  },

  deleteTrip: async (id) => {
    await queries.deleteTrip(id);
    set((state) => {
      const newActiveTrips = state.activeTrips.filter((t) => t.id !== id);
      const newActiveTrip = state.activeTrip?.id === id
        ? (newActiveTrips.length > 0 ? newActiveTrips[0] : null)
        : state.activeTrip;

      return {
        trips: state.trips.filter((t) => t.id !== id),
        activeTrips: newActiveTrips,
        activeTrip: newActiveTrip,
        destinations: state.activeTrip?.id === id ? [] : state.destinations,
        currentDestination: state.activeTrip?.id === id ? null : state.currentDestination,
      };
    });
  },

  setActiveTrip: (trip) => {
    set({ activeTrip: trip });
    if (trip) {
      get().loadDestinations(trip.id);
    } else {
      set({ destinations: [], currentDestination: null });
    }
  },

  // 방문지 관련
  addDestination: async (destData) => {
    const destination: Destination = {
      ...destData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await queries.createDestination(destination);
    set((state) => ({
      destinations: [...state.destinations, destination].sort((a, b) => a.orderIndex - b.orderIndex),
    }));
    return destination;
  },

  updateDestination: async (destination) => {
    await queries.updateDestination(destination);
    set((state) => ({
      destinations: state.destinations.map((d) => (d.id === destination.id ? destination : d)),
      currentDestination: state.currentDestination?.id === destination.id ? destination : state.currentDestination,
    }));
  },

  deleteDestination: async (id) => {
    await queries.deleteDestination(id);
    set((state) => ({
      destinations: state.destinations.filter((d) => d.id !== id),
      currentDestination: state.currentDestination?.id === id ? null : state.currentDestination,
    }));
  },

  getCurrentLocation: async (tripId) => {
    const currentDestination = await queries.getCurrentDestination(tripId);
    const trip = get().trips.find(t => t.id === tripId) || get().activeTrip;

    let dayIndex = 1;
    if (trip) {
      const start = new Date(trip.startDate);
      const today = new Date();
      dayIndex = Math.floor((today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    }

    set({ currentDestination });

    return {
      destination: currentDestination,
      dayIndex: Math.max(1, dayIndex),
    };
  },
}));
