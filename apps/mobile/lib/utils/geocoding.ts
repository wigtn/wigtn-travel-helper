// Main Screen Revamp - 정적 좌표 데이터
// 주요 여행지 50개의 위도/경도 하드코딩 (오프라인 지원)

export interface CityCoordinates {
  latitude: number;
  longitude: number;
}

// 도시명 또는 국가명 → 좌표 매핑
// 대소문자 구분 없이 검색 가능하도록 소문자 키 사용
const CITY_COORDINATES: Record<string, CityCoordinates> = {
  // 일본
  '도쿄': { latitude: 35.6762, longitude: 139.6503 },
  'tokyo': { latitude: 35.6762, longitude: 139.6503 },
  '오사카': { latitude: 34.6937, longitude: 135.5023 },
  'osaka': { latitude: 34.6937, longitude: 135.5023 },
  '교토': { latitude: 35.0116, longitude: 135.7681 },
  'kyoto': { latitude: 35.0116, longitude: 135.7681 },
  '후쿠오카': { latitude: 33.5904, longitude: 130.4017 },
  'fukuoka': { latitude: 33.5904, longitude: 130.4017 },
  '삿포로': { latitude: 43.0618, longitude: 141.3545 },
  'sapporo': { latitude: 43.0618, longitude: 141.3545 },
  '나고야': { latitude: 35.1815, longitude: 136.9066 },
  '오키나와': { latitude: 26.2124, longitude: 127.6809 },
  '일본': { latitude: 36.2048, longitude: 138.2529 },
  'japan': { latitude: 36.2048, longitude: 138.2529 },

  // 미국
  '뉴욕': { latitude: 40.7128, longitude: -74.0060 },
  'new york': { latitude: 40.7128, longitude: -74.0060 },
  '로스앤젤레스': { latitude: 34.0522, longitude: -118.2437 },
  'los angeles': { latitude: 34.0522, longitude: -118.2437 },
  '샌프란시스코': { latitude: 37.7749, longitude: -122.4194 },
  'san francisco': { latitude: 37.7749, longitude: -122.4194 },
  '라스베가스': { latitude: 36.1699, longitude: -115.1398 },
  'las vegas': { latitude: 36.1699, longitude: -115.1398 },
  '하와이': { latitude: 21.3069, longitude: -157.8583 },
  'hawaii': { latitude: 21.3069, longitude: -157.8583 },
  '미국': { latitude: 37.0902, longitude: -95.7129 },
  'usa': { latitude: 37.0902, longitude: -95.7129 },

  // 유럽
  '파리': { latitude: 48.8566, longitude: 2.3522 },
  'paris': { latitude: 48.8566, longitude: 2.3522 },
  '프랑스': { latitude: 46.2276, longitude: 2.2137 },
  'france': { latitude: 46.2276, longitude: 2.2137 },
  '런던': { latitude: 51.5074, longitude: -0.1278 },
  'london': { latitude: 51.5074, longitude: -0.1278 },
  '영국': { latitude: 55.3781, longitude: -3.4360 },
  'uk': { latitude: 55.3781, longitude: -3.4360 },
  '로마': { latitude: 41.9028, longitude: 12.4964 },
  'rome': { latitude: 41.9028, longitude: 12.4964 },
  '이탈리아': { latitude: 41.8719, longitude: 12.5674 },
  'italy': { latitude: 41.8719, longitude: 12.5674 },
  '베를린': { latitude: 52.5200, longitude: 13.4050 },
  'berlin': { latitude: 52.5200, longitude: 13.4050 },
  '독일': { latitude: 51.1657, longitude: 10.4515 },
  'germany': { latitude: 51.1657, longitude: 10.4515 },
  '바르셀로나': { latitude: 41.3851, longitude: 2.1734 },
  'barcelona': { latitude: 41.3851, longitude: 2.1734 },
  '마드리드': { latitude: 40.4168, longitude: -3.7038 },
  'madrid': { latitude: 40.4168, longitude: -3.7038 },
  '스페인': { latitude: 40.4637, longitude: -3.7492 },
  'spain': { latitude: 40.4637, longitude: -3.7492 },
  '암스테르담': { latitude: 52.3676, longitude: 4.9041 },
  'amsterdam': { latitude: 52.3676, longitude: 4.9041 },
  '네덜란드': { latitude: 52.1326, longitude: 5.2913 },
  'netherlands': { latitude: 52.1326, longitude: 5.2913 },
  '프라하': { latitude: 50.0755, longitude: 14.4378 },
  'prague': { latitude: 50.0755, longitude: 14.4378 },
  '체코': { latitude: 49.8175, longitude: 15.4730 },
  'czech': { latitude: 49.8175, longitude: 15.4730 },
  '취리히': { latitude: 47.3769, longitude: 8.5417 },
  'zurich': { latitude: 47.3769, longitude: 8.5417 },
  '스위스': { latitude: 46.8182, longitude: 8.2275 },
  'switzerland': { latitude: 46.8182, longitude: 8.2275 },

  // 동남아시아
  '방콕': { latitude: 13.7563, longitude: 100.5018 },
  'bangkok': { latitude: 13.7563, longitude: 100.5018 },
  '태국': { latitude: 15.8700, longitude: 100.9925 },
  'thailand': { latitude: 15.8700, longitude: 100.9925 },
  '싱가포르': { latitude: 1.3521, longitude: 103.8198 },
  'singapore': { latitude: 1.3521, longitude: 103.8198 },
  '하노이': { latitude: 21.0285, longitude: 105.8542 },
  'hanoi': { latitude: 21.0285, longitude: 105.8542 },
  '호치민': { latitude: 10.8231, longitude: 106.6297 },
  'ho chi minh': { latitude: 10.8231, longitude: 106.6297 },
  '베트남': { latitude: 14.0583, longitude: 108.2772 },
  'vietnam': { latitude: 14.0583, longitude: 108.2772 },
  '발리': { latitude: -8.3405, longitude: 115.0920 },
  'bali': { latitude: -8.3405, longitude: 115.0920 },
  '자카르타': { latitude: -6.2088, longitude: 106.8456 },
  'jakarta': { latitude: -6.2088, longitude: 106.8456 },
  '인도네시아': { latitude: -0.7893, longitude: 113.9213 },
  'indonesia': { latitude: -0.7893, longitude: 113.9213 },
  '마닐라': { latitude: 14.5995, longitude: 120.9842 },
  'manila': { latitude: 14.5995, longitude: 120.9842 },
  '필리핀': { latitude: 12.8797, longitude: 121.7740 },
  'philippines': { latitude: 12.8797, longitude: 121.7740 },
  '쿠알라룸푸르': { latitude: 3.1390, longitude: 101.6869 },
  'kuala lumpur': { latitude: 3.1390, longitude: 101.6869 },
  '말레이시아': { latitude: 4.2105, longitude: 101.9758 },
  'malaysia': { latitude: 4.2105, longitude: 101.9758 },

  // 중화권
  '홍콩': { latitude: 22.3193, longitude: 114.1694 },
  'hong kong': { latitude: 22.3193, longitude: 114.1694 },
  '타이베이': { latitude: 25.0330, longitude: 121.5654 },
  'taipei': { latitude: 25.0330, longitude: 121.5654 },
  '대만': { latitude: 23.6978, longitude: 120.9605 },
  'taiwan': { latitude: 23.6978, longitude: 120.9605 },
  '상하이': { latitude: 31.2304, longitude: 121.4737 },
  'shanghai': { latitude: 31.2304, longitude: 121.4737 },
  '베이징': { latitude: 39.9042, longitude: 116.4074 },
  'beijing': { latitude: 39.9042, longitude: 116.4074 },
  '중국': { latitude: 35.8617, longitude: 104.1954 },
  'china': { latitude: 35.8617, longitude: 104.1954 },
  '마카오': { latitude: 22.1987, longitude: 113.5439 },
  'macau': { latitude: 22.1987, longitude: 113.5439 },

  // 오세아니아
  '시드니': { latitude: -33.8688, longitude: 151.2093 },
  'sydney': { latitude: -33.8688, longitude: 151.2093 },
  '멜버른': { latitude: -37.8136, longitude: 144.9631 },
  'melbourne': { latitude: -37.8136, longitude: 144.9631 },
  '호주': { latitude: -25.2744, longitude: 133.7751 },
  'australia': { latitude: -25.2744, longitude: 133.7751 },
  '오클랜드': { latitude: -36.8509, longitude: 174.7645 },
  'auckland': { latitude: -36.8509, longitude: 174.7645 },
  '뉴질랜드': { latitude: -40.9006, longitude: 174.8860 },
  'new zealand': { latitude: -40.9006, longitude: 174.8860 },

  // 기타
  '두바이': { latitude: 25.2048, longitude: 55.2708 },
  'dubai': { latitude: 25.2048, longitude: 55.2708 },
  '캐나다': { latitude: 56.1304, longitude: -106.3468 },
  'canada': { latitude: 56.1304, longitude: -106.3468 },
  '밴쿠버': { latitude: 49.2827, longitude: -123.1207 },
  'vancouver': { latitude: 49.2827, longitude: -123.1207 },
  '토론토': { latitude: 43.6532, longitude: -79.3832 },
  'toronto': { latitude: 43.6532, longitude: -79.3832 },
};

/**
 * 도시명 또는 국가명으로 좌표를 검색합니다.
 * @param name 도시명 또는 국가명 (한글/영어)
 * @returns 좌표 또는 null (찾지 못한 경우)
 */
export function getCoordinates(name: string): CityCoordinates | null {
  if (!name) return null;

  const normalizedName = name.toLowerCase().trim();

  // 정확히 일치하는 경우
  if (CITY_COORDINATES[normalizedName]) {
    return CITY_COORDINATES[normalizedName];
  }

  // 한글 이름으로 검색
  if (CITY_COORDINATES[name]) {
    return CITY_COORDINATES[name];
  }

  // 부분 일치 검색 (예: "도쿄시" → "도쿄")
  for (const key of Object.keys(CITY_COORDINATES)) {
    if (normalizedName.includes(key) || key.includes(normalizedName)) {
      return CITY_COORDINATES[key];
    }
  }

  return null;
}

/**
 * 국가명과 도시명으로 좌표를 검색합니다.
 * 도시명 우선, 없으면 국가명으로 검색
 * @param country 국가명
 * @param city 도시명 (선택)
 * @returns 좌표 또는 null
 */
export function getCoordinatesForDestination(
  country: string,
  city?: string
): CityCoordinates | null {
  // 도시명이 있으면 도시명 우선 검색
  if (city) {
    const cityCoords = getCoordinates(city);
    if (cityCoords) return cityCoords;
  }

  // 도시명으로 못 찾으면 국가명으로 검색
  return getCoordinates(country);
}

/**
 * 좌표 데이터가 있는지 확인합니다.
 */
export function hasCoordinates(name: string): boolean {
  return getCoordinates(name) !== null;
}
