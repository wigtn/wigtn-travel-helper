// Travel Helper v2.0 - Trip Store (API-first with offline support)

import { create } from 'zustand';
import { generateId } from '../utils/uuid';
import { getCountryCode } from '../utils/constants';
import { Trip, Destination, CurrentLocation } from '../types';
import * as queries from '../db/queries';
import { tripApi, CreateTripDto, TripResponse } from '../api/trip';
import { networkService } from '../services/networkService';

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
  loadTripsFromServer: () => Promise<void>;
  loadActiveTrips: () => Promise<void>;
  loadDestinations: (tripId: string) => Promise<void>;
  loadAllDestinations: () => Promise<void>;
  createTrip: (
    trip: Omit<Trip, 'id' | 'createdAt'>,
    destinations?: Omit<Destination, 'id' | 'tripId' | 'createdAt'>[]
  ) => Promise<Trip>;
  updateTrip: (trip: Trip) => Promise<void>;
  deleteTrip: (id: string) => Promise<void>;
  setActiveTrip: (trip: Trip | null) => void;

  // 방문지 액션들
  addDestination: (
    destination: Omit<Destination, 'id' | 'createdAt'>
  ) => Promise<Destination>;
  updateDestination: (destination: Destination) => Promise<void>;
  deleteDestination: (id: string, tripId: string) => Promise<void>;
  getCurrentLocation: (tripId: string) => Promise<CurrentLocation>;
}

// Helper: Convert date to YYYY-MM-DD format
function toDateString(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toISOString().split('T')[0];
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
function toDestination(dest: Destination, tripId: string): Destination {
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

export const useTripStore = create<TripState>((set, get) => ({
  trips: [],
  activeTrip: null,
  activeTrips: [],
  destinations: [],
  currentDestination: null,
  isLoading: false,

  // Load trips from local DB (fallback)
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

  // Load trips from server and save to local DB
  loadTripsFromServer: async () => {
    if (!networkService.getIsConnected()) {
      // Offline - load from local
      return get().loadTrips();
    }

    set({ isLoading: true });
    try {
      const { data } = await tripApi.getAll();
      const trips: Trip[] = [];

      // Save to local DB and build trips array
      for (const tripResponse of data) {
        const trip = toTrip(tripResponse);
        trips.push(trip);

        // Upsert trip to local DB
        await queries.upsertTrip(trip);

        // Upsert destinations
        if (tripResponse.destinations) {
          for (const dest of tripResponse.destinations) {
            await queries.upsertDestination(toDestination(dest, trip.id));
          }
        }
      }

      set({ trips, isLoading: false });

      // Update active trips
      await get().loadActiveTrips();
    } catch (error) {
      console.error('Failed to load trips from server:', error);
      // Fallback to local
      await get().loadTrips();
    }
  },

  loadActiveTrips: async () => {
    try {
      const activeTrips = await queries.getActiveTrips();
      const activeTrip = activeTrips.length > 0 ? activeTrips[0] : null;

      set({ activeTrips, activeTrip });

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

  loadAllDestinations: async () => {
    try {
      const destinations = await queries.getAllDestinations();
      set({ destinations });
    } catch (error) {
      console.error('Failed to load all destinations:', error);
    }
  },

  createTrip: async (tripData, destinationsData = []) => {
    const isOnline = networkService.getIsConnected();

    if (isOnline) {
      // Online: Create via API
      try {
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

        // Save to local DB
        await queries.upsertTrip(trip);
        if (data.destinations) {
          for (const dest of data.destinations) {
            await queries.upsertDestination(toDestination(dest, trip.id));
          }
        }

        set((state) => ({ trips: [trip, ...state.trips] }));

        // Update active trips if applicable
        const today = new Date().toISOString().split('T')[0];
        if (trip.startDate <= today && trip.endDate >= today) {
          set((state) => ({
            activeTrip: trip,
            activeTrips: [trip, ...state.activeTrips],
          }));
          await get().loadDestinations(trip.id);
        }

        return trip;
      } catch (error) {
        console.error('Failed to create trip on server:', error);
        throw error;
      }
    } else {
      // Offline: Create locally with sync queue
      const tripId = generateId();
      const now = new Date().toISOString();

      const trip: Trip = {
        ...tripData,
        id: tripId,
        createdAt: now,
      };

      await queries.createTrip(trip);
      await queries.addToSyncQueue('trip', tripId, 'create', trip as unknown as Record<string, unknown>);

      // Create destinations
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
        await queries.addToSyncQueue('destination', destination.id, 'create', destination as unknown as Record<string, unknown>);
      }

      set((state) => ({ trips: [trip, ...state.trips] }));

      const today = new Date().toISOString().split('T')[0];
      if (trip.startDate <= today && trip.endDate >= today) {
        set((state) => ({
          activeTrip: trip,
          activeTrips: [trip, ...state.activeTrips],
        }));
        await get().loadDestinations(tripId);
      }

      return trip;
    }
  },

  updateTrip: async (trip) => {
    const isOnline = networkService.getIsConnected();

    if (isOnline) {
      try {
        await tripApi.update(trip.id, {
          name: trip.name,
          startDate: trip.startDate,
          endDate: trip.endDate,
          budget: trip.budget,
        });
      } catch (error) {
        console.error('Failed to update trip on server:', error);
        // Queue for later sync
        await queries.addToSyncQueue('trip', trip.id, 'update', trip as unknown as Record<string, unknown>);
      }
    } else {
      await queries.addToSyncQueue('trip', trip.id, 'update', trip as unknown as Record<string, unknown>);
    }

    await queries.updateTrip(trip);
    set((state) => ({
      trips: state.trips.map((t) => (t.id === trip.id ? trip : t)),
      activeTrip: state.activeTrip?.id === trip.id ? trip : state.activeTrip,
      activeTrips: state.activeTrips.map((t) => (t.id === trip.id ? trip : t)),
    }));
  },

  deleteTrip: async (id) => {
    const isOnline = networkService.getIsConnected();

    if (isOnline) {
      try {
        await tripApi.delete(id);
      } catch (error) {
        console.error('Failed to delete trip on server:', error);
        await queries.addToSyncQueue('trip', id, 'delete', { id });
      }
    } else {
      await queries.addToSyncQueue('trip', id, 'delete', { id });
    }

    await queries.deleteTrip(id);
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
        destinations: state.activeTrip?.id === id ? [] : state.destinations,
        currentDestination:
          state.activeTrip?.id === id ? null : state.currentDestination,
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
    const isOnline = networkService.getIsConnected();
    const destination: Destination = {
      ...destData,
      id: generateId(),
      createdAt: new Date().toISOString(),
    };

    if (isOnline) {
      try {
        const { data } = await tripApi.addDestination(destData.tripId, {
          country: destData.country,
          countryCode: getCountryCode(destData.country),
          city: destData.city,
          currency: destData.currency,
          startDate: destData.startDate,
          endDate: destData.endDate,
          orderIndex: destData.orderIndex,
        });
        // Use server-generated ID
        destination.id = data.id;
      } catch (error) {
        console.error('Failed to add destination on server:', error);
        await queries.addToSyncQueue('destination', destination.id, 'create', destination as unknown as Record<string, unknown>);
      }
    } else {
      await queries.addToSyncQueue('destination', destination.id, 'create', destination as unknown as Record<string, unknown>);
    }

    await queries.createDestination(destination);
    set((state) => ({
      destinations: [...state.destinations, destination].sort(
        (a, b) => a.orderIndex - b.orderIndex
      ),
    }));
    return destination;
  },

  updateDestination: async (destination) => {
    const isOnline = networkService.getIsConnected();

    if (!isOnline) {
      await queries.addToSyncQueue('destination', destination.id, 'update', destination as unknown as Record<string, unknown>);
    }
    // Note: Backend doesn't have a direct update destination endpoint
    // Changes will sync via the sync mechanism

    await queries.updateDestination(destination);
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
    const isOnline = networkService.getIsConnected();

    if (isOnline) {
      try {
        await tripApi.removeDestination(tripId, id);
      } catch (error) {
        console.error('Failed to delete destination on server:', error);
        await queries.addToSyncQueue('destination', id, 'delete', { id });
      }
    } else {
      await queries.addToSyncQueue('destination', id, 'delete', { id });
    }

    await queries.deleteDestination(id);
    set((state) => ({
      destinations: state.destinations.filter((d) => d.id !== id),
      currentDestination:
        state.currentDestination?.id === id ? null : state.currentDestination,
    }));
  },

  getCurrentLocation: async (tripId) => {
    const currentDestination = await queries.getCurrentDestination(tripId);
    const trip = get().trips.find((t) => t.id === tripId) || get().activeTrip;

    let dayIndex = 1;
    if (trip) {
      const start = new Date(trip.startDate);
      const today = new Date();
      dayIndex =
        Math.floor(
          (today.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
        ) + 1;
    }

    set({ currentDestination });

    return {
      destination: currentDestination,
      dayIndex: Math.max(1, dayIndex),
    };
  },
}));
