import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, FontSizes, Fonts, MinTouchTarget, Radii, Spacing } from '@/constants/theme';

const EyeIcon = ({ visible }: { visible: boolean }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    {visible ? (
      <>
        <Path
          d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"
          stroke="#94A3C4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z"
          stroke="#94A3C4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    ) : (
      <>
        <Path
          d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"
          stroke="#94A3C4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <Path
          d="M1 1l22 22"
          stroke="#94A3C4"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </>
    )}
  </Svg>
);

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isMono?: boolean;
  showPasswordToggle?: boolean;
  rightAccessory?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  isMono = false,
  showPasswordToggle = false,
  rightAccessory,
  style,
  secureTextEntry: initialSecure = false,
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [isPasswordVisible, setIsPasswordVisible] = useState(!initialSecure);

  const isPasswordInput = showPasswordToggle || initialSecure;
  const secure = isPasswordInput ? !isPasswordVisible : initialSecure;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputWrapper,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}>
        <TextInput
          style={[
            styles.input,
            isMono ? styles.monoFont : null,
            (isPasswordInput || rightAccessory) ? styles.inputWithAccessory : null,
            style,
          ]}
          placeholderTextColor={Colors.textFaint}
          secureTextEntry={secure}
          onFocus={(e) => {
            setIsFocused(true);
            onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            onBlur?.(e);
          }}
          {...props}
        />
        {isPasswordInput && (
          <TouchableOpacity
            style={styles.accessoryBtn}
            activeOpacity={0.7}
            onPress={(e) => {
              e?.preventDefault?.();
              setIsPasswordVisible(!isPasswordVisible);
            }}>
            <EyeIcon visible={isPasswordVisible} />
          </TouchableOpacity>
        )}
        {!isPasswordInput && rightAccessory && (
          <View style={styles.accessoryBtn}>{rightAccessory}</View>
        )}
      </View>
      {error ? <Text style={styles.errorText}>{error}</Text> : null}
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
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    minHeight: MinTouchTarget,
  },
  inputFocused: {
    borderColor: Colors.primaryBlue,
    borderWidth: 1.5,
  },
  input: {
    flex: 1,
    color: Colors.textPrimary,
    paddingHorizontal: Spacing.p16,
    paddingVertical: Spacing.p12,
    fontSize: FontSizes.base,
    minHeight: MinTouchTarget,
  },
  inputWithAccessory: {
    paddingRight: 8,
  },
  accessoryBtn: {
    paddingHorizontal: Spacing.p12,
    minHeight: MinTouchTarget,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monoFont: {
    fontFamily: Fonts.mono,
  },
  inputError: {
    borderColor: Colors.error,
    borderWidth: 1.5,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.p4,
    paddingLeft: Spacing.p4,
  },
});

