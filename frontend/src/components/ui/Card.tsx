import React from 'react';
import { StyleSheet, View, ViewProps } from 'react-native';
import { Radii, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

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
  const theme = useTheme();

  const bg =
    variant === 'surface'
      ? theme.surface
      : variant === 'surface2'
      ? theme.surface2
      : theme.card;

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: bg, borderColor: theme.border, padding, borderRadius: radius },
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
  },
});
