import { DashboardIcon } from './DashboardIcon';
import React from 'react';
import { CARD_GAP } from './dashboardLayout';
import { StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { AnimatedPressableCard } from '@/components/ui/AnimatedPressableCard';
import { useAppTheme } from '@/context/ThemeContext';

interface QuickActionsRowProps {
  onAddService: () => void;
  onAddExpense: () => void;
  onAddDocument: () => void;
}

// Wrench SVG Icon
const WrenchIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"
      stroke="#0F9D7A"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Receipt/Credit Card SVG Icon
const CardIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke="#D97706" strokeWidth="2.2" />
    <Path d="M2 10H22M6 15H10" stroke="#D97706" strokeWidth="2.2" strokeLinecap="round" />
  </Svg>
);

// Document File SVG Icon
const DocIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M14 2H6C4.89543 2 4 2.89543 4 4V20C4 21.1046 4.89543 22 6 22H18C19.1046 22 20 21.1046 20 20V8L14 2Z"
      stroke="#DB2777"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M14 2V8H20M16 13H8M16 17H8M10 9H8" stroke="#DB2777" strokeWidth="2" strokeLinecap="round" />
  </Svg>
);

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({
  onAddService,
  onAddExpense,
  onAddDocument,
}) => {
  const { width } = useWindowDimensions();
  const wide = width >= 600;
  const { theme } = useAppTheme();

  const actions = [
    {
      id: 'service',
      title: 'Add Service',
      subtitle: 'Keep it running',
      icon: <WrenchIcon />,
      iconBg: '#DCFCE7',
      cardBg: '#F0FDF4',
      borderColor: '#BBF7D0',
      onPress: onAddService,
    },
    {
      id: 'expense',
      title: 'Add Expense',
      subtitle: 'Track your costs',
      icon: <CardIcon />,
      iconBg: '#FEF3C7',
      cardBg: '#FFFBEB',
      borderColor: '#FDE68A',
      onPress: onAddExpense,
    },
    {
      id: 'document',
      title: 'Add Document',
      subtitle: 'Keep it organized',
      icon: <DocIcon />,
      iconBg: '#FCE7F3',
      cardBg: '#FDF2F8',
      borderColor: '#FBCFE8',
      onPress: onAddDocument,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((item) => (
        <AnimatedPressableCard
          key={item.id}
          style={[
            styles.actionCard,
            wide && { flexDirection: 'row', gap: 12, paddingHorizontal: 14, minHeight: 100 },
            { backgroundColor: item.cardBg, borderColor: item.borderColor },
          ]}
          onPress={item.onPress}
          scaleTo={0.95}
          accessibilityLabel={item.title}>
          <View style={[styles.iconCircle, { backgroundColor: item.iconBg }]}>
            {item.icon}
          </View>
          <View style={wide ? { flex: 1, minWidth: 0 } : { width: '100%' }}>
          <Text style={[styles.actionTitle, { color: theme.textPrimary }, wide && { fontSize: 16, textAlign: 'left' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.title}
          </Text>
          <Text style={[styles.actionSubtitle, { color: theme.textSecondary }, wide && { fontSize: 12, textAlign: 'left' }]} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>
            {item.subtitle}
          </Text>
          </View>
          {wide ? <DashboardIcon name="chevron" size={16} /> : null}
        </AnimatedPressableCard>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: CARD_GAP,
  },
  actionCard: {
    flex: 1,
    minWidth: 0,
    minHeight: 105,
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
    color: '#101828',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 9,
    fontWeight: '500',
    textAlign: 'center',
    color: '#667085',
  },
});
