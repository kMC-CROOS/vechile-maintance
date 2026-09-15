import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableOpacityProps,
} from 'react-native';
import { Colors, FontSizes, MinTouchTarget, Radii, Spacing } from '@/constants/theme';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'danger';
  loading?: boolean;
  size?: 'small' | 'medium' | 'large';
}

export const Button: React.FC<ButtonProps> = ({
  title,
  variant = 'primary',
  loading = false,
  size = 'medium',
  style,
  disabled,
  onPress,
  ...props
}) => {
  const getBgColor = () => {
    if (disabled) return Colors.surface2;
    switch (variant) {
      case 'primary':
        return Colors.primaryBlue;
      case 'secondary':
        return Colors.surface2;
      case 'outline':
        return 'transparent';
      case 'danger':
        return Colors.error;
      default:
        return Colors.primaryBlue;
    }
  };

  const getTextColor = () => {
    if (disabled) return Colors.textFaint;
    switch (variant) {
      case 'outline':
        return Colors.primaryBlue;
      default:
        return Colors.textPrimary;
    }
  };

  const minHeight = size === 'small' ? MinTouchTarget : size === 'large' ? 52 : 48;
  const fontSize = size === 'small' ? FontSizes.sm : size === 'large' ? FontSizes.base : FontSizes.base;

  const handlePress = (e: any) => {
    e?.preventDefault?.();
    e?.stopPropagation?.();
    if (onPress) {
      onPress(e);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.button,
        {
          backgroundColor: getBgColor(),
          borderColor: variant === 'outline' ? Colors.primaryBlue : Colors.border,
          borderWidth: variant === 'outline' ? 1.5 : 0,
          minHeight,
        },
        style,
      ]}
      disabled={disabled || loading}
      activeOpacity={0.7}
      onPress={handlePress}
      {...props}>
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text style={[styles.text, { color: getTextColor(), fontSize }]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: Radii.medium,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.p20,
    minHeight: MinTouchTarget,
  },
  text: {
    fontWeight: '600',
  },
});
