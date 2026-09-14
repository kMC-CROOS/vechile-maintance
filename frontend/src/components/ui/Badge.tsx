import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Colors, FontSizes, Radii, Spacing } from '@/constants/theme';

interface BadgeProps {
  status: 'overdue' | 'due_soon' | 'upcoming' | 'valid' | 'expired' | 'info';
  label?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, label }) => {
  const getColors = () => {
    switch (status) {
      case 'overdue':
      case 'expired':
        return { bg: '#3B1A24', text: Colors.error, defaultLabel: 'Overdue' };
      case 'due_soon':
        return { bg: '#3D2A14', text: Colors.warning, defaultLabel: 'Due Soon' };
      case 'upcoming':
      case 'valid':
        return { bg: '#10382D', text: Colors.success, defaultLabel: 'Valid' };
      case 'info':
      default:
        return { bg: Colors.surface2, text: Colors.textDim, defaultLabel: 'Info' };
    }
  };

  const config = getColors();

  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.text, { color: config.text }]}>
        {label || config.defaultLabel}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: Spacing.p12,
    paddingVertical: Spacing.p4,
    borderRadius: Radii.small,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
});
