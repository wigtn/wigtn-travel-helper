// Travel Helper v1.1 - New Trip Screen
// PRD v1.1: 여행 생성 화면

import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/theme';
import { useTripStore } from '../../lib/stores/tripStore';
import { Button, Input, Card, BottomSheet } from '../../components/ui';
import { CURRENCIES, POPULAR_COUNTRIES, getCurrencyInfo } from '../../lib/utils/constants';
import { formatDate, formatFullDate } from '../../lib/utils/date';
import { Destination } from '../../lib/types';

interface DestinationInput {
  country: string;
  city: string;
  currency: string;
  startDate?: Date;
  endDate?: Date;
}

export default function NewTripScreen() {
  const { colors, spacing, typography, borderRadius } = useTheme();
  const createTrip = useTripStore((state) => state.createTrip);

  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [budget, setBudget] = useState('');
  const [destinations, setDestinations] = useState<DestinationInput[]>([]);

  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [editingDestIndex, setEditingDestIndex] = useState<number | null>(null);

  // 방문지 추가/수정용 임시 상태
  const [tempCountry, setTempCountry] = useState('');
  const [tempCity, setTempCity] = useState('');
  const [tempCurrency, setTempCurrency] = useState('');

  const [loading, setLoading] = useState(false);

  const handleAddDestination = () => {
    setTempCountry('');
    setTempCity('');
    setTempCurrency('');
    setEditingDestIndex(null);
    setShowDestinationModal(true);
  };

  const handleEditDestination = (index: number) => {
    const dest = destinations[index];
    setTempCountry(dest.country);
    setTempCity(dest.city);
    setTempCurrency(dest.currency);
    setEditingDestIndex(index);
    setShowDestinationModal(true);
  };

  const handleSaveDestination = () => {
    if (!tempCountry.trim()) {
      Alert.alert('알림', '국가를 선택해주세요');
      return;
    }
    if (!tempCurrency) {
      Alert.alert('알림', '통화를 선택해주세요');
      return;
    }

    const newDest: DestinationInput = {
      country: tempCountry.trim(),
      city: tempCity.trim(),
      currency: tempCurrency,
    };

    if (editingDestIndex !== null) {
      const updated = [...destinations];
      updated[editingDestIndex] = newDest;
      setDestinations(updated);
    } else {
      setDestinations([...destinations, newDest]);
    }

    setShowDestinationModal(false);
  };

  const handleDeleteDestination = (index: number) => {
    Alert.alert('삭제', '이 방문지를 삭제하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => {
          const updated = destinations.filter((_, i) => i !== index);
          setDestinations(updated);
        },
      },
    ]);
  };

  const handlePopularCountry = (item: typeof POPULAR_COUNTRIES[0]) => {
    setTempCountry(item.country);
    setTempCurrency(item.currency);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '여행 이름을 입력해주세요');
      return;
    }
    if (destinations.length === 0) {
      Alert.alert('알림', '방문지를 최소 1개 이상 추가해주세요');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('알림', '종료일은 시작일 이후여야 합니다');
      return;
    }

    setLoading(true);
    try {
      await createTrip(
        {
          name: name.trim(),
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          budget: budget ? parseInt(budget, 10) : undefined,
        },
        destinations.map((d, i) => ({
          country: d.country,
          city: d.city || undefined,
          currency: d.currency,
          startDate: d.startDate ? formatDate(d.startDate) : undefined,
          endDate: d.endDate ? formatDate(d.endDate) : undefined,
          orderIndex: i,
        }))
      );
      router.back();
    } catch (error) {
      console.error(error);
      Alert.alert('오류', '여행 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { padding: spacing.base }]}
      showsVerticalScrollIndicator={false}
    >
      {/* 여행 이름 */}
      <Input
        label="여행 이름"
        placeholder="예: 유럽 배낭여행"
        value={name}
        onChangeText={setName}
      />

      {/* 여행 기간 */}
      <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm }]}>
        여행 기간
      </Text>
      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.md },
            ]}
            onPress={() => setShowStartPicker(true)}
          >
            <MaterialIcons name="calendar-today" size={18} color={colors.textSecondary} />
            <Text style={[typography.bodyMedium, { color: colors.text, marginLeft: spacing.sm }]}>
              {formatFullDate(startDate)}
            </Text>
          </TouchableOpacity>
        </View>
        <MaterialIcons name="arrow-forward" size={20} color={colors.textTertiary} />
        <View style={styles.dateItem}>
          <TouchableOpacity
            style={[
              styles.dateButton,
              { backgroundColor: colors.surface, borderColor: colors.border, borderRadius: borderRadius.md },
            ]}
            onPress={() => setShowEndPicker(true)}
          >
            <MaterialIcons name="calendar-today" size={18} color={colors.textSecondary} />
            <Text style={[typography.bodyMedium, { color: colors.text, marginLeft: spacing.sm }]}>
              {formatFullDate(endDate)}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {(showStartPicker || showEndPicker) && (
        <DateTimePicker
          value={showStartPicker ? startDate : endDate}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={(event, date) => {
            if (Platform.OS === 'android') {
              setShowStartPicker(false);
              setShowEndPicker(false);
            }
            if (date) {
              if (showStartPicker) {
                setStartDate(date);
                setShowStartPicker(false);
              } else {
                setEndDate(date);
                setShowEndPicker(false);
              }
            }
          }}
        />
      )}

      {/* 예산 */}
      <Input
        label="예산 (선택)"
        placeholder="원화 금액 입력"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
        leftElement={<Text style={{ color: colors.textSecondary }}>₩</Text>}
      />

      {/* 방문지 */}
      <View style={{ marginTop: spacing.md }}>
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm }]}>
          방문지
        </Text>

        {destinations.map((dest, index) => {
          const currencyInfo = getCurrencyInfo(dest.currency);
          return (
            <Card
              key={index}
              variant="outlined"
              style={{ marginBottom: spacing.sm }}
            >
              <View style={styles.destRow}>
                <Text style={styles.destFlag}>{currencyInfo?.flag}</Text>
                <View style={styles.destInfo}>
                  <Text style={[typography.titleSmall, { color: colors.text }]}>
                    {dest.city ? `${dest.country} · ${dest.city}` : dest.country}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {currencyInfo?.name || dest.currency}
                  </Text>
                </View>
                <View style={styles.destActions}>
                  <TouchableOpacity
                    onPress={() => handleEditDestination(index)}
                    style={styles.destAction}
                  >
                    <MaterialIcons name="edit" size={20} color={colors.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => handleDeleteDestination(index)}
                    style={styles.destAction}
                  >
                    <MaterialIcons name="close" size={20} color={colors.error} />
                  </TouchableOpacity>
                </View>
              </View>
            </Card>
          );
        })}

        <Button
          title="방문지 추가"
          onPress={handleAddDestination}
          variant="outline"
          icon="add"
          fullWidth
        />
      </View>

      {/* 제출 버튼 */}
      <Button
        title="여행 만들기"
        onPress={handleSubmit}
        loading={loading}
        fullWidth
        style={{ marginTop: spacing.xl }}
      />

      {/* 방문지 추가 모달 */}
      <BottomSheet
        visible={showDestinationModal}
        onClose={() => setShowDestinationModal(false)}
        title={editingDestIndex !== null ? '방문지 수정' : '방문지 추가'}
      >
        {/* 자주 가는 국가 */}
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm }]}>
          자주 가는 국가
        </Text>
        <View style={styles.popularGrid}>
          {POPULAR_COUNTRIES.map((item) => (
            <TouchableOpacity
              key={item.country}
              style={[
                styles.popularItem,
                {
                  backgroundColor: tempCountry === item.country ? colors.primaryLight : colors.surface,
                  borderColor: tempCountry === item.country ? colors.primary : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => handlePopularCountry(item)}
            >
              <Text style={styles.popularFlag}>{item.flag}</Text>
              <Text
                style={[
                  typography.labelSmall,
                  { color: tempCountry === item.country ? colors.primary : colors.text },
                ]}
              >
                {item.country}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 국가 직접 입력 */}
        <Input
          label="국가"
          placeholder="국가명 입력"
          value={tempCountry}
          onChangeText={setTempCountry}
          containerStyle={{ marginTop: spacing.md }}
        />

        {/* 도시 */}
        <Input
          label="도시 (선택)"
          placeholder="예: 파리"
          value={tempCity}
          onChangeText={setTempCity}
        />

        {/* 통화 선택 */}
        <Text style={[typography.labelMedium, { color: colors.text, marginBottom: spacing.sm }]}>
          통화
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: spacing.md }}
        >
          {CURRENCIES.slice(0, 12).map((c) => (
            <TouchableOpacity
              key={c.code}
              style={[
                styles.currencyChip,
                {
                  backgroundColor: tempCurrency === c.code ? colors.primaryLight : colors.surface,
                  borderColor: tempCurrency === c.code ? colors.primary : colors.border,
                  borderRadius: borderRadius.md,
                },
              ]}
              onPress={() => setTempCurrency(c.code)}
            >
              <Text style={styles.currencyFlag}>{c.flag}</Text>
              <Text
                style={[
                  typography.labelSmall,
                  { color: tempCurrency === c.code ? colors.primary : colors.text },
                ]}
              >
                {c.code}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button
          title={editingDestIndex !== null ? '수정' : '추가'}
          onPress={handleSaveDestination}
          fullWidth
        />
      </BottomSheet>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    paddingBottom: 40,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    paddingHorizontal: 12,
    borderWidth: 1,
  },
  destRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  destFlag: {
    fontSize: 28,
    marginRight: 12,
  },
  destInfo: {
    flex: 1,
  },
  destActions: {
    flexDirection: 'row',
    gap: 8,
  },
  destAction: {
    padding: 4,
  },
  popularGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    gap: 6,
  },
  popularFlag: {
    fontSize: 18,
  },
  currencyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    marginRight: 8,
    gap: 4,
  },
  currencyFlag: {
    fontSize: 16,
  },
});
