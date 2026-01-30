// Main Screen Revamp - 여행 지도 컴포넌트
// PRD FR-102, FR-103, FR-105: 구글 지도 + 핀 표시 + 자동 fit
// Expo Go 호환: react-native-maps 사용 불가 시 Fallback UI

import { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Platform, Text, TouchableOpacity, ScrollView } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Trip, Destination, TripStatus, getTripStatus } from '../../lib/types';
import { getCountryFlag } from '../../lib/utils/constants';

// Check if react-native-maps is available (not in Expo Go)
let MapViewComponent: any = null;
let PROVIDER_GOOGLE: any = null;
let MarkerComponent: any = null;
let CalloutComponent: any = null;
let isMapAvailable = false;

try {
  const Maps = require('react-native-maps');
  MapViewComponent = Maps.default;
  PROVIDER_GOOGLE = Maps.PROVIDER_GOOGLE;
  MarkerComponent = Maps.Marker;
  CalloutComponent = Maps.Callout;
  isMapAvailable = true;
} catch (e) {
  // react-native-maps not available (Expo Go)
  isMapAvailable = false;
}

interface TripDestination extends Destination {
  tripName: string;
  tripStatus: TripStatus;
}

interface TripMapViewProps {
  trips: Trip[];
  destinations: Destination[];
  onMarkerPress?: (tripId: string) => void;
  style?: object;
}

interface Region {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

// 기본 지역 (대한민국 중심)
const DEFAULT_REGION: Region = {
  latitude: 36.5,
  longitude: 127.5,
  latitudeDelta: 10,
  longitudeDelta: 10,
};

// 핀 색상 규칙 (PRD Appendix C)
const PIN_COLORS: Record<TripStatus, string> = {
  active: '#FF6B6B',   // Coral Red - 현재 여행
  upcoming: '#4DABF7', // Sky Blue - 예정 여행
  past: '#ADB5BD',     // Gray - 과거 여행
};

// 좌표에서 지역 경계 계산
function calculateRegion(coordinates: { latitude: number; longitude: number }[]): Region {
  if (coordinates.length === 0) {
    return DEFAULT_REGION;
  }

  if (coordinates.length === 1) {
    return {
      latitude: coordinates[0].latitude,
      longitude: coordinates[0].longitude,
      latitudeDelta: 5,
      longitudeDelta: 5,
    };
  }

  const lats = coordinates.map((c) => c.latitude);
  const lngs = coordinates.map((c) => c.longitude);

  const minLat = Math.min(...lats);
  const maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs);
  const maxLng = Math.max(...lngs);

  const latDelta = Math.max((maxLat - minLat) * 1.5, 2);
  const lngDelta = Math.max((maxLng - minLng) * 1.5, 2);

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta,
    longitudeDelta: lngDelta,
  };
}

// Fallback UI for Expo Go
function FallbackMapView({
  tripDestinations,
  onMarkerPress,
  style,
}: {
  tripDestinations: TripDestination[];
  onMarkerPress?: (tripId: string) => void;
  style?: object;
}) {
  if (tripDestinations.length === 0) {
    return (
      <View style={[styles.container, styles.fallbackContainer, style]}>
        <MaterialIcons name="map" size={48} color="#ADB5BD" />
        <Text style={styles.fallbackText}>지도에 표시할 여행지가 없습니다</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, styles.fallbackContainer, style]}>
      <View style={styles.fallbackHeader}>
        <MaterialIcons name="map" size={20} color="#868E96" />
        <Text style={styles.fallbackTitle}>여행 목적지</Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.fallbackScroll}
      >
        {tripDestinations.map((dest) => (
          <TouchableOpacity
            key={dest.id}
            style={[styles.fallbackItem, { borderLeftColor: PIN_COLORS[dest.tripStatus] }]}
            onPress={() => onMarkerPress?.(dest.tripId)}
            activeOpacity={0.7}
          >
            <Text style={styles.fallbackFlag}>{getCountryFlag(dest.country)}</Text>
            <View style={styles.fallbackItemContent}>
              <Text style={styles.fallbackItemTitle} numberOfLines={1}>
                {dest.city || dest.country}
              </Text>
              <Text style={styles.fallbackItemSubtitle} numberOfLines={1}>
                {dest.tripName}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
      <Text style={styles.devNote}>Development build required for map view</Text>
    </View>
  );
}

export function TripMapView({
  trips,
  destinations,
  onMarkerPress,
  style,
}: TripMapViewProps) {
  const mapRef = useRef<any>(null);

  // 여행별로 destination 매핑 + status 계산
  const tripDestinations: TripDestination[] = useMemo(() => {
    const result: TripDestination[] = [];

    for (const dest of destinations) {
      // 좌표가 없는 목적지는 스킵
      if (!dest.latitude || !dest.longitude) continue;

      const trip = trips.find((t) => t.id === dest.tripId);
      if (!trip) continue;

      result.push({
        ...dest,
        tripName: trip.name,
        tripStatus: getTripStatus(trip),
      });
    }

    return result;
  }, [trips, destinations]);

  // 모든 핀을 포함하는 지역 계산
  const region = useMemo(() => {
    const coordinates = tripDestinations
      .filter((d) => d.latitude && d.longitude)
      .map((d) => ({ latitude: d.latitude!, longitude: d.longitude! }));

    return calculateRegion(coordinates);
  }, [tripDestinations]);

  // 지도가 준비되면 영역 맞추기
  useEffect(() => {
    if (isMapAvailable && mapRef.current && tripDestinations.length > 0) {
      const coordinates = tripDestinations
        .filter((d) => d.latitude && d.longitude)
        .map((d) => ({ latitude: d.latitude!, longitude: d.longitude! }));

      if (coordinates.length > 0) {
        mapRef.current.fitToCoordinates(coordinates, {
          edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
          animated: true,
        });
      }
    }
  }, [tripDestinations]);

  // Expo Go: Show fallback UI
  if (!isMapAvailable || !MapViewComponent) {
    return (
      <FallbackMapView
        tripDestinations={tripDestinations}
        onMarkerPress={onMarkerPress}
        style={style}
      />
    );
  }

  // Development build: Show real map
  return (
    <View style={[styles.container, style]}>
      <MapViewComponent
        ref={mapRef}
        style={styles.map}
        provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
        initialRegion={region}
        showsUserLocation={false}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
        mapPadding={{ top: 0, right: 0, bottom: 0, left: 0 }}
      >
        {MarkerComponent && CalloutComponent && tripDestinations.map((dest) => (
          <MarkerComponent
            key={dest.id}
            coordinate={{ latitude: dest.latitude!, longitude: dest.longitude! }}
            pinColor={PIN_COLORS[dest.tripStatus]}
            onPress={() => onMarkerPress?.(dest.tripId)}
          >
            <CalloutComponent tooltip>
              <View style={styles.calloutContainer}>
                <Text style={styles.flag}>{getCountryFlag(dest.country)}</Text>
                <Text style={styles.calloutTitle}>{dest.city || dest.country}</Text>
              </View>
            </CalloutComponent>
          </MarkerComponent>
        ))}
      </MapViewComponent>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
  },
  map: {
    flex: 1,
  },
  // Fallback styles
  fallbackContainer: {
    backgroundColor: '#F8F9FA',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  fallbackHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  fallbackTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#868E96',
  },
  fallbackText: {
    marginTop: 8,
    fontSize: 14,
    color: '#868E96',
  },
  fallbackScroll: {
    paddingHorizontal: 4,
    gap: 8,
  },
  fallbackItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderLeftWidth: 3,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  fallbackFlag: {
    fontSize: 20,
  },
  fallbackItemContent: {
    maxWidth: 100,
  },
  fallbackItemTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#212529',
  },
  fallbackItemSubtitle: {
    fontSize: 11,
    color: '#868E96',
    marginTop: 2,
  },
  devNote: {
    marginTop: 12,
    fontSize: 10,
    color: '#CED4DA',
  },
  // Callout styles
  calloutContainer: {
    backgroundColor: 'white',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  flag: {
    fontSize: 18,
  },
  calloutTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
});

export default TripMapView;
