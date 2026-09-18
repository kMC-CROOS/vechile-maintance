import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { useAppTheme } from '@/context/ThemeContext';

interface QuickActionsRowProps {
  onAddService: () => void;
  onAddExpense: () => void;
  onAddDocument: () => void;
}

// Wrench SVG Icon
const WrenchIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke="#10B981"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Receipt/Credit Card SVG Icon
const ReceiptIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#F59E0B" strokeWidth="2.2" />
    <Path d="M2 10H22M6 15H10" stroke="#F59E0B" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

// Document File SVG Icon
const DocIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      stroke="#EC4899"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({
  onAddService,
  onAddExpense,
  onAddDocument,
}) => {
  const { isDark, theme } = useAppTheme();

  const actions = [
    {
      id: 'service',
      title: 'Add Service',
      icon: <WrenchIcon />,
      bgColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
      borderColor: isDark ? '#059669' : '#A7F3D0',
      onPress: onAddService,
    },
    {
      id: 'expense',
      title: 'Add Expense',
      icon: <ReceiptIcon />,
      bgColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
      borderColor: isDark ? '#D97706' : '#FDE68A',
      onPress: onAddExpense,
    },
    {
      id: 'document',
      title: 'Add Document',
      icon: <DocIcon />,
      bgColor: isDark ? 'rgba(236, 72, 153, 0.15)' : '#FDF2F8',
      borderColor: isDark ? '#DB2777' : '#FBCFE8',
      onPress: onAddDocument,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((item) => (
        <AnimatedPressableCard
          key={item.id}
          style={styles.actionItem}
          onPress={item.onPress}
          scaleTo={0.92}
          accessibilityLabel={item.title}>
          <View
            style={[
              styles.roundButton,
              { backgroundColor: item.bgColor, borderColor: item.borderColor },
            ]}>
            {item.icon}
          </View>
          <Text style={[styles.actionTitle, { color: theme.textPrimary }]} numberOfLines={1}>
            {item.title}
          </Text>
        </AnimatedPressableCard>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: 90,
  },
  roundButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    marginBottom: 8,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  actionTitle: {
    fontSize: 11.5,
    fontWeight: '600',
    textAlign: 'center',
  },
});
