import React from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
} from 'react-native';
import { Colors, FontSizes, Fonts, MinTouchTarget, Radii, Spacing } from '@/constants/theme';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isMono?: boolean;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  isMono = false,
  style,
  ...props
}) => {
  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TextInput
        style={[
          styles.input,
          isMono && styles.monoFont,
          error ? styles.inputError : null,
          style,
        ]}
        placeholderTextColor={Colors.textFaint}
        {...props}
      />
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.p16,
    width: '100%',
  },
  label: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  input: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.p16,
    paddingVertical: Spacing.p12,
    fontSize: FontSizes.base,
    minHeight: MinTouchTarget,
  },
  monoFont: {
    fontFamily: Fonts.mono,
  },
  inputError: {
    borderColor: Colors.error,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.p4,
  },
});
