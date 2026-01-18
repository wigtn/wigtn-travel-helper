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
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../../lib/hooks/useTheme';
import { useTripStore } from '../../lib/stores/tripStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { CURRENCIES } from '../../lib/utils/constants';
import { formatDate, formatFullDate } from '../../lib/utils/date';

export default function NewTripScreen() {
  const { colors } = useTheme();
  const createTrip = useTripStore((state) => state.createTrip);

  const [name, setName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000));
  const [budget, setBudget] = useState('');
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCurrencySelect = (currencyItem: (typeof CURRENCIES)[0]) => {
    setCurrency(currencyItem.code);
    setCountry(currencyItem.name.split(' ')[0]); // 첫 번째 단어를 국가명으로
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('알림', '여행 이름을 입력해주세요');
      return;
    }
    if (!currency) {
      Alert.alert('알림', '통화를 선택해주세요');
      return;
    }
    if (startDate > endDate) {
      Alert.alert('알림', '종료일은 시작일 이후여야 합니다');
      return;
    }

    setLoading(true);
    try {
      await createTrip({
        name: name.trim(),
        country: country || currency,
        currency,
        startDate: formatDate(startDate),
        endDate: formatDate(endDate),
        budget: budget ? parseInt(budget, 10) : undefined,
      });
      router.back();
    } catch (error) {
      console.log(error);
      
      Alert.alert('오류', '여행 생성에 실패했습니다');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
    >
      <Input
        label="여행 이름"
        placeholder="예: 도쿄 여행"
        value={name}
        onChangeText={setName}
      />

      <Text style={[styles.label, { color: colors.text }]}>통화 선택</Text>
      <View style={styles.currencyGrid}>
        {CURRENCIES.map((c) => (
          <TouchableOpacity
            key={c.code}
            style={[
              styles.currencyItem,
              {
                backgroundColor: currency === c.code ? colors.primary : colors.surface,
                borderColor: currency === c.code ? colors.primary : colors.border,
              },
            ]}
            onPress={() => handleCurrencySelect(c)}
          >
            <Text style={styles.currencyFlag}>{c.flag}</Text>
            <Text
              style={[
                styles.currencyCode,
                { color: currency === c.code ? '#FFFFFF' : colors.text },
              ]}
            >
              {c.code}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.dateRow}>
        <View style={styles.dateItem}>
          <Text style={[styles.label, { color: colors.text }]}>시작일</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowStartPicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
              {formatFullDate(startDate)}
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dateItem}>
          <Text style={[styles.label, { color: colors.text }]}>종료일</Text>
          <TouchableOpacity
            style={[styles.dateButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={() => setShowEndPicker(true)}
          >
            <Text style={[styles.dateText, { color: colors.text }]}>
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

      <Input
        label="예산 (선택)"
        placeholder="원화 금액 입력"
        value={budget}
        onChangeText={setBudget}
        keyboardType="numeric"
      />

      <Button
        title="여행 만들기"
        onPress={handleSubmit}
        loading={loading}
        style={styles.submitButton}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
    gap: 8,
  },
  currencyItem: {
    width: '22%',
    aspectRatio: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencyFlag: {
    fontSize: 24,
  },
  currencyCode: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  dateItem: {
    flex: 1,
  },
  dateButton: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateText: {
    fontSize: 14,
  },
  submitButton: {
    marginTop: 24,
  },
});
