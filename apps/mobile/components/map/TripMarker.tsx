// Main Screen Revamp - 지도 핀 마커 컴포넌트
// PRD FR-103, FR-104: 여행 목적지 핀 + 상태별 색상
// Expo Go 호환: react-native-maps 사용 불가 시 null 반환

import { StyleSheet, View, Text } from 'react-native';
import { TripStatus } from '../../lib/types';

// Check if react-native-maps is available
let MarkerComponent: any = null;
let CalloutComponent: any = null;
let isMapAvailable = false;

try {
  const Maps = require('react-native-maps');
  MarkerComponent = Maps.Marker;
  CalloutComponent = Maps.Callout;
  isMapAvailable = true;
} catch (e) {
  // react-native-maps not available (Expo Go)
  isMapAvailable = false;
}

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
  // Return null if maps not available (Expo Go)
  if (!isMapAvailable || !MarkerComponent || !CalloutComponent) {
    return null;
  }

  const pinColor = PIN_COLORS[status];

  return (
    <MarkerComponent
      coordinate={{ latitude, longitude }}
      pinColor={pinColor}
      onPress={onPress}
    >
      <CalloutComponent tooltip>
        <View style={styles.calloutContainer}>
          {countryFlag && <Text style={styles.flag}>{countryFlag}</Text>}
          <Text style={styles.title}>{title}</Text>
        </View>
      </CalloutComponent>
    </MarkerComponent>
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
