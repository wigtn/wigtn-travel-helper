import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { Trip } from '../types';
import * as queries from '../db/queries';

interface TripState {
  trips: Trip[];
  activeTrip: Trip | null;
  isLoading: boolean;
  loadTrips: () => Promise<void>;
  loadActiveTrip: () => Promise<void>;
  createTrip: (trip: Omit<Trip, 'id' | 'createdAt'>) => Promise<Trip>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;
}

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  activeTrip: null,
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

  loadActiveTrip: async () => {
    try {
      const activeTrip = await queries.getActiveTrip();
      set({ activeTrip });
    } catch (error) {
      console.error('Failed to load active trip:', error);
    }
  },

  createTrip: async (tripData) => {
    const trip: Trip = {
      ...tripData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };
    await queries.createTrip(trip);
    set((state) => ({ trips: [trip, ...state.trips] }));

    // 활성 여행 업데이트
    const today = new Date().toISOString().split('T')[0];
    if (trip.startDate <= today && trip.endDate >= today) {
      set({ activeTrip: trip });
    }

    return trip;
  },

  updateTrip: async (trip) => {
    await queries.updateTrip(trip);
    set((state) => ({
      trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
      activeTrip: state.activeTrip?.id === trip.id ? trip : state.activeTrip,
    }));
  },

  deleteTrip: async (id) => {
    await queries.deleteTrip(id);
    set((state) => ({
      trips: state.trips.filter((t) => t.id !== id),
      activeTrip: state.activeTrip?.id === id ? null : state.activeTrip,
    }));
  },

  setActiveTrip: (trip) => {
    set({ activeTrip: trip });
  },
}));
