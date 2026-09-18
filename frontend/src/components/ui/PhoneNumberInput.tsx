import React, { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  COUNTRY_OPTIONS,
  DEFAULT_PHONE_COUNTRY,
  formatNational,
  isValidE164,
  parseE164,
  toE164,
  type CountryOption,
} from '@/utils/phone';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';
import type { CountryCode } from 'libphonenumber-js';

type PhoneNumberInputProps = {
  label?: string;
  error?: string;
  value?: string;
  onChangePhone: (e164: string, meta: { isValid: boolean; country: CountryCode }) => void;
  defaultCountry?: CountryCode;
  placeholder?: string;
  colors?: {
    text?: string;
    muted?: string;
    faint?: string;
    border?: string;
    background?: string;
    accent?: string;
    error?: string;
  };
};

export function PhoneNumberInput({
  label = 'Phone Number',
  error,
  value,
  onChangePhone,
  defaultCountry = DEFAULT_PHONE_COUNTRY,
  placeholder = '77 123 4567',
  colors,
}: PhoneNumberInputProps) {
  const palette = {
    text: colors?.text ?? Colors.textPrimary,
    muted: colors?.muted ?? Colors.textDim,
    faint: colors?.faint ?? Colors.textFaint,
    border: colors?.border ?? Colors.border,
    background: colors?.background ?? Colors.surface,
    accent: colors?.accent ?? Colors.primaryBlue,
    error: colors?.error ?? Colors.error,
  };

  const parsedValue = value ? parseE164(value) : null;
  const [country, setCountry] = useState<CountryCode>(parsedValue?.country || defaultCountry);
  const [national, setNational] = useState(parsedValue?.national || '');
  const [pickerOpen, setPickerOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!value || !isValidE164(value)) {
      return;
    }
    const parsed = parseE164(value);
    if (!parsed) {
      return;
    }
    const current = toE164(national, country);
    if (parsed.e164 !== current) {
      setCountry(parsed.country);
      setNational(parsed.national);
    }
  }, [value]);

  const selected = useMemo(
    () => COUNTRY_OPTIONS.find((item) => item.code === country) || COUNTRY_OPTIONS[0],
    [country]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return COUNTRY_OPTIONS;
    return COUNTRY_OPTIONS.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.dial.includes(q) ||
        item.code.toLowerCase().includes(q)
    );
  }, [query]);

  const emit = (nextNational: string, nextCountry: CountryCode) => {
    const e164 = toE164(nextNational, nextCountry);
    onChangePhone(e164, {
      isValid: e164.length === 0 ? false : isValidE164(e164),
      country: nextCountry,
    });
  };

  const selectCountry = (item: CountryOption) => {
    setCountry(item.code);
    setPickerOpen(false);
    setQuery('');
    emit(national, item.code);
  };

  return (
    <View style={styles.container}>
      {label ? <Text style={[styles.label, { color: palette.muted }]}>{label}</Text> : null}
      <View
        style={[
          styles.row,
          {
            backgroundColor: palette.background,
            borderColor: error ? palette.error : focused ? palette.accent : palette.border,
            borderWidth: error || focused ? 1.5 : 1,
          },
        ]}>
        <TouchableOpacity
          style={styles.countryBtn}
          onPress={() => setPickerOpen(true)}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Select country">
          <Text style={styles.flag}>{selected.flag}</Text>
          <Text style={[styles.dial, { color: palette.text }]}>{selected.dial}</Text>
          <Text style={[styles.caret, { color: palette.faint }]}>▾</Text>
        </TouchableOpacity>
        <TextInput
          style={[styles.input, { color: palette.text }]}
          value={formatNational(national, country)}
          onChangeText={(text) => {
            const digits = text.replace(/\D/g, '');
            setNational(digits);
            emit(digits, country);
          }}
          placeholder={placeholder}
          placeholderTextColor={palette.faint}
          keyboardType="phone-pad"
          autoCorrect={false}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>
      {error ? <Text style={[styles.errorText, { color: palette.error }]}>{error}</Text> : null}

      <Modal visible={pickerOpen} animationType="slide" transparent onRequestClose={() => setPickerOpen(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: palette.background }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: palette.text }]}>Select country</Text>
              <TouchableOpacity onPress={() => setPickerOpen(false)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={[styles.closeText, { color: palette.accent }]}>Done</Text>
              </TouchableOpacity>
            </View>
            <TextInput
              style={[
                styles.search,
                { color: palette.text, borderColor: palette.border, backgroundColor: palette.background },
              ]}
              value={query}
              onChangeText={setQuery}
              placeholder="Search country or code"
              placeholderTextColor={palette.faint}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              initialNumToRender={20}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.countryRow} onPress={() => selectCountry(item)} activeOpacity={0.7}>
                  <Text style={styles.flag}>{item.flag}</Text>
                  <Text style={[styles.countryName, { color: palette.text }]} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={[styles.countryDial, { color: palette.muted }]}>{item.dial}</Text>
                </TouchableOpacity>
              )}
            />
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.p16,
    width: '100%',
    zIndex: 2,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: Radii.small,
    minHeight: MinTouchTarget,
    overflow: 'hidden',
  },
  countryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.p12,
    minHeight: MinTouchTarget,
    gap: 6,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  flag: {
    fontSize: 18,
  },
  dial: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  caret: {
    fontSize: 12,
  },
  input: {
    flex: 1,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p12,
    fontSize: FontSizes.base,
    minHeight: MinTouchTarget,
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  errorText: {
    fontSize: FontSizes.xs,
    marginTop: Spacing.p4,
    paddingLeft: Spacing.p4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    maxHeight: '80%',
    borderTopLeftRadius: Radii.large,
    borderTopRightRadius: Radii.large,
    padding: Spacing.p16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.p12,
  },
  modalTitle: {
    fontSize: FontSizes.lg,
    fontWeight: '700',
  },
  closeText: {
    fontSize: FontSizes.sm,
    fontWeight: '700',
  },
  search: {
    borderWidth: 1,
    borderRadius: Radii.small,
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p10,
    marginBottom: Spacing.p8,
    fontSize: FontSizes.sm,
  },
  countryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    minHeight: MinTouchTarget,
  },
  countryName: {
    flex: 1,
    fontSize: FontSizes.sm,
    fontWeight: '600',
  },
  countryDial: {
    fontSize: FontSizes.sm,
  },
});
