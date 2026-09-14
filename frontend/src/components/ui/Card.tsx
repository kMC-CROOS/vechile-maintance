import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Colors, Radii, Spacing } from '@/constants/theme';

interface CardProps extends ViewProps {
  variant?: 'card' | 'surface' | 'surface2';
  padding?: number;
  radius?: number;
}

export const Card: React.FC<CardProps> = ({
  style,
  children,
  variant = 'card',
  padding = Spacing.cardPadding,
  radius = Radii.medium,
  ...props
}) => {
  const bg =
    variant === 'surface'
      ? Colors.surface
      : variant === 'surface2'
      ? Colors.surface2
      : Colors.card;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, padding, borderRadius: radius },
        style,
      ]}
      {...props}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderColor: Colors.border,
  },
});
