// Main Screen Revamp - Calculator Modal
// PRD FR-401~FR-410: 내장 계산기 + 통화 선택

import { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
} from 'react-native';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../lib/theme';
import { useTripStore } from '../lib/stores/tripStore';
import { useExchangeRateStore } from '../lib/stores/exchangeRateStore';
import { useSettingsStore } from '../lib/stores/settingsStore';
import { formatKRW, getCurrencySymbol } from '../lib/utils/currency';
import { getCountryFlag, getCurrencyInfo } from '../lib/utils/constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const BUTTON_GAP = 8;
const BUTTON_SIZE = (SCREEN_WIDTH - 32 - BUTTON_GAP * 3) / 4;

type Operator = '+' | '-' | '×' | '÷' | null;

export default function CalculatorScreen() {
  const insets = useSafeAreaInsets();
  const { colors, spacing, typography, borderRadius } = useTheme();
  const { activeTrip, destinations } = useTripStore();
  const { convert } = useExchangeRateStore();
  const { hapticEnabled } = useSettingsStore();

  // Get available currencies from trip destinations
  const availableCurrencies = useMemo(() => {
    if (!activeTrip) return ['KRW'];
    const tripDests = destinations.filter((d) => d.tripId === activeTrip.id);
    const currencies = [...new Set(tripDests.map((d) => d.currency))];
    return currencies.length > 0 ? currencies : ['KRW'];
  }, [activeTrip, destinations]);

  // Find current destination's currency
  const defaultCurrency = useMemo(() => {
    if (!activeTrip) return 'KRW';
    const today = new Date().toISOString().split('T')[0];
    const tripDests = destinations.filter((d) => d.tripId === activeTrip.id);
    const current = tripDests.find(
      (d) => d.startDate && d.endDate && d.startDate <= today && d.endDate >= today
    );
    return current?.currency || tripDests[0]?.currency || 'KRW';
  }, [activeTrip, destinations]);

  const [display, setDisplay] = useState('0');
  const [previousValue, setPreviousValue] = useState<number | null>(null);
  const [operator, setOperator] = useState<Operator>(null);
  const [waitingForOperand, setWaitingForOperand] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(defaultCurrency);
  const [showCurrencyPicker, setShowCurrencyPicker] = useState(false);

  const triggerHaptic = useCallback(() => {
    if (hapticEnabled) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  }, [hapticEnabled]);

  // Calculate KRW equivalent
  const krwAmount = useMemo(() => {
    const value = parseFloat(display.replace(/,/g, '')) || 0;
    if (selectedCurrency === 'KRW') return value;
    return convert(value, selectedCurrency);
  }, [display, selectedCurrency, convert]);

  // Format display with commas
  const formatDisplay = (value: string): string => {
    const num = parseFloat(value);
    if (isNaN(num)) return '0';

    const parts = value.split('.');
    if (parts.length === 2) {
      const intPart = parseInt(parts[0]).toLocaleString();
      return `${intPart}.${parts[1]}`;
    }
    return num.toLocaleString();
  };

  const inputDigit = (digit: string) => {
    triggerHaptic();

    if (waitingForOperand) {
      setDisplay(digit);
      setWaitingForOperand(false);
    } else {
      const currentValue = display.replace(/,/g, '');
      if (currentValue === '0' && digit !== '.') {
        setDisplay(digit);
      } else if (currentValue.length < 12) {
        setDisplay(currentValue + digit);
      }
    }
  };

  const inputDecimal = () => {
    triggerHaptic();

    if (waitingForOperand) {
      setDisplay('0.');
      setWaitingForOperand(false);
      return;
    }

    const currentValue = display.replace(/,/g, '');
    if (!currentValue.includes('.')) {
      setDisplay(currentValue + '.');
    }
  };

  const performOperation = (nextOperator: Operator) => {
    triggerHaptic();

    const inputValue = parseFloat(display.replace(/,/g, ''));

    if (previousValue === null) {
      setPreviousValue(inputValue);
    } else if (operator) {
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(result);
    }

    setWaitingForOperand(true);
    setOperator(nextOperator);
  };

  const calculate = (left: number, right: number, op: Operator): number => {
    switch (op) {
      case '+':
        return left + right;
      case '-':
        return left - right;
      case '×':
        return left * right;
      case '÷':
        return right !== 0 ? left / right : 0;
      default:
        return right;
    }
  };

  const handleEquals = () => {
    triggerHaptic();

    if (operator && previousValue !== null) {
      const inputValue = parseFloat(display.replace(/,/g, ''));
      const result = calculate(previousValue, inputValue, operator);
      setDisplay(String(result));
      setPreviousValue(null);
      setOperator(null);
      setWaitingForOperand(true);
    }
  };

  const handleClear = () => {
    triggerHaptic();
    setDisplay('0');
    setPreviousValue(null);
    setOperator(null);
    setWaitingForOperand(false);
  };

  const handleDelete = () => {
    triggerHaptic();
    const currentValue = display.replace(/,/g, '');
    if (currentValue.length > 1) {
      setDisplay(currentValue.slice(0, -1));
    } else {
      setDisplay('0');
    }
  };

  const handlePercent = () => {
    triggerHaptic();
    const value = parseFloat(display.replace(/,/g, ''));
    setDisplay(String(value / 100));
  };

  const selectCurrency = (currency: string) => {
    triggerHaptic();
    setSelectedCurrency(currency);
    setShowCurrencyPicker(false);
  };

  // Button component
  const CalcButton = ({
    label,
    onPress,
    variant = 'number',
    wide = false,
  }: {
    label: string;
    onPress: () => void;
    variant?: 'number' | 'operator' | 'function' | 'equals';
    wide?: boolean;
  }) => {
    const getButtonStyle = () => {
      switch (variant) {
        case 'operator':
          return { backgroundColor: colors.secondary };
        case 'function':
          return { backgroundColor: colors.surface };
        case 'equals':
          return { backgroundColor: colors.primary };
        default:
          return { backgroundColor: colors.surfaceElevated };
      }
    };

    const getTextColor = () => {
      switch (variant) {
        case 'operator':
        case 'equals':
          return 'white';
        default:
          return colors.text;
      }
    };

    return (
      <TouchableOpacity
        style={[
          styles.button,
          getButtonStyle(),
          {
            borderRadius: borderRadius.md,
            width: wide ? BUTTON_SIZE * 2 + BUTTON_GAP : BUTTON_SIZE,
            height: BUTTON_SIZE * 0.7,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
        accessibilityLabel={label}
      >
        <Text style={[styles.buttonText, { color: getTextColor() }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const currencyInfo = getCurrencyInfo(selectedCurrency);
  const currencySymbol = getCurrencySymbol(selectedCurrency);

  return (
    <View style={[styles.container, { backgroundColor: colors.background, paddingTop: insets.top }]}>
      {/* 커스텀 헤더 */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.headerButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[typography.titleMedium, { color: colors.text }]}>계산기</Text>
        <View style={styles.headerButton} />
      </View>

      <View style={styles.content}>
        {/* Currency Selector */}
        <TouchableOpacity
          style={[styles.currencySelector, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}
          onPress={() => setShowCurrencyPicker(!showCurrencyPicker)}
          accessibilityLabel="통화 선택"
        >
          <Text style={[typography.bodyMedium, { color: colors.textSecondary }]}>
            통화:
          </Text>
          <View style={styles.currencyBadge}>
            {currencyInfo && (
              <Text style={{ fontSize: 16, marginRight: 4 }}>
                {getCountryFlag(currencyInfo.country)}
              </Text>
            )}
            <Text style={[typography.titleSmall, { color: colors.text }]}>
              {selectedCurrency} ({currencySymbol})
            </Text>
            <MaterialIcons
              name={showCurrencyPicker ? 'expand-less' : 'expand-more'}
              size={20}
              color={colors.textSecondary}
            />
          </View>
        </TouchableOpacity>

        {/* Currency Picker Dropdown */}
        {showCurrencyPicker && (
          <View style={[styles.currencyPicker, { backgroundColor: colors.surface, borderRadius: borderRadius.md }]}>
            <ScrollView style={{ maxHeight: 150 }} showsVerticalScrollIndicator={false}>
              {availableCurrencies.map((currency) => {
                const info = getCurrencyInfo(currency);
                const isSelected = currency === selectedCurrency;
                return (
                  <TouchableOpacity
                    key={currency}
                    style={[
                      styles.currencyOption,
                      isSelected && { backgroundColor: colors.primaryLight },
                    ]}
                    onPress={() => selectCurrency(currency)}
                  >
                    {info && (
                      <Text style={{ fontSize: 20, marginRight: 8 }}>
                        {getCountryFlag(info.country)}
                      </Text>
                    )}
                    <Text style={[typography.bodyMedium, { color: colors.text, flex: 1 }]}>
                      {currency}
                    </Text>
                    <Text style={[typography.bodySmall, { color: colors.textSecondary }]}>
                      {getCurrencySymbol(currency)}
                    </Text>
                    {isSelected && (
                      <MaterialIcons name="check" size={20} color={colors.primary} style={{ marginLeft: 8 }} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Display Area */}
        <View style={[styles.displayArea, { backgroundColor: colors.surface, borderRadius: borderRadius.lg }]}>
          <Text
            style={[styles.displayText, { color: colors.text }]}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {currencySymbol} {formatDisplay(display)}
          </Text>
          {selectedCurrency !== 'KRW' && (
            <Text style={[styles.krwText, { color: colors.primary }]}>
              ≈ {formatKRW(krwAmount)}
            </Text>
          )}
        </View>

        {/* Keypad */}
        <View style={styles.keypad}>
          {/* Row 1 */}
          <View style={styles.row}>
            <CalcButton label="AC" onPress={handleClear} variant="function" />
            <CalcButton label="⌫" onPress={handleDelete} variant="function" />
            <CalcButton label="%" onPress={handlePercent} variant="function" />
            <CalcButton label="÷" onPress={() => performOperation('÷')} variant="operator" />
          </View>

          {/* Row 2 */}
          <View style={styles.row}>
            <CalcButton label="7" onPress={() => inputDigit('7')} />
            <CalcButton label="8" onPress={() => inputDigit('8')} />
            <CalcButton label="9" onPress={() => inputDigit('9')} />
            <CalcButton label="×" onPress={() => performOperation('×')} variant="operator" />
          </View>

          {/* Row 3 */}
          <View style={styles.row}>
            <CalcButton label="4" onPress={() => inputDigit('4')} />
            <CalcButton label="5" onPress={() => inputDigit('5')} />
            <CalcButton label="6" onPress={() => inputDigit('6')} />
            <CalcButton label="-" onPress={() => performOperation('-')} variant="operator" />
          </View>

          {/* Row 4 */}
          <View style={styles.row}>
            <CalcButton label="1" onPress={() => inputDigit('1')} />
            <CalcButton label="2" onPress={() => inputDigit('2')} />
            <CalcButton label="3" onPress={() => inputDigit('3')} />
            <CalcButton label="+" onPress={() => performOperation('+')} variant="operator" />
          </View>

          {/* Row 5 */}
          <View style={styles.row}>
            <CalcButton label="0" onPress={() => inputDigit('0')} wide />
            <CalcButton label="." onPress={inputDecimal} />
            <CalcButton label="=" onPress={handleEquals} variant="equals" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  currencySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    marginBottom: 8,
  },
  currencyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencyPicker: {
    marginBottom: 8,
    overflow: 'hidden',
  },
  currencyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  displayArea: {
    padding: 20,
    marginBottom: 16,
    minHeight: 100,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  displayText: {
    fontSize: 40,
    fontWeight: '300',
    fontVariant: ['tabular-nums'],
  },
  krwText: {
    fontSize: 16,
    marginTop: 8,
  },
  keypad: {
    flex: 1,
    justifyContent: 'flex-end',
    gap: BUTTON_GAP,
    paddingBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: BUTTON_GAP,
  },
  button: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '500',
  },
});
