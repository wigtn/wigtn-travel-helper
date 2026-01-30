// Main Screen Revamp - 여행 지도 컴포넌트
// PRD FR-102, FR-103, FR-105: 구글 지도 + 핀 표시 + 자동 fit

import { useMemo, useRef, useEffect } from 'react';
import { StyleSheet, View, Platform } from 'react-native';
import MapView, { PROVIDER_GOOGLE, Region } from 'react-native-maps';
import { TripMarker } from './TripMarker';
import { Trip, Destination, TripStatus, getTripStatus } from '../../lib/types';
import { getCountryFlag } from '../../lib/utils/constants';

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

// 기본 지역 (대한민국 중심)
const DEFAULT_REGION: Region = {
  latitude: 36.5,
  longitude: 127.5,
  latitudeDelta: 10,
  longitudeDelta: 10,
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

export function TripMapView({
  trips,
  destinations,
  onMarkerPress,
  style,
}: TripMapViewProps) {
  const mapRef = useRef<MapView>(null);

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
    if (mapRef.current && tripDestinations.length > 0) {
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

  return (
    <View style={[styles.container, style]}>
      <MapView
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
        {tripDestinations.map((dest) => (
          <TripMarker
            key={dest.id}
            latitude={dest.latitude!}
            longitude={dest.longitude!}
            title={dest.city || dest.country}
            status={dest.tripStatus}
            countryFlag={getCountryFlag(dest.country)}
            onPress={() => onMarkerPress?.(dest.tripId)}
          />
        ))}
      </MapView>
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
});

export default TripMapView;
