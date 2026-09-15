import React, { useState } from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';

interface PasswordFieldProps extends Omit<TextInputProps, 'secureTextEntry' | 'value' | 'onChangeText'> {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (value: string) => void;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
}

const EyeIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z"
      stroke={Colors.primaryBlue}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"
      stroke={Colors.primaryBlue}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const EyeSlashIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88"
      stroke={Colors.primaryBlue}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const PasswordField: React.FC<PasswordFieldProps> = ({
  label,
  error,
  value,
  onChangeText,
  containerStyle,
  wrapperStyle,
  style,
  placeholder = '••••••••',
  ...inputProps
}) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={[styles.wrapper, error && styles.wrapperError, wrapperStyle]}>
        <TextInput
          {...inputProps}
          style={[styles.input, style]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={Colors.textFaint}
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="password"
          textContentType="password"
        />
        <TouchableOpacity
          accessibilityLabel={showPassword ? 'Hide password' : 'Show password'}
          accessibilityRole="button"
          activeOpacity={0.7}
          style={styles.iconButton}
          onPress={() => setShowPassword((visible) => !visible)}>
          {showPassword ? <EyeSlashIcon /> : <EyeIcon />}
        </TouchableOpacity>
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: Spacing.p16,
  },
  label: {
    color: Colors.textDim,
    fontSize: FontSizes.sm,
    fontWeight: '500',
    marginBottom: Spacing.p8,
  },
  wrapper: {
    position: 'relative',
    minHeight: MinTouchTarget,
    borderColor: Colors.border,
    borderWidth: 1,
    borderRadius: Radii.small,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
  },
  wrapperError: {
    borderColor: Colors.error,
  },
  input: {
    minHeight: MinTouchTarget,
    paddingHorizontal: Spacing.p16,
    paddingRight: 52,
    color: Colors.textPrimary,
    fontSize: FontSizes.base,
    borderWidth: 0,
    backgroundColor: 'transparent',
  },
  iconButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 48,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  errorText: {
    color: Colors.error,
    fontSize: FontSizes.xs,
    marginTop: Spacing.p4,
  },
});
