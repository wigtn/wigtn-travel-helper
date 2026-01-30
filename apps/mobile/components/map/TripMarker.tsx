// Main Screen Revamp - 지도 핀 마커 컴포넌트
// PRD FR-103, FR-104: 여행 목적지 핀 + 상태별 색상

import { StyleSheet, View, Text } from 'react-native';
import { Marker, Callout } from 'react-native-maps';
import { TripStatus } from '../../lib/types';

// 핀 색상 규칙 (PRD Appendix C)
const PIN_COLORS: Record<TripStatus, string> = {
  active: '#FF6B6B',   // Coral Red - 현재 여행
  upcoming: '#4DABF7', // Sky Blue - 예정 여행
  past: '#ADB5BD',     // Gray - 과거 여행
};

interface TripMarkerProps {
  latitude: number;
  longitude: number;
  title: string;
  status: TripStatus;
  countryFlag?: string;
  onPress?: () => void;
}

export function TripMarker({
  latitude,
  longitude,
  title,
  status,
  countryFlag,
  onPress,
}: TripMarkerProps) {
  const pinColor = PIN_COLORS[status];

  return (
    <Marker
      coordinate={{ latitude, longitude }}
      pinColor={pinColor}
      onPress={onPress}
    >
      <Callout tooltip>
        <View style={styles.calloutContainer}>
          {countryFlag && <Text style={styles.flag}>{countryFlag}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
      </Callout>
    </Marker>
  );
}

const styles = StyleSheet.create({
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
  title: {
    fontSize: 14,
    fontWeight: '500',
    color: '#212529',
  },
});

export default TripMarker;
