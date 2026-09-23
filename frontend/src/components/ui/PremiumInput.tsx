import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View, Platform } from 'react-native';
import Svg, { Path } from 'react-native-svg';

export interface PremiumInputProps extends TextInputProps {
  label: string;
  isOptional?: boolean;
  isRequired?: boolean;
  error?: string;
  icon?: React.ReactNode;
  isValid?: boolean;
  containerStyle?: any;
}

const CheckMarkIcon = ({ color = '#16A34A', size = 16 }: { color?: string; size?: number }) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
);

export const PremiumInput: React.FC<PremiumInputProps> = ({
  label,
  isOptional = false,
  isRequired = false,
  error,
  icon,
  isValid,
  containerStyle,
  style,
  onFocus,
  onBlur,
  value,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const hasValue = Boolean(value && String(value).trim().length > 0);
  const showValid = isValid || (hasValue && !error && isRequired);

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {/* Label Row */}
      <View style={styles.labelRow}>
        <Text style={styles.label}>
          {label} {isRequired ? <Text style={styles.requiredStar}>*</Text> : null}
        </Text>
        {isOptional ? (
          <View style={styles.optionalBadge}>
            <Text style={styles.optionalBadgeText}>OPTIONAL</Text>
          </View>
        ) : null}
      </View>

      {/* Input Box */}
      <View
        style={[
          styles.inputBox,
          isFocused && styles.inputBoxFocused,
          error ? styles.inputBoxError : null,
          showValid && !isFocused ? styles.inputBoxValid : null,
        ]}>
        {icon ? <View style={styles.iconSlot}>{icon}</View> : null}

        <TextInput
          style={[styles.input, style]}
          placeholderTextColor="#94A3B8"
          value={value}
          onFocus={handleFocus}
          onBlur={handleBlur}
          accessibilityLabel={label}
          {...rest}
        />

        {showValid && !error ? (
          <View style={styles.validSlot}>
            <CheckMarkIcon color="#16A34A" size={16} />
          </View>
        ) : null}
      </View>

      {/* Validation Error Message */}
      {error ? <Text style={styles.errorText}>⚠️ {error}</Text> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginVertical: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '700',
    color: '#374151',
    letterSpacing: -0.1,
  },
  requiredStar: {
    color: '#EF4444',
  },
  optionalBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    backgroundColor: '#F4EEFF',
  },
  optionalBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#8B5CF6',
    letterSpacing: 0.4,
  },
  inputBox: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E5EAF2',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    ...Platform.select({
      ios: {
        shadowColor: '#0F172A',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.02,
        shadowRadius: 4,
      },
      android: {},
    }),
  },
  inputBoxFocused: {
    backgroundColor: '#FFFFFF',
    borderColor: '#2563EB',
    borderWidth: 2,
    ...Platform.select({
      ios: {
        shadowColor: '#2563EB',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: {
        elevation: 3,
      },
    }),
  },
  inputBoxError: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
    borderWidth: 1.5,
  },
  inputBoxValid: {
    borderColor: '#86EFAC',
    backgroundColor: '#F0FDF4',
  },
  iconSlot: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    flex: 1,
    height: '100%',
    fontSize: 14.5,
    fontWeight: '600',
    color: '#111827',
    ...Platform.select({
      web: {
        outlineStyle: 'none',
      } as any,
    }),
  },
  validSlot: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#EF4444',
    marginTop: 4,
    marginLeft: 2,
  },
});
