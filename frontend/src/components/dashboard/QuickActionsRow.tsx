import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

interface QuickActionsRowProps {
  onAddService: () => void;
  onAddExpense: () => void;
  onAddTrip: () => void;
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

// Navigation Arrow / Trip SVG Icon
const TripIcon = () => (
  <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 11L21 2L12 20L10 13L3 11Z"
      stroke="#8B5CF6"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
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

export const QuickActionsRow: React.FC<QuickActionsRowProps> = ({
  onAddService,
  onAddExpense,
  onAddTrip,
  onAddDocument,
}) => {
  const actions = [
    {
      id: 'service',
      title: 'Add Service',
      icon: <WrenchIcon />,
      bgColor: '#ECFDF5',
      borderColor: '#A7F3D0',
      onPress: onAddService,
    },
    {
      id: 'expense',
      title: 'Add Expense',
      icon: <ReceiptIcon />,
      bgColor: '#FFFBEB',
      borderColor: '#FDE68A',
      onPress: onAddExpense,
    },
    {
      id: 'trip',
      title: 'Add Trip',
      icon: <TripIcon />,
      bgColor: '#F5F3FF',
      borderColor: '#DDD6FE',
      onPress: onAddTrip,
    },
    {
      id: 'document',
      title: 'Add Document',
      icon: <DocIcon />,
      bgColor: '#FDF2F8',
      borderColor: '#FBCFE8',
      onPress: onAddDocument,
    },
  ];

  return (
    <View style={styles.container}>
      {actions.map((item) => (
        <TouchableOpacity
          key={item.id}
          style={styles.actionItem}
          onPress={item.onPress}
          activeOpacity={0.75}>
          <View
            style={[
              styles.roundButton,
              { backgroundColor: item.bgColor, borderColor: item.borderColor },
            ]}>
            {item.icon}
          </View>
          <Text style={styles.actionTitle} numberOfLines={1}>
            {item.title}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  actionItem: {
    alignItems: 'center',
    width: 74,
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
    color: '#334155',
    textAlign: 'center',
  },
});
