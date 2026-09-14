import React from 'react';
import { StyleSheet, Text, TextProps } from 'react-native';
import { Colors, Fonts } from '@/constants/theme';

interface MonoTextProps extends TextProps {
  color?: string;
  size?: number;
  weight?: 'normal' | 'bold' | '500' | '600' | '700' | '800';
}

export const MonoText: React.FC<MonoTextProps> = ({
  style,
  color = Colors.textPrimary,
  size = 14,
  weight = 'normal',
  children,
  ...props
}) => {
  return (
    <Text
      style={[
        styles.mono,
        { color, fontSize: size, fontWeight: weight as any },
        style,
      ]}
      {...props}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  mono: {
    fontFamily: Fonts.mono,
  },
});
