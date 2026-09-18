import React, { useRef } from 'react';
import { Platform, StyleSheet, TextInput, View } from 'react-native';
import { Colors, FontSizes, Radii, Spacing } from '@/constants/theme';

type OtpInputProps = {
  value: string;
  onChange: (code: string) => void;
  error?: boolean;
};

export function OtpInput({ value, onChange, error }: OtpInputProps) {
  const refs = useRef<Array<TextInput | null>>([]);
  const digits = Array.from({ length: 6 }, (_, i) => value[i] || '');

  const setDigit = (index: number, raw: string) => {
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = cleaned.slice(0, 6);
      onChange(next);
      const focusIndex = Math.min(next.length, 5);
      refs.current[focusIndex]?.focus();
      return;
    }

    const chars = digits.slice();
    chars[index] = cleaned;
    const next = chars.join('').slice(0, 6);
    onChange(next);
    if (cleaned && index < 5) {
      refs.current[index + 1]?.focus();
    }
  };

  return (
    <View style={styles.row}>
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(el) => {
            refs.current[index] = el;
          }}
          value={digit}
          onChangeText={(text) => setDigit(index, text)}
          onKeyPress={({ nativeEvent }) => {
            if (nativeEvent.key === 'Backspace' && !digits[index] && index > 0) {
              refs.current[index - 1]?.focus();
            }
          }}
          keyboardType="number-pad"
          maxLength={index === 0 ? 6 : 1}
          style={[styles.box, error && styles.boxError]}
          textAlign="center"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          importantForAutofill={index === 0 ? 'yes' : 'no'}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: Spacing.p8,
    marginBottom: Spacing.p16,
  },
  box: {
    flex: 1,
    minHeight: 52,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radii.small,
    backgroundColor: Colors.surface,
    color: Colors.textPrimary,
    fontSize: FontSizes.xl,
    fontWeight: '700',
    ...(Platform.OS === 'web' ? ({ outlineStyle: 'none' } as object) : null),
  },
  boxError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
});
